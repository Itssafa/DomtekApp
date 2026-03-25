# Inventaire des Formulaires — Location CMS

> Projet : `location-cms-02-2026`
> Date : 2026-03-24

---

## Table des matières

1. [Authentification](#1-authentification)
2. [Compte Administrateur](#2-compte-administrateur)
3. [Compte Organisation](#3-compte-organisation)
4. [Attributs](#4-attributs)
5. [Blog](#5-blog)
6. [FAQ & SEO](#6-faq--seo)
7. [Communication](#7-communication)
8. [Organisations (Admin)](#8-organisations-admin)
9. [Paramètres Organisation](#9-paramètres-organisation)
10. [Clients / Locataires](#10-clients--locataires)
11. [Immobilier](#11-immobilier)
12. [Locations](#12-locations)
13. [Quittances](#13-quittances)
14. [Inventaire & État des lieux](#14-inventaire--état-des-lieux)
15. [Finance](#15-finance)
16. [Leads & Prospects](#16-leads--prospects)
17. [Staff](#17-staff)
18. [Tâches (Todo)](#18-tâches-todo)
19. [Composants réutilisables](#19-composants-réutilisables)

---

## 1. Authentification

### 1.1 Connexion Administrateur

| Propriété | Valeur |
|-----------|--------|
| Fichier | `resources/views/accounts/admin/login.blade.php` |
| Méthode | POST |
| Route | `admin.login.post` → `/admin/login` |
| Contrôleur | `Admin\AccountController@login` |

**Champs :**

| Nom | Type | Label | Requis |
|-----|------|-------|--------|
| `email` | email | Email | Oui |
| `password` | password | Mot de passe | Oui |

---

### 1.2 Connexion Organisation

| Propriété | Valeur |
|-----------|--------|
| Fichier | `resources/views/accounts/org/login.blade.php` |
| Méthode | POST |
| Route | `organisation.login.post` → `/organisation/login` |
| Contrôleur | `Account\OrgController@login` |

**Champs :**

| Nom | Type | Label | Requis |
|-----|------|-------|--------|
| `email` | email | Email | Oui |
| `password` | password | Mot de passe | Oui |

---

### 1.3 Demande de réinitialisation — Admin

| Propriété | Valeur |
|-----------|--------|
| Fichier | `resources/views/accounts/admin/rest_pws.blade.php` |
| Méthode | POST |
| Route | `admin.reset_pws.post` → `/admin/login/reset` |
| Contrôleur | `Admin\AccountController@forget_pws_post` |

**Champs :**

| Nom | Type | Label | Requis |
|-----|------|-------|--------|
| `email` | email | Email | Oui |

---

### 1.4 Demande de réinitialisation — Organisation

| Propriété | Valeur |
|-----------|--------|
| Fichier | `resources/views/accounts/org/rest_pws.blade.php` |
| Méthode | POST |
| Route | `organisation.reset_pws.post` → `/organisation/reset` |
| Contrôleur | `Account\OrgController@forget_pws_post` |

**Champs :**

| Nom | Type | Label | Requis |
|-----|------|-------|--------|
| `email` | email | Email | Oui |

---

### 1.5 Nouveau mot de passe — Admin (lien email)

| Propriété | Valeur |
|-----------|--------|
| Fichier | `resources/views/accounts/admin/rest_pws_page.blade.php` |
| Méthode | POST |
| Route | `admin.email.rest.link.post` → `/admin/login/rest_pws/` |
| Contrôleur | `Admin\AccountController@reset_pws_post` |

**Champs :**

| Nom | Type | Label | Requis |
|-----|------|-------|--------|
| `token_r` | hidden | — | — |
| `newpass` | password | Nouveau mot de passe | Oui |
| `renewpass` | password | Répéter le nouveau mot de passe | Oui |

---

### 1.6 Nouveau mot de passe — Organisation (lien email)

| Propriété | Valeur |
|-----------|--------|
| Fichier | `resources/views/accounts/org/rest_pws_page.blade.php` |
| Méthode | POST |
| Route | `organisation.email.rest.link.post` → `/organisation/rest_pws/` |
| Contrôleur | `Account\OrgController@reset_pws_post` |

**Champs :**

| Nom | Type | Label | Requis |
|-----|------|-------|--------|
| `token_r` | hidden | — | — |
| `newpass` | password | Nouveau mot de passe | Oui |
| `renewpass` | password | Répéter le nouveau mot de passe | Oui |

---

## 2. Compte Administrateur

### 2.1 Profil Administrateur

| Propriété | Valeur |
|-----------|--------|
| Fichier | `resources/views/admin/account/index.blade.php` |
| Méthode | POST |
| Route | `admin.profile.post` → `/admin/profile` |
| Contrôleur | `Admin\MainController@profile_post` |
| Structure | Formulaire à onglets |

**Onglet — Informations générales** (`admin/account/components/general.blade.php`) :

| Nom | Type | Label | Requis |
|-----|------|-------|--------|
| `full_name` | text | Nom complet | Oui |
| `email` | email | Email | Oui |
| `phone` | text | Numéro de téléphone | Non |

**Onglet — Mot de passe** (`admin/account/components/pws.blade.php`) :

| Nom | Type | Label | Requis |
|-----|------|-------|--------|
| `o_pw` | password | Ancien mot de passe | Oui |
| `pw1` | password | Nouveau mot de passe | Oui |
| `pw2` | password | Répéter le nouveau mot de passe | Oui |

---

## 3. Compte Organisation

### 3.1 Profil Organisation

| Propriété | Valeur |
|-----------|--------|
| Fichier | `resources/views/params/account/index.blade.php` |
| Méthode | POST |
| Route | `organisation.profile.post` → `/organisation/profile` |
| Contrôleur | `Front\UtilsController@profile_post` |
| Structure | Formulaire à onglets |

**Onglet — Informations générales** (`params/account/components/general.blade.php`) :

Mêmes champs que le profil administrateur (nom complet, email, téléphone).

**Onglet — Mot de passe** (`params/account/components/pws.blade.php`) :

Mêmes champs que le changement de mot de passe administrateur.

---

## 4. Attributs

### 4.1 Création / Édition d'un attribut

| Propriété | Valeur |
|-----------|--------|
| Fichier | `resources/views/admin/attr/create.blade.php` |
| Méthode | POST |
| Route | `admin.attr.create_post` → `/admin/attribute/create` |
| Contrôleur | `Admin\AttributeController@create_post` |

**Champs :**

| Nom | Type | Label | Requis | Notes |
|-----|------|-------|--------|-------|
| `tab` | hidden | — | — | 1=Usages locatifs, 2=Type de location, 3=Type d'immobilier, défaut=Devise |
| `attribute` | text | Désignation | Oui | — |

---

## 5. Blog

### 5.1 Création / Édition d'un article

| Propriété | Valeur |
|-----------|--------|
| Fichier | `resources/views/admin/blog/articles/create/main.blade.php` |
| Méthode | POST |
| Route | `admin.pages.blog.articles.create.post` → `/admin/pages/blog/articles/create` |
| Contrôleur | `Admin\BlogController@post_articles` |
| Structure | Formulaire à onglets |

**Onglet — Informations générales** (`admin/blog/articles/create/general_info.blade.php`) :

| Nom | Type | Label | Requis | Notes |
|-----|------|-------|--------|-------|
| `art_id` | hidden | — | — | Édition uniquement |
| `title` | text | Titre | Oui | — |
| `brief` | textarea | Brief | Oui | — |
| `content` | textarea | Content | Oui | Éditeur TinyMCE |
| `thumbnail` | file | Thumbnail | Oui | Avec recadrage (cropper) |
| `category_id` | select | Catégorie | Oui | — |
| `tags[]` | tag input | Mots clés | Non | — |
| `status` | select | Status | Oui | publié / brouillon |
| `seo_tags[]` | tag input | Meta Tags | Non | — |

---

### 5.2 Création / Édition d'une catégorie de blog

| Propriété | Valeur |
|-----------|--------|
| Fichier | `resources/views/admin/blog/categories/create.blade.php` |
| Méthode | POST |
| Route | `admin.pages.blog.categories.create.post` → `/admin/pages/blog/categories/create` |
| Contrôleur | `Admin\BlogController@post_categories` |

**Champs :**

| Nom | Type | Label | Requis |
|-----|------|-------|--------|
| `cat_id` | hidden | — | — |
| `attribute` | text | Désignation | Oui |

---

### 5.3 Création / Édition d'un tag de blog

| Propriété | Valeur |
|-----------|--------|
| Fichier | `resources/views/admin/blog/tags/create.blade.php` |
| Méthode | POST |
| Route | `admin.pages.blog.tags.create.post` → `/admin/pages/blog/tags/create` |
| Contrôleur | `Admin\BlogController@post_tags` |

**Champs :**

| Nom | Type | Label | Requis |
|-----|------|-------|--------|
| `tag_id` | hidden | — | — |
| `attribute` | text | Désignation | Oui |

---

## 6. FAQ & SEO

### 6.1 Création / Édition d'une entrée FAQ

| Propriété | Valeur |
|-----------|--------|
| Fichier | `resources/views/admin/faq/create.blade.php` |
| Méthode | POST |
| Route | `admin.pages.faq.create.post` → `/admin/pages/faq/create` |
| Contrôleur | `Admin\PagesController@post_faq` |

**Champs :**

| Nom | Type | Label | Requis |
|-----|------|-------|--------|
| `art_id` | hidden | — | — |
| `ques` | textarea | Question | Oui |
| `rep` | textarea | Réponse | Oui |

---

### 6.2 Paramètres SEO

| Propriété | Valeur |
|-----------|--------|
| Fichier | `resources/views/admin/params/seo/create.blade.php` |
| Méthode | POST |
| Route | `admin.pages.seo.create.post` → `/admin/pages/seo/create` |
| Contrôleur | `Admin\PagesController@post_seo` |

**Champs :**

| Nom | Type | Label | Requis |
|-----|------|-------|--------|
| `seo_tags[]` | tag input | Meta Tags | Non |
| `seo_description` | textarea | Meta Description | Oui |

---

## 7. Communication

### 7.1 Changement de statut — Message de contact

| Propriété | Valeur |
|-----------|--------|
| Fichier | `resources/views/admin/communication/contact/single.blade.php` |
| Méthode | POST |
| Route | `admin.comm.chaneg.status` → `/admin/communication/change_status` |
| Contrôleur | `Admin\CommunicationController@setStatus` |

**Champs :**

| Nom | Type | Label | Requis |
|-----|------|-------|--------|
| `id` | hidden | — | — |
| `type` | hidden | — | Valeur fixe : `contact` |
| `status` | radio | Statut | Oui |

---

### 7.2 Changement de statut — Demande de devis / démo

| Propriété | Valeur |
|-----------|--------|
| Fichier | `resources/views/admin/communication/quotes/single.blade.php` |
| Méthode | POST |
| Route | `admin.comm.chaneg.status` → `/admin/communication/change_status` |
| Contrôleur | `Admin\CommunicationController@setStatus` |

**Champs :**

| Nom | Type | Label | Requis |
|-----|------|-------|--------|
| `id` | hidden | — | — |
| `type` | hidden | — | Valeur fixe : `quote` |
| `status` | radio | Statut | Oui |

---

## 8. Organisations (Admin)

### 8.1 Création / Édition d'une organisation

| Propriété | Valeur |
|-----------|--------|
| Fichier | `resources/views/admin/organisation/create/main.blade.php` |
| Méthode | POST |
| Route | `admin.organisations.create_post` → `/admin/organisations/create` |
| Contrôleur | `Admin\OrganisationsController@create_post` |
| Structure | Formulaire à onglets |

**Onglets :** Informations générales (`general_info`) · Notes (`components.form.notes`)

---

### 8.2 Activation / Désactivation d'une organisation

| Propriété | Valeur |
|-----------|--------|
| Fichier | `resources/views/admin/organisation/etat.blade.php` |
| Méthode | POST |
| Route | `admin.organisations.etat_post` → `/admin/organisations/etat` |
| Contrôleur | `Admin\OrganisationsController@etat_post` |

**Champs :**

| Nom | Type | Label | Requis |
|-----|------|-------|--------|
| `o_id` | hidden | — | — |

---

## 9. Paramètres Organisation

### 9.1 Paramètres généraux

| Propriété | Valeur |
|-----------|--------|
| Fichier | `resources/views/params/index.blade.php` |
| Méthode | POST |
| Route | `parametre.post` → `/organisation/parametre` |
| Contrôleur | `Front\UtilsController@parametre_post` |
| Structure | Formulaire à onglets |

**Onglets :** Général (`params.components.general`) · Contrats (`params.components.articles`)

L'onglet **Contrats** propose une modale avec éditeur WYSIHTML5 pour ajouter/éditer des articles de contrat.

---

## 10. Clients / Locataires

### 10.1 Création / Édition d'un client

| Propriété | Valeur |
|-----------|--------|
| Fichier | `resources/views/clients/create/main.blade.php` |
| Méthode | POST |
| Route | `client.add.post` → `/organisation/locataires/add` |
| Contrôleur | `Front\ClientController@add_client_post` |
| Structure | Formulaire à onglets |

**Onglets :** Informations générales (`clients.create.general_info`) · Contact d'urgence (`clients.create.urgence`) · Notes (à la création uniquement)

---

## 11. Immobilier

### 11.1 Création / Édition d'un appartement

| Propriété | Valeur |
|-----------|--------|
| Fichier | `resources/views/immo/appart/create/main.blade.php` |
| Méthode | POST |
| Route | `immo.appart.add.post` → `/organisation/immobilier/add` |
| Contrôleur | `Front\ImmoController@add_apparts_post` |
| Structure | Formulaire à onglets |
| Encodage | `multipart/form-data` |

**Onglets :** Informations générales · Informations supplémentaires · Photos · Documents · Notes (création uniquement)

---

### 11.2 Création / Édition d'un bâtiment

| Propriété | Valeur |
|-----------|--------|
| Fichier | `resources/views/immo/bati/create/main.blade.php` |
| Méthode | POST |
| Route | `immo.bati.add.post` → `/organisation/immobilier/batiment/add` |
| Contrôleur | `Front\ImmoController@add_bati_post` |
| Structure | Formulaire à onglets |
| Encodage | `multipart/form-data` |

**Onglets :** Informations générales · Photos · Documents · Notes (création uniquement)

---

## 12. Locations

### 12.1 Création d'un contrat de location

| Propriété | Valeur |
|-----------|--------|
| Fichier | `resources/views/location/create/template.blade.php` |
| Méthode | POST |
| Route | `location.add.post` → `/organisation/location/create` |
| Contrôleur | `Front\LocationController@create_location` |
| Structure | Formulaire à onglets |

**Onglets :** Général · Quittance · Assurance · Documents · Notes

**Onglet Général** (`location/create/general.blade.php`) — champs principaux :

| Nom | Type | Label | Requis |
|-----|------|-------|--------|
| `client_id` | select | Locataire | Oui |
| `immo_id` | select | Bien immobilier | Oui |
| `desi` | text | Désignation | Oui |

---

### 12.2 Révision du loyer

| Propriété | Valeur |
|-----------|--------|
| Fichier | `resources/views/location/components/revision_create.blade.php` |
| Méthode | POST |
| Route | `location.revision.post` → `/organisation/location/revision/post` |
| Contrôleur | `Front\LocationController@revision_post` |

**Champs :**

| Nom | Type | Label | Requis | Notes |
|-----|------|-------|--------|-------|
| `id` | hidden | — | — | ID location |
| `date_app_r` | date | Date d'application du révision | Oui | — |
| `montant_ht` | number (0.001) | Montant HT | Oui | — |
| `montant_tva` | number (0.001) | Montant TVA | Oui | — |
| `type_tva` | select | Type TVA | Oui | % ou DT |
| `montant_ttc` | number (readonly) | Montant TTC | — | Calculé automatiquement |
| `syndic` | number (0.001) | Frais de Syndic | Oui | — |
| `retenu_source` | number (0.001) | Retenue à la source | Oui | — |
| `montant_total` | number (readonly) | Nouveau montant | — | Calculé automatiquement |

---

### 12.3 Fin de bail

| Propriété | Valeur |
|-----------|--------|
| Fichier | `resources/views/location/pages/end_location.blade.php` |
| Méthode | POST |
| Route | `location.end.post` → `/organisation/location/end/post` |
| Contrôleur | `Front\LocationController@end_location_post` |

**Champs :**

| Nom | Type | Label | Requis |
|-----|------|-------|--------|
| `loc_id` | hidden | — | — |
| `end_date` | date | Date de fin bail | Oui |

---

## 13. Quittances

### 13.1 Enregistrement d'un paiement de quittance

| Propriété | Valeur |
|-----------|--------|
| Fichier | `resources/views/location/quittance/payment/create.blade.php` |
| Méthode | POST |
| Route | `location.quittance.payment.create.post` → `/organisation/location/quittance/payment/create` |
| Contrôleur | `Front\QuittanceController@q_payment_post` |

**Champs :**

| Nom | Type | Notes |
|-----|------|-------|
| `q_id` | hidden | ID de la quittance |
| Lignes dynamiques | — | Composant `location.quittance.components.single_payment` |

---

## 14. Inventaire & État des lieux

### 14.1 Création / Édition d'un inventaire

| Propriété | Valeur |
|-----------|--------|
| Fichier | `resources/views/inventaire/create.blade.php` |
| Méthode | POST |
| Route | `inventaire.create.post` / `inventaire.edit.post` → `/organisation/inventaire/ajouter` |
| Contrôleur | `Front\InventaireController@create_post` |
| Structure | Formulaire à onglets dynamiques |

**Onglets :** Informations générales · Pièces (onglets dynamiques via composant `inventaire.create.single_piece`)

---

### 14.2 Création / Édition d'un état des lieux

| Propriété | Valeur |
|-----------|--------|
| Fichier | `resources/views/etat/create.blade.php` |
| Méthode | POST |
| Route | `etat.create.post` / `etat.edit.post` → `/organisation/etat/creer` |
| Contrôleur | `Front\EtatController@create_post` |
| Structure | Formulaire à onglets dynamiques |

**Onglets :** Informations générales · Pièces (onglets dynamiques via composant `etat.create.single_piece`)

---

## 15. Finance

### 15.1 Création / Édition d'une opération financière

| Propriété | Valeur |
|-----------|--------|
| Fichier | `resources/views/finance/create.blade.php` |
| Méthode | POST |
| Route | Dynamique via `$link_post` |
| Contrôleur | `Front\FinanceController@create_post` |

**Champs :**

| Nom | Type | Label | Requis | Notes |
|-----|------|-------|--------|-------|
| `type_f` | hidden | — | — | 1=Recette, 2=Dépense |
| `f_id` | hidden | — | — | Édition uniquement |
| `amount` | number (0.001) | Montant | Oui | — |
| `date` | date | Date | Oui | — |
| `title` | text | Titre | Oui | — |
| `comments` | textarea | Description | Non | — |
| En-tête dynamique | — | — | — | Composant `finance.create_headder` |

---

## 16. Leads & Prospects

### 16.1 Création / Édition d'un prospect

| Propriété | Valeur |
|-----------|--------|
| Fichier | `resources/views/leads/prospect/create/main.blade.php` |
| Méthode | POST |
| Route | `leads.prospect.add.post` → `/leads/prospects/add` |
| Contrôleur | `Prospect\ProspectController@add_prospect_post` |
| Structure | Formulaire à onglets |
| Encodage | `multipart/form-data` |

**Onglets :** Informations générales · Photos · Notes (création uniquement)

---

### 16.2 Import de prospects (CSV)

| Propriété | Valeur |
|-----------|--------|
| Fichier | `resources/views/leads/prospect/utils/import.blade.php` |
| Méthode | POST |
| Route | `leads.prospect.import.post` → `/leads/prospects/import` |
| Contrôleur | `Prospect\ProspectController@importPopUpPost` |
| Encodage | `multipart/form-data` |

**Champs :**

| Nom | Type | Label | Requis | Notes |
|-----|------|-------|--------|-------|
| `file` | file | Fichier CSV | Oui | Colonnes attendues : `type_personne`, `nom_raison`, `activite_professionnelle` |

---

### 16.3 Création / Édition d'un bien prospect

| Propriété | Valeur |
|-----------|--------|
| Fichier | `resources/views/leads/immo/create/main.blade.php` |
| Méthode | POST |
| Route | `leads.immo.add.post` → `/leads/immobilier/add` |
| Contrôleur | `Prospect\ImmoController@add_post` |
| Structure | Formulaire à onglets |
| Encodage | `multipart/form-data` |

**Onglets :** Informations générales · Informations supplémentaires · Photos · Documents · Notes (création uniquement)

---

### 16.4 Création / Édition d'un propriétaire

| Propriété | Valeur |
|-----------|--------|
| Fichier | `resources/views/leads/owner/create/main.blade.php` |
| Méthode | POST |
| Route | `leads.owner.add.post` → `/leads/propriétaires/add` |
| Contrôleur | `Prospect\OwnerController@add_owner_post` |
| Structure | Formulaire à onglets |

**Onglets :** Informations générales · Notes (création uniquement)

---

### 16.5 Planification d'une visite

| Propriété | Valeur |
|-----------|--------|
| Fichier | `resources/views/leads/visite/create/index.blade.php` |
| Méthode | POST |
| Route | `leads.visite.add.post` → `/leads/visite/add` |
| Contrôleur | `Prospect\CaseVisiteController@add_visite_post` |
| Structure | Formulaire à onglets dynamiques |

**Onglets :** Informations générales · Pièces (dynamiques) · Notes (création uniquement)

---

### 16.6 Dossier de vente / Case prospect

| Propriété | Valeur |
|-----------|--------|
| Fichier | `resources/views/leads/case/create/add_form.blade.php` |
| Méthode | POST |
| Route | `leads.case.add.post` → `/leads/case/add` |
| Contrôleur | `Prospect\CaseVisiteController@add_case_post` |

**Champs :**

| Nom | Type | Label | Requis | Notes |
|-----|------|-------|--------|-------|
| `prospect_id` | hidden | — | — | — |
| `c_id` | hidden | — | — | Édition uniquement |
| `date` | datetime-local | Date de contact | Oui | — |
| `case_type_contact` | select | Type de contact | Oui | — |
| `duration` | number | Durée du contact (min) | Oui | — |
| `type_case_needs` | select | Type case | Oui | — |
| `impression` | select | Impression du prospect (1–10) | Oui | — |
| `demande` | textarea | Demandes | Oui | — |
| `type_id` | select | Type de bien | Non | — |
| `nb_piece` | number | Nombre de pièces | Non | — |
| `nb_chambre` | number | Nombre de chambres | Non | — |
| `nb_salle_bain` | number | Nombre de salles de bain | Non | — |
| `nb_cuisine` | number | Nombre de cuisines | Non | — |
| `zip` | number | Code postal | Non | — |
| `moy_relance` | text | Moyen de relance exigé | Non | — |
| `delay_to_contact` | number | Délai de relance (jours) | Non | — |

---

## 17. Staff

### 17.1 Création / Édition d'un membre du staff

| Propriété | Valeur |
|-----------|--------|
| Fichier | `resources/views/staff/create.blade.php` |
| Méthode | POST |
| Route | `staff.create.post` → `/organisation/staff/create` |
| Contrôleur | `Front\UtilsController@staff_create_post` |

**Champs :**

| Nom | Type | Label | Requis | Notes |
|-----|------|-------|--------|-------|
| `u_id` | hidden | — | — | Édition uniquement |
| `email` | email | Email | Oui | Désactivé si existant |
| `role_id` | select | Privilège | Oui | — |
| `full_name` | text | Nom complet | Oui | Désactivé si existant |
| `phone` | text | Numéro de téléphone | Oui | Désactivé si existant |

---

### 17.2 Création / Édition d'un rôle / privilège

| Propriété | Valeur |
|-----------|--------|
| Fichier | `resources/views/staff/priv/create.blade.php` |
| Méthode | POST |
| Route | `staff.privilege.create.post` → `/organisation/staff/privilege/create` |
| Contrôleur | `Front\UtilsController@privilege_create_post` |

**Champs :**

| Nom | Type | Label | Requis | Notes |
|-----|------|-------|--------|-------|
| `r_id` | hidden | — | — | Édition uniquement |
| `title` | text | Désignation | Oui | — |
| `sections[]` | checkbox[] | Permissions par section | Non | Une case par section |

---

## 18. Tâches (Todo)

### 18.1 Ajout / Édition d'une tâche

| Propriété | Valeur |
|-----------|--------|
| Fichier | `resources/views/dash/todolist/add_task.blade.php` |
| Méthode | POST |
| Route | `organisation.location.todolist.add_edit.post` → `/organisation/todolist/new_edit` |
| Contrôleur | `Front\FrontendController@add_edit_post` |

**Champs :**

| Nom | Type | Label | Requis |
|-----|------|-------|--------|
| `uid` | hidden | — | — |
| `title` | text | Titre | Oui |
| `notes` | textarea | Notes | Non |
| `is_important` | checkbox | Important | Non |
| `is_done` | checkbox | Terminé | Non |

---

## 19. Composants réutilisables

### 19.1 Confirmation de suppression

| Propriété | Valeur |
|-----------|--------|
| Fichier | `resources/views/components/single/delete.blade.php` |
| Méthode | POST |
| Route | Dynamique via `$post_link` |

**Champs :**

| Nom | Type | Label | Requis | Notes |
|-----|------|-------|--------|-------|
| `type` | hidden | — | — | Type d'enregistrement |
| `id` | hidden | — | — | ID de l'enregistrement |
| `section_delete` | hidden | — | — | Identifiant de section |
| `confirme` | checkbox | Je confirme | Oui | Affiche avertissements |

---

### 19.2 Ajout de notes (modale)

| Propriété | Valeur |
|-----------|--------|
| Fichier | `resources/views/components/modals/put_notes_container.blade.php` |
| Méthode | POST |
| Route | `utils.note.add` → `/organisation/utils/notes/add` |
| Contrôleur | `Front\UtilsController@add_notes` |

**Champs :**

| Nom | Type | Notes |
|-----|------|-------|
| `t_table` | hidden | Nom de la table cible |
| `id` | hidden | ID de l'enregistrement |
| Contenu personnalisé | — | Via `@yield('note_form')` |

---

### 19.3 Réordonnancement d'attributs (drag-and-drop)

| Propriété | Valeur |
|-----------|--------|
| Fichier | `resources/views/components/single/order_attrebute.blade.php` |
| Méthode | POST |
| Route | Dynamique via `$post_link` |

**Champs :**

| Nom | Type | Notes |
|-----|------|-------|
| `section` | hidden | Identifiant de section |
| `sortedData` | hidden | IDs triés séparés par des virgules |

*Note : utilise jQuery Sortable pour le glisser-déposer.*

---

## Récapitulatif

| # | Formulaire | Module | Méthode |
|---|-----------|--------|---------|
| 1 | Connexion admin | Auth | POST |
| 2 | Connexion organisation | Auth | POST |
| 3 | Réinitialisation MDP admin (demande) | Auth | POST |
| 4 | Réinitialisation MDP organisation (demande) | Auth | POST |
| 5 | Nouveau MDP admin (lien email) | Auth | POST |
| 6 | Nouveau MDP organisation (lien email) | Auth | POST |
| 7 | Profil administrateur | Compte | POST |
| 8 | Profil organisation | Compte | POST |
| 9 | Création / édition attribut | Attributs | POST |
| 10 | Création / édition article de blog | Blog | POST |
| 11 | Création / édition catégorie de blog | Blog | POST |
| 12 | Création / édition tag de blog | Blog | POST |
| 13 | Création / édition FAQ | FAQ | POST |
| 14 | Paramètres SEO | SEO | POST |
| 15 | Statut message de contact | Communication | POST |
| 16 | Statut devis / démo | Communication | POST |
| 17 | Création / édition organisation | Admin | POST |
| 18 | Activation / désactivation organisation | Admin | POST |
| 19 | Paramètres organisation | Paramètres | POST |
| 20 | Création / édition client | Clients | POST |
| 21 | Création / édition appartement | Immobilier | POST |
| 22 | Création / édition bâtiment | Immobilier | POST |
| 23 | Création contrat de location | Location | POST |
| 24 | Révision du loyer | Location | POST |
| 25 | Fin de bail | Location | POST |
| 26 | Paiement quittance | Quittances | POST |
| 27 | Création / édition inventaire | Inventaire | POST |
| 28 | Création / édition état des lieux | État des lieux | POST |
| 29 | Opération financière | Finance | POST |
| 30 | Création / édition prospect | Leads | POST |
| 31 | Import prospects CSV | Leads | POST |
| 32 | Création / édition bien prospect | Leads | POST |
| 33 | Création / édition propriétaire | Leads | POST |
| 34 | Planification visite | Leads | POST |
| 35 | Dossier de vente / case prospect | Leads | POST |
| 36 | Création / édition membre staff | Staff | POST |
| 37 | Création / édition rôle / privilège | Staff | POST |
| 38 | Ajout / édition tâche (todo) | Tableau de bord | POST |
| 39 | Confirmation suppression | Composant | POST |
| 40 | Ajout de notes | Composant | POST |
| 41 | Réordonnancement attributs | Composant | POST |

**Total : 41 formulaires**

---

*Tous les formulaires incluent une protection CSRF via `{{ csrf_field() }}`.
Les formulaires avec upload de fichiers utilisent `enctype="multipart/form-data"`.*
