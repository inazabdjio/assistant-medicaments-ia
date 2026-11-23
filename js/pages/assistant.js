import { AssistantService } from '../services/assistantService.js';
import { MedicamentService } from '../services/medicamentService.js';
import { AuthService } from '../services/authService.js';
import { escapeHTML } from '../utils/helpers.js';

export function renderAssistantPage(container) {
  const currentUser = AuthService.getCurrentUser();
  const meds = MedicamentService.getAll();
  const preselectedId = sessionStorage.getItem('selected_med_id') || '';
  sessionStorage.removeItem('selected_med_id');

  const questionsFrequentes = [
    'Posologie Paracétamol 500mg ?',
    'Posologie Paracétamol sirop enfant ?',
    'Comment prendre le Coartem ?',
    'Pourquoi la Chloroquine est dépréciée ?',
    'Effets secondaires Ibuprofène 400mg ?',
    'Comment préparer le SRO diarrhée ?',
    'Posologie Albendazole 400mg (vermifuge) ?',
    'Que prendre contre les brûlures d’estomac ?',
    'Quels sont les médicaments dépréciés ?',
    'Peut-on prendre Amoxicilline sans ordonnance ?',
    'Posologie Oméprazole 20mg ?',
    'Que prendre contre une allergie ou urticaire ?',
    'Risque alcool avec Métronidazole (Flagyl) ?',
    'Que prendre contre le paludisme ?',
    'Soins pour une plaie ou brûlure ?',
    'Vitamines et fer pendant la grossesse ?'
  ];

  container.innerHTML = `
    <div class="page-header">
      <div>
        <h1>Assistant IA Médicaments (${meds.length} références)</h1>
        <p class="page-subtitle">Posez vos questions sur la posologie, les effets secondaires, les contre-indications ou vos symptômes.</p>
      </div>
      <div style="display:flex;gap:0.5rem;flex-wrap:wrap;">
        <select id="assistant-med-context" class="form-control" style="max-width:290px;">
          <option value="">-- Contexte libre (100 médicaments) --</option>
          ${meds.map(m => `<option value="${m.id}" ${m.id === preselectedId ? 'selected' : ''}>${escapeHTML(m.nom)}</option>`).join('')}
        </select>
        <button type="button" id="btn-random-question" class="btn btn-outline">🎲 Question aléatoire</button>
      </div>
    </div>

    <div class="card">
      <div id="chat-box" class="chat-box">
        <div class="chat-msg ai">
          Bonjour ! Je connais désormais <strong>${meds.length} médicaments</strong> couramment utilisés au Cameroun (antalgiques, antipaludéens, antibiotiques, gastro, vitamines, dermatologie...). Sélectionnez un médicament, cliquez sur une question suggérée ou écrivez la vôtre ci-dessous.
        </div>
      </div>

      <div class="mt-2">
        <div class="text-sm font-bold text-muted mb-1">Questions fréquentes (cliquez pour demander) :</div>
        <div style="display:flex;gap:0.4rem;flex-wrap:wrap;max-height:110px;overflow-y:auto;padding-bottom:0.25rem;">
          ${questionsFrequentes.map(q => `<button type="button" class="btn btn-outline btn-sm quick-q">${escapeHTML(q)}</button>`).join('')}
        </div>
      </div>

      <form id="chat-form" class="chat-input-row">
        <input type="text" id="chat-input" class="form-control" placeholder="Posez n'importe quelle question sur un médicament ou un symptôme..." required />
        <button type="submit" class="btn btn-primary">Envoyer</button>
      </form>
    </div>
  `;

  const chatBox = document.getElementById('chat-box');
  const chatInput = document.getElementById('chat-input');
  const contextSelect = document.getElementById('assistant-med-context');

  const sendMessage = (text) => {
    if (!text.trim()) return;
    const medCible = contextSelect.value ? MedicamentService.getById(contextSelect.value) : null;

    chatBox.innerHTML += `<div class="chat-msg user">${escapeHTML(text)}</div>`;
    const reponse = AssistantService.poserQuestion(text, currentUser, medCible);

    const formatted = escapeHTML(reponse)
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>');

    chatBox.innerHTML += `<div class="chat-msg ai">${formatted}</div>`;
    chatBox.scrollTop = chatBox.scrollHeight;
  };

  if (preselectedId) {
    const med = MedicamentService.getById(preselectedId);
    if (med) sendMessage(`Donne-moi la posologie, les effets secondaires et les contre-indications de ${med.nom}`);
  }

  document.getElementById('chat-form').addEventListener('submit', (e) => {
    e.preventDefault();
    sendMessage(chatInput.value);
    chatInput.value = '';
  });

  container.querySelectorAll('.quick-q').forEach(btn => {
    btn.addEventListener('click', () => sendMessage(btn.textContent));
  });

  // Génère une question pertinente aléatoire parmi les 100 médicaments du catalogue
  document.getElementById('btn-random-question').addEventListener('click', () => {
    const randomMed = meds[Math.floor(Math.random() * meds.length)];
    const templates = [
      `Quelle est la posologie de ${randomMed.nom} ?`,
      `Quels sont les effets secondaires de ${randomMed.nom} ?`,
      `Quelles sont les contre-indications de ${randomMed.nom} ?`,
      `Le médicament ${randomMed.nom} nécessite-t-il une ordonnance ?`
    ];
    const q = templates[Math.floor(Math.random() * templates.length)];
    sendMessage(q);
  });
}