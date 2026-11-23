import { APP_CONFIG } from '../config/constants.js';

export class Utilisateur {
  constructor({
    id,
    nom,
    email,
    motDePasse,
    role = APP_CONFIG.ROLES.USAGER,
    specialite = '',
    numeroOrdre = '',
    estValide = true,
    points = 0,
    abonnementId = 'sub-free',
    dateInscription = new Date().toISOString().split('T')[0]
  }) {
    this.id = id || `user-${Date.now()}`;
    this.nom = nom;
    this.email = email.toLowerCase().trim();
    this.motDePasse = motDePasse;
    this.role = role;
    this.specialite = specialite;
    this.numeroOrdre = numeroOrdre;
    // Un professionnel de santé doit être validé par l'admin
    this.estValide = role === APP_CONFIG.ROLES.PROFESSIONNEL ? Boolean(estValide) : true;
    this.points = Number(points) || 0;
    this.abonnementId = abonnementId;
    this.dateInscription = dateInscription;
  }
}