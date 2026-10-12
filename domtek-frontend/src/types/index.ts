// ─── Auth ────────────────────────────────────────────────────────────────────

export type Role = 'admin' | 'organisation' | 'client' | 'employe';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  is_active: boolean;
  created_at: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  role: Role;
  organisation?: Organisation;
}

// ─── Organisation ─────────────────────────────────────────────────────────────

export type OrganisationStatut = 'en_attente' | 'active' | 'inactive';

export interface Organisation {
  id: number;
  nom: string;
  slug: string;
  statut: OrganisationStatut;
  logo: string | null;
  adresse: string | null;
  ville: string | null;
  telephone: string | null;
  email: string | null;
  description: string | null;
  biens_count?: number;
  annonces_count?: number;
  clients_count?: number;
  created_at: string;
}

// ─── Bien ─────────────────────────────────────────────────────────────────────

export type TypeTransaction = 'vente' | 'loyer';
export type TypeLocation    = 'meuble' | 'non_meuble';
export type TypeBien =
  | 'appartement' | 'maison' | 'villa' | 'bureau' | 'terrain'
  | 'studio' | 'duplex' | 'local_commercial' | 'entrepot' | 'ferme' | 'autre';
export type BienStatut = 'disponible' | 'vendu' | 'loue' | 'indisponible';
export type RegimeJuridique = 'mono_propriete' | 'co_propriete';

export interface BienImage {
  id: number;
  chemin: string;
  url: string;
  ordre: number;
  is_principale: boolean;
}

export interface BienDocument {
  id: number;
  nom: string;
  url: string;
  type_document: string | null;
  created_at: string;
}

export interface Bien {
  id: number;
  immeuble_id: number | null;
  bloc: number | null;
  num: string | null;
  immeuble?: Immeuble;
  designation: string;
  description: string | null;
  notes: string | null;
  type_transaction: TypeTransaction;
  type_location: TypeLocation | null;
  type_bien: TypeBien;
  prix: number;
  taxe_fonciere: number | null;
  regime_juridique: RegimeJuridique | null;
  superficie: number | null;
  superficie_commune: number | null;
  adresse: string | null;
  ville: string | null;
  pays: string | null;
  code_postal: string | null;
  nb_pieces: number | null;
  nb_chambres: number | null;
  nb_salles_bain: number | null;
  nb_cuisine: number | null;
  etage: number | null;
  date_construction: string | null;
  accepte_animaux: boolean;
  accepte_fumeurs: boolean;
  options: string[];
  statut: BienStatut;
  image_principale?: BienImage;
  images?: BienImage[];
  documents?: BienDocument[];
  organisation?: Organisation;
  created_at: string;
  updated_at: string;
}

// ─── Annonce ─────────────────────────────────────────────────────────────────

export type AnnonceStatut = 'brouillon' | 'planifiee' | 'publiee' | 'archivee';

export interface AnnoncePhoto {
  id: number;
  url: string;
  ordre: number;
}

export interface Annonce {
  id: number;
  titre: string;
  description: string | null;
  statut: AnnonceStatut;
  date_publication: string | null;
  bien?: Bien;
  organisation?: Organisation;
  photos?: AnnoncePhoto[];
  created_at: string;
  updated_at: string;
}

// ─── Client ──────────────────────────────────────────────────────────────────
// Un client est une personne ayant signé un contrat.

export interface Client {
  id: number;
  civilite: 'M.' | 'Mme' | 'Mlle' | null;
  nom: string;
  prenom: string;
  nom_complet: string;
  email: string | null;
  telephone: string | null;
  adresse: string | null;
  ville: string | null;
  date_naissance: string | null;
  lieu_naissance: string | null;
  type_piece: 'CIN' | 'Passeport' | null;
  cin: string | null;
  cin_delivree_le: string | null;
  document_url: string | null;
  urgence_nom: string | null;
  urgence_telephone: string | null;
  urgence_relation: string | null;
  notes: string | null;
  /**
   * État de l'accès du client à son espace.
   *   aucun  — pas de compte (fiche sans e-mail)
   *   invite — invitation envoyée, mot de passe pas encore choisi
   *   actif  — le client a activé son compte
   */
  acces_statut: 'aucun' | 'invite' | 'actif';
  contrats?: Contrat[];
  factures?: Facture[];
  created_at: string;
  updated_at: string;
}

// ─── Prospect ────────────────────────────────────────────────────────────────
// Un prospect est un client potentiel (visite, évaluation). Pas lié aux contrats/factures.

