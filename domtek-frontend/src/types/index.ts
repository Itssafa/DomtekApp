// ─── Auth ────────────────────────────────────────────────────────────────────

export type Role = 'admin' | 'organisation' | 'client';

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
export type TypeBien = 'appartement' | 'maison' | 'villa' | 'bureau' | 'terrain' | 'autre';
export type BienStatut = 'disponible' | 'vendu' | 'loue' | 'indisponible';

export interface BienImage {
  id: number;
  chemin: string;
  url: string;
  ordre: number;
  is_principale: boolean;
}

export interface Bien {
  id: number;
  immeuble_id: number | null;
  bloc: number | null;
  immeuble?: Immeuble;
  titre: string;
  description: string | null;
  type_transaction: TypeTransaction;
  type_bien: TypeBien;
  prix: number;
  superficie: number | null;
  adresse: string | null;
  ville: string | null;
  nb_pieces: number | null;
  nb_chambres: number | null;
  nb_salles_bain: number | null;
  etage: number | null;
  statut: BienStatut;
  image_principale?: BienImage;
  images?: BienImage[];
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
  document_url: string | null;
  urgence_nom: string | null;
  urgence_telephone: string | null;
  urgence_relation: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
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
  statut: 'actif' | 'inactif';
  date_embauche: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Contrat ─────────────────────────────────────────────────────────────────

export interface Contrat {
  id: number;
  type: 'vente' | 'loyer';
  statut: 'actif' | 'termine' | 'resilie';
  montant: number;
  date_debut: string;
  date_fin: string | null;
  fichier: string | null;
  notes: string | null;
  bien?: Bien;
  clients?: Client[];
  created_at: string;
  updated_at: string;
}

// ─── Facture ─────────────────────────────────────────────────────────────────

export interface Facture {
  id: number;
  type: 'eau' | 'electricite' | 'gaz' | 'electricite_gaz' | 'loyer';
  montant: number;
  statut: 'en_attente' | 'payee' | 'en_retard';
  reference: string | null;
  date_emission: string;
  date_echeance: string;
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
  sous_sol: boolean;
  cameras_surveillance: boolean;
  photos?: ImmeublePhoto[];
  photos_count?: number;
  created_at: string;
  updated_at: string;
}

// ─── Taux Investissement ─────────────────────────────────────────────────────

export interface TauxInvestissement {
  id: number;
  taux: number;
  periode: 'mensuel' | 'trimestriel' | 'annuel';
  description: string | null;
  date_debut: string;
  date_fin: string | null;
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
