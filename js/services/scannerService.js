import { MedicamentService } from './medicamentService.js';

export const ScannerService = {
  /**
   * Normalise un texte (supprime accents, majuscules, caractères spéciaux)
   * pour comparer efficacement le texte lu par l'OCR avec le catalogue.
   */
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
   * Tente de lire un code-barres ou QR code réel sur l'image (API native Android/Chrome)
   */
  async detecterCodeBarres(imageSource) {
    if (!('BarcodeDetector' in window)) return null;
    try {
      const detector = new window.BarcodeDetector({
        formats: ['qr_code', 'ean_13', 'ean_8', 'code_128', 'code_39']
      });
      const codes = await detector.detect(imageSource);
      if (codes && codes.length > 0) {
        return codes[0].rawValue;
      }
    } catch {
      return null;
    }
    return null;
  },

  /**
   * Exécute un vrai OCR (Tesseract.js) sur l'image capturée par la caméra ou importée
   */
  async extraireTexteOCR(imageDataUrl, onProgress = null) {
    if (!window.Tesseract) {
      throw new Error("Le moteur OCR n'est pas encore chargé. Vérifiez votre connexion internet.");
    }

    const result = await window.Tesseract.recognize(imageDataUrl, 'fra+eng', {
      logger: (m) => {
        if (onProgress && m.status === 'recognizing text') {
          onProgress(Math.round(m.progress * 100));
        }
      }
    });

    return {
      texteBrut: result.data.text || '',
      confianceOCR: Math.round(result.data.confidence || 0)
    };
  },

  /**
   * Analyse complète d'une vraie photo de médicament :
   * 1) Lecture Code-barres / QR Code
   * 2) Extraction réelle du texte sur la boîte (OCR)
   * 3) Recherche intelligente dans le catalogue des médicaments
   */
  async analyserImageReelle(imageDataUrl, imageElement, onProgress = null) {
    const meds = MedicamentService.getAll();

    // Étape 1 : Tentative de lecture code-barres / QR code
    let codeDetecte = null;
    if (imageElement) {
      codeDetecte = await this.detecterCodeBarres(imageElement);
    }

    // Étape 2 : Extraction OCR réelle du texte écrit sur la boîte
    const { texteBrut, confianceOCR } = await this.extraireTexteOCR(imageDataUrl, onProgress);
    const texteNorm = this.normaliserTexte(texteBrut);
    const codeNorm = this.normaliserTexte(codeDetecte);

    // Étape 3 : Recherche du médicament correspondant dans le catalogue
    let meilleurMatch = null;
    let meilleurScore = 0;

    for (const med of meds) {
      let score = 0;
      const nomNorm = this.normaliserTexte(med.nom);
      const principeNorm = this.normaliserTexte(med.principeActif);
      const authNorm = this.normaliserTexte(med.codeAuthentification);

      // Correspondance exacte via code QR / code-barres ou code d'authentification
      if (codeNorm && (authNorm.includes(codeNorm) || codeNorm.includes(authNorm))) {
        score += 100;
      }
      if (authNorm && texteNorm.includes(authNorm)) {
        score += 100;
      }

      // Correspondance sur les mots du nom commercial (ex: "paracetamol", "doliprane", "ibuprofene", "pholcodine")
      const motsNom = nomNorm.split(' ').filter(m => m.length >= 4);
      for (const mot of motsNom) {
        if (texteNorm.includes(mot)) score += 35;
      }

      // Correspondance sur le principe actif
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
        confiance: `${Math.min(99, Math.max(confianceOCR, 75))}%`
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