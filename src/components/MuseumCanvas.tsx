import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { ARTWORKS } from '../data/artworks';
import { Artwork } from '../types/museum';
import { renderArtworkToCanvas } from '../utils/proceduralArt';

interface MuseumCanvasProps {
  scrollProgress: number; // 0 to 1
  onActiveArtworkChange: (artwork: Artwork | null, focusIntensity: number) => void;
}

export const MuseumCanvas: React.FC<MuseumCanvasProps> = ({
  scrollProgress,
  onActiveArtworkChange,
}) => {
  const mountDivRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const spotlightsRef = useRef<{ [artworkId: string]: THREE.SpotLight }>({});
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
  const currentCamPos = useRef(new THREE.Vector3(0, 1.75, 4));
  const currentLookAt = useRef(new THREE.Vector3(0, 1.75, -4));
  const reqIdRef = useRef<number>(0);

  // Smooth Hermite S-Curve helper
  const smoothstep = (t: number) => t * t * (3 - 2 * t);

  // Compute camera position and look target along the cinematic on-rails white hallway
  const computeCameraState = (progress: number) => {
    const t = Math.max(0, Math.min(1, progress));

    let camPos = new THREE.Vector3();
    let lookAt = new THREE.Vector3();
    let activeArt: Artwork | null = null;
    let focusIntensity = 0;

    // --- ENTRADA AL PASILLO BLANCO [0.00 -> 0.08] ---
    if (t < 0.08) {
      const localT = smoothstep(t / 0.08);
      const z = THREE.MathUtils.lerp(3.5, -2.5, localT);
      camPos.set(0, 1.75, z);
      lookAt.set(0, 1.75, z - 8);
    }
    // --- OBRA 1: VAN LEYDEN (MURO IZQUIERDO, Z = -6) ---
    // [0.08 -> 0.14]: Giro suave y aproximación hacia el cuadro
    else if (t < 0.14) {
      const localT = smoothstep((t - 0.08) / 0.06);
      const z = THREE.MathUtils.lerp(-2.5, -6.0, localT);
      const x = THREE.MathUtils.lerp(0, -1.15, localT);
      camPos.set(x, 1.75 + localT * 0.1, z);
      const targetX = THREE.MathUtils.lerp(0, -2.7, localT);
      const targetZ = THREE.MathUtils.lerp(z - 8, -6.0, localT);
      lookAt.set(targetX, 1.85, targetZ);
      activeArt = ARTWORKS[0];
      focusIntensity = localT;
    }
    // [0.14 -> 0.23]: ENFOQUE FRONTAL OBLIGADO A LA OBRA 1
    else if (t < 0.23) {
      camPos.set(-1.15, 1.85, -6.0);
      lookAt.set(-2.7, 1.85, -6.0);
      activeArt = ARTWORKS[0];
      focusIntensity = 1.0;
    }
    // [0.23 -> 0.28]: Giro de regreso al eje del pasillo y avance
    else if (t < 0.28) {
      const localT = smoothstep((t - 0.23) / 0.05);
      const z = THREE.MathUtils.lerp(-6.0, -9.5, localT);
      const x = THREE.MathUtils.lerp(-1.15, 0, localT);
      camPos.set(x, 1.85 - localT * 0.1, z);
      const targetX = THREE.MathUtils.lerp(-2.7, 0, localT);
      const targetZ = THREE.MathUtils.lerp(-6.0, z - 8, localT);
      lookAt.set(targetX, 1.75, targetZ);
      activeArt = ARTWORKS[0];
      focusIntensity = 1.0 - localT;
    }
    // --- CAMINATA RECTA A OBRA 2 [0.28 -> 0.31] ---
    else if (t < 0.31) {
      const localT = smoothstep((t - 0.28) / 0.03);
      const z = THREE.MathUtils.lerp(-9.5, -11.0, localT);
      camPos.set(0, 1.75, z);
      lookAt.set(0, 1.75, z - 8);
    }
    // --- OBRA 2: D'AUBIGNY (MURO DERECHO, Z = -13) ---
    // [0.31 -> 0.37]: Giro y aproximación al muro derecho
    else if (t < 0.37) {
      const localT = smoothstep((t - 0.31) / 0.06);
      const z = THREE.MathUtils.lerp(-11.0, -13.0, localT);
      const x = THREE.MathUtils.lerp(0, 1.15, localT);
      camPos.set(x, 1.75 + localT * 0.1, z);
      const targetX = THREE.MathUtils.lerp(0, 2.7, localT);
      const targetZ = THREE.MathUtils.lerp(z - 8, -13.0, localT);
      lookAt.set(targetX, 1.85, targetZ);
      activeArt = ARTWORKS[1];
      focusIntensity = localT;
    }
    // [0.37 -> 0.46]: ENFOQUE FRONTAL OBLIGADO A LA OBRA 2
    else if (t < 0.46) {
      camPos.set(1.15, 1.85, -13.0);
      lookAt.set(2.7, 1.85, -13.0);
      activeArt = ARTWORKS[1];
      focusIntensity = 1.0;
    }
    // [0.46 -> 0.51]: Giro de regreso al eje del pasillo y avance
    else if (t < 0.51) {
      const localT = smoothstep((t - 0.46) / 0.05);
      const z = THREE.MathUtils.lerp(-13.0, -16.5, localT);
      const x = THREE.MathUtils.lerp(1.15, 0, localT);
      camPos.set(x, 1.85 - localT * 0.1, z);
      const targetX = THREE.MathUtils.lerp(2.7, 0, localT);
      const targetZ = THREE.MathUtils.lerp(-13.0, z - 8, localT);
      lookAt.set(targetX, 1.75, targetZ);
      activeArt = ARTWORKS[1];
      focusIntensity = 1.0 - localT;
    }
    // --- CAMINATA RECTA A OBRA 3 [0.51 -> 0.54] ---
    else if (t < 0.54) {
      const localT = smoothstep((t - 0.51) / 0.03);
      const z = THREE.MathUtils.lerp(-16.5, -18.0, localT);
      camPos.set(0, 1.75, z);
      lookAt.set(0, 1.75, z - 8);
    }
    // --- OBRA 3: MONTICELLI (MURO IZQUIERDO, Z = -20) ---
    // [0.54 -> 0.60]: Giro y aproximación al muro izquierdo
    else if (t < 0.60) {
      const localT = smoothstep((t - 0.54) / 0.06);
      const z = THREE.MathUtils.lerp(-18.0, -20.0, localT);
      const x = THREE.MathUtils.lerp(0, -1.15, localT);
      camPos.set(x, 1.75 + localT * 0.1, z);
      const targetX = THREE.MathUtils.lerp(0, -2.7, localT);
      const targetZ = THREE.MathUtils.lerp(z - 8, -20.0, localT);
      lookAt.set(targetX, 1.85, targetZ);
      activeArt = ARTWORKS[2];
      focusIntensity = localT;
    }
    // [0.60 -> 0.69]: ENFOQUE FRONTAL OBLIGADO A LA OBRA 3
    else if (t < 0.69) {
      camPos.set(-1.15, 1.85, -20.0);
      lookAt.set(-2.7, 1.85, -20.0);
      activeArt = ARTWORKS[2];
      focusIntensity = 1.0;
    }
    // [0.69 -> 0.74]: Giro de regreso al pasillo y avance
    else if (t < 0.74) {
      const localT = smoothstep((t - 0.69) / 0.05);
      const z = THREE.MathUtils.lerp(-20.0, -23.5, localT);
      const x = THREE.MathUtils.lerp(-1.15, 0, localT);
      camPos.set(x, 1.85 - localT * 0.1, z);
      const targetX = THREE.MathUtils.lerp(-2.7, 0, localT);
      const targetZ = THREE.MathUtils.lerp(-20.0, z - 8, localT);
      lookAt.set(targetX, 1.75, targetZ);
      activeArt = ARTWORKS[2];
      focusIntensity = 1.0 - localT;
    }
    // --- CAMINATA RECTA A OBRA 4 [0.74 -> 0.77] ---
    else if (t < 0.77) {
      const localT = smoothstep((t - 0.74) / 0.03);
      const z = THREE.MathUtils.lerp(-23.5, -25.0, localT);
      camPos.set(0, 1.75, z);
      lookAt.set(0, 1.75, z - 8);
    }
    // --- OBRA 4: SFORZA (MURO DERECHO, Z = -27) ---
    // [0.77 -> 0.83]: Giro y aproximación al muro derecho
    else if (t < 0.83) {
      const localT = smoothstep((t - 0.77) / 0.06);
      const z = THREE.MathUtils.lerp(-25.0, -27.0, localT);
      const x = THREE.MathUtils.lerp(0, 1.15, localT);
      camPos.set(x, 1.75 + localT * 0.1, z);
      const targetX = THREE.MathUtils.lerp(0, 2.7, localT);
      const targetZ = THREE.MathUtils.lerp(z - 8, -27.0, localT);
      lookAt.set(targetX, 1.85, targetZ);
      activeArt = ARTWORKS[3];
      focusIntensity = localT;
    }
    // [0.83 -> 0.92]: ENFOQUE FRONTAL OBLIGADO A LA OBRA 4
    else if (t < 0.92) {
      camPos.set(1.15, 1.85, -27.0);
      lookAt.set(2.7, 1.85, -27.0);
      activeArt = ARTWORKS[3];
      focusIntensity = 1.0;
    }
    // [0.92 -> 0.95]: Giro de regreso al pasillo
    else if (t < 0.95) {
      const localT = smoothstep((t - 0.92) / 0.03);
      const z = THREE.MathUtils.lerp(-27.0, -30.0, localT);
      const x = THREE.MathUtils.lerp(1.15, 0, localT);
      camPos.set(x, 1.85 - localT * 0.1, z);
      const targetX = THREE.MathUtils.lerp(2.7, 0, localT);
      const targetZ = THREE.MathUtils.lerp(-27.0, -34.8, localT);
      lookAt.set(targetX, 1.95, targetZ);
      activeArt = ARTWORKS[3];
      focusIntensity = 1.0 - localT;
    }
    // --- OBRA 5: LINDQVIST (MURO FRONTAL DE REMATE, Z = -34.8) [0.95 -> 1.00] ---
    else {
      const localT = smoothstep((t - 0.95) / 0.05);
      const z = THREE.MathUtils.lerp(-30.0, -32.2, localT);
      camPos.set(0, 1.95, z);
      lookAt.set(0, 1.95, -34.8);
      activeArt = ARTWORKS[4];
      focusIntensity = localT;
    }

    return { camPos, lookAt, activeArt, focusIntensity };
  };

  useEffect(() => {
    const container = mountDivRef.current;
    if (!container) return;

    // --- 1. ESCENA PURA Y MINIMALISTA ---
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0xfbfbfb);
    scene.fog = new THREE.FogExp2(0xfbfbfb, 0.015);

    const width = container.clientWidth || window.innerWidth || 800;
    const height = container.clientHeight || window.innerHeight || 600;

    // --- 2. CÁMARA ---
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 75);
    cameraRef.current = camera;
    camera.position.copy(currentCamPos.current);
    camera.lookAt(currentLookAt.current);

    // --- 3. RENDERER CON SOMBRAS SUAVES ---
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Sombras suaves
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    container.appendChild(renderer.domElement);

    // --- 4. ILUMINACIÓN PURA ARQUITECTÓNICA ---
    // Luz ambiental suave para revelar sutilmente los volúmenes del espacio
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.58);
    ambientLightRef.current = ambientLight;
    scene.add(ambientLight);

    // Rebote sutil entre cielo blanco y suelo
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xefefef, 0.42);
    scene.add(hemiLight);

    // Luz cenital suave que proyecta sombras longitudinales
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.65);
    dirLight.position.set(0, 6, -12);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 45;
    dirLight.shadow.camera.left = -5;
    dirLight.shadow.camera.right = 5;
    dirLight.shadow.camera.top = 10;
    dirLight.shadow.camera.bottom = -40;
    dirLight.shadow.bias = -0.0002;
    dirLight.shadow.radius = 4.0; // Sombras muy suaves
    scene.add(dirLight);

    // --- 5. PASILLO ARQUITECTÓNICO TOTALMENTE LISO Y BLANCO ---
    const corridorLength = 48;
    const corridorWidth = 5.6;
    const corridorHeight = 4.4;

    // Suelo totalmente liso y blanco (sin líneas ni juntas; solo textura de brillo y sombras)
    const floorGeo = new THREE.PlaneGeometry(corridorWidth, corridorLength);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0xfdfdfd,
      roughness: 0.16, // Brillo sedoso muy sutil para atrapar el resplandor de la luz
      metalness: 0.02,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, -corridorLength / 2 + 5);
    floor.receiveShadow = true;
    scene.add(floor);

    // Techo totalmente liso y blanco (sin rieles, sin canaletas ni accesorios)
    const ceilingGeo = new THREE.PlaneGeometry(corridorWidth, corridorLength);
    const ceilingMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.92,
    });
    const ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(0, corridorHeight, -corridorLength / 2 + 5);
    ceiling.receiveShadow = true;
    scene.add(ceiling);

    // Muros continuos inmaculados
    const wallGeo = new THREE.PlaneGeometry(corridorLength, corridorHeight);
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0xfbfbfb,
      roughness: 0.88,
    });

    // Muro izquierdo
    const leftWall = new THREE.Mesh(wallGeo, wallMat);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(-corridorWidth / 2, corridorHeight / 2, -corridorLength / 2 + 5);
    leftWall.receiveShadow = true;
    scene.add(leftWall);

    // Muro derecho
    const rightWall = new THREE.Mesh(wallGeo, wallMat);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.position.set(corridorWidth / 2, corridorHeight / 2, -corridorLength / 2 + 5);
    rightWall.receiveShadow = true;
    scene.add(rightWall);

    // Muro frontal de remate
    const backWallGeo = new THREE.PlaneGeometry(corridorWidth, corridorHeight);
    const backWall = new THREE.Mesh(backWallGeo, wallMat);
    backWall.position.set(0, corridorHeight / 2, -corridorLength + 5);
    backWall.receiveShadow = true;
    scene.add(backWall);

    // --- 6. PINTURAS CON MARCOS FINOS Y FOCOS INVISIBLES DE ILUMINACIÓN ---
    ARTWORKS.forEach((art) => {
      const artGroup = new THREE.Group();
      artGroup.position.set(
        art.locationInGallery.x,
        art.locationInGallery.y,
        art.locationInGallery.z
      );
      artGroup.rotation.y = art.locationInGallery.rotationY;

      // Textura del lienzo en alta resolución
      const artCanvas = renderArtworkToCanvas(art.id, 1200, 1600);
      const texture = new THREE.CanvasTexture(artCanvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.magFilter = THREE.LinearFilter;

      // Lienzo
      const canvasW = art.locationInGallery.width;
      const canvasH = art.locationInGallery.height;
      const canvasGeo = new THREE.PlaneGeometry(canvasW, canvasH);
      const canvasMat = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.38,
      });
      const canvasMesh = new THREE.Mesh(canvasGeo, canvasMat);
      canvasMesh.position.z = 0.04;
      canvasMesh.castShadow = true;
      canvasMesh.receiveShadow = true;
      artGroup.add(canvasMesh);

      // Marco minimalista refinado con bisel suave
      const frameDepth = 0.06;
      const borderThickness = 0.045;
      const outerW = canvasW + borderThickness * 2;
      const outerH = canvasH + borderThickness * 2;
      const frameMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(art.frameColor),
        roughness: 0.3,
        metalness: 0.2,
      });

      // Fondo del marco
      const backing = new THREE.Mesh(new THREE.BoxGeometry(outerW, outerH, 0.02), frameMat);
      backing.position.z = 0.01;
      backing.castShadow = true;
      artGroup.add(backing);

      // Listones del marco
      const topBar = new THREE.Mesh(new THREE.BoxGeometry(outerW, borderThickness, frameDepth), frameMat);
      topBar.position.set(0, outerH / 2 - borderThickness / 2, frameDepth / 2);
      topBar.castShadow = true;
      artGroup.add(topBar);

      const bottomBar = new THREE.Mesh(new THREE.BoxGeometry(outerW, borderThickness, frameDepth), frameMat);
      bottomBar.position.set(0, -outerH / 2 + borderThickness / 2, frameDepth / 2);
      bottomBar.castShadow = true;
      artGroup.add(bottomBar);

      const leftBar = new THREE.Mesh(new THREE.BoxGeometry(borderThickness, canvasH, frameDepth), frameMat);
      leftBar.position.set(-canvasW / 2 - borderThickness / 2, 0, frameDepth / 2);
      leftBar.castShadow = true;
      artGroup.add(leftBar);

      const rightBar = new THREE.Mesh(new THREE.BoxGeometry(borderThickness, canvasH, frameDepth), frameMat);
      rightBar.position.set(canvasW / 2 + borderThickness / 2, 0, frameDepth / 2);
      rightBar.castShadow = true;
      artGroup.add(rightBar);

      scene.add(artGroup);

      // Foco cenital dinámico (invisible, integrado en el techo liso)
      const isCentral = art.id === 'constructivism';
      const spotLight = new THREE.SpotLight(0xfff6ea, 0.8, 15, Math.PI / 4, 0.5, 1.2);
      const spotX = art.locationInGallery.wall === 'left' ? -1.5 : (isCentral ? 0 : 1.5);
      const spotZ = isCentral ? art.locationInGallery.z + 3.0 : art.locationInGallery.z;
      spotLight.position.set(spotX, corridorHeight - 0.02, spotZ);

      const spotTarget = new THREE.Object3D();
      spotTarget.position.set(art.locationInGallery.x, art.locationInGallery.y, art.locationInGallery.z);
      scene.add(spotTarget);
      spotLight.target = spotTarget;

      spotLight.castShadow = true;
      spotLight.shadow.mapSize.width = 1024;
      spotLight.shadow.mapSize.height = 1024;
      spotLight.shadow.bias = -0.0001;
      spotLight.shadow.radius = 3.0;

      scene.add(spotLight);
      spotlightsRef.current[art.id] = spotLight;
    });

    // --- 7. REDIMENSIONAMIENTO ---
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth || window.innerWidth || 800;
      const h = container.clientHeight || window.innerHeight || 600;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // --- 8. CICLO DE RENDERIZADO CINEMATOGRÁFICO ---
    let lastActiveId: string | null = null;

    const animate = () => {
      reqIdRef.current = requestAnimationFrame(animate);

      const { camPos: targetPos, lookAt: targetLookAt, activeArt, focusIntensity } = computeCameraState(
        scrollProgress
      );

      // Interpolación suave y orgánica
      currentCamPos.current.lerp(targetPos, 0.09);
      currentLookAt.current.lerp(targetLookAt, 0.09);

      if (cameraRef.current) {
        cameraRef.current.position.copy(currentCamPos.current);
        cameraRef.current.lookAt(currentLookAt.current);
      }

      // Modulación de luz: el foco de la obra enfocada brilla intensamente
      ARTWORKS.forEach((art) => {
        const spot = spotlightsRef.current[art.id];
        if (spot) {
          const isThisArt = activeArt?.id === art.id;
          const targetIntensity = isThisArt ? 1.0 + focusIntensity * 3.2 : 0.5;
          spot.intensity = THREE.MathUtils.lerp(spot.intensity, targetIntensity, 0.09);
        }
      });

      // La luz ambiental se atenúa delicadamente al enfocar la pintura
      if (ambientLightRef.current) {
        const targetAmb = 0.58 - focusIntensity * 0.25;
        ambientLightRef.current.intensity = THREE.MathUtils.lerp(
          ambientLightRef.current.intensity,
          targetAmb,
          0.09
        );
      }

      const currentId = activeArt ? activeArt.id : null;
      if (currentId !== lastActiveId || focusIntensity > 0.01) {
        lastActiveId = currentId;
        onActiveArtworkChange(activeArt, focusIntensity);
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(reqIdRef.current);
      window.removeEventListener('resize', handleResize);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountDivRef}
      className="fixed inset-0 w-full h-full pointer-events-none select-none"
    />
  );
};
