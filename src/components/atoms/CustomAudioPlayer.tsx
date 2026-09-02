"use client";

import { useRef, useState } from "react";

interface CustomAudioPlayerProps {
  src: string;
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function CustomAudioPlayer({ src }: CustomAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      void audio.play();
    } else {
      audio.pause();
    }
  }

  // MediaRecorder-produced webm files often report duration as Infinity until
  // the browser is forced to recompute it — the seek-to-a-huge-timestamp trick
  // is the standard workaround (seen widely for Chrome specifically).
  function handleLoadedMetadata() {
    const audio = audioRef.current;
    if (!audio) return;

    if (!Number.isFinite(audio.duration)) {
      audio.currentTime = 1e101;
      const onTimeUpdate = () => {
        audio.removeEventListener("timeupdate", onTimeUpdate);
        audio.currentTime = 0;
        setDuration(audio.duration);
      };
      audio.addEventListener("timeupdate", onTimeUpdate);
    } else {
      setDuration(audio.duration);
    }
  }

  function handleSeek(e: React.ChangeEvent<HTMLInputElement>) {
    const audio = audioRef.current;
    if (!audio) return;
    const time = Number(e.target.value);
    audio.currentTime = time;
    setCurrentTime(time);
  }

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex items-center gap-3 rounded-lg border border-[var(--slate-700)] bg-[var(--slate-950)] px-3 py-2">
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        className="hidden"
      />

      <button
        type="button"
        onClick={togglePlay}
        aria-label={isPlaying ? "Pause" : "Lecture"}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--blue-600)] text-white transition-colors hover:bg-[var(--blue-500)]"
      >
        {isPlaying ? (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
            <rect x="6" y="5" width="4" height="14" rx="1" />
            <rect x="14" y="5" width="4" height="14" rx="1" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5 h-4 w-4">
            <path d="M6 4.5v15l13-7.5-13-7.5z" />
          </svg>
        )}
      </button>

      <span className="w-10 shrink-0 text-right text-xs tabular-nums text-[var(--slate-400)]">
        {formatTime(currentTime)}
      </span>

      <input
        type="range"
        min={0}
        max={duration || 0}
        step={0.01}
        value={currentTime}
        onChange={handleSeek}
        aria-label="Progression de la lecture"
        className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full accent-[var(--blue-500)]"
        style={{
          background: `linear-gradient(to right, var(--blue-500) ${progressPct}%, var(--slate-700) ${progressPct}%)`,
        }}
      />

      <span className="w-10 shrink-0 text-xs tabular-nums text-[var(--slate-400)]">
        {formatTime(duration)}
      </span>
    </div>
  );
}
