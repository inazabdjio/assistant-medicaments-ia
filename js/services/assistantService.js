import { APP_CONFIG } from '../config/constants.js';
import { MedicamentService } from './medicamentService.js';
import { StorageService } from './storageService.js';
import { AuthService } from './authService.js';

export const AssistantService = {
  normaliser(texte) {
    return String(texte || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  },

  /**
   * Recherche intelligente d'un médicament dans la question de l'utilisateur
   */
  trouverMedicamentDansQuestion(qNorm, meds) {
    let meilleur = null;
    let meilleurScore = 0;

    for (const m of meds) {
      let score = 0;
      const nomNorm = this.normaliser(m.nom);
      const principeNorm = this.normaliser(m.principeActif);
      const codeNorm = this.normaliser(m.codeAuthentification);

      if (qNorm.includes(codeNorm)) score += 100;
      if (qNorm.includes(nomNorm)) score += 90;

      const motsNom = nomNorm.split(' ').filter(w => w.length >= 4);
      for (const mot of motsNom) {
        if (qNorm.includes(mot)) score += 35;
      }

      const motsPrincipe = principeNorm.split(' ').filter(w => w.length >= 4);
      for (const mot of motsPrincipe) {
        if (qNorm.includes(mot)) score += 30;
      }

      if (score > meilleurScore) {
        meilleurScore = score;
        meilleur = m;
      }
    }

    return meilleurScore >= 30 ? meilleur : null;
  },

  /**
   * Génère une réponse détaillée et adaptée à l'intention précise de la question
   */
  genererReponse(question, medicamentCible = null) {
    const qNorm = this.normaliser(question);
    const meds = MedicamentService.getAll();
    const med = medicamentCible || this.trouverMedicamentDansQuestion(qNorm, meds);

    // 1. Si un médicament précis du catalogue de 100 références est identifié
    if (med) {
      if (med.statut === 'deprecie') {
        return `⚠️ **ALERTE SANITAIRE — MÉDICAMENT DÉPRÉCIÉ** : Le produit **${med.nom}** (${med.principeActif}) est officiellement retiré ou déprécié.\n• **Motif** : ${med.motifDeprecation}\n• **Risques** : ${med.effetsSecondaires}\n• **Conduite à tenir** : Ne l'utilisez pas et demandez une alternative validée à votre pharmacien.`;
      }

      const badgeOrdonnance = med.sansOrdonnance
        ? 'Disponible sans ordonnance (automédication encadrée).'
        : '⚠️ **Délivrance sur ordonnance médicale obligatoire** (ne pas prendre en automédication).';

      const statutNote =
        med.statut === 'valide'
          ? `Validé (${med.pointsValidation} pts)`
          : `En cours de validation (${med.pointsValidation} pts)`;

      // Intention : Posologie / Dose / Comment prendre
      if (/(posologie|dose|dosage|combien|prendre|utiliser|comprime|sachet|goutte|matin|soir)/.test(qNorm)) {
        return `💊 **${med.nom}** [${statutNote}]\n• **Statut de délivrance** : ${badgeOrdonnance}\n• **Posologie recommandée** : ${med.posologie}\n• **Contre-indications importantes** : ${med.contreIndications}`;
      }

      // Intention : Effets secondaires / Risques / Danger
      if (/(effet|secondaire|indesirable|danger|risque|allergie|toxicite|mal)/.test(qNorm)) {
        return `⚠️ **Effets secondaires — ${med.nom}**\n• **Effets indésirables possibles** : ${med.effetsSecondaires}\n• **Contre-indications** : ${med.contreIndications}\n• **Rappel posologie** : ${med.posologie}`;
      }

      // Intention : Contre-indications / Grossesse / Allaitement / Enfant / Alcool
      if (/(contre|indication|grossesse|enceinte|allaitement|enfant|bebe|nourrisson|alcool|ulcere|reins|foie)/.test(qNorm)) {
        return `🛑 **Précautions & Contre-indications — ${med.nom}**\n• **Contre-indications** : ${med.contreIndications}\n• **Statut** : ${badgeOrdonnance}\n• **Posologie** : ${med.posologie}`;
      }

      // Intention : Ordonnance / Vrai / Authentique / Prix / Catégorie
      if (/(ordonnance|prescription|vrai|authentique|code|faux|contrefacon)/.test(qNorm)) {
        return `✅ **Vérification — ${med.nom}**\n• **Code d'authenticité** : ${med.codeAuthentification}\n• **Statut catalogue** : ${statutNote}\n• **Délivrance** : ${badgeOrdonnance}\n• **Principe actif** : ${med.principeActif} (${med.categorie})`;
      }

      // Réponse complète par défaut sur le médicament
      return `📋 **Fiche complète — ${med.nom}** (${med.categorie} • ${statutNote})\n• **Principe actif** : ${med.principeActif}\n• **Délivrance** : ${badgeOrdonnance}\n• **Posologie** : ${med.posologie}\n• **Effets secondaires** : ${med.effetsSecondaires}\n• **Contre-indications** : ${med.contreIndications}`;
    }

    // 2. Questions générales ou par symptômes (sans nom de médicament cité)
    if (/(paludisme|palu|fievre.*frisson|coartem|antipaludeen)/.test(qNorm)) {
      return `🦟 **Orientation Paludisme (Cameroun)** :\nAvant tout traitement antipaludéen, faites confirmer le paludisme par un **TDR (Test de Diagnostic Rapide)** ou une goutte épaisse.\n• **Traitements de référence (CTA)** : **Artéméther + Luméfantrine (Coartem)** ou **Artésunate + Amodiaquine (ASAQ)** sur 3 jours.\n• **Attention** : La **Chloroquine (Nivaquine)** est dépréciée au Cameroun pour cause de résistance.\n• En attendant la consultation, vous pouvez faire baisser la fièvre avec du **Paracétamol 500mg**.`;
    }

    if (/(fievre|mal de tete|cephalee|courbature|douleur)/.test(qNorm)) {
      return `🌡️ **Fièvre ou douleurs légères sans ordonnance** :\n• **1er choix** : **Paracétamol 500mg** (1 à 2 comprimés toutes les 4 à 6h, max 3 g/jour).\n• **Enfant** : **Paracétamol Sirop Pédiatrique 2,4%** (15 mg/kg toutes les 6h selon le poids).\n• **Alternative (douleur inflammatoire sans ulcère)** : **Ibuprofène 400mg** au milieu du repas.\n*(Consultez un médecin si la fièvre dure plus de 48-72h).*`;
    }

    if (/(diarrhee|selle liquide|deshydratation|gastro)/.test(qNorm)) {
      return `💧 **Prise en charge de la diarrhée aiguë** :\n• **Priorité absolue** : **Sels de Réhydratation Orale (SRO)** (1 sachet dans 1 litre d'eau bouillie refroidie, à boire par petites gorgées).\n• **Chez l'enfant** : Associer le **Sulfate de Zinc 20mg** (1 cp/jour pendant 10 à 14 jours).\n• **Confort digestif adulte** : **Diosmectite (Smecta)** (à espacer de 2h des autres médicaments) ou **Lopéramide 2mg** (uniquement s'il n'y a ni fièvre ni sang dans les selles).`;
    }

    if (/(estomac|brulure|reflux|gastrite|ulcere|acide|digestion)/.test(qNorm)) {
      return `🔥 **Brûlures d'estomac & Reflux gastro-œsophagien** :\n• **Soulagement immédiat** : **Maalox** ou **Gaviscon** après les repas et au coucher (espacer de 2h avec les autres médicaments).\n• **Traitement de fond court (14 jours)** : **Oméprazole 20mg** (1 gélule le matin à jeun 30 min avant le repas).\n• **Évitez** l'Ibuprofène, le Diclofénac et l'Aspirine qui irritent l'estomac.`;
    }

    if (/(ventre|spasme|crampe|regles douloureuses|ballonnement|gaz)/.test(qNorm)) {
      return `🩺 **Douleurs abdominales, spasmes & ballonnements** :\n• **Spasmes / règles douloureuses** : **Phloroglucinol 80mg (Spasfon)** (2 comprimés lors de la crise, max 6/jour) ou **Acide Méfénamique 500mg**.\n• **Gaz / ballonnements** : **Charbon Végétal Activé** (à espacer de 2h des autres traitements).`;
    }

    if (/(ver|parasite|vermifuge|deparasitage)/.test(qNorm)) {
      return `🪱 **Déparasitage intestinal (Vermifuge)** :\n• **Albendazole 400mg (Zentel)** : 1 comprimé en prise unique chez l'adulte et l'enfant de plus de 2 ans.\n• **Mébendazole 100mg (Vermox)** : 1 comprimé matin et soir pendant 3 jours.\n*(Contre-indiqué au 1er trimestre de grossesse).*`;
    }

    if (/(toux|rhume|gorge|grippe|nez bouche)/.test(qNorm)) {
      return `🤧 **Toux, Rhume & Maux de gorge** :\n• **Nez bouché** : Lavage au **Sérum Physiologique (NaCl 0,9%)** plusieurs fois par jour.\n• **État grippal** : **Fervex** (ne pas cumuler avec du Paracétamol seul).\n• **Toux grasse** : **Carbocistéine 5%** ou **Acétylcystéine 200mg** (en journée, jamais avant de dormir).\n• **Toux sèche nocturne** : **Oxomémazine (Toplexil)**. *(Attention : la Pholcodine est dépréciée et interdite)*.`;
    }

    if (/(allergie|demangeaison|urticaire|eternuement|yeux qui grattent)/.test(qNorm)) {
      return `🌿 **Allergies & Démangeaisons** :\n• **Sans somnolence** : **Loratadine 10mg** ou **Desloratadine 5mg** (1 comprimé par jour).\n• **Allergie sévère le soir** : **Cétirizine 10mg** ou **Chlorphéniramine 4mg** (peut faire dormir).\n• **Allergie oculaire** : **Collyre Cromoglicate de Sodium**.`;
    }

    if (/(plaie|blessure|coupure|brulure|mycose|gale|peau)/.test(qNorm)) {
      return `🩹 **Soins de la peau, plaies & mycoses** :\n• **Désinfection plaie** : **Chlorhexidine 0,2%** ou **Bétadine Jaune 10%**.\n• **Brûlure superficielle** : **Sulfadiazine Argentique (Flammazine)**.\n• **Mycose cutanée / dartres** : **Clotrimazole 1%** ou **Kétoconazole 2%** pendant 2 à 4 semaines.\n• **Gale** : **Perméthrine 5%** ou **Benzoate de benzyle (Ascabiol)**.`;
    }

    if (/(fatigue|vitamine|anemie|carence|grossesse|fer)/.test(qNorm)) {
      return `⚡ **Fatigue, Vitamines & Prévention Anémie** :\n• **Fatigue générale** : **Vitamine C 500mg**, **Vitamine B Complexe** ou **Magnésium + Vitamine B6**.\n• **Anémie / Grossesse** : **Fer + Acide Folique (Fefol)** et **Acide Folique 5mg** (éviter de boire du thé juste avant/après la prise de fer).`;
    }

    if (/(deprecie|retire|interdit|dangereux)/.test(qNorm)) {
      const deprecies = meds.filter(m => m.statut === 'deprecie');
      return `🚫 **Médicaments dépréciés / retirés recensés dans le catalogue (${deprecies.length})** :\n` +
        deprecies.map(d => `• **${d.nom}** : ${d.motifDeprecation}`).join('\n');
    }

    return `Je n'ai pas trouvé ce terme exact dans notre base de 100 médicaments. Essayez de préciser :\n• Le **nom du médicament** (ex: *Paracétamol, Coartem, Ibuprofène, Amoxicilline, Oméprazole, Albendazole, Loratadine, SRO, Bétadine...*)\n• Ou votre **symptôme** (ex: *fièvre, paludisme, diarrhée, brûlures d'estomac, toux, allergie, vers intestinaux, plaie, fatigue*).`;
  },

  poserQuestion(question, user, medicamentCible = null) {
    const reponse = this.genererReponse(question, medicamentCible);
    const history = StorageService.get(APP_CONFIG.STORAGE_KEYS.QA_HISTORY, []);
    history.unshift({
      id: `qa-${Date.now()}`,
      date: new Date().toLocaleString('fr-FR'),
      auteur: user ? user.nom : 'Usager invité',
      question,
      reponse,
      veracite: 'en_attente'
    });
    StorageService.set(APP_CONFIG.STORAGE_KEYS.QA_HISTORY, history);
    return reponse;
  },

  validerVeraciteReponse(qaId, statutVeracite, adminNom) {
    const history = StorageService.get(APP_CONFIG.STORAGE_KEYS.QA_HISTORY, []);
    const idx = history.findIndex(item => item.id === qaId);
    if (idx === -1) return false;
    history[idx].veracite = statutVeracite;
    StorageService.set(APP_CONFIG.STORAGE_KEYS.QA_HISTORY, history);
    StorageService.addLog(`Audit véracité réponse IA (${statutVeracite})`, adminNom);
    return true;
  },

  calculerMetriques(evaluations) {
    if (!evaluations || evaluations.length === 0) {
      return { precision: 0, rappel: 0, fScore: 0, total: 0 };
    }
    const bonnesReponses = evaluations.filter(e => e.estBonneReponse).length;
    const reponsesTrouvees = evaluations.filter(e => e.aTrouveReponse).length || evaluations.length;
    const totalBonnesAttendues = evaluations.length;

    const precision = reponsesTrouvees > 0 ? bonnesReponses / reponsesTrouvees : 0;
    const rappel = totalBonnesAttendues > 0 ? bonnesReponses / totalBonnesAttendues : 0;
    const fScore = precision + rappel > 0 ? (2 * precision * rappel) / (precision + rappel) : 0;

    return {
      precision: Math.round(precision * 100),
      rappel: Math.round(rappel * 100),
      fScore: Math.round(fScore * 100),
      total: evaluations.length
    };
  },

  enregistrerEvaluation(question, reponseIA, estBonneReponse, user) {
    const evals = StorageService.get(APP_CONFIG.STORAGE_KEYS.BENCHMARK, []);
    const aTrouveReponse = !reponseIA.includes("Je n'ai pas trouvé ce terme exact");
    evals.unshift({
      id: `eval-${Date.now()}`,
      date: new Date().toLocaleString('fr-FR'),
      evaluateur: user.nom,
      question,
      reponseIA,
      aTrouveReponse,
      estBonneReponse: Boolean(estBonneReponse)
    });
    StorageService.set(APP_CONFIG.STORAGE_KEYS.BENCHMARK, evals);
    AuthService.ajouterPoints(user.id, APP_CONFIG.POINTS.EVALUATION_SYSTEME);
    StorageService.addLog(`Évaluation Benchmark IA (+${APP_CONFIG.POINTS.EVALUATION_SYSTEME} pts)`, user.nom);
    return this.calculerMetriques(evals);
  }
};