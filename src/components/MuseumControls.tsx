import React, { useState } from 'react';
import {
  Sun,
  Moon,
  Sparkles,
  Volume2,
  VolumeX,
  Compass,
  ChevronDown,
  Layers,
  ArrowRight,
  Info,
} from 'lucide-react';
import { Artwork, LightingPreset } from '../types/museum';
import { ARTWORKS } from '../data/artworks';

interface MuseumControlsProps {
  scrollProgress: number;
  onJumpToProgress: (progress: number) => void;
  lightingPreset: LightingPreset;
  onChangeLighting: (preset: LightingPreset) => void;
  onOpenAR: () => void;
  onOpenCatalog: () => void;
  onToggleAudioGuide: () => void;
  isAudioGuideActive: boolean;
  activeArtwork: Artwork | null;
}

export const MuseumControls: React.FC<MuseumControlsProps> = ({
  scrollProgress,
  onJumpToProgress,
  lightingPreset,
  onChangeLighting,
  onOpenAR,
  onOpenCatalog,
  onToggleAudioGuide,
  isAudioGuideActive,
  activeArtwork,
}) => {
  const [showLightingMenu, setShowLightingMenu] = useState(false);
  const [showRoomDrawer, setShowRoomDrawer] = useState(false);

  // Waypoints progress mapping for quick jumping
  const roomWaypoints = [
    { id: 'start', label: 'Entrada al Museo', progress: 0.0, subtitle: 'Vestíbulo Central' },
    { id: 'chiaroscuro', label: '01. La Vigilia del Astrónomo', progress: 0.18, subtitle: 'Barroco Tardío' },
    { id: 'impressionism', label: '02. Sol Poniente en Acantilados', progress: 0.38, subtitle: 'Impresionismo Lumínico' },
    { id: 'surrealism', label: '03. La Soledad de las Arcadas', progress: 0.58, subtitle: 'Pintura Metafísica' },
    { id: 'ultramarine', label: '04. Canto al Vacío', progress: 0.78, subtitle: 'Campo de Color' },
    { id: 'constructivism', label: '05. Equilibrio Circular nº 7', progress: 1.0, subtitle: 'Bauhaus & Geometría' },
  ];

  return (
    <>
      {/* Top Bar Navigation following Top Bar Contract */}
      <header className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between gap-8 px-6 lg:px-10 py-4 bg-white/85 backdrop-blur-md border-b border-neutral-200/80 transition-all select-none">
        {/* Zone 1: Single Brand wordmark */}
        <button
          onClick={() => onJumpToProgress(0)}
          className="text-base sm:text-lg font-serif font-bold tracking-widest text-neutral-900 uppercase whitespace-nowrap shrink-0 hover:opacity-80 transition-opacity"
        >
          MUSEO BLANCO
        </button>

        {/* Zone 2: Clean single-line text links */}
        <nav className="hidden md:flex items-center gap-7 text-xs font-sans font-medium text-neutral-600">
          <button
            onClick={() => setShowRoomDrawer(!showRoomDrawer)}
            className="hover:text-neutral-900 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1"
          >
            <span>Salas de Exposición</span>
            <ChevronDown className="w-3 h-3 text-neutral-400" />
          </button>

          <button
            onClick={onOpenCatalog}
            className="hover:text-neutral-900 transition-colors whitespace-nowrap shrink-0"
          >
            Catálogo Raisonné
          </button>

          <button
            onClick={() => setShowLightingMenu(!showLightingMenu)}
            className="hover:text-neutral-900 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
          >
            <span>Iluminación Dinámica</span>
            <Sun className="w-3 h-3 text-neutral-400" />
          </button>

          <button
            onClick={onToggleAudioGuide}
            className={`transition-colors whitespace-nowrap shrink-0 flex items-center gap-1 ${
              isAudioGuideActive ? 'text-amber-700 font-semibold' : 'hover:text-neutral-900'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Audioguía</span>
          </button>
        </nav>

        {/* Zone 3: Primary Action CTA */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onOpenAR}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-neutral-900 hover:bg-neutral-800 transition-colors whitespace-nowrap shrink-0 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Realidad Aumentada</span>
          </button>
        </div>
      </header>

      {/* Floating Lighting Controls Popover */}
      {showLightingMenu && (
        <div className="fixed top-16 right-24 z-40 w-64 bg-white border border-neutral-200 shadow-xl p-3 animate-fadeIn text-xs font-sans">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-150">
            <span className="font-semibold text-neutral-900 uppercase tracking-wider text-[10px]">
              Iluminación de Galería
            </span>
            <button
              onClick={() => setShowLightingMenu(false)}
              className="text-neutral-400 hover:text-neutral-900 text-xs"
            >
              ×
            </button>
          </div>
          <div className="space-y-1">
            {(
              [
                { id: 'balanced', label: 'Luz Cenital de Museo', desc: 'Luz blanca difusa arquitectónica' },
                { id: 'dramatic', label: 'Claroscuro Dramático', desc: 'Foco acentuado sobre cada obra' },
                { id: 'evening', label: 'Visita Nocturna Privada', desc: 'Atmósfera íntima y cálida' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                onClick={() => {
                  onChangeLighting(opt.id);
                  setShowLightingMenu(false);
                }}
                className={`w-full text-left p-2 transition-colors ${
                  lightingPreset === opt.id
                    ? 'bg-neutral-900 text-white'
                    : 'hover:bg-neutral-100 text-neutral-800'
                }`}
              >
                <div className="font-medium">{opt.label}</div>
                <div
                  className={`text-[10px] ${
                    lightingPreset === opt.id ? 'text-neutral-300' : 'text-neutral-500'
                  }`}
                >
                  {opt.desc}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Room Drawer Navigation */}
      {showRoomDrawer && (
        <div className="fixed top-16 left-6 md:left-28 z-40 w-72 bg-white border border-neutral-200 shadow-xl p-4 animate-fadeIn text-xs font-sans">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-150">
            <span className="font-semibold text-neutral-900 uppercase tracking-wider text-[10px]">
              Navegar Salas
            </span>
            <button
              onClick={() => setShowRoomDrawer(false)}
              className="text-neutral-400 hover:text-neutral-900 text-xs"
            >
              ×
            </button>
          </div>
          <div className="space-y-1">
            {roomWaypoints.map((rw) => (
              <button
                key={rw.id}
                onClick={() => {
                  onJumpToProgress(rw.progress);
                  setShowRoomDrawer(false);
                }}
                className="w-full text-left p-2 hover:bg-neutral-100 text-neutral-800 transition-colors flex items-center justify-between group"
              >
                <div>
                  <div className="font-medium text-neutral-900 group-hover:text-black">
                    {rw.label}
                  </div>
                  <div className="text-[10px] text-neutral-500">{rw.subtitle}</div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-neutral-400 group-hover:translate-x-1 transition-transform" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Floating Bottom Hallway Progress Bar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 bg-white/90 backdrop-blur-md border border-neutral-200/90 py-2 px-4 shadow-lg text-neutral-800 select-none">
        <span className="text-[10px] font-mono tracking-widest text-neutral-400 uppercase">
          Pasillo Principal
        </span>

        {/* Progress Slider Track */}
        <div className="w-36 sm:w-56 h-1.5 bg-neutral-200 relative overflow-hidden">
          <div
            className="h-full bg-neutral-900 transition-all duration-150"
            style={{ width: `${Math.round(scrollProgress * 100)}%` }}
          />
        </div>

        <span className="text-xs font-mono font-medium text-neutral-700 w-9 text-right tabular-nums">
          {Math.round(scrollProgress * 100)}%
        </span>

        {/* Scroll Helper Tip */}
        <span className="hidden lg:inline text-[11px] text-neutral-400 pl-2 border-l border-neutral-200">
          Usa la rueda del ratón o el deslizador táctil para avanzar
        </span>
      </div>
    </>
  );
};
