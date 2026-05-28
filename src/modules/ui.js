// ================================================
//  UI - Toast notifications i navegació per tabs
// ================================================
 
export function showToast(message, type = 'info') {
 const container = document.getElementById('toastContainer');
 if (!container) return;
 
 const icons = {
   success: '✅',
   error:   '❌',
   info:    'ℹ️',
   warning: '⚠️',
 };
 
 const colors = {
   success: 'rgba(34,197,94,0.12)',
   error:   'rgba(239,68,68,0.12)',
   info:    'rgba(59,130,246,0.12)',
   warning: 'rgba(245,158,11,0.12)',
 };
 
 const borders = {
   success: 'rgba(34,197,94,0.3)',
   error:   'rgba(239,68,68,0.3)',
   info:    'rgba(59,130,246,0.3)',
   warning: 'rgba(245,158,11,0.3)',
 };
 
 const toast = document.createElement('div');
 toast.className = 'toast';
 toast.style.background  = colors[type] ?? colors.info;
 toast.style.borderColor = borders[type] ?? borders.info;
 toast.innerHTML = `<span>${icons[type]}</span><span>${message}</span>`;
 
 container.appendChild(toast);
 
 setTimeout(() => {
   toast.classList.add('out');
   toast.addEventListener('animationend', () => toast.remove(), { once: true });
 }, 2800);
}
 
export function initTabs(onTabChange) {
 const tabBtns     = document.querySelectorAll('.tab-btn');
 const tabContents = document.querySelectorAll('.tab-content');
 
 const params  = new URLSearchParams(window.location.search);
 const initTab = params.get('tab') ?? 'map';
 switchTab(initTab, tabBtns, tabContents);
 
 tabBtns.forEach(btn => {
   btn.addEventListener('click', () => {
     const target = btn.dataset.tab;
     switchTab(target, tabBtns, tabContents);
     onTabChange?.(target);
   });
 });
}
 
function switchTab(tabId, tabBtns, tabContents) {
 tabBtns.forEach(btn => {
   btn.classList.toggle('active', btn.dataset.tab === tabId);
 });
 tabContents.forEach(content => {
   content.classList.toggle('active', content.id === `tab-${tabId}`);
 });
}
 
export function updateGpsStatus(active) {
 const badge = document.getElementById('gps-status');
 const text  = badge?.querySelector('.status-text');
 if (!badge || !text) return;
 
 badge.classList.toggle('online',  active);
 badge.classList.toggle('offline', !active);
 text.textContent = active ? 'GPS actiu' : 'GPS';
}

