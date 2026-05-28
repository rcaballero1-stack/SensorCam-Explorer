// ================================================
//  CAMERA - Foto del lloc d'aparcament
// ================================================

import { showToast } from './ui.js';
import { savePendingPhoto, loadPendingPhoto, savePendingNotes, clearPendingExtras } from './storage.js';

const camState = {
 active:  false,
 facing:  'environment',
 stream:  null,
};

// -----------------------------------------------
// INIT
// -----------------------------------------------
export function initCamera() {
 document.getElementById('captureBtn')
   ?.addEventListener('click', handleCapture);

 document.getElementById('switchCameraBtn')
   ?.addEventListener('click', handleSwitchCamera);

 document.getElementById('clearPhotoBtn')
   ?.addEventListener('click', handleClearPhoto);

 document.getElementById('saveAllBtn')
   ?.addEventListener('click', handleSaveAll);

 // Notes counter
 const notesInput   = document.getElementById('parkingNotes');
 const notesCounter = document.getElementById('notesCounter');
 notesInput?.addEventListener('input', () => {
   if (notesCounter) notesCounter.textContent = notesInput.value.length;
 });

 // ESCUTADOR PER ENCENDRE LA CÀMERA AUTOMÀTICAMENT EN ENTRAR A LA PESTANYA
 document.querySelectorAll('.tab-btn').forEach(btn => {
   btn.addEventListener('click', () => {
     if (btn.dataset.tab === 'photo') {
       startCamera(); // S'encén sola quan l'usuari clica la pestanya "Foto"
     } else {
       stopCamera();  // S'apaga per estalviar bateria si va al Mapa o Historial
     }
   });
 });

 // Restaurar estat si hi havia foto/notes pendents
 restorePendingState();
}

// -----------------------------------------------
// RESTAURAR ESTAT PENDENT
// -----------------------------------------------
function restorePendingState() {
 const photo = loadPendingPhoto();
 if (photo) {
   showPhotoResult(photo);
 }
}

// -----------------------------------------------
// CAPTURA CORREGIDA (SENSE DOBLE CLIC)
// -----------------------------------------------
async function handleCapture() {
 // Si per algun motiu no està activa (ex: permisos), intentem arrancar i sortim
 if (!camState.active) {
   await startCamera();
   return;
 }

 const video  = document.getElementById('videoFeed');
 const canvas = document.createElement('canvas');

 canvas.width  = video.videoWidth  || 1280;
 canvas.height = video.videoHeight || 960;

 const ctx = canvas.getContext('2d');

 // Mirror si és càmera frontal
 if (camState.facing === 'user') {
   ctx.translate(canvas.width, 0);
   ctx.scale(-1, 1);
 }

 ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
 triggerFlash();

 const dataUrl = canvas.toDataURL('image/jpeg', 0.88);

 // Desar foto pendent
 savePendingPhoto(dataUrl);
 showPhotoResult(dataUrl);

 showToast('📸 Foto feta!', 'success');
}

// -----------------------------------------------
// MOSTRAR RESULTAT DE FOTO
// -----------------------------------------------
function showPhotoResult(dataUrl) {
 const resultEl  = document.getElementById('photoResult');
 const resultImg = document.getElementById('photoResultImg');

 if (resultEl && resultImg) {
   resultImg.src = dataUrl;
   resultEl.classList.remove('hidden');
 }
}

// -----------------------------------------------
// ELIMINAR FOTO
// -----------------------------------------------
function handleClearPhoto() {
 clearPendingExtras();

 const resultEl = document.getElementById('photoResult');
 resultEl?.classList.add('hidden');

 // Netejar notes
 const notesInput   = document.getElementById('parkingNotes');
 const notesCounter = document.getElementById('notesCounter');
 if (notesInput)   { notesInput.value = ''; }
 if (notesCounter) { notesCounter.textContent = '0'; }

 showToast('🗑️ Foto i notes eliminades', 'info');
}

// -----------------------------------------------
// DESAR FOTO + NOTES
// -----------------------------------------------
function handleSaveAll() {
 const notesInput = document.getElementById('parkingNotes');
 const notes = notesInput?.value.trim() || '';

 savePendingNotes(notes);

 // Actualitzar la targeta d'info si hi ha un aparcament actiu
 const photo = loadPendingPhoto();
 document.dispatchEvent(new CustomEvent('extras:saved', {
   detail: { photo, notes },
 }));

 showToast('💾 Foto i notes desades!', 'success');
}

// -----------------------------------------------
// ARRANCAR CÀMERA
// -----------------------------------------------
async function startCamera() {
 try {
   camState.stream?.getTracks().forEach(t => t.stop());

   const stream = await navigator.mediaDevices.getUserMedia({
     video: {
       facingMode: camState.facing,
       width:  { ideal: 1280 },
       height: { ideal: 960 },
     },
     audio: false,
   });

   const video   = document.getElementById('videoFeed');
   if (video) {
     video.srcObject = stream;
     camState.stream = stream;
     camState.active = true;
   }

   document.getElementById('noCamera')?.classList.add('hidden');
   showToast('📷 Càmera activada!', 'success');
 } catch (err) {
   console.error('[Camera]', err);
   showToast('❌ No s\'ha pogut accedir a la càmera', 'error');
 }
}

// -----------------------------------------------
// ATURAR CÀMERA (ALLIBERAR RECURSOS)
// -----------------------------------------------
function stopCamera() {
 if (camState.stream) {
   camState.stream.getTracks().forEach(track => track.stop());
   camState.active = false;
   camState.stream = null;
   document.getElementById('noCamera')?.classList.remove('hidden');
 }
}

// -----------------------------------------------
// CANVIAR CÀMERA
// -----------------------------------------------
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
