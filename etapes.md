# Domtek - Plan de Réalisation du Projet

## Vue d'ensemble

Application web immobilière avec :
- **Backend** : Laravel (PHP) — API REST
- **Frontend** : Next.js — Interface utilisateur
- **Base de données** : MySQL (`domtekdb`)

### Deux espaces :
- **Backoffice** (Admin) : gestion des agences, suivi des investissements, biens et annonces
- **Frontoffice** : espace organisation (agence) + espace client (simple utilisateur)

### Contrainte globale
Toutes les tables doivent contenir les colonnes : `created_by`, `created_at`, `updated_by`, `updated_at`

---

## PHASE 1 — Backend Laravel (API REST)

### Étape 1 — Initialisation du projet Laravel ✅ TERMINÉ
- [x] Projet Laravel créé
- [x] Fichier `.env` configuré (MySQL : `domtekdb`, host `127.0.0.1`, port `3306`)
- [x] Migration de base initiale exécutée (`users`, `cache`, `jobs`, `sessions`)
- [x] Serveur Laravel lancé et testé

---

### Étape 2 — Conception & Migrations de la base de données ✅ TERMINÉ
Créer les migrations pour toutes les tables métier (avec les 4 colonnes obligatoires).

#### Tables créées :

**Utilisateurs & Authentification**
- [x] Modifier la table `users` : ajouter `role` (admin / organisation / client), `is_active`, `created_by`, `updated_by`
- [x] Table `organisations` : nom, slug, statut (en_attente/active/inactive), logo, adresse, ville, téléphone, email, `user_id`, `created_by`, `updated_by`

**CRM**
- [x] Table `clients` : nom, prénom, email, téléphone, adresse, ville, cin, date_naissance, `organisation_id`, `user_id`, `created_by`, `updated_by`
- [x] Table `employes` : nom, prénom, email, téléphone, poste, date_embauche, statut, `organisation_id`, `user_id`, `created_by`, `updated_by`

**Biens immobiliers**
- [x] Table `biens` : titre, description, type_transaction (vente/loyer), type_bien, prix, superficie, adresse, ville, nb_pieces, nb_chambres, etage, statut, `organisation_id`, `created_by`, `updated_by`
- [x] Table `bien_images` : chemin, ordre, is_principale, `bien_id`, `created_by`, `updated_by`

**Annonces**
- [x] Table `annonces` : titre, description, date_publication (planifiée), statut (brouillon/planifiee/publiee/archivee), `bien_id`, `organisation_id`, `created_by`, `updated_by`

**Contrats**
- [x] Table `contrats` : type (vente/loyer), date_debut, date_fin, montant, statut, fichier, notes, `bien_id`, `client_id`, `organisation_id`, `created_by`, `updated_by`

**Factures**

- [x] Table `factures` : type (eau/electricite/gaz), montant, date_emission, date_echeance, statut, reference, notes, `client_id`, `contrat_id`, `organisation_id`, `created_by`, `updated_by`

**Investissements**
- [x] Table `taux_investissement` : taux, periode (mensuel/trimestriel/annuel), description, date_debut, date_fin, `organisation_id`, `created_by`, `updated_by`

---

### Étape 3 — Modèles Eloquent & Relations ✅ TERMINÉ
- [x] Trait `HasAuditColumns` : remplissage auto de `created_by` / `updated_by` via les events Eloquent
- [x] Model `User` : rôles (admin/organisation/client), helpers `isAdmin()`, `isOrganisation()`, `isClient()`, `HasApiTokens` (Sanctum)
- [x] Model `Organisation` : relations avec user, biens, annonces, contrats, factures, clients, employés, taux
- [x] Model `Client` : relations avec organisation, user, contrats, factures
- [x] Model `Employe` : relations avec organisation, user
- [x] Model `Bien` : relations avec organisation, images, imagePrincipale, annonces, contrats
- [x] Model `BienImage` : relation avec bien
- [x] Model `Annonce` : constantes de statut, relations avec bien et organisation
- [x] Model `Contrat` : relations avec bien, client, organisation, factures
- [x] Model `Facture` : constantes type/statut, relations avec client, contrat, organisation
- [x] Model `TauxInvestissement` : relation avec organisation
- [x] Laravel Sanctum installé (v4.3.1)

---

### Étape 4 — Authentification & Gestion des Rôles ✅ TERMINÉ
- [x] Laravel Sanctum configuré — migration `personal_access_tokens` exécutée
- [x] `AuthController` : `registerOrganisation`, `registerClient`, `login`, `logout`, `me`
- [x] Login retourne `{ token, user, role, organisation? }` — gestion des statuts en_attente/inactive
- [x] Middleware `CheckRole` : alias `role:admin`, `role:organisation`, `role:client`
- [x] Middleware enregistré dans `bootstrap/app.php`
- [x] `routes/api.php` structuré avec les 3 groupes (public, admin, organisation)
- [x] Workflow organisation : inscription → `en_attente` → activation par admin requise

---

### Étape 5 — Routes API ✅ TERMINÉ
- [x] 59 routes définies et actives dans `routes/api.php`
- [x] Groupe public : auth (register org/client, login) + annonces publiées + agences
- [x] Groupe `auth:sanctum` + `role:admin` : gestion organisations (CRUD + activer/désactiver + vues biens/annonces/investissements/comptes)
- [x] Groupe `auth:sanctum` + `role:organisation` : biens (+images), annonces (+publier/archiver), contrats (+PDF), factures (+payer), clients, employés, investissements

---

### Étape 6 — Contrôleurs & Logique Métier ✅ TERMINÉ

**Admin**
- [x] `Admin\OrganisationController` : liste (filtres+pagination), détail, activer, désactiver, supprimer, biens, annonces, investissements, comptes

**Organisation**
- [x] `Organisation\BienController` : CRUD + upload images + suppression image + scope organisation
- [x] `Organisation\AnnonceController` : CRUD + publier + archiver + scope organisation
- [x] `Organisation\ContratController` : CRUD + upload PDF + màj statut bien automatique
- [x] `Organisation\FactureController` : CRUD + marquerPayee + filtres type/statut
- [x] `Organisation\ClientController` : CRUD + recherche texte + scope organisation
- [x] `Organisation\EmployeController` : CRUD + filtres statut/recherche + scope organisation
- [x] `Organisation\InvestissementController` : CRUD + scope organisation

**Public (Client/Visiteur)**
- [x] `Public\AnnonceController` : liste annonces publiées (filtres ville/type/prix/search) + détail
- [x] `Public\OrganisationController` : liste agences actives + profil agence avec ses annonces

