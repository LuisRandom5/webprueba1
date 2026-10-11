/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MuseumCanvas } from './components/MuseumCanvas';
import { CuratorialPanel } from './components/CuratorialPanel';
import { ArtworkDetailModal } from './components/ArtworkDetailModal';
import { AugmentedRealityModal } from './components/AugmentedRealityModal';
import { AudioGuidePlayer } from './components/AudioGuidePlayer';
import { MuseumControls } from './components/MuseumControls';
import { CatalogDrawer } from './components/CatalogDrawer';
import { ARTWORKS } from './data/artworks';
import { Artwork, LightingPreset } from './types/museum';
import { ChevronDown, ArrowDown, Sparkles } from 'lucide-react';

export default function App() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeArtwork, setActiveArtwork] = useState<Artwork | null>(null);
  const [proximity, setProximity] = useState(0);
  const [lightingPreset, setLightingPreset] = useState<LightingPreset>('balanced');
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedArtworkForDetail, setSelectedArtworkForDetail] = useState<Artwork | null>(null);
  const [isAROpen, setIsAROpen] = useState(false);
  const [selectedArtworkForAR, setSelectedArtworkForAR] = useState<Artwork | null>(null);
  const [isAudioGuideOpen, setIsAudioGuideOpen] = useState(false);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [focusedArtworkId, setFocusedArtworkId] = useState<string | null>(null);
  const [hasStartedTour, setHasStartedTour] = useState(false);

  const targetProgress = useRef(0);
  const currentProgress = useRef(0);
  const animFrameRef = useRef<number | null>(null);

  // Smooth lerp loop for scroll progress
  useEffect(() => {
    const loop = () => {
      currentProgress.current += (targetProgress.current - currentProgress.current) * 0.08;
      // Precision cutoff
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

  // Wheel listener for smooth scroll progression down the museum hallway
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      // Ignore if a modal is open
      if (isDetailOpen || isAROpen || isCatalogOpen) return;

      e.preventDefault();
      setHasStartedTour(true);
      setFocusedArtworkId(null); // Return to continuous scroll path

      const delta = e.deltaY * 0.00045;
      targetProgress.current = Math.max(0, Math.min(1, targetProgress.current + delta));
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [isDetailOpen, isAROpen, isCatalogOpen]);

  // Touch swipe listener for mobile devices
  useEffect(() => {
    let touchStartY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches[0]) touchStartY = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isDetailOpen || isAROpen || isCatalogOpen) return;
      if (!e.touches[0]) return;

      const currentY = e.touches[0].clientY;
      const deltaY = touchStartY - currentY;
      touchStartY = currentY;

      setHasStartedTour(true);
      setFocusedArtworkId(null);
      const delta = deltaY * 0.0012;
      targetProgress.current = Math.max(0, Math.min(1, targetProgress.current + delta));
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [isDetailOpen, isAROpen, isCatalogOpen]);

  // Keyboard navigation (Arrow keys / PageUp / PageDown / Space)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isDetailOpen || isAROpen || isCatalogOpen) return;

      if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        setHasStartedTour(true);
        setFocusedArtworkId(null);
        targetProgress.current = Math.max(0, Math.min(1, targetProgress.current + 0.05));
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        setHasStartedTour(true);
        setFocusedArtworkId(null);
        targetProgress.current = Math.max(0, Math.min(1, targetProgress.current - 0.05));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDetailOpen, isAROpen, isCatalogOpen]);

  // Jump to specific progress waypoint
  const handleJumpToProgress = (progress: number) => {
    setHasStartedTour(true);
    setFocusedArtworkId(null);
    targetProgress.current = Math.max(0, Math.min(1, progress));
  };

  // Click on a painting directly in the 3D gallery
  const handleArtworkClick = useCallback((artwork: Artwork) => {
    setHasStartedTour(true);
    // Find closest waypoint for this artwork
    const progressMap: Record<string, number> = {
      chiaroscuro: 0.18,
      impressionism: 0.38,
      surrealism: 0.58,
      ultramarine: 0.78,
      constructivism: 1.0,
    };
    if (progressMap[artwork.id] !== undefined) {
      targetProgress.current = progressMap[artwork.id];
    }
    setActiveArtwork(artwork);
    setProximity(1.0);
  }, []);

  // Open detail modal
  const handleOpenDetail = () => {
    const art = activeArtwork || ARTWORKS[0];
    setSelectedArtworkForDetail(art);
    setIsDetailOpen(true);
  };

  // Open AR modal
  const handleOpenAR = (artToOpen?: Artwork) => {
    const art = artToOpen || activeArtwork || ARTWORKS[0];
    setSelectedArtworkForAR(art);
    setIsAROpen(true);
  };

  // Active artwork callback from 3D canvas
  const handleActiveArtworkChange = useCallback((art: Artwork | null, prox: number) => {
    setActiveArtwork(art);
    setProximity(prox);
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#fbfbfb] text-neutral-900 font-sans select-none">
      {/* 3D Three.js Museum Hallway Canvas */}
      <MuseumCanvas
        scrollProgress={scrollProgress}
        lightingPreset={lightingPreset}
        onActiveArtworkChange={handleActiveArtworkChange}
        onArtworkClick={handleArtworkClick}
        focusedArtworkId={focusedArtworkId}
      />

      {/* Top Header & Gallery Navigation Controls */}
      <MuseumControls
        scrollProgress={scrollProgress}
        onJumpToProgress={handleJumpToProgress}
        lightingPreset={lightingPreset}
        onChangeLighting={setLightingPreset}
        onOpenAR={() => handleOpenAR()}
        onOpenCatalog={() => setIsCatalogOpen(true)}
        onToggleAudioGuide={() => setIsAudioGuideOpen(!isAudioGuideOpen)}
        isAudioGuideActive={isAudioGuideOpen}
        activeArtwork={activeArtwork}
      />

      {/* Curatorial Panel (Emerges dynamically when approaching paintings) */}
      {activeArtwork && (
        <CuratorialPanel
          artwork={activeArtwork}
          proximity={proximity}
          onOpenDetail={handleOpenDetail}
          onOpenAR={() => handleOpenAR(activeArtwork)}
          onToggleAudio={() => setIsAudioGuideOpen(!isAudioGuideOpen)}
          isPlayingAudio={isAudioGuideOpen}
        />
      )}

      {/* Welcome Tour Prompt overlay on initial entrance */}
      {!hasStartedTour && scrollProgress < 0.05 && (
        <div className="pointer-events-none absolute bottom-24 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center text-center animate-bounce">
          <div className="bg-neutral-900/90 text-white text-xs px-4 py-2 uppercase tracking-widest font-serif shadow-lg mb-2">
            Desliza o haz scroll para adentrarte en el pasillo
          </div>
          <ArrowDown className="w-5 h-5 text-neutral-900" />
        </div>
      )}

      {/* High-Resolution Artwork Detail Modal */}
      <ArtworkDetailModal
        artwork={selectedArtworkForDetail || activeArtwork}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onSelectArtwork={(art) => setSelectedArtworkForDetail(art)}
        allArtworks={ARTWORKS}
        onOpenAR={() => handleOpenAR(selectedArtworkForDetail || activeArtwork || undefined)}
      />

      {/* Mobile Augmented Reality (AR) Modal */}
      <AugmentedRealityModal
        artwork={selectedArtworkForAR || activeArtwork || ARTWORKS[0]}
        isOpen={isAROpen}
        onClose={() => setIsAROpen(false)}
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
        onJumpToArtwork3D={(art) => {
          handleArtworkClick(art);
        }}
        onOpenAR={(art) => {
          handleOpenAR(art);
        }}
      />
    </div>
  );
}
