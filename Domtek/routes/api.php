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
use App\Http\Controllers\Api\Organisation\LocationController;
use App\Http\Controllers\Api\Organisation\NotificationController;
use App\Http\Controllers\Api\Organisation\StatistiqueController;
use App\Http\Controllers\Api\Organisation\TacheController;
use App\Http\Controllers\Api\Public\AnnonceController as AnnoncePubliqueController;
use App\Http\Controllers\Api\Public\OrganisationController as OrganisationPubliqueController;
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
    Route::post('register/employe',             [AuthController::class, 'registerEmploye']);
    Route::post('login',                 [AuthController::class, 'login']);

    // OAuth Google
    Route::get('google',           [SocialAuthController::class, 'redirectToGoogle']);
    Route::get('google/callback',  [SocialAuthController::class, 'handleGoogleCallback']);
    Route::post('google/prefill',  [SocialAuthController::class, 'prefillFromToken']);

    // Mot de passe oublié
    Route::post('forgot-password', [PasswordResetController::class, 'sendResetLink']);
    Route::post('reset-password',  [PasswordResetController::class, 'resetPassword']);
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
    | FRONTOFFICE — Organisation (agence immobilière)
    |----------------------------------------------------------------------
    */
    // Routes accessibles par l'organisation ET les employés (lecture + tâches)
    Route::middleware('role:organisation,employe')->prefix('org')->group(function () {
        Route::get('biens',              [BienController::class, 'index']);
        Route::get('biens/{bien}',       [BienController::class, 'show']);
        Route::get('annonces',           [AnnonceController::class, 'index']);
        Route::get('annonces/{annonce}', [AnnonceController::class, 'show']);
        Route::get('contrats',           [ContratController::class, 'index']);
        Route::get('contrats/{contrat}', [ContratController::class, 'show']);
        Route::get('contrats/{contrat}/pdf', [ContratController::class, 'telechargerPdf']);
        Route::get('clients',            [ClientController::class, 'index']);
        Route::get('clients/{client}',   [ClientController::class, 'show']);
        Route::get('prospects',          [ProspectController::class, 'index']);
        Route::get('prospects/{prospect}', [ProspectController::class, 'show']);
        Route::get('etat-lieux',         [EtatLieuController::class, 'index']);
        Route::get('etat-lieux/{etat_lieu}', [EtatLieuController::class, 'show']);
        Route::get('immeubles',              [ImmeubleController::class, 'index']);
        Route::get('immeubles/{immeuble}',   [ImmeubleController::class, 'show']);
        Route::apiResource('visites', VisiteController::class);
        Route::get('visites-employes',       [VisiteController::class, 'employes']);
        Route::apiResource('taches', TacheController::class)
            ->only(['index', 'store', 'update', 'destroy'])
            ->parameters(['taches' => 'tache']);
        Route::get('notifications', [NotificationController::class, 'index']);
        Route::get('locations',              [LocationController::class, 'index']);
        Route::get('locations/{location}',   [LocationController::class, 'show']);
    });

    Route::middleware('role:organisation')->prefix('org')->group(function () {

        // Biens immobiliers
        Route::apiResource('biens', BienController::class)->except(['index', 'show']);
        Route::post('biens/{bien}/images',                    [BienController::class, 'uploadImages']);
        Route::delete('biens/{bien}/images/{image}',          [BienController::class, 'deleteImage']);
        Route::post('biens/{bien}/documents',                 [BienController::class, 'uploadDocument']);
        Route::delete('biens/{bien}/documents/{document}',    [BienController::class, 'deleteDocument']);

        // Annonces (+ actions de statut + photos)
        Route::apiResource('annonces', AnnonceController::class)->except(['index', 'show']);
        Route::patch('annonces/{annonce}/publier',             [AnnonceController::class, 'publier']);
        Route::patch('annonces/{annonce}/archiver',            [AnnonceController::class, 'archiver']);
        Route::post('annonces/{annonce}/photos',               [AnnonceController::class, 'uploadPhotos']);
        Route::delete('annonces/{annonce}/photos/{photo}',     [AnnonceController::class, 'deletePhoto']);

        // Contrats (+ upload fichier)
        Route::apiResource('contrats', ContratController::class)->except(['index', 'show']);
        Route::post('contrats/{contrat}/fichier', [ContratController::class, 'uploadFichier']);

        // Factures (+ marquage paiement + téléchargement PDF)
        Route::apiResource('factures', FactureController::class);
        Route::patch('factures/{facture}/payer', [FactureController::class, 'marquerPayee']);
        Route::get('factures/{facture}/pdf',     [FactureController::class, 'telechargerPdf']);

        // CRM Clients
        Route::apiResource('clients', ClientController::class)->except(['index', 'show']);
        Route::post('clients/{client}/document', [ClientController::class, 'uploadDocument']);

        // CRM Prospects
        Route::apiResource('prospects', ProspectController::class)->except(['index', 'show']);
        Route::post('prospects/{prospect}/document', [ProspectController::class, 'uploadDocument']);

        // CRM Employés
        Route::apiResource('employes', EmployeController::class);
        Route::get('employes-en-attente',           [EmployeController::class, 'enAttente']);
        Route::post('employes/{employe}/activer',   [EmployeController::class, 'activerCompte']);

        // Taux d'investissement
        Route::apiResource('investissements', InvestissementController::class);

        // Statistiques analytiques (graphes temps réel)
        Route::get('statistiques/biens',     [StatistiqueController::class, 'biens']);
        Route::get('statistiques/prospects', [StatistiqueController::class, 'prospects']);
        Route::get('statistiques/visites',   [StatistiqueController::class, 'visites']);
        Route::get('statistiques/canaux',    [StatistiqueController::class, 'canaux']);

        // États des lieux
        Route::apiResource('etat-lieux', EtatLieuController::class)->except(['index', 'show']);

        // Immeubles (index + show sont dans le groupe role:organisation,employe)
        Route::apiResource('immeubles', ImmeubleController::class)->except(['index', 'show']);
        Route::post('immeubles/{immeuble}/photos',               [ImmeubleController::class, 'uploadPhotos']);
        Route::delete('immeubles/{immeuble}/photos/{photo}',     [ImmeubleController::class, 'deletePhoto']);

        // Locations
        Route::post('locations',                                                          [LocationController::class, 'store']);
        Route::put('locations/{location}',                                                [LocationController::class, 'update']);
        Route::patch('locations/{location}',                                              [LocationController::class, 'update']);
        Route::delete('locations/{location}',                                             [LocationController::class, 'destroy']);
        Route::post('locations/{location}/assurance',                                     [LocationController::class, 'uploadAssurance']);
        Route::patch('locations/{location}/quittances/{quittance}/payer',                 [LocationController::class, 'payerQuittance']);
    });
});