---

### Étape 7 — Policies & Autorisation ✅ TERMINÉ
- [x] `BienPolicy` : view, update, delete → vérifie `organisation_id` (auto-découverte Laravel)
- [x] `AnnoncePolicy` : view, update, delete
- [x] `ContratPolicy` : view, update, delete
- [x] `FacturePolicy` : view, update, delete
- [x] `ClientPolicy` : view, update, delete
- [x] `EmployePolicy` : view, update, delete
- [x] `TauxInvestissementPolicy` : view, update, delete
- [x] Controllers mis à jour pour utiliser `$this->authorize()` à la place de méthodes privées

---

### Étape 8 — Resources API (Transformers) ✅ TERMINÉ
- [x] `UserResource` : id, name, email, role, is_active
- [x] `OrganisationResource` : infos agence + counts (biens, annonces, clients)
- [x] `BienImageResource` : chemin + URL publique générée automatiquement
- [x] `BienResource` : toutes infos + imagePrincipale/images/organisation (whenLoaded)
- [x] `AnnonceResource` : infos + bien + organisation (whenLoaded)
- [x] `ContratResource` : infos + bien + client + factures (whenLoaded)
- [x] `FactureResource` : infos + client + contrat (whenLoaded)
- [x] `ClientResource` : infos + nom_complet calculé + contrats + factures
- [x] `EmployeResource` : infos + nom_complet calculé
- [x] `TauxInvestissementResource` : infos + dates formatées

---

### Étape 9 — Tâches Planifiées (Annonces) ✅ TERMINÉ
- [x] Commande `annonces:publier` : publie toutes les annonces `planifiee` dont `date_publication <= now()`
- [x] Scheduler enregistré dans `routes/console.php` : exécution toutes les minutes

---

### Étape 10 — Tests Backend
- [ ] Tests unitaires sur les modèles
- [ ] Tests feature sur les endpoints API (Postman ou PHPUnit)

---

## PHASE 2 — Frontend Next.js

### Étape 11 — Initialisation du projet Next.js ✅ TERMINÉ
- [x] Projet Next.js créé (`domtek-frontend`) avec TypeScript et Tailwind CSS
- [x] Dépendances installées : `axios`, `zustand`, `js-cookie`, `@types/js-cookie`
- [x] `.env.local` configuré (`NEXT_PUBLIC_API_URL=http://localhost:8000/api`)
- [x] `src/lib/api.ts` : instance Axios avec intercepteurs (Bearer token + redirect 401)
- [x] `src/types/index.ts` : interfaces TypeScript complètes (User, Organisation, Bien, Annonce, Contrat, Facture, Client, Employe, TauxInvestissement, PaginatedResponse, AuthResponse, ApiError)
- [x] `src/store/authStore.ts` : store Zustand persisté (user, role, organisation, token en cookie 7j)

---

### Étape 12 — Authentification Frontend ✅ TERMINÉ
- [x] Page de Login (`/login`) : gestion des rôles (admin→/admin, organisation→/dashboard, client→/)
- [x] Page d'inscription organisation (`/register/organisation`) : formulaire complet avec validation serveur
- [x] Gestion des tokens : cookie `domtek_token` (7 jours), Zustand store persisté
- [x] `src/middleware.ts` : guards de routes (routes publiques, redirection si déjà connecté, redirection si non connecté)
- [x] Page "compte en attente" (`/en-attente`) : affichée après inscription ou si statut=en_attente à la connexion

---

### Étape 13 — Backoffice (Admin) ✅ TERMINÉ

Layout admin avec sidebar de navigation :

- [x] **Layout admin** (`(admin)/layout.tsx`) : sidebar grise foncée, navigation active, user info, déconnexion
- [x] **Dashboard admin** (`/admin`) : 4 statistiques (total, actives, en attente, inactives)
- [x] **Gestion des organisations** (`/admin/organisations`) : liste paginée, filtres statut/recherche, actions activer/désactiver/supprimer
- [x] **Vue organisation** (`/admin/organisations/[slug]`) : layout avec onglets, infos détaillées, actions rapides
  - [x] `/admin/organisations/[slug]` — Infos + stats (biens, annonces, clients)
  - [x] `/admin/organisations/[slug]/comptes` — Utilisateurs liés
  - [x] `/admin/organisations/[slug]/biens` — Biens immobiliers
  - [x] `/admin/organisations/[slug]/annonces` — Annonces
  - [x] `/admin/organisations/[slug]/investissement` — Taux d'investissement

---

### Étape 14 — Frontoffice Organisation ✅ TERMINÉ

Layout organisation avec sidebar :

- [x] **Layout** (`(dashboard)/layout.tsx`) : sidebar blanche, 8 sections, user info, déconnexion
- [x] **Dashboard** (`/dashboard`) : 6 stat cards cliquables + actions rapides
- [x] **Biens** (`/dashboard/biens`) : liste filtrée + `/nouveau` + `/[id]` (édition + upload images)
- [x] **Annonces** (`/dashboard/annonces`) : liste + filtre statut + publier/archiver + `/nouvelle` + `/[id]`
- [x] **Contrats** (`/dashboard/contrats`) : liste filtres type/statut + `/nouveau` + `/[id]` (upload PDF)
- [x] **Factures** (`/dashboard/factures`) : liste + marquer payée + `/nouvelle` + `/[id]`
- [x] **CRM Clients** (`/dashboard/clients`) : liste + recherche + `/nouveau` + `/[id]` (fiche + historique)
- [x] **CRM Employés** (`/dashboard/employes`) : liste + filtres + `/nouveau` + `/[id]`
- [x] **Investissements** (`/dashboard/investissements`) : liste + `/nouveau` + `/[id]`

---

### Étape 15 — Frontoffice Client (Public) ✅ TERMINÉ

- [x] **Page d'accueil** (`/`) : hero + barre de recherche + 6 annonces récentes + CTA agence + footer
- [x] **Liste des annonces** (`/annonces`) : filtres (search, ville, type_transaction, type_bien, prix_min/max) + pagination
- [x] **Détail d'une annonce** (`/annonces/[id]`) : galerie photos, infos bien, contact agence (tel + email)
- [x] **Liste des agences** (`/agences`) : cards avec recherche + annonces_count
- [x] **Profil agence** (`/agences/[slug]`) : infos + annonces publiées avec "charger plus"
- [x] **Inscription client** (`/register/client`) : formulaire simple, connexion directe après inscription

