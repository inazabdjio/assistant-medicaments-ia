import { ScannerService } from '../services/scannerService.js';
import { escapeHTML, formatStatutMed } from '../utils/helpers.js';
import { Notification } from '../components/notification.js';

export function renderScannerPage(container, onNavigate) {
  let stream = null;
  let currentImageDataUrl = null;

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      stream = null;
    }
  };

  container.innerHTML = `
    <div class="page-header">
      <div>
        <h1>Scanner un Médicament (Caméra & OCR)</h1>
        <p class="page-subtitle">Prenez en photo la boîte du médicament ou importez une image pour lire automatiquement son nom, vérifier son authenticité et poser des questions.</p>
      </div>
    </div>

    <div class="grid-2">
      <!-- Bloc Caméra & Capture -->
      <div class="card">
        <h3>1. Caméra du téléphone ou photo</h3>

        <div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-top:0.85rem;">
          <label for="scan-file-input" class="btn btn-primary" style="cursor:pointer;margin:0;">
            📷 Prendre une photo / Galerie
          </label>
          <button type="button" id="btn-start-camera" class="btn btn-outline">🎥 Caméra en direct</button>
          <button type="button" id="btn-capture-photo" class="btn btn-success" style="display:none;">⚡ Capturer</button>
          <button type="button" id="btn-stop-camera" class="btn btn-outline" style="display:none;">Arrêter</button>
        </div>

        <input type="file" id="scan-file-input" accept="image/*" capture="environment" style="display:none;" />

        <!-- Flux vidéo en direct de la caméra arrière -->
        <div id="camera-wrapper" style="display:none;margin-top:1rem;position:relative;border-radius:10px;overflow:hidden;background:#000;">
          <video id="camera-video" autoplay playsinline style="width:100%;max-height:300px;object-fit:cover;display:block;"></video>
          <div style="position:absolute;inset:12%;border:2px dashed #10b981;border-radius:8px;pointer-events:none;"></div>
        </div>
        <canvas id="camera-canvas" style="display:none;"></canvas>

        <div id="scan-preview-box" style="margin:1rem 0;text-align:center;"></div>

        <div id="ocr-progress-box" style="display:none;margin-bottom:0.85rem;">
          <div class="text-sm font-bold mb-1" id="ocr-progress-label">Lecture du texte sur la boîte en cours... 0%</div>
          <div style="width:100%;height:8px;background:#e2e8f0;border-radius:999px;overflow:hidden;">
            <div id="ocr-progress-bar" style="width:0%;height:100%;background:var(--primary);transition:width 0.2s;"></div>
          </div>
        </div>

        <button id="btn-run-scan" class="btn btn-secondary" style="width:100%;" disabled>
          🔍 Lancer l'analyse réelle (OCR + Catalogue)
        </button>
      </div>

      <!-- Bloc Résultat -->
      <div class="card" id="scan-result-card">
        <h3>2. Résultat de la reconnaissance</h3>
        <p class="text-muted mt-2">Appuyez sur <strong>« Prendre une photo / Galerie »</strong> ou ouvrez la caméra pour scanner une boîte de médicament bien éclairée.</p>
      </div>
    </div>
  `;

  const video = document.getElementById('camera-video');
  const canvas = document.getElementById('camera-canvas');
  const cameraWrapper = document.getElementById('camera-wrapper');
  const btnStartCam = document.getElementById('btn-start-camera');
  const btnCapture = document.getElementById('btn-capture-photo');
  const btnStopCam = document.getElementById('btn-stop-camera');
  const fileInput = document.getElementById('scan-file-input');
  const previewBox = document.getElementById('scan-preview-box');
  const btnRunScan = document.getElementById('btn-run-scan');
  const progressBox = document.getElementById('ocr-progress-box');
  const progressBar = document.getElementById('ocr-progress-bar');
  const progressLabel = document.getElementById('ocr-progress-label');

  const afficherApercu = (dataUrl) => {
    currentImageDataUrl = dataUrl;
    previewBox.innerHTML = `<img id="captured-preview-img" src="${dataUrl}" alt="Boîte capturée" style="max-height:220px;border-radius:8px;border:1px solid var(--border);" />`;
    btnRunScan.disabled = false;
  };

  // 1. Démarrer la caméra arrière en direct (navigateur / PWA)
  btnStartCam.addEventListener('click', async () => {
    try {
      stopCamera();
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false
      });
      video.srcObject = stream;
      cameraWrapper.style.display = 'block';
      btnCapture.style.display = 'inline-flex';
      btnStopCam.style.display = 'inline-flex';
      btnStartCam.style.display = 'none';
    } catch {
      Notification.show("Utilisez le bouton vert/bleu 'Prendre une photo / Galerie' pour ouvrir directement l'appareil photo du téléphone.", 'warning', 5000);
    }
  });

  // 2. Capturer l'image depuis la vidéo en direct
  btnCapture.addEventListener('click', () => {
    if (!video.videoWidth) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    afficherApercu(dataUrl);

    stopCamera();
    cameraWrapper.style.display = 'none';
    btnCapture.style.display = 'none';
    btnStopCam.style.display = 'none';
    btnStartCam.style.display = 'inline-flex';
    Notification.show('Photo capturée ! Cliquez sur "Lancer l’analyse réelle".', 'info');
  });

  btnStopCam.addEventListener('click', () => {
    stopCamera();
    cameraWrapper.style.display = 'none';
    btnCapture.style.display = 'none';
    btnStopCam.style.display = 'none';
    btnStartCam.style.display = 'inline-flex';
  });

  // 3. Appareil photo natif Android (100% compatible WebIntoApp APK) ou Galerie
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    stopCamera();
    cameraWrapper.style.display = 'none';
    btnCapture.style.display = 'none';
    btnStopCam.style.display = 'none';
    btnStartCam.style.display = 'inline-flex';

    const reader = new FileReader();
    reader.onload = (ev) => {
      afficherApercu(ev.target.result);
    };
    reader.readAsDataURL(file);
  });

  // 4. Exécution réelle de l'analyse OCR + Code-barres + Catalogue
  btnRunScan.addEventListener('click', async () => {
    if (!currentImageDataUrl) return;

    btnRunScan.disabled = true;
    progressBox.style.display = 'block';
    progressBar.style.width = '10%';
    progressLabel.textContent = 'Initialisation du lecteur optique...';

    try {
      const imgEl = document.getElementById('captured-preview-img');
      const res = await ScannerService.analyserImageReelle(currentImageDataUrl, imgEl, (pct) => {
        progressBar.style.width = `${pct}%`;
        progressLabel.textContent = `Lecture du texte sur la boîte... ${pct}%`;
      });

      progressBar.style.width = '100%';
      progressLabel.textContent = 'Analyse terminée !';

      const resultCard = document.getElementById('scan-result-card');

      if (res.trouveDansCatalogue && res.medicament) {
        const med = res.medicament;
        resultCard.innerHTML = `
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <h3>Médicament identifié</h3>
            <span class="badge badge-info">Confiance : ${res.confiance}</span>
          </div>

          <div class="mt-2">
            <div style="display:flex;justify-content:space-between;align-items:center;gap:0.5rem;">
              <h4>${escapeHTML(med.nom)}</h4>
              ${formatStatutMed(med.statut)}
            </div>
            <p class="text-sm text-muted">${escapeHTML(med.principeActif)} • Code : <code>${escapeHTML(med.codeAuthentification)}</code></p>

            ${
              med.statut === 'deprecie'
                ? `<div class="card mt-2" style="background:#fee2e2;color:#991b1b;">
                    <strong>⚠️ ALERTE DANGER :</strong> Ce médicament est déclaré déprécié (${escapeHTML(med.motifDeprecation)}).
                  </div>`
                : `<div class="mt-2 text-sm">
                    <p><strong>Posologie :</strong> ${escapeHTML(med.posologie)}</p>
                    <p class="mt-1"><strong>Effets secondaires :</strong> ${escapeHTML(med.effetsSecondaires)}</p>
                  </div>`
            }

            <details class="mt-2 text-sm">
              <summary style="cursor:pointer;color:var(--text-muted);">Voir le texte brut lu sur la boîte (OCR)</summary>
              <pre style="white-space:pre-wrap;background:#f8fafc;padding:0.6rem;border-radius:6px;margin-top:0.4rem;font-size:0.8rem;">${escapeHTML(res.texteLu || 'Aucun texte brut')}</pre>
            </details>

            <button class="btn btn-primary mt-3" id="scan-ask-ai-btn" style="width:100%;">
              🤖 Poser des questions sur ce médicament
            </button>
          </div>
        `;

        document.getElementById('scan-ask-ai-btn')?.addEventListener('click', () => {
          sessionStorage.setItem('selected_med_id', med.id);
          onNavigate('assistant');
        });
      } else {
        resultCard.innerHTML = `
          <h3>Médicament non reconnu dans le catalogue</h3>
          <span class="badge badge-danger mt-1">ALERTE — Non trouvé dans le registre validé</span>
          <p class="text-sm mt-2">
            Le scanner a lu le texte suivant sur l'emballage, mais aucun médicament validé ne correspond :
          </p>
          <pre style="white-space:pre-wrap;background:#f8fafc;padding:0.75rem;border-radius:8px;margin-top:0.6rem;font-size:0.82rem;border:1px solid var(--border);">${escapeHTML(res.texteLu || 'Texte illisible — essayez de rapprocher la caméra avec un bon éclairage.')}</pre>
          <button class="btn btn-outline mt-2" id="scan-ask-free-btn" style="width:100%;">
            🤖 Demander conseil à l'Assistant IA
          </button>
        `;

        document.getElementById('scan-ask-free-btn')?.addEventListener('click', () => {
          onNavigate('assistant');
        });
      }
    } catch (error) {
      Notification.show(error.message || "Erreur lors de l'analyse de l'image.", 'error', 5000);
    } finally {
      btnRunScan.disabled = false;
    }
  });
}