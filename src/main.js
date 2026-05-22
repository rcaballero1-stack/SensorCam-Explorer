// ================================================
//  MAIN - Entry point de Vite
// ================================================

import './style.css';
import { initTabs }    from './modules/ui.js';
import { initCamera }  from './modules/camera.js';
import { initSensors } from './modules/sensors.js';
import { initGallery } from './modules/gallery.js';
import { showToast }   from './modules/ui.js';

// -----------------------------------------------
// SPLASH → APP
// -----------------------------------------------
function showApp() {
  const splash = document.getElementById('splash');
  const app    = document.getElementById('app');

  setTimeout(() => {
    splash?.classList.add('fade-out');
    splash?.addEventListener('transitionend', () => {
      splash.style.display = 'none';
    }, { once: true });

    app?.classList.remove('hidden');
    showToast('👋 Benvingut/da a SensorCam!', 'info');
  }, 2000);
}

// -----------------------------------------------
// INICIALITZAR MÒDULS
// -----------------------------------------------
function init() {
  showApp();

  // Tabs
  initTabs((tabId) => {
    console.log('[Nav] Tab actiu:', tabId);
  });

  // Funcionalitats
  initCamera();
  initSensors();
  initGallery();

  // Listener global: sacsejada → auto-foto si efecte shake actiu
  document.addEventListener('sensor:shake', () => {
    // La lògica és al mòdul camera (ho gestiona internament)
    // Aquí podries afegir feedback addicional si vols
  });

  // Detectar si s'ha instal·lat com a PWA
  window.addEventListener('appinstalled', () => {
    showToast('🎉 App instal·lada correctament!', 'success');
  });
}

// -----------------------------------------------
// START
// -----------------------------------------------
document.addEventListener('DOMContentLoaded', init);