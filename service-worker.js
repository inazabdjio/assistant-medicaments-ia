
const CACHE_NAME = "assistant-medicaments-v2";

const FICHIERS_CACHE = [
    "./",
    "./index.html",
    "./manifest.json",

    // Images
    "./assets/images/logo.png",
    "./assets/icons/icon-192.png",
    "./assets/icons/icon-512.png",

    // CSS
    "./css/style.css",
    "./css/responsive.css",
    "./css/components.css",

    // Configuration et données
    "./js/main.js",
    "./js/config/constants.js",
    "./js/data/medicaments.js",

    // Modèles
    "./js/models/utilisateur.js",
    "./js/models/medicament.js",
    "./js/models/abonnement.js",

    // Services
    "./js/services/authService.js",
    "./js/services/medicamentService.js",
    "./js/services/assistantService.js",
    "./js/services/scannerService.js",
    "./js/services/storageService.js",

    // Pages
    "./js/pages/accueil.js",
    "./js/pages/connexion.js",
    "./js/pages/inscription.js",
    "./js/pages/medicaments.js",
    "./js/pages/assistant.js",
    "./js/pages/scanner.js",
    "./js/pages/profil.js",
    "./js/pages/professionnel.js",
    "./js/pages/administrateur.js",

    // Composants
    "./js/components/navbar.js",
    "./js/components/sidebar.js",
    "./js/components/carteMedicament.js",
    "./js/components/modal.js",
    "./js/components/notification.js",

    // Utilitaires
    "./js/utils/validation.js",
    "./js/utils/helpers.js"
];

// INSTALLATION
self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(async cache => {
                for (const fichier of FICHIERS_CACHE) {
                    try {
                        await cache.add(fichier);
                    } catch (erreur) {
                        console.warn(
                            "Fichier non mis en cache :",
                            fichier,
                            erreur
                        );
                    }
                }
            })
            .then(() => self.skipWaiting())
    );
});

// ACTIVATION
self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys()
            .then(nomsCaches => {
                return Promise.all(
                    nomsCaches
                        .filter(nom => nom !== CACHE_NAME)
                        .map(nom => caches.delete(nom))
                );
            })
            .then(() => self.clients.claim())
    );
});

// GESTION DES REQUÊTES
self.addEventListener("fetch", event => {
    const requete = event.request;

    if (requete.method !== "GET") {
        return;
    }

    const url = new URL(requete.url);

    if (url.origin !== self.location.origin) {
        return;
    }

    // Pages HTML : réseau prioritaire
    if (requete.mode === "navigate") {
        event.respondWith(
            fetch(requete)
                .then(reponse => {
                    if (reponse.ok) {
                        const copie = reponse.clone();

                        caches.open(CACHE_NAME)
                            .then(cache => cache.put(requete, copie));
                    }

                    return reponse;
                })
                .catch(async () => {
                    return await caches.match("./index.html")
                        || Response.error();
                })
        );

        return;
    }

    // Autres ressources : cache prioritaire
    event.respondWith(
        caches.match(requete)
            .then(reponseEnCache => {
                if (reponseEnCache) {
                    return reponseEnCache;
                }

                return fetch(requete)
                    .then(reponse => {
                        if (reponse.ok) {
                            const copie = reponse.clone();

                            caches.open(CACHE_NAME)
                                .then(cache => cache.put(requete, copie));
                        }

                        return reponse;
                    });
            })
            .catch(() => Response.error())
    );
});
