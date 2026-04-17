# Vérification des champs obligatoires — SILA Application

> Généré le 2026-04-17  
> Légende : ✅ Obligatoire | ⬜ Optionnel | ⚠️ Conditionnel

---

## 1. AUTHENTIFICATION

### Connexion (`/login`)
| Champ | Obligatoire ? | Règle backend | Frontend |
|-------|:---:|---|---|
| email | ✅ | required, email | required |
| password | ✅ | required, string | required |

### Inscription Client (`/register/client`)
| Champ | Obligatoire ? | Règle backend | Frontend |
|-------|:---:|---|---|
| name | ✅ | required, string, max:255 | required |
| email | ✅ | required, email, unique:users | required |
| password | ✅ | required, confirmed, min:8 | required |
| password_confirmation | ✅ | (implicite par confirmed) | required |

### Inscription Organisation (`/register/organisation`)
| Champ | Obligatoire ? | Règle backend | Frontend |
|-------|:---:|---|---|
| name (responsable) | ✅ | required, string, max:255 | required |
| email | ✅ | required, email, unique:users | required |
| password | ⚠️ | required si pas Google | masqué si Google |
| password_confirmation | ⚠️ | required si pas Google | masqué si Google |
| nom_organisation | ✅ | required, string, max:255 | required |
| adresse | ⬜ | nullable, string, max:255 | optionnel |
| ville | ⬜ | nullable, string, max:100 | optionnel |
| telephone | ⬜ | nullable, string, max:20 | optionnel |
| email_organisation | ⬜ | nullable, email | optionnel |
| description | ⬜ | nullable, string | optionnel |

---

## 2. BIENS IMMOBILIERS

### Nouveau Bien (`/biens/nouveau`)
| Champ | Obligatoire ? | Règle backend | Notes |
|-------|:---:|---|---|
| designation | ✅ | required, string, max:255 | Marqué * |
| type_transaction | ✅ | required, in:vente,loyer | Select marqué * |
| type_bien | ✅ | required, in:appartement,maison,bureau,terrain,garage,magasin,autre | Select marqué * |
| prix | ✅ | required, numeric, min:0 | Marqué * |
| immeuble_id | ⬜ | nullable, exists:immeubles | Select optionnel |
| type_location | ⬜ | nullable, in:meuble,non_meuble | Affiché si loyer |
| bloc | ⬜ | nullable, integer, min:1 | Affiché si immeuble sélectionné |
| num | ⬜ | nullable, string, max:20 | Numéro d'appartement |
| description | ⬜ | nullable, string | Textarea |
| notes | ⬜ | nullable, string | Textarea |
| taxe_fonciere | ⬜ | nullable, numeric, min:0 | — |
| regime_juridique | ⬜ | nullable, in:mono_propriete,co_propriete | — |
| superficie | ⬜ | nullable, numeric, min:0 | — |
| superficie_commune | ⬜ | nullable, numeric, min:0 | — |
| adresse | ⬜ | nullable, string, max:255 | — |
| ville | ⬜ | nullable, string, max:100 | — |
| pays | ⬜ | nullable, string, max:100 | Défaut "Tunisie" |
| code_postal | ⬜ | nullable, string, max:20 | — |
| maps_url | ⬜ | nullable, string, max:2048 | — |
| nb_pieces | ⬜ | nullable, integer, min:0 | — |
| nb_chambres | ⬜ | nullable, integer, min:0 | — |
| nb_salles_bain | ⬜ | nullable, integer, min:0 | — |
| nb_cuisine | ⬜ | nullable, integer, min:0 | — |
| etage | ⬜ | nullable, integer | — |
| date_construction | ⬜ | nullable, date | — |
| accepte_animaux | ⬜ | boolean | Toggle |
| accepte_fumeurs | ⬜ | boolean | Toggle |
| options | ⬜ | nullable, array | Cases à cocher |

---

## 3. IMMEUBLES

