import { ScannerService } from '../services/scannerService.js';
import { MedicamentService } from '../services/medicamentService.js';
import { escapeHTML, formatStatutMed } from '../utils/helpers.js';
import { Notification } from '../components/notification.js';

export function renderScannerPage(container, onNavigate) {
  const meds = MedicamentService.getAll();
  let currentImageDataUrl = null;
  let currentFileName = '';

  container.innerHTML = `
    <div class="page-header">
      <div>
        <h1>Scanner un Médicament</h1>
        <p class="page-subtitle">Prenez en photo la boîte ou importez une image pour vérifier le médicament.</p>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <h3>1. Photo de la boîte</h3>

        <div style="margin-top:0.85rem;">
          <button type="button" id="btn-trigger-photo" class="btn btn-primary" style="width:100%;padding:0.85rem;">
            📷 Prendre une photo / Galerie
          </button>
          <input type="file" id="scan-file-input" accept="image/*" style="position:absolute;left:-9999px;opacity:0;" />
        </div>

        <div id="scan-preview-box" style="margin:1rem 0;text-align:center;"></div>

        <div id="ocr-progress-box" style="display:none;margin-bottom:0.85rem;">
          <div class="text-sm font-bold mb-1" id="ocr-progress-label">Lecture de la boîte... 0%</div>
          <div style="width:100%;height:8px;background:#e2e8f0;border-radius:999px;overflow:hidden;">
            <div id="ocr-progress-bar" style="width:0%;height:100%;background:var(--primary);transition:width 0.2s;"></div>
          </div>
        </div>

        <button id="btn-run-scan" class="btn btn-secondary" style="width:100%;padding:0.85rem;" disabled>
          🔍 Identifier le médicament
        </button>

        <div class="form-group mt-3 pt-2" style="border-top:1px solid var(--border);">
          <label class="form-label text-sm">Ou sélectionnez directement le médicament lu sur la boîte :</label>
          <select id="manual-med-fallback" class="form-control">
            <option value="">-- Choisir parmi les ${meds.length} médicaments --</option>
            ${meds.map(m => `<option value="${m.id}">${escapeHTML(m.nom)}</option>`).join('')}
          </select>
        </div>
      </div>

      <div class="card" id="scan-result-card">
        <h3>2. Résultat de la vérification</h3>
        <p class="text-muted mt-2 text-sm">Appuyez sur <strong>« Prendre une photo / Galerie »</strong>, cadrez bien le nom du médicament sur la boîte, puis appuyez sur <strong>« Identifier le médicament »</strong>.</p>
      </div>
    </div>
  `;

  const btnTrigger = document.getElementById('btn-trigger-photo');
  const fileInput = document.getElementById('scan-file-input');
  const previewBox = document.getElementById('scan-preview-box');
  const btnRunScan = document.getElementById('btn-run-scan');
  const progressBox = document.getElementById('ocr-progress-box');
  const progressBar = document.getElementById('ocr-progress-bar');
  const progressLabel = document.getElementById('ocr-progress-label');
  const manualSelect = document.getElementById('manual-med-fallback');

  btnTrigger.addEventListener('click', () => {
    fileInput.click();
  });

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    currentFileName = file.name || '';

    const reader = new FileReader();
    reader.onload = (ev) => {
      currentImageDataUrl = ev.target.result;
      previewBox.innerHTML = `<img id="captured-preview-img" src="${currentImageDataUrl}" alt="Boîte capturée" style="max-width:100%;max-height:220px;border-radius:8px;border:1px solid var(--border);" />`;
      btnRunScan.disabled = false;
      Notification.show('Photo chargée ! Appuyez sur "Identifier le médicament".', 'info');
    };
    reader.readAsDataURL(file);
  });

  const afficherFicheResultat = (med, confiance = '95%', texteLu = '') => {
    const resultCard = document.getElementById('scan-result-card');
    resultCard.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;gap:0.5rem;flex-wrap:wrap;">
        <h3>Médicament identifié</h3>
        <span class="badge badge-info">Confiance : ${confiance}</span>
      </div>

      <div class="mt-2">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:0.5rem;flex-wrap:wrap;">
          <h4>${escapeHTML(med.nom)}</h4>
          ${formatStatutMed(med.statut)}
        </div>
        <p class="text-sm text-muted mt-1">${escapeHTML(med.principeActif)} • Code : <code>${escapeHTML(med.codeAuthentification)}</code></p>

        ${
          med.statut === 'deprecie'
            ? `<div class="card mt-2" style="background:#fee2e2;color:#991b1b;border-color:#fca5a5;">
                <strong>⚠️ ALERTE DANGER :</strong> Ce médicament est déclaré déprécié (${escapeHTML(med.motifDeprecation)}).
              </div>`
            : `<div class="mt-2 text-sm" style="background:#f8fafc;padding:0.85rem;border-radius:8px;border:1px solid var(--border);">
                <p><strong>Posologie :</strong> ${escapeHTML(med.posologie)}</p>
                <p class="mt-1"><strong>Effets secondaires :</strong> ${escapeHTML(med.effetsSecondaires)}</p>
                <p class="mt-1"><strong>Contre-indications :</strong> ${escapeHTML(med.contreIndications)}</p>
              </div>`
        }

        ${
          texteLu
            ? `<details class="mt-2 text-sm">
                <summary style="cursor:pointer;color:var(--text-muted);">Texte brut lu sur la boîte</summary>
                <pre style="white-space:pre-wrap;background:#f8fafc;padding:0.6rem;border-radius:6px;margin-top:0.4rem;font-size:0.78rem;">${escapeHTML(texteLu)}</pre>
              </details>`
            : ''
        }

        <button class="btn btn-primary mt-3" id="scan-ask-ai-btn" style="width:100%;padding:0.85rem;">
          🤖 Poser des questions sur ce médicament
        </button>
      </div>
    `;

    document.getElementById('scan-ask-ai-btn')?.addEventListener('click', () => {
      sessionStorage.setItem('selected_med_id', med.id);
      onNavigate('assistant');
    });
  };

  manualSelect.addEventListener('change', () => {
    if (!manualSelect.value) return;
    const med = MedicamentService.getById(manualSelect.value);
    if (med) afficherFicheResultat(med, 'Sélection directe');
  });

  btnRunScan.addEventListener('click', async () => {
    if (!currentImageDataUrl) return;

    btnRunScan.disabled = true;
    progressBox.style.display = 'block';
    progressBar.style.width = '15%';
    progressLabel.textContent = 'Compression et lecture de la boîte...';

    try {
      const imgEl = document.getElementById('captured-preview-img');
      const res = await ScannerService.analyserImageReelle(
        currentImageDataUrl,
        imgEl,
        (pct) => {
          progressBar.style.width = `${pct}%`;
          progressLabel.textContent = `Lecture du texte... ${pct}%`;
        },
        currentFileName
      );

      progressBar.style.width = '100%';
      progressLabel.textContent = 'Analyse terminée !';

      if (res.trouveDansCatalogue && res.medicament) {
        afficherFicheResultat(res.medicament, res.confiance, res.texteLu);
      } else {
        const resultCard = document.getElementById('scan-result-card');
        resultCard.innerHTML = `
          <h3>Médicament non reconnu</h3>
          <span class="badge badge-warning mt-1">Non identifié automatiquement</span>
          <p class="text-sm mt-2">
            La photo n'a pas permis de lire clairement un nom du catalogue (reflet ou flou). Vous pouvez choisir le médicament dans la liste déroulante à gauche ou demander à l'Assistant IA.
          </p>
          ${
            res.texteLu
              ? `<pre style="white-space:pre-wrap;background:#f8fafc;padding:0.65rem;border-radius:8px;margin-top:0.6rem;font-size:0.78rem;border:1px solid var(--border);">${escapeHTML(res.texteLu)}</pre>`
              : ''
          }
          <button class="btn btn-primary mt-2" id="scan-ask-free-btn" style="width:100%;">
            🤖 Poser une question à l'Assistant IA
          </button>
        `;
        document.getElementById('scan-ask-free-btn')?.addEventListener('click', () => onNavigate('assistant'));
      }
    } catch (error) {
      Notification.show(error.message || "Erreur lors de l'analyse.", 'error');
    } finally {
      btnRunScan.disabled = false;
    }
  });
}