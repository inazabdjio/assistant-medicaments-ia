import { escapeHTML, formatRoleLabel } from '../utils/helpers.js';
import { AuthService } from '../services/authService.js';
import { Notification } from './notification.js';

export function renderNavbar(currentUser, onNavigate) {
  const container = document.getElementById('navbar-container');
  if (!container) return;

  const roleCourt = currentUser
    ? (currentUser.role === 'professionnel' ? 'Pro Santé' : formatRoleLabel(currentUser.role))
    : '';

  container.innerHTML = `
    <div style="display:flex;align-items:center;gap:0.55rem;min-width:0;overflow:hidden;">
      <button class="menu-toggle" id="sidebar-toggle-btn" aria-label="Menu">☰</button>
      <span class="font-bold navbar-title">MediAssist IA</span>
    </div>
    <div class="navbar-actions" style="display:flex;align-items:center;gap:0.5rem;">
      ${
        currentUser
          ? `
            <span class="badge badge-info">${roleCourt}</span>
            ${
              currentUser.role === 'professionnel'
                ? `<span class="badge badge-success">⭐ ${currentUser.points}</span>`
                : ''
            }
            <button class="btn btn-outline btn-sm" id="logout-btn">Quitter</button>
          `
          : `
            <button class="btn btn-outline btn-sm" id="nav-login-btn">Connexion</button>
            <button class="btn btn-primary btn-sm" id="nav-register-btn">Inscription</button>
          `
      }
    </div>
  `;

  document.getElementById('sidebar-toggle-btn')?.addEventListener('click', () => {
    document.getElementById('sidebar-container')?.classList.toggle('open');
  });

  document.getElementById('logout-btn')?.addEventListener('click', () => {
    AuthService.logout();
    Notification.show('Vous avez été déconnecté.', 'info');
    onNavigate('accueil');
  });

  document.getElementById('nav-login-btn')?.addEventListener('click', () => onNavigate('connexion'));
  document.getElementById('nav-register-btn')?.addEventListener('click', () => onNavigate('inscription'));
}