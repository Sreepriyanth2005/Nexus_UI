import React, { useState } from 'react';
import VideoPlayer from '../../../components/VideoPlayer/VideoPlayer';
import { useLessonProgress } from './useLessonProgress';

interface LearningLessonPlayerProps {
  lessonId: string;
  courseId: string;
  title: string;
  videoUrl: string;
  posterUrl?: string;
  onNextLesson?: () => void;
}

export const LearningLessonPlayer: React.FC<LearningLessonPlayerProps> = ({
  lessonId,
  courseId,
  title,
  videoUrl,
  posterUrl,
  onNextLesson,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);

  const { handleTimeUpdate, isOnline, highestPercentage } = useLessonProgress({
    lessonId,
    courseId,
    onCompleted: () => {
      setIsCompleted(true);
    },
  });

  const videoJsOptions = {
    autoplay: false,
    controls: true,
    responsive: true,
    fluid: true,
    playbackRates: [0.5, 1, 1.25, 1.5, 2],
    poster: posterUrl,
    sources: [
      {
        src: videoUrl,
        type: videoUrl.endsWith('.m3u8') ? 'application/x-mpegURL' : 'video/mp4',
      },
    ],
  };

  return (
    <div className="flex flex-col w-full bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
          {title}
          {!isOnline && (
            <span className="bg-orange-100 text-orange-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ml-2">
              Offline Mode
            </span>
          )}
        </h2>
        {isCompleted && (
          <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full border border-green-400">
            Completed
          </span>
        )}
      </div>

      {/* Error Banner */}
      {videoError && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 w-full">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                Playback Error: {videoError}. Please check your network connection and try refreshing.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Video Player Container */}
      <div className="w-full relative bg-black aspect-video">
        <VideoPlayer
          options={videoJsOptions}
          onPlay={() => {
            setIsPlaying(true);
            setVideoError(null);
          }}
          onPause={() => setIsPlaying(false)}
          onProgress={handleTimeUpdate}
          onSeeking={(currentTime: number, duration: number, player: any) => {
            // Fast-Forward Restriction Logic
            const maxAllowedTime = (highestPercentage / 100) * duration;
            // Allow a 1-second buffer to prevent jittery snaps
            if (currentTime > maxAllowedTime + 1) {
              player.currentTime(maxAllowedTime);
            }
          }}
          onError={(err: any) => {
            setIsPlaying(false);
            setVideoError(err?.message || 'An unknown error occurred while playing the video');
          }}
          onEnded={() => {
            setIsPlaying(false);
            if (isCompleted && onNextLesson) {
              // Optionally auto-advance
              // onNextLesson();
            }
          }}
        />
      </div>

      {/* Actions / Info */}
      <div className="p-4 flex justify-between items-center bg-gray-50">
        <div className="text-sm text-gray-500">
          {isPlaying ? 'Now Playing' : 'Paused'}
        </div>
        
        {isCompleted && onNextLesson && (
          <button
            onClick={onNextLesson}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md shadow transition-colors"
          >
            Continue to Next Lesson
          </button>
        )}
      </div>
    </div>
  );
};

export default LearningLessonPlayer;
