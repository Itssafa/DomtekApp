'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from '@/components/OrgLink';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { PaginatedResponse } from '@/types';

interface Location {
  id: number;
  locataire_nom: string;
  locataire_type: 'client' | 'prospect' | 'nouveau';
  designation: string | null;
  type: string;
  statut: 'actif' | 'expire' | 'resilie';
  date_debut: string;
  date_fin: string | null;
  montant_paiement: number;
  periodicite: string;
  bien: { id: number; designation: string; ville: string | null } | null;
  created_at: string;
}

const typeLabel: Record<string, string> = {
  bail_habitation:   'Bail habitation',
  bail_etudiant:     'Bail étudiant',
  bail_professionnel:'Bail professionnel',
  bail_commercial:   'Bail commercial',
  bail_saisonnier:   'Bail saisonnier',
  loyer:             'Loyer',
};

const statutCls: Record<string, string> = {
  actif:   'bg-green-100 text-green-700',
  expire:  'bg-amber-100 text-amber-700',
  resilie: 'bg-red-100 text-red-600',
};
const statutLabel: Record<string, string> = {
  actif: 'Actif', expire: 'Expiré', resilie: 'Résilié',
};

const periodiciteLabel: Record<string, string> = {
  mensuel: '/mois', trimestriel: '/trim.', semestriel: '/sem.', annuel: '/an',
};

export default function LocationsPage() {
  const { role } = useAuthStore();
  const isEmploye = role === 'employe';

  const [data, setData]       = useState<PaginatedResponse<Location> | null>(null);
  const [loading, setLoading] = useState(true);
  const [statut, setStatut]   = useState('');
  const [page, setPage]       = useState(1);

  const fetchLocations = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (statut) params.set('statut', statut);
    api.get<PaginatedResponse<Location>>(`/org/locations?${params}`)
      .then(({ data: res }) => setData(res))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [statut, page]);

  useEffect(() => { fetchLocations(); }, [fetchLocations]);

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cette location ?')) return;
    await api.delete(`/org/locations/${id}`).catch(() => {});
    fetchLocations();
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Locations</h1>
          <p className="text-gray-500 text-sm">Gestion des contrats de location et quittances</p>
        </div>
        {!isEmploye && (
          <Link href="/dashboard/locations/nouvelle"
            className="px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition">
            + Nouvelle location
          </Link>
        )}
      </div>

      {/* Filtre statut */}
      <div className="flex gap-2 mb-6">
        {(['', 'actif', 'expire', 'resilie'] as const).map((s) => (
          <button key={s} onClick={() => { setStatut(s); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition ${
              statut === s ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}>
            {s === '' ? 'Toutes' : statutLabel[s]}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Chargement…</div>
        ) : !data?.data.length ? (
          <div className="p-8 text-center text-gray-400 text-sm">Aucune location.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Locataire</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Bien</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Type</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Loyer</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Période</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Statut</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.data.map((loc) => (
                <tr key={loc.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-800">{loc.locataire_nom || '—'}</td>
                  <td className="px-5 py-3 text-gray-600">{loc.bien?.designation ?? '—'}</td>
                  <td className="px-5 py-3 text-gray-500 text-xs">{typeLabel[loc.type] ?? loc.type}</td>
                  <td className="px-5 py-3 text-gray-800 font-medium">
                    {Number(loc.montant_paiement).toLocaleString('fr-TN', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} DT
                    <span className="text-xs text-gray-400 ml-1">{periodiciteLabel[loc.periodicite]}</span>
                  </td>
                  <td className="px-5 py-3 text-gray-500 text-xs">
                    {new Date(loc.date_debut).toLocaleDateString('fr-FR')}
                    {loc.date_fin ? ` → ${new Date(loc.date_fin).toLocaleDateString('fr-FR')}` : ' (ouvert)'}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statutCls[loc.statut]}`}>
                      {statutLabel[loc.statut]}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex gap-3 items-center flex-wrap">
                      <Link href={`/dashboard/locations/${loc.id}`}
                        className="text-xs text-violet-600 hover:underline font-medium">
                        Détail
                      </Link>
                      <Link href={`/dashboard/etat-lieux/nouveau?location_id=${loc.id}`}
                        className="text-xs text-teal-600 hover:underline font-medium">
                        État des lieux
                      </Link>
                      {!isEmploye && (
                        <>
                          <Link href={`/dashboard/locations/${loc.id}/modifier`}
                            className="text-xs text-blue-500 hover:underline">Modifier</Link>
                          <button onClick={() => handleDelete(loc.id)}
                            className="text-xs text-red-500 hover:underline">Supprimer</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {data && data.meta.last_page > 1 && (
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between text-sm text-gray-600">
            <span>{data.meta.from}–{data.meta.to} sur {data.meta.total}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50">←</button>
              <button onClick={() => setPage(p => Math.min(data.meta.last_page, p + 1))} disabled={page === data.meta.last_page}
                className="px-3 py-1 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50">→</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
