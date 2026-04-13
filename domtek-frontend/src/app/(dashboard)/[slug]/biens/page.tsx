'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from '@/components/OrgLink';
import api from '@/lib/api';
import { Bien, PaginatedResponse } from '@/types';

const STATUT_STYLES: Record<string, string> = {
  disponible:   'bg-green-100 text-green-700',
  vendu:        'bg-gray-100 text-gray-500',
  loue:         'bg-blue-100 text-blue-700',
  indisponible: 'bg-red-100 text-red-600',
};
const STATUT_LABELS: Record<string, string> = {
  disponible: 'Disponible', vendu: 'Vendu', loue: 'Loué', indisponible: 'Indisponible',
};
const TRANSACTION_STYLES: Record<string, string> = {
  vente: 'bg-orange-500', loyer: 'bg-blue-500',
};
const TRANSACTION_LABELS: Record<string, string> = {
  vente: 'Vente', loyer: 'Location',
};

const PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-size='14' font-family='sans-serif'%3EAucune photo%3C/text%3E%3C/svg%3E";

export default function BiensPage() {
  const [data, setData]                     = useState<PaginatedResponse<Bien> | null>(null);
  const [loading, setLoading]               = useState(true);
  const [search, setSearch]                 = useState('');
  const [typeTransaction, setTypeTransaction] = useState('');
  const [page, setPage]                     = useState(1);
  const [deleting, setDeleting]             = useState<number | null>(null);

  const fetchBiens = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (typeTransaction) params.set('type_transaction', typeTransaction);
    params.set('page', String(page));
    api.get<PaginatedResponse<Bien>>(`/org/biens?${params}`)
      .then(({ data: res }) => setData(res))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, typeTransaction, page]);

  useEffect(() => { fetchBiens(); }, [fetchBiens]);

  const handleDelete = async (id: number, titre: string) => {
    if (!confirm(`Supprimer "${titre}" ?`)) return;
    setDeleting(id);
    try { await api.delete(`/org/biens/${id}`); fetchBiens(); }
    catch { /* noop */ } finally { setDeleting(null); }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Biens immobiliers</h1>
          <p className="text-gray-500 text-sm">
            {data ? `${data.meta.total} bien${data.meta.total > 1 ? 's' : ''}` : 'Gérez vos biens'}
          </p>
        </div>
        <Link href="/dashboard/biens/nouveau"
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition">
          + Nouveau bien
        </Link>
      </div>

      {/* Filtres */}
      <div className="flex gap-3 mb-6">
        <input type="text" placeholder="Rechercher…" value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64" />
        <select value={typeTransaction} onChange={(e) => { setTypeTransaction(e.target.value); setPage(1); }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Tous types</option>
          <option value="vente">Vente</option>
          <option value="loyer">Location</option>
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
          Aucun bien trouvé.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {data.data.map((b) => (
            <div key={b.id} className="bg-white rounded-xl shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
              {/* Photo */}
              <div className="relative h-44 overflow-hidden bg-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={b.image_principale?.url ?? PLACEHOLDER}
                  alt={b.titre}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {/* Badge transaction */}
                <span className={`absolute top-2 left-2 text-xs text-white font-medium px-2 py-0.5 rounded-full ${TRANSACTION_STYLES[b.type_transaction]}`}>
                  {TRANSACTION_LABELS[b.type_transaction]}
                </span>
                {/* Badge statut */}
                <span className={`absolute top-2 right-2 text-xs font-medium px-2 py-0.5 rounded-full ${STATUT_STYLES[b.statut]}`}>
                  {STATUT_LABELS[b.statut]}
                </span>
              </div>

              {/* Infos */}
              <div className="p-4">
                <p className="font-semibold text-gray-800 truncate">{b.titre}</p>
                <p className="text-xs text-gray-400 capitalize mt-0.5">{b.type_bien}{b.ville ? ` · ${b.ville}` : ''}</p>

                {/* Prix */}
                <p className="text-blue-600 font-bold mt-2 text-sm">
                  {Number(b.prix).toLocaleString('fr-TN')} TND
                  {b.type_transaction === 'loyer' && <span className="text-gray-400 font-normal text-xs">/mois</span>}
                </p>

                {/* Détails */}
                <div className="flex gap-3 mt-2 text-xs text-gray-500">
                  {b.superficie && <span>{b.superficie} m²</span>}
                  {b.nb_pieces  && <span>{b.nb_pieces} pièces</span>}
                  {b.etage != null && <span>Étage {b.etage}</span>}
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                  <Link href={`/dashboard/biens/${b.id}`}
                    className="flex-1 text-center text-xs text-blue-600 hover:text-blue-700 font-medium py-1.5 rounded-lg hover:bg-blue-50 transition">
                    Modifier
                  </Link>
                  <button onClick={() => handleDelete(b.id, b.titre)} disabled={deleting === b.id}
                    className="flex-1 text-center text-xs text-red-500 hover:text-red-600 font-medium py-1.5 rounded-lg hover:bg-red-50 transition disabled:opacity-40">
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          ))}
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
