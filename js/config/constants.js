export const APP_CONFIG = {
  APP_NAME: 'MediAssist IA',
  VERSION: '1.0.0',
  STORAGE_KEYS: {
    USERS: 'mediassist_users',
    CURRENT_USER: 'mediassist_current_user',
    MEDICAMENTS: 'mediassist_medicaments',
    SUBSCRIPTIONS: 'mediassist_subscriptions',
    QA_HISTORY: 'mediassist_qa_history',
    BENCHMARK: 'mediassist_benchmark',
    LOGS: 'mediassist_logs'
  },
  ROLES: {
    USAGER: 'usager',
    PROFESSIONNEL: 'professionnel',
    ADMIN: 'admin'
  },
  // Règle du cahier : "Un médicament validé est celui qui a beaucoup de points" & notification à 5 professionnels
  POINTS: {
    AJOUT_MEDICAMENT: 15,
    VALIDATION_MEDICAMENT: 10,
    DECLARATION_DEPRECIE: 10,
    EVALUATION_SYSTEME: 5,
    SEUIL_MEDICAMENT_VALIDE: 50,
    NB_PROS_NOTIFIES: 5
  }
};