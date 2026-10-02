<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\PasswordResetController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\SocialAuthController;
use App\Http\Controllers\Api\Admin\OrganisationController as AdminOrganisationController;
use App\Http\Controllers\Api\Organisation\AnnonceController;
use App\Http\Controllers\Api\Organisation\BienController;
use App\Http\Controllers\Api\Organisation\ClientController;
use App\Http\Controllers\Api\Organisation\ProspectController;
use App\Http\Controllers\Api\Organisation\ContratController;
use App\Http\Controllers\Api\Organisation\EmployeController;
use App\Http\Controllers\Api\Organisation\FactureController;
use App\Http\Controllers\Api\Organisation\EtatLieuController;
use App\Http\Controllers\Api\Organisation\VisiteController;
use App\Http\Controllers\Api\Organisation\ImmeubleController;
use App\Http\Controllers\Api\Organisation\InvestissementController;
use App\Http\Controllers\Api\Organisation\CalendrierController;
use App\Http\Controllers\Api\Organisation\LocationController;
use App\Http\Controllers\Api\Organisation\NotificationController;
use App\Http\Controllers\Api\Organisation\StatistiqueController;
use App\Http\Controllers\Api\Organisation\TacheController;
use App\Http\Controllers\Api\Organisation\DashboardSuggestionsController;
use App\Http\Controllers\Api\Organisation\GenerateDescriptionController;
use App\Http\Controllers\Api\Organisation\ProspectSuggestionsController;
use App\Http\Controllers\Api\Public\AnnonceController as AnnoncePubliqueController;
use App\Http\Controllers\Api\Public\OrganisationController as OrganisationPubliqueController;
use App\Http\Controllers\Api\Client\EspaceController;
use App\Http\Controllers\Api\Public\PaiementController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Routes publiques — Authentification
|--------------------------------------------------------------------------
*/
Route::prefix('auth')->group(function () {
    Route::post('register/organisation',        [AuthController::class, 'registerOrganisation']);
    Route::post('register/organisation-google', [AuthController::class, 'registerOrganisationGoogle']);
    Route::post('register/client',              [AuthController::class, 'registerClient']);
    Route::post('register/client-google',       [AuthController::class, 'registerClientGoogle']);
    Route::post('register/employe',             [AuthController::class, 'registerEmploye']);
    Route::post('login',                 [AuthController::class, 'login']);

    // OAuth Google
    Route::get('google',           [SocialAuthController::class, 'redirectToGoogle']);
    Route::get('google/callback',  [SocialAuthController::class, 'handleGoogleCallback']);
    Route::post('google/prefill',  [SocialAuthController::class, 'prefillFromToken']);

    // Mot de passe oublié
    Route::post('forgot-password', [PasswordResetController::class, 'sendResetLink']);
    Route::post('reset-password',  [PasswordResetController::class, 'resetPassword']);
    Route::post('activate-client', [PasswordResetController::class, 'activateClient']);

    // Vérification e-mail
    Route::post('verify-email',    [AuthController::class, 'verifyEmail']);
});

/*
|--------------------------------------------------------------------------
| Routes publiques — Frontoffice visiteurs
|--------------------------------------------------------------------------
*/
Route::get('annonces',           [AnnoncePubliqueController::class, 'index']);
Route::get('annonces/{annonce}', [AnnoncePubliqueController::class, 'show']);
Route::get('organisations',           [OrganisationPubliqueController::class, 'index']);
Route::get('organisations/{slug}',    [OrganisationPubliqueController::class, 'show']);

// Paiement en ligne (liens depuis e-mail, sans auth)
Route::get('pay/{token}',         [PaiementController::class, 'payer']);
Route::post('stripe/webhook',     [PaiementController::class, 'webhook']);

