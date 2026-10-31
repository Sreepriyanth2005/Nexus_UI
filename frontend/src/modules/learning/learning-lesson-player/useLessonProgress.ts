import { useRef, useEffect, useCallback, useState } from 'react';
import { progressApi } from '../../../core/api/progress/progress.api';

interface UseLessonProgressProps {
  lessonId: string;
  courseId: string;
  onProgressUpdate?: (percentage: number, lastWatchedPosition: number) => void;
  onCompleted?: () => void;
}

export const useLessonProgress = ({
  lessonId,
  courseId,
  onProgressUpdate,
  onCompleted,
}: UseLessonProgressProps) => {
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [highestPercentage, setHighestPercentage] = useState<number>(0);
  const highestPercentageRef = useRef(0);
  const lastSyncTimeRef = useRef(0);

  // Debounce sync to backend to avoid spamming the API
  const syncProgressToBackend = useCallback(
    (percentage: number, currentTime: number) => {
      const now = Date.now();
      // Sync at most every 5 seconds or if it's a significant jump
      if (now - lastSyncTimeRef.current > 5000) {
        lastSyncTimeRef.current = now;
        
        const payload = { lessonId, courseId, progress: percentage, lastWatchedPosition: currentTime };

        if (!isOnline) {
          console.log(`[Offline Mode] Queuing Progress: Lesson ${lessonId}, Progress: ${percentage.toFixed(2)}%`);
          const queue = JSON.parse(localStorage.getItem('lessonProgressQueue') || '[]');
          queue.push({ ...payload, timestamp: now });
          localStorage.setItem('lessonProgressQueue', JSON.stringify(queue));
          return; // Stop here if offline
        }

        console.log(`[API CALL] Syncing Progress: Lesson ${lessonId}, Progress: ${percentage.toFixed(2)}%, Position: ${currentTime}s`);
        
        progressApi.updateLessonProgress(lessonId, {
          courseId,
          progress: percentage,
          lastPositionSec: currentTime,
          totalSeconds: 0, // Optionally set if available
          status: 'IN_PROGRESS'
        }).catch(err => console.error("Failed to sync progress", err));

        if (onProgressUpdate) {
          onProgressUpdate(percentage, currentTime);
        }

        // 90% Completion Rule Enforcement
        if (percentage >= 90 && highestPercentageRef.current < 90) {
          console.log(`[API CALL] Marking Lesson ${lessonId} as Complete (>= 90% watched)`);
          
          progressApi.completeLesson(lessonId).catch(err => console.error("Failed to complete lesson", err));
          if (onCompleted) {
            onCompleted();
          }
        }
      }
    },
    [lessonId, courseId, onProgressUpdate, onCompleted, isOnline]
  );

  // Handle Online/Offline Status and Queue Flushing
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      console.log('[Network] Connection Restored');
      // Flush Queue
      const queue = JSON.parse(localStorage.getItem('lessonProgressQueue') || '[]');
      if (queue.length > 0) {
        console.log(`[Network] Flushing ${queue.length} queued progress updates...`);
        // We only care about the latest progress for a given lesson
        const latestProgressMap = new Map();
        queue.forEach((item: any) => latestProgressMap.set(`${item.courseId}-${item.lessonId}`, item));
        
        latestProgressMap.forEach((item: any) => {
           console.log(`[API CALL] Synced Offline Progress: Lesson ${item.lessonId}, Progress: ${item.progress}%`);
           progressApi.updateLessonProgress(item.lessonId, {
             courseId: item.courseId,
             progress: item.progress,
             lastPositionSec: item.lastWatchedPosition,
             totalSeconds: 0,
             status: item.progress >= 90 ? 'COMPLETED' : 'IN_PROGRESS'
           }).catch(e => console.error("Offline sync failed", e));
        });
        localStorage.removeItem('lessonProgressQueue');
      }
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      console.log('[Network] Connection Lost - Switching to Offline Mode');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleTimeUpdate = useCallback(
    (currentTime: number, duration: number) => {
      if (duration === 0) return;
      
      const percentage = (currentTime / duration) * 100;
      
      // Only track forward progress for the "highest percentage watched" 
      // (This prevents users from skipping back and losing their 90% completion status)
      if (percentage > highestPercentageRef.current) {
        highestPercentageRef.current = percentage;
        setHighestPercentage(percentage);
      }

      syncProgressToBackend(highestPercentageRef.current, currentTime);
    },
    [syncProgressToBackend]
  );

  return {
    handleTimeUpdate,
    highestPercentage,
    getHighestPercentage: () => highestPercentageRef.current,
    isOnline,
  };
};

export default useLessonProgress;
