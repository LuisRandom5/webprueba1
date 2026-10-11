import React, { useState, useEffect, useRef } from 'react';
import { X, ZoomIn, Sparkles, ChevronLeft, ChevronRight, Share2, Info } from 'lucide-react';
import { Artwork } from '../types/museum';
import { renderArtworkToCanvas } from '../utils/proceduralArt';

interface ArtworkDetailModalProps {
  artwork: Artwork | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectArtwork: (artwork: Artwork) => void;
  allArtworks: Artwork[];
  onOpenAR: () => void;
}

export const ArtworkDetailModal: React.FC<ArtworkDetailModalProps> = ({
  artwork,
  isOpen,
  onClose,
  onSelectArtwork,
  allArtworks,
  onOpenAR,
}) => {
  const [zoomPos, setZoomPos] = useState({ x: 0.5, y: 0.5 });
  const [isHovering, setIsHovering] = useState(false);
  const [canvasDataUrl, setCanvasDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const imgContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!artwork || !isOpen) return;
    // Generate high-resolution preview canvas
    const canvas = renderArtworkToCanvas(artwork.id, 1400, 1800);
    setCanvasDataUrl(canvas.toDataURL('image/jpeg', 0.95));
  }, [artwork?.id, isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, artwork]);

  if (!isOpen || !artwork) return null;

  const currentIndex = allArtworks.findIndex((a) => a.id === artwork.id);
  const handlePrev = () => {
    const prevIdx = (currentIndex - 1 + allArtworks.length) % allArtworks.length;
    onSelectArtwork(allArtworks[prevIdx]);
  };
  const handleNext = () => {
    const nextIdx = (currentIndex + 1) % allArtworks.length;
    onSelectArtwork(allArtworks[nextIdx]);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imgContainerRef.current) return;
    const rect = imgContainerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    setZoomPos({ x, y });
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/90 backdrop-blur-md p-4 md:p-8 animate-fadeIn">
      {/* Top action bar */}
      <div className="absolute top-4 left-6 right-6 flex items-center justify-between text-white/80 z-20">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono tracking-widest text-neutral-400 uppercase">
            Sala {currentIndex + 1} de {allArtworks.length}
          </span>
          <span className="text-neutral-600">/</span>
          <span className="text-xs font-serif tracking-wider text-neutral-200">
            {artwork.period}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="p-2 text-neutral-300 hover:text-white transition-colors text-xs flex items-center gap-1.5"
            title="Compartir obra"
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">{copiedLink ? 'Copiado' : 'Compartir'}</span>
          </button>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white transition-colors"
            aria-label="Cerrar modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="relative w-full max-w-6xl max-h-[88vh] bg-white text-neutral-900 shadow-2xl overflow-y-auto lg:overflow-hidden grid grid-cols-1 lg:grid-cols-12 border border-neutral-200 mt-8">
        {/* Left Column: Artwork Canvas & Zoom Loupe */}
        <div className="lg:col-span-7 bg-[#f6f6f6] p-6 lg:p-12 flex flex-col items-center justify-center relative min-h-[420px] select-none border-b lg:border-b-0 lg:border-r border-neutral-200">
          {/* Navigation Arrows */}
          <button
            onClick={handlePrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 bg-white/80 hover:bg-white text-neutral-800 shadow-md transition-all z-10"
            aria-label="Obra anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-white/80 hover:bg-white text-neutral-800 shadow-md transition-all z-10"
            aria-label="Siguiente obra"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Interactive Artwork Frame with Magnifier */}
          <div
            ref={imgContainerRef}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            onMouseMove={handleMouseMove}
            className="relative cursor-crosshair group shadow-2xl max-w-md max-h-[58vh] overflow-hidden border-8 border-neutral-900 bg-neutral-900"
          >
            {canvasDataUrl ? (
              <img
                src={canvasDataUrl}
                alt={artwork.title}
                className="w-full h-auto max-h-[56vh] object-contain block transition-transform duration-200"
              />
            ) : (
              <div className="w-80 h-96 flex items-center justify-center text-neutral-400 font-serif">
                Generando lienzo...
              </div>
            )}

            {/* Magnifying Loupe Overlay */}
            {isHovering && canvasDataUrl && (
              <div
                style={{
                  top: `${zoomPos.y * 100}%`,
                  left: `${zoomPos.x * 100}%`,
                  backgroundImage: `url(${canvasDataUrl})`,
                  backgroundPosition: `${zoomPos.x * 100}% ${zoomPos.y * 100}%`,
                  backgroundSize: '350%',
                }}
                className="hidden md:block pointer-events-none absolute w-36 h-36 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-2xl ring-4 ring-black/40 z-20"
              />
            )}
          </div>

          <div className="mt-4 flex items-center gap-2 text-xs text-neutral-500">
            <ZoomIn className="w-3.5 h-3.5 text-neutral-400" />
            <span>Pasa el cursor sobre la pintura para examinar la textura y el empaste</span>
          </div>
        </div>

        {/* Right Column: Curatorial Archival Record */}
        <div className="lg:col-span-5 p-6 lg:p-8 flex flex-col justify-between overflow-y-auto">
          <div>
            {/* Header */}
            <div className="mb-4">
              <span className="text-[11px] font-sans tracking-widest uppercase text-neutral-400">
                {artwork.period} · Catálogo Raisonné
              </span>
              <h2 className="text-2xl font-serif font-bold text-neutral-900 mt-1">
                {artwork.title}
              </h2>
              <p className="text-sm font-semibold text-neutral-700 mt-0.5">
                {artwork.artist} <span className="text-neutral-400">·</span> {artwork.year}
              </p>
            </div>

            {/* Specifications Grid */}
            <div className="border-t border-b border-neutral-200 py-3 my-4 space-y-2 text-xs font-sans">
              <div className="grid grid-cols-3">
                <span className="text-neutral-400">Técnica:</span>
                <span className="col-span-2 text-neutral-800 font-medium">{artwork.medium}</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="text-neutral-400">Dimensiones:</span>
                <span className="col-span-2 text-neutral-800 font-medium">{artwork.dimensions}</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="text-neutral-400">Ubicación:</span>
                <span className="col-span-2 text-neutral-800 font-medium">
                  Galería Central, Ala Principal
                </span>
              </div>
              <div className="grid grid-cols-3">
                <span className="text-neutral-400">Paleta base:</span>
                <div className="col-span-2 flex items-center gap-1.5">
                  {artwork.palette.map((col, idx) => (
                    <span
                      key={idx}
                      style={{ backgroundColor: col }}
                      className="w-4 h-4 rounded-full border border-neutral-300 shadow-xs"
                      title={col}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Curatorial Essay */}
            <div className="space-y-3 text-xs leading-relaxed text-neutral-700 font-sans">
              <div>
                <h4 className="font-semibold text-neutral-900 text-xs uppercase tracking-wider mb-1">
                  Análisis Curatorial
                </h4>
                <p>{artwork.curatorialNotes}</p>
              </div>

              <div>
                <h4 className="font-semibold text-neutral-900 text-xs uppercase tracking-wider mb-1">
                  Contexto Histórico
                </h4>
                <p className="text-neutral-600">{artwork.historicalContext}</p>
              </div>
            </div>
          </div>

          {/* Primary Action Button (AR View) */}
          <div className="pt-6 mt-6 border-t border-neutral-200">
            <button
              onClick={() => {
                onClose();
                onOpenAR();
              }}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-neutral-900 hover:bg-neutral-800 text-white font-serif text-xs font-semibold tracking-wider uppercase transition-all shadow-md group"
            >
              <Sparkles className="w-4 h-4 text-amber-300 group-hover:scale-110 transition-transform" />
              <span>Colocar en tu habitación con Realidad Aumentada</span>
            </button>
            <p className="text-[11px] text-center text-neutral-400 mt-2">
              Compatible con teléfonos móviles y tabletas mediante cámara en tiempo real
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
