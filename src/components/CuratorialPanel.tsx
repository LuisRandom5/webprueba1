import React from 'react';
import { Volume2, Maximize2, Sparkles, X, ChevronRight } from 'lucide-react';
import { Artwork } from '../types/museum';

interface CuratorialPanelProps {
  artwork: Artwork;
  proximity: number;
  onOpenDetail: () => void;
  onOpenAR: () => void;
  onToggleAudio: () => void;
  isPlayingAudio: boolean;
  onClose?: () => void;
}

export const CuratorialPanel: React.FC<CuratorialPanelProps> = ({
  artwork,
  proximity,
  onOpenDetail,
  onOpenAR,
  onToggleAudio,
  isPlayingAudio,
  onClose,
}) => {
  // Proximity modulates opacity and slide up
  const opacity = Math.min(1, Math.max(0, (proximity - 0.15) / 0.7));

  if (opacity <= 0.05) return null;

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${(1 - opacity) * 20}px)`,
      }}
      className="fixed bottom-6 right-6 z-30 w-[92vw] max-w-md bg-white/95 backdrop-blur-md border border-neutral-200/90 shadow-2xl rounded-none p-6 text-neutral-900 transition-all duration-300"
    >
      {/* Editorial Header */}
      <div className="flex items-start justify-between border-b border-neutral-150 pb-3 mb-4">
        <div>
          <span className="text-[11px] font-sans tracking-widest uppercase text-neutral-400">
            {artwork.period}
          </span>
          <h2 className="text-xl font-serif font-semibold tracking-tight text-neutral-900 mt-0.5">
            {artwork.title}
          </h2>
          <p className="text-sm font-medium text-neutral-600">
            {artwork.artist} <span className="text-neutral-400">·</span> {artwork.year}
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Cerrar cédula"
            className="p-1 text-neutral-400 hover:text-neutral-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
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
      <p className="text-xs leading-relaxed text-neutral-700 line-clamp-3 mb-5 font-sans">
        {artwork.curatorialNotes}
      </p>

      {/* Action Buttons Strip */}
      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-neutral-150 text-xs">
        <button
          onClick={onToggleAudio}
          className={`flex items-center justify-center gap-1.5 py-2.5 px-2 border transition-all text-[11px] font-medium tracking-wide uppercase ${
            isPlayingAudio
              ? 'bg-neutral-900 text-white border-neutral-900'
              : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-800 border-neutral-200'
          }`}
        >
          <Volume2 className="w-3.5 h-3.5 shrink-0" />
          <span>{isPlayingAudio ? 'Pausar' : 'Audioguía'}</span>
        </button>

        <button
          onClick={onOpenDetail}
          className="flex items-center justify-center gap-1.5 py-2.5 px-2 bg-neutral-50 hover:bg-neutral-100 text-neutral-800 border border-neutral-200 transition-colors text-[11px] font-medium tracking-wide uppercase"
        >
          <Maximize2 className="w-3.5 h-3.5 shrink-0" />
          <span>Detalle</span>
        </button>

        <button
          onClick={onOpenAR}
          className="flex items-center justify-center gap-1.5 py-2.5 px-2 bg-neutral-900 hover:bg-neutral-800 text-white border border-neutral-900 transition-colors text-[11px] font-semibold tracking-wide uppercase shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 shrink-0 text-amber-300" />
          <span>Ver en AR</span>
        </button>
      </div>

      {/* Proximity Tip */}
      <div className="mt-3 pt-2 text-[10px] text-neutral-400 flex items-center justify-between">
        <span>Gira la vista o haz click para enfocar</span>
        <button
          onClick={onOpenDetail}
          className="text-neutral-900 hover:underline flex items-center gap-0.5"
        >
          <span>Ficha completa</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
