
# DESCRIPTION FONCTIONNELLE COMPLÈTE — DOMTEK

> Ce document décrit exhaustivement toutes les fonctionnalités de l'application **Domtek**, une plateforme de gestion immobilière multi-tenant. Il est conçu pour permettre à un développeur de reconstruire le projet à l'identique.

---

## TABLE DES MATIÈRES

1. [Stack Technique](#1-stack-technique)
2. [Architecture Générale](#2-architecture-générale)
3. [Schéma de Base de Données](#3-schéma-de-base-de-données)
4. [Système d'Authentification & Rôles](#4-système-dauthentification--rôles)
5. [Module Organisations](#5-module-organisations)
6. [Module Biens Immobiliers](#6-module-biens-immobiliers)
7. [Module Annonces](#7-module-annonces)
8. [Module Immeubles](#8-module-immeubles)
9. [Module Clients](#9-module-clients)
10. [Module Prospects (CRM)](#10-module-prospects-crm)
11. [Module Employés](#11-module-employés)
12. [Module Contrats](#12-module-contrats)
13. [Module Quittances](#13-module-quittances)
14. [Module Paiements](#14-module-paiements)
15. [Module Factures](#15-module-factures)
16. [Module État des Lieux](#16-module-état-des-lieux)
17. [Module Visites](#17-module-visites)
18. [Module Tâches](#18-module-tâches)
19. [Module Investissements](#19-module-investissements)
20. [Module Notifications](#20-module-notifications)
21. [Module Statistiques](#21-module-statistiques)
22. [Intégrations Externes](#22-intégrations-externes)
23. [API REST — Endpoints Complets](#23-api-rest--endpoints-complets)
24. [Routes Frontend](#24-routes-frontend)
25. [Workflows Métier](#25-workflows-métier)
26. [Sécurité & Autorisation](#26-sécurité--autorisation)
27. [Gestion des Fichiers & Médias](#27-gestion-des-fichiers--médias)
28. [État Global Frontend](#28-état-global-frontend)

---

## 1. STACK TECHNIQUE

### Backend
| Élément | Technologie | Version |
|---|---|---|
| Langage | PHP | 8.2+ |
| Framework | Laravel | 12.0 |
| Authentification API | Laravel Sanctum | dernière |
| OAuth Social | Laravel Socialite | ^5.26 |
| Paiement en ligne | Stripe (stripe-php) | ^19.4 |
| SMS | Twilio SDK | ^8.11 |
| Génération PDF | barryvdh/laravel-dompdf | ^3.1 |
| Queue | Database driver | — |
| Cache | Database driver | — |
| Sessions | Database driver | — |
| Tests | PHPUnit | 11.5+ |

### Frontend
| Élément | Technologie | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16.1.6 |
| Langage | TypeScript | 5 |
| UI | React | 19 |
| Styles | Tailwind CSS | 4 |
| Client HTTP | Axios | 1.13.6 |
| État global | Zustand | 5.0.11 |
| Données serveur | TanStack React Query | 5.90.21 |
| Cookies | js-cookie | 3.0.5 |

### Base de données
- **MySQL** (production) / SQLite (développement local)

### Infrastructure fichiers
- Stockage local Laravel (`storage/app/public`) avec symlink `public/storage`
- Chemins distincts par entité (biens, annonces, immeubles, documents, identité)

---

## 2. ARCHITECTURE GÉNÉRALE

```
domtek/
├── Domtek/                    ← Backend Laravel
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/   ← Logique métier par module
│   │   │   └── Middleware/    ← CheckRole, auth
│   │   ├── Models/            ← Eloquent ORM
│   │   ├── Services/          ← SmsService, etc.
│   │   └── Jobs/              ← Queued jobs
│   ├── database/
│   │   └── migrations/        ← Schéma complet
│   └── routes/
│       └── api.php            ← Toutes les routes API
│
└── domtek-frontend/           ← Frontend Next.js
    └── src/
        ├── app/
        │   ├── (dashboard)/[slug]/  ← Portail organisation
        │   ├── admin/               ← Interface administrateur
        │   ├── (auth)/              ← Pages d'authentification
        │   └── (public)/            ← Pages publiques
        ├── hooks/             ← React Query hooks
        ├── lib/               ← API client Axios, stores Zustand
        └── components/        ← Composants réutilisables
```

Le système est **multi-tenant** : chaque organisation dispose de son propre espace identifié par un `slug` unique. Toutes les données sont isolées par `organisation_id`.

---

## 3. SCHÉMA DE BASE DE DONNÉES

### 3.1 `users`
| Colonne | Type | Description |
|---|---|---|
| id | bigint PK | — |
| name | string | Nom complet |
| email | string unique | Identifiant de connexion |
| password | string | Hash bcrypt |
| role | enum | `admin`, `organisation`, `client`, `employe` |
| is_active | boolean | Accès activé ou non |
| google_id | string nullable | ID Google OAuth |
| avatar | string nullable | URL de la photo de profil |
| created_by | bigint FK | Créé par quel user |
| updated_by | bigint FK | Modifié par quel user |

### 3.2 `organisations`
| Colonne | Type | Description |
|---|---|---|
| id | bigint PK | — |
| user_id | bigint FK | Compte utilisateur lié |
| nom | string | Raison sociale |
| slug | string unique | Identifiant URL (ex: `immobiliere-abc`) |
| statut | enum | `en_attente`, `active`, `inactive` |
| logo | string nullable | Chemin du logo |
| adresse | string nullable | — |
| ville | string nullable | — |
| telephone | string nullable | — |
| email | string nullable | Email professionnel |
| description | text nullable | Présentation de l'agence |
| created_by / updated_by | bigint FK | Audit |

### 3.3 `biens`
| Colonne | Type | Description |
|---|---|---|
| id | bigint PK | — |
| organisation_id | bigint FK | Propriétaire |
| immeuble_id | bigint FK nullable | Immeuble parent (optionnel) |
| designation | string | Nom du bien |
| description | text nullable | Description détaillée |
| notes | text nullable | Notes internes |
| type_bien | string | `appartement`, `maison`, `villa`, `bureau`, `terrain`, `studio`, `duplex`, `commercial`, `entrepot`, `ferme`, `autre` |
| type_transaction | enum | `vente`, `loyer` |
| prix | decimal(12,3) | Prix de vente ou loyer |
| taxe_fonciere | decimal nullable | Taxe foncière annuelle |
| frais_syndic | decimal nullable | Charges de copropriété |
| adresse | string nullable | — |
| ville | string nullable | — |
| pays | string nullable | — |
| code_postal | string nullable | — |
| maps_url | string nullable | Lien Google Maps |
| nb_pieces | integer nullable | Nombre de pièces |
| nb_chambres | integer nullable | — |
| nb_salles_bain | integer nullable | — |
| nb_cuisine | integer nullable | — |
| etage | integer nullable | — |
| superficie | decimal nullable | m² habitables |
| superficie_commune | decimal nullable | m² communs |
| date_construction | date nullable | — |
| statut | enum | `disponible`, `vendu`, `loue`, `indisponible` |
| accepte_animaux | boolean | — |
| accepte_fumeurs | boolean | — |
| regime_juridique | enum | `mono_propriete`, `co_propriete` |
| options | json nullable | Tableau d'options (balcon, piscine, etc.) |
| created_by / updated_by | bigint FK | Audit |

### 3.4 `bien_images`
| Colonne | Type | Description |
|---|---|---|
| id | bigint PK | — |
| bien_id | bigint FK | — |
| chemin | string | Chemin fichier |
| ordre | integer | Ordre d'affichage |
| is_principale | boolean | Image principale |

### 3.5 `bien_documents`
| Colonne | Type | Description |
|---|---|---|
| id | bigint PK | — |
| bien_id | bigint FK | — |
| nom | string | Nom affiché |
| chemin | string | Chemin fichier |
| type_document | string | Type de certificat/document |

### 3.6 `immeubles`
| Colonne | Type | Description |
|---|---|---|
| id | bigint PK | — |
| organisation_id | bigint FK | — |
| nom | string | Nom de l'immeuble |
| type_usage | enum | `residentiel`, `professionnel`, `mixte` |
| type_propriete | enum | `auto_propriete`, `co_propriete` |
| a_blocs | boolean | Composé de blocs distincts |
| nb_blocs | integer nullable | — |
| nb_etages | integer nullable | — |
| adresse | string nullable | — |
| ville | string nullable | — |
| pays | string nullable | — |
| maps_url | string nullable | — |
| sous_sol | boolean | Parking/cave |
| cameras_surveillance | boolean | — |
| created_by / updated_by | bigint FK | Audit |

### 3.7 `immeuble_photos`
| Colonne | Type | Description |
|---|---|---|
| id | bigint PK | — |
| immeuble_id | bigint FK | — |
| chemin | string | — |
| ordre | integer | — |

### 3.8 `annonces`
| Colonne | Type | Description |
|---|---|---|
| id | bigint PK | — |
| organisation_id | bigint FK | — |
| bien_id | bigint FK | Bien mis en annonce |
| titre | string | — |
| description | text nullable | — |
| date_publication | datetime nullable | Date de publication planifiée |
| statut | enum | `brouillon`, `planifiee`, `publiee`, `archivee` |
| created_by / updated_by | bigint FK | Audit |

### 3.9 `annonce_photos`
| Colonne | Type | Description |
|---|---|---|
| id | bigint PK | — |
| annonce_id | bigint FK | — |
| chemin | string | — |
| ordre | integer | — |

### 3.10 `clients`
| Colonne | Type | Description |
|---|---|---|
| id | bigint PK | — |
| organisation_id | bigint FK | — |
| user_id | bigint FK nullable | Compte utilisateur optionnel |
| civilite | string nullable | M., Mme, etc. |
| nom | string | — |
| prenom | string | — |
| email | string nullable | — |
| telephone | string nullable | — |
| adresse | string nullable | — |
| ville | string nullable | — |
| date_naissance | date nullable | — |
| lieu_naissance | string nullable | — |
| type_piece | enum nullable | `CIN`, `Passeport` |
| cin | string nullable | Numéro de pièce d'identité |
| cin_delivree_le | date nullable | Date d'émission |
| cin_delivree_a | string nullable | Lieu d'émission |
| document_identite | string nullable | Chemin scan de la pièce |
| urgence_nom | string nullable | Nom du contact d'urgence |
| urgence_telephone | string nullable | — |
| urgence_relation | string nullable | Parenté |
| notes | text nullable | — |
| created_by / updated_by | bigint FK | Audit |

### 3.11 `prospects`
| Colonne | Type | Description |
|---|---|---|
| id | bigint PK | — |
| organisation_id | bigint FK | — |
| client_id | bigint FK nullable | Lié si converti en client |
| user_id | bigint FK nullable | — |
| civilite / nom / prenom / email / telephone | string | Identité |
| adresse / ville | string nullable | — |
| date_naissance / lieu_naissance | date/string nullable | — |
| type_piece / cin / cin_delivree_le / cin_delivree_a | varies | Pièce d'identité |
| document_identite | string nullable | Scan |
| source_connaissance | string nullable | Canal d'acquisition |
| source_connaissance_detail | string nullable | Précision |
| profession | string nullable | — |
| revenus_mensuels | enum nullable | `moins_1000`, `1000_2000`, `3000_6000`, `7000_10000`, `plus_10000` |
| composition_foyer | json nullable | Tableau des membres du foyer |
| biens_interet | json nullable | Tableau d'IDs de biens souhaités |
| score_solvabilite | enum | `verifie`, `plutot_verifie`, `plutot_non_verifie`, `non_verifie` |
| impression_premiere_visite | enum nullable | `très_satisfait`, `satisfait`, `neutre`, `plutot_non_satisfait`, `non_satisfait` |
| hierarchie_besoins | json nullable | Ordre de priorité des critères de recherche |
| notes | text nullable | — |
| created_by / updated_by | bigint FK | Audit |

### 3.12 `employes`
| Colonne | Type | Description |
|---|---|---|
| id | bigint PK | — |
| organisation_id | bigint FK | — |
| user_id | bigint FK | Compte utilisateur lié |
| nom / prenom | string | — |
| email / telephone | string nullable | — |
| cin | string nullable | — |
| cin_delivree_le / cin_delivree_a | date/string nullable | — |
| date_naissance | date nullable | — |
| poste | string nullable | Intitulé du poste |
| date_embauche | date nullable | — |
| statut | enum | `actif`, `inactif`, `en_attente` |
| created_by / updated_by | bigint FK | Audit |

### 3.13 `contrats`
| Colonne | Type | Description |
|---|---|---|
| id | bigint PK | — |
| organisation_id | bigint FK | — |
| bien_id | bigint FK | Bien concerné |
| designation | string | Libellé du contrat |
| utilisation | enum | `residence_primaire`, `residence_secondaire`, `professionnel`, `commercial`, `autre` |
| type | enum | `bail_habitation`, `bail_etudiant`, `bail_professionnel`, `bail_commercial`, `bail_saisonnier`, `loyer`, `vente` |
| date_debut | date | — |
| date_fin | date nullable | — |
| date_contrat | date nullable | Date de signature |
| ville_signature | string nullable | — |
| montant_ht | decimal(12,3) | Montant hors taxes |
| tva | decimal nullable | Taux TVA |
| montant_ttc | decimal(12,3) | Montant TTC |
| frais_syndic | decimal nullable | — |
| retenue_source | decimal nullable | — |
| montant_paiement | decimal(12,3) | Montant effectivement dû |
| periodicite_paiement | enum | `mensuel`, `bimestriel`, `trimestriel`, `quadrimestriel`, `semestriel`, `annuel` |
| jour_paiement | integer nullable | Jour du mois de prélèvement |
| depot_garantie | decimal nullable | Caution |
| premiere_echeance | date nullable | — |
| statut | enum | `actif`, `termine`, `resilie` |
| fichier | string nullable | Document signé uploadé |
| assurance | string nullable | Document d'assurance |
| revision | json nullable | Historique des révisions de loyer |
| forme_juridique | string nullable | Forme légale du bailleur |
| representant | string nullable | Représentant légal |
| notes | text nullable | — |
| created_by / updated_by | bigint FK | Audit |

### 3.14 `quittances`
| Colonne | Type | Description |
|---|---|---|
| id | bigint PK | — |
| organisation_id | bigint FK | — |
| contrat_id | bigint FK | — |
| numero | string | Numéro séquentiel |
| date_echeance | date | Date limite de paiement |
| montant_du | decimal(12,3) | Montant total dû |
| montant_paye | decimal(12,3) | Montant effectivement payé |
| statut | tinyint | `0`=prévu, `1`=payé, `2`=impayé, `3`=partiel, `4`=retard |
| periode_debut | date | Début de la période couverte |
| periode_fin | date | Fin de la période couverte |
| notes | text nullable | — |
| created_by / updated_by | bigint FK | Audit |

### 3.15 `payments`
| Colonne | Type | Description |
|---|---|---|
| id | bigint PK | — |
| organisation_id | bigint FK | — |
| quittance_id | bigint FK | — |
| montant | decimal(12,3) | Montant du versement |
| mode_paiement | enum | `especes`, `cheque`, `virement`, `carte`, `autre` |
| date_paiement | date | — |
| banque | string nullable | Banque (si chèque) |
| numero_cheque | string nullable | — |
| reference | string nullable | Référence virement |
| notes | text nullable | — |
| created_by / updated_by | bigint FK | Audit |

### 3.16 `factures`
| Colonne | Type | Description |
|---|---|---|
| id | bigint PK | — |
| organisation_id | bigint FK | — |
| client_id | bigint FK | Client destinataire |
| contrat_id | bigint FK nullable | Contrat associé |
| type | enum | `eau`, `electricite`, `gaz`, `electricite_gaz`, `loyer` |
| montant | decimal(12,3) | — |
| date_emission | date | — |
| date_echeance | date | — |
| periode_debut | date nullable | — |
| periode_fin | date nullable | — |
| statut | enum | `en_attente`, `payee`, `en_retard` |
| reference | string nullable | Numéro de référence |
| notes | text nullable | — |
| payment_token | string unique nullable | Token Stripe pour paiement en ligne |
| stripe_session_id | string nullable | ID session Stripe |
| created_by / updated_by | bigint FK | Audit |

### 3.17 `etat_lieux`
| Colonne | Type | Description |
|---|---|---|
| id | bigint PK | — |
| organisation_id | bigint FK | — |
| contrat_id | bigint FK | — |
| designation | string | — |
| type | enum | `entree`, `sortie` |
| date | date | Date de l'état des lieux |
| releve_eau | decimal nullable | Index compteur eau |
| releve_electricite | decimal nullable | Index compteur électricité |
| releve_gaz | decimal nullable | Index compteur gaz |
| remise_cles | boolean | Clés remises ou non |
| commentaire | text nullable | — |
| created_by / updated_by | bigint FK | Audit |

### 3.18 `visites`
| Colonne | Type | Description |
|---|---|---|
| id | bigint PK | — |
| organisation_id | bigint FK | — |
| prospect_id | bigint FK | Prospect concerné |
| bien_id | bigint FK | Bien visité |
| employe_id | bigint FK nullable | Agent responsable |
| nom_agent | string nullable | Nom si pas d'employé lié |
| date_visite | datetime | — |
| statut | enum | `scheduled`, `effectuee`, `cancelled` |
| impression_client | enum nullable | `très_satisfait`, `satisfait`, `neutre`, `plutot_non_satisfait`, `non_satisfait` |
| notes | text nullable | — |
| created_by / updated_by | bigint FK | Audit |

### 3.19 `taches`
| Colonne | Type | Description |
|---|---|---|
| id | bigint PK | — |
| organisation_id | bigint FK | — |
| titre | string | — |
| description | text nullable | — |
| date_echeance | date nullable | — |
| statut | enum | `open`, `in_progress`, `completed` |
| priorite | enum | `low`, `medium`, `high` |
| created_by / updated_by | bigint FK | Audit |

### 3.20 `taux_investissement`
| Colonne | Type | Description |
|---|---|---|
| id | bigint PK | — |
| organisation_id | bigint FK | — |
| taux | decimal(5,2) | Taux en pourcentage |
| periode | enum | `mensuel`, `trimestriel`, `annuel` |
| description | text nullable | — |
| date_debut | date nullable | — |
| date_fin | date nullable | — |
| created_by / updated_by | bigint FK | Audit |

### 3.21 `personal_access_tokens`
Table standard Laravel Sanctum pour stocker les tokens API.

---

## 4. SYSTÈME D'AUTHENTIFICATION & RÔLES

### 4.1 Rôles
| Rôle | Description | Accès |
|---|---|---|
| `admin` | Super-administrateur | Gestion de toutes les organisations, activation/désactivation |
| `organisation` | Responsable d'agence | CRUD complet sur son espace + gestion employés |
| `employe` | Agent immobilier | Lecture + certaines actions dans l'espace de son organisation |
| `client` | Locataire/acheteur | Accès limité (consulter factures, payer en ligne) |

### 4.2 Authentification email/mot de passe
1. **Inscription** : formulaire avec email + mot de passe → token Sanctum retourné
2. **Connexion** : `POST /api/auth/login` → token + rôle + données utilisateur
3. **Déconnexion** : révocation du token courant
4. **Réinitialisation de mot de passe** :
   - `POST /api/auth/forgot-password` → envoi d'un email avec lien signé
   - `POST /api/auth/reset-password` → nouveau mot de passe

### 4.3 Authentification Google OAuth 2.0
- `GET /api/auth/google` → redirige vers Google
- `GET /api/auth/google/callback` → traitement du callback
- `POST /api/auth/google/prefill` → préremplissage formulaire à partir d'un token Google chiffré (durée de vie 30 min)
- Flux organisation : bouton "S'inscrire avec Google" → données préremplies → complétion du formulaire
- Flux client : identique
- Token Google chiffré stocké en base avec expiration, déchiffré côté backend
- Si un compte existe déjà avec cet email : liaison automatique du `google_id`

### 4.4 Workflow d'activation
**Organisation** :
1. Inscription → statut `en_attente`
2. L'admin active via le panel admin → statut `active`
3. L'organisation peut se connecter et accéder au portail

**Employé** :
1. L'organisation crée le compte employé → statut `en_attente`
2. L'employé reçoit ses identifiants par email
3. L'organisation active le compte → statut `actif`
4. L'employé accède au portail

### 4.5 Token & Cookie
- Token Sanctum valide 7 jours
- Stocké en cookie `domtek_token` côté frontend
- Slug de l'organisation stocké en cookie `org-slug`
- Middleware `CheckRole` sur toutes les routes protégées
- En cas de 401, redirection automatique vers `/login`

---

## 5. MODULE ORGANISATIONS

### Description
Chaque organisation représente une agence immobilière. Elle dispose d'un espace dédié identifié par son `slug`.

### Fonctionnalités
- Création lors de l'inscription (nom, email, mot de passe, téléphone, adresse, ville)
- Mise à jour du profil : logo, description, coordonnées
- Slug auto-généré à partir du nom (ex: "Immo Plus" → `immo-plus`)
- Activation/désactivation par l'admin
- Tableau de bord avec métriques clés (nombre de biens, contrats actifs, prospects)

### Interface Admin
- Liste de toutes les organisations avec statut
- Détail d'une organisation : biens, annonces, comptes liés, taux d'investissement
- Actions : activer, désactiver, supprimer

### Profil Public
- Page publique accessible via `/organisations/[slug]`
- Affiche les annonces publiées de l'agence

---

## 6. MODULE BIENS IMMOBILIERS

### Description
Gestion du patrimoine immobilier de l'organisation. Un bien peut être à vendre ou à louer, seul ou rattaché à un immeuble.

### Fonctionnalités
- **CRUD complet** avec pagination
- **Galerie photos** : upload multiple, réordonnancement, définition de la photo principale, suppression individuelle
- **Documents** : upload de fichiers (diagnostics, certificats, plans) avec nom et type
- **Champs détaillés** :
  - Informations générales : désignation, description, notes internes
  - Type : appartement, maison, villa, bureau, terrain, studio, duplex, commercial, entrepôt, ferme, autre
  - Transaction : vente ou loyer
  - Localisation : adresse complète + lien Google Maps
  - Financier : prix, taxe foncière, frais de syndic
  - Superficie et composition : m², pièces, chambres, SDB, cuisine, étage
  - Date de construction
  - Règles : acceptation animaux/fumeurs
  - Régime : mono-propriété ou copropriété
  - Options libres (tableau JSON) : balcon, terrasse, piscine, parking, ascenseur, etc.
- **Statut** : disponible → loué/vendu → indisponible
- **Rattachement immeuble** : un bien peut être une unité d'un immeuble (avec numéro de bloc, numéro d'unité, étage)

### Droits d'accès
- Organisation : CRUD complet
- Employé : lecture seule

---

## 7. MODULE ANNONCES

### Description
Système de publication d'annonces immobilières. Une annonce est liée à un bien et peut être publiée publiquement.

### Fonctionnalités
- **CRUD complet** avec statuts : brouillon → planifiée → publiée → archivée
- **Galerie photos** spécifique à l'annonce (différente des photos du bien)
- **Publication planifiée** : date et heure de publication configurable
- **Actions rapides** : publier, archiver sans passer par le formulaire complet
- **Filtre par statut** dans la liste

### Interface publique
- `/annonces` : liste de toutes les annonces publiées (toutes organisations confondues)
- `/annonces/[id]` : détail d'une annonce avec photos, description, infos du bien
- Accessible sans authentification

### Droits d'accès
- Organisation : CRUD complet + publication
- Employé : lecture seule
- Public : consultation des annonces publiées

---

## 8. MODULE IMMEUBLES

### Description
Gestion des immeubles (copropriétés, résidences, complexes) contenant plusieurs biens.

### Fonctionnalités
- **CRUD complet**
- Informations : nom, type d'usage (résidentiel/professionnel/mixte), type de propriété
- Structure : présence de blocs, nombre de blocs, nombre d'étages
- Localisation : adresse + lien Maps
- Équipements : sous-sol/parking, caméras de surveillance
- **Galerie photos** avec ordre
- Les biens liés à cet immeuble sont visibles depuis le détail

### Droits d'accès
- Organisation : CRUD complet
- Employé : lecture seule

---

## 9. MODULE CLIENTS

### Description
CRM pour les clients ayant signé un contrat (locataires ou acheteurs). Distinct des prospects.

### Fonctionnalités
- **CRUD complet**
- Fiche client complète :
  - Civilité, nom, prénom, email, téléphone
  - Adresse, ville
  - Date et lieu de naissance
  - Pièce d'identité : type (CIN/Passeport), numéro, date et lieu d'émission
  - Upload du scan de la pièce d'identité
  - Contact d'urgence : nom, téléphone, relation
  - Notes internes
- Liaison avec un compte utilisateur (optionnel)
- Historique des contrats liés
- Historique des factures liées

### Droits d'accès
- Organisation : CRUD complet
- Employé : lecture seule

---

## 10. MODULE PROSPECTS (CRM)

### Description
Gestion des leads et prospects (potentiels locataires/acheteurs) avec système de scoring automatique.

### Fonctionnalités
- **CRUD complet**
- Fiche prospect : mêmes champs d'identité que le client
- Champs spécifiques :
  - Source de connaissance : bouche-à-oreille, réseaux sociaux, portail, agence, autre (avec détail)
  - Profession
  - Revenus mensuels (tranche)
  - Composition du foyer (JSON : adultes, enfants, animaux, etc.)
  - Biens d'intérêt (JSON : liste d'IDs de biens)
  - Hiérarchie des besoins (JSON ordonné : prix, localisation, superficie, transports, commodités)

### Système de scoring (calcul automatique)
| Critère | Points max | Détail |
|---|---|---|
| Revenus mensuels | 0–20 | Moins de 1000 → 0 pts; 1000–2000 → 5; 3000–6000 → 10; 7000–10000 → 15; plus de 10000 → 20 |
| Score solvabilité | 0–40 | Vérifié → 40; plutôt vérifié → 25; plutôt non vérifié → 10; non vérifié → 0 |
| Biens d'intérêt | +10 | Si au moins un bien sélectionné |
| Visite effectuée | +10 | Si au moins une visite effectuée |
| Impression visite | 0–20 | Très satisfait → 20; satisfait → 15; neutre → 10; plutôt non satisfait → 5; non satisfait → 0 |
| **Total** | **0–100** | — |

### Conversion prospect → client
- Quand un contrat est signé avec un prospect, il devient automatiquement client
- Le champ `client_id` du prospect est renseigné
- Les données sont conservées dans les deux tables

### Droits d'accès
- Organisation : CRUD complet
- Employé : lecture seule

---

## 11. MODULE EMPLOYÉS

### Description
Gestion des agents immobiliers et collaborateurs de l'organisation.

### Fonctionnalités
- **CRUD complet**
- Création crée simultanément un compte utilisateur avec rôle `employe`
- Champs : nom, prénom, email, téléphone, CIN, date de naissance, poste, date d'embauche
- **Workflow d'activation** : en_attente → actif (l'organisation doit activer le compte)
- Vue des employés en attente d'activation
- Désactivation possible (statut `inactif`)
- Association aux visites (employe_id sur les visites)

---

## 12. MODULE CONTRATS

### Description
Gestion des contrats de location et de vente entre l'organisation et ses clients.

### Types de contrats supportés
- `bail_habitation` : bail classique résidentiel
- `bail_etudiant` : bail étudiant
- `bail_professionnel` : bail pour professions libérales
- `bail_commercial` : bail commercial
- `bail_saisonnier` : bail de courte durée
- `loyer` : loyer simple
- `vente` : contrat de vente

### Fonctionnalités
- **CRUD complet**
- Liaison bien + client(s) (pivot many-to-many)
- Paramètres financiers :
  - Montant HT → TVA → TTC
  - Déductions : frais de syndic, retenue à la source
  - Montant de paiement effectif
- Paramètres de paiement :
  - Périodicité : mensuelle, bimestrielle, trimestrielle, quadrimestrielle, semestrielle, annuelle
  - Jour du mois de l'échéance
- Garanties : dépôt de garantie, première échéance
- Documents : upload du contrat signé + assurance
- **Révision du loyer** : réviser le montant avec enregistrement de l'historique (JSON)
- **Génération PDF** du contrat
- **Génération des quittances** : automatique à partir de la date de début et de la périodicité

### Droits d'accès
- Organisation : CRUD complet
- Employé : lecture seule

---

## 13. MODULE QUITTANCES

### Description
Suivi des échéances de paiement générées depuis les contrats de location.

### Fonctionnalités
- **Génération automatique** lors de la création d'un contrat (toutes les échéances jusqu'à la date de fin)
- **Génération manuelle** des quittances manquantes
- Chaque quittance couvre une période (début → fin)
- Numérotation séquentielle
- **Suivi du statut** :
  - `0` Prévu : échéance future
  - `1` Payé : montant intégralement réglé
  - `2` Impayé : date dépassée, rien payé
  - `3` Partiel : paiement partiel enregistré
  - `4` Retard : payé mais en retard
- Calcul automatique du solde : `montant_dû - montant_payé`
- Historique de tous les paiements liés

---

## 14. MODULE PAIEMENTS

### Description
Enregistrement des versements effectués par les locataires sur leurs quittances.

### Fonctionnalités
- Enregistrement d'un ou plusieurs paiements par quittance (paiements partiels)
- Modes de paiement : espèces, chèque, virement, carte, autre
- Si chèque : numéro de chèque + banque
- Date de paiement libre (peut différer de la date d'enregistrement)
- Référence et notes libres
- La quittance se met à jour automatiquement (montant_payé + statut)

---

## 15. MODULE FACTURES

### Description
Facturation des charges (eau, électricité, gaz, loyer) aux clients, avec option de paiement en ligne.

### Types de factures
- `eau` : facture d'eau
- `electricite` : facture d'électricité
- `gaz` : facture de gaz
- `electricite_gaz` : combinée électricité + gaz
- `loyer` : facture de loyer ponctuelle

### Fonctionnalités
- **CRUD complet**
- Liaison client + contrat optionnel
- Période de couverture (début → fin)
- Dates d'émission et d'échéance
- Référence personnalisée
- **Paiement en ligne via Stripe** :
  - Génération d'un `payment_token` unique
  - Lien de paiement public `/api/pay/{token}`
  - Création de session Stripe Checkout
  - Webhook Stripe pour confirmation automatique → statut `payee`
- **Marquer comme payée** manuellement
- **Génération PDF** de la facture
- Statuts : en_attente → payée / en_retard

---

## 16. MODULE ÉTAT DES LIEUX

### Description
Rapport de l'état du bien au moment de l'entrée ou de la sortie d'un locataire.

### Fonctionnalités
- **CRUD complet**
- Types : entrée (`entree`) ou sortie (`sortie`)
- Relevés de compteurs : eau, électricité, gaz (décimaux)
- Remise de clés (booléen)
- Commentaire libre détaillé
- Liaison obligatoire à un contrat

---

## 17. MODULE VISITES

### Description
Planification et suivi des visites de biens par les prospects.

### Fonctionnalités
- **CRUD complet**
- Liaison : prospect + bien + employé (optionnel)
- Si pas d'employé lié : nom de l'agent saisi manuellement
- Date et heure de la visite
- **Statuts** : planifiée (`scheduled`) → effectuée (`effectuee`) / annulée (`cancelled`)
- **Impression du client** après visite : très satisfait / satisfait / neutre / plutôt non satisfait / non satisfait
- Ce score contribue au score global du prospect
- Vue par employé (`/visites-employes`) pour filtrer par agent
- Notes internes

---

## 18. MODULE TÂCHES

### Description
Gestionnaire de tâches interne à l'organisation (to-do list partagée).

### Fonctionnalités
- **CRUD complet**
- Titre, description, date d'échéance
- **Priorité** : faible (`low`), moyenne (`medium`), haute (`high`)
- **Statut** : ouvert (`open`) → en cours (`in_progress`) → terminé (`completed`)
- Visible par toute l'organisation (organisation + employés)

---

## 19. MODULE INVESTISSEMENTS

### Description
Définition des taux de rendement/investissement proposés par l'organisation à ses clients.

### Fonctionnalités
- **CRUD complet**
- Taux en pourcentage (ex: 5.25%)
- Périodicité : mensuelle, trimestrielle, annuelle
- Description libre
- Validité : date de début et de fin
- Consultable par l'admin depuis le panel d'administration

---

## 20. MODULE NOTIFICATIONS

### Description
Centre de notifications intégré à l'interface pour alerter sur les événements importants.

### Fonctionnalités
- Liste des notifications pour l'utilisateur connecté
- Notifications déclenchées par des événements métier (quittances en retard, contrats expirés, anniversaires, etc.)
- Accessible depuis l'en-tête de l'interface
- Support SMS via Twilio (configuré, intégration partielle)

---

## 21. MODULE STATISTIQUES

### Description
Tableaux de bord analytiques pour piloter l'activité immobilière.

### Endpoints et métriques

#### Statistiques Biens (`/statistiques/biens`)
- Nombre total de biens
- Répartition par statut : disponible / loué / vendu / indisponible
- Répartition par type de bien
- Répartition par type de transaction (vente/loyer)

#### Statistiques Prospects (`/statistiques/prospects`)
- Nombre total de prospects
- Distribution des scores de solvabilité
- Distribution des revenus mensuels
- Taux de conversion prospect → client

#### Statistiques Visites (`/statistiques/visites`)
- Nombre de visites planifiées / effectuées / annulées
- Répartition par agent
- Répartition par bien
- Impressions clients (satisfaction globale)

#### Statistiques Canaux (`/statistiques/canaux`)
- Sources d'acquisition des prospects
- Performance par canal

---

## 22. INTÉGRATIONS EXTERNES

### 22.1 Stripe (Paiements en ligne)
- **Configuration** : `STRIPE_KEY` (clé publique), `STRIPE_SECRET` (clé secrète), `STRIPE_WEBHOOK_SECRET`
- **Flux** :
  1. Organisation crée une facture et génère un lien de paiement
  2. Un `payment_token` unique est généré et stocké
  3. Le client accède à `/api/pay/{token}` (public, sans auth)
  4. Le backend crée une session Stripe Checkout et redirige le client
  5. Stripe traite le paiement et envoie un webhook
  6. `POST /api/stripe/webhook` → vérifie la signature → met à jour le statut de la facture à `payee`

### 22.2 Google OAuth 2.0
- **Configuration** : `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`
- **Flux organisation** :
  1. Clic "S'inscrire avec Google"
  2. Redirection vers Google → autorisation
  3. Callback : token Google chiffré (AES) + expiration 30 min → stocké en base
  4. Frontend reçoit le token → appel `/api/auth/google/prefill`
  5. Données Google (nom, email, avatar) préremplissent le formulaire
  6. Complétion du formulaire (champs manquants) → inscription classique
- **Flux client** : identique
- **Connexion** : si `google_id` déjà lié → connexion directe

### 22.3 Twilio (SMS)
- **Configuration** : `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM`
- **Usage** : notifications SMS (implémentation partielle via `SmsService`)

### 22.4 Email SMTP
- **Configuration** : variables `MAIL_*` dans `.env` (Mailtrap par défaut)
- **Usages** :
  - Email de réinitialisation de mot de passe
  - Notifications aux employés lors de leur création
  - Email `from` : `noreply@domtek.tn`

### 22.5 Stockage de fichiers
- Driver Laravel `local` avec disk `public`
- Symlink `storage/app/public` → `public/storage`
- Chemins distincts par type :
  - Photos biens : `storage/biens/{bien_id}/`
  - Photos annonces : `storage/annonces/{annonce_id}/`
  - Photos immeubles : `storage/immeubles/{immeuble_id}/`
  - Documents biens : `storage/bien_documents/`
  - Documents identité clients/prospects : `storage/clients/` / `storage/prospects/`

---

## 23. API REST — ENDPOINTS COMPLETS

Toutes les routes sont préfixées `/api`. Les routes protégées requièrent `Authorization: Bearer {token}`.

### Authentification (public)
```
POST   /api/auth/register/organisation         Inscription organisation
POST   /api/auth/register/organisation-google  Inscription organisation via Google
POST   /api/auth/register/client               Inscription client
POST   /api/auth/register/employe              Inscription employé
POST   /api/auth/login                         Connexion → token + rôle
GET    /api/auth/google                        Redirection Google OAuth
GET    /api/auth/google/callback               Callback Google OAuth
POST   /api/auth/google/prefill                Préremplissage depuis token Google
POST   /api/auth/forgot-password               Demande de réinitialisation
POST   /api/auth/reset-password                Réinitialisation de mot de passe
```

### Utilisateur authentifié
```
GET    /api/auth/me                            Profil courant
POST   /api/auth/logout                        Déconnexion
PUT    /api/auth/me                            Modifier le profil
PUT    /api/auth/me/password                   Changer le mot de passe
POST   /api/org/profil                         Mettre à jour le profil organisation
```

### Admin
```
GET    /api/admin/organisations                         Liste toutes les organisations
GET    /api/admin/organisations/{slug}                  Détail organisation
PATCH  /api/admin/organisations/{slug}/activer          Activer
PATCH  /api/admin/organisations/{slug}/desactiver       Désactiver
DELETE /api/admin/organisations/{slug}                  Supprimer
GET    /api/admin/organisations/{slug}/biens            Biens de l'org
GET    /api/admin/organisations/{slug}/annonces         Annonces de l'org
GET    /api/admin/organisations/{slug}/investissements  Taux d'investissement
GET    /api/admin/organisations/{slug}/comptes          Comptes liés
```

### Biens
```
GET    /api/org/biens                          Liste (paginée, filtrable)
GET    /api/org/biens/{id}                     Détail
POST   /api/org/biens                          Créer (org only)
PUT    /api/org/biens/{id}                     Modifier (org only)
DELETE /api/org/biens/{id}                     Supprimer (org only)
POST   /api/org/biens/{id}/images              Uploader des photos
DELETE /api/org/biens/{id}/images/{imageId}    Supprimer une photo
POST   /api/org/biens/{id}/documents           Uploader un document
DELETE /api/org/biens/{id}/documents/{docId}   Supprimer un document
```

### Annonces
```
GET    /api/org/annonces                        Liste (filtrable par statut)
GET    /api/org/annonces/{id}                   Détail
POST   /api/org/annonces                        Créer (org only)
PUT    /api/org/annonces/{id}                   Modifier (org only)
DELETE /api/org/annonces/{id}                   Supprimer (org only)
PATCH  /api/org/annonces/{id}/publier           Publier (org only)
PATCH  /api/org/annonces/{id}/archiver          Archiver (org only)
POST   /api/org/annonces/{id}/photos            Uploader des photos
DELETE /api/org/annonces/{id}/photos/{photoId}  Supprimer une photo
GET    /annonces                                Liste publique
GET    /annonces/{id}                           Détail public
```

### Contrats
```
GET    /api/org/contrats                              Liste
GET    /api/org/contrats/{id}                         Détail
POST   /api/org/contrats                              Créer (org only)
PUT    /api/org/contrats/{id}                         Modifier (org only)
DELETE /api/org/contrats/{id}                         Supprimer (org only)
GET    /api/org/contrats/{id}/pdf                     Télécharger PDF
POST   /api/org/contrats/{id}/fichier                 Upload document signé
POST   /api/org/contrats/{id}/revision-loyer          Réviser le loyer
GET    /api/org/contrats/{id}/quittances              Liste des quittances
POST   /api/org/contrats/{id}/quittances/generer      Générer quittances manquantes
```

### Quittances
```
GET    /api/org/quittances                            Liste (paginée)
GET    /api/org/quittances/{id}                       Détail avec paiements
DELETE /api/org/quittances/{id}                       Supprimer (org only)
GET    /api/org/quittances/{id}/paiements             Liste des paiements
POST   /api/org/quittances/{id}/paiements             Enregistrer un paiement (org only)
DELETE /api/paiements/{paymentId}                     Supprimer un paiement (org only)
```

### Factures
```
GET    /api/org/factures                       Liste
GET    /api/org/factures/{id}                  Détail
POST   /api/org/factures                       Créer
PUT    /api/org/factures/{id}                  Modifier
DELETE /api/org/factures/{id}                  Supprimer
PATCH  /api/org/factures/{id}/payer            Marquer comme payée
GET    /api/org/factures/{id}/pdf              Télécharger PDF
GET    /api/pay/{token}                        Page de paiement Stripe (public)
POST   /api/stripe/webhook                     Webhook Stripe (public)
```

### Clients
```
GET    /api/org/clients                        Liste
GET    /api/org/clients/{id}                   Détail
POST   /api/org/clients                        Créer (org only)
PUT    /api/org/clients/{id}                   Modifier (org only)
DELETE /api/org/clients/{id}                   Supprimer (org only)
POST   /api/org/clients/{id}/document          Upload pièce d'identité
```

### Prospects
```
GET    /api/org/prospects                      Liste (avec scores)
GET    /api/org/prospects/{id}                 Détail
POST   /api/org/prospects                      Créer (org only)
PUT    /api/org/prospects/{id}                 Modifier (org only)
DELETE /api/org/prospects/{id}                 Supprimer (org only)
POST   /api/org/prospects/{id}/document        Upload document
```

### Visites
```
GET    /api/org/visites                        Liste
GET    /api/org/visites/{id}                   Détail
POST   /api/org/visites                        Créer
PUT    /api/org/visites/{id}                   Modifier
DELETE /api/org/visites/{id}                   Supprimer
GET    /api/org/visites-employes               Liste filtrée par employé
```

### Employés
```
GET    /api/org/employes                        Liste
GET    /api/org/employes/{id}                   Détail
POST   /api/org/employes                        Créer
PUT    /api/org/employes/{id}                   Modifier
DELETE /api/org/employes/{id}                   Supprimer
GET    /api/org/employes-en-attente             En attente d'activation
POST   /api/org/employes/{id}/activer           Activer le compte
```

### Tâches
```
GET    /api/org/taches                          Liste
POST   /api/org/taches                          Créer
PUT    /api/org/taches/{id}                     Modifier
DELETE /api/org/taches/{id}                     Supprimer
```

### Immeubles
```
GET    /api/org/immeubles                        Liste
GET    /api/org/immeubles/{id}                   Détail
POST   /api/org/immeubles                        Créer (org only)
PUT    /api/org/immeubles/{id}                   Modifier (org only)
DELETE /api/org/immeubles/{id}                   Supprimer (org only)
POST   /api/org/immeubles/{id}/photos            Uploader des photos
DELETE /api/org/immeubles/{id}/photos/{photoId}  Supprimer une photo
```

### État des lieux
```
GET    /api/org/etat-lieux                      Liste
GET    /api/org/etat-lieux/{id}                 Détail
POST   /api/org/etat-lieux                      Créer (org only)
PUT    /api/org/etat-lieux/{id}                 Modifier (org only)
DELETE /api/org/etat-lieux/{id}                 Supprimer (org only)
```

### Taux d'investissement
```
GET    /api/org/investissements                  Liste
GET    /api/org/investissements/{id}             Détail
POST   /api/org/investissements                  Créer
PUT    /api/org/investissements/{id}             Modifier
DELETE /api/org/investissements/{id}             Supprimer
```

### Notifications
```
GET    /api/org/notifications                    Liste des notifications
```

### Statistiques
```
GET    /api/org/statistiques/biens               Statistiques biens
GET    /api/org/statistiques/prospects           Statistiques prospects
GET    /api/org/statistiques/visites             Statistiques visites
GET    /api/org/statistiques/canaux              Statistiques canaux d'acquisition
```

### Public
```
GET    /api/organisations                        Liste publique des organisations
GET    /api/organisations/{slug}                 Profil public d'une organisation
```

---

## 24. ROUTES FRONTEND

### Pages publiques
```
/                                    Page d'accueil (landing)
/annonces                            Annuaire des annonces publiées
/annonces/[id]                       Détail d'une annonce
/organisations                       Annuaire des agences
/organisations/[slug]                Profil public d'une agence
```

### Authentification
```
/login                               Connexion
/register/organisation               Inscription agence
/register/employe                    Inscription employé
/register/client                     Inscription client
/forgot-password                     Demande de réinitialisation
/reset-password                      Saisie du nouveau mot de passe
/auth/google/callback                Callback Google OAuth (frontend)
/en-attente                          Page d'attente d'activation
```

### Administration (`/admin`)
```
/admin                               Tableau de bord admin
/admin/compte                        Profil admin
/admin/organisations                 Liste des organisations
/admin/organisations/[slug]          Détail d'une organisation
/admin/organisations/[slug]/annonces       Annonces de l'org
/admin/organisations/[slug]/biens         Biens de l'org
/admin/organisations/[slug]/investissement Taux d'investissement
/admin/organisations/[slug]/comptes        Comptes liés
```

### Portail Organisation (`/[slug]`)
```
/[slug]                              Tableau de bord
/[slug]/compte                       Profil de l'organisation

/[slug]/biens                        Liste des biens
/[slug]/biens/nouveau                Créer un bien
/[slug]/biens/[id]                   Détail d'un bien
/[slug]/biens/[id]/modifier          Modifier un bien

/[slug]/annonces                     Liste des annonces
/[slug]/annonces/nouvelle            Créer une annonce
/[slug]/annonces/[id]                Détail d'une annonce
/[slug]/annonces/[id]/modifier       Modifier une annonce

/[slug]/immeubles                    Liste des immeubles
/[slug]/immeubles/nouveau            Créer un immeuble
/[slug]/immeubles/[id]               Détail d'un immeuble
/[slug]/immeubles/[id]/modifier      Modifier un immeuble

/[slug]/contrats                     Liste des contrats
/[slug]/contrats/nouveau             Créer un contrat
/[slug]/contrats/[id]                Détail d'un contrat

/[slug]/quittances                   Liste des quittances
/[slug]/quittances/[id]              Détail d'une quittance + paiements

/[slug]/factures                     Liste des factures
/[slug]/factures/nouvelle            Créer une facture
/[slug]/factures/[id]                Détail d'une facture

/[slug]/clients                      Liste des clients
/[slug]/clients/nouveau              Ajouter un client
/[slug]/clients/[id]                 Fiche client

/[slug]/prospects                    Liste des prospects (CRM)
/[slug]/prospects/nouveau            Ajouter un prospect
/[slug]/prospects/[id]               Fiche prospect avec score

/[slug]/employes                     Liste des employés
/[slug]/employes/nouveau             Créer un employé
/[slug]/employes/[id]                Fiche employé

/[slug]/visites                      Calendrier / liste des visites
/[slug]/taches                       Gestionnaire de tâches

/[slug]/etat-lieux                   Liste des états des lieux
/[slug]/etat-lieux/nouveau           Créer un état des lieux
/[slug]/etat-lieux/[id]              Détail d'un état des lieux

/[slug]/investissements              Liste des taux d'investissement
/[slug]/investissements/nouveau      Créer un taux
/[slug]/investissements/[id]         Détail d'un taux
```

---

## 25. WORKFLOWS MÉTIER

### 25.1 Inscription et activation d'une organisation
```
1. L'agence remplit le formulaire d'inscription (nom, email, mot de passe, téléphone)
2. Un compte user (rôle: organisation) est créé avec is_active = false
3. Un enregistrement organisation est créé avec statut = en_attente
4. Un slug unique est généré automatiquement depuis le nom
5. L'admin reçoit une notification
6. L'admin active l'organisation via /admin/organisations/{slug}/activer
7. is_active passe à true, statut passe à active
8. L'organisation peut maintenant se connecter et accéder à /[slug]
```

### 25.2 Recrutement d'un employé
```
1. L'organisation crée un employé (nom, email, poste, date d'embauche)
2. Un compte user (rôle: employe) est créé avec un mot de passe temporaire
3. L'employé reçoit ses identifiants par email
4. L'employé est créé avec statut = en_attente
5. L'organisation voit l'employé dans la liste "en attente"
6. L'organisation active l'employé via POST /employes/{id}/activer
7. L'employé peut maintenant se connecter et voir le portail de son organisation
```

### 25.3 Gestion d'un bien et publication d'une annonce
```
1. Création du bien avec tous ses détails
2. Upload des photos (une définie comme principale)
3. Upload des documents (diagnostics, certificats)
4. Création d'une annonce liée au bien (statut: brouillon)
5. Upload des photos de l'annonce
6. Publication : statut passe à publiée
7. L'annonce apparaît sur /annonces (public)
8. Si le bien est loué/vendu : statut du bien mis à jour
9. L'annonce peut être archivée
```

### 25.4 Cycle de vie d'un prospect → client
```
1. Création du prospect avec ses informations et scoring initial
2. Planification de visites (propriétés d'intérêt)
3. Après chaque visite : enregistrement de l'impression client
4. Le score du prospect se recalcule automatiquement
5. Si décision positive : création du contrat
6. Le prospect est converti en client (client_id renseigné sur le prospect)
7. Le client est lié au contrat
8. Les quittances sont générées automatiquement
```

### 25.5 Cycle de paiement du loyer
```
1. Contrat créé avec périodicité (ex: mensuelle, le 5 du mois)
2. Quittances générées automatiquement pour toute la durée du contrat
3. Chaque mois, la quittance passe de statut "prévu" à "impayé" si date dépassée
4. Le locataire (ou l'organisation) enregistre un paiement
5. Si paiement total : statut → "payé"
6. Si paiement partiel : statut → "partiel", solde restant calculé
7. Paiements supplémentaires possibles jusqu'à solde = 0
8. Historique complet de tous les versements conservé
```

### 25.6 Facturation et paiement en ligne
```
1. L'organisation crée une facture (eau, électricité, loyer, etc.)
2. Un payment_token unique est généré
3. Le lien /api/pay/{token} est envoyé au client
4. Le client ouvre le lien (sans authentification requise)
5. Le backend crée une session Stripe Checkout
6. Le client paie via l'interface Stripe (carte bancaire)
7. Stripe envoie un webhook à /api/stripe/webhook
8. Le backend vérifie la signature Stripe
9. La facture passe au statut "payée"
10. Le stripe_session_id est conservé pour audit
```

### 25.7 État des lieux
```
1. Avant remise des clés (entrée) : création état des lieux type "entree"
2. Relevés compteurs enregistrés (eau, électricité, gaz)
3. Commentaires sur l'état général du logement
4. Confirmation de la remise des clés (boolean)
5. À la fin du bail (sortie) : création état des lieux type "sortie"
6. Comparaison possible entre entrée et sortie pour calcul des dégradations
```

---

## 26. SÉCURITÉ & AUTORISATION

### Middleware
- `auth:sanctum` : vérifie la présence et la validité du token Bearer
- `CheckRole` : vérifie que le rôle de l'utilisateur est autorisé pour la route
- Toutes les routes `/api/org/*` requièrent `auth:sanctum + role:organisation|employe`
- Toutes les routes `/api/admin/*` requièrent `auth:sanctum + role:admin`

### Isolation des données
- **Toutes les requêtes Eloquent** sont scopées à `organisation_id`
- Un employé ne peut accéder qu'aux données de son organisation
- Les organisations ne voient jamais les données des autres organisations
- L'admin peut voir toutes les organisations mais ne peut pas modifier leur contenu

### Autorisations par rôle (résumé)
| Action | Admin | Organisation | Employé | Client |
|---|---|---|---|---|
| Gérer les organisations | ✓ | — | — | — |
| CRUD biens/annonces/immeubles | — | ✓ | Lecture | — |
| CRUD clients/prospects | — | ✓ | Lecture | — |
| CRUD contrats/quittances | — | ✓ | Lecture | — |
| CRUD factures | — | ✓ | — | — |
| Payer une facture en ligne | — | — | — | ✓ (via token) |
| CRUD employés | — | ✓ | — | — |
| CRUD visites/tâches | — | ✓ | ✓ | — |
| Voir les statistiques | — | ✓ | ✓ | — |
| Gérer son profil | ✓ | ✓ | ✓ | ✓ |

### Autres mesures
- Mots de passe hashés avec bcrypt
- Tokens Google chiffrés (AES) avec expiration 30 minutes
- Validation des types et tailles de fichiers uploadés
- Protection CSRF pour les sessions web
- Requêtes Eloquent (protection SQL injection)
- En-têtes CORS configurés

---

## 27. GESTION DES FICHIERS & MÉDIAS

### Upload
- Endpoint dédié par type d'entité (`/biens/{id}/images`, etc.)
- Validation du type MIME et de la taille côté backend
- Stockage dans `storage/app/public/{entite}/{id}/`
- URL publique via `storage/{chemin}`

### Accès
- Symlink `php artisan storage:link` → `public/storage`
- Les images sont servies directement par le serveur web
- Pas de CDN (stockage local uniquement dans cette version)

### PDF
- Généré côté serveur avec DomPDF
- Templates Blade (Laravel) dédiés par type (contrat, facture, quittance)
- Retourné en réponse HTTP avec `Content-Type: application/pdf`

---

## 28. ÉTAT GLOBAL FRONTEND

### Zustand — `authStore`
Persisté dans `localStorage` sous la clé `domtek-auth`.

| Propriété | Type | Description |
|---|---|---|
| `user` | object | Données de l'utilisateur connecté |
| `organisation` | object | Données de l'organisation active |
| `token` | string | Token Sanctum |
| `role` | string | Rôle de l'utilisateur |
| `isAuthenticated` | boolean | État de connexion |

Méthodes :
- `setAuth(user, organisation, token, role)` : connexion
- `clearAuth()` : déconnexion
- `updateOrganisation(org)` : mise à jour du profil org

### React Query — Hooks de données
Chaque module dispose d'un hook dédié qui gère le cache et les requêtes serveur :
- `useAgences()` — liste des agences
- `useAnnonces()` — annonces de l'organisation
- `useBiens()` — biens
- `useClients()` — clients
- `useContrats()` — contrats
- `useEmployes()` — employés
- `useFactures()` — factures
- `useOrganisations()` — organisations (admin)
- `usePublicAnnonces()` — annonces publiques
- `useQuittances()` — quittances

### Validation des formulaires
- `src/lib/validation.ts` : helpers réutilisables (`isValidEmail`, `validatePassword`, `isValidPhone`, `isPositiveAmount`, `isValidCin`, `isValidCinOrPasseport`, `isValidCityOrPlace`)
- Appliqués aux formulaires d'authentification et à la majorité des formulaires du dashboard organisation (biens, clients, contrats, employés, factures, prospects, locations, immeubles) avec affichage des erreurs inline avant soumission

### Client Axios
- Instance unique configurée avec `baseURL` de l'API backend
- Intercepteur request : injection automatique du token Bearer depuis le store Zustand
- Intercepteur response : si `401` → `clearAuth()` + redirection vers `/login`
- Exception pour la page `/auth/google/callback` (pas de redirection forcée)

---

*Fin du document — Version complète du projet Domtek*