### Nouvel Immeuble (`/immeubles/nouveau`)
| Champ | Obligatoire ? | Règle backend | Notes |
|-------|:---:|---|---|
| nom | ✅ | required, string, max:150 | Marqué * |
| type_usage | ✅ | required, in:residentiel,professionnel,mixte | Marqué * |
| type_propriete | ✅ | required, in:auto_propriete,co_propriete | Marqué * |
| nb_etages | ✅ | required, integer, min:0 | Marqué * |
| a_blocs | ✅ | required, boolean | Toggle |
| nb_blocs | ⚠️ | required_if:a_blocs,true, integer, min:1 | Requis si blocs activé |
| sous_sol | ✅ | required, boolean | Toggle |
| cameras_surveillance | ✅ | required, boolean | Toggle |
| adresse | ⬜ | nullable, string, max:255 | — |
| ville | ⬜ | nullable, string, max:100 | — |
| maps_url | ⬜ | nullable, string, max:2048 | — |
| pays | ⬜ | nullable, string, max:100 | — |
| photos | ⬜ | nullable, array | Upload |

---

## 4. CRM — CLIENTS

### Nouveau Client (`/clients/nouveau`)
| Champ | Obligatoire ? | Règle backend | Notes |
|-------|:---:|---|---|
| nom | ✅ | required, string, max:100 | Marqué * |
| prenom | ✅ | required, string, max:100 | Marqué * |
| civilite | ⬜ | nullable, in:M.,Mme,Mlle | Select |
| telephone | ⬜ | nullable, string, max:20 | — |
| email | ⬜ | nullable, email, max:255 | — |
| ville | ⬜ | nullable, string, max:100 | — |
| date_naissance | ⬜ | nullable, date, before:today | — |
| lieu_naissance | ⬜ | nullable, string, max:100 | — |
| type_piece | ⬜ | nullable, in:CIN,Passeport | Select |
| cin | ⬜ | nullable, string, max:20 | — |
| document_identite | ⬜ | nullable, file, pdf/jpg/png, max:5 Mo | Upload |
| urgence_nom | ⬜ | nullable, string, max:100 | Contact urgence |
| urgence_telephone | ⬜ | nullable, string, max:20 | Contact urgence |
| urgence_relation | ⬜ | nullable, string, max:50 | Contact urgence |
| notes | ⬜ | nullable, string | Textarea |

---

## 5. CRM — PROSPECTS

### Nouveau Prospect (`/prospects/nouveau`)
| Champ | Obligatoire ? | Règle backend | Notes |
|-------|:---:|---|---|
| nom | ✅ | required, string, max:100 | Marqué * |
| prenom | ✅ | required, string, max:100 | Marqué * |
| civilite | ⬜ | nullable, in:M.,Mme,Mlle | Select |
| telephone | ⬜ | nullable, string, max:20 | — |
| email | ⬜ | nullable, email | — |
| ville | ⬜ | nullable, string, max:100 | — |
| date_naissance | ⬜ | nullable, date, before:today | — |
| lieu_naissance | ⬜ | nullable, string, max:100 | — |
| type_piece | ⬜ | nullable, in:CIN,Passeport | — |
| cin | ⬜ | nullable, string, max:20 | — |
| cin_delivree_le | ⬜ | nullable, date | — |
| cin_delivree_a | ⬜ | nullable, string, max:100 | — |
| document_identite | ⬜ | nullable, file, max:5 Mo | Upload |
| notes | ⬜ | nullable, string | — |
| source_connaissance | ⬜ | nullable, in:facebook,instagram,... | Select |
| source_connaissance_detail | ⬜ | nullable, string, max:150 | Texte libre |
| profession | ⬜ | nullable, string, max:150 | — |
| revenus_mensuels | ⬜ | nullable, in:moins_1000,1000_2000,... | Select |
| composition_foyer | ⬜ | nullable, array | Cases à cocher |
| biens_interet | ⬜ | nullable, array | Cases à cocher |
| score_solvabilite | ⬜ | nullable, in:verifie,... | Select |
| impression_premiere_visite | ⬜ | nullable, in:très_satisfait,... | Select |
| hierarchie_besoins | ⬜ | nullable, array | Liste drag-drop |

