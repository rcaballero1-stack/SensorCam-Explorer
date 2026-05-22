// ================================================
//  GALLERY - Gestió de les fotos capturades
// ================================================

import { showToast } from './ui.js';

const photos = [];
let   currentPhoto = null;

// -----------------------------------------------
// INIT
// -----------------------------------------------
export function initGallery() {
  // Escolta l'event de foto capturada des del mòdul camera
  document.addEventListener('photo:captured', (e) => {
    addPhoto(e.detail);
  });

  // Netejar galeria
  document.getElementById('clearGallery')
    ?.addEventListener('click', clearGallery);

  // Modal
  document.getElementById('closeModal')
    ?.addEventListener('click', closeModal);
  document.getElementById('modalOverlay')
    ?.addEventListener('click', closeModal);
  document.getElementById('downloadBtn')
    ?.addEventListener('click', downloadPhoto);
}

// -----------------------------------------------
// AFEGIR FOTO
// -----------------------------------------------
function addPhoto(photoData) {
  const photo = { id: Date.now(), ...photoData };
  photos.unshift(photo);

  const grid  = document.getElementById('galleryGrid');
  const empty = document.getElementById('galleryEmpty');
  if (!grid) return;

  empty?.classList.add('hidden');

  const item = document.createElement('div');
  item.className    = 'gallery-item';
  item.dataset.id   = photo.id;
  item.innerHTML    = `
    <img src="${photo.dataUrl}" alt="Foto ${photo.timestamp}" loading="lazy"/>
    <div class="gallery-item-overlay">
      <div class="gallery-effect-tag">${photo.effect}</div>
      <div>${formatHour(photo.timestamp)}</div>
    </div>
  `;

  item.addEventListener('click', () => openModal(photo));

  // Insertar al principi (fotos noves primer)
  grid.insertBefore(item, grid.firstChild);
}

// -----------------------------------------------
// NETEJAR
// -----------------------------------------------
function clearGallery() {
  if (photos.length === 0) {
    showToast('📭 Ja no hi ha fotos', 'info');
    return;
  }

  photos.length = 0;

  const grid  = document.getElementById('galleryGrid');
  const empty = document.getElementById('galleryEmpty');
  if (!grid) return;

  // Eliminar items però mantenir l'empty state
  [...grid.querySelectorAll('.gallery-item')].forEach(el => el.remove());
  empty?.classList.remove('hidden');

  showToast('🗑️ Galeria neta', 'info');
}

// -----------------------------------------------
// MODAL
// -----------------------------------------------
function openModal(photo) {
  currentPhoto = photo;

  const modal     = document.getElementById('photoModal');
  const img       = document.getElementById('modalImage');
  const info      = document.getElementById('modalInfo');
  if (!modal || !img || !info) return;

  img.src = photo.dataUrl;

  const magnitude = Math.sqrt(
    photo.accel.x**2 + photo.accel.y**2 + photo.accel.z**2
  ).toFixed(1);

  info.innerHTML = `
    <strong>📅</strong> ${photo.timestamp} &nbsp;|&nbsp;
    <strong>✨</strong> ${photo.effect} &nbsp;|&nbsp;
    <strong>⚡</strong> ${magnitude} G
  `;

  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('photoModal')?.classList.add('hidden');
  document.body.style.overflow = '';
  currentPhoto = null;
}

function downloadPhoto() {
  if (!currentPhoto) return;
  const a      = document.createElement('a');
  a.href       = currentPhoto.dataUrl;
  a.download   = `sensorCam_${currentPhoto.id}.jpg`;
  a.click();
  showToast('⬇️ Foto descarregada!', 'success');
}

// -----------------------------------------------
// UTILS
// -----------------------------------------------
function formatHour(ts) {
  return ts.split(', ')[1] ?? ts;
}