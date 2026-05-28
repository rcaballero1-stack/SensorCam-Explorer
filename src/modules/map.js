// ================================================
//  MAP - Mapa Leaflet i gestió d'aparcament
// ================================================

import { showToast, updateGpsStatus } from './ui.js';
import {
 saveCurrentPark,
 loadCurrentPark,
 deleteCurrentPark,
 loadPendingPhoto,
 loadPendingNotes,
 addToHistory,
 clearPendingExtras
} from './storage.js';

// Estat intern
const mapState = {
 map:          null,
 userMarker:   null,
 parkMarker:   null,
 userCoords:   null,
 miniMap:      null,
};

// -----------------------------------------------
// INIT (CORREGIT I CRÉS SENSE DUPLICATS)
// -----------------------------------------------
export function initMap() {
 initLeafletMap();
 startGeolocation();

 document.getElementById('saveParkBtn')
   ?.addEventListener('click', handleSavePark);

 document.getElementById('navigateBtn')
   ?.addEventListener('click', handleNavigate);

 document.getElementById('deleteParkBtn')
   ?.addEventListener('click', handleDeletePark);

 // Escoltador per actualitzar la info si s'afegeixen fotos o notes posteriorment
 document.addEventListener('extras:saved', () => {
   const saved = loadCurrentPark();
   if (saved) {
     saved.photo = loadPendingPhoto();
     saved.notes = loadPendingNotes();
     saveCurrentPark(saved);
     renderCurrentPark(saved);
   }
 });

 // Escoltador per si s'elimina des de l'historial
 document.addEventListener('park:deleted', () => {
   if (mapState.parkMarker) {
     mapState.parkMarker.remove();
     mapState.parkMarker = null;
   }
 });

 // Forçar redibuix quan la finestra canvia o l'App es mostra (Evita mapa gris)
 window.addEventListener('resize', () => {
   if (mapState.map) {
     setTimeout(() => {
       mapState.map.invalidateSize();
     }, 200);
   }
 });

 // Escoltador per estirar el mapa quan es clica expressament la pestanya del Mapa
 document.querySelectorAll('.tab-btn').forEach(btn => {
   btn.addEventListener('click', () => {
     if (btn.dataset.tab === 'map' && mapState.map) {
       setTimeout(() => mapState.map.invalidateSize(), 100);
     }
   });
 });

 // Restaurar aparcament desat al carregar la app
 const saved = loadCurrentPark();
 if (saved) {
   renderCurrentPark(saved);
 }
}

// -----------------------------------------------
// LEAFLET MAP
// -----------------------------------------------
function initLeafletMap() {
 const defaultCoords = [41.3851, 2.1734];

 mapState.map = L.map('map', {
   center: defaultCoords,
   zoom: 15,
   zoomControl: false,
   attributionControl: false,
 });

 L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
   maxZoom: 19,
 }).addTo(mapState.map);

 L.control.zoom({ position: 'bottomright' }).addTo(mapState.map);
}

