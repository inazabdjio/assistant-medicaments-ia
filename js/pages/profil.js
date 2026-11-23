import { AuthService } from '../services/authService.js';
import { StorageService } from '../services/storageService.js';
import { APP_CONFIG } from '../config/constants.js';
import { escapeHTML, formatRoleLabel } from '../utils/helpers.js';
import { Notification } from '../components/notification.js';

export function renderProfilPage(container, onNavigate) {
  const user = AuthService.getCurrentUser();
  if (!user) {
    onNavigate('connexion');
    return;
  }

  const subscriptions = StorageService.get(APP_CONFIG.STORAGE_KEYS.SUBSCRIPTIONS, []);

  container.innerHTML = `
    <div class="page-header">
      <div>
        <h1>Mon Profil & Abonnement</h1>
        <p class="page-subtitle">Gérez vos informations personnelles et votre formule d'accès.</p>
      </div>
    </div>

    <div class="card mb-3">
      <h3>Informations du compte</h3>
      <div class="grid-2 mt-2 text-sm">
        <div><strong>Nom :</strong> ${escapeHTML(user.nom)}</div>
        <div><strong>Email :</strong> ${escapeHTML(user.email)}</div>
        <div><strong>Rôle :</strong> ${formatRoleLabel(user.role)}</div>
        <div><strong>Date d'inscription :</strong> ${escapeHTML(user.dateInscription)}</div>
        ${
          user.role === 'professionnel'
            ? `<div><strong>Spécialité :</strong> ${escapeHTML(user.specialite)} (${escapeHTML(user.numeroOrdre)})</div>
               <div><strong>Points cumulés :</strong> <span class="badge badge-success">⭐ ${user.points} points</span></div>`
            : ''
        }
      </div>
    </div>

    <h3 class="mb-2">Formules d'abonnement disponibles</h3>
    <div class="grid-3">
      ${subscriptions
        .map(sub => {
          const isCurrent = user.abonnementId === sub.id;
          return `
            <div class="card" style="${isCurrent ? 'border:2px solid var(--primary);' : ''}">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <h4>${escapeHTML(sub.nom)}</h4>
                ${isCurrent ? '<span class="badge badge-success">Actif</span>' : ''}
              </div>
              <div class="stat-value mt-1">${sub.prixMensuel === 0 ? 'Gratuit' : sub.prixMensuel + ' FCFA/mois'}</div>
              <p class="text-sm text-muted mt-1">${escapeHTML(sub.description)}</p>
              <p class="text-sm mt-1"><strong>Quota IA :</strong> ${sub.limiteQuestionsJour} questions / jour</p>
              <button class="btn ${isCurrent ? 'btn-outline' : 'btn-primary'} mt-2" style="width:100%;" data-sub-id="${sub.id}" ${isCurrent ? 'disabled' : ''}>
                ${isCurrent ? 'Abonnement actuel' : 'Choisir cette formule'}
              </button>
            </div>
          `;
        })
        .join('')}
    </div>
  `;

  container.querySelectorAll('[data-sub-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      AuthService.changerAbonnement(user.id, btn.dataset.subId);
      Notification.show('Votre abonnement a été mis à jour !', 'success');
      renderProfilPage(container, onNavigate);
    });
  });
}