---

### Étape 16 — Tests Frontend
- [ ] Tests des composants clés
- [ ] Tests end-to-end des parcours utilisateurs principaux

---

## PHASE 3 — Intégration & Déploiement

### Étape 17 — Intégration complète
- [ ] Connecter tous les écrans aux endpoints API
- [ ] Gestion des erreurs API (401, 403, 404, 422, 500)
- [ ] Gestion des uploads (images des biens)
- [ ] Optimisation des performances (pagination, lazy loading)

### Étape 18 — Déploiement
- [ ] Configuration serveur (Apache/Nginx)
- [ ] Variables d'environnement production
- [ ] HTTPS / certificat SSL
- [ ] Build Next.js production
- [ ] Mise en ligne et tests finaux

---

---

## PHASE 4 — Améliorations & Nouvelles Fonctionnalités

### A1 — Correction : Publication automatique des annonces planifiées ✅ TERMINÉ

**Problème** : Les annonces avec statut `planifiee` ne passaient pas automatiquement à `publiee` à la date prévue.

**Corrections effectuées :**
- [x] `app/Console/Commands/PublierAnnonces.php` : nettoyage du fichier dupliqué (`PublierAnnoncesCommand.php` supprimé), suppression du champ `updated_by: null`
- [x] `app/Http/Controllers/Api/Public/AnnonceController.php` : ajout de la logique d'auto-publication en tête de `index()` — évite le besoin d'un 2ème terminal pour le scheduler en développement

```php
Annonce::where('statut', Annonce::STATUT_PLANIFIEE)
    ->where('date_publication', '<=', now())
    ->update(['statut' => Annonce::STATUT_PUBLIEE]);
```

---

### A2 — Refonte : Formulaire de création de factures ✅ TERMINÉ

**Problème** : Le formulaire précédent ne supportait que les types `eau/electricite/gaz` et sélectionnait le bien sans tenir compte du type de contrat.

**Modifications backend :**
- [x] Migration `2026_03_11_000001_add_loyer_electricite_gaz_to_factures_type.php` : ajout de `electricite_gaz` et `loyer` à l'enum du champ `type`
- [x] `app/Models/Facture.php` : ajout des constantes `TYPE_ELECTRICITE_GAZ` et `TYPE_LOYER`
- [x] `app/Http/Requests/Org/StoreFactureRequest.php` : validation mise à jour — `'in:eau,electricite,gaz,electricite_gaz,loyer'`

**Modifications frontend :**
- [x] `domtek-frontend/src/app/(dashboard)/dashboard/factures/nouvelle/page.tsx` : refonte complète
  - Sélection du type de facture en premier
  - Filtrage des biens selon le type (loyer → contrats loyer uniquement, eau/electricite_gaz → tous contrats)
  - Dropdown client alimenté dynamiquement depuis les clients du contrat sélectionné

---

### A3 — SMS Twilio : Notification client à la création d'une facture ✅ TERMINÉ

**Fonctionnalité** : Envoi d'un vrai SMS au client concerné lors de la création d'une facture.

- [x] SDK Twilio installé (`twilio/sdk`)
- [x] `.env` : variables `TWILIO_SID`, `TWILIO_TOKEN`, `TWILIO_FROM` configurées
- [x] `app/Services/SmsService.php` : service d'envoi SMS via Twilio
- [x] `app/Services/FactureService.php` : appel `SmsService::send()` après création de la facture avec les détails (montant, type, échéance)

---

### A4 — Refonte : Formulaire client (6 sections) ✅ TERMINÉ

**Ajout de nombreux champs** sur le formulaire client, organisés en 6 sections distinctes.

**Modifications backend :**
- [x] Migration : ajout des nouveaux champs à la table `clients` (`civilite`, `lieu_naissance`, `type_piece`, `document_identite`, `urgence_nom`, `urgence_telephone`, `urgence_relation`, `notes`)
- [x] `app/Models/Client.php` : tous les nouveaux champs ajoutés à `$fillable`
- [x] `app/Http/Requests/Org/StoreClientRequest.php` : validation des nouveaux champs (dont upload fichier `document_identite`)
- [x] `app/Http/Requests/Org/UpdateClientRequest.php` : idem (sans re-upload obligatoire)
- [x] `app/Http/Controllers/Api/Organisation/ClientController.php` : route `POST /clients/{client}/document` pour remplacer le document d'identité
- [x] `app/Http/Resources/ClientResource.php` : exposition du champ `document_url`

**Modifications frontend :**
- [x] `domtek-frontend/src/types/index.ts` : interface `Client` enrichie (`civilite`, `lieu_naissance`, `type_piece`, `cin`, `document_url`, `urgence_*`, `notes`)
- [x] `domtek-frontend/src/app/(dashboard)/dashboard/clients/nouveau/page.tsx` : formulaire en 6 sections avec upload via `FormData`
  - **Identité** : civilité (M./Mme/Mlle), nom, prénom
  - **Contact** : téléphone, email, ville
  - **Naissance** : date de naissance, lieu de naissance
  - **Document d'identité** : type de pièce (CIN/Passeport), numéro, upload fichier
  - **Contact d'urgence** : nom, téléphone, relation
  - **Note** : champ texte libre
- [x] `domtek-frontend/src/app/(dashboard)/dashboard/clients/[id]/page.tsx` : mêmes 6 sections + lien "Voir le fichier" pour le document existant + upload de remplacement séparé

---

### A5 — Nouvelle section : Immeubles (CRUD complet) ✅ TERMINÉ

**Fonctionnalité** : Gestion des immeubles par l'agence avec photos.

**Migrations :**
- [x] `database/migrations/2026_03_24_000001_create_immeubles_table.php` : tables `immeubles` et `immeuble_photos` créées en une seule migration

**Backend :**
- [x] `app/Models/Immeuble.php` : casts booléens (`a_blocs`, `sous_sol`, `cameras_surveillance`), relation `HasMany photos` triées par `ordre`
- [x] `app/Models/ImmeublePhoto.php` : attribut calculé `url` via `asset('storage/' . $chemin)`
- [x] `app/Services/ImmeubleService.php` : `index()` (chargement 1ère photo), `store()`, `update()` (logique `a_blocs → nb_blocs=null`), `savePhotos()`, `deletePhoto()`
- [x] `app/Http/Controllers/Api/Organisation/ImmeubleController.php` : CRUD + `uploadPhotos()` + `deletePhoto()`
- [x] `app/Policies/ImmeublePolicy.php` : vérification `organisation_id`
- [x] `routes/api.php` : routes immeuble (`apiResource` + `uploadPhotos` + `deletePhoto`)

