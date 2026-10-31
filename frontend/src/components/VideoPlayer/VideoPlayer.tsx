import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import '@vidstack/react/player/styles/base.css';
import '@vidstack/react/player/styles/default/theme.css';
import '@vidstack/react/player/styles/default/layouts/video.css';
import {
  MediaPlayer,
  MediaProvider,
  Track,
  SeekButton,
  type MediaPlayerInstance,
  type MediaTimeUpdateEvent,
  type MediaSeekRequestEvent,
  type MediaTimeUpdateEventDetail
} from '@vidstack/react';
import { FastForward } from '../../assets/icons';
import { defaultLayoutIcons, DefaultVideoLayout } from '@vidstack/react/player/layouts/default';
import { useProfileStore } from '../../store/profile.store';
import { useVideoPlayerConfig } from '../../hooks/tenant/useVideoPlayerConfig';
import { useAuthStore } from '../../core/auth/auth.store';
import { useUserStore } from '../../store/user.store';
import { api } from '../../config/axios';
import { db } from '../../core/integrations/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { progressApi } from '../../core/api/progress/progress.api';
import './VideoPlayer.css';

export interface VideoPlayerProps {
  src?: string | { src: string; type?: string };
  poster?: string;
  title?: string;
  tracks?: { src: string; label: string; language: string; kind: string; default?: boolean }[];
  lessonId?: string;
  courseId?: string;
  careerPathId?: string;
  lastAccessedPosition?: number;
  blockFastForward?: boolean; // Fast-Forward Restriction Handling
  videoPlayerFastForward?: boolean; // Fast-Forward capability from VideoPlayerConfiguration
  onReady?: (player: MediaPlayerInstance) => void;
  onPlay?: () => void;
  onPause?: () => void;
  onProgress?: (currentTime: number, duration: number) => void;
  onSeeking?: (currentTime: number, duration: number, player?: any) => void;
  onEnded?: () => void;
  onError?: (error: any) => void;
  onCompleted?: () => void; // For 90% Completion Rule
  isAlreadyCompleted?: boolean; // Prevent sync if already completed
  disableSync?: boolean; // Completely disables progress saving and network sync (e.g. unenrolled preview)
  className?: string;
  options?: any; // To maintain compatibility if needed
}

const getStoredAccessToken = () => {
  const fromUserStore = useUserStore.getState().accessToken;
  const fromAuthStore = useAuthStore.getState().accessToken;

  if (fromUserStore) return fromUserStore;
  if (fromAuthStore) return fromAuthStore;

  try {
    const savedUser = localStorage.getItem('keycloak_session_user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      return parsed.accessToken || null;
    }
  } catch { }

  try {
    const savedAuth = localStorage.getItem('keycloak_session_auth');
    if (savedAuth) {
      const parsed = JSON.parse(savedAuth);
      return parsed.accessToken || null;
    }
  } catch { }

  return null;
};

export interface VideoSourceInfo {
  isEmbed: boolean;
  embedUrl?: string;
  originalUrl?: string;
  provider?: "google-drive" | "youtube" | "vimeo" | "loom" | "generic-embed" | "direct";
  vidstackSrc?: string | { src: string; type: string };
}

