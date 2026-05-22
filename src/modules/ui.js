// ================================================
//  UI - Toast notifications i navegació per tabs
// ================================================

/**
 * Mostra una notificació toast temporal
 * @param {string} message
 * @param {'info'|'success'|'error'|'warning'} type
 */
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
    success: 'rgba(16,185,129,0.15)',
    error:   'rgba(239,68,68,0.15)',
    info:    'rgba(6,182,212,0.15)',
    warning: 'rgba(245,158,11,0.15)',
  };

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.style.background = colors[type] ?? colors.info;
  toast.innerHTML = `<span>${icons[type]}</span><span>${message}</span>`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('out');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  }, 2800);
}

/**
 * Inicialitza la navegació per tabs
 * @param {Function} onTabChange - Callback cridat amb l'id del tab actiu
 */
export function initTabs(onTabChange) {
  const tabBtns     = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  // Llegir tab inicial de la URL (?tab=camera)
  const params   = new URLSearchParams(window.location.search);
  const initTab  = params.get('tab') ?? 'camera';
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

/**
 * Actualitza el badge d'estat dels sensors al header
 * @param {boolean} active
 */
export function updateStatusBadge(active) {
  const badge    = document.getElementById('sensor-status');
  const text     = badge?.querySelector('.status-text');
  if (!badge || !text) return;

  badge.classList.toggle('online',  active);
  badge.classList.toggle('offline', !active);
  text.textContent = active ? 'Actiu' : 'Sensors';
}