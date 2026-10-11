import React, { useEffect, useState, useRef } from 'react';
import { Volume2, VolumeX, Play, Pause, SkipForward, X } from 'lucide-react';
import { Artwork } from '../types/museum';

interface AudioGuidePlayerProps {
  artwork: Artwork | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AudioGuidePlayer: React.FC<AudioGuidePlayerProps> = ({
  artwork,
  isOpen,
  onClose,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }

    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // When artwork changes or opens, prepare narration
  useEffect(() => {
    if (!artwork || !isOpen) {
      stopAudio();
      return;
    }

    startAudio();
  }, [artwork?.id, isOpen]);

  const startAudio = () => {
    if (!artwork || !synthRef.current) return;
    synthRef.current.cancel();

    const textToSpeak = `${artwork.title}, obra de ${artwork.artist}, realizada en ${artwork.year}. ${artwork.audioGuideTranscript}`;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = 'es-ES';
    utterance.rate = 0.95;
    utterance.pitch = 0.98;

    // Pick Spanish voice if available
    const voices = synthRef.current.getVoices();
    const esVoice = voices.find((v) => v.lang.startsWith('es'));
    if (esVoice) utterance.voice = esVoice;

    utterance.onstart = () => {
      setIsPlaying(true);
      setProgress(0);
      startTimer();
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setProgress(100);
      stopTimer();
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      stopTimer();
    };

    utteranceRef.current = utterance;
    synthRef.current.speak(utterance);
  };

  const startTimer = () => {
    stopTimer();
    const durationEstimate = 22; // approx seconds
    const start = Date.now();
    timerRef.current = window.setInterval(() => {
      const elapsed = (Date.now() - start) / 1000;
      const pct = Math.min(98, (elapsed / durationEstimate) * 100);
      setProgress(pct);
    }, 250);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const togglePlay = () => {
    if (!synthRef.current) return;
    if (isPlaying) {
      synthRef.current.pause();
      setIsPlaying(false);
      stopTimer();
    } else {
      if (synthRef.current.paused) {
        synthRef.current.resume();
        setIsPlaying(true);
        startTimer();
      } else {
        startAudio();
      }
    }
  };

  const stopAudio = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    setIsPlaying(false);
    setProgress(0);
    stopTimer();
  };

  if (!isOpen || !artwork) return null;

  return (
    <div className="fixed bottom-6 left-6 z-40 w-[90vw] max-w-sm bg-neutral-900/95 backdrop-blur-md text-white p-5 border border-neutral-700/80 shadow-2xl">
      <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <span className="text-[10px] tracking-widest uppercase font-semibold text-amber-400">
            Audioguía Oficial
          </span>
          <span className="text-neutral-500">·</span>
          <span className="text-xs text-neutral-300 font-mono">Sala I</span>
        </div>
        <button
          onClick={onClose}
          className="text-neutral-400 hover:text-white transition-colors p-1"
          aria-label="Cerrar audioguía"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-3">
        <h4 className="font-serif text-sm font-semibold truncate text-white">
          {artwork.title}
        </h4>
        <p className="text-xs text-neutral-400 truncate mt-0.5">{artwork.artist}</p>
      </div>

      {/* Animated Waveform Visualizer */}
      <div className="my-4 flex items-center justify-between gap-1 h-8 px-2 bg-neutral-950/70 border border-neutral-800">
        {Array.from({ length: 28 }).map((_, i) => {
          const height = isPlaying
            ? Math.max(15, (Math.sin(i * 0.4 + Date.now() * 0.005) * 0.5 + 0.5) * 100)
            : 20;
          return (
            <div
              key={i}
              style={{ height: `${height}%` }}
              className={`w-1 transition-all duration-150 ${
                isPlaying ? 'bg-amber-400' : 'bg-neutral-600'
              }`}
            />
          );
        })}
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-neutral-800 h-1 mb-4 overflow-hidden">
        <div
          className="bg-amber-400 h-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between pt-1">
        <button
          onClick={() => setIsMuted(!isMuted)}
          className="p-2 text-neutral-400 hover:text-white transition-colors"
          aria-label="Silenciar"
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        <button
          onClick={togglePlay}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-white text-neutral-950 hover:bg-neutral-200 transition-colors shadow-lg"
          aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
        >
          {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
        </button>

        <button
          onClick={startAudio}
          className="p-2 text-neutral-400 hover:text-white transition-colors"
          aria-label="Reiniciar narración"
        >
          <SkipForward className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
