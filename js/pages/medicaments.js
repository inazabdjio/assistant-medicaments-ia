import { MedicamentService } from '../services/medicamentService.js';
import { AuthService } from '../services/authService.js';
import { renderCarteMedicament } from '../components/carteMedicament.js';
import { Modal } from '../components/modal.js';
import { Notification } from '../components/notification.js';
import { APP_CONFIG } from '../config/constants.js';

export function renderMedicamentsPage(container, onNavigate) {
  const currentUser = AuthService.getCurrentUser();
  const isPro = currentUser && currentUser.role === APP_CONFIG.ROLES.PROFESSIONNEL;

  container.innerHTML = `
    <div class="page-header">
      <div>
        <h1>Catalogue des Médicaments</h1>
        <p class="page-subtitle">Base recensée et validée par points par les professionnels de santé.</p>
      </div>
      ${isPro ? `<button class="btn btn-primary" id="btn-open-add-med">+ Ajouter un médicament</button>` : ''}
    </div>

    <div class="card mb-3" style="display:flex;gap:0.75rem;flex-wrap:wrap;">
      <input type="text" id="med-search-input" class="form-control" style="flex:1;min-width:220px;" placeholder="Rechercher par nom, principe actif, code..." />
      <select id="med-filter-status" class="form-control" style="width:220px;">
        <option value="tous">Tous les statuts</option>
        <option value="valide">Validés & Vrais</option>
        <option value="en_attente">En cours de validation</option>
        <option value="deprecie">Dépréciés / Retirés</option>
      </select>
    </div>

    <div id="med-list-grid" class="grid-2"></div>
  `;

  const renderList = () => {
    const query = document.getElementById('med-search-input').value;
    const status = document.getElementById('med-filter-status').value;
    const list = MedicamentService.search(query, status);
    const grid = document.getElementById('med-list-grid');

    if (list.length === 0) {
      grid.innerHTML = `<div class="card"><p class="text-muted">Aucun médicament trouvé pour cette recherche.</p></div>`;
      return;
    }

    grid.innerHTML = list.map(m => renderCarteMedicament(m, AuthService.getCurrentUser())).join('');

    grid.querySelectorAll('[data-action="ask-med"]').forEach(btn => {
      btn.addEventListener('click', () => {
        sessionStorage.setItem('selected_med_id', btn.dataset.id);
        onNavigate('assistant');
      });
    });

    grid.querySelectorAll('[data-action="validate-med"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const res = MedicamentService.validerMedicament(btn.dataset.id, AuthService.getCurrentUser());
        Notification.show(res.message, res.success ? 'success' : 'warning');
        renderList();
      });
    });

    grid.querySelectorAll('[data-action="deprecate-med"]').forEach(btn => {
      btn.addEventListener('click', () => {
        Modal.open(
          'Déclarer ce médicament comme déprécié',
          `
          <form id="deprecate-form">
            <div class="form-group">
              <label class="form-label">Motif officiel de dépréciation / retrait</label>
              <textarea id="deprecate-reason" class="form-control" required placeholder="Ex: Retiré par les autorités sanitaires, risque d'effets indésirables graves..."></textarea>
            </div>
            <button type="submit" class="btn btn-danger">Confirmer la dépréciation</button>
          </form>
        `
        );
        document.getElementById('deprecate-form').addEventListener('submit', (e) => {
          e.preventDefault();
          const motif = document.getElementById('deprecate-reason').value;
          const res = MedicamentService.declarerDeprecie(btn.dataset.id, motif, AuthService.getCurrentUser());
          Modal.close();
          Notification.show(res.message, 'warning');
          renderList();
        });
      });
    });
  };

  document.getElementById('med-search-input').addEventListener('input', renderList);
  document.getElementById('med-filter-status').addEventListener('change', renderList);

  document.getElementById('btn-open-add-med')?.addEventListener('click', () => {
    Modal.open(
      'Ajouter un nouveau médicament au catalogue',
      `
      <form id="add-med-form">
        <div class="form-group">
          <label class="form-label">Nom commercial & dosage</label>
          <input type="text" id="new-med-nom" class="form-control" placeholder="Ex: Amoxicilline 500mg" required />
        </div>
        <div class="form-group">
          <label class="form-label">Principe actif</label>
          <input type="text" id="new-med-principe" class="form-control" required />
        </div>
        <div class="form-group">
          <label class="form-label">Catégorie thérapeutique</label>
          <input type="text" id="new-med-cat" class="form-control" placeholder="Ex: Antalgique, Antihistaminique..." required />
        </div>
        <div class="form-group">
          <label class="form-label">Posologie détaillée</label>
          <textarea id="new-med-poso" class="form-control" required></textarea>
        </div>
        <div class="form-group">
          <label class="form-label">Effets secondaires</label>
          <textarea id="new-med-effets" class="form-control" required></textarea>
        </div>
        <div class="form-group">
          <label class="form-label">Contre-indications</label>
          <input type="text" id="new-med-ci" class="form-control" />
        </div>
        <button type="submit" class="btn btn-primary">Enregistrer & Notifier 5 professionnels</button>
      </form>
    `
    );

    document.getElementById('add-med-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const res = MedicamentService.ajouterMedicament(
        {
          nom: document.getElementById('new-med-nom').value,
          principeActif: document.getElementById('new-med-principe').value,
          categorie: document.getElementById('new-med-cat').value,
          posologie: document.getElementById('new-med-poso').value,
          effetsSecondaires: document.getElementById('new-med-effets').value,
          contreIndications: document.getElementById('new-med-ci').value
        },
        AuthService.getCurrentUser()
      );
      if (!res.success) {
        Notification.show(res.message, 'error', 5000);
        return;
      }
      Modal.close();
      Notification.show(res.message, 'success', 5500);
      renderList();
    });
  });

  renderList();
}