/**
 * Media player component for audio and video files
 */
"use client";

import React, { useRef, useState } from "react";

interface MediaPlayerProps {
  fileUrl: string;
  fileName: string;
  fileType: string;
  duration?: number;
}

export const MediaPlayer: React.FC<MediaPlayerProps> = ({
  fileUrl,
  fileName,
  fileType,
  duration,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration || 0);
  const mediaRef = useRef<HTMLAudioElement | HTMLVideoElement>(null);

  const isAudio = [".mp3", ".wav", ".m4a", ".ogg", ".flac"].includes(fileType);
  const isVideo = [".mp4", ".avi", ".mov", ".webm", ".mkv"].includes(fileType);

  const handlePlayPause = () => {
    if (mediaRef.current) {
      if (isPlaying) {
        mediaRef.current.pause();
      } else {
        mediaRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (mediaRef.current) {
      setCurrentTime(mediaRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (mediaRef.current) {
      setTotalDuration(mediaRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (mediaRef.current) {
      mediaRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  if (!isAudio && !isVideo) {
    return null;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      <h3 className="text-lg font-semibold mb-4 text-gray-900">
        {isAudio ? "🎵 Audio Player" : "🎬 Video Player"}
      </h3>

      {isVideo ? (
        <div className="mb-4 rounded-lg overflow-hidden bg-black">
          <video
            ref={mediaRef as React.RefObject<HTMLVideoElement>}
            src={fileUrl}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            className="w-full max-h-96 object-contain"
            controls
          >
            Your browser does not support the video tag.
          </video>
        </div>
      ) : (
        <>
          {/* Audio Visualization */}
          <div className="mb-4 p-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg flex items-center justify-center">
            <div className="flex space-x-2 items-end h-16">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className={`w-1 bg-gradient-to-t from-blue-500 to-purple-500 rounded-full transition-all duration-150 ${
                    isPlaying ? "animate-pulse" : ""
                  }`}
                  style={{
                    height: `${20 + Math.random() * 60}%`,
                    animationDelay: `${i * 0.1}s`,
                  }}
                />
              ))}
            </div>
          </div>

          <audio
            ref={mediaRef as React.RefObject<HTMLAudioElement>}
            src={fileUrl}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            className="hidden"
          >
            Your browser does not support the audio tag.
          </audio>

          {/* Custom Controls for Audio */}
          <div className="space-y-4">
            {/* Progress Bar */}
            <div className="space-y-2">
              <input
                type="range"
                min="0"
                max={totalDuration || 100}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-sm text-gray-600">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(totalDuration)}</span>
              </div>
            </div>

            {/* Play/Pause Button */}
            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={handlePlayPause}
                className="w-14 h-14 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-all hover:scale-105 active:scale-95"
              >
                {isPlaying ? (
                  <svg
                    className="w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  </svg>
                ) : (
                  <svg
                    className="w-6 h-6 ml-1"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </>
      )}

      {/* File Info */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-sm text-gray-600 truncate">
          <span className="font-medium">File:</span> {fileName}
        </p>
      </div>
    </div>
  );
};
