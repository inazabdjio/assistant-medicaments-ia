import { MedicamentService } from '../services/medicamentService.js';
import { AuthService } from '../services/authService.js';
import { escapeHTML } from '../utils/helpers.js';

export function renderAccueilPage(container, onNavigate) {
  const meds = MedicamentService.getAll();
  const valides = meds.filter(m => m.statut === 'valide').length;
  const deprecies = meds.filter(m => m.statut === 'deprecie').length;
  const pros = AuthService.getUsers().filter(u => u.role === 'professionnel' && u.estValide).length;

  container.innerHTML = `
    <div class="page-header">
      <div>
        <h1>Bienvenue sur MediAssist IA</h1>
        <p class="page-subtitle">Vérifiez vos médicaments sans ordonnance, consultez leur posologie et évitez les produits dépréciés.</p>
      </div>
      <div style="display:flex;gap:0.5rem;">
        <button class="btn btn-primary" id="go-assistant">🤖 Poser une question à l'IA</button>
        <button class="btn btn-secondary" id="go-scanner">📷 Scanner une boîte</button>
      </div>
    </div>

    <div class="grid-4 mb-3">
      <div class="card stat-card">
        <div><div class="text-sm text-muted">Médicaments recensés</div><div class="stat-value">${meds.length}</div></div>
        <span style="font-size:2rem;">💊</span>
      </div>
      <div class="card stat-card">
        <div><div class="text-sm text-muted">Médicaments validés</div><div class="stat-value" style="color:var(--success);">${valides}</div></div>
        <span style="font-size:2rem;">✅</span>
      </div>
      <div class="card stat-card">
        <div><div class="text-sm text-muted">Alertes dépréciés</div><div class="stat-value" style="color:var(--danger);">${deprecies}</div></div>
        <span style="font-size:2rem;">⚠️</span>
      </div>
      <div class="card stat-card">
        <div><div class="text-sm text-muted">Professionnels santé</div><div class="stat-value">${pros}</div></div>
        <span style="font-size:2rem;">🩺</span>
      </div>
    </div>

    <div class="card mb-3">
      <h3>🔍 Vérifier si un médicament est vrai ou déprécié</h3>
      <p class="text-sm text-muted mb-2">Saisissez le nom du médicament ou son code d'authentification (ex : <code>MED-CM-2026-8841</code> ou <code>Pholcodine</code>).</p>
      <form id="verify-med-form" style="display:flex;gap:0.75rem;flex-wrap:wrap;">
        <input type="text" id="verify-query" class="form-control" style="flex:1;min-width:240px;" placeholder="Nom du médicament ou code MED-CM-..." required />
        <button type="submit" class="btn btn-primary">Vérifier l'authenticité</button>
      </form>
      <div id="verify-result" class="mt-2"></div>
    </div>

    <div class="grid-3">
      <div class="card">
        <h4>1. Usagers</h4>
        <p class="text-sm text-muted mt-1">Posez vos questions sur la posologie et les effets secondaires ou scannez directement la photo d'un médicament.</p>
      </div>
      <div class="card">
        <h4>2. Professionnels de santé</h4>
        <p class="text-sm text-muted mt-1">Recensez de nouveaux médicaments, validez les fiches de vos confrères pour gagner des points et évaluez la précision de l'IA.</p>
      </div>
      <div class="card">
        <h4>3. Administrateurs</h4>
        <p class="text-sm text-muted mt-1">Validez les diplômes/comptes des professionnels de santé, monitorez l'activité et vérifiez la véracité des réponses IA.</p>
      </div>
    </div>
  `;

  document.getElementById('go-assistant')?.addEventListener('click', () => onNavigate('assistant'));
  document.getElementById('go-scanner')?.addEventListener('click', () => onNavigate('scanner'));

  document.getElementById('verify-med-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = document.getElementById('verify-query').value;
    const res = MedicamentService.verifierAuthenticite(query);
    const resultDiv = document.getElementById('verify-result');

    let alertClass = 'badge-danger';
    if (res.authentique === true) alertClass = 'badge-success';
    else if (res.authentique === 'en_cours') alertClass = 'badge-warning';

    resultDiv.innerHTML = `
      <div class="card" style="background:#f8fafc;">
        <span class="badge ${alertClass} mb-1">${res.authentique === true ? 'VRAI & VALIDÉ' : res.authentique === 'en_cours' ? 'EN COURS' : 'ALERTE'}</span>
        <p class="font-bold">${escapeHTML(res.message)}</p>
      </div>
    `;
  });
}