---

## 6. CRM — EMPLOYÉS

### Nouvel Employé (`/employes/nouveau`)
| Champ | Obligatoire ? | Règle backend | Notes |
|-------|:---:|---|---|
| nom | ✅ | required, string, max:100 | — |
| prenom | ✅ | required, string, max:100 | — |
| email | ⬜ | nullable, email, max:255 | — |
| telephone | ⬜ | nullable, string, max:20 | — |
| poste | ⬜ | nullable, string, max:100 | — |
| date_embauche | ⬜ | nullable, date | — |
| statut | ⬜ | sometimes, in:actif,inactif | Défaut: actif |

---

## 7. CONTRATS

### Nouveau Contrat (`/contrats/nouveau`)
| Champ | Obligatoire ? | Règle backend | Notes |
|-------|:---:|---|---|
| bien_id | ✅ | required, exists:biens | Select marqué * |
| type | ✅ | required, in:bail_habitation,bail_commercial,compromis_vente,acte_vente,autre | Select |
| date_debut | ✅ | required, date | Marqué * |
| montant_ht | ✅ | required, numeric, min:0 | Marqué * |
| date_fin | ⚠️ | required si location, nullable si vente | Marqué * (location seulement) |
| client_ids | ⚠️ | required si mode=client_existant, array, min:1 | Onglet "Client existant" |
| prospect_id | ⚠️ | required si mode=prospect | Onglet "Prospect" |
| nouveau_client.nom | ⚠️ | required si mode=nouveau_client | Onglet "Nouveau client" |
| nouveau_client.prenom | ⚠️ | required si mode=nouveau_client | Onglet "Nouveau client" |
| designation | ⬜ | nullable, string, max:255 | — |
| utilisation | ⬜ | nullable, in:residence_primaire,... | Select |
| tva | ⬜ | nullable, numeric, min:0, max:100 | Défaut: 19 |
| montant_ttc | ⬜ | nullable, numeric | **Auto-calculé**, désactivé |
| frais_syndic | ⬜ | nullable, numeric, min:0 | Location seulement |
| retenue_source | ⬜ | nullable, numeric, min:0, max:100 | — |
| montant_paiement | ⬜ | nullable, numeric | — |
| periodicite_paiement | ⬜ | nullable, in:mensuel,bimestriel,... | Location seulement |
| jour_paiement | ⬜ | nullable, integer, min:1, max:28 | Location seulement |
| depot_garantie | ⬜ | nullable, numeric, min:0 | — |
| premiere_echeance | ⬜ | nullable, date | Auto-calculé (location) |
| assurance | ⬜ | nullable, string | Textarea |
| notes | ⬜ | nullable, string | Textarea |
| forme_juridique | ⬜ | nullable, string, max:100 | — |
| representant | ⬜ | nullable, string, max:150 | — |
| date_contrat | ⬜ | nullable, date | Défaut: aujourd'hui |
| ville_signature | ⬜ | nullable, string, max:100 | — |
| cin_delivree_le | ⬜ | nullable, date | Détail client |

---

## 8. FACTURES

### Nouvelle Facture (`/factures/nouvelle`)
| Champ | Obligatoire ? | Règle backend | Notes |
|-------|:---:|---|---|
| client_id | ✅ | required, exists:clients | — |
| type | ✅ | required, in:eau,electricite,gaz,loyer,charges,autre | Select |
| montant | ✅ | required, numeric, min:0 | — |
| date_emission | ✅ | required, date | — |
| date_echeance | ✅ | required, date, after_or_equal:date_emission | — |
| contrat_id | ⬜ | nullable, exists:contrats | — |
| periode_debut | ⬜ | nullable, date | — |
| periode_fin | ⬜ | nullable, date, after_or_equal:periode_debut | — |
| reference | ⬜ | nullable, string, max:100 | — |
| notes | ⬜ | nullable, string | — |

---

## 9. ANNONCES

