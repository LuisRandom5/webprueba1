/**
 * Generates high-resolution museum paintings procedurally onto Canvas
 * with fine art canvas texture, crackle, brush strokes, and layered glazes.
 */

export function renderArtworkToCanvas(id: string, width = 1200, height = 1600): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  switch (id) {
    case 'chiaroscuro':
      renderChiaroscuro(ctx, width, height);
      break;
    case 'impressionism':
      renderImpressionism(ctx, width, height);
      break;
    case 'surrealism':
      renderSurrealism(ctx, width, height);
      break;
    case 'ultramarine':
      renderUltramarine(ctx, width, height);
      break;
    case 'constructivism':
      renderConstructivism(ctx, width, height);
      break;
    default:
      renderChiaroscuro(ctx, width, height);
  }

  // Apply delicate canvas linen weave & subtle vignette
  applyCanvasTexture(ctx, width, height);

  return canvas;
}

function renderChiaroscuro(ctx: CanvasRenderingContext2D, w: number, h: number) {
  // Dark rich background
  const bg = ctx.createRadialGradient(w * 0.45, h * 0.52, 20, w * 0.5, h * 0.5, w * 0.85);
  bg.addColorStop(0, '#3d2514');
  bg.addColorStop(0.3, '#1f1309');
  bg.addColorStop(0.7, '#0d0805');
  bg.addColorStop(1, '#050302');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Warm candlelight source
  const candleX = w * 0.42;
  const candleY = h * 0.56;

  // Glow halo
  const glow = ctx.createRadialGradient(candleX, candleY, 5, candleX, candleY, w * 0.55);
  glow.addColorStop(0, 'rgba(255, 230, 160, 0.95)');
  glow.addColorStop(0.15, 'rgba(240, 160, 50, 0.55)');
  glow.addColorStop(0.4, 'rgba(160, 60, 15, 0.25)');
  glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  // Old Celestial Globe silhouette lit from candle
  ctx.save();
  const globeX = w * 0.62;
  const globeY = h * 0.58;
  const globeR = w * 0.22;

  // Globe ring shadow & brass arm
  ctx.strokeStyle = '#42280d';
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.ellipse(globeX, globeY, globeR * 1.15, globeR * 1.15, Math.PI / 4, 0, Math.PI * 2);
  ctx.stroke();

  // Globe sphere
  const globeGrad = ctx.createRadialGradient(globeX - 40, globeY - 20, 10, globeX, globeY, globeR);
  globeGrad.addColorStop(0, '#caa266');
  globeGrad.addColorStop(0.5, '#5c3d18');
  globeGrad.addColorStop(1, '#180e05');
  ctx.fillStyle = globeGrad;
  ctx.beginPath();
  ctx.arc(globeX, globeY, globeR, 0, Math.PI * 2);
  ctx.fill();

  // Constellation lines on globe
  ctx.strokeStyle = 'rgba(255, 220, 150, 0.35)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    ctx.ellipse(globeX, globeY, globeR, globeR * (0.2 + i * 0.15), 0.2, 0, Math.PI);
    ctx.stroke();
  }
  ctx.restore();

  // Old manuscript parchments on oak table
  ctx.save();
  ctx.fillStyle = '#1c1007';
  ctx.fillRect(0, h * 0.72, w, h * 0.28);

  // Table edge rim light
  ctx.strokeStyle = 'rgba(255, 180, 80, 0.4)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, h * 0.72);
  ctx.lineTo(w, h * 0.72);
  ctx.stroke();

  // Open book/parchment illuminated
  ctx.beginPath();
  ctx.moveTo(w * 0.25, h * 0.78);
  ctx.lineTo(w * 0.52, h * 0.75);
  ctx.lineTo(w * 0.56, h * 0.88);
  ctx.lineTo(w * 0.22, h * 0.92);
  ctx.closePath();
  const bookGrad = ctx.createLinearGradient(w * 0.35, h * 0.75, w * 0.25, h * 0.9);
  bookGrad.addColorStop(0, '#eedbb5');
  bookGrad.addColorStop(0.7, '#ab8e5c');
  bookGrad.addColorStop(1, '#48341a');
  ctx.fillStyle = bookGrad;
  ctx.fill();

  // Calligraphic script lines
  ctx.strokeStyle = 'rgba(60, 40, 20, 0.6)';
  ctx.lineWidth = 1.5;
  for (let y = h * 0.78; y < h * 0.88; y += 7) {
    ctx.beginPath();
    ctx.moveTo(w * 0.28, y);
    ctx.lineTo(w * 0.48, y - 2);
    ctx.stroke();
  }

  // Brass Candlestick
  ctx.fillStyle = '#e8b856';
  ctx.fillRect(candleX - 4, candleY + 20, 8, 40);
  ctx.beginPath();
  ctx.ellipse(candleX, candleY + 60, 25, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Candle Flame
  const flame = ctx.createRadialGradient(candleX, candleY, 2, candleX, candleY + 10, 18);
  flame.addColorStop(0, '#ffffff');
  flame.addColorStop(0.3, '#ffea78');
  flame.addColorStop(0.7, '#ff6a00');
  flame.addColorStop(1, 'rgba(255, 50, 0, 0)');
  ctx.fillStyle = flame;
  ctx.beginPath();
  ctx.ellipse(candleX, candleY, 6, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function renderImpressionism(ctx: CanvasRenderingContext2D, w: number, h: number) {
  // Sunset sky with broken palette knife impasto
  const skyColors = ['#fde4b6', '#fca576', '#e46e7f', '#9b5ca1', '#545281'];
  for (let i = 0; i < h * 0.55; i += 6) {
    const t = i / (h * 0.55);
    const colIdx = Math.min(skyColors.length - 1, Math.floor(t * skyColors.length));
    ctx.fillStyle = skyColors[colIdx];
    for (let x = 0; x < w; x += 18) {
      const strokeW = 16 + Math.sin(x * 0.05 + i) * 6;
      ctx.fillRect(x, i, strokeW, 7);
    }
  }

  // Blazing sun disk
  const sunX = w * 0.48;
  const sunY = h * 0.45;
  const sunGrad = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 80);
  sunGrad.addColorStop(0, '#ffffff');
  sunGrad.addColorStop(0.3, '#fff494');
  sunGrad.addColorStop(0.7, '#ff8042');
  sunGrad.addColorStop(1, 'rgba(255, 128, 66, 0)');
  ctx.fillStyle = sunGrad;
  ctx.beginPath();
  ctx.arc(sunX, sunY, 70, 0, Math.PI * 2);
  ctx.fill();

  // Sea water with shimmering reflections
  for (let y = h * 0.52; y < h; y += 4) {
    const depth = (y - h * 0.52) / (h * 0.48);
    for (let x = 0; x < w; x += 12) {
      const distToSun = Math.abs(x - sunX);
      const isReflection = distToSun < 140 * (1 - depth * 0.4);
      let r = 20 + Math.floor(depth * 30);
      let g = 80 + Math.floor(depth * 50);
      let b = 120 + Math.floor(depth * 60);

      if (isReflection) {
        r = 240 - Math.floor(distToSun * 0.8);
        g = 160 - Math.floor(distToSun * 0.6);
        b = 80;
      }

      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      const jitter = (Math.sin(x * 0.1 + y * 0.2) + Math.cos(x * 0.05)) * 4;
      ctx.fillRect(x + jitter, y, 14, 4.5);
    }
  }

  // Coastal cliff silhouette on right with Mediterranean pines
  ctx.save();
  ctx.fillStyle = '#211826';
  ctx.beginPath();
  ctx.moveTo(w * 0.65, h * 0.52);
  ctx.bezierCurveTo(w * 0.72, h * 0.42, w * 0.85, h * 0.48, w, h * 0.38);
  ctx.lineTo(w, h);
  ctx.lineTo(w * 0.55, h);
  ctx.closePath();
  ctx.fill();

  // Texture brush on cliff
  ctx.fillStyle = '#47364f';
  for (let i = 0; i < 400; i++) {
    const cx = w * 0.65 + Math.random() * (w * 0.35);
    const cy = h * 0.45 + Math.random() * (h * 0.55);
    ctx.fillRect(cx, cy, 8, 4);
  }
  ctx.restore();
}

function renderSurrealism(ctx: CanvasRenderingContext2D, w: number, h: number) {
  // Deep metaphysical twilight sky
  const sky = ctx.createLinearGradient(0, 0, 0, h * 0.65);
  sky.addColorStop(0, '#0f2438');
  sky.addColorStop(0.5, '#1d4554');
  sky.addColorStop(0.85, '#688c7e');
  sky.addColorStop(1, '#c9ad7d');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h * 0.65);

  // Vast deserted terracotta piazza
  const piazza = ctx.createLinearGradient(0, h * 0.65, 0, h);
  piazza.addColorStop(0, '#bf895a');
  piazza.addColorStop(0.4, '#a36d40');
  piazza.addColorStop(1, '#543118');
  ctx.fillStyle = piazza;
  ctx.fillRect(0, h * 0.65, w, h * 0.35);

  // Long dramatic black shadow across the square
  ctx.fillStyle = 'rgba(18, 12, 10, 0.88)';
  ctx.beginPath();
  ctx.moveTo(w * 0.22, h * 0.65);
  ctx.lineTo(w * 0.95, h * 0.95);
  ctx.lineTo(w * 0.95, h);
  ctx.lineTo(w * 0.15, h);
  ctx.closePath();
  ctx.fill();

  // Classical arcade building on the left
  ctx.fillStyle = '#ecd8ba';
  ctx.beginPath();
  ctx.moveTo(w * 0.05, h * 0.18);
  ctx.lineTo(w * 0.38, h * 0.32);
  ctx.lineTo(w * 0.38, h * 0.82);
  ctx.lineTo(w * 0.05, h * 0.88);
  ctx.closePath();
  ctx.fill();

  // Wall shadow side
  ctx.fillStyle = '#6e5847';
  ctx.fillRect(0, h * 0.15, w * 0.05, h * 0.75);

  // Three enigmatic arches cut into the arcade
  ctx.fillStyle = '#08080a';
  for (let i = 0; i < 3; i++) {
    const archY = h * (0.42 + i * 0.14);
    const archH = h * 0.11;
    ctx.beginPath();
    ctx.ellipse(w * 0.22, archY, w * 0.065, archH * 0.45, 0, Math.PI, 0);
    ctx.lineTo(w * 0.285, archY + archH);
    ctx.lineTo(w * 0.155, archY + archH);
    ctx.closePath();
    ctx.fill();
  }

  // Lone marble statue silhouette in the distance
  ctx.fillStyle = '#e5ded1';
  ctx.beginPath();
  ctx.arc(w * 0.68, h * 0.61, 8, 0, Math.PI * 2);
  ctx.rect(w * 0.665, h * 0.62, 7, 24);
  ctx.fill();

  // Red brick chimney in far horizon
  ctx.fillStyle = '#872f1e';
  ctx.fillRect(w * 0.82, h * 0.48, 14, h * 0.17);
}

