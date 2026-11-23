import { escapeHTML, formatStatutMed } from '../utils/helpers.js';
import { APP_CONFIG } from '../config/constants.js';

export function renderCarteMedicament(med, currentUser) {
  const isPro = currentUser && currentUser.role === APP_CONFIG.ROLES.PROFESSIONNEL;
  const isAdmin = currentUser && currentUser.role === APP_CONFIG.ROLES.ADMIN;
  const dejaVote = currentUser && med.validateurIds.includes(currentUser.id);

  return `
    <div class="card med-card ${med.statut === 'deprecie' ? 'deprecated' : med.statut === 'valide' ? 'validated' : ''}">
      <div>
        <div class="med-header">
          <div>
            <h4>${escapeHTML(med.nom)}</h4>
            <p class="text-sm text-muted">${escapeHTML(med.principeActif)} • ${escapeHTML(med.categorie)}</p>
          </div>
          ${formatStatutMed(med.statut)}
        </div>

        <div class="mt-2 text-sm">
          <p><strong>Code d'authenticité :</strong> <code>${escapeHTML(med.codeAuthentification)}</code></p>
          <p><strong>Score de validation :</strong> ${med.pointsValidation} / ${APP_CONFIG.POINTS.SEUIL_MEDICAMENT_VALIDE} pts</p>
          <p class="mt-1"><strong>Posologie :</strong> ${escapeHTML(med.posologie)}</p>
          <p class="mt-1"><strong>Effets secondaires :</strong> ${escapeHTML(med.effetsSecondaires)}</p>
          ${
            med.statut === 'deprecie'
              ? `<p class="mt-1" style="color:var(--danger);font-weight:600;">⚠️ Motif dépréciation : ${escapeHTML(med.motifDeprecation)}</p>`
              : ''
          }
        </div>
      </div>

      <div class="med-actions">
        <button class="btn btn-primary btn-sm" data-action="ask-med" data-id="${med.id}">
          🤖 Poser une question
        </button>
        ${
          isPro && med.statut !== 'deprecie'
            ? `<button class="btn btn-success btn-sm" data-action="validate-med" data-id="${med.id}" ${dejaVote ? 'disabled' : ''}>
                ${dejaVote ? '✓ Déjà validé' : `👍 Valider (+${APP_CONFIG.POINTS.VALIDATION_MEDICAMENT} pts)`}
              </button>`
            : ''
        }
        ${
          (isPro || isAdmin) && med.statut !== 'deprecie'
            ? `<button class="btn btn-danger btn-sm" data-action="deprecate-med" data-id="${med.id}">
                🚫 Déclarer déprécié
              </button>`
            : ''
        }
      </div>
    </div>
  `;
}