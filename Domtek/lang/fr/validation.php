<?php

/*
|--------------------------------------------------------------------------
| Messages de validation — français
|--------------------------------------------------------------------------
|
| Laravel 11+ n'embarque plus de répertoire `lang/` : sans ce fichier, tous
| les messages des règles déclaratives sortaient en anglais, au milieu d'une
| interface entièrement française, avec des noms de champs bruts
| (« cin delivree le », « date naissance »).
|
| Seules les règles effectivement employées dans le projet sont traduites.
| En ajouter une qui n'y figure pas fera réapparaître un message anglais :
| c'est ici qu'il faut la compléter.
|
| La section `attributes` donne à chaque champ son libellé lisible ; c'est
| elle qui transforme « Le champ date naissance » en « La date de naissance ».
|
*/

return [

    'accepted'             => 'Le champ :attribute doit être accepté.',
    'after'                => 'Le champ :attribute doit être une date postérieure au :date.',
    'after_or_equal'       => 'Le champ :attribute doit être une date postérieure ou égale au :date.',
    'array'                => 'Le champ :attribute doit être une liste.',
    'before'               => 'Le champ :attribute doit être une date antérieure au :date.',
    'before_or_equal'      => 'Le champ :attribute doit être une date antérieure ou égale au :date.',
    'boolean'              => 'Le champ :attribute doit être vrai ou faux.',
    'confirmed'            => 'La confirmation du champ :attribute ne correspond pas.',
    'date'                 => 'Le champ :attribute doit être une date valide.',
    'date_format'          => 'Le champ :attribute ne correspond pas au format :format.',
    'different'            => 'Les champs :attribute et :other doivent être différents.',
    'digits'               => 'Le champ :attribute doit contenir :digits chiffres.',
    'digits_between'       => 'Le champ :attribute doit contenir entre :min et :max chiffres.',
    'distinct'             => 'Le champ :attribute a une valeur en doublon.',
    'email'                => 'Le champ :attribute doit être une adresse e-mail valide.',
    'exists'               => "La valeur sélectionnée pour :attribute n'existe pas.",
    'file'                 => 'Le champ :attribute doit être un fichier.',
    'filled'               => 'Le champ :attribute doit avoir une valeur.',
    'image'                => 'Le champ :attribute doit être une image.',
    'in'                   => 'La valeur sélectionnée pour :attribute est invalide.',
    'integer'              => 'Le champ :attribute doit être un nombre entier.',
    'json'                 => 'Le champ :attribute doit être un document JSON valide.',
    'mimes'                => 'Le champ :attribute doit être un fichier de type : :values.',
    'mimetypes'            => 'Le champ :attribute doit être un fichier de type : :values.',
    'not_in'               => 'La valeur sélectionnée pour :attribute est invalide.',
    'numeric'              => 'Le champ :attribute doit être un nombre.',
    'present'              => 'Le champ :attribute doit être présent.',
    'regex'                => 'Le format du champ :attribute est invalide.',
    'required'             => 'Le champ :attribute est obligatoire.',
    'required_if'          => 'Le champ :attribute est obligatoire quand :other vaut :value.',
    'required_without'     => "Le champ :attribute est obligatoire quand :values n'est pas renseigné.",
    'same'                 => 'Les champs :attribute et :other doivent être identiques.',
    'string'               => 'Le champ :attribute doit être du texte.',
    'unique'               => 'Cette valeur de :attribute est déjà utilisée.',
    'url'                  => 'Le champ :attribute doit être une URL valide.',
    'uuid'                 => 'Le champ :attribute doit être un UUID valide.',

    // Les règles de taille ont un message par type de valeur.
    'max' => [
        'array'   => 'Le champ :attribute ne peut pas contenir plus de :max éléments.',
        'file'    => 'Le champ :attribute ne peut pas dépasser :max kilooctets.',
        'numeric' => 'Le champ :attribute ne peut pas être supérieur à :max.',
        'string'  => 'Le champ :attribute ne peut pas dépasser :max caractères.',
    ],
    'min' => [
        'array'   => 'Le champ :attribute doit contenir au moins :min éléments.',
        'file'    => 'Le champ :attribute doit faire au moins :min kilooctets.',
        'numeric' => 'Le champ :attribute doit être au moins :min.',
        'string'  => 'Le champ :attribute doit contenir au moins :min caractères.',
    ],
    'size' => [
        'array'   => 'Le champ :attribute doit contenir :size éléments.',
        'file'    => 'Le champ :attribute doit faire :size kilooctets.',
        'numeric' => 'Le champ :attribute doit être égal à :size.',
        'string'  => 'Le champ :attribute doit contenir :size caractères.',
    ],
    'between' => [
        'array'   => 'Le champ :attribute doit contenir entre :min et :max éléments.',
        'file'    => 'Le champ :attribute doit faire entre :min et :max kilooctets.',
        'numeric' => 'Le champ :attribute doit être entre :min et :max.',
        'string'  => 'Le champ :attribute doit contenir entre :min et :max caractères.',
    ],

    // Règle `Password` (Password::min(8) dans les requests d'inscription).
    'password' => [
        'letters'       => 'Le champ :attribute doit contenir au moins une lettre.',
        'mixed'         => 'Le champ :attribute doit contenir au moins une majuscule et une minuscule.',
        'numbers'       => 'Le champ :attribute doit contenir au moins un chiffre.',
        'symbols'       => 'Le champ :attribute doit contenir au moins un caractère spécial.',
        'uncompromised' => 'Ce :attribute est apparu dans une fuite de données. Choisissez-en un autre.',
    ],

    /*
    |--------------------------------------------------------------------------
    | Messages sur mesure
    |--------------------------------------------------------------------------
    |
    | Le marqueur `:date` restitue le paramètre brut de la règle. Avec une date
    | littérale cela convient, mais `before_or_equal:today` donnait « antérieure
    | ou égale au today ». Les règles bornées par `today` reçoivent donc leur
    | propre formulation, qui dit ce qui est attendu plutôt que de citer la
    | contrainte.
    |
    */

    'custom' => [
        'cin_delivree_le' => [
            'before_or_equal' => 'La date de délivrance de la CIN ne peut pas être dans le futur.',
        ],
        'date_embauche' => [
            'before_or_equal' => "La date d'embauche ne peut pas être dans le futur.",
        ],
        'date_construction' => [
            'before_or_equal' => 'La date de construction ne peut pas être dans le futur.',
        ],
        'date_naissance' => [
            'before' => 'La date de naissance doit être dans le passé.',
            'after'  => 'La date de naissance doit être postérieure à 1900.',
        ],
        'date_visite' => [
            'after_or_equal' => 'Une visite ne peut pas être planifiée dans le passé.',
        ],
        'date_publication' => [
            'after_or_equal' => 'La date de publication ne peut pas être dans le passé.',
        ],
        'email' => [
            'email'  => "L'adresse e-mail saisie n'est pas valide.",
            'unique' => 'Cette adresse e-mail est déjà utilisée.',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Libellés des champs
    |--------------------------------------------------------------------------
    */

    'attributes' => [
        // Identité
        'civilite'                   => 'civilité',
        'nom'                        => 'nom',
        'prenom'                     => 'prénom',
        'name'                       => 'nom',
        'date_naissance'             => 'date de naissance',
        'lieu_naissance'             => 'lieu de naissance',
        'profession'                 => 'profession',

        // Pièce d'identité
        'type_piece'                 => "type de pièce d'identité",
        'cin'                        => 'numéro de CIN',
        'cin_delivree_le'            => 'date de délivrance de la CIN',
        'cin_delivree_a'             => 'lieu de délivrance de la CIN',
        'document_identite'          => "document d'identité",

        // Contact
        'email'                      => 'adresse e-mail',
        'email_organisation'         => "adresse e-mail de l'agence",
        'telephone'                  => 'numéro de téléphone',
        'adresse'                    => 'adresse',
        'ville'                      => 'ville',
        'pays'                       => 'pays',
        'code_postal'                => 'code postal',
        'maps_url'                   => 'lien Google Maps',
        'urgence_nom'                => "nom du contact d'urgence",
        'urgence_telephone'          => "téléphone du contact d'urgence",
        'urgence_relation'           => "relation avec le contact d'urgence",

        // Compte
        'password'                   => 'mot de passe',
        'nom_organisation'           => "nom de l'agence",
        'poste'                      => 'poste',
        'date_embauche'              => "date d'embauche",

        // Bien
        'designation'                => 'désignation',
        'titre'                      => 'titre',
        'description'                => 'description',
        'num'                        => 'numéro de lot',
        'prix'                       => 'prix',
        'type_transaction'           => 'type de transaction',
        'type_bien'                  => 'type de bien',
        'type_location'              => 'type de location',
        'type_usage'                 => "type d'usage",
        'type_propriete'             => 'type de propriété',
        'regime_juridique'           => 'régime juridique',
        'superficie'                 => 'superficie',
        'superficie_commune'         => 'superficie commune',
        'nb_pieces'                  => 'nombre de pièces',
        'nb_chambres'                => 'nombre de chambres',
        'nb_cuisine'                 => 'nombre de cuisines',
        'nb_salles_bain'             => 'nombre de salles de bain',
        'etage'                      => 'étage',
        'bloc'                       => 'bloc',
        'date_construction'          => 'date de construction',
        'taxe_fonciere'              => 'taxe foncière',
        'accepte_animaux'            => 'acceptation des animaux',
        'accepte_fumeurs'            => 'acceptation des fumeurs',
        'images'                     => 'images',
        'image_principale'           => 'image principale',
        'photos'                     => 'photos',

        // Immeuble
        'a_blocs'                    => 'division en blocs',
        'nb_blocs'                   => 'nombre de blocs',
        'nb_etages'                  => "nombre d'étages",
        'sous_sol'                   => 'sous-sol',
        'cameras_surveillance'       => 'caméras de surveillance',

        // Contrat
        'type'                       => 'type',
        'utilisation'                => 'utilisation',
        'date_debut'                 => 'date de début',
        'date_fin'                   => 'date de fin',
        'date_contrat'               => 'date du contrat',
        'ville_signature'            => 'ville de signature',
        'forme_juridique'            => 'forme juridique',
        'representant'               => 'représentant',
        'montant_ht'                 => 'montant HT',
        'montant_ttc'                => 'montant TTC',
        'tva'                        => 'TVA',
        'frais_syndic'               => 'frais de syndic',
        'retenue_source'             => 'retenue à la source',
        'depot_garantie'             => 'dépôt de garantie',
        'periodicite_paiement'       => 'périodicité de paiement',
        'jour_paiement'              => 'jour de paiement',
        'montant_paiement'           => 'montant du paiement',
        'premiere_echeance'          => 'première échéance',
        'assurance'                  => 'assurance',

        // Facture
        'montant'                    => 'montant',
        'reference'                  => 'référence',
        'date_emission'              => "date d'émission",
        'date_echeance'              => "date d'échéance",
        'periode'                    => 'période',
        'periode_debut'              => 'début de période',
        'periode_fin'                => 'fin de période',

        // Annonce
        'date_publication'           => 'date de publication',

        // État des lieux
        'date'                       => 'date',
        'releve_eau'                 => "relevé d'eau",
        'releve_electricite'         => "relevé d'électricité",
        'releve_gaz'                 => 'relevé de gaz',
        'remise_cles'                => 'remise des clés',
        'commentaire'                => 'commentaire',
        'inventaires'                => 'inventaire',

        // Visite
        'date_visite'                => 'date de visite',
        'nom_agent'                  => "nom de l'agent",
        'impression_premiere_visite' => 'impression de la première visite',

        // Prospect
        'score_solvabilite'          => 'score de solvabilité',
        'revenus_mensuels'           => 'revenus mensuels',
        'composition_foyer'          => 'composition du foyer',
        'hierarchie_besoins'         => 'hiérarchie des besoins',
        'biens_interet'              => "biens d'intérêt",
        'source_connaissance'        => 'source de connaissance',
        'source_connaissance_detail' => 'détail de la source',

        // Investissement
        'taux'                       => 'taux',

        // Rattachements
        'bien_id'                    => 'bien',
        'immeuble_id'                => 'immeuble',
        'client_id'                  => 'client',
        'prospect_id'                => 'prospect',
        'contrat_id'                 => 'contrat',
        'location_id'                => 'location',
        'employe_id'                 => 'employé',
        'organisation_id'            => 'agence',

        // Divers
        'statut'                     => 'statut',
        'notes'                      => 'notes',
        'options'                    => 'options',
        'search'                     => 'recherche',
    ],

];
