import { escapeHTML, formatRoleLabel } from '../utils/helpers.js';
import { AuthService } from '../services/authService.js';
import { Notification } from './notification.js';

export function renderNavbar(currentUser, onNavigate) {
  const container = document.getElementById('navbar-container');
  if (!container) return;

  container.innerHTML = `
    <div style="display:flex;align-items:center;gap:0.75rem;">
      <button class="menu-toggle" id="sidebar-toggle-btn">☰</button>
      <span class="font-bold">Assistant Médicaments Sans Ordonnance</span>
    </div>
    <div style="display:flex;align-items:center;gap:0.85rem;">
      ${
        currentUser
          ? `
            <span class="badge badge-info">${formatRoleLabel(currentUser.role)}</span>
            ${
              currentUser.role === 'professionnel'
                ? `<span class="badge badge-success">⭐ ${currentUser.points} pts</span>`
                : ''
            }
            <span class="text-sm font-bold">${escapeHTML(currentUser.nom)}</span>
            <button class="btn btn-outline btn-sm" id="logout-btn">Déconnexion</button>
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