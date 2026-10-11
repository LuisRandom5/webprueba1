/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MuseumCanvas } from './components/MuseumCanvas';
import { CuratorialPanel } from './components/CuratorialPanel';
import { ArtworkDetailModal } from './components/ArtworkDetailModal';
import { AudioGuidePlayer } from './components/AudioGuidePlayer';
import { MuseumControls } from './components/MuseumControls';
import { CatalogDrawer } from './components/CatalogDrawer';
import { ARTWORKS } from './data/artworks';
import { Artwork, LightingPreset } from './types/museum';
import { ArrowDown } from 'lucide-react';

export default function App() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeArtwork, setActiveArtwork] = useState<Artwork | null>(null);
  const [focusIntensity, setFocusIntensity] = useState(0);
  const [lightingPreset, setLightingPreset] = useState<LightingPreset>('balanced');
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedArtworkForDetail, setSelectedArtworkForDetail] = useState<Artwork | null>(null);
  const [isAudioGuideOpen, setIsAudioGuideOpen] = useState(false);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [hasStartedTour, setHasStartedTour] = useState(false);

  const targetProgress = useRef(0);
  const currentProgress = useRef(0);
  const animFrameRef = useRef<number | null>(null);

  // Smooth lerp loop for scroll progress along the cinematic path
  useEffect(() => {
    const loop = () => {
      currentProgress.current += (targetProgress.current - currentProgress.current) * 0.085;
      if (Math.abs(targetProgress.current - currentProgress.current) < 0.0001) {
        currentProgress.current = targetProgress.current;
      }
      setScrollProgress(currentProgress.current);
      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // Wheel listener: Single direction scroll progression down the museum corridor
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (isDetailOpen || isCatalogOpen) return;
      e.preventDefault();
      setHasStartedTour(true);

      const delta = e.deltaY * 0.00042;
      targetProgress.current = Math.max(0, Math.min(1, targetProgress.current + delta));
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [isDetailOpen, isCatalogOpen]);

  // Touch swipe listener for touchscreens / mobile
  useEffect(() => {
    let touchStartY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches[0]) touchStartY = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isDetailOpen || isCatalogOpen) return;
      if (!e.touches[0]) return;

      const currentY = e.touches[0].clientY;
      const deltaY = touchStartY - currentY;
      touchStartY = currentY;

      setHasStartedTour(true);
      const delta = deltaY * 0.0012;
      targetProgress.current = Math.max(0, Math.min(1, targetProgress.current + delta));
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [isDetailOpen, isCatalogOpen]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isDetailOpen || isCatalogOpen) return;

      if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        setHasStartedTour(true);
        targetProgress.current = Math.max(0, Math.min(1, targetProgress.current + 0.04));
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        setHasStartedTour(true);
        targetProgress.current = Math.max(0, Math.min(1, targetProgress.current - 0.04));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDetailOpen, isCatalogOpen]);

  // Jump to specific artwork checkpoint along the hallway
  const handleJumpToProgress = (progress: number) => {
    setHasStartedTour(true);
    targetProgress.current = Math.max(0, Math.min(1, progress));
  };

  // Jump to artwork from catalog
  const handleJumpToArtwork = useCallback((artwork: Artwork) => {
    setHasStartedTour(true);
    const progressMap: Record<string, number> = {
      chiaroscuro: 0.17,
      impressionism: 0.40,
      surrealism: 0.63,
      ultramarine: 0.86,
      constructivism: 1.0,
    };
    if (progressMap[artwork.id] !== undefined) {
      targetProgress.current = progressMap[artwork.id];
    }
  }, []);

  // Open detail zoom modal
  const handleOpenDetail = () => {
    const art = activeArtwork || ARTWORKS[0];
    setSelectedArtworkForDetail(art);
    setIsDetailOpen(true);
  };

  // Callback from 3D camera path
  const handleActiveArtworkChange = useCallback((art: Artwork | null, intensity: number) => {
    setActiveArtwork(art);
    setFocusIntensity(intensity);
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#fbfbfb] text-neutral-900 font-sans select-none">
      {/* 3D Three.js On-Rails Corridor Canvas */}
      <MuseumCanvas
        scrollProgress={scrollProgress}
        lightingPreset={lightingPreset}
        onActiveArtworkChange={handleActiveArtworkChange}
      />

      {/* Top Header & Corridor Navigation */}
      <MuseumControls
        scrollProgress={scrollProgress}
        onJumpToProgress={handleJumpToProgress}
        lightingPreset={lightingPreset}
        onChangeLighting={setLightingPreset}
        onOpenCatalog={() => setIsCatalogOpen(true)}
        onToggleAudioGuide={() => setIsAudioGuideOpen(!isAudioGuideOpen)}
        isAudioGuideActive={isAudioGuideOpen}
        activeArtwork={activeArtwork}
      />

      {/* Curatorial Panel (Appears when camera locks onto the painting) */}
      {activeArtwork && (
        <CuratorialPanel
          artwork={activeArtwork}
          proximity={focusIntensity}
          onOpenDetail={handleOpenDetail}
          onToggleAudio={() => setIsAudioGuideOpen(!isAudioGuideOpen)}
          isPlayingAudio={isAudioGuideOpen}
        />
      )}

      {/* Initial Welcome prompt */}
      {!hasStartedTour && scrollProgress < 0.05 && (
        <div className="pointer-events-none absolute bottom-24 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center text-center animate-bounce">
          <div className="bg-neutral-900/90 text-white text-xs px-5 py-2.5 uppercase tracking-widest font-serif shadow-lg mb-2">
            Haz scroll para avanzar por el pasillo
          </div>
          <ArrowDown className="w-5 h-5 text-neutral-900" />
        </div>
      )}

      {/* High-Resolution Artwork Detail Inspection Modal */}
      <ArtworkDetailModal
        artwork={selectedArtworkForDetail || activeArtwork}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onSelectArtwork={(art) => setSelectedArtworkForDetail(art)}
        allArtworks={ARTWORKS}
      />

      {/* Official Audio Guide Player */}
      <AudioGuidePlayer
        artwork={activeArtwork || ARTWORKS[0]}
        isOpen={isAudioGuideOpen}
        onClose={() => setIsAudioGuideOpen(false)}
      />

      {/* Complete Museum Catalog Drawer */}
      <CatalogDrawer
        artworks={ARTWORKS}
        isOpen={isCatalogOpen}
        onClose={() => setIsCatalogOpen(false)}
        onSelectArtwork={(art) => {
          setSelectedArtworkForDetail(art);
          setIsDetailOpen(true);
          setIsCatalogOpen(false);
        }}
        onJumpToArtwork3D={handleJumpToArtwork}
      />
    </div>
  );
}
