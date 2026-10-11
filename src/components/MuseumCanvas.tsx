import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { ARTWORKS } from '../data/artworks';
import { Artwork, LightingPreset } from '../types/museum';
import { renderArtworkToCanvas } from '../utils/proceduralArt';

interface MuseumCanvasProps {
  scrollProgress: number; // 0 to 1
  lightingPreset: LightingPreset;
  onActiveArtworkChange: (artwork: Artwork | null, proximity: number) => void;
  onArtworkClick: (artwork: Artwork) => void;
  focusedArtworkId: string | null;
}

interface CameraWaypoint {
  progress: number;
  camPos: THREE.Vector3;
  targetPos: THREE.Vector3;
  artworkId?: string;
  isFocusedOnArt?: boolean;
}

export const MuseumCanvas: React.FC<MuseumCanvasProps> = ({
  scrollProgress,
  lightingPreset,
  onActiveArtworkChange,
  onArtworkClick,
  focusedArtworkId,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const spotlightsRef = useRef<{ [artworkId: string]: THREE.SpotLight }>({});
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
  const dirLightRef = useRef<THREE.DirectionalLight | null>(null);
  const spectatorLightRef = useRef<THREE.PointLight | null>(null);
  const paintingMeshesRef = useRef<{ [artworkId: string]: THREE.Group }>({});
  const currentCamPos = useRef(new THREE.Vector3(0, 1.8, 4));
  const currentLookAt = useRef(new THREE.Vector3(0, 1.8, -5));
  const reqIdRef = useRef<number>(0);
  const isDraggingRef = useRef(false);
  const previousMousePos = useRef({ x: 0, y: 0 });
  const userLookOffset = useRef(new THREE.Vector2(0, 0));

  // Compute camera path waypoints through the white museum corridor
  const waypoints = useRef<CameraWaypoint[]>([
    // Start / Entrance
    {
      progress: 0.0,
      camPos: new THREE.Vector3(0, 1.8, 3.5),
      targetPos: new THREE.Vector3(0, 1.8, -5),
    },
    // Approaching Hallway entry
    {
      progress: 0.08,
      camPos: new THREE.Vector3(0, 1.8, -1.5),
      targetPos: new THREE.Vector3(-0.6, 1.8, -6),
    },
    // Artwork 1 - Van Leyden (Left Wall Z = -6)
    {
      progress: 0.18,
      camPos: new THREE.Vector3(-1.15, 1.85, -6.0),
      targetPos: new THREE.Vector3(-2.7, 1.85, -6.0),
      artworkId: 'chiaroscuro',
      isFocusedOnArt: true,
    },
    // Transition 1 -> 2: Turning back down hallway
    {
      progress: 0.28,
      camPos: new THREE.Vector3(0, 1.8, -9.5),
      targetPos: new THREE.Vector3(0.6, 1.8, -13),
    },
    // Artwork 2 - Impressionism (Right Wall Z = -13)
    {
      progress: 0.38,
      camPos: new THREE.Vector3(1.15, 1.85, -13.0),
      targetPos: new THREE.Vector3(2.7, 1.85, -13.0),
      artworkId: 'impressionism',
      isFocusedOnArt: true,
    },
    // Transition 2 -> 3: Turning back down hallway
    {
      progress: 0.48,
      camPos: new THREE.Vector3(0, 1.8, -16.5),
      targetPos: new THREE.Vector3(-0.6, 1.8, -20),
    },
    // Artwork 3 - Surrealism (Left Wall Z = -20)
    {
      progress: 0.58,
      camPos: new THREE.Vector3(-1.15, 1.85, -20.0),
      targetPos: new THREE.Vector3(-2.7, 1.85, -20.0),
      artworkId: 'surrealism',
      isFocusedOnArt: true,
    },
    // Transition 3 -> 4: Turning back down hallway
    {
      progress: 0.68,
      camPos: new THREE.Vector3(0, 1.8, -23.5),
      targetPos: new THREE.Vector3(0.6, 1.8, -27),
    },
    // Artwork 4 - Ultramarine (Right Wall Z = -27)
    {
      progress: 0.78,
      camPos: new THREE.Vector3(1.15, 1.85, -27.0),
      targetPos: new THREE.Vector3(2.7, 1.85, -27.0),
      artworkId: 'ultramarine',
      isFocusedOnArt: true,
    },
    // Transition 4 -> 5: Moving into the grand end gallery
    {
      progress: 0.88,
      camPos: new THREE.Vector3(0, 1.85, -30.5),
      targetPos: new THREE.Vector3(0, 1.95, -34.8),
    },
    // Artwork 5 - Constructivism (Back Wall Z = -34.8)
    {
      progress: 1.0,
      camPos: new THREE.Vector3(0, 1.95, -32.0),
      targetPos: new THREE.Vector3(0, 1.95, -34.8),
      artworkId: 'constructivism',
      isFocusedOnArt: true,
    },
  ]).current;

  // Interpolate camera position and target between waypoints
  const getCameraTarget = (t: number) => {
    // If user clicked a specific artwork to focus, lock to that artwork's target
    if (focusedArtworkId) {
      const art = ARTWORKS.find((a) => a.id === focusedArtworkId);
      if (art) {
        return {
          pos: new THREE.Vector3(...art.cameraTarget.pos),
          target: new THREE.Vector3(...art.cameraTarget.lookAt),
          activeArt: art,
          proximity: 1.0,
        };
      }
    }

    const clampedT = Math.max(0, Math.min(1, t));

    // Find bounding waypoints
    let p0 = waypoints[0];
    let p1 = waypoints[waypoints.length - 1];

    for (let i = 0; i < waypoints.length - 1; i++) {
      if (clampedT >= waypoints[i].progress && clampedT <= waypoints[i + 1].progress) {
        p0 = waypoints[i];
        p1 = waypoints[i + 1];
        break;
      }
    }

    const range = p1.progress - p0.progress || 1;
    const localT = (clampedT - p0.progress) / range;
    // Smooth cubic easing
    const smoothT = localT * localT * (3 - 2 * localT);

    const pos = new THREE.Vector3().lerpVectors(p0.camPos, p1.camPos, smoothT);
    const target = new THREE.Vector3().lerpVectors(p0.targetPos, p1.targetPos, smoothT);

    // Determine active artwork
    let activeArt: Artwork | null = null;
    let proximity = 0;

    for (const wp of waypoints) {
      if (wp.artworkId && wp.isFocusedOnArt) {
        const dist = Math.abs(clampedT - wp.progress);
        if (dist < 0.08) {
          activeArt = ARTWORKS.find((a) => a.id === wp.artworkId) || null;
          proximity = Math.max(0, 1 - dist / 0.08);
          break;
        }
      }
    }

    return { pos, target, activeArt, proximity };
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // --- 1. SCENE SETUP ---
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0xfcfcfc);
    scene.fog = new THREE.FogExp2(0xfcfcfc, 0.018); // Soft infinite white museum depth

    const width = container.clientWidth || window.innerWidth || 800;
    const height = container.clientHeight || window.innerHeight || 600;

    // --- 2. CAMERA SETUP ---
    const camera = new THREE.PerspectiveCamera(
      52,
      width / height,
      0.1,
      80
    );
    cameraRef.current = camera;
    camera.position.copy(currentCamPos.current);
    camera.lookAt(currentLookAt.current);

    // --- 3. RENDERER SETUP (Soft Shadows & Filmic ACES Tone Mapping) ---
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Soft realistic shadows
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    container.appendChild(renderer.domElement);

    // --- 4. LIGHTING SYSTEM ---
    // Ambient Light (subtle white gallery bounce)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.55);
    ambientLightRef.current = ambientLight;
    scene.add(ambientLight);

    // Hemisphere Light (sky white to floor reflection)
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xe2e2e2, 0.45);
    scene.add(hemiLight);

    // Directional Skylight through modern museum architectural ceiling slots
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.75);
    dirLight.position.set(0, 6, -10);
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
    dirLight.shadow.radius = 3.5; // Soft shadow radius
    dirLightRef.current = dirLight;
    scene.add(dirLight);

    // Dynamic Spectator Light (moves gently with the user's camera)
    const spectatorLight = new THREE.PointLight(0xfff8ee, 0.5, 9, 1.2);
    spectatorLight.position.copy(camera.position);
    spectatorLightRef.current = spectatorLight;
    scene.add(spectatorLight);

    // --- 5. ARCHITECTURAL WHITE MUSEUM HALLWAY GEOMETRY ---
    const corridorLength = 46;
    const corridorWidth = 5.6;
    const corridorHeight = 4.4;

    // A. FLOOR: Polished white architectural limestone / terrazzo with soft sheen
    const floorGeo = new THREE.PlaneGeometry(corridorWidth, corridorLength, 32, 64);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0xf3f3f3,
      roughness: 0.18, // Subtle museum floor reflection
      metalness: 0.04,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, -corridorLength / 2 + 5);
    floor.receiveShadow = true;
    scene.add(floor);

    // Floor Expansion Joints / Subtle Terrazzo Tiles Grid (elegant architectural hairlines)
    const gridGeo = new THREE.BufferGeometry();
    const gridPoints: number[] = [];
    const tileSpacing = 2.0;
    for (let z = 5; z >= -corridorLength + 5; z -= tileSpacing) {
      gridPoints.push(-corridorWidth / 2, 0.002, z);
      gridPoints.push(corridorWidth / 2, 0.002, z);
    }
    gridGeo.setAttribute('position', new THREE.Float32BufferAttribute(gridPoints, 3));
    const gridMat = new THREE.LineBasicMaterial({
      color: 0xe0e0e0,
      transparent: true,
      opacity: 0.6,
    });
    const floorGrid = new THREE.LineSegments(gridGeo, gridMat);
    scene.add(floorGrid);

    // B. CEILING: Clean white ceiling with recessed linear light channels
    const ceilingGeo = new THREE.PlaneGeometry(corridorWidth, corridorLength);
    const ceilingMat = new THREE.MeshStandardMaterial({
      color: 0xfcfcfc,
      roughness: 0.85,
    });
    const ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(0, corridorHeight, -corridorLength / 2 + 5);
    ceiling.receiveShadow = true;
    scene.add(ceiling);

    // C. WALLS: Pristine white gallery plaster walls
    const wallGeo = new THREE.PlaneGeometry(corridorLength, corridorHeight);
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0xfbfbfb,
      roughness: 0.88,
      metalness: 0.01,
    });

    // Left Wall
    const leftWall = new THREE.Mesh(wallGeo, wallMat);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(-corridorWidth / 2, corridorHeight / 2, -corridorLength / 2 + 5);
    leftWall.receiveShadow = true;
    scene.add(leftWall);

    // Right Wall
    const rightWall = new THREE.Mesh(wallGeo, wallMat);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.position.set(corridorWidth / 2, corridorHeight / 2, -corridorLength / 2 + 5);
    rightWall.receiveShadow = true;
    scene.add(rightWall);

    // Back Focal Wall (End of Hallway alcove)
    const backWallGeo = new THREE.PlaneGeometry(corridorWidth, corridorHeight);
    const backWall = new THREE.Mesh(backWallGeo, wallMat);
    backWall.position.set(0, corridorHeight / 2, -corridorLength + 5);
    backWall.receiveShadow = true;
    scene.add(backWall);

    // Entrance Wall
    const frontWall = new THREE.Mesh(backWallGeo, wallMat);
    frontWall.rotation.y = Math.PI;
    frontWall.position.set(0, corridorHeight / 2, 5);
    frontWall.receiveShadow = true;
    scene.add(frontWall);

    // D. ARCHITECTURAL BASEBOARDS (Modern minimalist recessed shadow reveals)
    const baseboardMat = new THREE.MeshStandardMaterial({
      color: 0xdedede,
      roughness: 0.5,
    });
    const baseboardGeo = new THREE.BoxGeometry(0.04, 0.08, corridorLength);
    const leftBaseboard = new THREE.Mesh(baseboardGeo, baseboardMat);
    leftBaseboard.position.set(-corridorWidth / 2 + 0.02, 0.04, -corridorLength / 2 + 5);
    scene.add(leftBaseboard);

    const rightBaseboard = new THREE.Mesh(baseboardGeo, baseboardMat);
    rightBaseboard.position.set(corridorWidth / 2 - 0.02, 0.04, -corridorLength / 2 + 5);
    scene.add(rightBaseboard);

    // E. CEILING TRACK LIGHT RAILS (Two matte bronze/black extruded tracks running overhead)
    const trackMat = new THREE.MeshStandardMaterial({
      color: 0x1e1e1e,
      roughness: 0.3,
      metalness: 0.8,
    });
    const trackGeo = new THREE.BoxGeometry(0.06, 0.06, corridorLength);
    const leftTrack = new THREE.Mesh(trackGeo, trackMat);
    leftTrack.position.set(-1.6, corridorHeight - 0.03, -corridorLength / 2 + 5);
    scene.add(leftTrack);

    const rightTrack = new THREE.Mesh(trackGeo, trackMat);
    rightTrack.position.set(1.6, corridorHeight - 0.03, -corridorLength / 2 + 5);
    scene.add(rightTrack);

    // F. ARCHITECTURAL PORTAL BEAMS (Dividing gallery wings subtly)
    [-10, -23.5].forEach((portalZ) => {
      const portalBeamGeo = new THREE.BoxGeometry(corridorWidth, 0.35, 0.4);
      const portalBeam = new THREE.Mesh(portalBeamGeo, wallMat);
      portalBeam.position.set(0, corridorHeight - 0.175, portalZ);
      portalBeam.castShadow = true;
      scene.add(portalBeam);

      const columnGeo = new THREE.BoxGeometry(0.35, corridorHeight, 0.4);
      const leftCol = new THREE.Mesh(columnGeo, wallMat);
      leftCol.position.set(-corridorWidth / 2 + 0.175, corridorHeight / 2, portalZ);
      leftCol.castShadow = true;
      leftCol.receiveShadow = true;
      scene.add(leftCol);

      const rightCol = new THREE.Mesh(columnGeo, wallMat);
      rightCol.position.set(corridorWidth / 2 - 0.175, corridorHeight / 2, portalZ);
      rightCol.castShadow = true;
      rightCol.receiveShadow = true;
      scene.add(rightCol);
    });

    // --- 6. ARTWORKS, 3D FRAMES & DYNAMIC SPOTLIGHTS ---
    ARTWORKS.forEach((art) => {
      const artGroup = new THREE.Group();
      artGroup.position.set(art.locationInGallery.x, art.locationInGallery.y, art.locationInGallery.z);
      artGroup.rotation.y = art.locationInGallery.rotationY;

      // 1. Generate high-res canvas texture procedurally
      const artCanvas = renderArtworkToCanvas(art.id, 1200, 1600);
      const texture = new THREE.CanvasTexture(artCanvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.generateMipmaps = true;

      // 2. Painting Canvas Mesh
      const canvasW = art.locationInGallery.width;
      const canvasH = art.locationInGallery.height;
      const canvasGeo = new THREE.PlaneGeometry(canvasW, canvasH);
      const canvasMat = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.42,
        metalness: 0.02,
      });
      const canvasMesh = new THREE.Mesh(canvasGeo, canvasMat);
      canvasMesh.position.z = 0.045; // Front of frame backing
      canvasMesh.castShadow = true;
      canvasMesh.receiveShadow = true;
      // Tag for raycasting
      canvasMesh.userData = { artworkId: art.id };
      artGroup.add(canvasMesh);

      // 3. 3D Architectural Frame (Outer border with bevel)
      const frameDepth = 0.08;
      const borderThickness = 0.07;
      const outerW = canvasW + borderThickness * 2;
      const outerH = canvasH + borderThickness * 2;

      const frameMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(art.frameColor),
        roughness: 0.35,
        metalness: 0.25,
      });

      // Frame Backing
      const backingGeo = new THREE.BoxGeometry(outerW, outerH, 0.03);
      const backingMesh = new THREE.Mesh(backingGeo, frameMat);
      backingMesh.position.z = 0.015;
      backingMesh.castShadow = true;
      artGroup.add(backingMesh);

      // Frame Bezel Profiles (Top, Bottom, Left, Right)
      const topBarGeo = new THREE.BoxGeometry(outerW, borderThickness, frameDepth);
      const topBar = new THREE.Mesh(topBarGeo, frameMat);
      topBar.position.set(0, outerH / 2 - borderThickness / 2, frameDepth / 2);
      topBar.castShadow = true;
      artGroup.add(topBar);

      const bottomBar = new THREE.Mesh(topBarGeo, frameMat);
      bottomBar.position.set(0, -outerH / 2 + borderThickness / 2, frameDepth / 2);
      bottomBar.castShadow = true;
      artGroup.add(bottomBar);

      const sideBarGeo = new THREE.BoxGeometry(borderThickness, canvasH, frameDepth);
      const leftBar = new THREE.Mesh(sideBarGeo, frameMat);
      leftBar.position.set(-canvasW / 2 - borderThickness / 2, 0, frameDepth / 2);
      leftBar.castShadow = true;
      artGroup.add(leftBar);

      const rightBar = new THREE.Mesh(sideBarGeo, frameMat);
      rightBar.position.set(canvasW / 2 + borderThickness / 2, 0, frameDepth / 2);
      rightBar.castShadow = true;
      artGroup.add(rightBar);

      // Protective Anti-Reflective Glass Plane
      const glassMat = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.12,
        roughness: 0.08,
        metalness: 0.1,
        transmission: 0.9,
      });
      const glassMesh = new THREE.Mesh(canvasGeo, glassMat);
      glassMesh.position.z = 0.065;
      artGroup.add(glassMesh);

      // 4. Museum Wall Placard (Cédula Museográfica)
      const placardW = 0.32;
      const placardH = 0.24;
      const placardCanvas = document.createElement('canvas');
      placardCanvas.width = 512;
      placardCanvas.height = 384;
      const pCtx = placardCanvas.getContext('2d');
      if (pCtx) {
        pCtx.fillStyle = '#ffffff';
        pCtx.fillRect(0, 0, 512, 384);
        pCtx.strokeStyle = '#e0e0e0';
        pCtx.lineWidth = 4;
        pCtx.strokeRect(4, 4, 504, 376);

        pCtx.fillStyle = '#111111';
        pCtx.font = 'bold 30px "Cinzel", Georgia, serif';
        pCtx.fillText(art.artist, 32, 68);

        pCtx.fillStyle = '#555555';
        pCtx.font = 'italic 24px "Plus Jakarta Sans", sans-serif';
        pCtx.fillText(`${art.title}, ${art.year}`, 32, 114);

        pCtx.fillStyle = '#888888';
        pCtx.font = '19px "Plus Jakarta Sans", sans-serif';
        pCtx.fillText(art.medium.slice(0, 36), 32, 160);
        pCtx.fillText(art.dimensions, 32, 196);

        // QR / Headphone audio guide icon representation
        pCtx.fillStyle = '#111111';
        pCtx.fillRect(32, 240, 60, 60);
        pCtx.fillStyle = '#ffffff';
        pCtx.font = 'bold 18px sans-serif';
        pCtx.fillText('AR/♫', 38, 276);

        pCtx.fillStyle = '#666666';
        pCtx.font = '18px "Plus Jakarta Sans", sans-serif';
        pCtx.fillText('Cédula Oficial · Pulsa para info', 106, 276);
      }
      const placardTex = new THREE.CanvasTexture(placardCanvas);
      placardTex.colorSpace = THREE.SRGBColorSpace;
      const placardGeo = new THREE.PlaneGeometry(placardW, placardH);
      const placardMat = new THREE.MeshStandardMaterial({
        map: placardTex,
        roughness: 0.6,
      });
      const placardMesh = new THREE.Mesh(placardGeo, placardMat);
      // Place placard to the side of the painting
      const isCentral = art.id === 'constructivism';
      const placardOffsetSide = isCentral ? outerW / 2 + 0.35 : (art.locationInGallery.wall === 'left' ? outerW / 2 + 0.32 : -outerW / 2 - 0.32);
      placardMesh.position.set(placardOffsetSide, -canvasH / 3, 0.02);
      placardMesh.userData = { artworkId: art.id };
      artGroup.add(placardMesh);

      scene.add(artGroup);
      paintingMeshesRef.current[art.id] = artGroup;

      // 5. Dedicated Ceiling Track Spotlight
      // Mounted directly on the ceiling rail and pointed at the artwork center
      const spotLight = new THREE.SpotLight(0xfff6ea, 1.8, 14, Math.PI / 4, 0.5, 1.2);
      // Position spotlight near ceiling track
      const trackX = art.locationInGallery.wall === 'left' ? -1.6 : (isCentral ? 0 : 1.6);
      const spotZ = isCentral ? art.locationInGallery.z + 3.0 : art.locationInGallery.z;
      spotLight.position.set(trackX, corridorHeight - 0.15, spotZ);

      // Target the painting
      const spotTarget = new THREE.Object3D();
      spotTarget.position.set(art.locationInGallery.x, art.locationInGallery.y, art.locationInGallery.z);
      scene.add(spotTarget);
      spotLight.target = spotTarget;

      spotLight.castShadow = true;
      spotLight.shadow.mapSize.width = 1024;
      spotLight.shadow.mapSize.height = 1024;
      spotLight.shadow.bias = -0.0001;
      spotLight.shadow.radius = 2.5;

      scene.add(spotLight);
      spotlightsRef.current[art.id] = spotLight;

      // Physical Spotlight Fixture Model on Ceiling Track
      const fixtureMat = new THREE.MeshStandardMaterial({
        color: 0x222222,
        roughness: 0.3,
        metalness: 0.8,
      });
      const fixtureArmGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.15);
      const fixtureArm = new THREE.Mesh(fixtureArmGeo, fixtureMat);
      fixtureArm.position.copy(spotLight.position);
      fixtureArm.position.y += 0.075;
      scene.add(fixtureArm);

      const fixtureCanGeo = new THREE.CylinderGeometry(0.06, 0.04, 0.16);
      const fixtureCan = new THREE.Mesh(fixtureCanGeo, fixtureMat);
      fixtureCan.position.copy(spotLight.position);
      fixtureCan.lookAt(spotTarget.position);
      fixtureCan.rotateX(Math.PI / 2);
      scene.add(fixtureCan);
    });

    // --- 7. RAYCASTING & INTERACTION HANDLER ---
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      previousMousePos.current = { x: e.clientX, y: e.clientY };
    };

    const handlePointerMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const deltaX = e.clientX - previousMousePos.current.x;
      const deltaY = e.clientY - previousMousePos.current.y;
      previousMousePos.current = { x: e.clientX, y: e.clientY };

      // Subtle look-around parallax pan (dampened so it preserves museum aesthetic)
      userLookOffset.current.x = Math.max(-0.6, Math.min(0.6, userLookOffset.current.x + deltaX * 0.0012));
      userLookOffset.current.y = Math.max(-0.35, Math.min(0.35, userLookOffset.current.y - deltaY * 0.0012));
    };

    const handlePointerUp = () => {
      isDraggingRef.current = false;
    };

    const handleClick = (e: MouseEvent) => {
      if (!cameraRef.current || !rendererRef.current) return;
      const rect = rendererRef.current.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, cameraRef.current);
      const intersects = raycaster.intersectObjects(scene.children, true);

      for (const hit of intersects) {
        let obj: THREE.Object3D | null = hit.object;
        while (obj) {
          if (obj.userData?.artworkId) {
            const hitArt = ARTWORKS.find((a) => a.id === obj?.userData.artworkId);
            if (hitArt) {
              onArtworkClick(hitArt);
              return;
            }
          }
          obj = obj.parent;
        }
      }
    };

    const canvasDom = renderer.domElement;
    canvasDom.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    canvasDom.addEventListener('click', handleClick);

    // --- 8. RESIZE LISTENER ---
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth || window.innerWidth || 800;
      const h = container.clientHeight || window.innerHeight || 600;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // --- 9. ANIMATION LOOP ---
    let lastActiveArtId: string | null = null;

    const animate = () => {
      reqIdRef.current = requestAnimationFrame(animate);

      // Ease look offset smoothly back toward 0 when not dragging
      if (!isDraggingRef.current) {
        userLookOffset.current.x *= 0.94;
        userLookOffset.current.y *= 0.94;
      }

      // Compute target camera coordinates based on current scroll progress
      const { pos: targetCamPos, target: targetLookAt, activeArt, proximity } = getCameraTarget(
        scrollProgress
      );

      // Smooth camera interpolation (lerping)
      currentCamPos.current.lerp(targetCamPos, 0.07);
      currentLookAt.current.lerp(targetLookAt, 0.07);

      if (cameraRef.current) {
        cameraRef.current.position.copy(currentCamPos.current);
        const finalLookAt = currentLookAt.current.clone();
        finalLookAt.x += userLookOffset.current.x * 1.5;
        finalLookAt.y += userLookOffset.current.y * 1.2;
        cameraRef.current.lookAt(finalLookAt);
      }

      // Update moving spectator light
      if (spectatorLightRef.current) {
        spectatorLightRef.current.position.copy(currentCamPos.current);
      }

      // Update dynamic spotlights based on proximity
      ARTWORKS.forEach((art) => {
        const spot = spotlightsRef.current[art.id];
        if (spot) {
          const isActive = activeArt?.id === art.id;
          const targetIntensity = isActive
            ? 1.5 + proximity * 2.2
            : 0.8; // Standby gentle illumination
          spot.intensity = THREE.MathUtils.lerp(spot.intensity, targetIntensity, 0.08);
        }
      });

      // Notify parent about active artwork
      const currentActiveId = activeArt ? activeArt.id : null;
      if (currentActiveId !== lastActiveArtId || proximity > 0.01) {
        lastActiveArtId = currentActiveId;
        onActiveArtworkChange(activeArt, proximity);
      }

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(reqIdRef.current);
      window.removeEventListener('resize', handleResize);
      canvasDom.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      canvasDom.removeEventListener('click', handleClick);

      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []); // Run once on mount

  // React to lighting preset changes
  useEffect(() => {
    if (!rendererRef.current || !ambientLightRef.current || !dirLightRef.current) return;

    if (lightingPreset === 'balanced') {
      rendererRef.current.toneMappingExposure = 1.05;
      ambientLightRef.current.intensity = 0.55;
      ambientLightRef.current.color.setHex(0xffffff);
      dirLightRef.current.intensity = 0.75;
      dirLightRef.current.color.setHex(0xffffff);
      if (sceneRef.current) {
        sceneRef.current.background = new THREE.Color(0xfcfcfc);
        if (sceneRef.current.fog) sceneRef.current.fog.color.setHex(0xfcfcfc);
      }
    } else if (lightingPreset === 'dramatic') {
      rendererRef.current.toneMappingExposure = 0.95;
      ambientLightRef.current.intensity = 0.28;
      ambientLightRef.current.color.setHex(0xf0e6dc);
      dirLightRef.current.intensity = 0.45;
      dirLightRef.current.color.setHex(0xffecd2);
      if (sceneRef.current) {
        sceneRef.current.background = new THREE.Color(0xeeeae4);
        if (sceneRef.current.fog) sceneRef.current.fog.color.setHex(0xeeeae4);
      }
    } else if (lightingPreset === 'evening') {
      rendererRef.current.toneMappingExposure = 0.88;
      ambientLightRef.current.intensity = 0.22;
      ambientLightRef.current.color.setHex(0xd4cfc5);
      dirLightRef.current.intensity = 0.35;
      dirLightRef.current.color.setHex(0xffdfb8);
      if (sceneRef.current) {
        sceneRef.current.background = new THREE.Color(0xe0dad1);
        if (sceneRef.current.fog) sceneRef.current.fog.color.setHex(0xe0dad1);
      }
    }
  }, [lightingPreset]);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing select-none"
    />
  );
};