// -----------------------------------------------
// GEOLOCALITZACIÓ
// -----------------------------------------------
function startGeolocation() {
 if (!navigator.geolocation) {
   showToast('❌ El teu dispositiu no suporta GPS', 'error');
   document.getElementById('mapNoLocation')?.classList.remove('hidden');
   return;
 }

 navigator.geolocation.watchPosition(
   onPositionSuccess,
   onPositionError,
   { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
 );
}

function onPositionSuccess(pos) {
 const { latitude: lat, longitude: lng } = pos.coords;
 mapState.userCoords = { lat, lng };

 updateGpsStatus(true);
 document.getElementById('mapNoLocation')?.classList.add('hidden');

 if (mapState.userMarker) {
   mapState.userMarker.setLatLng([lat, lng]);
 } else {
   const userIcon = L.divIcon({
     className: '',
     html: '<div class="user-marker-icon"></div>',
     iconSize: [18, 18],
     iconAnchor: [9, 9],
   });

   mapState.userMarker = L.marker([lat, lng], { icon: userIcon })
     .addTo(mapState.map)
     .bindPopup('📍 Estàs aquí');

   mapState.map.setView([lat, lng], 17);
 }
}

function onPositionError(err) {
 console.warn('[GPS]', err.message);
 updateGpsStatus(false);

 if (err.code === 1) {
   showToast('🚫 Permís de localització denegat', 'error');
 } else {
   showToast('📡 No s\'ha pogut obtenir la ubicació', 'warning');
 }
}

// -----------------------------------------------
// DESAR APARCAMENT
// -----------------------------------------------
async function handleSavePark() {
 if (!mapState.userCoords) {
   showToast('📡 Esperant ubicació GPS…', 'warning');
   return;
 }

 const { lat, lng } = mapState.userCoords;
 const timestamp = new Date().toLocaleString('ca-ES');

 showToast('📍 Desant posició…', 'info');

 const address = await reverseGeocode(lat, lng);
 const photo = loadPendingPhoto();
 const notes = loadPendingNotes();

 const parkData = {
   id:        Date.now(),
   lat,
   lng,
   address,
   timestamp,
   photo:     photo || null,
   notes:     notes || '',
 };

 saveCurrentPark(parkData);
 addToHistory(parkData);
 renderCurrentPark(parkData);

 showToast(`✅ Aparcat a: ${address.split(',')[0]}`, 'success');

 document.dispatchEvent(new CustomEvent('park:saved', { detail: parkData }));
}

function renderCurrentPark(park) {
 const { lat, lng, address, timestamp, photo, notes } = park;

 if (mapState.parkMarker) {
   mapState.parkMarker.remove();
 }

 const parkIcon = L.divIcon({
   className: '',
   html: `<div class="park-marker-icon"><span>🅿️</span></div>`,
   iconSize: [32, 32],
   iconAnchor: [16, 32],
   popupAnchor: [0, -32],
 });

 mapState.parkMarker = L.marker([lat, lng], { icon: parkIcon })
   .addTo(mapState.map)
   .bindPopup(`<strong>${address}</strong><br>${timestamp}`);

 mapState.map.flyTo([lat, lng], 17, { duration: 1.2 });

 document.getElementById('parkInfoEmpty')?.classList.add('hidden');
 const dataEl = document.getElementById('parkInfoData');
 dataEl?.classList.remove('hidden');

 const addrEl = document.getElementById('parkAddress');
 const timeEl = document.getElementById('parkTime');
 if (addrEl) addrEl.textContent = address;
 if (timeEl) timeEl.textContent = `¼ ${timestamp}`;

 // Foto preview
 const photoPreview = document.getElementById('parkPhotoPreview');
 const photoThumb   = document.getElementById('parkPhotoThumb');
 if (photo && photoPreview && photoThumb) {
   photoThumb.src = photo;
   photoPreview.classList.remove('hidden');
 } else {
   photoPreview?.classList.add('hidden');
 }

 // Notes display
 const notesDisplay = document.getElementById('parkNotesDisplay');
 const notesText    = document.getElementById('parkNotesText');
 if (notes && notesDisplay && notesText) {
   notesText.textContent = notes;
   notesDisplay.classList.remove('hidden');
 } else {
   notesDisplay?.classList.add('hidden');
 }

 const navBtn = document.getElementById('navigateBtn');
 if (navBtn) navBtn.disabled = false;
}

// -----------------------------------------------
// ELIMINAR APARCAMENT
// -----------------------------------------------
function handleDeletePark() {
 const saved = loadCurrentPark();
 if (!saved) return;

 deleteCurrentPark();
 clearPendingExtras();

 if (mapState.parkMarker) {
   mapState.parkMarker.remove();
   mapState.parkMarker = null;
 }

 document.getElementById('parkInfoEmpty')?.classList.remove('hidden');
 document.getElementById('parkInfoData')?.classList.add('hidden');
 document.getElementById('navigateBtn').disabled = true;

 showToast('🗑️ Aparcament eliminat', 'info');
}

// -----------------------------------------------
// NAVEGAR (MODIFICAT: COORDENADES MODERNES I EXACTES)
// -----------------------------------------------
function handleNavigate() {
 const saved = loadCurrentPark();
 if (!saved) return;

 const { lat, lng } = saved;
 
 // Es fa servir la API oficial universal de cerca per coordenades exactes (?q=lat,lng) i mode a peu
 const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
 window.open(url, '_blank');
}

// -----------------------------------------------
// MINI MAPA AL MODAL
// -----------------------------------------------
export function initMiniMap(containerId, lat, lng) {
 if (mapState.miniMap) {
   mapState.miniMap.remove();
   mapState.miniMap = null;
 }

 const container = document.getElementById(containerId);
 if (!container) return;

 container.innerHTML = '';

 const miniMap = L.map(containerId, {
   center: [lat, lng],
   zoom: 16,
   zoomControl: false,
   attributionControl: false,
   dragging: false,
   scrollWheelZoom: false,
   doubleClickZoom: false,
   touchZoom: false,
 });

 L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
   maxZoom: 19,
 }).addTo(miniMap);

 const parkIcon = L.divIcon({
   className: '',
   html: `<div class="park-marker-icon"><span>🅿️</span></div>`,
   iconSize: [32, 32],
   iconAnchor: [16, 32],
 });

 L.marker([lat, lng], { icon: parkIcon }).addTo(miniMap);
 mapState.miniMap = miniMap;

 setTimeout(() => miniMap.invalidateSize(), 100);
}

// -----------------------------------------------
// REVERSE GEOCODING (OpenStreetMap Nominatim)
// -----------------------------------------------
async function reverseGeocode(lat, lng) {
 try {
   const resp = await fetch(
     `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
     { headers: { 'Accept-Language': 'ca,es' } }
   );
   if (!resp.ok) throw new Error('Error de xarxa');
   const data = await resp.json();
   const a = data.address;

   const parts = [
     a.road || a.pedestrian || a.path,
     a.house_number,
     a.city || a.town || a.village || a.suburb,
   ].filter(Boolean);

   return parts.join(', ') || data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
 } catch {
   return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
 }
}