export type RevenusClient = 'moins_1000' | '1000_2000' | '3000_6000' | '7000_10000' | 'plus_10000';
export type ScoreSolvabilite = 'verifie' | 'plutot_verifie' | 'plutot_non_verifie' | 'non_verifie';
export type ImpressionVisite = 'satisfait' | 'neutre' | 'non_satisfait';
export type BesoinProspect = 'prix' | 'emplacement' | 'superficie' | 'transport' | 'commodites';

export interface Prospect {
  id: number;
  client_id: number | null;
  converti: boolean;
  civilite: 'M.' | 'Mme' | 'Mlle' | null;
  nom: string;
  prenom: string;
  nom_complet: string;
  email: string | null;
  telephone: string | null;
  adresse: string | null;
  ville: string | null;
  date_naissance: string | null;
  lieu_naissance: string | null;
  type_piece: 'CIN' | 'Passeport' | null;
  cin: string | null;
  cin_delivree_le: string | null;
  cin_delivree_a: string | null;
  document_url: string | null;
  notes: string | null;
  source_connaissance: string | null;
  source_connaissance_detail: string | null;
  profession: string | null;
  revenus_mensuels: RevenusClient | null;
  composition_foyer: string[];
  biens_interet: number[];
  score_solvabilite: ScoreSolvabilite | null;
  impression_premiere_visite: ImpressionVisite | null;
  hierarchie_besoins: BesoinProspect[];
  score_opportunite: number;
  created_at: string;
  updated_at: string;
}

export interface BienSuggestion {
  id: number;
  designation: string;
  type_bien: string;
  type_transaction: 'vente' | 'loyer';
  prix: number | null;
  ville: string | null;
  superficie: number | null;
  nb_pieces: number | null;
  score: number;
}

// ─── Employe ─────────────────────────────────────────────────────────────────

export interface Employe {
  id: number;
  nom: string;
  prenom: string;
  nom_complet: string;
  email: string | null;
  telephone: string | null;
  poste: string | null;
  statut: 'actif' | 'inactif' | 'en_attente';
  cin: string | null;
  cin_delivree_le: string | null;
  cin_delivree_a: string | null;
  date_naissance: string | null;
  user_id: number | null;
  date_embauche: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Contrat ─────────────────────────────────────────────────────────────────

export type TypeContrat =
  | 'bail_habitation' | 'bail_etudiant' | 'bail_professionnel'
  | 'bail_commercial' | 'bail_saisonnier' | 'loyer' | 'vente' | 'autre';

export type UtilisationContrat =
  | 'residence_primaire' | 'residence_secondaire' | 'professionnel' | 'commercial' | 'autre';

export type PeriodiciteContrat =
  | 'mensuel' | 'bimestriel' | 'trimestriel' | 'quadrimestriel' | 'semestriel' | 'annuel';

export interface Contrat {
  id: number;
  designation: string | null;
  utilisation: UtilisationContrat | null;
  type: TypeContrat;
  statut: 'actif' | 'termine' | 'resilie';
  date_debut: string;
  date_fin: string | null;
  montant_ht: number;
  tva: number;
  montant_ttc: number | null;
  frais_syndic: number | null;
  retenue_source: number | null;
  montant_paiement: number | null;
  periodicite_paiement: PeriodiciteContrat | null;
  jour_paiement: number | null;
  depot_garantie: number | null;
  premiere_echeance: string | null;
  assurance: string | null;
  fichier: string | null;
  notes: string | null;
  forme_juridique: string | null;
  representant: string | null;
  date_contrat: string | null;
  ville_signature: string | null;
  cin_delivree_le: string | null;
  bien?: Bien;
  clients?: Client[];
  created_at: string;
  updated_at: string;
}

// ─── État des lieux ───────────────────────────────────────────────────────────

export type TypeEtatLieu = 'entree' | 'sortie';

export interface EtatLieuInventaire {
  id?: number;
  piece: string;
  categorie: 'meuble' | 'electromenager' | 'equipement' | 'textile';
  designation: string;
  description: string;
  date: string;
}

export interface EtatLieu {
  id: number;
  designation: string | null;
  type: TypeEtatLieu;
  date: string;
  releve_eau: number | null;
  releve_electricite: number | null;
  releve_gaz: number | null;
  remise_cles: boolean;
  commentaire: string | null;
  location?: {
    id: number;
    locataire_nom: string;
    locataire_type: string;
    locataire_id: number | null;
    locataire?: { id: number; nom_complet: string; email?: string | null; telephone?: string | null } | null;
    type: string;
    date_debut: string | null;
    bien?: { id: number; designation: string; ville?: string | null } | null;
  };
  inventaires?: EtatLieuInventaire[];
  created_at: string;
  updated_at: string;
}

// ─── Facture ─────────────────────────────────────────────────────────────────

export interface Facture {
  id: number;
  type: 'eau' | 'electricite' | 'gaz' | 'electricite_gaz';
  montant: number;
  statut: 'en_attente' | 'payee' | 'en_retard';
  reference: string | null;
  date_emission: string;
  date_echeance: string;
  periode_debut: string | null;
  periode_fin: string | null;
  notes: string | null;
  client?: Client;
  contrat?: Contrat;
  created_at: string;
  updated_at: string;
}

// ─── Immeuble ─────────────────────────────────────────────────────────────────

export interface ImmeublePhoto {
  id: number;
  url: string;
  ordre: number;
}

export interface Immeuble {
  id: number;
  nom: string;
  type_usage: 'residentiel' | 'professionnel' | 'mixte';
  type_propriete: 'auto_propriete' | 'co_propriete';
  a_blocs: boolean;
  nb_blocs: number | null;
  nb_etages: number;
  adresse: string | null;
  ville: string | null;
  pays: string | null;
  maps_url: string | null;
  sous_sol: boolean;
  cameras_surveillance: boolean;
  photos?: ImmeublePhoto[];
  photos_count?: number;
  created_at: string;
  updated_at: string;
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
  links?: { first: string; last: string; prev: string | null; next: string | null };
}

// ─── Erreur API ───────────────────────────────────────────────────────────────

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}

