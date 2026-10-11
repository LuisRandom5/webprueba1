import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Camera,
  RotateCcw,
  Download,
  Smartphone,
  Sparkles,
  Maximize2,
  Minimize2,
  Sliders,
  Check,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { Artwork } from '../types/museum';
import { renderArtworkToCanvas } from '../utils/proceduralArt';

interface AugmentedRealityModalProps {
  artwork: Artwork | null;
  isOpen: boolean;
  onClose: () => void;
}

type FrameStyle = 'black' | 'gold' | 'wood' | 'white';

export const AugmentedRealityModal: React.FC<AugmentedRealityModalProps> = ({
  artwork,
  isOpen,
  onClose,
}) => {
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [webxrSupported, setWebxrSupported] = useState(false);
  const [scale, setScale] = useState(1.0); // 1.0 = 100% scale
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [frameStyle, setFrameStyle] = useState<FrameStyle>('black');
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string | null>(null);
  const [wallMockupBg, setWallMockupBg] = useState<'white' | 'brick' | 'concrete'>('white');
  const [deviceTilt, setDeviceTilt] = useState({ gamma: 0, beta: 0 });
  const [showQrCode, setShowQrCode] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const artworkCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Check device type and WebXR support
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
      setIsMobileDevice(isMobile);

      // WebXR check
      const nav = navigator as unknown as { xr?: { isSessionSupported: (mode: string) => Promise<boolean> } };
      if (nav.xr && nav.xr.isSessionSupported) {
        nav.xr
          .isSessionSupported('immersive-ar')
          .then((supported) => setWebxrSupported(supported))
          .catch(() => setWebxrSupported(false));
      }
    }
  }, []);

  // Prepare artwork canvas texture
  useEffect(() => {
    if (!artwork || !isOpen) return;
    const canvas = renderArtworkToCanvas(artwork.id, 900, 1200);
    artworkCanvasRef.current = canvas;
  }, [artwork?.id, isOpen]);

  // Handle device orientation for parallax wall depth
  useEffect(() => {
    if (!isOpen) return;

    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma !== null && e.beta !== null) {
        // Subtle tilt clamp
        setDeviceTilt({
          gamma: Math.max(-15, Math.min(15, e.gamma * 0.4)),
          beta: Math.max(-15, Math.min(15, (e.beta - 45) * 0.4)),
        });
      }
    };

    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', handleOrientation);
    }
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, [isOpen]);

  // Start Camera Stream
  const startCamera = async (mode = facingMode) => {
    setCameraError(null);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err) {
      console.warn('Camera access unavailable:', err);
      setCameraError(
        'No se pudo acceder a la cámara. Puedes utilizar el simulador interactivo de pared.'
      );
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  // Switch between front and rear cameras
  const toggleFacingMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // Launch WebXR native AR if supported
  const launchWebXR = async () => {
    const nav = navigator as unknown as { xr?: { requestSession: (mode: string) => Promise<unknown> } };
    if (!nav.xr) return;
    try {
      await nav.xr.requestSession('immersive-ar');
    } catch (err) {
      console.warn('WebXR session failed, falling back to camera stream', err);
      startCamera('environment');
    }
  };

  // Cleanup on close
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setCapturedPhotoUrl(null);
      setPosition({ x: 0, y: 0 });
      setScale(1.0);
    } else {
      // Auto-start camera if opened
      startCamera('environment');
    }
    return () => stopCamera();
  }, [isOpen]);

  // Touch & Mouse Drag handlers to position painting on user's real wall
  const handleStartDrag = (clientX: number, clientY: number) => {
    setIsDragging(true);
    setDragStart({ x: clientX - position.x, y: clientY - position.y });
  };

  const handleMoveDrag = (clientX: number, clientY: number) => {
    if (!isDragging) return;
    setPosition({
      x: clientX - dragStart.x,
      y: clientY - dragStart.y,
    });
  };

  const handleEndDrag = () => {
    setIsDragging(false);
  };

  // Take Snapshot / Capture AR Photo
  const takeSnapshot = () => {
    const captureCanvas = document.createElement('canvas');
    const width = 1280;
    const height = 720;
    captureCanvas.width = width;
    captureCanvas.height = height;
    const ctx = captureCanvas.getContext('2d');
    if (!ctx) return;

    // Draw camera video or background
    if (videoRef.current && cameraActive) {
      ctx.drawImage(videoRef.current, 0, 0, width, height);
    } else {
      ctx.fillStyle = wallMockupBg === 'white' ? '#f4f4f4' : wallMockupBg === 'brick' ? '#b86b52' : '#9ca3af';
      ctx.fillRect(0, 0, width, height);
    }

    // Draw painting at current scale and position
    if (artworkCanvasRef.current) {
      const artW = 320 * scale;
      const artH = 420 * scale;
      const artX = width / 2 + position.x - artW / 2;
      const artY = height / 2 + position.y - artH / 2;

      // Soft shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
      ctx.shadowBlur = 24;
      ctx.shadowOffsetX = 12;
      ctx.shadowOffsetY = 18;

      // Frame border
      const frameColorHex =
        frameStyle === 'gold'
          ? '#d4af37'
          : frameStyle === 'wood'
          ? '#5c3a21'
          : frameStyle === 'white'
          ? '#ffffff'
          : '#1a1a1a';
      ctx.fillStyle = frameColorHex;
      ctx.fillRect(artX - 14, artY - 14, artW + 28, artH + 28);

      // Artwork
      ctx.shadowColor = 'transparent';
      ctx.drawImage(artworkCanvasRef.current, artX, artY, artW, artH);

      // Museum watermark watermark
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.font = '16px "Cinzel", Georgia, serif';
      ctx.fillText(`${artwork?.title} — Museo Blanco AR`, 32, height - 32);
    }

    const dataUrl = captureCanvas.toDataURL('image/jpeg', 0.92);
    setCapturedPhotoUrl(dataUrl);
  };

  if (!isOpen || !artwork) return null;

  // Frame border styling helper
  const getFrameStyleClass = () => {
    switch (frameStyle) {
      case 'gold':
        return 'border-[14px] border-[#c99a38] shadow-[0_25px_50px_rgba(0,0,0,0.5)]';
      case 'wood':
        return 'border-[14px] border-[#4a2e1b] shadow-[0_25px_50px_rgba(0,0,0,0.45)]';
      case 'white':
        return 'border-[14px] border-white shadow-[0_20px_45px_rgba(0,0,0,0.3)]';
      case 'black':
      default:
        return 'border-[14px] border-neutral-900 shadow-[0_25px_50px_rgba(0,0,0,0.55)]';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black text-white select-none overflow-hidden">
      {/* Top Header Bar */}
      <div className="relative z-20 flex items-center justify-between px-4 sm:px-6 py-3.5 bg-neutral-950/80 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="font-serif text-sm font-semibold tracking-wider uppercase text-white">
            Realidad Aumentada (AR)
          </span>
          <span className="text-white/40">·</span>
          <span className="text-xs text-neutral-300 font-sans truncate max-w-[140px] sm:max-w-none">
            {artwork.title}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {!isMobileDevice && (
            <button
              onClick={() => setShowQrCode(!showQrCode)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-xs font-sans tracking-wide uppercase transition-colors"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Abrir en móvil</span>
            </button>
          )}

          {webxrSupported && (
            <button
              onClick={launchWebXR}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-400 text-neutral-950 hover:bg-amber-300 text-xs font-semibold tracking-wide uppercase transition-colors"
            >
              <span>WebXR Nativo</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="p-1.5 text-white/70 hover:text-white transition-colors"
            aria-label="Cerrar AR"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Main Viewport Container */}
      <div
        ref={containerRef}
        onMouseMove={(e) => handleMoveDrag(e.clientX, e.clientY)}
        onMouseUp={handleEndDrag}
        onTouchMove={(e) => {
          if (e.touches[0]) handleMoveDrag(e.touches[0].clientX, e.touches[0].clientY);
        }}
        onTouchEnd={handleEndDrag}
        className="relative flex-1 w-full h-full overflow-hidden flex items-center justify-center cursor-move"
      >
        {/* Background Layer: Real Video Stream or Wall Simulator */}
        {cameraActive ? (
          <video
            ref={videoRef}
            playsInline
            autoPlay
            muted
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          />
        ) : (
          <div
            className={`absolute inset-0 w-full h-full transition-colors duration-500 ${
              wallMockupBg === 'white'
                ? 'bg-neutral-100'
                : wallMockupBg === 'brick'
                ? 'bg-[#c47761] bg-[radial-gradient(#ab634e_1px,transparent_1px)] [background-size:24px_24px]'
                : 'bg-neutral-400'
            }`}
          >
            {/* Wall baseboard & architectural floor preview */}
            <div className="absolute bottom-0 left-0 right-0 h-28 bg-neutral-300 border-t-8 border-neutral-200" />
            <div className="absolute bottom-28 left-0 right-0 h-4 bg-white/70 border-b border-neutral-400" />
          </div>
        )}

        {/* Live Camera Grid / Reticle Aid */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-25">
          <div className="w-64 h-64 border border-dashed border-white/60 rounded-lg flex items-center justify-center">
            <span className="text-[11px] text-white tracking-widest uppercase">
              Superficie de Pared
            </span>
          </div>
        </div>

        {/* Augmented Reality Framed Painting Overlay */}
        <div
          onMouseDown={(e) => handleStartDrag(e.clientX, e.clientY)}
          onTouchStart={(e) => {
            if (e.touches[0]) handleStartDrag(e.touches[0].clientX, e.touches[0].clientY);
          }}
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotateY(${deviceTilt.gamma}deg) rotateX(${-deviceTilt.beta}deg)`,
            transition: isDragging ? 'none' : 'transform 0.12s ease-out',
          }}
          className={`relative z-10 cursor-grab active:cursor-grabbing max-w-[85vw] max-h-[75vh] select-none ${getFrameStyleClass()}`}
        >
          {artworkCanvasRef.current ? (
            <img
              src={artworkCanvasRef.current.toDataURL()}
              alt={artwork.title}
              className="max-w-[280px] sm:max-w-[340px] md:max-w-[420px] max-h-[50vh] sm:max-h-[60vh] object-contain block pointer-events-none"
            />
          ) : (
            <div className="w-64 h-80 bg-neutral-800 flex items-center justify-center">
              Lienzo cargando...
            </div>
          )}

          {/* Wall Cast Contact Shadow */}
          <div className="absolute -bottom-10 left-4 right-4 h-8 bg-black/40 blur-xl -z-10 rounded-full transform scale-y-50" />

          {/* Authentic Real Life Dimensions Tag */}
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-neutral-900/90 text-white text-[10px] px-2.5 py-1 tracking-wider uppercase font-mono shadow-md border border-white/10">
            Escala: {Math.round(scale * 100)}% · {artwork.dimensions}
          </div>
        </div>

        {/* Camera Permission Error Notice */}
        {cameraError && !cameraActive && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 max-w-md w-[90%] bg-neutral-900/95 border border-amber-500/40 text-amber-200 p-4 text-xs flex items-start gap-3 shadow-2xl">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-white">Modo Simulador de Pared Activo</p>
              <p className="text-neutral-300 mt-1">{cameraError}</p>
              <button
                onClick={() => startCamera('environment')}
                className="mt-2 text-xs font-semibold text-amber-300 underline hover:text-white"
              >
                Reintentar acceso a cámara
              </button>
            </div>
          </div>
        )}

        {/* Captured Snapshot Preview Modal */}
        {capturedPhotoUrl && (
          <div className="absolute inset-0 z-30 bg-neutral-950/95 flex flex-col items-center justify-center p-6 animate-fadeIn">
            <h3 className="font-serif text-lg text-white mb-3">Foto AR Capturada</h3>
            <img
              src={capturedPhotoUrl}
              alt="AR Snapshot"
              className="max-h-[65vh] max-w-[90vw] object-contain border border-white/20 shadow-2xl mb-4"
            />
            <div className="flex items-center gap-3">
              <a
                href={capturedPhotoUrl}
                download={`museo-ar-${artwork.id}.jpg`}
                className="flex items-center gap-2 py-2 px-4 bg-white text-neutral-950 font-sans text-xs font-semibold tracking-wider uppercase hover:bg-neutral-200 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Guardar Imagen</span>
              </a>
              <button
                onClick={() => setCapturedPhotoUrl(null)}
                className="py-2 px-4 bg-neutral-800 hover:bg-neutral-700 text-white font-sans text-xs font-medium tracking-wider uppercase transition-colors"
              >
                Volver a la cámara
              </button>
            </div>
          </div>
        )}

        {/* Desktop QR Modal */}
        {showQrCode && (
          <div className="absolute inset-0 z-30 bg-neutral-950/95 flex flex-col items-center justify-center p-6 animate-fadeIn text-center">
            <h3 className="font-serif text-xl font-bold text-white mb-2">
              Ver en tu teléfono móvil
            </h3>
            <p className="text-xs text-neutral-400 max-w-md mb-6 font-sans">
              Escanea este código con la cámara de tu smartphone para colocar la pintura en tu
              pared en tiempo real.
            </p>

            {/* High-contrast generated SVG QR code */}
            <div className="p-4 bg-white rounded-lg shadow-2xl mb-6">
              <svg className="w-52 h-52" viewBox="0 0 100 100">
                <rect width="100" height="100" fill="#ffffff" />
                {/* QR Position Squares */}
                <rect x="10" y="10" width="24" height="24" fill="#000000" />
                <rect x="14" y="14" width="16" height="16" fill="#ffffff" />
                <rect x="18" y="18" width="8" height="8" fill="#000000" />

                <rect x="66" y="10" width="24" height="24" fill="#000000" />
                <rect x="70" y="14" width="16" height="16" fill="#ffffff" />
                <rect x="74" y="18" width="8" height="8" fill="#000000" />

                <rect x="10" y="66" width="24" height="24" fill="#000000" />
                <rect x="14" y="70" width="16" height="16" fill="#ffffff" />
                <rect x="18" y="74" width="8" height="8" fill="#000000" />

                {/* Simulated QR Payload Pattern */}
                <rect x="42" y="12" width="6" height="6" fill="#000000" />
                <rect x="52" y="16" width="6" height="6" fill="#000000" />
                <rect x="40" y="30" width="6" height="6" fill="#000000" />
                <rect x="50" y="40" width="8" height="8" fill="#000000" />
                <rect x="25" y="45" width="8" height="8" fill="#000000" />
                <rect x="70" y="45" width="8" height="8" fill="#000000" />
                <rect x="44" y="55" width="8" height="8" fill="#000000" />
                <rect x="60" y="65" width="6" height="6" fill="#000000" />
                <rect x="75" y="75" width="8" height="8" fill="#000000" />
                <rect x="42" y="78" width="6" height="6" fill="#000000" />
              </svg>
            </div>

            <button
              onClick={() => setShowQrCode(false)}
              className="py-2 px-6 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold tracking-wider uppercase"
            >
              Cerrar código
            </button>
          </div>
        )}
      </div>

      {/* Bottom AR Control Panel */}
      <div className="relative z-20 bg-neutral-950/90 backdrop-blur-md border-t border-white/10 px-4 py-4 sm:px-8 space-y-3">
        {/* Sliders and Options */}
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs font-sans">
          {/* Scale Slider */}
          <div className="flex items-center gap-3">
            <span className="text-neutral-400 whitespace-nowrap">Tamaño:</span>
            <input
              type="range"
              min="0.4"
              max="1.8"
              step="0.05"
              value={scale}
              onChange={(e) => setScale(parseFloat(e.target.value))}
              className="w-28 sm:w-36 accent-amber-400 cursor-pointer"
            />
            <span className="text-neutral-200 font-mono text-[11px] w-10">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={() => {
                setScale(1.0);
                setPosition({ x: 0, y: 0 });
              }}
              className="p-1 text-neutral-400 hover:text-white"
              title="Restablecer tamaño original 1:1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Frame Style Switcher */}
          <div className="flex items-center gap-2">
            <span className="text-neutral-400 whitespace-nowrap">Marco:</span>
            <div className="flex items-center gap-1.5">
              {(
                [
                  { id: 'black', label: 'Negro', bg: '#1a1a1a' },
                  { id: 'gold', label: 'Dorado', bg: '#c99a38' },
                  { id: 'wood', label: 'Nogal', bg: '#4a2e1b' },
                  { id: 'white', label: 'Blanco', bg: '#ffffff' },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFrameStyle(f.id)}
                  style={{ backgroundColor: f.bg }}
                  className={`w-6 h-6 rounded-full border transition-all ${
                    frameStyle === f.id
                      ? 'ring-2 ring-amber-400 scale-110 border-white'
                      : 'border-white/20 opacity-70 hover:opacity-100'
                  }`}
                  title={`Marco ${f.label}`}
                />
              ))}
            </div>
          </div>

          {/* Wall simulator background switcher if camera is off */}
          {!cameraActive && (
            <div className="flex items-center gap-2">
              <span className="text-neutral-400">Pared:</span>
              <button
                onClick={() => setWallMockupBg('white')}
                className={`px-2 py-1 text-[11px] ${
                  wallMockupBg === 'white' ? 'bg-white text-black' : 'bg-neutral-800 text-white'
                }`}
              >
                Blanca
              </button>
              <button
                onClick={() => setWallMockupBg('brick')}
                className={`px-2 py-1 text-[11px] ${
                  wallMockupBg === 'brick' ? 'bg-white text-black' : 'bg-neutral-800 text-white'
                }`}
              >
                Ladrillo
              </button>
              <button
                onClick={() => setWallMockupBg('concrete')}
                className={`px-2 py-1 text-[11px] ${
                  wallMockupBg === 'concrete' ? 'bg-white text-black' : 'bg-neutral-800 text-white'
                }`}
              >
                Hormigón
              </button>
            </div>
          )}
        </div>

        {/* Action Buttons Row */}
        <div className="flex items-center justify-between pt-2 border-t border-white/10">
          <div className="flex items-center gap-2">
            {cameraActive ? (
              <button
                onClick={toggleFacingMode}
                className="flex items-center gap-1.5 py-2 px-3 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-sans transition-colors"
                title="Cambiar entre cámara trasera y delantera"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Girar cámara</span>
              </button>
            ) : (
              <button
                onClick={() => startCamera('environment')}
                className="flex items-center gap-1.5 py-2 px-3 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-sans transition-colors"
              >
                <Camera className="w-3.5 h-3.5 text-amber-400" />
                <span>Activar cámara real</span>
              </button>
            )}
          </div>

          {/* Primary Camera Shutter / Take Snapshot */}
          <button
            onClick={takeSnapshot}
            className="flex items-center gap-2 py-2.5 px-6 bg-white text-neutral-950 font-serif text-xs font-bold tracking-wider uppercase hover:bg-neutral-200 transition-all shadow-lg active:scale-95"
          >
            <Camera className="w-4 h-4 fill-current" />
            <span>Tomar Foto en Pared</span>
          </button>
        </div>
      </div>
    </div>
  );
};
