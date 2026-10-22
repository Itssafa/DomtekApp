import {
  isValidEmail,
  isValidPhone,
  isValidCityOrPlace,
  validatePassword,
} from './validation';

/**
 * Registre des règles de saisie, par nom de champ.
 *
 * Pour chaque champ : la **condition** à afficher en permanence sous lui, et le
 * **message d'erreur** à afficher dès qu'on le quitte. Le composant `Champ` les
 * lit ici, si bien qu'un formulaire n'a rien à répéter : il nomme son champ, et
 * la règle suit.
 *
 * Les noms de champs sont les mêmes d'un formulaire à l'autre (`telephone`,
 * `cin`, `email`…), ce qui permet un registre unique. Les messages reprennent
 * ceux déjà affichés à l'envoi, pour que le formulaire parle d'une seule voix.
 *
 * Les règles sont celles du serveur (FormRequest) : le navigateur ne fait que
 * prévenir plus tôt, il ne remplace jamais la validation serveur.
 */

/** Valeurs du formulaire, lues par nom (un champ peut dépendre d'un autre). */
export type ValeursForm = Record<string, unknown>;

interface Regle {
  /** Nom du champ avec son article, pour « Le prénom est obligatoire. » */
  libelle?: string;
  /** Message complet quand le champ obligatoire est vide (listes de choix : « Veuillez sélectionner… »). */
  obligatoire?: string;
  /** Condition affichée en permanence sous le champ. */
  aide?: string | ((form: ValeursForm) => string);
  /** Message d'erreur si la valeur (non vide) est invalide, sinon null. */
  valider?: (valeur: string, form: ValeursForm) => string | null;
}

const aujourdhui = () => new Date().toISOString().slice(0, 10);

const lire = (form: ValeursForm, nom: string) => String(form[nom] ?? '');

/**
 * Condition qui dépend d'un autre champ : le même nom de champ peut vouloir
 * dire des choses différentes d'un formulaire à l'autre (`date_echeance` d'une
 * facture ou d'une tâche). On ne l'affiche que si le champ de référence existe.
 */
const siPresent = (reference: string, texte: string) => (form: ValeursForm) => (reference in form ? texte : '');

const nombre = (v: string) => Number(v.replace(',', '.'));

// ── Fabriques de règles récurrentes ──────────────────────────────────────────

const lieu = (libelle: string): Regle => ({
  libelle,
  aide: 'Lettres, espaces, apostrophes et tirets',
  valider: (v) => (isValidCityOrPlace(v) ? null : `${libelle} est invalide : lettres, espaces, apostrophes et tirets uniquement.`),
});

const entierMin = (libelle: string, min: number, aide: string): Regle => ({
  libelle,
  aide,
  valider: (v) => {
    const n = nombre(v);
    if (Number.isNaN(n) || !Number.isInteger(n)) return `${libelle} doit être un nombre entier.`;
    return n < min ? `${libelle} doit être au moins ${min}.` : null;
  },
});

const decimalMin = (libelle: string, min: number, aide: string, strict = false): Regle => ({
  libelle,
  aide,
  valider: (v) => {
    const n = nombre(v);
    if (Number.isNaN(n)) return `${libelle} doit être un nombre.`;
    if (strict ? n <= min : n < min) return strict ? `${libelle} doit être supérieur à ${min}.` : `${libelle} ne peut pas être négatif.`;
    return null;
  },
});

const datePassee = (libelle: string, aide: string): Regle => ({
  libelle,
  aide,
  valider: (v) => (v > aujourdhui() ? `${libelle} ne peut pas être dans le futur.` : null),
});

const pourcentage = (libelle: string): Regle => ({
  libelle,
  aide: 'Entre 0 et 100 %',
  valider: (v) => {
    const n = nombre(v);
    return !Number.isNaN(n) && n >= 0 && n <= 100 ? null : `${libelle} doit être comprise entre 0 et 100.`;
  },
});

const choix = (obligatoire: string): Regle => ({ obligatoire });

const telephone: Regle = {
  libelle: 'Le numéro de téléphone',
  aide: 'Exactement 8 chiffres',
  valider: (v) => (isValidPhone(v) ? null : 'Le numéro de téléphone doit contenir exactement 8 chiffres.'),
};

const email: Regle = {
  libelle: "L'adresse e-mail",
  aide: 'Format : nom@domaine.com',
  valider: (v) => (isValidEmail(v) ? null : 'Adresse e-mail invalide.'),
};

// ── Registre ─────────────────────────────────────────────────────────────────

