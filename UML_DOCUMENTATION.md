# Documentation UML — Application SILA (Domtek)
**Application de gestion immobilière multi-rôles**
Stack : Laravel (Backend) + Next.js (Frontend)

---

## 1. ACTEURS DU SYSTÈME

| Acteur | Description |
|--------|-------------|
| **Administrateur** | Gère la plateforme globale : valide/désactive les organisations |
| **Organisation** | Agence immobilière : gère tous les biens, contrats, clients, employés |
| **Employé** | Agent de l'organisation : accès lecture + gestion visites/tâches |
| **Client** | Locataire/acheteur : consulte ses contrats, états des lieux, factures et quittances dans son espace, et règle ses factures en ligne. Son compte est créé par l'agence, jamais par lui-même |
| **Visiteur (Public)** | Parcourt les annonces publiques sans authentification |

---

## 2. DIAGRAMME DE CAS D'UTILISATION

### 2.1 Cas d'utilisation — Authentification

**Acteurs :** Tous les utilisateurs, Visiteur

| ID | Cas d'utilisation | Acteurs | Description |
|----|-------------------|---------|-------------|
| UC01 | S'inscrire (Organisation) | Organisation | Formulaire + création compte en attente d'approbation |
| UC02 | S'inscrire (Employé) | Employé | Formulaire lié à une organisation |
| UC03 | S'inscrire (Client) | Client | Auto-inscription |
| UC04 | S'inscrire avec Google | Organisation, Client | OAuth Google → préremplit le formulaire |
| UC05 | Se connecter | Admin, Organisation, Employé, Client | Email/mot de passe → token Sanctum |
| UC06 | Se connecter avec Google | Organisation, Client | OAuth direct → redirection dashboard |
| UC07 | Réinitialiser le mot de passe | Tous | Email → lien → nouveau mot de passe |
| UC08 | Se déconnecter | Tous | Suppression token |
| UC09 | Consulter profil | Tous | Voir/modifier ses informations personnelles |
| UC09b | Activer son espace client | Client | Lien reçu par email → le client choisit lui-même son mot de passe |

