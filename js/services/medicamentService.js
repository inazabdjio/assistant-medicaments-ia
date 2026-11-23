import { APP_CONFIG } from '../config/constants.js';
import { Medicament } from '../models/medicament.js';
import { StorageService } from './storageService.js';
import { AuthService } from './authService.js';

export const MedicamentService = {
  getAll() {
    return StorageService.get(APP_CONFIG.STORAGE_KEYS.MEDICAMENTS, []);
  },

  getById(id) {
    return this.getAll().find(m => m.id === id) || null;
  },

  search(query = '', filtreStatut = 'tous') {
    const q = query.trim().toLowerCase();
    return this.getAll().filter(med => {
      const matchQuery =
        !q ||
        med.nom.toLowerCase().includes(q) ||
        med.principeActif.toLowerCase().includes(q) ||
        med.categorie.toLowerCase().includes(q) ||
        med.codeAuthentification.toLowerCase().includes(q);
      const matchStatut = filtreStatut === 'tous' || med.statut === filtreStatut;
      return matchQuery && matchStatut;
    });
  },

  // Cas d'utilisation : Ajouter un médicament (Professionnel de santé)
  ajouterMedicament(data, user) {
    const meds = this.getAll();
    const existe = meds.some(
      m => m.nom.trim().toLowerCase() === data.nom.trim().toLowerCase() && m.statut === 'valide'
    );
    if (existe) {
      return {
        success: false,
        message: 'Exception : Ce médicament existe déjà et est déjà validé dans le catalogue.'
      };
    }

    const nouveau = new Medicament({
      ...data,
      pointsValidation: APP_CONFIG.POINTS.AJOUT_MEDICAMENT,
      validateurIds: [user.id],
      ajoutePar: user.nom
    });
    meds.unshift(nouveau);
    StorageService.set(APP_CONFIG.STORAGE_KEYS.MEDICAMENTS, meds);

    AuthService.ajouterPoints(user.id, APP_CONFIG.POINTS.AJOUT_MEDICAMENT);
    StorageService.addLog(
      `Ajout médicament "${nouveau.nom}" (+${APP_CONFIG.POINTS.AJOUT_MEDICAMENT} pts). Notification envoyée à ${APP_CONFIG.POINTS.NB_PROS_NOTIFIES} autres professionnels.`,
      user.nom
    );

    return {
      success: true,
      medicament: nouveau,
      message: `Médicament ajouté (+${APP_CONFIG.POINTS.AJOUT_MEDICAMENT} points). Une notification de validation a été envoyée à ${APP_CONFIG.POINTS.NB_PROS_NOTIFIES} professionnels de santé.`
    };
  },

  // Validation communautaire : un médicament validé est celui qui a beaucoup de points
  validerMedicament(medId, user) {
    const meds = this.getAll();
    const idx = meds.findIndex(m => m.id === medId);
    if (idx === -1) return { success: false, message: 'Médicament introuvable.' };

    const med = meds[idx];
    if (med.statut === 'deprecie') {
      return { success: false, message: 'Impossible de valider un médicament déclaré déprécié.' };
    }
    if (med.validateurIds.includes(user.id)) {
      return { success: false, message: 'Vous avez déjà attribué vos points de validation à ce médicament.' };
    }

    med.validateurIds.push(user.id);
    med.pointsValidation += APP_CONFIG.POINTS.VALIDATION_MEDICAMENT;

    if (med.pointsValidation >= APP_CONFIG.POINTS.SEUIL_MEDICAMENT_VALIDE) {
      med.statut = 'valide';
    }

    meds[idx] = med;
    StorageService.set(APP_CONFIG.STORAGE_KEYS.MEDICAMENTS, meds);
    AuthService.ajouterPoints(user.id, APP_CONFIG.POINTS.VALIDATION_MEDICAMENT);
    StorageService.addLog(
      `Validation de "${med.nom}" (${med.pointsValidation} pts) (+${APP_CONFIG.POINTS.VALIDATION_MEDICAMENT} pts)`,
      user.nom
    );

    return {
      success: true,
      message:
        med.statut === 'valide'
          ? `Bravo (+${APP_CONFIG.POINTS.VALIDATION_MEDICAMENT} pts) ! "${med.nom}" a atteint ${med.pointsValidation} points et est désormais officiellement VALIDÉ.`
          : `Vote enregistré (+${APP_CONFIG.POINTS.VALIDATION_MEDICAMENT} pts). Score du médicament : ${med.pointsValidation}/${APP_CONFIG.POINTS.SEUIL_MEDICAMENT_VALIDE} pts.`
    };
  },

  // Cas d'utilisation : Déclarer un médicament comme déprécié
  declarerDeprecie(medId, motif, user) {
    const meds = this.getAll();
    const idx = meds.findIndex(m => m.id === medId);
    if (idx === -1) return { success: false, message: 'Médicament introuvable.' };

    meds[idx].statut = 'deprecie';
    meds[idx].motifDeprecation = motif || 'Déclaré déprécié / non recommandé par un professionnel de santé.';
    StorageService.set(APP_CONFIG.STORAGE_KEYS.MEDICAMENTS, meds);

    if (user.role === APP_CONFIG.ROLES.PROFESSIONNEL) {
      AuthService.ajouterPoints(user.id, APP_CONFIG.POINTS.DECLARATION_DEPRECIE);
    }
    StorageService.addLog(`Déclaration dépréciée : "${meds[idx].nom}"`, user.nom);
    return { success: true, message: `"${meds[idx].nom}" a été marqué comme DÉPRÉCIÉ.` };
  },

  // Cas d'utilisation : Vérifier si le médicament est vrai
  verifierAuthenticite(requete) {
    const q = requete.trim().toLowerCase();
    if (!q) return { trouve: false, message: 'Veuillez saisir un nom ou un code d’authentification (ex: MED-CM-2026-8841).' };

    const meds = this.getAll();
    const med = meds.find(
      m => m.codeAuthentification.toLowerCase() === q || m.nom.toLowerCase().includes(q)
    );

    if (!med) {
      return {
        trouve: false,
        authentique: false,
        message: 'ALERTE : Aucun médicament correspondant dans le registre officiel. Risque de contrefaçon ou produit non recensé.'
      };
    }

    if (med.statut === 'deprecie') {
      return {
        trouve: true,
        authentique: false,
        medicament: med,
        message: `DANGER — MÉDICAMENT DÉPRÉCIÉ : "${med.nom}" (${med.codeAuthentification}) est retiré/déprécié. Motif : ${med.motifDeprecation}`
      };
    }

    if (med.statut === 'valide') {
      return {
        trouve: true,
        authentique: true,
        medicament: med,
        message: `AUTHENTIQUE & VALIDÉ (${med.pointsValidation} pts) : "${med.nom}" (${med.codeAuthentification}) est un médicament vrai et vérifié par nos professionnels de santé.`
      };
    }

    return {
      trouve: true,
      authentique: 'en_cours',
      medicament: med,
      message: `EN COURS DE VÉRIFICATION (${med.pointsValidation}/${APP_CONFIG.POINTS.SEUIL_MEDICAMENT_VALIDE} pts) : "${med.nom}" est recensé mais attend encore des validations de professionnels.`
    };
  }
};