### Nouvelle Annonce (`/annonces/nouvelle`)
| Champ | Obligatoire ? | Règle backend | Notes |
|-------|:---:|---|---|
| bien_id | ✅ | required, exists:biens | Select |
| titre | ✅ | required, string, max:255 | — |
| description | ⬜ | nullable, string | Textarea |
| date_publication | ⬜ | nullable, date, after_or_equal:today | — |
| statut | ⬜ | sometimes, in:brouillon,planifiee,publiee | Défaut: brouillon |
| photos | ⬜ | sometimes, array | Upload multiple |

---

## 10. ÉTATS DES LIEUX

### Nouvel État des Lieux (`/etat-lieux/nouveau`)
| Champ | Obligatoire ? | Règle backend | Notes |
|-------|:---:|---|---|
| contrat_id | ✅ | required, integer, exists:contrats | — |
| type | ✅ | required, in:entree,sortie | Select |
| date | ✅ | required, date | — |
| designation | ⬜ | nullable, string, max:255 | — |
| releve_eau | ⬜ | nullable, numeric, min:0 | — |
| releve_electricite | ⬜ | nullable, numeric, min:0 | — |
| releve_gaz | ⬜ | nullable, numeric, min:0 | — |
| remise_cles | ⬜ | boolean | Toggle |
| commentaire | ⬜ | nullable, string | Textarea |

---

## 11. VISITES

### Nouvelle Visite (`/visites` — modal ou page)
| Champ | Obligatoire ? | Règle backend | Notes |
|-------|:---:|---|---|
| prospect_id | ✅ | required, exists:prospects | — |
| bien_id | ✅ | required, exists:biens | — |
| nom_agent | ✅ | required, string, max:255 | — |
| date_visite | ✅ | required, date | — |
| notes | ⬜ | nullable, string | — |

---

## 12. TÂCHES

### Nouvelle Tâche (`/taches` — modal)
| Champ | Obligatoire ? | Règle backend | Notes |
|-------|:---:|---|---|
| titre | ✅ | required, string, max:255 | — |
| description | ⬜ | nullable, string | — |
| date_echeance | ⬜ | nullable, date | — |
| priorite | ⬜ | sometimes, in:basse,normale,haute | Défaut: normale |
| statut | ⚠️ | sometimes, in:a_faire,en_cours,terminee | Édition seulement |

---

## RÉCAPITULATIF — POINTS À VÉRIFIER / MODIFIER

| # | Formulaire | Observation | Action suggérée |
|---|---|---|---|
| 1 | **Client / Prospect** | `telephone` et `email` tous deux optionnels — on peut créer un contact sans aucun moyen de le joindre | Rendre au moins un des deux obligatoire |
| 2 | **Client / Prospect** | `date_naissance` optionnelle → les notifications d'anniversaire ne fonctionneront pas si non renseignée | Afficher un rappel ou rendre le champ plus visible |
| 3 | **Employé** | `nom` et `prenom` obligatoires en backend mais **pas marqués `*` dans le formulaire** | Ajouter l'astérisque * dans le frontend |
| 4 | **Visite** | `nom_agent` obligatoire en backend — vérifier si le formulaire le pré-remplit automatiquement ou si l'utilisateur doit le saisir | Pré-remplir avec le nom de l'utilisateur connecté |
| 5 | **Contrat** | Logique conditionnelle complexe (3 onglets) — s'assurer que les messages de validation s'affichent dans le bon onglet | Vérifier le comportement en cas d'erreur |
| 6 | **Bien** | `adresse` et `ville` optionnels — les annonces afficheront "—" pour la localisation | Rendre `ville` obligatoire ou fortement recommandé |
| 7 | **Annonce** | `description` optionnelle — les annonces publiées sans description sont moins attractives | Rendre obligatoire à la publication (statut=publiee) |
| 8 | **Inscription Organisation** | `telephone` de l'organisation optionnel — les clients ne pourront pas contacter l'agence | Rendre recommandé (afficher avertissement) |
