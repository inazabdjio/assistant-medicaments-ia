import { AuthService } from '../services/authService.js';
import { AssistantService } from '../services/assistantService.js';
import { StorageService } from '../services/storageService.js';
import { BENCHMARK_QUESTIONS } from '../data/medicaments.js';
import { APP_CONFIG } from '../config/constants.js';
import { escapeHTML } from '../utils/helpers.js';
import { Notification } from '../components/notification.js';

export function renderProfessionnelPage(container, onNavigate) {
  const user = AuthService.getCurrentUser();
  if (!user || user.role !== APP_CONFIG.ROLES.PROFESSIONNEL) {
    onNavigate('accueil');
    return;
  }

  const evaluations = StorageService.get(APP_CONFIG.STORAGE_KEYS.BENCHMARK, []);
  const metrics = AssistantService.calculerMetriques(evaluations);

  container.innerHTML = `
    <div class="page-header">
      <div>
        <h1>Espace Professionnel de Santé</h1>
        <p class="page-subtitle">Ajoutez des médicaments, validez les fiches et évaluez la précision de l'IA (F-Score).</p>
      </div>
      <button class="btn btn-primary" id="btn-go-catalog">💊 Gérer / Valider les médicaments</button>
    </div>

    <div class="grid-4 mb-3">
      <div class="card stat-card">
        <div><div class="text-sm text-muted">Mes Points</div><div class="stat-value">⭐ ${user.points}</div></div>
      </div>
      <div class="card stat-card">
        <div><div class="text-sm text-muted">Précision IA</div><div class="stat-value">${metrics.precision}%</div></div>
      </div>
      <div class="card stat-card">
        <div><div class="text-sm text-muted">Rappel IA</div><div class="stat-value">${metrics.rappel}%</div></div>
      </div>
      <div class="card stat-card">
        <div><div class="text-sm text-muted">F-Score Global</div><div class="stat-value">${metrics.fScore}%</div></div>
      </div>
    </div>

    <div class="card mb-3">
      <h3>📊 Évaluer le système IA (Précision, Rappel, F-Score)</h3>
      <p class="text-sm text-muted mb-2">
        Conformément au cahier des charges, vous pouvez évaluer l'IA avec <strong>vos propres questions</strong> (scénario principal) ou utiliser le <strong>benchmark prédéfini</strong> (scénario alternatif).
      </p>

      <div style="display:flex;gap:0.5rem;margin-bottom:1rem;">
        <button class="btn btn-primary btn-sm" id="mode-custom-btn">Mes propres questions</button>
        <button class="btn btn-outline btn-sm" id="mode-bench-btn">Questions du Benchmark</button>
      </div>

      <div id="bench-selector-box" style="display:none;" class="form-group">
        <label class="form-label">Choisir une question du Benchmark :</label>
        <select id="bench-select" class="form-control">
          ${BENCHMARK_QUESTIONS.map(b => `<option value="${escapeHTML(b.question)}">${escapeHTML(b.question)}</option>`).join('')}
        </select>
      </div>

      <form id="eval-test-form">
        <div class="form-group">
          <label class="form-label">Question de test posée à l'IA</label>
          <input type="text" id="eval-question-input" class="form-control" placeholder="Saisissez votre question médicale de test..." required />
        </div>
        <button type="submit" class="btn btn-secondary">Tester la réponse de l'IA</button>
      </form>

      <div id="eval-verdict-box" class="mt-2"></div>
    </div>
  `;

  document.getElementById('btn-go-catalog')?.addEventListener('click', () => onNavigate('medicaments'));

  const benchBox = document.getElementById('bench-selector-box');
  const qInput = document.getElementById('eval-question-input');
  const benchSelect = document.getElementById('bench-select');

  document.getElementById('mode-custom-btn').addEventListener('click', () => {
    benchBox.style.display = 'none';
    qInput.value = '';
  });

  document.getElementById('mode-bench-btn').addEventListener('click', () => {
    benchBox.style.display = 'block';
    qInput.value = benchSelect.value;
  });

  benchSelect.addEventListener('change', () => {
    qInput.value = benchSelect.value;
  });

  document.getElementById('eval-test-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const question = qInput.value;
    const reponseIA = AssistantService.genererReponse(question);
    const verdictBox = document.getElementById('eval-verdict-box');

    verdictBox.innerHTML = `
      <div class="card" style="background:#f8fafc;">
        <p class="text-sm font-bold">Réponse générée par l'IA :</p>
        <p class="mt-1 mb-2">${escapeHTML(reponseIA)}</p>
        <div style="display:flex;gap:0.75rem;">
          <button class="btn btn-success btn-sm" id="btn-mark-good">✅ Bonne réponse (+${APP_CONFIG.POINTS.EVALUATION_SYSTEME} pts)</button>
          <button class="btn btn-danger btn-sm" id="btn-mark-bad">❌ Réponse incorrecte / incomplète (+${APP_CONFIG.POINTS.EVALUATION_SYSTEME} pts)</button>
        </div>
      </div>
    `;

    const submitVerdict = (isGood) => {
      AssistantService.enregistrerEvaluation(question, reponseIA, isGood, AuthService.getCurrentUser());
      Notification.show(`Évaluation enregistrée (+${APP_CONFIG.POINTS.EVALUATION_SYSTEME} points) !`, 'success');
      renderProfessionnelPage(container, onNavigate);
    };

    document.getElementById('btn-mark-good').addEventListener('click', () => submitVerdict(true));
    document.getElementById('btn-mark-bad').addEventListener('click', () => submitVerdict(false));
  });
}