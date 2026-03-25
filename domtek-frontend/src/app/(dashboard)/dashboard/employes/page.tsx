'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Employe, PaginatedResponse } from '@/types';

export default function EmployesPage() {
  const [data, setData] = useState<PaginatedResponse<Employe> | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statut, setStatut] = useState('');
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState<number | null>(null);

  const fetchEmployes = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (statut) params.set('statut', statut);
    params.set('page', String(page));
    api.get<PaginatedResponse<Employe>>(`/org/employes?${params}`)
      .then(({ data: res }) => setData(res))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, statut, page]);

  useEffect(() => { fetchEmployes(); }, [fetchEmployes]);

  const handleDelete = async (id: number, nom: string) => {
    if (!confirm(`Supprimer "${nom}" ?`)) return;
    setDeleting(id);
    try {
      await api.delete(`/org/employes/${id}`);
      fetchEmployes();
    } catch { /* noop */ }
    finally { setDeleting(null); }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Employés</h1>
          <p className="text-gray-500 text-sm">CRM — Gestion de l'équipe</p>
        </div>
        <Link href="/dashboard/employes/nouveau"
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition">
          + Nouvel employé
        </Link>
      </div>

      <div className="flex gap-3 mb-6">
        <input type="text" placeholder="Rechercher…" value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64" />
        <select value={statut} onChange={(e) => { setStatut(e.target.value); setPage(1); }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Tous</option>
          <option value="actif">Actif</option>
          <option value="inactif">Inactif</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Chargement…</div>
        ) : !data?.data.length ? (
          <div className="p-8 text-center text-gray-400 text-sm">Aucun employé.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Nom</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Email</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Poste</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Embauche</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Statut</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.data.map((e) => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-800">{e.nom_complet}</td>
                  <td className="px-5 py-3 text-gray-600">{e.email ?? '—'}</td>
                  <td className="px-5 py-3 text-gray-600">{e.poste ?? '—'}</td>
                  <td className="px-5 py-3 text-gray-500">
                    {e.date_embauche ? new Date(e.date_embauche).toLocaleDateString('fr-FR') : '—'}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${e.statut === 'actif' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                      {e.statut.charAt(0).toUpperCase() + e.statut.slice(1)}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex gap-2">
                      <Link href={`/dashboard/employes/${e.id}`} className="text-xs text-blue-600 hover:underline">Modifier</Link>
                      <button onClick={() => handleDelete(e.id, e.nom_complet)} disabled={deleting === e.id}
                        className="text-xs text-red-600 hover:underline disabled:opacity-40">Supprimer</button>
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
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50">←</button>
              <button onClick={() => setPage((p) => Math.min(data.meta.last_page, p + 1))} disabled={page === data.meta.last_page}
                className="px-3 py-1 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50">→</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
