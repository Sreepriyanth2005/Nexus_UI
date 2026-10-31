/**
 * Utility to automatically detect/calculate media duration in seconds from
 * URLs (YouTube, Vimeo, Google Drive, direct MP4/WebM/Audio) or File objects.
 */

import { api } from "../config/axios";

// Helper to load YouTube IFrame API script once
let isYouTubeScriptLoaded = false;
let ytReadyPromise: Promise<void> | null = null;

function loadYouTubeIframeApi(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if ((window as any).YT && (window as any).YT.Player) {
    return Promise.resolve();
  }

  if (ytReadyPromise) return ytReadyPromise;

  ytReadyPromise = new Promise((resolve) => {
    const existingCallback = (window as any).onYouTubeIframeAPIReady;
    (window as any).onYouTubeIframeAPIReady = () => {
      if (typeof existingCallback === "function") {
        try {
          existingCallback();
        } catch { }
      }
      resolve();
    };

    if (!isYouTubeScriptLoaded) {
      const existingTag = document.getElementById("yt-iframe-api-script");
      if (!existingTag) {
        const tag = document.createElement("script");
        tag.id = "yt-iframe-api-script";
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);
      }
      isYouTubeScriptLoaded = true;
    }
  });

  return ytReadyPromise;
}

async function getYouTubeDuration(videoId: string): Promise<number | null> {
  // 1. Direct Innertube API probe from client
  try {
    const res = await fetch("https://www.youtube.com/youtubei/v1/player", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        videoId,
        context: {
          client: {
            clientName: "ANDROID",
            clientVersion: "19.00.00",
            androidSdkVersion: 30,
          },
        },
      }),
      signal: AbortSignal.timeout(4000),
    });
    if (res.ok) {
      const data = await res.json();
      const lenSecs = data?.videoDetails?.lengthSeconds;
      if (lenSecs) {
        const secs = parseInt(lenSecs, 10);
        if (!isNaN(secs) && secs > 0) return secs;
      }
    }
  } catch {}

  // 2. IFrame API Player probe
  return new Promise((resolve) => {
    let resolved = false;
    let checkInterval: any = null;
    let player: any = null;
    let container: HTMLDivElement | null = null;

    const cleanup = () => {
      if (checkInterval) {
        clearInterval(checkInterval);
        checkInterval = null;
      }
      try {
        if (player && typeof player.destroy === "function") {
          player.destroy();
        }
      } catch {}
      try {
        container?.remove();
      } catch {}
      player = null;
      container = null;
    };

    const finish = (dur: number | null) => {
      if (!resolved) {
        resolved = true;
        cleanup();
        resolve(dur);
      }
    };

    const timer = setTimeout(() => finish(null), 5000);

    loadYouTubeIframeApi()
      .then(() => {
        try {
          container = document.createElement("div");
          container.style.position = "fixed";
          container.style.bottom = "0";
          container.style.right = "0";
          container.style.width = "200px";
          container.style.height = "200px";
          container.style.opacity = "0.001";
          container.style.pointerEvents = "none";
          container.style.zIndex = "-999";
          document.body.appendChild(container);

          player = new (window as any).YT.Player(container, {
            videoId,
            playerVars: {
              autoplay: 1,
              controls: 0,
              disablekb: 1,
              fs: 0,
              rel: 0,
              mute: 1,
              playsinline: 1,
            },
            events: {
              onReady: () => {
                try {
                  player.mute();
                  const immediate = player.getDuration();
                  if (typeof immediate === "number" && immediate > 0) {
                    clearTimeout(timer);
                    finish(immediate);
                    return;
                  }
                  player.playVideo();
                } catch {}

                checkInterval = setInterval(() => {
                  try {
                    const dur = player?.getDuration();
                    if (typeof dur === "number" && dur > 0) {
                      clearTimeout(timer);
                      finish(dur);
                    }
                  } catch {
                    finish(null);
                  }
                }, 150);
              },
              onStateChange: () => {
                try {
                  const dur = player?.getDuration();
                  if (typeof dur === "number" && dur > 0) {
                    clearTimeout(timer);
                    finish(dur);
                  }
                } catch {}
              },
              onError: () => {
                clearTimeout(timer);
                finish(null);
              },
            },
          });
        } catch {
          clearTimeout(timer);
          finish(null);
        }
      })
      .catch(() => {
        clearTimeout(timer);
        finish(null);
      });
  });
}

/**
 * Detect media duration in seconds from a URL string or File object.
 * Returns duration in seconds (e.g. 184) or null if unable to detect.
 */
