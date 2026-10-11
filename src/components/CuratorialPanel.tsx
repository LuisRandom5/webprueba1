import React from 'react';
import { Artwork } from '../types/museum';

interface CuratorialPanelProps {
  artwork: Artwork;
  proximity: number;
}

export const CuratorialPanel: React.FC<CuratorialPanelProps> = ({
  artwork,
  proximity,
}) => {
  // Proximity (focusIntensity) modulates opacity
  const opacity = Math.min(1, Math.max(0, (proximity - 0.25) / 0.65));

  if (opacity <= 0.02) return null;

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${(1 - opacity) * 12}px)`,
      }}
      className="fixed bottom-10 right-8 md:right-14 z-30 max-w-sm text-neutral-900 pointer-events-none select-none transition-opacity duration-300"
    >
      {/* Cédula de pared minimalista */}
      <div className="bg-white/90 backdrop-blur-xs p-6 shadow-sm border-l-2 border-neutral-900">
        <span className="text-[10px] tracking-widest uppercase text-neutral-400 font-sans block mb-1">
          {artwork.period}
        </span>

        <h2 className="text-lg font-serif font-bold text-neutral-900 leading-tight">
          {artwork.title}
        </h2>

        <p className="text-xs text-neutral-600 font-medium mt-1">
          {artwork.artist} <span className="text-neutral-400">·</span> {artwork.year}
        </p>

        <div className="text-[11px] text-neutral-500 font-sans mt-3 space-y-0.5 border-t border-neutral-150 pt-2.5">
          <p>{artwork.medium}</p>
          <p>{artwork.dimensions}</p>
        </div>

        <p className="text-xs text-neutral-700 font-sans leading-relaxed mt-3.5 line-clamp-4">
          {artwork.curatorialNotes}
        </p>
      </div>
    </div>
  );
};
