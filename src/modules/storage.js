// ================================================
//  STORAGE - Persistència de dades amb localStorage
// ================================================

const CURRENT_PARK_KEY  = 'parkfinder_current';
const HISTORY_KEY       = 'parkfinder_history';
const PHOTO_KEY         = 'parkfinder_photo';
const NOTES_KEY         = 'parkfinder_notes';

// -----------------------------------------------
// APARCAMENT ACTUAL
// -----------------------------------------------
export function saveCurrentPark(data) {
  try {
    localStorage.setItem(CURRENT_PARK_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('[Storage] Error desant aparcament:', e);
  }
}

export function loadCurrentPark() {
  try {
    const raw = localStorage.getItem(CURRENT_PARK_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function deleteCurrentPark() {
  localStorage.removeItem(CURRENT_PARK_KEY);
  localStorage.removeItem(PHOTO_KEY);
  localStorage.removeItem(NOTES_KEY);
}

// -----------------------------------------------
// FOTO I NOTES TEMPORALS
// -----------------------------------------------
export function savePendingPhoto(dataUrl) {
  try {
    localStorage.setItem(PHOTO_KEY, dataUrl);
  } catch (e) {
    // Si no hi ha espai (fotos molt grans), intentem notificar
    console.warn('[Storage] No hi ha espai per la foto:', e);
  }
}

export function loadPendingPhoto() {
  return localStorage.getItem(PHOTO_KEY) ?? null;
}

export function savePendingNotes(notes) {
  localStorage.setItem(NOTES_KEY, notes);
}

export function loadPendingNotes() {
  return localStorage.getItem(NOTES_KEY) ?? '';
}

export function clearPendingExtras() {
  localStorage.removeItem(PHOTO_KEY);
  localStorage.removeItem(NOTES_KEY);
}

// -----------------------------------------------
// HISTORIAL
// -----------------------------------------------
export function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveHistory(history) {
  try {
    // Limitem a 20 entrades per no ocupar massa espai
    const trimmed = history.slice(0, 20);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
  } catch (e) {
    console.error('[Storage] Error desant historial:', e);
  }
}

export function addToHistory(entry) {
  const history = loadHistory();
  history.unshift(entry);
  saveHistory(history);
}

export function deleteFromHistory(id) {
  const history = loadHistory().filter(e => e.id !== id);
  saveHistory(history);
}

export function clearHistory() {
  localStorage.removeItem(HISTORY_KEY);
}