**Frontend :**
- [x] `domtek-frontend/src/types/index.ts` : interfaces `ImmeublePhoto` et `Immeuble` ajoutées
- [x] `domtek-frontend/src/app/(dashboard)/layout.tsx` : ajout item "Immeubles" dans la sidebar avec icône bâtiment
- [x] `domtek-frontend/src/app/(dashboard)/dashboard/immeubles/page.tsx` : liste en grille (card view) avec photo, badge usage, compteur photos, étages/blocs, badges équipements
- [x] `domtek-frontend/src/app/(dashboard)/dashboard/immeubles/nouveau/page.tsx` : formulaire complet (nom, blocs, étages, lieu, type propriété, photos drag-and-drop, sous-sol, caméras, usage résidentiel/professionnel/mixte)
- [x] `domtek-frontend/src/app/(dashboard)/dashboard/immeubles/[id]/page.tsx` : édition + gestion des photos (ajout/suppression)

**Correction :** Migration en attente détectée et exécutée (`php artisan migrate`). Contrôleur corrigé pour utiliser `$request->validated()`.

---

### A6 — Amélioration : Formulaire des biens — champ Bâtiment ✅ TERMINÉ

**Fonctionnalité** : Possibilité de rattacher un bien à un immeuble existant avec sélection du bloc et de l'étage.

**Modifications backend :**
- [x] Migration `2026_03_24_000002_add_immeuble_to_biens.php` : ajout `immeuble_id` (FK nullable) et `bloc` (smallint nullable) à la table `biens`
- [x] `app/Models/Bien.php` : `immeuble_id` et `bloc` ajoutés à `$fillable`, relation `BelongsTo immeuble()`
- [x] `app/Http/Resources/BienResource.php` : exposition de `immeuble_id`, `bloc`, `immeuble` (whenLoaded)

