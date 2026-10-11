import React, { useState } from 'react';
import {
  Sun,
  ChevronDown,
  Volume2,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import { Artwork, LightingPreset } from '../types/museum';

interface MuseumControlsProps {
  scrollProgress: number;
  onJumpToProgress: (progress: number) => void;
  lightingPreset: LightingPreset;
  onChangeLighting: (preset: LightingPreset) => void;
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
  onOpenCatalog,
  onToggleAudioGuide,
  isAudioGuideActive,
  activeArtwork,
}) => {
  const [showLightingMenu, setShowLightingMenu] = useState(false);
  const [showRoomDrawer, setShowRoomDrawer] = useState(false);

  // Waypoints progress mapping for quick jumping
  const roomWaypoints = [
    { id: 'start', label: 'Entrada al Museo', progress: 0.0, subtitle: 'Vestíbulo Blanco' },
    { id: 'chiaroscuro', label: '01. La Vigilia del Astrónomo', progress: 0.17, subtitle: 'Johannes van Leyden (1648)' },
    { id: 'impressionism', label: '02. Sol Poniente en Acantilados', progress: 0.40, subtitle: 'Émile D’Aubigny (1886)' },
    { id: 'surrealism', label: '03. La Soledad de las Arcadas', progress: 0.63, subtitle: 'Carlo de Monticelli (1923)' },
    { id: 'ultramarine', label: '04. Canto al Vacío en Azul Ultramar', progress: 0.86, subtitle: 'Valeria Sforza (1964)' },
    { id: 'constructivism', label: '05. Equilibrio Circular nº 7', progress: 1.0, subtitle: 'Helena Lindqvist (1934)' },
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
            className="hover:text-neutral-900 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
          >
            <span>Catálogo Completo</span>
          </button>

          <button
            onClick={() => setShowLightingMenu(!showLightingMenu)}
            className="hover:text-neutral-900 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
          >
            <span>Iluminación Cenital</span>
            <Sun className="w-3 h-3 text-neutral-400" />
          </button>

          <button
            onClick={onToggleAudioGuide}
            className={`transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              isAudioGuideActive ? 'text-amber-800 font-semibold' : 'hover:text-neutral-900'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Audioguía Oficial</span>
          </button>
        </nav>

        {/* Zone 3: Primary Action / Status Indicator */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onOpenCatalog}
            className="flex items-center gap-2 px-4 py-2 text-xs font-serif font-semibold uppercase tracking-wider text-white bg-neutral-900 hover:bg-neutral-800 transition-colors whitespace-nowrap shrink-0 shadow-xs"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ver Obras</span>
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
        <div className="fixed top-16 left-6 md:left-28 z-40 w-80 bg-white border border-neutral-200 shadow-2xl p-4 animate-fadeIn text-xs font-sans">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-150">
            <span className="font-semibold text-neutral-900 uppercase tracking-wider text-[10px]">
              Navegación Unidireccional
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
                className="w-full text-left p-2.5 hover:bg-neutral-100 text-neutral-800 transition-colors flex items-center justify-between group"
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

      {/* Fixed Bottom Step Indicators (01 - 05) */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 bg-white/90 backdrop-blur-md border border-neutral-200/90 py-2 px-5 shadow-lg text-neutral-800 select-none">
        <span className="text-[10px] font-mono tracking-widest text-neutral-400 uppercase">
          Pasillo Central
        </span>

        {/* Step buttons for each artwork along the corridor */}
        <div className="flex items-center gap-1.5 px-2">
          {roomWaypoints.slice(1).map((rw, idx) => {
            const isNear = activeArtwork && idx === roomWaypoints.findIndex((w) => w.id === activeArtwork.id) - 1;
            return (
              <button
                key={rw.id}
                onClick={() => onJumpToProgress(rw.progress)}
                title={rw.label}
                className={`px-2 py-0.5 text-[10px] font-mono font-medium transition-all ${
                  isNear
                    ? 'bg-neutral-900 text-white'
                    : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-600'
                }`}
              >
                0{idx + 1}
              </button>
            );
          })}
        </div>

        {/* Progress % */}
        <span className="text-xs font-mono font-medium text-neutral-700 w-8 text-right tabular-nums">
          {Math.round(scrollProgress * 100)}%
        </span>

        {/* Instructions */}
        <span className="hidden md:inline text-[11px] text-neutral-400 pl-2 border-l border-neutral-200 font-sans">
          Haz scroll para avanzar en el pasillo
        </span>
      </div>
    </>
  );
};
