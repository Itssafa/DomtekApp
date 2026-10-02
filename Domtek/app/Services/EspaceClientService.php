<?php

namespace App\Services;

use App\Models\Contrat;
use App\Models\Facture;
use App\Models\Quittance;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

/**
 * Lecture seule des données d'un client connecté à son espace.
 *
 * Tout passe par les fiches clients rattachées à son compte : une personne
 * cliente de plusieurs agences voit l'ensemble de ses contrats et factures,
 * toutes agences confondues. Aucune requête n'est exposée sans ce filtrage.
 */
class EspaceClientService
{
    /**
     * Identifiants des fiches clients du compte connecté.
     *
     * @return array<int>
     */
    private function ficheIds(User $user): array
    {
        return $user->clientProfiles()->pluck('id')->all();
    }

    /**
     * Fiches du client, une par agence qui le référence.
     */
    public function profils(User $user): Collection
    {
        return $user->clientProfiles()->with('organisation')->get();
    }

    /**
     * Chiffres de tête affichés sur l'accueil de l'espace.
     *
     * @return array<string, mixed>
     */
    public function resume(User $user): array
    {
        $ficheIds = $this->ficheIds($user);

        $factures = Facture::whereIn('client_id', $ficheIds);

        return [
            'contrats_actifs'    => Contrat::whereHas('clients', fn ($q) => $q->whereIn('clients.id', $ficheIds))
                                        ->where('statut', 'actif')
                                        ->count(),
            'factures_impayees'  => (clone $factures)->where('statut', '!=', Facture::STATUT_PAYEE)->count(),
            'montant_du'         => (float) (clone $factures)->where('statut', '!=', Facture::STATUT_PAYEE)->sum('montant'),
            'agences'            => $user->clientProfiles()->count(),
        ];
    }

    /**
     * Contrats du client, le plus récent d'abord.
     */
    public function contrats(User $user, array $filters = []): LengthAwarePaginator
    {
        $ficheIds = $this->ficheIds($user);

        $query = Contrat::with(['bien', 'organisation'])
            ->whereHas('clients', fn ($q) => $q->whereIn('clients.id', $ficheIds));

        if (!empty($filters['statut'])) {
            $query->where('statut', $filters['statut']);
        }

        $perPage = min((int) ($filters['per_page'] ?? 15), 100);

        return $query->latest('date_debut')->paginate($perPage);
    }

    /**
     * Un contrat précis — introuvable s'il n'appartient pas au client.
     */
    public function contrat(User $user, int $id): Contrat
    {
        $ficheIds = $this->ficheIds($user);

        return Contrat::with(['bien.imagePrincipale', 'organisation', 'factures', 'etatsLieux'])
            ->whereHas('clients', fn ($q) => $q->whereIn('clients.id', $ficheIds))
            ->findOrFail($id);
    }

    /**
     * Quittances de loyer du client.
     *
     * Elles pendent des locations, pas des contrats : le locataire y est
     * désigné par un couple (type, id), d'où le filtre sur `locataire_type`
     * — sans lui, l'identifiant d'un prospect homonyme passerait.
     */
    public function quittances(User $user, array $filters = []): LengthAwarePaginator
    {
        $ficheIds = $this->ficheIds($user);

        $query = Quittance::with(['location.bien', 'location.organisation'])
            ->whereHas('location', fn ($q) => $q
                ->where('locataire_type', 'client')
                ->whereIn('locataire_id', $ficheIds));

        // L'enum des quittances distingue le règlement tardif (`paye_en_retard`)
        // du règlement à l'heure. Pour le client, les deux sont soldés : on
        // regroupe donc plutôt que de refléter la nuance comptable de l'agence.
        $soldees = ['paye', 'paye_en_retard'];

        if (($filters['statut'] ?? null) === 'impayees') {
            $query->whereNotIn('statut', $soldees);
        } elseif (($filters['statut'] ?? null) === 'payees') {
            $query->whereIn('statut', $soldees);
        } elseif (!empty($filters['statut'])) {
            $query->where('statut', $filters['statut']);
        }

        $perPage = min((int) ($filters['per_page'] ?? 50), 100);

        return $query->latest('date_echeance')->paginate($perPage);
    }

    /**
     * Factures du client, les plus récentes d'abord.
     */
    public function factures(User $user, array $filters = []): LengthAwarePaginator
    {
        $query = Facture::with(['organisation', 'contrat.bien'])
            ->whereIn('client_id', $this->ficheIds($user));

        // « impayees » couvre en_attente ET en_retard : du point de vue du
        // client, ces deux statuts désignent la même chose — une somme due.
        if (($filters['statut'] ?? null) === 'impayees') {
            $query->where('statut', '!=', Facture::STATUT_PAYEE);
        } elseif (!empty($filters['statut'])) {
            $query->where('statut', $filters['statut']);
        }

        if (!empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        $perPage = min((int) ($filters['per_page'] ?? 15), 100);

        return $query->latest('date_emission')->paginate($perPage);
    }

    /**
     * Une facture précise — introuvable si elle n'appartient pas au client.
     */
    public function facture(User $user, int $id): Facture
    {
        return Facture::with(['organisation', 'contrat.bien'])
            ->whereIn('client_id', $this->ficheIds($user))
            ->findOrFail($id);
    }
}
