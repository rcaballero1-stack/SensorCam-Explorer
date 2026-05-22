// ================================================
//  CAMERA - Gestió de càmera i efectes Canvas
// ================================================

import { showToast } from './ui.js';

// Estat intern del mòdul (privat)
const camState = {
  active:    false,
  facing:    'environment',
  stream:    null,
  effect:    'normal',
  rafId:     null,
  panelOpen: false,

  // Referència als valors del sensor (actualitzat externament)
  accel: { x: 0, y: 0, z: 0 },
};

// -----------------------------------------------
// INIT
// -----------------------------------------------
export function initCamera() {
  const captureBtn  = document.getElementById('captureBtn');
  const switchBtn   = document.getElementById('switchCamera');
  const effectBtn   = document.getElementById('effectBtn');
  const effectOpts  = document.querySelectorAll('.effect-opt');

  captureBtn?.addEventListener('click', handleCapture);
  switchBtn?.addEventListener('click',  handleSwitchCamera);
  effectBtn?.addEventListener('click',  toggleEffectPanel);

  effectOpts.forEach(opt => {
    opt.addEventListener('click', () => {
      effectOpts.forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
      camState.effect = opt.dataset.effect;
      showToast(`✨ Efecte: ${opt.textContent}`, 'info');
    });
  });
}

// -----------------------------------------------
// ACTUALITZAR SENSOR DES DE FORA
// -----------------------------------------------
export function updateCameraAccel(x, y, z) {
  camState.accel = { x, y, z };
  updateHUD(x, y);
}

// -----------------------------------------------
// ARRANCAR CÀMERA
// -----------------------------------------------
async function startCamera() {
  try {
    // Aturar stream anterior
    camState.stream?.getTracks().forEach(t => t.stop());

    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: camState.facing,
        width:  { ideal: 1280 },
        height: { ideal: 1280 },
      },
      audio: false,
    });

    const video = document.getElementById('videoFeed');
    video.srcObject = stream;
    camState.stream = stream;
    camState.active = true;

    document.getElementById('noCamera')?.classList.add('hidden');

    video.onloadedmetadata = () => startCanvasLoop();

    showToast('📷 Càmera activada!', 'success');
  } catch (err) {
    console.error('[Camera]', err);
    showToast('❌ No s\'ha pogut accedir a la càmera', 'error');
  }
}

// -----------------------------------------------
// CAPTURE
// -----------------------------------------------
async function handleCapture() {
  if (!camState.active) {
    await startCamera();
    return;
  }

  const video  = document.getElementById('videoFeed');
  const canvas = document.createElement('canvas');
  canvas.width  = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');

  // Mirror si és frontal
  if (camState.facing === 'user') {
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
  }

  ctx.drawImage(video, 0, 0);
  applyEffectToCapture(ctx, canvas.width, canvas.height);

  triggerFlash();

  const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

  // Emetre event custom perquè la galeria el pugui capturar
  document.dispatchEvent(new CustomEvent('photo:captured', {
    detail: {
      dataUrl,
      effect:    camState.effect,
      timestamp: new Date().toLocaleString('ca-ES'),
      accel:     { ...camState.accel },
    },
  }));

  showToast('✅ Foto feta!', 'success');
}

async function handleSwitchCamera() {
  camState.facing = camState.facing === 'environment' ? 'user' : 'environment';
  if (camState.active) await startCamera();
  showToast(
    camState.facing === 'user' ? '🤳 Càmera frontal' : '📷 Càmera posterior',
    'info'
  );
}

// -----------------------------------------------
// FLASH
// -----------------------------------------------
function triggerFlash() {
  const flash = document.getElementById('flashOverlay');
  if (!flash) return;
  flash.classList.remove('flash');
  void flash.offsetWidth;
  flash.classList.add('flash');
}

