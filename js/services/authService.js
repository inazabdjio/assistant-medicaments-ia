import { APP_CONFIG } from '../config/constants.js';
import { Utilisateur } from '../models/utilisateur.js';
import { StorageService } from './storageService.js';

export const AuthService = {
  getUsers() {
    return StorageService.get(APP_CONFIG.STORAGE_KEYS.USERS, []);
  },

  getCurrentUser() {
    const session = StorageService.get(APP_CONFIG.STORAGE_KEYS.CURRENT_USER, null);
    if (!session) return null;
    return this.getUsers().find(u => u.id === session.id) || null;
  },

  login(email, motDePasse) {
    const users = this.getUsers();
    const user = users.find(
      u => u.email.toLowerCase() === email.trim().toLowerCase() && u.motDePasse === motDePasse
    );
    if (!user) {
      return { success: false, message: 'Email ou mot de passe incorrect.' };
    }
    if (user.role === APP_CONFIG.ROLES.PROFESSIONNEL && !user.estValide) {
      return {
        success: false,
        message: 'Votre compte Professionnel de santé est en attente de validation par un Administrateur.'
      };
    }
    StorageService.set(APP_CONFIG.STORAGE_KEYS.CURRENT_USER, { id: user.id });
    StorageService.addLog('Connexion au système', user.nom);
    return { success: true, user };
  },

  register(data) {
    const users = this.getUsers();
    if (users.some(u => u.email.toLowerCase() === data.email.trim().toLowerCase())) {
      return { success: false, message: 'Cet email est déjà utilisé.' };
    }
    const newUser = new Utilisateur({
      ...data,
      estValide: data.role !== APP_CONFIG.ROLES.PROFESSIONNEL
    });
    users.push(newUser);
    StorageService.set(APP_CONFIG.STORAGE_KEYS.USERS, users);
    StorageService.addLog(`Inscription (${newUser.role})`, newUser.nom);

    if (newUser.role === APP_CONFIG.ROLES.PROFESSIONNEL) {
      return {
        success: true,
        pendingValidation: true,
        message: 'Demande enregistrée ! Une notification de validation a été envoyée à l’Administrateur.'
      };
    }
    StorageService.set(APP_CONFIG.STORAGE_KEYS.CURRENT_USER, { id: newUser.id });
    return { success: true, user: newUser };
  },

  logout() {
    const current = this.getCurrentUser();
    if (current) StorageService.addLog('Déconnexion', current.nom);
    localStorage.removeItem(APP_CONFIG.STORAGE_KEYS.CURRENT_USER);
  },

  validerCompteProfessionnel(userId, adminNom) {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === userId);
    if (idx === -1) return false;
    users[idx].estValide = true;
    StorageService.set(APP_CONFIG.STORAGE_KEYS.USERS, users);
    StorageService.addLog(`Validation du compte professionnel : ${users[idx].nom}`, adminNom);
    return true;
  },

  supprimerCompteUsager(userId, adminNom) {
    const users = this.getUsers();
    const target = users.find(u => u.id === userId);
    if (!target || target.role === APP_CONFIG.ROLES.ADMIN) return false;
    const filtered = users.filter(u => u.id !== userId);
    StorageService.set(APP_CONFIG.STORAGE_KEYS.USERS, filtered);
    StorageService.addLog(`Suppression du compte : ${target.nom}`, adminNom);
    return true;
  },

  ajouterPoints(userId, points) {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === userId);
    if (idx !== -1) {
      users[idx].points = (users[idx].points || 0) + points;
      StorageService.set(APP_CONFIG.STORAGE_KEYS.USERS, users);
    }
  },

  changerAbonnement(userId, abonnementId) {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === userId);
    if (idx !== -1) {
      users[idx].abonnementId = abonnementId;
      StorageService.set(APP_CONFIG.STORAGE_KEYS.USERS, users);
      return true;
    }
    return false;
  }
};