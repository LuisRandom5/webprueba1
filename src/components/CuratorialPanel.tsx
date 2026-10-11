import React from 'react';
import { Volume2, Maximize2, ChevronRight } from 'lucide-react';
import { Artwork } from '../types/museum';

interface CuratorialPanelProps {
  artwork: Artwork;
  proximity: number;
  onOpenDetail: () => void;
  onToggleAudio: () => void;
  isPlayingAudio: boolean;
}

export const CuratorialPanel: React.FC<CuratorialPanelProps> = ({
  artwork,
  proximity,
  onOpenDetail,
  onToggleAudio,
  isPlayingAudio,
}) => {
  // Proximity (focusIntensity) modulates opacity and slide in
  const opacity = Math.min(1, Math.max(0, (proximity - 0.2) / 0.7));

  if (opacity <= 0.05) return null;

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${(1 - opacity) * 16}px)`,
      }}
      className="fixed bottom-6 right-6 z-30 w-[92vw] max-w-md bg-white/95 backdrop-blur-md border border-neutral-200/90 shadow-2xl p-6 text-neutral-900 transition-all duration-300 pointer-events-auto"
    >
      {/* Editorial Header */}
      <div className="border-b border-neutral-150 pb-3 mb-4">
        <span className="text-[11px] font-sans tracking-widest uppercase text-neutral-400">
          {artwork.period} · Sala Oficial
        </span>
        <h2 className="text-xl font-serif font-bold tracking-tight text-neutral-900 mt-0.5">
          {artwork.title}
        </h2>
        <p className="text-sm font-medium text-neutral-600">
          {artwork.artist} <span className="text-neutral-400">·</span> {artwork.year}
        </p>
      </div>

      {/* Metadata Specification */}
      <div className="space-y-1 text-xs text-neutral-500 mb-4 font-sans">
        <div className="flex justify-between">
          <span className="text-neutral-400">Técnica:</span>
          <span className="text-right text-neutral-800 font-medium">{artwork.medium}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-400">Dimensiones:</span>
          <span className="text-right text-neutral-800 font-medium">{artwork.dimensions}</span>
        </div>
      </div>

      {/* Curatorial Prose */}
      <p className="text-xs leading-relaxed text-neutral-700 mb-5 font-sans">
        {artwork.curatorialNotes}
      </p>

      {/* Action Buttons Strip */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-neutral-150 text-xs">
        <button
          onClick={onToggleAudio}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 border transition-all text-xs font-medium tracking-wide uppercase ${
            isPlayingAudio
              ? 'bg-neutral-900 text-white border-neutral-900'
              : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-800 border-neutral-200'
          }`}
        >
          <Volume2 className="w-3.5 h-3.5 shrink-0" />
          <span>{isPlayingAudio ? 'Pausar Narración' : 'Escuchar Audioguía'}</span>
        </button>

        <button
          onClick={onOpenDetail}
          className="flex items-center justify-center gap-2 py-2.5 px-3 bg-neutral-900 hover:bg-neutral-800 text-white border border-neutral-900 transition-colors text-xs font-semibold tracking-wide uppercase shadow-xs"
        >
          <Maximize2 className="w-3.5 h-3.5 shrink-0" />
          <span>Examinar Lienzo</span>
        </button>
      </div>

      {/* Scroll indicator prompt */}
      <div className="mt-3.5 pt-2 text-[11px] text-neutral-400 flex items-center justify-between border-t border-neutral-100 font-sans">
        <span>Sigue haciendo scroll para avanzar a la siguiente obra</span>
        <ChevronRight className="w-3.5 h-3.5 text-neutral-500 animate-pulse" />
      </div>
    </div>
  );
};