/*
|--------------------------------------------------------------------------
| Routes protégées (token Sanctum requis)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {

    Route::get('auth/me',               [AuthController::class, 'me']);
    Route::post('auth/logout',          [AuthController::class, 'logout']);

    // Profil utilisateur
    Route::put('auth/me',               [ProfileController::class, 'updateUser']);
    Route::put('auth/me/password',      [ProfileController::class, 'updatePassword']);
    Route::post('org/profil',           [ProfileController::class, 'updateOrganisation']);

    /*
    |----------------------------------------------------------------------
    | BACKOFFICE — Admin
    | Accès : /api/admin/organisations/{organisation}/{section}
    |----------------------------------------------------------------------
    */
    Route::middleware('role:admin')->prefix('admin')->group(function () {

        // Gestion des organisations (liste, détail, activer, désactiver, supprimer)
        Route::get('organisations',                              [AdminOrganisationController::class, 'index']);
        Route::get('organisations/{organisation}',               [AdminOrganisationController::class, 'show']);
        Route::patch('organisations/{organisation}/activer',     [AdminOrganisationController::class, 'activer']);
        Route::patch('organisations/{organisation}/desactiver',  [AdminOrganisationController::class, 'desactiver']);
        Route::delete('organisations/{organisation}',            [AdminOrganisationController::class, 'destroy']);

        // Vue admin des données d'une organisation
        Route::get('organisations/{organisation}/biens',          [AdminOrganisationController::class, 'biens']);
        Route::get('organisations/{organisation}/annonces',       [AdminOrganisationController::class, 'annonces']);
        Route::get('organisations/{organisation}/investissements', [AdminOrganisationController::class, 'investissements']);
        Route::get('organisations/{organisation}/comptes',         [AdminOrganisationController::class, 'comptes']);
    });

    /*
    |----------------------------------------------------------------------
    | ESPACE CLIENT
    | Lecture seule : le client consulte ses contrats et ses factures.
    | Le périmètre est borné par les fiches clients rattachées à son compte.
    |----------------------------------------------------------------------
    */
    Route::middleware('role:client')->prefix('client')->group(function () {
        Route::get('resume',          [EspaceController::class, 'resume']);
        Route::get('contrats',            [EspaceController::class, 'contrats']);
        Route::get('contrats/{id}',       [EspaceController::class, 'contrat']);
        Route::get('contrats/{id}/pdf',   [EspaceController::class, 'contratPdf']);
        Route::get('factures',            [EspaceController::class, 'factures']);
        Route::get('factures/{id}',       [EspaceController::class, 'facture']);
        Route::get('quittances',          [EspaceController::class, 'quittances']);
    });

    /*
    |----------------------------------------------------------------------
    | FRONTOFFICE — Organisation (agence immobilière)
    |----------------------------------------------------------------------
    */
    // Routes accessibles par l'organisation ET les employés (lecture + création)
    Route::middleware('role:organisation,employe')->prefix('org')->group(function () {
        // Biens
        Route::post('biens/{bien}/generate-description', GenerateDescriptionController::class);
        Route::get('biens',              [BienController::class, 'index']);
        Route::get('biens/{bien}',       [BienController::class, 'show']);
        Route::post('biens',             [BienController::class, 'store']);
        Route::put('biens/{bien}',       [BienController::class, 'update']);
        Route::patch('biens/{bien}',     [BienController::class, 'update']);
        Route::delete('biens/{bien}',    [BienController::class, 'destroy']);
        Route::post('biens/{bien}/images',                 [BienController::class, 'uploadImages']);
        Route::delete('biens/{bien}/images/{image}',       [BienController::class, 'deleteImage']);
        Route::post('biens/{bien}/documents',              [BienController::class, 'uploadDocument']);
        Route::delete('biens/{bien}/documents/{document}', [BienController::class, 'deleteDocument']);

        // Annonces
        Route::get('annonces',           [AnnonceController::class, 'index']);
        Route::get('annonces/{annonce}', [AnnonceController::class, 'show']);
        Route::post('annonces',          [AnnonceController::class, 'store']);
        Route::put('annonces/{annonce}',    [AnnonceController::class, 'update']);
        Route::patch('annonces/{annonce}',  [AnnonceController::class, 'update']);
        Route::delete('annonces/{annonce}', [AnnonceController::class, 'destroy']);
        Route::post('annonces/{annonce}/photos',           [AnnonceController::class, 'uploadPhotos']);
        Route::delete('annonces/{annonce}/photos/{photo}', [AnnonceController::class, 'deletePhoto']);

        // Contrats
        Route::get('contrats',           [ContratController::class, 'index']);
        Route::get('contrats/{contrat}', [ContratController::class, 'show']);
        Route::get('contrats/{contrat}/pdf', [ContratController::class, 'telechargerPdf']);
        Route::post('contrats',          [ContratController::class, 'store']);
        Route::put('contrats/{contrat}',    [ContratController::class, 'update']);
        Route::patch('contrats/{contrat}',  [ContratController::class, 'update']);
        Route::delete('contrats/{contrat}', [ContratController::class, 'destroy']);

        // Clients
        Route::get('clients',            [ClientController::class, 'index']);
        Route::get('clients/{client}',   [ClientController::class, 'show']);
        Route::post('clients',           [ClientController::class, 'store']);
        Route::put('clients/{client}',      [ClientController::class, 'update']);
        Route::patch('clients/{client}',    [ClientController::class, 'update']);
        Route::delete('clients/{client}',   [ClientController::class, 'destroy']);
        Route::post('clients/{client}/renvoyer-acces', [ClientController::class, 'renvoyerAcces']);

        // Dashboard IA
        Route::get('dashboard/suggestions', DashboardSuggestionsController::class);

        // Prospects
        Route::get('prospects/{prospect}/suggestions', ProspectSuggestionsController::class);
        Route::get('prospects',          [ProspectController::class, 'index']);
        Route::get('prospects/{prospect}', [ProspectController::class, 'show']);
        Route::post('prospects',           [ProspectController::class, 'store']);
        Route::put('prospects/{prospect}',    [ProspectController::class, 'update']);
        Route::patch('prospects/{prospect}',  [ProspectController::class, 'update']);
        Route::delete('prospects/{prospect}', [ProspectController::class, 'destroy']);

        // Locations
        Route::get('locations',              [LocationController::class, 'index']);
        Route::get('locations/{location}',   [LocationController::class, 'show']);
        Route::post('locations',             [LocationController::class, 'store']);
        Route::put('locations/{location}',      [LocationController::class, 'update']);
        Route::patch('locations/{location}',    [LocationController::class, 'update']);
        Route::delete('locations/{location}',   [LocationController::class, 'destroy']);

        // États des lieux
        Route::get('etat-lieux',             [EtatLieuController::class, 'index']);
        Route::get('etat-lieux/{etat_lieu}', [EtatLieuController::class, 'show']);
        Route::post('etat-lieux',            [EtatLieuController::class, 'store']);
        Route::put('etat-lieux/{etat_lieu}',    [EtatLieuController::class, 'update']);
        Route::patch('etat-lieux/{etat_lieu}',  [EtatLieuController::class, 'update']);
        Route::delete('etat-lieux/{etat_lieu}', [EtatLieuController::class, 'destroy']);

        // Immeubles
        Route::get('immeubles',              [ImmeubleController::class, 'index']);
        Route::get('immeubles/{immeuble}',   [ImmeubleController::class, 'show']);
        Route::post('immeubles',             [ImmeubleController::class, 'store']);
        Route::put('immeubles/{immeuble}',      [ImmeubleController::class, 'update']);
        Route::patch('immeubles/{immeuble}',    [ImmeubleController::class, 'update']);
        Route::delete('immeubles/{immeuble}',   [ImmeubleController::class, 'destroy']);

        // Visites, tâches, notifications, calendrier
        Route::apiResource('visites', VisiteController::class);
        Route::get('visites-employes',       [VisiteController::class, 'employes']);
        Route::apiResource('taches', TacheController::class)
            ->only(['index', 'store', 'update', 'destroy'])
            ->parameters(['taches' => 'tache']);
        Route::get('notifications', [NotificationController::class, 'index']);
        Route::get('calendrier',             [CalendrierController::class, 'index']);
    });

    // Routes réservées au gérant de l'organisation uniquement
    Route::middleware('role:organisation')->prefix('org')->group(function () {

        // Actions de statut annonces
        Route::patch('annonces/{annonce}/publier',  [AnnonceController::class, 'publier']);
        Route::patch('annonces/{annonce}/archiver', [AnnonceController::class, 'archiver']);

        // Upload contrat
        Route::post('contrats/{contrat}/fichier', [ContratController::class, 'uploadFichier']);

        // Factures
        Route::apiResource('factures', FactureController::class);
        Route::patch('factures/{facture}/payer', [FactureController::class, 'marquerPayee']);
        Route::get('factures/{facture}/pdf',     [FactureController::class, 'telechargerPdf']);

        // Uploads clients / prospects
        Route::post('clients/{client}/document',     [ClientController::class, 'uploadDocument']);
        Route::post('prospects/{prospect}/document', [ProspectController::class, 'uploadDocument']);

        // Gestion des employés
        Route::apiResource('employes', EmployeController::class);
        Route::get('employes-en-attente',         [EmployeController::class, 'enAttente']);
        Route::post('employes/{employe}/activer', [EmployeController::class, 'activerCompte']);

        // Taux d'investissement
        Route::apiResource('investissements', InvestissementController::class);

        // Statistiques
        Route::get('statistiques/biens',     [StatistiqueController::class, 'biens']);
        Route::get('statistiques/prospects', [StatistiqueController::class, 'prospects']);
        Route::get('statistiques/visites',   [StatistiqueController::class, 'visites']);
        Route::get('statistiques/canaux',    [StatistiqueController::class, 'canaux']);

        // Uploads immeubles
        Route::post('immeubles/{immeuble}/photos',             [ImmeubleController::class, 'uploadPhotos']);
        Route::delete('immeubles/{immeuble}/photos/{photo}',   [ImmeubleController::class, 'deletePhoto']);

        // Assurance + quittances locations
        Route::post('locations/{location}/assurance',                         [LocationController::class, 'uploadAssurance']);
        Route::patch('locations/{location}/quittances/{quittance}/payer',     [LocationController::class, 'payerQuittance']);
    });
});