export const REGLES_CHAMPS: Record<string, Regle> = {
  // Identité
  nom: { libelle: 'Le nom' },
  prenom: { libelle: 'Le prénom' },
  name: { libelle: 'Le nom' },
  email,
  email_organisation: email,
  telephone,
  urgence_telephone: { ...telephone, libelle: "Le téléphone d'urgence" },

  date_naissance: {
    libelle: 'La date de naissance',
    aide: 'Date passée, postérieure à 1900',
    valider: (v) => {
      if (v >= aujourdhui()) return 'La date de naissance doit être dans le passé.';
      if (v < '1900-01-01') return 'La date de naissance doit être postérieure à 1900.';
      return null;
    },
  },
  lieu_naissance: lieu('Le lieu de naissance'),

  // Pièce d'identité : la longueur dépend du type choisi, quand le formulaire en propose un.
  cin: {
    libelle: 'Le numéro de pièce',
    aide: (form) => {
      const type = lire(form, 'type_piece');
      if (type === 'Passeport') return 'Chiffres uniquement';
      if (type === 'CIN' || !('type_piece' in form)) return 'Exactement 8 chiffres';
      return 'Chiffres uniquement (8 pour une CIN)';
    },
    valider: (v, form) => {
      if (!/^\d+$/.test(v.trim())) return 'Le numéro de pièce ne doit contenir que des chiffres.';
      const type = lire(form, 'type_piece');
      const estCin = type === 'CIN' || !('type_piece' in form);
      return estCin && v.trim().length !== 8 ? 'Le numéro CIN doit contenir exactement 8 chiffres.' : null;
    },
  },
  cin_delivree_le: datePassee('La date de délivrance', 'Date passée ou du jour'),
  cin_delivree_a: lieu('La ville de délivrance'),

  // Adresse
  ville: lieu('La ville'),
  pays: lieu('Le pays'),
  code_postal: {
    libelle: 'Le code postal',
    aide: '4 chiffres',
    valider: (v) => (/^\d{4}$/.test(v.trim()) ? null : 'Le code postal doit contenir exactement 4 chiffres.'),
  },

  // Compte
  password: {
    libelle: 'Le mot de passe',
    aide: '8 caractères minimum, avec une majuscule, un chiffre et un caractère spécial',
    valider: (v) => validatePassword(v),
  },
  password_confirmation: {
    libelle: 'La confirmation du mot de passe',
    aide: 'Saisissez à nouveau le même mot de passe',
    valider: (v, form) => (v === lire(form, 'password') ? null : 'Les mots de passe ne correspondent pas.'),
  },
  current_password: { libelle: 'Le mot de passe actuel' },

  // Dates liées à un bien ou à un employé
  date_embauche: datePassee("La date d'embauche", 'Date passée ou du jour'),
  date_construction: datePassee('La date de construction', 'Date passée ou du jour'),

  // Caractéristiques d'un bien
  prix: decimalMin('Le prix', 0, 'Montant supérieur à 0', true),
  superficie: decimalMin('La superficie', 0, 'En m², nombre positif'),
  superficie_commune: decimalMin('La superficie commune', 0, 'En m², nombre positif'),
  taxe_fonciere: decimalMin('La taxe foncière', 0, 'Montant positif ou nul'),
  nb_pieces: entierMin('Le nombre de pièces', 0, 'Nombre entier'),
  nb_chambres: entierMin('Le nombre de chambres', 0, 'Nombre entier'),
  nb_cuisine: entierMin('Le nombre de cuisines', 0, 'Nombre entier'),
  nb_salles_bain: entierMin('Le nombre de salles de bain', 0, 'Nombre entier'),
  nb_blocs: entierMin('Le nombre de blocs', 1, 'Nombre entier, au moins 1'),
  nb_etages: {
    libelle: "Le nombre d'étages",
    aide: 'Nombre entier, de 0 à 200',
    valider: (v) => {
      const n = nombre(v);
      return Number.isInteger(n) && n >= 0 && n <= 200 ? null : "Le nombre d'étages doit être un entier entre 0 et 200.";
    },
  },
  etage: {
    libelle: "L'étage",
    aide: '0 = rez-de-chaussée, négatif = sous-sol',
    valider: (v) => {
      const n = nombre(v);
      return Number.isInteger(n) && n >= -5 && n <= 200 ? null : "L'étage doit être un entier entre -5 et 200.";
    },
  },

  designation: { libelle: 'La désignation' },
  adresse: { libelle: "L'adresse" },
  poste: { libelle: 'Le poste' },
  titre: { libelle: 'Le titre' },
  nom_organisation: { libelle: "Le nom de l'organisation" },
  locataire_nom: { libelle: 'Le nom du locataire' },

  // Contrats et locations
  date_debut: { libelle: 'La date de début' },
  date_fin: {
    libelle: 'La date de fin',
    aide: siPresent('date_debut', 'Postérieure à la date de début'),
    valider: (v, form) => {
      const debut = lire(form, 'date_debut');
      return debut && v <= debut ? 'La date de fin doit suivre la date de début.' : null;
    },
  },
  date_contrat: { libelle: 'La date du contrat' },
  premiere_echeance: {
    libelle: 'La première échéance',
    aide: siPresent('date_debut', 'Pas avant la date de début'),
    valider: (v, form) => {
      const debut = lire(form, 'date_debut');
      return debut && v < debut ? 'La première échéance ne peut pas précéder le début du contrat.' : null;
    },
  },
  montant_ht: decimalMin('Le montant HT', 0, 'Montant supérieur à 0', true),
  tva: pourcentage('La TVA'),
  retenue_source: pourcentage('La retenue à la source'),
  frais_syndic: decimalMin('Les frais de syndic', 0, 'Montant positif ou nul'),
  depot_garantie: decimalMin('Le dépôt de garantie', 0, 'Montant positif ou nul'),
  jour_paiement: {
    libelle: 'Le jour de paiement',
    aide: 'Jour du mois, de 1 à 28',
    valider: (v) => {
      const n = nombre(v);
      return Number.isInteger(n) && n >= 1 && n <= 28 ? null : 'Le jour de paiement doit être un entier entre 1 et 28.';
    },
  },

  // Factures
  montant: decimalMin('Le montant', 0, 'Montant supérieur à 0', true),
  date_emission: { libelle: "La date d'émission" },
  date_echeance: {
    libelle: "La date d'échéance",
    aide: siPresent('date_emission', "Pas avant la date d'émission"),
    valider: (v, form) => {
      const emission = lire(form, 'date_emission');
      return emission && v < emission ? "L'échéance ne peut pas précéder la date d'émission." : null;
    },
  },
  periode_debut: { libelle: 'Le début de période' },
  periode_fin: {
    libelle: 'La fin de période',
    aide: siPresent('periode_debut', 'Pas avant le début de période'),
    valider: (v, form) => {
      const debut = lire(form, 'periode_debut');
      return debut && v < debut ? 'La fin de période ne peut pas précéder son début.' : null;
    },
  },

  // États des lieux : un compteur ne recule pas, et ne peut pas être négatif
  releve_eau: decimalMin("Le relevé d'eau", 0, 'Relevé positif ou nul'),
  releve_electricite: decimalMin("Le relevé d'électricité", 0, 'Relevé positif ou nul'),
  releve_gaz: decimalMin('Le relevé de gaz', 0, 'Relevé positif ou nul'),

  // Visites : une visite se planifie à partir d'aujourd'hui
  date_visite: {
    libelle: 'La date de visite',
    aide: 'Date du jour ou à venir',
    valider: (v) => (v.slice(0, 10) < aujourdhui() ? 'Une visite ne peut pas être planifiée dans le passé.' : null),
  },

  // Listes de choix
  bien_id: choix('Veuillez sélectionner un bien.'),
  client_id: choix('Veuillez sélectionner un client.'),
  prospect_id: choix('Veuillez sélectionner un prospect.'),
  location_id: choix('Veuillez sélectionner une location.'),
  locataire_id: choix('Veuillez sélectionner un locataire.'),
  employe_id: choix('Veuillez sélectionner un employé.'),
  organisation_id: choix('Veuillez sélectionner votre organisation.'),
};

// ── API ──────────────────────────────────────────────────────────────────────

/** Condition à afficher sous le champ, ou null s'il n'y en a pas. */
export function aideChamp(nom: string, form: ValeursForm): string | null {
  const aide = REGLES_CHAMPS[nom]?.aide;
  if (!aide) return null;
  return typeof aide === 'function' ? aide(form) : aide;
}

/**
 * Message d'erreur d'un champ, ou null s'il est valide.
 *
 * Un champ vide n'est refusé que s'il est obligatoire : s'il est facultatif,
 * il n'y a rien à vérifier, et on ne lui reproche pas de ne pas être rempli.
 */
export function erreurChamp(nom: string, valeur: string, form: ValeursForm, requis = false): string | null {
  const regle = REGLES_CHAMPS[nom];

  if (valeur.trim() === '') {
    if (!requis) return null;
    if (regle?.obligatoire) return regle.obligatoire;
    return regle?.libelle ? `${regle.libelle} est obligatoire.` : 'Ce champ est obligatoire.';
  }

  return regle?.valider?.(valeur, form) ?? null;
}
