/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MuseumCanvas } from './components/MuseumCanvas';
import { CuratorialPanel } from './components/CuratorialPanel';
import { Artwork } from './types/museum';

export default function App() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeArtwork, setActiveArtwork] = useState<Artwork | null>(null);
  const [focusIntensity, setFocusIntensity] = useState(0);
  const [hasScrolled, setHasScrolled] = useState(false);

  const targetProgress = useRef(0);
  const currentProgress = useRef(0);
  const animFrameRef = useRef<number | null>(null);
  const isSyncingScroll = useRef(false);

  // 1. Smooth lerping render loop
  useEffect(() => {
    const loop = () => {
      currentProgress.current += (targetProgress.current - currentProgress.current) * 0.08;
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

  // 2. NATIVE WINDOW SCROLL: Works across Safari, Chrome, mobile, trackpads, and scrollbars
  useEffect(() => {
    const handleNativeScroll = () => {
      if (isSyncingScroll.current) return;
      const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
      const maxScroll = (document.documentElement.scrollHeight || document.body.scrollHeight) - window.innerHeight;
      if (maxScroll > 0) {
        const ratio = Math.max(0, Math.min(1, scrollY / maxScroll));
        targetProgress.current = ratio;
        if (ratio > 0.01) setHasScrolled(true);
      }
    };

    window.addEventListener('scroll', handleNativeScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleNativeScroll);
  }, []);

  // 3. WHEEL LISTENER (Syncs with native scroll)
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      setHasScrolled(true);
      const delta = e.deltaY * 0.00045;
      targetProgress.current = Math.max(0, Math.min(1, targetProgress.current + delta));

      // Synchronize window.scrollTo
      isSyncingScroll.current = true;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      window.scrollTo(0, targetProgress.current * maxScroll);
      setTimeout(() => {
        isSyncingScroll.current = false;
      }, 50);
    };

    window.addEventListener('wheel', handleWheel, { passive: true });
    return () => window.removeEventListener('wheel', handleWheel);
  }, []);

  // 4. TOUCH SWIPE (Syncs with native scroll)
  useEffect(() => {
    let touchStartY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches[0]) touchStartY = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!e.touches[0]) return;
      setHasScrolled(true);
      const currentY = e.touches[0].clientY;
      const deltaY = touchStartY - currentY;
      touchStartY = currentY;

      const delta = deltaY * 0.0014;
      targetProgress.current = Math.max(0, Math.min(1, targetProgress.current + delta));

      isSyncingScroll.current = true;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      window.scrollTo(0, targetProgress.current * maxScroll);
      setTimeout(() => {
        isSyncingScroll.current = false;
      }, 50);
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  // 5. KEYBOARD ARROWS
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        setHasScrolled(true);
        targetProgress.current = Math.max(0, Math.min(1, targetProgress.current + 0.04));
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        window.scrollTo(0, targetProgress.current * maxScroll);
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        setHasScrolled(true);
        targetProgress.current = Math.max(0, Math.min(1, targetProgress.current - 0.04));
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        window.scrollTo(0, targetProgress.current * maxScroll);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleActiveArtworkChange = useCallback((art: Artwork | null, intensity: number) => {
    setActiveArtwork(art);
    setFocusIntensity(intensity);
  }, []);

  return (
    <div className="relative w-full bg-[#fbfbfb] text-neutral-900 font-sans select-none">
      {/* 3D Fixed Viewport Canvas */}
      <div className="fixed inset-0 w-full h-full overflow-hidden pointer-events-none">
        <MuseumCanvas
          scrollProgress={scrollProgress}
          onActiveArtworkChange={handleActiveArtworkChange}
        />
      </div>

      {/* Discrete Curatorial Placard (fades in only when camera locks on painting) */}
      {activeArtwork && (
        <CuratorialPanel
          artwork={activeArtwork}
          proximity={focusIntensity}
        />
      )}

      {/* Ultra-minimalist initial scroll cue (disappears immediately on first scroll) */}
      {!hasScrolled && scrollProgress < 0.02 && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-20 pointer-events-none text-center opacity-60">
          <p className="text-[11px] font-mono tracking-widest uppercase text-neutral-400">
            scroll
          </p>
          <div className="w-[1px] h-6 bg-neutral-300 mx-auto mt-2 animate-pulse" />
        </div>
      )}

      {/* Native Scroll Track (Provides 800vh of real browser scroll depth) */}
      <div className="w-full h-[800vh] pointer-events-none" />
    </div>
  );
}
