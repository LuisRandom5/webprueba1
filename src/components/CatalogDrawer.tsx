import React from 'react';
import { X, Sparkles, Eye, ArrowRight } from 'lucide-react';
import { Artwork } from '../types/museum';
import { renderArtworkToCanvas } from '../utils/proceduralArt';

interface CatalogDrawerProps {
  artworks: Artwork[];
  isOpen: boolean;
  onClose: () => void;
  onSelectArtwork: (artwork: Artwork) => void;
  onJumpToArtwork3D: (artwork: Artwork) => void;
  onOpenAR: (artwork: Artwork) => void;
}

export const CatalogDrawer: React.FC<CatalogDrawerProps> = ({
  artworks,
  isOpen,
  onClose,
  onSelectArtwork,
  onJumpToArtwork3D,
  onOpenAR,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-neutral-950/60 backdrop-blur-xs animate-fadeIn select-none">
      <div className="w-full max-w-xl bg-white text-neutral-900 h-full flex flex-col shadow-2xl border-l border-neutral-200 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-neutral-200 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-sans tracking-widest uppercase text-neutral-400">
              Colección Permanente
            </span>
            <h2 className="text-xl font-serif font-bold text-neutral-900 mt-0.5">
              Catálogo de Obras
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-900 transition-colors"
            aria-label="Cerrar catálogo"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Artworks List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {artworks.map((art, idx) => {
            const previewCanvas = renderArtworkToCanvas(art.id, 240, 320);
            const previewUrl = previewCanvas.toDataURL();

            return (
              <div
                key={art.id}
                className="group p-4 border border-neutral-200 hover:border-neutral-900 transition-all bg-neutral-50/50 hover:bg-white flex gap-5 items-start"
              >
                {/* Thumbnail */}
                <div
                  onClick={() => onSelectArtwork(art)}
                  className="w-24 h-32 shrink-0 bg-neutral-900 border-2 border-neutral-900 cursor-pointer overflow-hidden shadow-sm group-hover:shadow-md transition-shadow"
                >
                  <img
                    src={previewUrl}
                    alt={art.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                {/* Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-400 uppercase">
                    <span>Sala 0{idx + 1}</span>
                    <span>·</span>
                    <span>{art.period}</span>
                  </div>

                  <h3
                    onClick={() => onSelectArtwork(art)}
                    className="font-serif font-bold text-base text-neutral-900 cursor-pointer hover:underline mt-0.5"
                  >
                    {art.title}
                  </h3>

                  <p className="text-xs text-neutral-600 font-medium">
                    {art.artist} <span className="text-neutral-400">({art.year})</span>
                  </p>

                  <p className="text-xs text-neutral-500 mt-2 line-clamp-2 font-sans">
                    {art.summary}
                  </p>

                  {/* Actions */}
                  <div className="flex items-center gap-3 mt-3 pt-2 border-t border-neutral-200/60 text-xs">
                    <button
                      onClick={() => {
                        onJumpToArtwork3D(art);
                        onClose();
                      }}
                      className="flex items-center gap-1 font-semibold text-neutral-900 hover:text-amber-800 transition-colors"
                    >
                      <span>Ir en el pasillo 3D</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => {
                        onOpenAR(art);
                        onClose();
                      }}
                      className="flex items-center gap-1 text-neutral-600 hover:text-black transition-colors"
                    >
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>AR</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 bg-neutral-50 border-t border-neutral-200 text-center text-xs text-neutral-500">
          Museo Blanco · Arquitectura Minimalista y Curaduría Lumínica
        </div>
      </div>
    </div>
  );
};