// -----------------------------------------------
// CANVAS LOOP D'EFECTES
// -----------------------------------------------
function startCanvasLoop() {
  const canvas = document.getElementById('effectCanvas');
  const video  = document.getElementById('videoFeed');
  const ctx    = canvas?.getContext('2d');
  if (!canvas || !ctx || !video) return;

  if (camState.rafId) cancelAnimationFrame(camState.rafId);

  const draw = () => {
    if (!camState.active) return;

    canvas.width  = video.videoWidth  || 640;
    canvas.height = video.videoHeight || 480;

    if (camState.effect === 'normal') {
      canvas.classList.remove('active');
      camState.rafId = requestAnimationFrame(draw);
      return;
    }

    canvas.classList.add('active');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dibuixar frame (amb mirror si cal)
    ctx.save();
    if (camState.facing === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    // Efecte
    applyEffect(ctx, canvas.width, canvas.height);

    camState.rafId = requestAnimationFrame(draw);
  };

  draw();
}

// -----------------------------------------------
// EFECTES
// -----------------------------------------------
function applyEffect(ctx, w, h) {
  switch (camState.effect) {
    case 'tilt-blur': applyTiltBlur(ctx, w, h); break;
    case 'shake':     applyShake(ctx, w, h);    break;
    case 'neon':      applyNeon(ctx, w, h);     break;
  }
}

function applyEffectToCapture(ctx, w, h) {
  switch (camState.effect) {
    case 'tilt-blur': applyTiltBlur(ctx, w, h); break;
    case 'neon':      applyNeon(ctx, w, h);      break;
  }
}

function applyTiltBlur(ctx, w, h) {
  const tiltX = Math.abs(camState.accel.x) / 10;
  const tiltY = Math.abs(camState.accel.y) / 10;
  const alpha = Math.min(0.5, (tiltX + tiltY) * 0.15);

  const gradient = ctx.createLinearGradient(0, 0, 0, h);
  gradient.addColorStop(0,   `rgba(0,0,0,${alpha})`);
  gradient.addColorStop(0.5, 'rgba(0,0,0,0)');
  gradient.addColorStop(1,   `rgba(0,0,0,${alpha})`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);

  const vignette = ctx.createRadialGradient(w/2, h/2, h*0.2, w/2, h/2, h*0.7);
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, `rgba(0,0,0,${0.3 + alpha})`);
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);
}

function applyShake(ctx, w, h) {
  const { x, y, z } = camState.accel;
  const magnitude    = Math.sqrt(x**2 + y**2 + z**2);
  const amount       = Math.min(magnitude * 0.5, 8);

  if (amount > 2) {
    const imgData = ctx.getImageData(0, 0, w, h);
    ctx.clearRect(0, 0, w, h);
    const ox = (Math.random() - 0.5) * amount;
    const oy = (Math.random() - 0.5) * amount;
    ctx.putImageData(imgData, ox, oy);

    // Aberració cromàtica
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 0.3;
    ctx.putImageData(imgData, ox * 2, oy);
    ctx.globalAlpha = 0.2;
    ctx.putImageData(imgData, -ox * 2, oy);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  }
}

function applyNeon(ctx, w, h) {
  const neon = ctx.createLinearGradient(0, 0, w, h);
  neon.addColorStop(0,   'rgba(124,58,237,0.15)');
  neon.addColorStop(0.5, 'rgba(6,182,212,0.10)');
  neon.addColorStop(1,   'rgba(16,185,129,0.15)');
  ctx.fillStyle = neon;
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = 'source-over';

  // Scan line
  const scanY = (Date.now() / 20) % h;
  ctx.fillStyle = 'rgba(6,182,212,0.08)';
  ctx.fillRect(0, scanY, w, 3);
  ctx.fillStyle = 'rgba(6,182,212,0.03)';
  ctx.fillRect(0, scanY - 20, w, 20);
}

// -----------------------------------------------
// PANEL D'EFECTES
// -----------------------------------------------
function toggleEffectPanel() {
  camState.panelOpen = !camState.panelOpen;
  document.getElementById('effectSelector')
    ?.classList.toggle('visible', camState.panelOpen);
}

// -----------------------------------------------
// HUD
// -----------------------------------------------
function updateHUD(x, y) {
  const pctX = clamp(((x + 15) / 30) * 100, 0, 100);
  const pctY = clamp(((y + 15) / 30) * 100, 0, 100);

  const hudX = document.getElementById('hudX');
  const hudY = document.getElementById('hudY');
  if (hudX) hudX.style.width = `${pctX}%`;
  if (hudY) hudY.style.width = `${pctY}%`;
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}