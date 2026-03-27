'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Organisation, PaginatedResponse } from '@/types';

const STATUT_LABELS: Record<string, { label: string; color: string }> = {
  active: { label: 'Active', color: 'bg-green-100 text-green-700' },
  en_attente: { label: 'En attente', color: 'bg-yellow-100 text-yellow-700' },
  inactive: { label: 'Inactive', color: 'bg-red-100 text-red-700' },
};

export default function OrganisationsPage() {
  const [data, setData] = useState<PaginatedResponse<Organisation> | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statut, setStatut] = useState('');
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchOrgs = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (statut) params.set('statut', statut);
    params.set('page', String(page));
    params.set('per_page', '15');

    api
      .get<PaginatedResponse<Organisation>>(`/admin/organisations?${params}`)
      .then(({ data: res }) => setData(res))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, statut, page]);

  useEffect(() => {
    fetchOrgs();
  }, [fetchOrgs]);

  const handleStatut = async (id: number, slug: string, action: 'activer' | 'desactiver') => {
    setActionLoading(id);
    try {
      await api.patch(`/admin/organisations/${slug}/${action}`);
      fetchOrgs();
    } catch {
      /* silently fail */
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: number, slug: string, nom: string) => {
    if (!confirm(`Supprimer définitivement "${nom}" ?`)) return;
    setActionLoading(id);
    try {
      await api.delete(`/admin/organisations/${slug}`);
      fetchOrgs();
    } catch {
      /* silently fail */
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Organisations</h1>
          <p className="text-gray-500 text-sm">Gérez les organisations immobilières</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex gap-3 mb-6">
        <input
          type="text"
          placeholder="Rechercher par nom ou ville…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-72"
        />
        <select
          value={statut}
          onChange={(e) => { setStatut(e.target.value); setPage(1); }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Tous les statuts</option>
          <option value="active">Actives</option>
          <option value="en_attente">En attente</option>
          <option value="inactive">Inactives</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Chargement…</div>
        ) : !data?.data.length ? (
          <div className="p-8 text-center text-gray-400 text-sm">Aucune organisation trouvée.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Organisation</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Ville</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Email</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Statut</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.data.map((org) => {
                const badge = STATUT_LABELS[org.statut] ?? { label: org.statut, color: 'bg-gray-100 text-gray-600' };
                const isLoading = actionLoading === org.id;
                return (
                  <tr key={org.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <Link href={`/admin/organisations/${org.slug}`} className="font-medium text-gray-800 hover:text-blue-600">
                        {org.nom}
                      </Link>
                      <p className="text-xs text-gray-400">{org.telephone}</p>
                    </td>
                    <td className="px-5 py-3 text-gray-600">{org.ville}</td>
                    <td className="px-5 py-3 text-gray-600">{org.email}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${badge.color}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/organisations/${org.slug}`}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Voir
                        </Link>
                        {org.statut !== 'active' && (
                          <button
                            onClick={() => handleStatut(org.id, org.slug, 'activer')}
                            disabled={isLoading}
                            className="text-xs text-green-600 hover:underline disabled:opacity-40"
                          >
                            Activer
                          </button>
                        )}
                        {org.statut === 'active' && (
                          <button
                            onClick={() => handleStatut(org.id, org.slug, 'desactiver')}
                            disabled={isLoading}
                            className="text-xs text-orange-600 hover:underline disabled:opacity-40"
                          >
                            Désactiver
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(org.id, org.slug, org.nom)}
                          disabled={isLoading}
                          className="text-xs text-red-600 hover:underline disabled:opacity-40"
                        >
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {data && data.meta.last_page > 1 && (
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between text-sm text-gray-600">
            <span>
              {data.meta.from}–{data.meta.to} sur {data.meta.total}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
              >
                ←
              </button>
              <button
                onClick={() => setPage((p) => Math.min(data.meta.last_page, p + 1))}
                disabled={page === data.meta.last_page}
                className="px-3 py-1 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
              >
                →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
