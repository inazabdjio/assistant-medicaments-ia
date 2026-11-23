import { AuthService } from '../services/authService.js';
import { AssistantService } from '../services/assistantService.js';
import { StorageService } from '../services/storageService.js';
import { APP_CONFIG } from '../config/constants.js';
import { escapeHTML, formatRoleLabel } from '../utils/helpers.js';
import { Notification } from '../components/notification.js';

export function renderAdministrateurPage(container, onNavigate) {
  const admin = AuthService.getCurrentUser();
  if (!admin || admin.role !== APP_CONFIG.ROLES.ADMIN) {
    onNavigate('accueil');
    return;
  }

  const users = AuthService.getUsers();
  const prosEnAttente = users.filter(u => u.role === 'professionnel' && !u.estValide);
  const qaHistory = StorageService.get(APP_CONFIG.STORAGE_KEYS.QA_HISTORY, []);
  const subscriptions = StorageService.get(APP_CONFIG.STORAGE_KEYS.SUBSCRIPTIONS, []);
  const logs = StorageService.get(APP_CONFIG.STORAGE_KEYS.LOGS, []);

  container.innerHTML = `
    <div class="page-header">
      <div>
        <h1>Tableau de Bord Administrateur</h1>
        <p class="page-subtitle">Validation des professionnels, gestion des comptes, monitoring, audit IA et abonnements.</p>
      </div>
    </div>

    <!-- 1. Validation des comptes professionnels (Scénario principal du cahier) -->
    <div class="card mb-3">
      <h3>🔔 Demandes de validation Professionnels de Santé (${prosEnAttente.length})</h3>
      ${
        prosEnAttente.length === 0
          ? `<p class="text-sm text-muted mt-1">Aucune demande en attente de validation.</p>`
          : `<div class="table-responsive mt-2">
              <table>
                <thead><tr><th>Nom</th><th>Email</th><th>Spécialité</th><th>N° Ordre</th><th>Action</th></tr></thead>
                <tbody>
                  ${prosEnAttente
                    .map(
                      p => `
                    <tr>
                      <td>${escapeHTML(p.nom)}</td>
                      <td>${escapeHTML(p.email)}</td>
                      <td>${escapeHTML(p.specialite)}</td>
                      <td><code>${escapeHTML(p.numeroOrdre)}</code></td>
                      <td>
                        <button class="btn btn-success btn-sm" data-valider-pro="${p.id}">Valider le compte</button>
                      </td>
                    </tr>
                  `
                    )
                    .join('')}
                </tbody>
              </table>
            </div>`
      }
    </div>

    <!-- 2. Gestion / Suppression des comptes utilisateurs -->
    <div class="card mb-3">
      <h3>👥 Liste des utilisateurs du système (${users.length})</h3>
      <div class="table-responsive mt-2">
        <table>
          <thead><tr><th>Nom</th><th>Rôle</th><th>Statut</th><th>Points</th><th>Action</th></tr></thead>
          <tbody>
            ${users
              .map(
                u => `
              <tr>
                <td>${escapeHTML(u.nom)}<br/><span class="text-sm text-muted">${escapeHTML(u.email)}</span></td>
                <td>${formatRoleLabel(u.role)}</td>
                <td>${u.estValide ? '<span class="badge badge-success">Actif</span>' : '<span class="badge badge-warning">En attente</span>'}</td>
                <td>${u.points} pts</td>
                <td>
                  ${
                    u.role !== 'admin'
                      ? `<button class="btn btn-danger btn-sm" data-delete-user="${u.id}">Supprimer</button>`
                      : '<span class="text-muted text-sm">Protégé</span>'
                  }
                </td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- 3. Vérifier la véracité des réponses de l'IA -->
    <div class="card mb-3">
      <h3>🤖 Vérification de la véracité des réponses IA</h3>
      <div class="table-responsive mt-2">
        <table>
          <thead><tr><th>Question posée</th><th>Réponse IA</th><th>Statut véracité</th><th>Audit</th></tr></thead>
          <tbody>
            ${qaHistory
              .slice(0, 8)
              .map(
                qa => `
              <tr>
                <td><strong>${escapeHTML(qa.question)}</strong><br/><span class="text-sm text-muted">${escapeHTML(qa.auteur)}</span></td>
                <td class="text-sm">${escapeHTML(qa.reponse).slice(0, 130)}...</td>
                <td>
                  <span class="badge ${qa.veracite === 'verifiee' ? 'badge-success' : qa.veracite === 'corrigee' ? 'badge-danger' : 'badge-warning'}">
                    ${qa.veracite}
                  </span>
                </td>
                <td style="display:flex;gap:0.35rem;">
                  <button class="btn btn-success btn-sm" data-qa-id="${qa.id}" data-veracite="verifiee">✓ Exacte</button>
                  <button class="btn btn-warning btn-sm" data-qa-id="${qa.id}" data-veracite="corrigee">⚠️ À revoir</button>
                </td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- 4. Gestion des abonnements + Monitoring -->
    <div class="grid-2">
      <div class="card">
        <h3>💳 Gestion des abonnements</h3>
        <form id="add-sub-form" class="mt-2">
          <div class="form-group">
            <label class="form-label">Nom de la nouvelle formule</label>
            <input type="text" id="sub-nom" class="form-control" placeholder="Ex: Clinique Partner" required />
          </div>
          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">Prix mensuel (FCFA)</label>
              <input type="number" id="sub-prix" class="form-control" value="10000" required />
            </div>
            <div class="form-group">
              <label class="form-label">Questions IA / jour</label>
              <input type="number" id="sub-quota" class="form-control" value="500" required />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Description</label>
            <input type="text" id="sub-desc" class="form-control" required />
          </div>
          <button type="submit" class="btn btn-primary btn-sm">+ Ajouter ce mode d'abonnement</button>
        </form>
        <ul class="mt-2 text-sm" style="padding-left:1.2rem;">
          ${subscriptions.map(s => `<li><strong>${escapeHTML(s.nom)}</strong> : ${s.prixMensuel} FCFA/mois (${s.limiteQuestionsJour} q/j)</li>`).join('')}
        </ul>
      </div>

      <div class="card">
        <h3>📈 Monitoring & Journal d'activité</h3>
        <div style="max-height:290px;overflow-y:auto;margin-top:0.75rem;" class="text-sm">
          ${
            logs.length === 0
              ? '<p class="text-muted">Aucune activité enregistrée.</p>'
              : logs
                  .map(
                    l => `
                <div style="padding:0.5rem 0;border-bottom:1px solid var(--border);">
                  <span class="text-muted">[${escapeHTML(l.date)}]</span> <strong>${escapeHTML(l.acteur)}</strong> : ${escapeHTML(l.action)}
                </div>
              `
                  )
                  .join('')
          }
        </div>
      </div>
    </div>
  `;

  container.querySelectorAll('[data-valider-pro]').forEach(btn => {
    btn.addEventListener('click', () => {
      AuthService.validerCompteProfessionnel(btn.dataset.validerPro, admin.nom);
      Notification.show('Compte professionnel validé et notifié !', 'success');
      renderAdministrateurPage(container, onNavigate);
    });
  });

  container.querySelectorAll('[data-delete-user]').forEach(btn => {
    btn.addEventListener('click', () => {
      AuthService.supprimerCompteUsager(btn.dataset.deleteUser, admin.nom);
      Notification.show('Compte utilisateur supprimé.', 'warning');
      renderAdministrateurPage(container, onNavigate);
    });
  });

  container.querySelectorAll('[data-qa-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      AssistantService.validerVeraciteReponse(btn.dataset.qaId, btn.dataset.veracite, admin.nom);
      Notification.show('Statut de véracité mis à jour.', 'info');
      renderAdministrateurPage(container, onNavigate);
    });
  });

  document.getElementById('add-sub-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const subs = StorageService.get(APP_CONFIG.STORAGE_KEYS.SUBSCRIPTIONS, []);
    subs.push({
      id: `sub-${Date.now()}`,
      nom: document.getElementById('sub-nom').value,
      prixMensuel: Number(document.getElementById('sub-prix').value),
      limiteQuestionsJour: Number(document.getElementById('sub-quota').value),
      accesScannerIllimite: true,
      description: document.getElementById('sub-desc').value
    });
    StorageService.set(APP_CONFIG.STORAGE_KEYS.SUBSCRIPTIONS, subs);
    StorageService.addLog('Ajout d’un nouveau mode d’abonnement', admin.nom);
    Notification.show('Nouvel abonnement ajouté !', 'success');
    renderAdministrateurPage(container, onNavigate);
  });
}