
# ASSISTANT_MEDICAMENTS_IA

## Présentation

ASSISTANT_MEDICAMENTS_IA est une application web permettant aux utilisateurs de rechercher des informations sur les médicaments, de consulter un catalogue et d'utiliser un assistant médicamenteux local.

## Technologies

- HTML5
- CSS3
- JavaScript ES6+
- LocalStorage
- Web Crypto API

## Fonctionnalités

- Inscription et connexion locales
- Gestion des profils utilisateurs
- Catalogue de médicaments
- Recherche de médicaments
- Assistant médicamenteux local
- Prévisualisation d'images de médicaments
- Espace professionnel
- Espace administrateur
- Gestion des abonnements
- Interface responsive

## Installation

1. Télécharger ou copier le projet.
2. Ouvrir le dossier dans Visual Studio Code.
3. Lancer un terminal dans le dossier du projet.
4. Exécuter :

```bash
python3 -m http.server 8000
```

5. Ouvrir dans le navigateur :

http://localhost:8000

## Structure

Le projet est organisé en dossiers :

- assets : images et icônes
- css : feuilles de style
- js/config : configuration
- js/data : données locales
- js/models : modèles de données
- js/services : logique métier
- js/pages : gestion des pages
- js/components : composants réutilisables
- js/utils : fonctions utilitaires

## Limites

L'assistant actuel fonctionne localement avec des règles et des données disponibles dans l'application. Il ne s'agit pas d'une IA connectée.

Les informations médicales doivent être vérifiées auprès de sources fiables et d'un professionnel de santé.

L'authentification et les rôles stockés dans le navigateur sont destinés au prototype et ne constituent pas un système sécurisé pour une mise en production.

## Auteur

INA

## Version

1.0.0



# ASSISTANT_MEDICAMENTS_IA (MediAssist IA)

Application web progressive (PWA) convertible en APK répondant au cahier des charges :
- **Usagers** : Consultation du catalogue, questions à l'IA (posologie, effets secondaires), scan de boîtes de médicaments, vérification d'authenticité.
- **Professionnels de santé** : Ajout de médicaments, validation communautaire (gain de points), signalement de médicaments dépréciés, évaluation du benchmark IA (Précision, Rappel, F-Score).
- **Administrateurs** : Validation des comptes professionnels, monitoring global, vérification de la véracité des réponses IA, gestion des abonnements.

## Lancement
Ouvrir `index.html` via un serveur local (ex: Live Server sur VS Code, `npx serve`, ou `python -m http.server`) afin d'activer les modules ES6 (`type="module"`).

## Comptes de démonstration pré-enregistrés
- **Administrateur** : `admin@mediassist.cm` / `Admin123!`
- **Professionnel de santé (Validé)** : `dr.kamga@mediassist.cm` / `Sante123!`
- **Professionnel de santé (En attente)** : `dr.ndongo@mediassist.cm` / `Sante123!`
- **Usager** : `usager@mediassist.cm` / `Usager123!`
