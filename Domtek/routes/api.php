<?php

use App\Http\Controllers\Api\AuthController;
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
    Route::post('register/organisation', [AuthController::class, 'registerOrganisation']);
    Route::post('register/client',       [AuthController::class, 'registerClient']);
    Route::post('login',                 [AuthController::class, 'login']);
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

    Route::get('auth/me',      [AuthController::class, 'me']);
    Route::post('auth/logout', [AuthController::class, 'logout']);

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
    Route::middleware('role:organisation')->prefix('org')->group(function () {

        // Biens immobiliers
        Route::apiResource('biens', BienController::class);
        Route::post('biens/{bien}/images',                    [BienController::class, 'uploadImages']);
        Route::delete('biens/{bien}/images/{image}',          [BienController::class, 'deleteImage']);
        Route::post('biens/{bien}/documents',                 [BienController::class, 'uploadDocument']);
        Route::delete('biens/{bien}/documents/{document}',    [BienController::class, 'deleteDocument']);

        // Annonces (+ actions de statut + photos)
        Route::apiResource('annonces', AnnonceController::class);
        Route::patch('annonces/{annonce}/publier',             [AnnonceController::class, 'publier']);
        Route::patch('annonces/{annonce}/archiver',            [AnnonceController::class, 'archiver']);
        Route::post('annonces/{annonce}/photos',               [AnnonceController::class, 'uploadPhotos']);
        Route::delete('annonces/{annonce}/photos/{photo}',     [AnnonceController::class, 'deletePhoto']);

        // Contrats (+ téléchargement PDF + upload fichier)
        Route::apiResource('contrats', ContratController::class);
        Route::get('contrats/{contrat}/pdf',      [ContratController::class, 'telechargerPdf']);
        Route::post('contrats/{contrat}/fichier', [ContratController::class, 'uploadFichier']);

        // Factures (+ marquage paiement + téléchargement PDF)
        Route::apiResource('factures', FactureController::class);
        Route::patch('factures/{facture}/payer', [FactureController::class, 'marquerPayee']);
        Route::get('factures/{facture}/pdf',     [FactureController::class, 'telechargerPdf']);

        // CRM Clients (ayant signé un contrat)
        Route::apiResource('clients', ClientController::class);
        Route::post('clients/{client}/document', [ClientController::class, 'uploadDocument']);

        // CRM Prospects
        Route::apiResource('prospects', ProspectController::class);
        Route::post('prospects/{prospect}/document', [ProspectController::class, 'uploadDocument']);

        // CRM Employés
        Route::apiResource('employes', EmployeController::class);

        // Taux d'investissement
        Route::apiResource('investissements', InvestissementController::class);

        // États des lieux
        Route::apiResource('etat-lieux', EtatLieuController::class);

        // Visites
        Route::apiResource('visites', VisiteController::class);

        // Immeubles
        Route::apiResource('immeubles', ImmeubleController::class);
        Route::post('immeubles/{immeuble}/photos',               [ImmeubleController::class, 'uploadPhotos']);
        Route::delete('immeubles/{immeuble}/photos/{photo}',     [ImmeubleController::class, 'deletePhoto']);
    });
});
