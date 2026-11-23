import { APP_CONFIG } from '../config/constants.js';

export class Medicament {
  constructor({
    id,
    nom,
    principeActif,
    categorie,
    codeAuthentification,
    sansOrdonnance = true,
    posologie,
    effetsSecondaires,
    contreIndications = 'Aucune connue à dose usuelle.',
    statut = 'en_attente',
    motifDeprecation = '',
    pointsValidation = APP_CONFIG.POINTS.AJOUT_MEDICAMENT,
    validateurIds = [],
    ajoutePar = 'Professionnel de santé',
    dateAjout = new Date().toISOString().split('T')[0],
    image = 'assets/images/medicaments/default.png'
  }) {
    this.id = id || `med-${Date.now()}`;
    this.nom = nom;
    this.principeActif = principeActif;
    this.categorie = categorie;
    this.codeAuthentification = codeAuthentification || `MED-CM-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    this.sansOrdonnance = Boolean(sansOrdonnance);
    this.posologie = posologie;
    this.effetsSecondaires = effetsSecondaires;
    this.contreIndications = contreIndications;
    this.pointsValidation = Number(pointsValidation);
    this.validateurIds = validateurIds;
    this.motifDeprecation = motifDeprecation;
    this.statut = statut === 'deprecie'
      ? 'deprecie'
      : (this.pointsValidation >= APP_CONFIG.POINTS.SEUIL_MEDICAMENT_VALIDE ? 'valide' : statut);
    this.ajoutePar = ajoutePar;
    this.dateAjout = dateAjout;
    this.image = image;
  }
}