// ─── Espace client ────────────────────────────────────────────────────────────
// Formes renvoyées par /api/client/*. Volontairement plus étroites que celles
// du back-office : le client ne voit ni les champs internes de l'agence, ni les
// colonnes d'audit.

export interface EspaceResume {
  contrats_actifs: number;
  factures_impayees: number;
  montant_du: number;
  agences: number;
}

export interface EspaceAgence {
  client_id: number;
  nom_complet: string;
  agence: {
    nom: string;
    slug: string;
    telephone: string | null;
    email: string | null;
  } | null;
}

export interface EspaceFacture {
  id: number;
  reference: string | null;
  type: string;
  montant: number;
  statut: 'en_attente' | 'payee' | 'en_retard';
  date_emission: string | null;
  date_echeance: string | null;
  periode_debut: string | null;
  periode_fin: string | null;
  /** Lien de règlement en ligne, présent uniquement si la facture est due. */
  payment_url: string | null;
  organisation?: { nom: string; telephone: string | null; email: string | null };
  contrat?: {
    id: number;
    designation: string | null;
    bien: { designation: string; adresse: string | null; ville: string | null } | null;
  };
}

export interface EspaceEtatLieu {
  id: number;
  designation: string | null;
  type: 'entree' | 'sortie';
  date: string | null;
  releve_eau: number | null;
  releve_electricite: number | null;
  releve_gaz: number | null;
  remise_cles: boolean;
  commentaire: string | null;
}

export interface EspaceQuittance {
  id: number;
  periode: string;
  date_echeance: string | null;
  date_paiement: string | null;
  montant: number;
  montant_paye: number;
  reste_a_payer: number;
  statut: string;
  location?: {
    id: number;
    designation: string | null;
    agence: string | null;
    bien: { designation: string; adresse: string | null; ville: string | null } | null;
  };
}

export interface EspaceContrat {
  id: number;
  designation: string | null;
  type: string;
  statut: 'actif' | 'termine' | 'resilie';
  utilisation: string | null;
  date_debut: string | null;
  date_fin: string | null;
  montant_ht: number | null;
  tva: number | null;
  montant_ttc: number | null;
  depot_garantie: number | null;
  periodicite_paiement: string | null;
  jour_paiement: number | null;
  bien?: {
    id: number;
    designation: string;
    type_bien: string;
    adresse: string | null;
    ville: string | null;
    superficie: number | null;
    nb_pieces: number | null;
    image: string | null;
  };
  organisation?: {
    nom: string;
    telephone: string | null;
    email: string | null;
    adresse: string | null;
    ville: string | null;
  };
  factures?: EspaceFacture[];
  etats_lieux?: EspaceEtatLieu[];
}
