// ================================================
//  SENSORS - Acceleròmetre i Orientació
// ================================================

import { showToast }        from './ui.js';
import { updateStatusBadge } from './ui.js';
import { updateCameraAccel } from './camera.js';

const sensorState = {
  active:         false,
  accel:          { x: 0, y: 0, z: 0 },
  orientation:    { alpha: 0, beta: 0, gamma: 0 },
  shakeThreshold: 18,
  lastShakeTime:  0,
};

// -----------------------------------------------
// INIT
// -----------------------------------------------
export function initSensors() {
  document.getElementById('activateBtn')
    ?.addEventListener('click', handleToggle);
}

// -----------------------------------------------
// TOGGLE
// -----------------------------------------------
async function handleToggle() {
  if (sensorState.active) {
    deactivate();
  } else {
    await activate();
  }
}

async function activate() {
  // Permís iOS 13+
  if (typeof DeviceMotionEvent !== 'undefined' &&
      typeof DeviceMotionEvent.requestPermission === 'function') {
    try {
      const perm = await DeviceMotionEvent.requestPermission();
      if (perm !== 'granted') {
        showToast('🚫 Permís denegat pels sensors', 'error');
        return;
      }
    } catch {
      showToast('❌ Error demanant permisos', 'error');
      return;
    }
  }

  window.addEventListener('devicemotion',      onMotion,      { passive: true });
  window.addEventListener('deviceorientation', onOrientation, { passive: true });

  sensorState.active = true;
  updateUI(true);
  showToast('⚡ Sensors activats!', 'success');
}

function deactivate() {
  window.removeEventListener('devicemotion',      onMotion);
  window.removeEventListener('deviceorientation', onOrientation);

  sensorState.active = false;
  updateUI(false);
  showToast('⏸️ Sensors desactivats', 'info');
}

// -----------------------------------------------
// EVENT HANDLERS
// -----------------------------------------------
function onMotion(event) {
  const acc = event.accelerationIncludingGravity ?? event.acceleration;
  if (!acc) return;

  sensorState.accel.x = acc.x ?? 0;
  sensorState.accel.y = acc.y ?? 0;
  sensorState.accel.z = acc.z ?? 0;

  renderAccel();
  detectShake();

  // Compartir valors amb el mòdul de càmera
  updateCameraAccel(sensorState.accel.x, sensorState.accel.y, sensorState.accel.z);
}

function onOrientation(event) {
  sensorState.orientation.alpha = event.alpha ?? 0;
  sensorState.orientation.beta  = event.beta  ?? 0;
  sensorState.orientation.gamma = event.gamma ?? 0;

  renderOrientation();
}

// -----------------------------------------------
// RENDER: ACCELERÒMETRE
// -----------------------------------------------
function renderAccel() {
  const { x, y, z } = sensorState.accel;

  setText('valX', x.toFixed(2));
  setText('valY', y.toFixed(2));
  setText('valZ', z.toFixed(2));

  renderAxisBar('axisX', x, 15);
  renderAxisBar('axisY', y, 15);
  renderAxisBar('axisZ', z, 15);
  renderSphere(x, y);
  renderIntensity(x, y, z);
}

function renderAxisBar(id, value, max) {
  const bar = document.getElementById(id);
  if (!bar) return;
  const norm  = clamp(value / max, -1, 1);
  const width = Math.abs(norm) * 50;
  bar.style.width = `${width}%`;
  bar.style.left  = norm >= 0 ? '50%' : `${50 - width}%`;
}

function renderSphere(x, y) {
  const sphere = document.getElementById('sphere3d');
  const shadow = document.getElementById('sphereShadow');
  if (!sphere || !shadow) return;

  const tiltX = clamp(y / 10, -1, 1);
  const tiltY = clamp(x / 10, -1, 1);

  sphere.style.transform = `rotateX(${tiltX * -30}deg) rotateY(${tiltY * 30}deg)`;

  const sx = tiltY * 20;
  const sy = tiltX * 10;
  shadow.style.transform = `translate(${sx}px,${sy}px) scaleX(${1 - Math.abs(tiltX) * 0.3})`;
}

function renderIntensity(x, y, z) {
  const ring      = document.getElementById('ringPath');
  const valEl     = document.getElementById('intensityVal');
  if (!ring || !valEl) return;

  const magnitude  = Math.sqrt(x**2 + y**2 + z**2);
  const intensity  = Math.min(Math.round((magnitude / 25) * 100), 100);
  const offset     = 251 - (intensity / 100) * 251;

  ring.style.strokeDashoffset = offset;
  valEl.textContent = intensity;

  ring.style.stroke =
    intensity > 70 ? '#ef4444' :
    intensity > 40 ? '#f59e0b' :
    'url(#ringGradient)';
}

// -----------------------------------------------
// RENDER: ORIENTACIÓ
// -----------------------------------------------
function renderOrientation() {
  const { alpha, beta, gamma } = sensorState.orientation;

  setText('oAlpha', `${Math.round(alpha)}°`);
  setText('oBeta',  `${Math.round(beta)}°`);
  setText('oGamma', `${Math.round(gamma)}°`);

  const compass = document.getElementById('compassRose');
  if (compass) compass.style.transform = `rotate(${-alpha}deg)`;
}

// -----------------------------------------------
// DETECCIÓ DE SACSEJADA
// -----------------------------------------------
function detectShake() {
  const { x, y, z } = sensorState.accel;
  const magnitude    = Math.sqrt(x**2 + y**2 + z**2);
  const now          = Date.now();

  if (magnitude > sensorState.shakeThreshold &&
      now - sensorState.lastShakeTime > 1000) {

    sensorState.lastShakeTime = now;

    showShakeAlert();
    showToast('💥 Sacsejada detectada!', 'warning');

    // Event per si la càmera vol reaccionar
    document.dispatchEvent(new CustomEvent('sensor:shake', {
      detail: { magnitude },
    }));
  }
}

function showShakeAlert() {
  const el = document.getElementById('shakeAlert');
  if (!el) return;
  el.classList.remove('hidden');
  el.style.animation = 'none';
  void el.offsetWidth;
  el.style.animation = '';
  setTimeout(() => el.classList.add('hidden'), 2500);
}

// -----------------------------------------------
// UI UPDATE
// -----------------------------------------------
function updateUI(active) {
  // Botó
  const btn = document.getElementById('activateBtn');
  if (btn) {
    btn.innerHTML = `<span class="btn-icon">${active ? '⏹️' : '🚀'}</span>${active ? ' Desactivar Sensors' : ' Activar Sensors'}`;
    btn.classList.toggle('active', active);
  }

  // Badges
  ['accelBadge', 'gyroBadge'].forEach(id => {
    const badge = document.getElementById(id);
    if (!badge) return;
    badge.textContent = active ? 'ON' : 'OFF';
    badge.classList.toggle('active', active);
  });

  // Header
  updateStatusBadge(active);
}

// -----------------------------------------------
// UTILS
// -----------------------------------------------
function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}