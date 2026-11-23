import { StorageService } from './services/storageService.js';
import { AuthService } from './services/authService.js';
import { renderSidebar } from './components/sidebar.js';
import { renderNavbar } from './components/navbar.js';
import { renderAccueilPage } from './pages/accueil.js';
import { renderConnexionPage } from './pages/connexion.js';
import { renderInscriptionPage } from './pages/inscription.js';
import { renderMedicamentsPage } from './pages/medicaments.js';
import { renderAssistantPage } from './pages/assistant.js';
import { renderScannerPage } from './pages/scanner.js';
import { renderProfilPage } from './pages/profil.js';
import { renderProfessionnelPage } from './pages/professionnel.js';
import { renderAdministrateurPage } from './pages/administrateur.js';

// Initialisation de la base de données locale au premier lancement
StorageService.initSeedData();

let currentRoute = 'accueil';

const routes = {
  accueil: renderAccueilPage,
  connexion: renderConnexionPage,
  inscription: renderInscriptionPage,
  medicaments: renderMedicamentsPage,
  assistant: renderAssistantPage,
  scanner: renderScannerPage,
  profil: renderProfilPage,
  professionnel: renderProfessionnelPage,
  administrateur: renderAdministrateurPage
};

function navigate(route) {
  currentRoute = routes[route] ? route : 'accueil';
  const currentUser = AuthService.getCurrentUser();
  const contentContainer = document.getElementById('app-content');

  renderSidebar(currentRoute, currentUser, navigate);
  renderNavbar(currentUser, navigate);

  if (contentContainer) {
    routes[currentRoute](contentContainer, navigate);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  navigate('accueil');
});