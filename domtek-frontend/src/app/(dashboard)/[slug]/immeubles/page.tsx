'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from '@/components/OrgLink';
import api from '@/lib/api';
import { Immeuble, PaginatedResponse } from '@/types';

const USAGE_STYLES: Record<string, string> = {
  residentiel:   'bg-green-100 text-green-700',
  professionnel: 'bg-purple-100 text-purple-700',
  mixte:         'bg-orange-100 text-orange-700',
};
const USAGE_LABELS: Record<string, string> = {
  residentiel: 'Résidentiel', professionnel: 'Professionnel', mixte: 'Mixte',
};

const PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-size='14' font-family='sans-serif'%3EAucune photo%3C/text%3E%3C/svg%3E";

export default function ImmeublesPage() {
  const [data, setData]             = useState<PaginatedResponse<Immeuble> | null>(null);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [page, setPage]             = useState(1);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchImmeubles = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    params.set('page', String(page));
    api.get<PaginatedResponse<Immeuble>>(`/org/immeubles?${params}`)
      .then(({ data: res }) => setData(res))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, page]);

  useEffect(() => { fetchImmeubles(); }, [fetchImmeubles]);

  const handleDelete = async (id: number, nom: string) => {
    if (!confirm(`Supprimer l'immeuble "${nom}" ?`)) return;
    setDeletingId(id);
    try { await api.delete(`/org/immeubles/${id}`); fetchImmeubles(); }
    catch { /* noop */ } finally { setDeletingId(null); }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Immeubles</h1>
          <p className="text-gray-500 text-sm">
            {data ? `${data.meta.total} immeuble${data.meta.total > 1 ? 's' : ''}` : 'Gestion du parc immobilier'}
          </p>
        </div>
        <Link href="/dashboard/immeubles/nouveau"
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition">
          + Nouvel immeuble
        </Link>
      </div>

      {/* Recherche */}
      <div className="mb-6">
        <input type="text" placeholder="Rechercher par nom ou ville…" value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-80 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      {/* Grille */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[...Array(6)].map((_, i) => (
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
          Aucun immeuble enregistré.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {data.data.map((imm) => {
            const coverUrl = imm.photos?.[0]?.url ?? PLACEHOLDER;
            return (
              <div key={imm.id} className="bg-white rounded-xl shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
                {/* Photo */}
                <div className="relative h-44 overflow-hidden bg-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={coverUrl} alt={imm.nom}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  {/* Badge usage */}
                  <span className={`absolute top-2 left-2 text-xs font-medium px-2 py-0.5 rounded-full ${USAGE_STYLES[imm.type_usage]}`}>
                    {USAGE_LABELS[imm.type_usage]}
                  </span>
                  {/* Compteur photos */}
                  {(imm.photos_count ?? 0) > 0 && (
                    <span className="absolute bottom-2 right-2 text-xs bg-black/50 text-white px-2 py-0.5 rounded-full">
                      {imm.photos_count} photo{(imm.photos_count ?? 0) > 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                {/* Infos */}
                <div className="p-4">
                  <p className="font-semibold text-gray-800 truncate">{imm.nom}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {imm.type_propriete === 'auto_propriete' ? 'Auto-propriété' : 'Co-propriété'}
                    {imm.ville ? ` · ${imm.ville}` : ''}
                  </p>

                  {/* Stats */}
                  <div className="flex gap-3 mt-2 text-xs text-gray-500">
                    <span>{imm.nb_etages} étage{imm.nb_etages > 1 ? 's' : ''}</span>
                    {imm.a_blocs && <span>{imm.nb_blocs} blocs</span>}
                  </div>

                  {/* Badges équipements */}
                  <div className="flex gap-1 flex-wrap mt-2">
                    {imm.sous_sol && (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Sous-sol</span>
                    )}
                    {imm.cameras_surveillance && (
                      <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">Caméras</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                    <Link href={`/dashboard/immeubles/${imm.id}`}
                      className="flex-1 text-center text-xs text-blue-600 hover:text-blue-700 font-medium py-1.5 rounded-lg hover:bg-blue-50 transition">
                      Modifier
                    </Link>
                    <button onClick={() => handleDelete(imm.id, imm.nom)} disabled={deletingId === imm.id}
                      className="flex-1 text-center text-xs text-red-500 hover:text-red-600 font-medium py-1.5 rounded-lg hover:bg-red-50 transition disabled:opacity-40">
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
