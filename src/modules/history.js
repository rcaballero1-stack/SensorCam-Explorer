// ================================================
//  HISTORY - Historial d'aparcaments
// ================================================
 
import { showToast } from './ui.js';
import { loadHistory, deleteFromHistory, clearHistory, loadCurrentPark, deleteCurrentPark } from './storage.js';
import { initMiniMap } from './map.js';
 
let currentDetailItem = null;
 
// -----------------------------------------------
// INIT
// -----------------------------------------------
export function initHistory() {
 renderHistory();
 
 document.getElementById('clearHistoryBtn')
   ?.addEventListener('click', handleClearHistory);
 
 document.getElementById('modalClose')
   ?.addEventListener('click', closeModal);
 document.getElementById('modalOverlay')
   ?.addEventListener('click', closeModal);
 document.getElementById('modalNavigateBtn')
   ?.addEventListener('click', handleModalNavigate);
 document.getElementById('modalDeleteBtn')
   ?.addEventListener('click', handleModalDelete);
 
 // Actualitzar historial quan es desa un aparcament nou
 document.addEventListener('park:saved', () => {
   renderHistory();
 });
}
 
// -----------------------------------------------
// RENDERITZAR HISTORIAL
// -----------------------------------------------
export function renderHistory() {
 const list    = document.getElementById('historyList');
 const emptyEl = document.getElementById('historyEmpty');
 if (!list) return;
 
 // Netejar items però no l'empty state
 [...list.querySelectorAll('.history-item')].forEach(el => el.remove());
 
 const history = loadHistory();
 
 if (history.length === 0) {
   emptyEl?.classList.remove('hidden');
   return;
 }
 
 emptyEl?.classList.add('hidden');
 
 history.forEach(entry => {
   const item = buildHistoryItem(entry);
   list.appendChild(item);
 });
}
 
// -----------------------------------------------
// BUILD ITEM
// -----------------------------------------------
function buildHistoryItem(entry) {
 const item = document.createElement('div');
 item.className   = 'history-item';
 item.dataset.id  = entry.id;
 
 const badgesHtml = [
   entry.photo ? '<span class="history-item-badge has-photo">📸 Foto</span>' : '',
   entry.notes ? '<span class="history-item-badge has-notes">📝 Notes</span>' : '',
 ].join('');
 
 const thumbHtml = entry.photo
   ? `<img class="history-item-thumb" src="${entry.photo}" alt="Foto parking" loading="lazy"/>`
   : `<div class="history-item-no-photo">🅿️</div>`;
 
 item.innerHTML = `
   <div class="history-item-main">
     ${thumbHtml}
     <div class="history-item-info">
       <div class="history-item-address">${entry.address}</div>
       <div class="history-item-meta">
         <span>🕐 ${formatTimestamp(entry.timestamp)}</span>
       </div>
       <div style="margin-top:6px; display:flex; gap:6px; flex-wrap:wrap;">
         ${badgesHtml}
       </div>
     </div>
     <span class="history-item-chevron">›</span>
   </div>
 `;
 
 item.addEventListener('click', () => openModal(entry));
 
 return item;
}
 
// -----------------------------------------------
// NETEJAR HISTORIAL
// -----------------------------------------------
function handleClearHistory() {
 const history = loadHistory();
 if (history.length === 0) {
   showToast('📭 Ja no hi ha historial', 'info');
   return;
 }
 
 clearHistory();
 renderHistory();
 showToast('🗑️ Historial buidat', 'info');
}
 
// -----------------------------------------------
// MODAL DE DETALL
// -----------------------------------------------
function openModal(entry) {
 currentDetailItem = entry;
 
 const modal = document.getElementById('detailModal');
 if (!modal) return;
 
 // Adreça
 const addrEl = document.getElementById('modalAddress');
 if (addrEl) addrEl.textContent = entry.address;
 
 // Meta
 const metaEl = document.getElementById('modalMeta');
 if (metaEl) {
   metaEl.innerHTML = `
     <span class="modal-meta-item">📅 ${entry.timestamp}</span>
     <span class="modal-meta-item" style="color:var(--accent-primary)">📍 ${entry.lat.toFixed(5)}, ${entry.lng.toFixed(5)}</span>
   `;
 }
 
 // Foto
 const photoEl = document.getElementById('modalPhoto');
 if (entry.photo && photoEl) {
   photoEl.src = entry.photo;
   photoEl.classList.remove('hidden');
 } else {
   photoEl?.classList.add('hidden');
 }
 
 // Notes
 const notesEl = document.getElementById('modalNotes');
 if (entry.notes && notesEl) {
   notesEl.innerHTML = `<span>📝</span><span>${entry.notes}</span>`;
   notesEl.classList.remove('hidden');
 } else {
   notesEl?.classList.add('hidden');
 }
 
 modal.classList.remove('hidden');
 document.body.style.overflow = 'hidden';
 
 // Mini mapa
 setTimeout(() => {
   initMiniMap('modalMapMini', entry.lat, entry.lng);
 }, 150);
}
 
function closeModal() {
 document.getElementById('detailModal')?.classList.add('hidden');
 document.body.style.overflow = '';
 currentDetailItem = null;
}
 
// -----------------------------------------------
// NAVEGAR DES DEL MODAL (CORREGIT AMB ALTA PRECISIÓ)
// -----------------------------------------------
function handleModalNavigate() {
 if (!currentDetailItem) return;
 
 const { lat, lng } = currentDetailItem;
 
 // Genera la URL universal i exacta utilitzant la query de coordenades ?q=lat,lng
 const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
 window.open(url, '_blank');
}
 
// -----------------------------------------------
// ELIMINAR APARCAMENT DE L'HISTORIAL
// -----------------------------------------------
function handleModalDelete() {
 if (!currentDetailItem) return;
 
 deleteFromHistory(currentDetailItem.id);
 
 // Si és l'aparcament actual actiu al mapa, eliminar-lo també de la pantalla principal
 const current = loadCurrentPark();
 if (current && current.id === currentDetailItem.id) {
   deleteCurrentPark();
   // Disparar event per actualitzar la UI del mapa en temps real
   document.dispatchEvent(new CustomEvent('park:deleted'));
   
   document.getElementById('parkInfoEmpty')?.classList.remove('hidden');
   document.getElementById('parkInfoData')?.classList.add('hidden');
   const navBtn = document.getElementById('navigateBtn');
   if (navBtn) navBtn.disabled = true;
 }
 
 renderHistory();
 closeModal();
 showToast('🗑️ Aparcament eliminat', 'info');
}
 
// -----------------------------------------------
// UTILS
// -----------------------------------------------
function formatTimestamp(ts) {
 if (!ts) return '—';
 const parts = ts.split(', ');
 if (parts.length >= 2) {
   const datePart = parts[0];
   const today = new Date().toLocaleDateString('ca-ES');
   return datePart === today ? `Avui, ${parts[1]}` : ts;
 }
 return ts;
}
