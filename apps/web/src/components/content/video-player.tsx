'use client';

import { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Loader2, VideoOff } from 'lucide-react';
import { cn } from '@/lib/cn';
import { EmptyState } from '@/components/ui/empty-state';

interface VideoPlayerProps {
  videoUrl?: string;
  hlsUrl?: string;
  thumbnailUrl?: string;
  /** Auto-play when mounted */
  autoPlay?: boolean;
  className?: string;
}

function fmtTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export function VideoPlayer({
  videoUrl,
  hlsUrl,
  thumbnailUrl,
  autoPlay = false,
  className,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffering, setBuffering] = useState(false);
  const [error, setError] = useState(false);
  const [started, setStarted] = useState(autoPlay);

  // Prefer HLS on Safari (native support); fall back to MP4 on other browsers
  const isSafari =
    typeof navigator !== 'undefined' &&
    /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  const src = isSafari && hlsUrl ? hlsUrl : (videoUrl ?? hlsUrl);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !started || !src) return;

    const onTimeUpdate = () => setCurrentTime(v.currentTime);
    const onDuration = () => setDuration(v.duration);
    const onPlay = () => { setPlaying(true); setBuffering(false); };
    const onPause = () => setPlaying(false);
    const onWaiting = () => setBuffering(true);
    const onCanPlay = () => setBuffering(false);
    const onError = () => setError(true);

    v.addEventListener('timeupdate', onTimeUpdate);
    v.addEventListener('durationchange', onDuration);
    v.addEventListener('play', onPlay);
    v.addEventListener('pause', onPause);
    v.addEventListener('waiting', onWaiting);
    v.addEventListener('canplay', onCanPlay);
    v.addEventListener('error', onError);

    return () => {
      v.removeEventListener('timeupdate', onTimeUpdate);
      v.removeEventListener('durationchange', onDuration);
      v.removeEventListener('play', onPlay);
      v.removeEventListener('pause', onPause);
      v.removeEventListener('waiting', onWaiting);
      v.removeEventListener('canplay', onCanPlay);
      v.removeEventListener('error', onError);
    };
  }, [started, src]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (!started) { setStarted(true); return; }
    if (v.paused) { void v.play(); } else { v.pause(); }
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const v = videoRef.current;
    if (!v || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    v.currentTime = ((e.clientX - rect.left) / rect.width) * duration;
  };

  if (!src && !thumbnailUrl) {
    return (
      <div className={cn('flex aspect-[9/16] max-h-[480px] items-center justify-center rounded-xl bg-white/5', className)}>
        <EmptyState icon={VideoOff} title="No video available" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-xl bg-black',
        'aspect-[9/16] max-h-[480px] w-full max-w-[270px]',
        className,
      )}
      onClick={togglePlay}
    >
      {/* Video element — only rendered after first play to avoid preloading all queue videos */}
      {started && src && (
        <video
          ref={videoRef}
          src={src}
          poster={thumbnailUrl}
          className="h-full w-full object-cover"
          autoPlay
          playsInline
          muted={muted}
          onError={() => setError(true)}
        />
      )}

      {/* Thumbnail overlay before play */}
      {(!started || !src) && thumbnailUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={thumbnailUrl}
          alt="Video thumbnail"
          className="h-full w-full object-cover"
        />
      )}

      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/80 text-muted">
          <VideoOff className="h-8 w-8" />
          <span className="text-xs">Failed to load video</span>
        </div>
      )}

      {/* Buffering spinner */}
      {buffering && !error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-white/60" />
        </div>
      )}

      {/* Big play button — shown before start and on pause */}
      {(!started || !playing) && !error && !buffering && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-black/60 backdrop-blur-sm transition-transform group-hover:scale-110">
            <Play className="h-6 w-6 translate-x-0.5 text-white" />
          </div>
        </div>
      )}

      {/* Controls bar — shown on hover when playing */}
      {started && !error && (
        <div
          className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Progress bar */}
          <div
            className="mb-2 h-1 cursor-pointer overflow-hidden rounded-full bg-white/20"
            onClick={seek}
          >
            <div
              className="h-full rounded-full bg-accent transition-all"
              style={{ width: duration ? `${(currentTime / duration) * 100}%` : '0%' }}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={togglePlay}
                className="text-white/80 hover:text-white transition-colors"
                aria-label={playing ? 'Pause' : 'Play'}
              >
                {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </button>
              <span className="text-xs text-white/60 tabular-nums">
                {fmtTime(currentTime)} / {fmtTime(duration)}
              </span>
            </div>
            <button
              onClick={toggleMute}
              className="text-white/80 hover:text-white transition-colors"
              aria-label={muted ? 'Unmute' : 'Mute'}
            >
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