export async function detectMediaDuration(
  source: string | File | null | undefined
): Promise<number | null> {
  if (!source) return null;

  // 1. If File object
  if (source instanceof File) {
    return new Promise((resolve) => {
      const isAudio = source.type.startsWith("audio/");
      const media = isAudio
        ? document.createElement("audio")
        : document.createElement("video");

      media.preload = "metadata";

      const objectUrl = URL.createObjectURL(source);
      const timer = setTimeout(() => {
        URL.revokeObjectURL(objectUrl);
        resolve(null);
      }, 6000);

      media.onloadedmetadata = () => {
        clearTimeout(timer);
        URL.revokeObjectURL(objectUrl);
        if (
          media.duration &&
          !isNaN(media.duration) &&
          isFinite(media.duration) &&
          media.duration > 0
        ) {
          resolve(media.duration);
        } else {
          resolve(null);
        }
      };

      media.onerror = () => {
        clearTimeout(timer);
        URL.revokeObjectURL(objectUrl);
        resolve(null);
      };

      media.src = objectUrl;
    });
  }

  // 2. If URL string
  if (typeof source === "string") {
    let url = source.trim();
    if (!url) return null;

    // Handle pasted iframe tags
    if (url.toLowerCase().startsWith("<iframe") || url.includes("<iframe")) {
      const match = url.match(/src=["']([^"']+)["']/i);
      if (match && match[1]) url = match[1];
    }

    // 2a. Primary attempt: backend video processing API endpoint (bypasses client-side CORS and iframe restrictions)
    try {
      const apiRes = await api.post("/lessons/detect-media-duration", { url });
      const sec = apiRes.data?.data?.durationSeconds;
      if (typeof sec === "number" && sec > 0) {
        return sec;
      }
    } catch {
      // Fall through to client-side detection fallbacks
    }

    // 2b. YouTube client-side probe fallback
    const ytMatch = url.match(
      /(?:youtube(?:-nocookie)?\.com\/(?:watch\?.*v=|embed\/|shorts\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i
    );
    if (ytMatch && ytMatch[1]) {
      const duration = await getYouTubeDuration(ytMatch[1]);
      if (duration !== null && duration > 0) return duration;
    }

    // 2c. Vimeo (public oEmbed returns duration in seconds)
    const vimeoMatch = url.match(
      /(?:vimeo\.com\/(?:video\/|channels\/[^\/]+\/|groups\/[^\/]+\/videos\/)?|player\.vimeo\.com\/video\/)(\d+)/i
    );
    if (vimeoMatch && vimeoMatch[1]) {
      try {
        const res = await fetch(
          `https://vimeo.com/api/oembed.json?url=https://vimeo.com/${vimeoMatch[1]}`
        );
        if (res.ok) {
          const data = await res.json();
          if (typeof data.duration === "number" && data.duration > 0) {
            return Math.round(data.duration);
          }
        }
      } catch {
        // Fall through to standard probe
      }
    } else if (url.includes("vimeo.com")) {
      try {
        const res = await fetch(
          `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`
        );
        if (res.ok) {
          const data = await res.json();
          if (typeof data.duration === "number" && data.duration > 0) {
            return Math.round(data.duration);
          }
        }
      } catch {}
    }

    // 2d. Loom oEmbed
    if (url.includes("loom.com")) {
      try {
        const res = await fetch(`https://www.loom.com/v1/oembed?url=${encodeURIComponent(url)}`);
        if (res.ok) {
          const data = await res.json();
          if (typeof data.duration === "number" && data.duration > 0) {
            return Math.round(data.duration);
          }
        }
      } catch {}
    }

    // 2e. Wistia oEmbed
    if (url.includes("wistia.com") || url.includes("wi.st")) {
      try {
        const res = await fetch(`https://fast.wistia.net/oembed?url=${encodeURIComponent(url)}`);
        if (res.ok) {
          const data = await res.json();
          if (typeof data.duration === "number" && data.duration > 0) {
            return Math.round(data.duration);
          }
        }
      } catch {}
    }

    // 2c. Google Drive or Direct Video/Audio URL
    let probeUrl = url;
    const gDriveMatch = url.match(
      /drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?id=)([a-zA-Z0-9_-]+)/i
    );
    if (gDriveMatch && gDriveMatch[1]) {
      probeUrl = `https://drive.google.com/uc?export=download&id=${gDriveMatch[1]}`;
    }

    return new Promise((resolve) => {
      let resolved = false;
      let timer: any = null;
      let video: HTMLVideoElement | null = null;
      let audio: HTMLAudioElement | null = null;

      const cleanup = () => {
        if (timer) {
          clearTimeout(timer);
          timer = null;
        }
        if (video) {
          video.onloadedmetadata = null;
          video.onerror = null;
          video.src = "";
          try {
            video.load();
          } catch {}
          video = null;
        }
        if (audio) {
          audio.onloadedmetadata = null;
          audio.onerror = null;
          audio.src = "";
          try {
            audio.load();
          } catch {}
          audio = null;
        }
      };

      const finish = (dur: number | null) => {
        if (!resolved) {
          resolved = true;
          cleanup();
          resolve(dur);
        }
      };

      // 6-second timeout fallback to prevent UI thread blocking on restricted/CORS URLs
      timer = setTimeout(() => finish(null), 6000);

      try {
        video = document.createElement("video");
        video.preload = "metadata";
        video.muted = true;
        video.playsInline = true;

        video.onloadedmetadata = () => {
          if (
            video &&
            video.duration &&
            !isNaN(video.duration) &&
            isFinite(video.duration) &&
            video.duration > 0
          ) {
            finish(video.duration);
          } else {
            finish(null);
          }
        };

        video.onerror = () => {
          // If video tag fails (e.g. audio stream or CORS issue), try audio tag with remaining time
          try {
            if (video) {
              video.onloadedmetadata = null;
              video.onerror = null;
              video.src = "";
            }
            audio = document.createElement("audio");
            audio.preload = "metadata";
            audio.onloadedmetadata = () => {
              if (
                audio &&
                audio.duration &&
                !isNaN(audio.duration) &&
                isFinite(audio.duration) &&
                audio.duration > 0
              ) {
                finish(audio.duration);
              } else {
                finish(null);
              }
            };
            audio.onerror = () => {
              finish(null);
            };
            audio.src = probeUrl;
          } catch {
            finish(null);
          }
        };

        video.src = probeUrl;
      } catch {
        finish(null);
      }
    });
  }

  return null;
}

/**
 * Format duration in seconds into integer minutes (ceiling, min 1).
 */
export function formatDurationToMinutes(durationSecs: number): number {
  if (!durationSecs || isNaN(durationSecs) || durationSecs <= 0) return 0;
  return Math.ceil(durationSecs / 60) || 1;
}

/**
 * Extract clean, human-readable display file name from asset metadata or URL.
 * - Strips internal UUID prefixes (e.g. `9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d-filename.ext`)
 * - Strips query parameters and URL tokens
 * - Decodes URL encoding (%20 -> space)
 * - Avoids displaying raw internal IDs or generic placeholders
 */
export function getDisplayFileName(fileNameOrUrl?: string, fallback = ""): string {
  if (!fileNameOrUrl || typeof fileNameOrUrl !== "string") return fallback;
  let clean = fileNameOrUrl.trim();
  if (!clean) return fallback;
  // Strip URL query parameters and hashes
  clean = clean.split("?")[0].split("#")[0];
  // Extract file basename
  clean = clean.split("/").pop() || clean;
  // Strip UUID prefix if present (e.g. 8-4-4-4-12 hex chars followed by - or _)
  clean = clean.replace(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}[-_]?/, "");
  try {
    clean = decodeURIComponent(clean);
  } catch {
    // ignore
  }
  // If the result looks like a pure UUID or ID, return fallback
  if (/^[0-9a-fA-F-]{24,}$/.test(clean)) {
    return fallback;
  }
  return clean || fallback;
}

/**
 * Formats duration in minutes into a clean, human-readable display string:
 * - If < 60 mins: "X mins" (e.g., "10 mins", "4 mins")
 * - If >= 60 mins with no remaining minutes: "X hrs" (e.g., "1 hr", "2 hrs")
 * - If >= 60 mins with remaining minutes: "X hrs Y mins" (e.g., "1 hr 30 mins")
 */
export function formatMinutesToDisplay(mins?: number | null): string {
  if (mins === undefined || mins === null || isNaN(mins) || mins <= 0) return "";
  const totalMins = Math.round(mins);
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  if (h === 0) {
    return `${m} min${m === 1 ? "" : "s"}`;
  }
  if (m === 0) {
    return `${h} hr${h === 1 ? "" : "s"}`;
  }
  return `${h} hr${h === 1 ? "" : "s"} ${m} min${m === 1 ? "" : "s"}`;
}