function renderUltramarine(ctx: CanvasRenderingContext2D, w: number, h: number) {
  // Raw primed linen base
  ctx.fillStyle = '#e8e2d5';
  ctx.fillRect(0, 0, w, h);

  // Layered Yves Klein intense ultramarine field
  const blue = ctx.createLinearGradient(0, 0, w, h);
  blue.addColorStop(0, '#001a9c');
  blue.addColorStop(0.3, '#0025c4');
  blue.addColorStop(0.7, '#001cb5');
  blue.addColorStop(1, '#00127a');
  ctx.fillStyle = blue;
  ctx.fillRect(w * 0.06, h * 0.06, w * 0.88, h * 0.88);

  // Heavy mineral pigment texture
  for (let i = 0; i < 1500; i++) {
    const px = w * 0.06 + Math.random() * (w * 0.88);
    const py = h * 0.06 + Math.random() * (h * 0.88);
    const rad = 2 + Math.random() * 12;
    const alpha = 0.06 + Math.random() * 0.12;
    ctx.fillStyle = Math.random() > 0.5 ? `rgba(40, 90, 255, ${alpha})` : `rgba(0, 15, 80, ${alpha})`;
    ctx.beginPath();
    ctx.arc(px, py, rad, 0, Math.PI * 2);
    ctx.fill();
  }

  // Luminous Gold Leaf Accent stripe
  const gold = ctx.createLinearGradient(w * 0.72, 0, w * 0.76, 0);
  gold.addColorStop(0, '#c9933b');
  gold.addColorStop(0.5, '#ffd978');
  gold.addColorStop(1, '#966720');
  ctx.fillStyle = gold;
  ctx.fillRect(w * 0.73, h * 0.12, 10, h * 0.76);
}