export const resolveVideoSource = (rawSrc?: string | { src: string; type?: string }): VideoSourceInfo => {
  if (!rawSrc) {
    return { isEmbed: false };
  }

  let url = typeof rawSrc === "string" ? rawSrc.trim() : (rawSrc.src ? String(rawSrc.src).trim() : "");
  if (!url) {
    return { isEmbed: false };
  }

  // If user pasted an entire <iframe>...</iframe> tag, extract the src attribute
  if (url.toLowerCase().startsWith("<iframe") || url.includes("<iframe")) {
    const iframeSrcMatch = url.match(/src=["']([^"']+)["']/i);
    if (iframeSrcMatch && iframeSrcMatch[1]) {
      url = iframeSrcMatch[1];
    }
  }

  // 1. Google Drive (file/d/..., open?id=..., uc?id=...)
  const gDriveMatch = url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?id=)([a-zA-Z0-9_-]+)/i);
  if (gDriveMatch && gDriveMatch[1]) {
    const fileId = gDriveMatch[1];
    return {
      isEmbed: true,
      originalUrl: url,
      provider: "google-drive",
      embedUrl: `https://drive.google.com/file/d/${fileId}/preview`,
    };
  }

  // 2. Loom (loom.com/share/..., loom.com/embed/...)
  const loomMatch = url.match(/loom\.com\/(?:share|embed)\/([a-zA-Z0-9_-]+)/i);
  if (loomMatch && loomMatch[1]) {
    const loomId = loomMatch[1];
    return {
      isEmbed: true,
      originalUrl: url,
      provider: "loom",
      embedUrl: `https://www.loom.com/embed/${loomId}?hide_owner=true&hide_share=true`,
    };
  }

  // 3. YouTube (youtube.com, youtu.be, youtube-nocookie.com)
  const ytMatch = url.match(/(?:youtube(?:-nocookie)?\.com\/(?:watch\?.*v=|embed\/|shorts\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i);
  if (ytMatch && ytMatch[1]) {
    const videoId = ytMatch[1];
    return {
      isEmbed: true,
      originalUrl: url,
      provider: "youtube",
      embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&enablejsapi=1&rel=0`,
    };
  }

  // 4. Vimeo (vimeo.com/..., player.vimeo.com/video/...)
  const vimeoMatch = url.match(/(?:vimeo\.com\/(?:video\/)?|player\.vimeo\.com\/video\/)(\d+)/i);
  if (vimeoMatch && vimeoMatch[1]) {
    const vimeoId = vimeoMatch[1];
    return {
      isEmbed: true,
      originalUrl: url,
      provider: "vimeo",
      embedUrl: `https://player.vimeo.com/video/${vimeoId}?autoplay=1`,
    };
  }

  // 5. Already an embed URL (e.g. /embed/, /preview, player.)
  if (url.includes("/embed/") || url.includes("/preview") || url.includes("player.")) {
    return {
      isEmbed: true,
      originalUrl: url,
      provider: "generic-embed",
      embedUrl: url,
    };
  }

  // 6. Direct video files or streams (Vidstack)
  const clean = url.split("?")[0].toLowerCase();
  let type = "video/mp4";
  if (clean.endsWith(".m3u8")) type = "application/x-mpegURL";
  else if (clean.endsWith(".mpd")) type = "application/dash+xml";
  else if (clean.endsWith(".webm")) type = "video/webm";
  else if (clean.endsWith(".ogg")) type = "video/ogg";

  return {
    isEmbed: false,
    originalUrl: url,
    provider: "direct",
    vidstackSrc: { src: url, type },
  };
};

export const inferVideoType = (source: string): string => {
  const cleanSource = source.split("?")[0].toLowerCase();
  if (cleanSource.endsWith(".m3u8")) return "application/x-mpegURL";
  if (cleanSource.endsWith(".webm")) return "video/webm";
  if (cleanSource.endsWith(".ogg")) return "video/ogg";
  return "video/mp4";
};

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  poster,
  title,
  tracks = [],
  lessonId,
  courseId,
  careerPathId,
  lastAccessedPosition = 0,
  blockFastForward,
  videoPlayerFastForward,
  onReady,
  onPlay,
  onPause,
  onProgress,
  onSeeking,
  onEnded,
  onError,
  onCompleted,
  isAlreadyCompleted = false,
  disableSync = false,
  className = '',
  options,
}) => {
  const playerRef = useRef<MediaPlayerInstance>(null);

  // Use refs instead of state for frequently changing values
  const maxTimeWatchedRef = useRef(lastAccessedPosition);
  const timeSpentSecsRef = useRef(0);
  const hasCompletedRef = useRef(false);
  const hasSeekedRef = useRef(false);
  const playStartRef = useRef<number | null>(null); // Watch-time logic
  const sessionIdRef = useRef(`sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`);
  const hasSyncPermissionRef = useRef(true);
  const [showSettings, setShowSettings] = useState(false);
  const [captionFontSize, setCaptionFontSize] = useState(() => localStorage.getItem('caption_font_size') || '18px');
  const [captionColor, setCaptionColor] = useState(() => localStorage.getItem('caption_color') || '#ffffff');
  const [captionBg, setCaptionBg] = useState(() => localStorage.getItem('caption_bg') || 'rgba(0, 0, 0, 0.75)');

  const saveCaptionSetting = (key: string, value: string, setter: (val: string) => void) => {
    localStorage.setItem(key, value);
    setter(value);
  };

  // Callback refs to avoid stale closures
  const callbacksRef = useRef({
    onProgress,
    onCompleted,
    onReady,
    onPlay,
    onPause,
    onSeeking,
    onEnded,
    onError
  });

  useEffect(() => {
    callbacksRef.current = {
      onProgress,
      onCompleted,
      onReady,
      onPlay,
      onPause,
      onSeeking,
      onEnded,
      onError
    };
  });

  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const watchIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const profile = useProfileStore((state) => state.profile);
  const { config: videoConfig } = useVideoPlayerConfig(profile?.tenantId);

  // Check if fast forward is enabled based on prop or db VideoPlayerConfiguration
  const isFastForwardActive =
    videoPlayerFastForward !== undefined
      ? videoPlayerFastForward
      : Boolean(videoConfig?.videoPlayerFastForward ?? videoConfig?.fastForwarding);

  // Fast-forward restriction is only applied if fast-forward is NOT allowed
  const shouldBlockFastForward =
    blockFastForward !== undefined
      ? (blockFastForward && !isFastForwardActive)
      : !isFastForwardActive;

  // Resolved source handling both embeds (Google Drive, YouTube, Vimeo, Loom) and direct video files
  const resolvedSource = useMemo(() => {
    const raw = src || options?.sources?.[0];
    return resolveVideoSource(raw);
  }, [src, options?.sources]);

  const videoSource = useMemo(() => {
    if (resolvedSource.isEmbed) return undefined;
    return resolvedSource.vidstackSrc;
  }, [resolvedSource]);

  const isValidTrackUrl = (url: any) => {
    if (!url || typeof url !== 'string') return false;
    const trimmed = url.trim();
    return trimmed.length > 0;
  };

  const videoTracks = (tracks.length > 0 ? tracks : (options?.tracks || [])).filter(
    (track: any) => track?.src && isValidTrackUrl(track.src)
  );
  const videoPoster = poster || options?.poster || '';

  // Reset logic when source changes (Source update protection)
  useEffect(() => {
    hasSeekedRef.current = false;
    maxTimeWatchedRef.current = lastAccessedPosition;
    timeSpentSecsRef.current = 0;
    playStartRef.current = null;
    hasCompletedRef.current = false;
    sessionIdRef.current = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }, [videoSource, lessonId, lastAccessedPosition]);

  // Proper LMS progress payload formatting
  const getEventPayload = useCallback((eventType: string, overrideTime?: number) => {
    const player = playerRef.current;
    const currentTime = overrideTime !== undefined ? overrideTime : (player?.currentTime || 0);
    const duration = player?.duration || 1;
    const percentComplete = duration > 0 ? Math.round((currentTime / duration) * 100) : 0;

    // Simulate deviceId or retrieve it
    const deviceId = localStorage.getItem('deviceId') || 'web-player';

    return {
      lessonId,
      courseId,
      careerPathId,
      sessionId: sessionIdRef.current,
      eventType,
      currentTime,
      // Video.js backwards compatibility fields:
      lastPositionSecs: currentTime,
      percentComplete,
      deviceId,
      isPaused: player?.state?.paused ?? true,
      maxTimeWatched: maxTimeWatchedRef.current,
      timeSpentSecs: timeSpentSecsRef.current,
      totalDuration: duration,
      timestamp: Date.now()
    };
  }, [lessonId, courseId, careerPathId]);

  const sendEvent = useCallback(async (eventType: string, overrideTime?: number) => {
    if (disableSync || !lessonId || !courseId || !hasSyncPermissionRef.current || isAlreadyCompleted) return;

    const payload = getEventPayload(eventType, overrideTime);

    // Prevent overriding database with 0 during initial load before resume-seek
    if (!hasSeekedRef.current && payload.currentTime < 1 && maxTimeWatchedRef.current > 1) {
      return;
    }

    if (!navigator.onLine) {
      const queuedStr = localStorage.getItem('offlineVideoEvents');
      const queued = queuedStr ? JSON.parse(queuedStr) : [];
      queued.push({ eventType, payload });
      localStorage.setItem('offlineVideoEvents', JSON.stringify(queued));
      return;
    }

    try {
      let status = 'IN_PROGRESS';
      if (eventType === 'completed' || payload.percentComplete >= 90) {
        status = 'COMPLETED';
      }

      await progressApi.updateLessonProgress(lessonId, {
        courseId,
        careerPathId,
        progress: payload.percentComplete,
        lastPositionSec: Math.floor(payload.currentTime),
        totalSeconds: Math.floor(payload.totalDuration),
        status: status as any
      });
    } catch (error: any) {
      if (error?.response?.status === 403 || error?.response?.status === 401) {
        console.warn('Sync disabled due to permission restrictions (403/401)');
        hasSyncPermissionRef.current = false;
        return;
      }
      console.error('Failed to sync video event to backend:', error);
      const queuedStr = localStorage.getItem('offlineVideoEvents');
      const queued = queuedStr ? JSON.parse(queuedStr) : [];
      queued.push({ eventType, payload });
      localStorage.setItem('offlineVideoEvents', JSON.stringify(queued));
    }
  }, [lessonId, courseId, careerPathId, getEventPayload]);

  // Save on browser close (beforeunload)
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (disableSync || !lessonId || !courseId || isAlreadyCompleted) return;

      // Calculate any final watch time before closing
      if (playStartRef.current !== null) {
        const elapsed = Math.floor((Date.now() - playStartRef.current) / 1000);
        timeSpentSecsRef.current += elapsed;
        playStartRef.current = Date.now(); // Reset just in case it doesn't actually unload
      }

      const payload = getEventPayload('unload');
      const token = getStoredAccessToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      const baseUrl = import.meta.env.VITE_API_URL || '';
      fetch(`${baseUrl}/api/v1/progress/lesson-progress/${lessonId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          courseId,
          careerPathId,
          progress: payload.percentComplete,
          lastPositionSec: Math.floor(payload.currentTime),
          totalSeconds: Math.floor(payload.totalDuration),
          status: 'IN_PROGRESS'
        }),
        keepalive: true
      });
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [lessonId, courseId, careerPathId, getEventPayload]);

  // Save on unmount
  useEffect(() => {
    return () => {
      if (lessonId && courseId) {
        if (playStartRef.current !== null) {
          const elapsed = Math.floor((Date.now() - playStartRef.current) / 1000);
          timeSpentSecsRef.current += elapsed;
        }
        sendEvent('unmount');
      }
    };
  }, [lessonId, courseId, sendEvent]);

  useEffect(() => {
    if (disableSync || isAlreadyCompleted) return;
    const handleOnline = async () => {
      const queuedStr = localStorage.getItem('offlineVideoEvents');
      if (queuedStr) {
        const queued = JSON.parse(queuedStr);
        if (queued.length > 0) {
          try {
            for (const item of queued) {
              const { eventType, payload } = item;
              let status = 'IN_PROGRESS';
              if (eventType === 'completed' || payload.percentComplete >= 90) {
                status = 'COMPLETED';
              }

              await progressApi.updateLessonProgress(payload.lessonId, {
                courseId: payload.courseId,
                careerPathId: payload.careerPathId,
                progress: payload.percentComplete,
                lastPositionSec: Math.floor(payload.currentTime),
                totalSeconds: Math.floor(payload.totalDuration),
                status: status as any
              });
            }
            localStorage.removeItem('offlineVideoEvents');
          } catch (e) {
            console.error('Failed to sync offline queue', e);
          }
        }
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  // Realtime Firestore sync for video progress is now handled globally via useRealtimeSync
  // which invalidates React Query caches on backend Prisma changes. The player will get
  // accurate lastPositionSec upon mounting via progressApi.getLessonSync.

  const [accurateLastPosition, setAccurateLastPosition] = useState(lastAccessedPosition);

  // Fetch from the backend GET sync endpoint on mount
  useEffect(() => {
    let isMounted = true;
    const fetchSync = async () => {
      if (disableSync || !lessonId) return;
      try {
        const res = await progressApi.getLessonSync(lessonId);
        if (isMounted && res?.data?.lastPositionSec !== undefined) {
          setAccurateLastPosition(res.data.lastPositionSec);
          maxTimeWatchedRef.current = Math.max(maxTimeWatchedRef.current, res.data.lastPositionSec);
        }
      } catch (e) {
        console.error('Failed to fetch accurate sync progress', e);
      }
    };
    fetchSync();
    return () => { isMounted = false; };
  }, [lessonId]);

  useEffect(() => {
    setAccurateLastPosition(prev => Math.max(prev, lastAccessedPosition));
  }, [lastAccessedPosition]);

  // Ready-state verification & Resume retry logic (Video.js flow)
  // loadedmetadata -> loadeddata -> seek(accurateLastPosition) -> wait seeked -> mark hasSeeked=true
  const handleLoadedData = useCallback(() => {
    const player = playerRef.current;
    if (player && accurateLastPosition > 0 && !hasSeekedRef.current) {
      let retries = 0;
      const attemptSeek = () => {
        try {
          // Check if player has loaded metadata and can play
          if (player.state.canPlay) {
            player.currentTime = accurateLastPosition;
            // hasSeekedRef is marked true in onSeeked
          } else if (retries < 3) {
            retries++;
            setTimeout(attemptSeek, 500);
          }
        } catch (e) {
          if (retries < 3) {
            retries++;
            setTimeout(attemptSeek, 500);
          }
        }
      };
      attemptSeek();
    }
  }, [accurateLastPosition]);

  const handleSeeked = useCallback(() => {
    if (!hasSeekedRef.current && accurateLastPosition > 0) {
      hasSeekedRef.current = true;
      maxTimeWatchedRef.current = Math.max(maxTimeWatchedRef.current, accurateLastPosition);
    }
  }, [accurateLastPosition]);

  useEffect(() => {
    // Session tracking and periodic sync
    syncIntervalRef.current = setInterval(() => {
      if (playerRef.current && !playerRef.current.state.paused) {
        sendEvent('timeupdate');
      }
    }, 60000); // 60 seconds interval

    return () => {
      if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
    };
  }, [sendEvent]);

  function onTimeUpdate(detail: MediaTimeUpdateEventDetail) {
    const currentTime = detail.currentTime;
    const duration = playerRef.current?.duration || 0;

    // Prevent progress overwrite with 0 (e.g., initial load burst before resume finishes)
    if (currentTime < 0.5 && maxTimeWatchedRef.current > 1) {
      return;
    }

    if (currentTime > maxTimeWatchedRef.current) {
      maxTimeWatchedRef.current = currentTime;
    }

    if (!hasCompletedRef.current && duration > 0 && maxTimeWatchedRef.current >= duration * 0.9) {
      hasCompletedRef.current = true;
      if (callbacksRef.current.onCompleted) callbacksRef.current.onCompleted();
      sendEvent('completed', currentTime);
    }

    if (callbacksRef.current.onProgress) callbacksRef.current.onProgress(currentTime, duration);
  }

  function onSeekRequest(arg1: any, arg2?: any) {
    const event = arg2 || arg1;
    const requestedTime = typeof arg1 === 'number' ? arg1 : (arg1?.detail ?? 0);

    if (!disableSync && shouldBlockFastForward && requestedTime > maxTimeWatchedRef.current + 1) {
      if (event?.preventDefault) event.preventDefault();
      if (playerRef.current) {
        playerRef.current.currentTime = maxTimeWatchedRef.current;
      }
    } else {
      if (callbacksRef.current.onSeeking && playerRef.current) {
        callbacksRef.current.onSeeking(requestedTime, playerRef.current.duration, playerRef.current);
      }
      sendEvent('seek', requestedTime);
    }
  }

  if (resolvedSource.isEmbed && resolvedSource.embedUrl) {
    const rawExternalUrl = resolvedSource.originalUrl || resolvedSource.embedUrl;
    return (
      <div
        className={`w-full rounded-xl overflow-hidden shadow-lg bg-black relative group/player aspect-video flex items-center justify-center ${className}`}
      >
        <iframe
          src={resolvedSource.embedUrl}
          title={title || "Video Player"}
          className="w-full h-full border-0 min-h-[350px]"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
        />

        {rawExternalUrl && (
          <div className="absolute top-3 right-3 z-30 opacity-0 group-hover/player:opacity-100 transition-opacity duration-200 pointer-events-auto">
            <a
              href={rawExternalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-black/80 hover:bg-black/95 backdrop-blur-md text-white/90 hover:text-white text-xs font-medium rounded-lg border border-white/20 shadow-xl transition-all"
              title={resolvedSource.provider === "google-drive" ? "Open in Google Drive" : "Open in new tab"}
            >
              <span>{resolvedSource.provider === "google-drive" ? "Open in Drive" : "Open original"}</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        )}
      </div>
    );
  }

  if (!videoSource && !resolvedSource.isEmbed) {
    return (
      <div
        className={`w-full rounded-xl overflow-hidden shadow-lg bg-gray-900 border border-white/10 aspect-video flex flex-col items-center justify-center text-gray-400 p-6 ${className}`}
      >
        <p className="text-sm font-medium">No playable video source available.</p>
      </div>
    );
  }

  const hideClasses = [
    !videoConfig.fullscreen ? 'hide-fullscreen' : '',
    !videoConfig.volumeCtrl ? 'hide-volume' : '',
    !videoConfig.caption ? 'hide-caption' : '',
    !isFastForwardActive ? 'hide-fastforward' : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      className={`w-full rounded-xl overflow-hidden shadow-lg bg-black relative group/player ${hideClasses} ${className}`}
      style={{
        '--custom-caption-font-size': captionFontSize,
        '--custom-caption-color': captionColor,
        '--custom-caption-bg': captionBg,
      } as React.CSSProperties}
    >
      {/* Floating Caption Customizer Settings Icon */}
      <div className="absolute top-4 right-4 z-50">
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="bg-black/50 hover:bg-black/80 backdrop-blur-sm text-white p-2 rounded-full transition-all border border-white/10 shadow-lg"
          title="Subtitle Settings"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>

        {showSettings && (
          <div className="absolute right-0 mt-2 w-60 bg-gray-950/95 backdrop-blur-md text-white p-3.5 rounded-xl border border-white/10 shadow-2xl space-y-3.5 text-xs font-semibold select-none">
            <div className="flex justify-between items-center border-b border-white/10 pb-2">
              <span className="font-bold text-[10px] tracking-wider uppercase text-gray-400 font-mono">Subtitle Settings</span>
              <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-white">&times;</button>
            </div>

            {/* Font Size Selection */}
            <div className="space-y-1.5">
              <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider font-mono">Font Size</label>
              <div className="grid grid-cols-4 gap-1 bg-white/5 p-1 rounded-lg">
                {[
                  { label: 'S', val: '14px' },
                  { label: 'M', val: '18px' },
                  { label: 'L', val: '24px' },
                  { label: 'XL', val: '30px' }
                ].map(opt => (
                  <button
                    key={opt.val}
                    onClick={() => saveCaptionSetting('caption_font_size', opt.val, setCaptionFontSize)}
                    className={`py-1 text-[10px] text-center rounded transition-all ${captionFontSize === opt.val ? 'bg-white text-gray-900 font-bold shadow-sm' : 'hover:bg-white/10 text-white'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Text Color Selection */}
            <div className="space-y-1.5">
              <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider font-mono">Text Color</label>
              <div className="grid grid-cols-4 gap-1 bg-white/5 p-1 rounded-lg">
                {[
                  { label: 'White', val: '#ffffff', bg: '#ffffff' },
                  { label: 'Yellow', val: '#ffff00', bg: '#ffff00' },
                  { label: 'Green', val: '#00ff00', bg: '#00ff00' },
                  { label: 'Cyan', val: '#00ffff', bg: '#00ffff' }
                ].map(opt => (
                  <button
                    key={opt.val}
                    onClick={() => saveCaptionSetting('caption_color', opt.val, setCaptionColor)}
                    className={`py-1 rounded flex justify-center items-center transition-all ${captionColor === opt.val ? 'ring-2 ring-blue-500 shadow-sm' : 'hover:bg-white/10'}`}
                    title={opt.label}
                  >
                    <span className="w-3.5 h-3.5 rounded-full border border-black/30" style={{ backgroundColor: opt.bg }} />
                  </button>
                ))}
              </div>
            </div>

            {/* Background Color Selection */}
            <div className="space-y-1.5">
              <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider font-mono">Background</label>
              <div className="grid grid-cols-4 gap-1 bg-white/5 p-1 rounded-lg">
                {[
                  { label: 'Dark', val: 'rgba(0, 0, 0, 0.75)' },
                  { label: 'None', val: 'rgba(0, 0, 0, 0)' },
                  { label: 'Slate', val: 'rgba(30, 41, 59, 0.85)' },
                  { label: 'Red', val: 'rgba(239, 68, 68, 0.75)' }
                ].map(opt => (
                  <button
                    key={opt.val}
                    onClick={() => saveCaptionSetting('caption_bg', opt.val, setCaptionBg)}
                    className={`py-1 text-[9px] text-center rounded truncate transition-all ${captionBg === opt.val ? 'bg-white text-gray-900 font-bold shadow-sm' : 'hover:bg-white/10 text-white'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <MediaPlayer
        ref={playerRef}
        src={videoSource as any}
        title={title}
        aspectRatio={options?.aspectRatio?.replace(':', '/') || "16/9"}
        poster={videoPoster}
        onCanPlay={() => {
          if (callbacksRef.current.onReady && playerRef.current) callbacksRef.current.onReady(playerRef.current);
        }}
        onLoadedData={handleLoadedData}
        onSeeked={handleSeeked}
        onPlay={() => {
          playStartRef.current = Date.now();
          sendEvent('play');
          if (callbacksRef.current.onPlay) callbacksRef.current.onPlay();
        }}
        onPause={() => {
          if (playStartRef.current !== null) {
            const elapsed = Math.floor((Date.now() - playStartRef.current) / 1000);
            timeSpentSecsRef.current += elapsed;
            playStartRef.current = null;
          }
          sendEvent('pause');
          if (callbacksRef.current.onPause) callbacksRef.current.onPause();
        }}
        onEnded={() => {
          if (playStartRef.current !== null) {
            const elapsed = Math.floor((Date.now() - playStartRef.current) / 1000);
            timeSpentSecsRef.current += elapsed;
            playStartRef.current = null;
          }
          sendEvent('ended');
          if (callbacksRef.current.onEnded) callbacksRef.current.onEnded();
        }}
        onError={(e) => {
          if (callbacksRef.current.onError) callbacksRef.current.onError(e);
        }}
        onTimeUpdate={onTimeUpdate}
        onMediaSeekRequest={onSeekRequest}
        fullscreenOrientation="none"
        crossOrigin={videoTracks.length > 0 ? "anonymous" : undefined}
      >
        <MediaProvider>
          {videoTracks.map((track: any, i: number) => {
            // Determine type to properly support SRT and VTT
            const type = track.type || (track.src?.toLowerCase().includes('.vtt') ? 'vtt' : 'srt');
            return (
              <Track
                key={`${track.src}-${track.language || track.srclang || 'en'}-${i}`}
                src={track.src}
                kind={(track.kind || 'subtitles') as any}
                label={track.label}
                language={track.language || track.srclang || 'en'}
                default={track.default}
                type={type as any}
              />
            );
          })}
        </MediaProvider>
        <DefaultVideoLayout
          icons={defaultLayoutIcons}
          slots={{
            afterPlayButton: isFastForwardActive ? (
              <SeekButton
                seconds={10}
                className="vds-button"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
                aria-label="Seek forward 10 seconds"
                title="Fast forward 10s"
              >
                <FastForward className="vds-icon" />
              </SeekButton>
            ) : null,
          }}
        />
      </MediaPlayer>
    </div>
  );
};

export default VideoPlayer;
