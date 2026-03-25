'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Annonce, PaginatedResponse } from '@/types';

const STATUT_STYLES: Record<string, string> = {
  brouillon: 'bg-gray-100 text-gray-600',
  planifiee: 'bg-blue-100 text-blue-700',
  publiee:   'bg-green-100 text-green-700',
  archivee:  'bg-red-100 text-red-600',
};
const STATUT_LABELS: Record<string, string> = {
  brouillon: 'Brouillon', planifiee: 'Planifiée', publiee: 'Publiée', archivee: 'Archivée',
};

const PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-size='14' font-family='sans-serif'%3EAucune photo%3C/text%3E%3C/svg%3E";

export default function AnnoncesPage() {
  const [data, setData]       = useState<PaginatedResponse<Annonce> | null>(null);
  const [loading, setLoading] = useState(true);
  const [statut, setStatut]   = useState('');
  const [page, setPage]       = useState(1);
  const [actionId, setActionId] = useState<number | null>(null);

  const fetchAnnonces = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statut) params.set('statut', statut);
    params.set('page', String(page));
    api.get<PaginatedResponse<Annonce>>(`/org/annonces?${params}`)
      .then(({ data: res }) => setData(res))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [statut, page]);

  useEffect(() => { fetchAnnonces(); }, [fetchAnnonces]);

  const handleAction = async (id: number, action: 'publier' | 'archiver' | 'delete') => {
    setActionId(id);
    try {
      if (action === 'delete') {
        if (!confirm('Supprimer cette annonce ?')) return;
        await api.delete(`/org/annonces/${id}`);
      } else {
        await api.patch(`/org/annonces/${id}/${action}`);
      }
      fetchAnnonces();
    } catch { /* noop */ }
    finally { setActionId(null); }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Annonces</h1>
          <p className="text-gray-500 text-sm">
            {data ? `${data.meta.total} annonce${data.meta.total > 1 ? 's' : ''}` : 'Gérez vos annonces immobilières'}
          </p>
        </div>
        <Link href="/dashboard/annonces/nouvelle"
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition">
          + Nouvelle annonce
        </Link>
      </div>

      {/* Filtre statut */}
      <div className="flex gap-3 mb-6">
        <select value={statut} onChange={(e) => { setStatut(e.target.value); setPage(1); }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Tous les statuts</option>
          <option value="brouillon">Brouillon</option>
          <option value="planifiee">Planifiée</option>
          <option value="publiee">Publiée</option>
          <option value="archivee">Archivée</option>
        </select>
      </div>

      {/* Grille */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm overflow-hidden animate-pulse">
              <div className="h-44 bg-gray-200" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : !data?.data.length ? (
        <div className="bg-white rounded-xl shadow-sm p-16 text-center text-gray-400 text-sm">
          Aucune annonce trouvée.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {data.data.map((a) => {
            const busy = actionId === a.id;
            const coverUrl = a.photos?.[0]?.url ?? a.bien?.image_principale?.url ?? PLACEHOLDER;
            return (
              <div key={a.id} className="bg-white rounded-xl shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
                {/* Photo */}
                <div className="relative h-44 overflow-hidden bg-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={coverUrl} alt={a.titre}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  {/* Badge statut */}
                  <span className={`absolute top-2 left-2 text-xs font-medium px-2 py-0.5 rounded-full ${STATUT_STYLES[a.statut]}`}>
                    {STATUT_LABELS[a.statut]}
                  </span>
                  {/* Compteur photos */}
                  {(a.photos?.length ?? 0) > 0 && (
                    <span className="absolute bottom-2 right-2 text-xs bg-black/50 text-white px-2 py-0.5 rounded-full">
                      {a.photos!.length} photo{a.photos!.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                {/* Infos */}
                <div className="p-4">
                  <p className="font-semibold text-gray-800 truncate">{a.titre}</p>
                  {a.bien && (
                    <p className="text-xs text-gray-400 mt-0.5 truncate">
                      {a.bien.titre}{a.bien.ville ? ` · ${a.bien.ville}` : ''}
                    </p>
                  )}
                  {a.date_publication && (
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(a.date_publication).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100 flex-wrap">
                    <Link href={`/dashboard/annonces/${a.id}`}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium py-1 px-2 rounded hover:bg-blue-50 transition">
                      Modifier
                    </Link>
                    {(a.statut === 'brouillon' || a.statut === 'planifiee') && (
                      <button onClick={() => handleAction(a.id, 'publier')} disabled={busy}
                        className="text-xs text-green-600 hover:text-green-700 font-medium py-1 px-2 rounded hover:bg-green-50 transition disabled:opacity-40">
                        Publier
                      </button>
                    )}
                    {a.statut === 'publiee' && (
                      <button onClick={() => handleAction(a.id, 'archiver')} disabled={busy}
                        className="text-xs text-orange-600 hover:text-orange-700 font-medium py-1 px-2 rounded hover:bg-orange-50 transition disabled:opacity-40">
                        Archiver
                      </button>
                    )}
                    <button onClick={() => handleAction(a.id, 'delete')} disabled={busy}
                      className="text-xs text-red-500 hover:text-red-600 font-medium py-1 px-2 rounded hover:bg-red-50 transition disabled:opacity-40">
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {data && data.meta.last_page > 1 && (
        <div className="mt-6 flex items-center justify-between text-sm text-gray-600">
          <span>{data.meta.from}–{data.meta.to} sur {data.meta.total}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="px-4 py-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">←</button>
            <button onClick={() => setPage((p) => Math.min(data.meta.last_page, p + 1))} disabled={page === data.meta.last_page}
              className="px-4 py-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">→</button>
          </div>
        </div>
      )}
    </div>
  );
}