function renderConstructivism(ctx: CanvasRenderingContext2D, w: number, h: number) {
  // Pale bone / architectural cream backdrop
  ctx.fillStyle = '#f3eedf';
  ctx.fillRect(0, 0, w, h);

  // Geometric grid pencil lines
  ctx.strokeStyle = 'rgba(120, 110, 95, 0.2)';
  ctx.lineWidth = 1;
  for (let x = 0; x < w; x += w / 8) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y < h; y += h / 8) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  // Large terracotta circle
  ctx.fillStyle = '#b84e36';
  ctx.beginPath();
  ctx.arc(w * 0.5, h * 0.42, w * 0.28, 0, Math.PI * 2);
  ctx.fill();

  // Intersecting deep slate semicircle
  ctx.fillStyle = '#26343f';
  ctx.beginPath();
  ctx.arc(w * 0.5, h * 0.42, w * 0.2, -Math.PI / 2, Math.PI / 2);
  ctx.fill();

  // Golden ratio sage disc
  ctx.fillStyle = '#6a8274';
  ctx.beginPath();
  ctx.arc(w * 0.35, h * 0.68, w * 0.14, 0, Math.PI * 2);
  ctx.fill();

  // Ochre diagonal balance line
  ctx.strokeStyle = '#d49b3d';
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.moveTo(w * 0.15, h * 0.85);
  ctx.lineTo(w * 0.85, h * 0.15);
  ctx.stroke();

  // Small black focus dot
  ctx.fillStyle = '#111111';
  ctx.beginPath();
  ctx.arc(w * 0.5, h * 0.42, 12, 0, Math.PI * 2);
  ctx.fill();
}

function applyCanvasTexture(ctx: CanvasRenderingContext2D, w: number, h: number) {
  // Fine linen weave overlay
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      // Weave pattern modulation
      const weave = ((x % 2 === 0 ? 1 : -1) + (y % 2 === 0 ? 1 : -1)) * 1.5;
      const noise = (Math.random() - 0.5) * 4;
      const delta = weave + noise;

      data[idx] = Math.min(255, Math.max(0, data[idx] + delta));
      data[idx + 1] = Math.min(255, Math.max(0, data[idx + 1] + delta));
      data[idx + 2] = Math.min(255, Math.max(0, data[idx + 2] + delta));
    }
  }
  ctx.putImageData(imgData, 0, 0);

  // Subtle perimeter vignette
  const vignette = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.4, w / 2, h / 2, Math.max(w, h) * 0.75);
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(20, 15, 10, 0.22)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);
}
