export class Abonnement {
  constructor({ id, nom, prixMensuel, limiteQuestionsJour, accesScannerIllimite, description }) {
    this.id = id || `sub-${Date.now()}`;
    this.nom = nom;
    this.prixMensuel = Number(prixMensuel);
    this.limiteQuestionsJour = Number(limiteQuestionsJour);
    this.accesScannerIllimite = Boolean(accesScannerIllimite);
    this.description = description;
  }
}