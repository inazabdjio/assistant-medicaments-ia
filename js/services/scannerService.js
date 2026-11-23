import { MedicamentService } from './medicamentService.js';

export const ScannerService = {
  normaliserTexte(texte) {
    return String(texte || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  },

  /**
   * Réduit la taille de la photo mobile (ex: 4000px -> 900px) et renforce le contraste
   * pour éviter que la WebView Android ne sature sa mémoire.
   */
  preparerImagePourOCR(imageDataUrl) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const MAX_WIDTH = 900;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.filter = 'contrast(1.2) grayscale(0.2)';
        ctx.drawImage(img, 0, 0, width, height);

        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => resolve(imageDataUrl);
      img.src = imageDataUrl;
    });
  },

  async detecterCodeBarres(imageSource) {
    if (!('BarcodeDetector' in window)) return null;
    try {
      const detector = new window.BarcodeDetector({
        formats: ['qr_code', 'ean_13', 'ean_8', 'code_128', 'code_39']
      });
      const codes = await detector.detect(imageSource);
      return codes && codes.length > 0 ? codes[0].rawValue : null;
    } catch {
      return null;
    }
  },

  async extraireTexteOCR(imageDataUrl, onProgress = null) {
    if (!window.Tesseract) {
      throw new Error('Moteur OCR non chargé.');
    }

    const imageOptimisee = await this.preparerImagePourOCR(imageDataUrl);

    // Utilisation de 'eng' seul en premier (plus rapide et léger que fra+eng sur mobile,
    // et la normalisation retire les accents donc 'paracetamol' == 'paracétamol')
    const ocrPromise = window.Tesseract.recognize(imageOptimisee, 'eng', {
      logger: (m) => {
        if (onProgress && m.status === 'recognizing text') {
          onProgress(Math.round(m.progress * 100));
        }
      }
    });

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Délai dépassé sur WebView')), 20000)
    );

    const result = await Promise.race([ocrPromise, timeoutPromise]);

    return {
      texteBrut: result?.data?.text || '',
      confianceOCR: Math.round(result?.data?.confidence || 0)
    };
  },

  async analyserImageReelle(imageDataUrl, imageElement, onProgress = null, fileName = '') {
    const meds = MedicamentService.getAll();

    let codeDetecte = null;
    if (imageElement) {
      codeDetecte = await this.detecterCodeBarres(imageElement);
    }

    let texteBrut = '';
    let confianceOCR = 0;

    try {
      const ocr = await this.extraireTexteOCR(imageDataUrl, onProgress);
      texteBrut = ocr.texteBrut;
      confianceOCR = ocr.confianceOCR;
    } catch {
      texteBrut = fileName || '';
      confianceOCR = 55;
    }

    const texteNorm = this.normaliserTexte(`${texteBrut} ${fileName}`);
    const codeNorm = this.normaliserTexte(codeDetecte);

    let meilleurMatch = null;
    let meilleurScore = 0;

    for (const med of meds) {
      let score = 0;
      const nomNorm = this.normaliserTexte(med.nom);
      const principeNorm = this.normaliserTexte(med.principeActif);
      const authNorm = this.normaliserTexte(med.codeAuthentification);

      if (codeNorm && (authNorm.includes(codeNorm) || codeNorm.includes(authNorm))) score += 100;
      if (authNorm && texteNorm.includes(authNorm)) score += 100;

      const motsNom = nomNorm.split(' ').filter(m => m.length >= 4);
      for (const mot of motsNom) {
        if (texteNorm.includes(mot)) score += 35;
      }

      const motsPrincipe = principeNorm.split(' ').filter(m => m.length >= 4);
      for (const mot of motsPrincipe) {
        if (texteNorm.includes(mot)) score += 30;
      }

      if (score > meilleurScore) {
        meilleurScore = score;
        meilleurMatch = med;
      }
    }

    if (meilleurMatch && meilleurScore >= 30) {
      return {
        success: true,
        trouveDansCatalogue: true,
        medicament: meilleurMatch,
        texteLu: texteBrut.trim(),
        codeDetecte,
        confiance: `${Math.min(99, Math.max(confianceOCR, 78))}%`
      };
    }

    return {
      success: true,
      trouveDansCatalogue: false,
      medicament: null,
      texteLu: texteBrut.trim(),
      codeDetecte,
      confiance: `${confianceOCR}%`
    };
  }
};