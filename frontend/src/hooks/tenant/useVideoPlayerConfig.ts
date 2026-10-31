import { useState, useEffect, useCallback } from 'react';
import { api } from '../../config/axios';

export interface VideoPlayerConfig {
  caption: boolean;
  fastForwarding: boolean;
  videoPlayerFastForward: boolean;
  fullscreen: boolean;
  streaming: boolean;
  volumeCtrl: boolean;
  customizeCaption: boolean;
}

export const useVideoPlayerConfig = (tenantId?: string | null) => {
  const [config, setConfig] = useState<VideoPlayerConfig>({
    caption: true,
    fastForwarding: false,
    videoPlayerFastForward: false,
    fullscreen: true,
    streaming: true,
    volumeCtrl: true,
    customizeCaption: true,
  });
  const [loading, setLoading] = useState(true);

  const fetchConfig = useCallback(async () => {
    try {
      let c: any = null;

      if (tenantId) {
        try {
          const tenantRes = await api.get(`/video-player-configurations/tenant/${tenantId}`);
          c = tenantRes.data?.data || tenantRes.data;
        } catch {
          // If not found for tenant, fallback to default/first config
        }
      }

      if (!c) {
        const res = await api.get('/video-player-configurations');
        if (res.data?.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
          c = res.data.data[0];
        } else if (res.data?.data && !Array.isArray(res.data.data)) {
          c = res.data.data;
        } else if (Array.isArray(res.data) && res.data.length > 0) {
          c = res.data[0];
        }
      }

      if (c) {
        const isFastForward = Boolean(c.videoPlayerFastForward ?? c.fastForwarding ?? c.fast_forward ?? false);
        setConfig({
          caption: c.videoPlayerCaption ?? c.caption ?? true,
          fastForwarding: isFastForward,
          videoPlayerFastForward: isFastForward,
          fullscreen: c.videoPlayerFullscreen ?? c.fullscreen ?? true,
          streaming: c.videoPlayerStreaming ?? c.streaming ?? true,
          volumeCtrl: c.videoPlayerVolumeCtrl ?? c.volumeCtrl ?? true,
          customizeCaption: c.videoPlayerCustomizeCaption ?? c.customizeCaption ?? true,
        });
      }
    } catch (error) {
      console.error('Failed to fetch video player config', error);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    let isMounted = true;
    if (isMounted) fetchConfig();
    return () => { isMounted = false; };
  }, [fetchConfig]);

  return { config, loading, refetch: fetchConfig };
};
