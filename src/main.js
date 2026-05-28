import './style.css';
import { initTabs }    from './modules/ui.js';
import { initMap }     from './modules/map.js';
import { initCamera }  from './modules/camera.js';
import { initHistory } from './modules/history.js';
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
     window.dispatchEvent(new Event('resize'));
   }, { once: true });
 
   app?.classList.remove('hidden');
   showToast('👋 Benvingut/da a ParkFinder!', 'info');
 }, 2000);
}
 
// -----------------------------------------------
// INIT
// -----------------------------------------------
function init() {
 showApp();
 
 initTabs((tabId) => {
   console.log('[Nav] Tab actiu:', tabId);
 });
 
 initMap();
 initCamera();
 initHistory();
 
 window.addEventListener('appinstalled', () => {
   showToast('🎉 App instal·lada correctament!', 'success');
 });
}
 
document.addEventListener('DOMContentLoaded', init);
