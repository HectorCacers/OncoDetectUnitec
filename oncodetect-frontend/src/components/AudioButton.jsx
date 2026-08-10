import { useEffect, useState } from "react";

const sharedAudio = typeof window !== "undefined" ? new Audio() : null;
let activeSrc = null;
const listeners = new Set();
const emit = () => listeners.forEach((fn) => fn());

const stop = () => {
  if (sharedAudio) {
    sharedAudio.pause();
    sharedAudio.currentTime = 0;
  }
  activeSrc = null;
  emit();
};

const play = (src) => {
  if (sharedAudio) {
    sharedAudio.pause();
    sharedAudio.src = src;
    sharedAudio.onended = () => { if (activeSrc === src) stop(); };
    sharedAudio.play().catch(() => stop());
  }
  activeSrc = src;
  emit();
};

const toggle = (src) => {
  if (activeSrc === src) stop();
  else play(src);
};

export default function AudioButton({ src, label = "Escuchar" }) {
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const update = () => setPlaying(activeSrc === src);
    listeners.add(update);
    update();
    return () => listeners.delete(update);
  }, [src]);

  return (
    <button
      type="button"
      className={`audio-btn ${playing ? "playing" : ""}`}
      onClick={(e) => { e.stopPropagation(); toggle(src); }}
      title={label}
      aria-label={label}
    >
      {playing ? "⏸" : "🔊"}
    </button>
  );
}