**Modifications frontend :**
- [x] `domtek-frontend/src/types/index.ts` : interface `Bien` enrichie (`immeuble_id`, `bloc`, `immeuble?`)
- [x] `domtek-frontend/src/app/(dashboard)/dashboard/biens/nouveau/page.tsx` : section "Bâtiment"
  - Toggle **Indépendant** / **Appartient à un immeuble**
  - Dropdown immeuble (liste des immeubles de l'agence)
  - Dropdown étage dynamique (RDC + 1..`nb_etages`)
  - Dropdown bloc dynamique (si `a_blocs`, 1..`nb_blocs`)
- [x] `domtek-frontend/src/app/(dashboard)/dashboard/biens/[id]/page.tsx` : idem avec pré-population depuis `immeuble_id` existant

---

### A7 — Affichage en grille (card view) : Biens & Immeubles ✅ TERMINÉ

**Fonctionnalité** : Remplacement des listes tabulaires par des grilles de cartes avec photos.

- [x] `domtek-frontend/src/app/(dashboard)/dashboard/biens/page.tsx` : grille responsive (1→2→3→4 colonnes), photo de couverture, badge transaction (Vente/Location), badge statut, prix formaté, superficie, pièces, étage, skeleton loader, pagination
- [x] `domtek-frontend/src/app/(dashboard)/dashboard/immeubles/page.tsx` : grille responsive, photo de couverture, badge usage (résidentiel/professionnel/mixte), compteur photos, étages, blocs, badges équipements (sous-sol, caméras)

---

### A8 — Correction : Photos non affichées ✅ TERMINÉ

**Problèmes identifiés et corrigés :**

#### Photos immeubles : symlink Windows cassé
- **Cause** : `php artisan storage:link` crée un vrai symlink nécessitant des droits admin sous Windows ; `public/storage` existait mais était vide.
- **Correction** : Utilisation de `mklink /J` (junction Windows, sans droits admin) via `exec()` PHP dans un contrôleur dédié.

#### APP_URL incorrect
- **Cause** : `APP_URL=http://localhost` (port 80) alors que `php artisan serve` tourne sur le port 8000 → les URL générées par `asset()` étaient incorrectes.
- **Correction** : `.env` → `APP_URL=http://localhost:8000`

#### Photos biens non affichées
- **Cause 1** : `BienService::uploadImages()` n'initialisait jamais `is_principale = true` (quand `imagePrincipaleIndex` était `null`). Correction : auto-marquage de la 1ère image si aucune principale n'existe.
- **Cause 2** : `BienResource` ne retombait pas sur `images->first()` si `imagePrincipale` n'était pas chargée.
- **Corrections :**
  - [x] `app/Services/BienService.php` : logique `uploadImages()` corrigée — 1ère image marquée principale si `hasPrincipale === false`
  - [x] `app/Http/Resources/BienResource.php` : `image_principale` avec fallback `$this->whenLoaded('imagePrincipale') ?? $this->images?->first()`
  - [x] `app/Services/BienService.php` `index()` : chargement des deux relations `imagePrincipale` et `images` (limitée à 1)
  - [x] Correction en base via Tinker : les 5 biens existants ont eu leur première image marquée `is_principale = true`

---

### A9 — Nouvelle fonctionnalité : Photos des annonces ✅ TERMINÉ

**Fonctionnalité** : Upload d'une ou plusieurs photos par annonce, affichage en card view.

**Migrations :**
- [x] `database/migrations/2026_03_25_000001_create_annonce_photos_table.php` : table `annonce_photos` (id, annonce_id FK cascade, chemin, ordre)

**Backend :**
- [x] `app/Models/AnnoncePhoto.php` : modèle avec `getUrlAttribute()`, relation `BelongsTo annonce`
- [x] `app/Models/Annonce.php` : relation `HasMany photos()` triée par `ordre`
- [x] `app/Services/AnnonceService.php` : `uploadPhotos()`, `deletePhoto()` (suppression stockage + BDD), `index()` charge la 1ère photo, `destroy()` supprime toutes les photos physiques
- [x] `app/Http/Controllers/Api/Organisation/AnnonceController.php` : `uploadPhotos()` et `deletePhoto()` endpoints, photos gérées dans `store()` après création, `show()` charge les photos
- [x] `app/Http/Resources/AnnoncePhotoResource.php` : resource (id, url, ordre)
- [x] `app/Http/Resources/AnnonceResource.php` : champ `photos` ajouté (whenLoaded)
- [x] `app/Http/Requests/Org/StoreAnnonceRequest.php` : validation `photos.*` (image, max 5 Mo) + `publiee` ajouté aux statuts autorisés
- [x] `routes/api.php` : 2 nouvelles routes — `POST /annonces/{annonce}/photos` et `DELETE /annonces/{annonce}/photos/{photo}`
- [x] `app/Http/Controllers/Api/Public/AnnonceController.php` : chargement des photos dans `index()` et `show()`

**Frontend :**
- [x] `domtek-frontend/src/types/index.ts` : interface `AnnoncePhoto` ajoutée, `Annonce` enrichie avec `photos?`
- [x] `domtek-frontend/src/app/(dashboard)/dashboard/annonces/page.tsx` : refonte en grille (card view)
  - Photo de couverture (annonce propre → fallback photo du bien)
  - Badge statut coloré
  - Compteur de photos
  - Boutons : Modifier, Publier, Archiver, Supprimer
  - Skeleton loader, pagination
- [x] `domtek-frontend/src/app/(dashboard)/dashboard/annonces/nouvelle/page.tsx` : ajout zone upload photos
  - Drag-and-drop + clic pour sélectionner
  - Prévisualisations avec bouton ×
  - Soumission via `FormData` (multipart)
- [x] `domtek-frontend/src/app/(dashboard)/dashboard/annonces/[id]/page.tsx` : gestion des photos dans l'édition
  - Affichage des photos existantes avec suppression au survol (bouton × rouge)
  - Zone d'upload pour nouvelles photos avec prévisualisation
  - Bouton "Ajouter N photo(s)" déclenche `POST /annonces/{id}/photos`

---

### A10 — Refonte complète du module Contrats ✅ TERMINÉ

**Fonctionnalité** : Contrats multi-types, champs financiers enrichis, aperçu temps réel, relation Many-to-Many clients.

**Migrations :**
- [x] `2026_03_25_000002_add_extra_fields_to_contrats.php` : ajout `designation`, `utilisation`, `tva`, `montant_ttc`, `frais_syndic`, `retenue_source`, `periodicite_paiement`, `jour_paiement`, `depot_garantie`, `premiere_echeance`, `assurance` — renommage `montant → montant_ht` — extension de l'enum `type` (bail_habitation, bail_etudiant, bail_professionnel, bail_commercial, bail_saisonnier, loyer, vente, autre)
- [x] `2026_03_25_000003_add_payment_token_to_factures.php` : ajout `payment_token` (UUID) et `stripe_session_id` à `factures`
- [x] `2026_03_30_000001_extend_contrats_table.php` : ajout `forme_juridique`, `representant`, `date_contrat`, `ville_signature`, `cin_delivree_le`
- [x] `2026_03_30_800000_create_clients_table_and_pivot.php` : table pivot `client_contrat` (Many-to-Many clients ↔ contrats)

**Backend :**
- [x] `app/Models/Contrat.php` : constante `TYPES_LOCATION`, relation `BelongsToMany clients()` via pivot
- [x] `app/Http/Resources/ContratResource.php` : exposition de `clients` (collection), `designation`, champs financiers HT/TVA/TTC
- [x] `app/Services/ContratService.php` : logique `store()` complète, màj statut bien automatique (disponible/loué/vendu)
- [x] `app/Http/Requests/Org/StoreContratRequest.php` : validation des nouveaux champs

**Frontend :**
- [x] `contrats/nouveau/page.tsx` : refonte complète — layout 2 colonnes (formulaire + aperçu temps réel), sections Partie A (organisation), Partie B (client), Bien, Durée, Conditions financières, Signature
- [x] Aperçu du contrat (`ContratPreview`) : génère un document textuel en temps réel au format juridique avec placeholders dynamiques
- [x] `contrats/page.tsx` : lignes dépliables avec actions (Modifier, PDF, Révision du loyer, Terminer, Supprimer), modales dédiées

---

### A11 — Extension du modèle Biens ✅ TERMINÉ

**Fonctionnalité** : Enrichissement du modèle `Bien` avec de nouveaux champs descriptifs, financiers et de localisation.

**Migrations :**
- [x] `2026_03_28_000001_extend_biens_table.php` :
  - Renommage `titre → designation`
  - Ajout : `num` (unité/lot), `type_location` (meublé/non meublé), `taxe_fonciere`, `regime_juridique` (mono/co-propriété), `superficie_commune`, `nb_cuisine`, `date_construction`, `pays`, `code_postal`, `accepte_animaux`, `accepte_fumeurs`, `options` (JSON), `notes`
  - Extension de l'enum `type_bien` : studio, duplex, local_commercial, entrepot, ferme, autre
  - Table `bien_documents` créée : nom, chemin, type_document par bien

**Backend :**
- [x] `app/Models/Bien.php` : tous les nouveaux champs dans `$fillable`, casts booléens, cast JSON pour `options`
- [x] `app/Http/Resources/BienResource.php` : exposition des nouveaux champs

---

### A12 — Module États des lieux (CRUD complet) ✅ TERMINÉ

**Fonctionnalité** : Gestion des états des lieux d'entrée et de sortie liés aux contrats.

**Migrations :**
- [x] `2026_03_30_200000_create_etat_lieux_table.php` : `designation`, `type` (entree/sortie), `date`, `releve_eau`, `releve_electricite`, `releve_gaz`, `remise_cles`, `commentaire`

**Backend :**
- [x] `app/Models/EtatLieu.php` : casts date, relation `BelongsTo contrat`
- [x] `app/Services/EtatLieuService.php` : index (filtres), store, update, destroy
- [x] `app/Http/Controllers/Api/Organisation/EtatLieuController.php` : CRUD complet
- [x] Routes `/org/etat-lieux` dans `routes/api.php`

**Frontend :**
- [x] `/dashboard/etat-lieux/page.tsx` : liste avec filtres type/contrat
- [x] `/dashboard/etat-lieux/nouveau/page.tsx` : formulaire (contrat, type, date, relevés, remise clés, commentaire)
- [x] `/dashboard/etat-lieux/[id]/page.tsx` : édition
- [x] Lien "États des lieux" ajouté dans la sidebar

---

### A13 — Module Visites planifiées ✅ TERMINÉ

**Fonctionnalité** : Planification et suivi des visites de biens pour les prospects.

**Migrations :**
- [x] `2026_03_30_300000_create_visites_table.php` : `client_id` (prospect), `bien_id`, `nom_agent`, `date_visite`, `statut` (planifiee/effectuee/annulee), `notes`

**Backend :**
- [x] `app/Models/Visite.php` : relations `BelongsTo client`, `bien`
- [x] `app/Services/VisiteService.php` : index, store, update, destroy
- [x] Routes `/org/visites` dans `routes/api.php`

**Frontend :**
- [x] Modale de planification de visite dans `/dashboard/prospects/[id]/page.tsx`

---

### A14 — Séparation Clients / Prospects — Refonte du CRM ✅ TERMINÉ

**Fonctionnalité** : Distinction claire entre prospects (contacts non-clients) et clients (ayant un contrat). Score d'opportunité automatique pour les prospects.

**Migrations :**
- [x] `2026_03_30_400000_add_prospect_fields_to_clients.php` : ajout `score_opportunite`, `budget_min`, `budget_max`, `type_bien_recherche`, `impression` à la future table prospects
- [x] `2026_03_30_500000_rename_clients_to_prospects.php` : renommage `clients → prospects`
- [x] `2026_03_30_600000_add_impression_to_prospects.php` : ajout/complétion du champ `impression`
- [x] `2026_03_30_800000_create_clients_table_and_pivot.php` : nouvelle table `clients` propre + pivot `client_contrat`
- [x] `2026_03_31_000001_add_audit_columns_to_clients.php` : ajout `created_by`, `updated_by` à la nouvelle table `clients`

**Backend :**
- [x] `app/Models/Prospect.php` : `scopeActif()` (`whereNull('client_id')`), relation `BelongsTo client`, calcul `score_opportunite`
- [x] `app/Models/Client.php` : nouvelle entité, `BelongsToMany contrats()` via pivot
- [x] `app/Services/ProspectService.php` : index (filtres + score), store, update, destroy — filtre `include_convertis`
- [x] `app/Http/Controllers/Api/Organisation/ProspectController.php` : CRUD complet
- [x] `app/Http/Resources/ProspectResource.php` : exposition des champs prospect + `converti`, `score_opportunite`
- [x] `app/Http/Requests/Org/StoreProspectRequest.php` / `UpdateProspectRequest.php` : validation complète

**Frontend :**
- [x] `domtek-frontend/src/types/index.ts` : interface `Prospect` distincte de `Client`
- [x] `/dashboard/prospects/page.tsx` : liste avec score d'opportunité coloré, badge "Converti"
- [x] `/dashboard/prospects/nouveau/page.tsx` : formulaire complet (identité, contact, document, budget, bien recherché, notes)
- [x] `/dashboard/prospects/[id]/page.tsx` : fiche prospect + modale visite + badge "Converti en client"

---

### A15 — Notification email à la création d'une facture ✅ TERMINÉ

**Fonctionnalité** : Envoi d'un email au client avec lien de paiement lors de la création d'une facture.

- [x] `app/Mail/FactureCreee.php` : Mailable avec les détails de la facture et le lien de paiement
- [x] `app/Services/FactureService.php` : `envoyerEmailFacture()` appelé après `Facture::create()` — génère une URL via `payment_token`
- [x] Lien de paiement : `{APP_URL}/api/pay/{payment_token}` (route publique)

---

### A16 — Conversion prospect → client lors de la création d'un contrat ✅ TERMINÉ

**Fonctionnalité** : La création d'un contrat peut créer automatiquement un client depuis un prospect existant ou inline. Le prospect reste visible avec le statut "Converti".

**Migrations :**
- [x] `2026_03_31_000002_add_client_id_to_prospects.php` : ajout `client_id` (FK nullable) sur `prospects`

**Backend :**
- [x] `app/Services/ContratService.php` : 3 modes dans `store()` via `DB::transaction`
  - **`client_ids`** : liaison à un ou plusieurs clients existants
  - **`prospect_id`** : création d'un `Client` depuis les données du `Prospect`, liaison FK `prospect.client_id`
  - **`nouveau_client`** : création d'un `Client` inline depuis les données du formulaire
- [x] `app/Http/Requests/Org/StoreContratRequest.php` : validation flexible selon le mode présent dans le payload

**Frontend :**
- [x] `/contrats/nouveau/page.tsx` : section "Partie B — Client" avec 3 onglets
  - **Client existant** : liste déroulante + aperçu des infos
  - **Convertir un prospect** : liste déroulante + message informatif + aperçu
  - **+ Nouveau client** : formulaire inline (civilité, nom, prénom, email, téléphone, CIN, etc.)

---

### A17 — Détection de chevauchement de location en temps réel ✅ TERMINÉ

**Fonctionnalité** : Empêcher la création d'un contrat de location sur un bien déjà loué pendant la même période.

**Backend :**
- [x] `app/Services/ContratService.php` : vérification d'overlap avant insertion — requête SQL avec logique `newDebut ≤ exFin AND exDebut ≤ newFin` (null → 9999-12-31)
- [x] Retourne une `ValidationException` avec message explicite en cas de conflit

**Frontend :**
- [x] `useEffect` charge les contrats actifs du bien sélectionné dès son changement
- [x] `useMemo conflitLocation` recalcule l'overlap côté client à chaque changement de dates
- [x] Bannière amber dynamique sous les champs de dates avec le nom du contrat conflictuel
- [x] Bouton "Créer le contrat" désactivé tant qu'un conflit est détecté

---

### A18 — Champs enrichis prospects : identité + source de connaissance ✅ TERMINÉ

**Fonctionnalité** : Ajout de champs d'identité et de traçabilité de la source pour les prospects.

**Migrations :**
- [x] `2026_04_01_000001_add_identity_and_source_to_prospects.php` : ajout `cin_delivree_le` (date), `cin_delivree_a` (string), `source_connaissance` (enum : facebook, instagram, amis_famille, publicite, site_web, google, agence_partenaire, autre), `source_connaissance_detail`

**Backend :**
- [x] `app/Models/Prospect.php` : nouveaux champs dans `$fillable`, cast date pour `cin_delivree_le`
- [x] `app/Http/Requests/Org/StoreProspectRequest.php` / `UpdateProspectRequest.php` : validation ajoutée
- [x] `app/Http/Resources/ProspectResource.php` : exposition des nouveaux champs

**Frontend :**
- [x] `/prospects/nouveau/page.tsx` :
  - Champs "Délivrée le" et "Délivrée à" dans la section "Document d'identité"
  - Champ "Profession" remplacé par une liste déroulante (14 métiers + "Autre à préciser")
  - Section "Comment nous avez-vous connus?" avec dropdown + champ détail conditionnel
- [x] `/prospects/[id]/page.tsx` : mêmes champs en mode édition

---

### A19 — Réorganisation de la sidebar en sections Général / CRM ✅ TERMINÉ

**Fonctionnalité** : Sidebar organisée en deux sections sémantiques pour une meilleure lisibilité.

- [x] `domtek-frontend/src/app/(dashboard)/layout.tsx` : structure `NAV_SECTIONS` avec titres de section
  - **Général** : Dashboard, Immeubles, Biens, Annonces, Contrats, Factures, États des lieux
  - **CRM** : Clients, Prospects, Employés, Investissements
  - Labels de section : `text-[10px] font-semibold uppercase tracking-widest text-gray-400`
- [x] `/dashboard/clients/page.tsx` : suppression du bouton "+ Nouveau client" (les clients sont créés uniquement via un contrat)

---

### A20 — Recherche dynamique dans les listes Annonces & Contrats ✅ TERMINÉ

**Fonctionnalité** : Barre de recherche avec debounce côté frontend, filtre côté backend.

**Backend :**
- [x] `app/Services/AnnonceService.php` : filtre `search` sur `titre`, `description`, `bien.designation` (via `whereHas`)
- [x] `app/Services/ContratService.php` : filtre `search` sur `designation`, `bien.designation`, `clients.nom`/`prenom` (via `whereHas`)
- [x] `AnnonceController::index()` et `ContratController::index()` : passage du paramètre `search`

**Frontend :**
- [x] `/annonces/page.tsx` : input de recherche avec icône loupe, debounce 350 ms, remet la pagination à 1
- [x] `/contrats/page.tsx` : idem, placeholder "Rechercher désignation, bien, client…"

---

### A21 — Période de facturation + filtre biens contrats de location ✅ TERMINÉ

**Fonctionnalité** : Préciser la période couverte par une facture et proposer uniquement les biens avec contrats de location actifs pour les factures de loyer.

**Migrations :**
- [x] `2026_04_01_000002_add_periode_to_factures.php` : ajout `periode_debut` et `periode_fin` (date nullable)

**Backend :**
- [x] `app/Models/Facture.php` : `periode_debut`, `periode_fin` dans `$fillable` et `$casts`
- [x] `app/Http/Requests/Org/StoreFactureRequest.php` : validation `nullable|date` + `after_or_equal:periode_debut`
- [x] `app/Http/Resources/FactureResource.php` : exposition des deux nouvelles dates

**Frontend :**
- [x] `/factures/nouvelle/page.tsx` : section "Période concernée" avec deux date-pickers (Du / Au)
- [x] Filtre biens pour type "loyer" : utilise `TYPES_LOCATION` (bail_habitation, bail_etudiant, bail_professionnel, bail_commercial, bail_saisonnier, loyer) — au lieu de `type === 'loyer'` uniquement

---

### A22 — Contrats : distinction Location / Vente dans le formulaire ✅ TERMINÉ

**Fonctionnalité** : Le formulaire de création de contrat s'adapte dynamiquement selon la nature du contrat (Location ou Vente).

**Frontend uniquement :**
- [x] Toggle "Location / Vente" en haut de la section "Type de contrat"
- [x] **Mode Location** : sélecteur "Type" limité aux types de bail (bail_habitation, étudiant, professionnel, commercial, saisonnier, loyer), champ "Utilisation" (résidence primaire/secondaire, usage professionnel/commercial), tous les champs financiers visibles
- [x] **Mode Vente** : Type et Utilisation masqués, Frais de syndic masqué, Périodicité et Jour de paiement masqués, 1ère échéance masquée, Date de fin masquée (vente à vie), "Dépôt de garantie" renommé en **"Acompte"**
- [x] Aperçu du contrat (`ContratPreview`) adapté au mode : label Acompte/Dépôt de garantie, Art. 2 sans date de fin pour une vente
- [x] Payload soumis : les champs location-only ne sont pas envoyés pour un contrat de vente

---

### A23 — Correction : filtre bien_id sur les contrats ✅ TERMINÉ

**Problème** : La détection de chevauchement de location affichait un faux avertissement "Période indisponible" pour n'importe quel bien, même sans conflit réel. Le paramètre `bien_id` envoyé par le frontend était ignoré par le backend, qui retournait **tous** les contrats de l'organisation.

**Corrections :**
- [x] `app/Services/ContratService.php` : ajout du filtre `bien_id` dans `index()` — `$query->where('bien_id', $filters['bien_id'])`
- [x] `app/Http/Controllers/Api/Organisation/ContratController.php` : ajout de `bien_id` dans `$request->only([...])`
- Le frontend récupère désormais uniquement les contrats du bien sélectionné, éliminant les faux conflits inter-biens

---

### A24 — Auto-remplissage du champ "CIN délivrée le" dans la création de contrat ✅ TERMINÉ

**Fonctionnalité** : Quand un client ou un prospect est sélectionné dans le formulaire de contrat, le champ "CIN délivrée le" se remplit automatiquement depuis ses coordonnées, comme le font déjà les champs email, téléphone, CIN et ville.

**Migrations :**
- [x] `2026_04_06_000001_add_cin_delivree_le_to_clients.php` : ajout de la colonne `cin_delivree_le` (date nullable) à la table `clients` — à exécuter via `php artisan migrate`

**Backend :**
- [x] `app/Models/Client.php` : `cin_delivree_le` ajouté à `$fillable`, casté en `date`
- [x] `app/Http/Resources/ClientResource.php` : exposition de `cin_delivree_le` formatée `Y-m-d`
- [x] `app/Services/ContratService.php` : lors de la conversion prospect → client, `cin_delivree_le` est copié du prospect vers le nouveau client

**Frontend :**
- [x] `contrats/nouveau/page.tsx` — onglet **"Client existant"** : le `onChange` du select cherche le client dans la liste locale et injecte `cin_delivree_le` dans `form.cin_delivree_le`
- [x] `contrats/nouveau/page.tsx` — onglet **"Convertir un prospect"** : idem depuis `prospect.cin_delivree_le`
- Le champ reste modifiable manuellement si la valeur doit être corrigée

---

### A25 — Refonte du module Investissements en tableau de bord analytique ✅ TERMINÉ

**Fonctionnalité** : Remplacement de la liste statique des taux d'investissement par deux courbes interactives en temps réel montrant l'évolution sur les 12 derniers mois.

**Backend :**
- [x] `app/Http/Controllers/Api/Organisation/StatistiqueController.php` : nouveau contrôleur avec 2 méthodes
  - `biens()` : pour chacun des 12 derniers mois → `total` (biens créés jusqu'à ce mois), `occupes` (biens avec au moins un contrat actif dont `date_debut ≤ fin du mois`), `taux` (%)
  - `prospects()` : pour chacun des 12 derniers mois → `total` (prospects cumulés), `convertis` (prospects avec `client_id` non null et client créé avant la fin du mois), `taux` (%)
- [x] `routes/api.php` : 2 nouvelles routes dans le groupe organisation
  - `GET /org/statistiques/biens`
  - `GET /org/statistiques/prospects`

**Frontend :**
- [x] `dashboard/investissements/page.tsx` : page entièrement remplacée
  - **Composant `LineChart<T>`** générique : graphe SVG pur (sans dépendance externe) — zone remplie en dégradé, ligne lissée, points interactifs, tooltip au survol affichant le détail (ex : "3/10 biens · Avril 2026")
  - **Section 1 — Occupation des biens** : 3 stat cards (total biens, biens occupés, taux actuel) + courbe bleue
  - **Section 2 — Conversion Prospects → Clients** : 3 stat cards + courbe verte
  - **Actualisation automatique** toutes les 30 secondes avec `setInterval` + bouton "Actualiser" manuel + horodatage de la dernière mise à jour
- [x] `(dashboard)/layout.tsx` : label sidebar "Investissements" → **"Statistiques"**

---

### A26 — Validation frontend centralisée (formulaires) ✅ TERMINÉ

**Fonctionnalité** : Bibliothèque de helpers de validation réutilisables appliquée aux principaux formulaires (auth + dashboard organisation).

- [x] `domtek-frontend/src/lib/validation.ts` créé :
  - `isValidEmail()` — format email standard
  - `validatePassword()` — ≥8 caractères, 1 majuscule, 1 chiffre, 1 caractère spécial (retourne le message d'erreur ou `null`)
  - `isValidPhone()` — format tunisien `(+216)?[2-9]XXXXXXX`
  - `isPositiveAmount()` — nombre strictement positif
  - `isValidCin()` — 8 chiffres
  - `isValidCinOrPasseport()` — chiffres uniquement (CIN ou passeport)
  - `isValidCityOrPlace()` — lettres/accents, espaces, apostrophes, tirets

**Pages mises à jour (validation au submit, messages d'erreur inline) :**
- Auth : `login`, `register/organisation`, `register/employe`, `register/client`, `forgot-password`, `reset-password`, `admin/compte`
- Dashboard organisation : `biens/nouveau`, `biens/[id]/modifier`, `immeubles/nouveau`, `clients/nouveau`, `clients/[id]`, `contrats/nouveau`, `contrats/[id]`, `contrats` (liste), `employes/nouveau`, `employes/[id]`, `factures/nouvelle`, `factures/[id]`, `locations/[id]`, `prospects/nouveau`, `prospects/[id]`, `compte`

---

## Récapitulatif de l'avancement

| Phase | Étape | Statut |
|-------|-------|--------|
| Backend | 1 — Initialisation Laravel | ✅ Terminé |
| Backend | 2 — Migrations BDD | ✅ Terminé |
| Backend | 3 — Modèles & Relations | ✅ Terminé |
| Backend | 4 — Authentification & Rôles | ✅ Terminé |
| Backend | 5 — Routes API | ✅ Terminé |
| Backend | 6 — Contrôleurs | ✅ Terminé |
| Backend | 7 — Policies | ✅ Terminé |
| Backend | 8 — API Resources | ✅ Terminé |
| Backend | 9 — Tâches planifiées | ✅ Terminé |
| Backend | 10 — Tests backend | ⬜ À faire |
| Frontend | 11 — Init Next.js | ✅ Terminé |
| Frontend | 12 — Auth Frontend | ✅ Terminé |
| Frontend | 13 — Backoffice Admin | ✅ Terminé |
| Frontend | 14 — Frontoffice Organisation | ✅ Terminé |
| Frontend | 15 — Frontoffice Client | ✅ Terminé |
| Frontend | 16 — Tests Frontend | ⬜ À faire |
| Améliorations | A1 — Auto-publication annonces | ✅ Terminé |
| Améliorations | A2 — Refonte factures (types + flux) | ✅ Terminé |
| Améliorations | A3 — SMS Twilio à la création facture | ✅ Terminé |
| Améliorations | A4 — Formulaire client 6 sections | ✅ Terminé |
| Améliorations | A5 — Module Immeubles (CRUD + photos) | ✅ Terminé |
| Améliorations | A6 — Biens : champ Bâtiment (immeuble/bloc/étage) | ✅ Terminé |
| Améliorations | A7 — Card view : Biens & Immeubles | ✅ Terminé |
| Améliorations | A8 — Correction affichage photos | ✅ Terminé |
| Améliorations | A9 — Photos des annonces + card view | ✅ Terminé |
| Améliorations | A10 — Refonte module Contrats (Many-to-Many + aperçu) | ✅ Terminé |
| Améliorations | A11 — Extension modèle Biens (champs enrichis) | ✅ Terminé |
| Améliorations | A12 — Module États des lieux (CRUD) | ✅ Terminé |
| Améliorations | A13 — Module Visites planifiées | ✅ Terminé |
| Améliorations | A14 — Séparation Clients/Prospects (refonte CRM) | ✅ Terminé |
| Améliorations | A15 — Email notification création facture | ✅ Terminé |
| Améliorations | A16 — Conversion prospect → client via contrat | ✅ Terminé |
| Améliorations | A17 — Détection chevauchement location temps réel | ✅ Terminé |
| Améliorations | A18 — Champs prospects : identité + source connaissance | ✅ Terminé |
| Améliorations | A19 — Sidebar Général/CRM + suppression bouton client | ✅ Terminé |
| Améliorations | A20 — Recherche dynamique Annonces & Contrats | ✅ Terminé |
| Améliorations | A21 — Période facturation + filtre biens location | ✅ Terminé |
| Améliorations | A22 — Contrats : toggle Location / Vente | ✅ Terminé |
| Améliorations | A23 — Correction filtre bien_id (faux conflits de période) | ✅ Terminé |
| Améliorations | A24 — Auto-remplissage CIN délivrée le (contrats/nouveau) | ✅ Terminé |
| Améliorations | A25 — Tableau de bord analytique (courbes occupation + conversion) | ✅ Terminé |
| Améliorations | A26 — Validation frontend centralisée (lib/validation.ts) | ✅ Terminé |
| Intégration | 17 — Intégration complète | ⬜ À faire |
| Déploiement | 18 — Déploiement | ⬜ À faire |
