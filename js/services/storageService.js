import { APP_CONFIG } from '../config/constants.js';
import { INITIAL_MEDICAMENTS, CATALOG_VERSION } from '../data/medicaments.js';

export const StorageService = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  },

  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },

  addLog(action, acteur) {
    const logs = this.get(APP_CONFIG.STORAGE_KEYS.LOGS, []);
    logs.unshift({
      id: `log-${Date.now()}`,
      date: new Date().toLocaleString('fr-FR'),
      acteur,
      action
    });
    this.set(APP_CONFIG.STORAGE_KEYS.LOGS, logs.slice(0, 80));
  },

  initSeedData() {
    if (!this.get(APP_CONFIG.STORAGE_KEYS.USERS)) {
      this.set(APP_CONFIG.STORAGE_KEYS.USERS, [
        {
          id: 'user-admin-1',
          nom: 'Admin Système',
          email: 'admin@mediassist.cm',
          motDePasse: 'Admin123!',
          role: 'admin',
          specialite: 'Administration Plateforme',
          numeroOrdre: 'ADM-001',
          estValide: true,
          points: 0,
          abonnementId: 'sub-pro',
          dateInscription: '2026-11-01'
        },
        {
          id: 'user-pro-1',
          nom: 'Dr. Kamga Jean',
          email: 'dr.kamga@mediassist.cm',
          motDePasse: 'Sante123!',
          role: 'professionnel',
          specialite: 'Pharmacien Clinicien',
          numeroOrdre: 'ONPC-2048',
          estValide: true,
          points: 145,
          abonnementId: 'sub-pro',
          dateInscription: '2026-11-05'
        },
        {
          id: 'user-pro-2',
          nom: 'Dr. Ndongo Claire',
          email: 'dr.ndongo@mediassist.cm',
          motDePasse: 'Sante123!',
          role: 'professionnel',
          specialite: 'Médecin Généraliste',
          numeroOrdre: 'ONMC-9912',
          estValide: false,
          points: 0,
          abonnementId: 'sub-free',
          dateInscription: '2026-11-20'
        },
        {
          id: 'user-usager-1',
          nom: 'Mballa Paul',
          email: 'usager@mediassist.cm',
          motDePasse: 'Usager123!',
          role: 'usager',
          specialite: '',
          numeroOrdre: '',
          estValide: true,
          points: 0,
          abonnementId: 'sub-free',
          dateInscription: '2026-11-15'
        }
      ]);
    }

    // Recharge automatiquement le catalogue si on passe à la version 100 médicaments
    const savedCatalogVersion = localStorage.getItem('mediassist_catalog_version');
    if (!this.get(APP_CONFIG.STORAGE_KEYS.MEDICAMENTS) || savedCatalogVersion !== CATALOG_VERSION) {
      this.set(APP_CONFIG.STORAGE_KEYS.MEDICAMENTS, INITIAL_MEDICAMENTS);
      localStorage.setItem('mediassist_catalog_version', CATALOG_VERSION);
    }

    if (!this.get(APP_CONFIG.STORAGE_KEYS.SUBSCRIPTIONS)) {
      this.set(APP_CONFIG.STORAGE_KEYS.SUBSCRIPTIONS, [
        {
          id: 'sub-free',
          nom: 'Gratuit (Citoyen)',
          prixMensuel: 0,
          limiteQuestionsJour: 20,
          accesScannerIllimite: true,
          description: 'Accès aux 100 médicaments vérifiés, vérification d’authenticité et 20 questions IA par jour.'
        },
        {
          id: 'sub-famille',
          nom: 'Famille Sérénité',
          prixMensuel: 2500,
          limiteQuestionsJour: 150,
          accesScannerIllimite: true,
          description: 'Questions IA étendues, alertes médicaments dépréciés et suivi familial.'
        },
        {
          id: 'sub-pro',
          nom: 'Expert Santé',
          prixMensuel: 5000,
          limiteQuestionsJour: 999,
          accesScannerIllimite: true,
          description: 'Accès illimité à l’IA, au benchmark d’évaluation et au recensement pharmaceutique.'
        }
      ]);
    }

    if (!this.get(APP_CONFIG.STORAGE_KEYS.QA_HISTORY)) {
      this.set(APP_CONFIG.STORAGE_KEYS.QA_HISTORY, [
        {
          id: 'qa-init-1',
          date: '2026-11-23 08:30',
          auteur: 'Mballa Paul',
          question: 'Quelle posologie pour le Paracétamol 500mg ?',
          reponse: 'Pour le Paracétamol 500mg : 1 à 2 comprimés toutes les 4 à 6h sans dépasser 3 g (6 comprimés) par 24 heures.',
          veracite: 'verifiee'
        }
      ]);
    }

    if (!this.get(APP_CONFIG.STORAGE_KEYS.BENCHMARK)) {
      this.set(APP_CONFIG.STORAGE_KEYS.BENCHMARK, []);
    }
  }
};