**Relations :**
- UC04 `<<extend>>` UC01 (Google étend l'inscription organisation)
- UC06 `<<extend>>` UC05 (Google étend la connexion)
- UC02 `<<include>>` UC09 (employé doit attendre activation)
- UC09b `<<include>>` UC42b (l'activation suppose un compte provisionné par l'agence)

**Note — UC03 vs UC09b.** Deux chemins distincts mènent à un compte de rôle `client` :
- **UC03** : auto-inscription d'un visiteur. Le compte existe mais n'est rattaché à aucune fiche client ; son espace reste vide jusqu'à ce qu'une agence le référence.
- **UC09b** : l'agence crée la fiche client, le compte est provisionné automatiquement avec un secret aléatoire que personne ne connaît, et le client reçoit un lien d'activation à usage unique (valable 7 jours) pour choisir son mot de passe.

Si l'adresse saisie par l'agence correspond à un compte déjà existant (cas UC03, ou client d'une autre agence), la fiche est simplement rattachée à ce compte : son mot de passe reste le sien, et il reçoit un avis de rattachement au lieu d'une invitation.

---

### 2.2 Cas d'utilisation — Administration

**Acteur :** Administrateur

| ID | Cas d'utilisation | Description |
|----|-------------------|-------------|
| UC10 | Lister les organisations | Voir toutes les organisations avec statut |
| UC11 | Activer une organisation | Approuver l'inscription d'une organisation |
| UC12 | Désactiver une organisation | Suspendre l'accès d'une organisation |
| UC13 | Supprimer une organisation | Suppression définitive |
| UC14 | Voir les biens d'une organisation | Supervision des propriétés |
| UC15 | Voir les annonces d'une organisation | Supervision des annonces |
| UC16 | Voir les investissements d'une organisation | Supervision financière |
| UC17 | Voir les comptes d'une organisation | Supervision des utilisateurs |

---

### 2.3 Cas d'utilisation — Gestion des biens

**Acteurs :** Organisation (CRUD), Employé (lecture)

| ID | Cas d'utilisation | Acteurs | Description |
|----|-------------------|---------|-------------|
| UC18 | Lister les biens | Organisation, Employé | Voir tous les biens de l'organisation |
| UC19 | Créer un bien | Organisation | Formulaire avec détails (type, prix, superficie…) |
| UC20 | Modifier un bien | Organisation | Édition des informations |
| UC21 | Supprimer un bien | Organisation | Suppression |
| UC22 | Ajouter des images | Organisation | Upload de photos (multiple) |
| UC23 | Ajouter des documents | Organisation | Upload de documents (actes, rapports) |
| UC24 | Associer à un immeuble | Organisation | Lier un bien à un bâtiment |

**Relations :**
- UC22 `<<include>>` UC19 (images font partie de la création)
- UC24 `<<extend>>` UC19 (optionnel : rattacher à un immeuble)

---

### 2.4 Cas d'utilisation — Gestion des annonces

**Acteurs :** Organisation (CRUD), Employé (lecture), Visiteur (consultation publique)

| ID | Cas d'utilisation | Acteurs | Description |
|----|-------------------|---------|-------------|
| UC25 | Créer une annonce | Organisation | Lier un bien à une annonce |
| UC26 | Modifier une annonce | Organisation | Édition titre, description, photos |
| UC27 | Publier une annonce | Organisation | Changer statut → publiée |
| UC28 | Archiver une annonce | Organisation | Retirer de la vue publique |
| UC29 | Supprimer une annonce | Organisation | Suppression |
| UC30 | Consulter les annonces publiques | Visiteur, Client | Sans authentification |

**Cycle de vie annonce :** `brouillon → planifiée → publiée → archivée`

---

### 2.5 Cas d'utilisation — Contrats

**Acteurs :** Organisation (CRUD), Employé (lecture)

| ID | Cas d'utilisation | Acteurs | Description |
|----|-------------------|---------|-------------|
| UC31 | Créer un contrat | Organisation | Lier un bien + un/plusieurs clients |
| UC32 | Modifier un contrat | Organisation | Mise à jour des informations |
| UC33 | Supprimer un contrat | Organisation | Suppression |
| UC34 | Télécharger le contrat PDF | Organisation, Employé | Génération PDF du contrat |
| UC35 | Ajouter un fichier contrat | Organisation | Upload fichier signé |

---

### 2.6 Cas d'utilisation — Facturation

**Acteurs :** Organisation (CRUD), Employé (lecture), Client (paiement)

| ID | Cas d'utilisation | Acteurs | Description |
|----|-------------------|---------|-------------|
| UC36 | Créer une facture | Organisation | Générer une facture (loyer, eau, électricité, gaz) |
| UC37 | Modifier une facture | Organisation | Mise à jour |
| UC38 | Supprimer une facture | Organisation | Suppression |
| UC39 | Marquer payée | Organisation | Changer statut → payée |
| UC40 | Télécharger la facture PDF | Organisation, Employé | Génération PDF |
| UC41 | Payer une facture en ligne | Client | Via lien tokenisé → Stripe |

**Cycle de vie facture :** `en_attente → payée / en_retard`

---

### 2.7 Cas d'utilisation — CRM (Clients & Prospects)

**Acteurs :** Organisation (CRUD), Employé (lecture + création visite)

| ID | Cas d'utilisation | Acteurs | Description |
|----|-------------------|---------|-------------|
| UC42 | Créer un client | Organisation | Enregistrement d'un nouveau client. L'e-mail est obligatoire et unique au sein de l'agence : il sert d'identifiant de connexion |
| UC42b | Provisionner le compte d'un client | — (automatique) | Déclenché par la création de la fiche : compte créé avec un secret aléatoire, lien d'activation envoyé |
| UC42c | Renvoyer l'accès à un client | Organisation | E-mail perdu, tombé dans les spams ou lien expiré → nouveau lien, l'ancien devient caduc |
| UC43 | Modifier un client | Organisation | Mise à jour informations |
| UC44 | Supprimer un client | Organisation | Suppression |
| UC45 | Créer un prospect | Organisation | Avec score de solvabilité |
| UC46 | Évaluer un prospect | Organisation | Score opportunité, solvabilité, revenus |
| UC47 | Convertir prospect en client | Organisation | Liaison prospect → client |
| UC48 | Planifier une visite | Organisation, Employé | Assigner prospect + bien + employé |
| UC49 | Enregistrer le résultat d'une visite | Employé, Organisation | Impression client, statut visite |

**Relations :**
- UC47 `<<include>>` UC46 (évaluation avant conversion)
- UC48 `<<include>>` UC45 (visite liée au prospect)
- UC42 `<<include>>` UC42b (toute création de fiche provisionne un compte)
- UC47 `<<include>>` UC42b (la conversion d'un prospect crée une fiche, donc un compte)

**Note — les trois origines d'une fiche client.** Une fiche naît à trois endroits : création directe (UC42), conversion d'un prospect (UC47), et saisie en ligne lors de la création d'un contrat. Le provisionnement passe donc par un observateur Eloquent sur l'entité `Client` plutôt que par un appel dans chaque service, afin qu'aucun chemin n'y échappe. L'envoi est différé après validation de la transaction : un contrat annulé en cours de transaction ne doit pas avoir déjà déclenché d'e-mail.

Conséquence sur UC47 : la conversion d'un prospect exige désormais que celui-ci ait une adresse e-mail, sans quoi le client résultant resterait sans accès, silencieusement.

---

### 2.8 Cas d'utilisation — Gestion des employés

**Acteur :** Organisation

| ID | Cas d'utilisation | Description |
|----|-------------------|-------------|
| UC50 | Lister les employés | Voir tous les employés de l'org |
| UC51 | Voir les employés en attente | Liste des inscriptions à valider |
| UC52 | Activer un compte employé | Approuver l'inscription |
| UC53 | Modifier un employé | Mise à jour informations |
| UC54 | Supprimer un employé | Suppression |

---

### 2.9 Autres cas d'utilisation

| ID | Cas d'utilisation | Acteurs | Description |
|----|-------------------|---------|-------------|
| UC55 | Gérer les immeubles | Organisation | CRUD immeubles + photos |
| UC56 | Créer un état des lieux | Organisation, Employé | Rapport entrée/sortie + relevés compteurs |
| UC57 | Gérer les tâches | Organisation, Employé | To-do list d'équipe |
| UC58 | Configurer les taux d'investissement | Organisation | ROI, périodes |
| UC59 | Consulter les statistiques | Organisation, Employé | Biens, prospects, visites, canaux |
| UC60 | Recevoir des notifications | Organisation, Employé | Alertes système |

---

### 2.10 Cas d'utilisation — Espace client

**Acteur :** Client (lecture seule)

| ID | Cas d'utilisation | Description |
|----|-------------------|-------------|
| UC61 | Consulter l'accueil de son espace | Contrats actifs, factures à régler, montant dû, agences de rattachement |
| UC62 | Consulter ses contrats | Liste et détail : bien, durée, conditions financières, coordonnées de l'agence |
| UC63 | Télécharger son contrat en PDF | Même document que celui généré côté agence |
| UC64 | Consulter ses états des lieux | Relevés eau/électricité/gaz, remise des clés, commentaire — entrée et sortie |
| UC65 | Consulter ses factures | Liste filtrable (toutes / à régler / payées), période concernée |
| UC66 | Régler une facture en ligne | Lien de paiement Stripe, identique à celui reçu par e-mail |
| UC67 | Consulter ses quittances de loyer | Échéances période par période, reste à payer |

**Périmètre.** Le client n'écrit rien : toute modification reste du ressort de son agence. Chaque requête est bornée aux fiches clients rattachées à son compte ; un contrat ou une facture qui ne lui appartient pas renvoie 404, jamais les données.

**Multi-agences.** L'unicité de l'e-mail étant scopée par agence, une personne cliente de plusieurs organisations possède plusieurs fiches pour un seul compte. Son espace agrège alors ses contrats et factures, toutes agences confondues.

---

## 3. DIAGRAMME DE CLASSES

### 3.1 Entités principales

#### Classe `User`
```
- id : int
- name : string
- email : string
- password : string (hashed)
- role : enum {admin, organisation, employe, client}
- is_active : boolean
- google_id : string [nullable]
- avatar : string [nullable]
- email_verified_at : datetime [nullable]
- remember_token : string [nullable]
- created_at : datetime
- updated_at : datetime

+ isAdmin() : boolean
+ isOrganisation() : boolean
+ isEmploye() : boolean
+ isClient() : boolean
+ resolveOrgId() : int
+ clientProfiles() : Client[0..*]   // hasMany — une fiche par agence
```

> `clientProfiles()` est un `hasMany` et non un `hasOne` : l'unicité de l'e-mail
> étant scopée par agence, une même personne peut détenir plusieurs fiches
> clients rattachées à un seul compte de connexion.

#### Classe `Organisation`
```
- id : int
- user_id : int (FK → User)
- nom : string
- slug : string [unique]
- statut : enum {en_attente, active, inactive}
- logo : string [nullable]
- adresse : string [nullable]
- ville : string [nullable]
- telephone : string [nullable]
- email : string [nullable]
- site_web : string [nullable]
- description : text [nullable]
- created_at : datetime
- updated_at : datetime
```

#### Classe `Employe`
```
- id : int
- organisation_id : int (FK → Organisation)
- user_id : int (FK → User)
- nom : string
- prenom : string
- email : string
- poste : string
- date_embauche : date [nullable]
- cin : string [nullable]
- telephone : string [nullable]
- created_at : datetime
- updated_at : datetime
```

#### Classe `Client`
```
- id : int
- organisation_id : int (FK → Organisation)
- user_id : int [nullable] (FK → User, ON DELETE SET NULL)
- civilite : enum {M, Mme, Mlle}
- nom : string
- prenom : string
- email : string                    // obligatoire — identifiant de connexion
- telephone : string [nullable]
- cin : string [nullable]
- date_naissance : date [nullable]
- adresse : string [nullable]
- created_at : datetime
- updated_at : datetime

  UNIQUE (organisation_id, email)   // unicité par agence, non globale

+ nom_complet : string (calculé)
+ user() : User[0..1]
+ acces_statut : enum {aucun, invite, actif} (calculé, exposé par l'API)
```

> **`user_id` nullable** : une fiche peut exister sans compte — fiche historique
> antérieure à l'obligation d'e-mail. `ON DELETE SET NULL` garantit que
> supprimer un compte ne supprime pas la fiche client ni son historique.
>
> **`acces_statut`** renseigne l'agence sur l'état de l'accès sans jamais
> exposer de mot de passe : `aucun` (pas de compte), `invite` (compte créé,
> invitation envoyée, pas encore activée), `actif` (le client a choisi son
> mot de passe).

#### Classe `Bien`
```
- id : int
- organisation_id : int (FK → Organisation)
- immeuble_id : int [nullable] (FK → Immeuble)
- designation : string
- type_bien : enum {appartement, villa, bureau, local, terrain, autre}
- type_transaction : enum {location, vente}
- statut : enum {disponible, loue, vendu, indisponible}
- prix : decimal
- superficie : decimal [nullable]
- adresse : string [nullable]
- ville : string [nullable]
- etage : int [nullable]
- nb_pieces : int [nullable]
- description : text [nullable]
- created_at : datetime
- updated_at : datetime
```

#### Classe `Immeuble`
```
- id : int
- organisation_id : int (FK → Organisation)
- nom : string
- type_usage : string [nullable]
- a_blocs : boolean
- nb_etages : int [nullable]
- adresse : string [nullable]
- ville : string [nullable]
- description : text [nullable]
- created_at : datetime
- updated_at : datetime
```

#### Classe `Annonce`
```
- id : int
- organisation_id : int (FK → Organisation)
- bien_id : int (FK → Bien)
- titre : string
- description : text [nullable]
- date_publication : datetime [nullable]
- statut : enum {brouillon, planifiee, publiee, archivee}
- created_at : datetime
- updated_at : datetime
```

#### Classe `Contrat`
```
- id : int
- organisation_id : int (FK → Organisation)
- bien_id : int (FK → Bien)
- designation : string
- type : enum {bail_habitation, bail_etudiant, bail_professionnel, loyer, vente}
- date_debut : date
- date_fin : date [nullable]
- montant_ttc : decimal
- periodicite_paiement : enum {mensuel, trimestriel, annuel, ponctuel}
- fichier : string [nullable]
- created_at : datetime
- updated_at : datetime
```

#### Classe `Facture`
```
- id : int
- organisation_id : int (FK → Organisation)
- client_id : int (FK → Client)
- contrat_id : int [nullable] (FK → Contrat)
- type : enum {loyer, eau, electricite, gaz, autre}
- montant : decimal
- date_emission : date
- date_echeance : date
- statut : enum {en_attente, payee, en_retard}
- stripe_token : string [nullable]
- created_at : datetime
- updated_at : datetime
```

#### Classe `Prospect`
```
- id : int
- organisation_id : int (FK → Organisation)
- client_id : int [nullable] (FK → Client)
- user_id : int [nullable] (FK → User)
- civilite : string [nullable]
- nom : string
- prenom : string [nullable]
- email : string [nullable]
- telephone : string [nullable]
- score_solvabilite : decimal [0-40]
- score_opportunite : decimal [total calculé]
- impression_premiere_visite : enum [nullable]
- revenus_client : decimal [nullable]
- created_at : datetime
- updated_at : datetime
```

#### Classe `Visite`
```
- id : int
- organisation_id : int (FK → Organisation)
- prospect_id : int (FK → Prospect)
- bien_id : int (FK → Bien)
- employe_id : int [nullable] (FK → Employe)
- date_visite : datetime
- statut : enum {planifiee, realisee, annulee}
- impression_client : enum [nullable]
- notes : text [nullable]
- created_at : datetime
- updated_at : datetime
```

#### Classe `EtatLieu`
```
- id : int
- organisation_id : int (FK → Organisation)
- contrat_id : int (FK → Contrat)
- designation : string
- type : enum {entree, sortie}
- date : date
- releve_eau : decimal [nullable]
- releve_electricite : decimal [nullable]
- releve_gaz : decimal [nullable]
- remise_cles : boolean
- observations : text [nullable]
- created_at : datetime
- updated_at : datetime
```

#### Classe `TauxInvestissement`
```
- id : int
- organisation_id : int (FK → Organisation)
- taux : decimal
- periode : string
- date_debut : date
- date_fin : date [nullable]
- created_at : datetime
- updated_at : datetime
```

#### Classe `Tache`
```
- id : int
- organisation_id : int (FK → Organisation)
- titre : string
- description : text [nullable]
- date_echeance : date [nullable]
- statut : enum {a_faire, en_cours, terminee}
- priorite : enum {basse, normale, haute}
- created_at : datetime
- updated_at : datetime
```

#### Classe `BienImage`
```
- id : int
- bien_id : int (FK → Bien)
- chemin : string
- ordre : int
- is_principale : boolean
```

#### Classe `BienDocument`
```
- id : int
- bien_id : int (FK → Bien)
- nom : string
- chemin : string
- type_document : string
```

#### Classe `AnnoncePhoto`
```
- id : int
- annonce_id : int (FK → Annonce)
- chemin : string
- ordre : int
```

#### Classe `ImmeublePhoto`
```
- id : int
- immeuble_id : int (FK → Immeuble)
- chemin : string
- ordre : int
```

---

### 3.2 Associations (Multiplicités)

```
User             "1" ——————— "0..1"  Organisation
User             "1" ——————— "0..1"  Employe
User             "1" ——————— "0..*"  Client   (une fiche par agence)

Organisation     "1" ——————— "0..*"  Bien
Organisation     "1" ——————— "0..*"  Annonce
Organisation     "1" ——————— "0..*"  Contrat
Organisation     "1" ——————— "0..*"  Facture
Organisation     "1" ——————— "0..*"  Client
Organisation     "1" ——————— "0..*"  Employe
Organisation     "1" ——————— "0..*"  Prospect
Organisation     "1" ——————— "0..*"  Visite
Organisation     "1" ——————— "0..*"  EtatLieu
Organisation     "1" ——————— "0..*"  Immeuble
Organisation     "1" ——————— "0..*"  TauxInvestissement
Organisation     "1" ——————— "0..*"  Tache

Immeuble         "1" ——————— "0..*"  Bien
Immeuble         "1" ——————— "0..*"  ImmeublePhoto

Bien             "1" ——————— "0..*"  BienImage
Bien             "1" ——————— "0..*"  BienDocument
Bien             "1" ——————— "0..*"  Annonce
Bien             "1" ——————— "0..*"  Contrat
Bien             "1" ——————— "0..*"  Visite

Annonce          "1" ——————— "0..*"  AnnoncePhoto

Contrat          "0..*" ——— "0..*"   Client   [Table pivot : client_contrat]
Contrat          "1" ——————— "0..*"  Facture
Contrat          "1" ——————— "0..*"  EtatLieu

Client           "1" ——————— "0..*"  Facture

Prospect         "1" ——————— "0..*"  Visite
Prospect         "0..1" ——— "0..1"   Client   (conversion prospect → client)

Visite           "0..1" ——— "1"      Employe
```

---

## 4. DIAGRAMMES DE SÉQUENCE

### 4.1 Séquence : Connexion avec email/mot de passe

```
Acteurs : Utilisateur, Frontend (Next.js), Backend (Laravel API), Base de données

1. Utilisateur → Frontend : Saisit email + mot de passe → clique "Se connecter"
2. Frontend → API : POST /api/auth/login { email, password }
3. API → DB : SELECT user WHERE email = ? 
4. DB → API : Retourne l'utilisateur
5. API : Vérifie le mot de passe (bcrypt)
   [Si invalide] → API → Frontend : 401 { message: "Identifiants incorrects" }
6. API : Vérifie is_active
   [Si is_active=false] → API → Frontend : 403 { message: "Compte en attente" }
7. API → DB : Crée token Sanctum
8. API → Frontend : 200 { token, user, role, organisation }
9. Frontend : Stocke token (cookie domtek_token + localStorage)
10. Frontend : Redirige selon rôle :
    - admin → /admin
    - organisation → /{slug}
    - employe → /{slug}
    - client → /
```

---

### 4.2 Séquence : Inscription avec Google (Organisation)

```
Acteurs : Utilisateur, Frontend, Backend (Laravel), Google OAuth, Admin

1. Utilisateur → Frontend : Clique "S'inscrire avec Google" sur /register/organisation
2. Frontend → API : GET /api/auth/google?intent=organisation
3. API → Google : Redirect vers Google OAuth consent screen
4. Utilisateur → Google : Accepte les permissions
5. Google → API : Callback avec code d'autorisation
6. API → Google : Échange code contre access_token
7. Google → API : Retourne { name, email, google_id, avatar }
8. API : Crée token chiffré { name, email, google_id, expires: +30min }
9. API → Frontend : Redirect /register/organisation?g={token_chiffré}
10. Frontend : Détecte paramètre ?g=...
11. Frontend → API : POST /api/auth/google/prefill?token={token}
12. API : Déchiffre token → retourne { name, email }
13. Frontend : Pré-remplit formulaire (nom, email)
14. Utilisateur → Frontend : Complète les informations (nom org, ville, téléphone...)
15. Frontend → API : POST /api/auth/register/organisation-google { token, ...orgData }
16. API : Déchiffre token, valide expiration
17. API → DB : INSERT User (role=organisation, is_active=false, google_id)
18. API → DB : INSERT Organisation (statut=en_attente)
19. API → Frontend : 201 { user, organisation }
20. Frontend : Redirige → /en-attente
21. [Plus tard] Admin → API : PATCH /api/admin/organisations/{slug}/activer
22. API → DB : UPDATE Organisation (statut=active), UPDATE User (is_active=true)
23. Organisation peut maintenant se connecter
```

---

### 4.3 Séquence : Création et publication d'une annonce

```
Acteurs : Organisation (Utilisateur), Frontend, API Backend, DB

1. Organisation → Frontend : Navigue vers /{slug}/annonces/nouvelle
2. Frontend → API : GET /api/org/biens (charger la liste des biens disponibles)
3. API → DB : SELECT biens WHERE organisation_id = ?
4. DB → API → Frontend : Liste des biens
5. Organisation → Frontend : Sélectionne un bien, saisit titre + description
6. Organisation → Frontend : Upload photos de l'annonce
7. Frontend → API : POST /api/org/annonces { bien_id, titre, description }
8. API → DB : INSERT annonces (statut=brouillon)
9. DB → API : annonce.id
10. Frontend → API : POST /api/org/annonces/{id}/photos (multipart/form-data)
11. API : Stocke les fichiers → enregistre chemins
12. API → DB : INSERT annonce_photos
13. API → Frontend : 201 { annonce avec photos }
14. Organisation → Frontend : Clique "Publier"
15. Frontend → API : PATCH /api/org/annonces/{id}/publier
16. API → DB : UPDATE annonces SET statut=publiee, date_publication=now()
17. API → Frontend : 200 { annonce mise à jour }
18. Frontend : Affiche badge "Publiée"
19. Visiteur → Public Frontend : GET /annonces
20. Public Frontend → API : GET /api/annonces
21. API → DB : SELECT annonces WHERE statut=publiee
22. API → Public Frontend : Liste des annonces publiques
```

---

### 4.4 Séquence : De prospect à paiement de facture

```
Acteurs : Organisation, Employé, Client (Prospect), Frontend, API, DB, Stripe

=== ÉTAPE 1 : Création du prospect ===
1. Organisation → Frontend : Formulaire création prospect
2. Frontend → API : POST /api/org/prospects { nom, email, score_solvabilite, revenus... }
3. API → DB : INSERT prospects
4. API → Frontend : 201 { prospect }

=== ÉTAPE 2 : Planification de la visite ===
5. Organisation → Frontend : Créer une visite pour le prospect
6. Frontend → API : POST /api/org/visites { prospect_id, bien_id, employe_id, date_visite }
7. API → DB : INSERT visites (statut=planifiee)
8. API → Frontend : 201 { visite }

=== ÉTAPE 3 : Réalisation de la visite ===
9. Employé → Frontend : Ouvre la visite
10. Employé → Frontend : Enregistre résultat (impression_client, statut=realisee)
11. Frontend → API : PUT /api/org/visites/{id} { statut, impression_client }
12. API → DB : UPDATE visites

=== ÉTAPE 4 : Conversion en client ===
13. Organisation → Frontend : Convertit prospect en client
14. Frontend → API : POST /api/org/clients { ...données prospect }
15. API → DB : INSERT clients
16. API → Frontend : 201 { client }
17. Frontend → API : PUT /api/org/prospects/{id} { client_id }
18. API → DB : UPDATE prospects SET client_id

=== ÉTAPE 5 : Création du contrat ===
19. Organisation → Frontend : Formulaire contrat
20. Frontend → API : POST /api/org/contrats { bien_id, client_ids[], montant_ttc, dates, type }
21. API → DB : INSERT contrats
22. API → DB : INSERT client_contrat (pivot)
23. API → Frontend : 201 { contrat }

=== ÉTAPE 6 : Génération de facture ===
24. Organisation → Frontend : Créer une facture
25. Frontend → API : POST /api/org/factures { contrat_id, client_id, type=loyer, montant, date_echeance }
26. API → DB : INSERT factures (statut=en_attente)
27. API : Génère stripe_token (lien de paiement unique)
28. API → Frontend : 201 { facture avec lien paiement }

=== ÉTAPE 7 : Paiement en ligne par le client ===
29. Client → Browser : Ouvre /paiement/{stripe_token}
30. Frontend Public → API : GET /api/pay/{token}
31. API → DB : SELECT facture WHERE stripe_token = ?
32. API → Frontend Public : { facture details, montant }
33. Client → Frontend Public : Saisit données carte bancaire
34. Frontend Public → Stripe : Requête paiement
35. Stripe → Webhook → API : POST /api/stripe/webhook
36. API → DB : UPDATE factures SET statut=payee
37. API : Envoie notification à l'organisation
38. Stripe → Client : Page de confirmation
```

---

### 4.5 Séquence : Activation d'un compte employé

```
Acteurs : Employé (futur), Organisation, Frontend, API, DB

1. Employé → Frontend : Formulaire /register/employe { nom, prenom, email, password, organisation_id }
2. Frontend → API : POST /api/auth/register/employe
3. API → DB : INSERT users (is_active=false, role=employe)
4. API → DB : INSERT employes (organisation_id)
5. API → Frontend : 201 { message: "En attente d'activation" }
6. Frontend : Redirige → /en-attente

7. Organisation → Frontend : Ouvre /{slug}/employes
8. Frontend → API : GET /api/org/employes-en-attente
9. API → DB : SELECT employes WHERE user.is_active=false AND organisation_id=?
10. DB → API → Frontend : Liste employés en attente

11. Organisation → Frontend : Clique "Activer" sur un employé
12. Frontend → API : POST /api/org/employes/{id}/activer
13. API → DB : UPDATE users SET is_active=true WHERE id=?
14. API → Frontend : 200 { message: "Employé activé" }

15. Employé → Frontend : /login { email, password }
16. Frontend → API : POST /api/auth/login
17. API → DB : Vérifie credentials + is_active=true
18. API → Frontend : 200 { token, user, role=employe, organisation }
19. Frontend : Redirige → /{slug} (dashboard organisation avec accès limité)
```

---

### 4.5b Séquence : Provisionnement et activation d'un compte client

```
Acteurs : Organisation, Client, Frontend, API, Observer, Mailer, DB

── Création de la fiche et provisionnement ──────────────────────────────────
1.  Organisation → Frontend : Formulaire /{slug}/clients/nouveau { nom, prenom, email*, ... }
                              (* obligatoire, unique dans l'agence)
2.  Frontend → API : POST /api/org/clients
3.  API → DB : INSERT clients (organisation_id, email, user_id=NULL)
4.  DB → Observer : événement `created` (différé après COMMIT)
5.  Observer → DB : SELECT users WHERE email = ?

    ├── Cas A — aucun compte n'existe
    │   6a. Observer → DB : INSERT users (role=client, is_active=true,
    │                       password = secret aléatoire 32 car. jamais divulgué)
    │   7a. Observer → DB : UPDATE clients SET user_id = ?
    │   8a. Observer → DB : INSERT password_reset_tokens (broker « clients », 7 jours)
    │   9a. Observer → Mailer : e-mail « Activez votre espace client » + lien à usage unique
    │
    └── Cas B — la personne possède déjà un compte (auto-inscription, autre agence)
        6b. Observer → DB : UPDATE clients SET user_id = ?   (rattachement seul)
        7b. Observer → Mailer : avis « Une nouvelle agence apparaît dans votre espace »
                                (aucun lien d'activation : son mot de passe reste valable)

10. API → Frontend : 201 ClientResource { acces_statut: "invite" | "actif" }

── Activation par le client (cas A) ────────────────────────────────────────
11. Client → Boîte mail : ouvre le lien
12. Frontend : /reset-password?activation=1&token=…&email=…
13. Client → Frontend : choisit son mot de passe (≥8 car., 1 maj., 1 chiffre, 1 spécial)
14. Frontend → API : POST /api/auth/activate-client { token, email, password }
15. API → DB : vérifie le jeton via le broker « clients » (fenêtre 7 jours)
16. API → DB : UPDATE users SET password = hash(…), email_verified_at = now()
17. API → DB : DELETE password_reset_tokens  (jeton à usage unique)
18. API → Frontend : 200 { message: "Votre espace client est activé" }

── Connexion ───────────────────────────────────────────────────────────────
19. Client → Frontend : /login { email, password }
20. Frontend → API : POST /api/auth/login
21. API → Frontend : 200 { token, user, role=client }
22. Frontend : Redirige → /espace
```

**Points de conception :**

- **L'agence ne connaît jamais le mot de passe.** Le compte naît avec un secret aléatoire de 32 caractères qui n'est ni affiché, ni envoyé, ni stocké en clair ; il n'existe que pour empêcher toute connexion avant activation. Le client choisit ensuite le sien.
- **Un échec d'envoi n'interrompt rien.** L'erreur SMTP est journalisée, jamais propagée : la création d'un client ou d'un contrat ne doit pas échouer parce que le serveur de mail est indisponible. L'agence dispose de UC42c pour relancer.
- **Broker dédié.** La réinitialisation ordinaire expire en 60 minutes ; l'activation en 7 jours, car le client ne demande pas ce lien — il le découvre en consultant sa boîte mail.
- **Un seul jeton valable à la fois.** Relancer l'invitation régénère le jeton et invalide le lien précédent.

---

### 4.6 Séquence : Consultation des statistiques

```
Acteurs : Organisation/Employé, Frontend, API, DB

1. Utilisateur → Frontend : Ouvre /{slug} (Dashboard)
2. Frontend → API (parallèle) :
   - GET /api/org/statistiques/biens
   - GET /api/org/statistiques/prospects
   - GET /api/org/statistiques/visites
   - GET /api/org/statistiques/canaux

3. API (pour chaque requête) → DB :
   - COUNT biens BY statut (disponible, loué, vendu)
   - COUNT prospects BY score_opportunite
   - COUNT visites BY statut, BY mois
   - GROUP BY canal acquisition

4. DB → API : Données agrégées
5. API → Frontend : JSON { labels[], data[], totaux }
6. Frontend : Affiche graphiques (Chart.js / Recharts)
   - Camembert : répartition des biens
   - Histogramme : visites par mois
   - Indicateurs : taux de conversion prospects
```

---

## 5. RÉSUMÉ DES ENTITÉS POUR LE DIAGRAMME DE CLASSES

### Table de synthèse

| Entité | Clé primaire | Clés étrangères | Relation principale |
|--------|-------------|-----------------|---------------------|
| User | id | — | Racine de tous les comptes |
| Organisation | id | user_id | 1 User → 1 Organisation |
| Employe | id | user_id, organisation_id | 1 Org → N Employés |
| Client | id | user_id (nullable), organisation_id | 1 Org → N Clients ; 1 User → N Clients (1 fiche/agence), UNIQUE (organisation_id, email) |
| Bien | id | organisation_id, immeuble_id | 1 Org → N Biens |
| Immeuble | id | organisation_id | 1 Org → N Immeubles |
| Annonce | id | organisation_id, bien_id | 1 Bien → N Annonces |
| Contrat | id | organisation_id, bien_id | N Clients ↔ N Contrats |
| Facture | id | organisation_id, client_id, contrat_id | 1 Contrat → N Factures |
| Prospect | id | organisation_id, client_id (nullable) | 1 Org → N Prospects |
| Visite | id | organisation_id, prospect_id, bien_id, employe_id | N Visites par Prospect |
| EtatLieu | id | organisation_id, contrat_id | 1 Contrat → N États des lieux |
| TauxInvestissement | id | organisation_id | 1 Org → N Taux |
| Tache | id | organisation_id | 1 Org → N Tâches |
| BienImage | id | bien_id | 1 Bien → N Images |
| BienDocument | id | bien_id | 1 Bien → N Documents |
| AnnoncePhoto | id | annonce_id | 1 Annonce → N Photos |
| ImmeublePhoto | id | immeuble_id | 1 Immeuble → N Photos |

### Table pivot (Many-to-Many)

| Table pivot | Entité 1 | Entité 2 |
|-------------|----------|----------|
| client_contrat | Client | Contrat |

---

## 6. ENDPOINTS API (Référence complète)

### Authentification (Public)
| Méthode | URL | Description |
|---------|-----|-------------|
| POST | /api/auth/login | Connexion |
| POST | /api/auth/logout | Déconnexion |
| GET | /api/auth/me | Profil courant |
| POST | /api/auth/register/organisation | Inscription organisation |
| POST | /api/auth/register/organisation-google | Inscription org via Google |
| POST | /api/auth/register/employe | Inscription employé |
| POST | /api/auth/register/client | Inscription client |
| GET | /api/auth/google | Redirection Google OAuth |
| GET | /api/auth/google/callback | Callback Google |
| POST | /api/auth/google/prefill | Pré-remplissage depuis Google |
| POST | /api/auth/forgot-password | Demande reset mot de passe |
| POST | /api/auth/reset-password | Réinitialisation mot de passe (broker `users`, 60 min) |
| POST | /api/auth/activate-client | Activation d'un compte client provisionné par l'agence (broker `clients`, 7 jours) |

### Administration (rôle: admin)
| Méthode | URL | Description |
|---------|-----|-------------|
| GET | /api/admin/organisations | Liste toutes les organisations |
| GET | /api/admin/organisations/{org} | Détails d'une organisation |
| PATCH | /api/admin/organisations/{org}/activer | Activer |
| PATCH | /api/admin/organisations/{org}/desactiver | Désactiver |
| DELETE | /api/admin/organisations/{org} | Supprimer |
| GET | /api/admin/organisations/{org}/biens | Biens de l'org |
| GET | /api/admin/organisations/{org}/annonces | Annonces de l'org |

### Gestion Organisation (rôle: organisation, employé)
| Méthode | URL | Description |
|---------|-----|-------------|
| GET | /api/org/biens | Liste des biens |
| POST | /api/org/biens | Créer un bien |
| GET/PUT/DELETE | /api/org/biens/{id} | CRUD bien |
| POST | /api/org/biens/{id}/images | Ajouter images |
| DELETE | /api/org/biens/{id}/images/{img} | Supprimer image |
| POST | /api/org/biens/{id}/documents | Ajouter document |
| GET | /api/org/annonces | Liste des annonces |
| POST | /api/org/annonces | Créer annonce |
| GET/PUT/DELETE | /api/org/annonces/{id} | CRUD annonce |
| PATCH | /api/org/annonces/{id}/publier | Publier |
| PATCH | /api/org/annonces/{id}/archiver | Archiver |
| GET | /api/org/contrats | Liste des contrats |
| POST | /api/org/contrats | Créer contrat |
| GET/PUT/DELETE | /api/org/contrats/{id} | CRUD contrat |
| GET | /api/org/contrats/{id}/pdf | Télécharger PDF |
| GET | /api/org/factures | Liste des factures |
| POST | /api/org/factures | Créer facture |
| GET/PUT/DELETE | /api/org/factures/{id} | CRUD facture |
| PATCH | /api/org/factures/{id}/payer | Marquer payée |
| GET | /api/org/factures/{id}/pdf | Télécharger PDF |
| GET | /api/org/clients | Liste des clients |
| POST | /api/org/clients | Créer client |
| GET/PUT/DELETE | /api/org/clients/{id} | CRUD client |
| POST | /api/org/clients/{id}/renvoyer-acces | Renvoyer le lien d'activation (régénère le jeton, invalide l'ancien) |
| GET | /api/org/prospects | Liste des prospects |
| POST | /api/org/prospects | Créer prospect |
| GET/PUT/DELETE | /api/org/prospects/{id} | CRUD prospect |
| GET | /api/org/visites | Liste des visites |
| POST | /api/org/visites | Créer visite |
| GET | /api/org/employes | Liste des employés |
| POST | /api/org/employes | Créer employé |
| GET/PUT/DELETE | /api/org/employes/{id} | CRUD employé |
| GET | /api/org/employes-en-attente | Employés en attente |
| POST | /api/org/employes/{id}/activer | Activer compte |
| GET | /api/org/immeubles | Liste des immeubles |
| POST | /api/org/immeubles | Créer immeuble |
| GET/PUT/DELETE | /api/org/immeubles/{id} | CRUD immeuble |
| GET | /api/org/etat-lieux | Liste états des lieux |
| POST | /api/org/etat-lieux | Créer état des lieux |
| GET | /api/org/taches | Liste des tâches |
| POST | /api/org/taches | Créer tâche |
| GET | /api/org/statistiques/biens | Stats biens |
| GET | /api/org/statistiques/prospects | Stats prospects |
| GET | /api/org/statistiques/visites | Stats visites |

### Espace client (rôle: client) — lecture seule

Toutes ces routes sont bornées aux fiches clients rattachées au compte connecté
(`User::clientProfiles()`). Une ressource appartenant à un autre client renvoie
404, jamais ses données.

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | /api/client/resume | Contrats actifs, factures impayées, montant dû, agences de rattachement |
| GET | /api/client/contrats | Ses contrats (filtre `statut`) |
| GET | /api/client/contrats/{id} | Détail : bien, durée, conditions financières, agence, factures, états des lieux |
| GET | /api/client/contrats/{id}/pdf | Contrat en PDF (même vue que côté agence) |
| GET | /api/client/factures | Ses factures (filtres `statut` — dont `impayees` — et `type`) |
| GET | /api/client/factures/{id} | Détail d'une facture |
| GET | /api/client/quittances | Ses quittances de loyer (filtres `statut` : `impayees`, `payees`) |

**Ressources dédiées.** Ces endpoints n'utilisent pas les ressources du
back-office, qui exposent `notes`, `retenue_source`, `stripe_session_id` et les
colonnes d'audit. Les ressources `Espace\*` ne révèlent que ce qui concerne le
client, et ajoutent `payment_url` sur une facture tant qu'elle est due — le
même lien public que celui envoyé par e-mail.

**Quittances.** Elles dépendent des locations, où le locataire est désigné par
un couple `(locataire_type, locataire_id)`. Le filtrage porte sur les deux
colonnes : l'identifiant seul exposerait les quittances d'un prospect de même id.

### Public (sans authentification)
| Méthode | URL | Description |
|---------|-----|-------------|
| GET | /api/annonces | Liste annonces publiques |
| GET | /api/annonces/{id} | Détail annonce |
| GET | /api/organisations | Liste organisations |
| GET | /api/organisations/{slug} | Profil organisation |
| GET | /api/pay/{token} | Page de paiement |
| POST | /api/stripe/webhook | Webhook Stripe |

---

## 6bis. VALIDATION

### Règles partagées côté serveur

`app/Rules/` regroupe les contrôles de format qui se répétaient d'un `FormRequest` à l'autre. Les déclarer une fois évite qu'ils redivergent : `telephone` était recopié dans 7 fichiers et `cin` dans 6, chacun avec la même règle incomplète (`['string', 'max:20']`, aucun contrôle de format).

| Règle | Format imposé | Appliquée à |
|---|---|---|
| `TelephoneTunisien` | 8 chiffres commençant par 2–9, indicatif `+216` ou `00216` facultatif. Séparateurs d'espacement tolérés à la saisie, retirés avant contrôle | `telephone` (7 requests), `urgence_telephone` (2) |
| `NumeroPieceIdentite` | Chiffres uniquement. Exactement 8 si `type_piece = CIN` ou si le champ est absent (cas des employés) ; longueur libre pour un passeport. Lit `type_piece` via `DataAwareRule` | `cin` (7 requests) |
| `CodePostalTunisien` | Exactement 4 chiffres | `code_postal` (2 requests) |

Ces règles reproduisent côté serveur ce que les formulaires faisaient déjà seuls : sans elles, un appel direct à l'API acceptait `telephone = "bonjour"` et `cin = "AZERTYUI"`.

### Cohérences entre champs

Les contraintes croisées présentes à la création disparaissaient à la modification : chaque `Update…Request` avait été écrit sans reprendre celles de son `Store…Request`. La donnée était donc correcte à la création et corrompable ensuite.

| Contrainte | Où elle s'applique | Référence comparée |
|---|---|---|
| `date_echeance` ≥ `date_emission` | Facture, création et modification | À la modification, `date_emission` n'est pas modifiable : la comparaison porte sur la **valeur enregistrée**, pas sur un champ du formulaire |
| `periode_fin` ≥ `periode_debut` | Facture | Chaque borne peut être soumise seule ; l'autre est reprise en base |
| `date_fin` > `date_debut` | Contrat | Idem : `date_debut` n'est pas modifiable |
| `premiere_echeance` ≥ `date_debut` | Contrat, création et modification | — |
| `montant_ttc` ≥ `montant_ht` | Contrat, création et modification | Un TTC inférieur au HT produirait une TVA négative |
| `date_publication` ≥ aujourd'hui | Annonce | **Uniquement en cas de reprogrammation.** Reprendre `after_or_equal:today` tel quel empêcherait de corriger le titre d'une annonce déjà publiée, dont la date est par nature passée. La comparaison se fait au **jour** : la valeur stockée est un datetime porteur de l'heure, le formulaire n'envoie qu'une date |

Ces contrôles vivent dans un hook `withValidator()` plutôt que dans le tableau de règles, parce qu'ils comparent à l'état en base et non à un autre champ soumis.

### Validation frontend

`domtek-frontend/src/lib/validation.ts` centralise les règles de validation appliquées aux formulaires (auth + dashboard organisation) avant soumission :

| Fonction | Règle |
|---|---|
| `isValidEmail` | format email standard |
| `validatePassword` | ≥8 car., 1 majuscule, 1 chiffre, 1 caractère spécial |
| `isValidPhone` | format tunisien `(+216)?[2-9]XXXXXXX` |
| `isPositiveAmount` | nombre strictement positif |
| `isValidCin` | 8 chiffres |
| `isValidCinOrPasseport` | chiffres uniquement |
| `isValidCityOrPlace` | lettres/accents/espaces/apostrophes/tirets |

`validatePassword` s'applique également au formulaire d'activation de l'espace client (`/reset-password?activation=1`) : c'est le client qui choisit son mot de passe, il est donc soumis à la même exigence que tout autre utilisateur. Le secret aléatoire généré au provisionnement échappe à cette règle — il n'est jamais saisi, et sert uniquement à bloquer la connexion avant activation.

---

## 7. FLUX DE NAVIGATION (Frontend)

```
/ (Page d'accueil)
├── /annonces              (Annonces publiques)
├── /organisations         (Annuaire organisations)
├── /paiement/{token}      (Paiement client)
│
├── /login                 (Connexion)
├── /register/
│   ├── organisation       (Inscription agence)
│   ├── employe            (Inscription employé)
│   └── client             (Inscription client)
├── /forgot-password
├── /reset-password        (+ ?activation=1 → activation d'un espace client)
├── /en-attente            (Compte en attente de validation)
│
├── /espace                (Espace client — lecture seule)
│   ├── /contrats          (+ /{id} → détail, PDF, états des lieux)
│   ├── /factures          (+ paiement en ligne)
│   └── /quittances
│
├── /admin                 (Tableau de bord Admin)
│   ├── /compte
│   └── /organisations/
│       └── /{slug}/
│           ├── biens
│           ├── annonces
│           ├── comptes
│           └── investissement
│
└── /{slug}                (Tableau de bord Organisation/Employé)
    ├── /biens             (+ /nouveau + /{id} + /{id}/modifier)
    ├── /annonces          (+ /nouvelle + /{id} + /{id}/modifier)
    ├── /contrats          (+ /nouveau + /{id})
    ├── /clients           (+ /nouveau + /{id})
    ├── /prospects
    ├── /employes          (+ /nouveau)
    ├── /factures
    ├── /visites
    ├── /etat-lieux        (+ /nouveau + /{id})
    ├── /immeubles
    ├── /taches
    ├── /investissements
    └── /compte
```
