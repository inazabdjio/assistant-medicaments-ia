import { APP_CONFIG } from '../config/constants.js';

export function renderSidebar(currentRoute, currentUser, onNavigate) {
  const container = document.getElementById('sidebar-container');
  if (!container) return;

  const links = [
    { route: 'accueil', icon: '🏠', label: 'Accueil & Vérification' },
    { route: 'medicaments', icon: '💊', label: 'Catalogue Médicaments' },
    { route: 'assistant', icon: '🤖', label: 'Assistant IA' },
    { route: 'scanner', icon: '📷', label: 'Scanner un Médicament' }
  ];

  if (currentUser) {
    if (currentUser.role === APP_CONFIG.ROLES.PROFESSIONNEL) {
      links.push({ route: 'professionnel', icon: '🩺', label: 'Espace Professionnel' });
    }
    if (currentUser.role === APP_CONFIG.ROLES.ADMIN) {
      links.push({ route: 'administrateur', icon: '🛡️', label: 'Administration' });
    }
    links.push({ route: 'profil', icon: '👤', label: 'Mon Profil & Abonnement' });
  } else {
    links.push({ route: 'connexion', icon: '🔐', label: 'Connexion' });
    links.push({ route: 'inscription', icon: '📝', label: 'Inscription' });
  }

  container.innerHTML = `
    <div class="brand">
      <div class="brand-icon">⚕️</div>
      <div>
        <div>MediAssist IA</div>
        <div style="font-size:0.72rem;color:#94a3b8;font-weight:400;">Santé & IA Vérifiée</div>
      </div>
    </div>
    <ul class="nav-links">
      ${links
        .map(
          l => `
        <li>
          <a class="nav-link ${currentRoute === l.route ? 'active' : ''}" data-route="${l.route}">
            <span>${l.icon}</span>
            <span>${l.label}</span>
          </a>
        </li>
      `
        )
        .join('')}
    </ul>
    <div style="font-size:0.75rem;color:#64748b;padding-top:1rem;border-top:1px solid #1e293b;">
      © 2026 MediAssist IA — v${APP_CONFIG.VERSION}
    </div>
  `;

  container.querySelectorAll('[data-route]').forEach(el => {
    el.addEventListener('click', () => {
      container.classList.remove('open');
      onNavigate(el.dataset.route);
    });
  });
}