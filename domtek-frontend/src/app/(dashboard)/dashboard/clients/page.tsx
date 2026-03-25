'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Client, PaginatedResponse } from '@/types';

export default function ClientsPage() {
  const [data, setData] = useState<PaginatedResponse<Client> | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState<number | null>(null);

  const fetchClients = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    params.set('page', String(page));
    api.get<PaginatedResponse<Client>>(`/org/clients?${params}`)
      .then(({ data: res }) => setData(res))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, page]);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  const handleDelete = async (id: number, nom: string) => {
    if (!confirm(`Supprimer "${nom}" ?`)) return;
    setDeleting(id);
    try {
      await api.delete(`/org/clients/${id}`);
      fetchClients();
    } catch { /* noop */ }
    finally { setDeleting(null); }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Clients</h1>
          <p className="text-gray-500 text-sm">CRM — Fiche clients</p>
        </div>
        <Link href="/dashboard/clients/nouveau"
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition">
          + Nouveau client
        </Link>
      </div>

      <div className="mb-6">
        <input type="text" placeholder="Rechercher par nom, email ou téléphone…" value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-80" />
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Chargement…</div>
        ) : !data?.data.length ? (
          <div className="p-8 text-center text-gray-400 text-sm">Aucun client.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Nom</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Email</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Téléphone</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Ville</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.data.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <Link href={`/dashboard/clients/${c.id}`} className="font-medium text-gray-800 hover:text-blue-600">
                      {c.nom_complet}
                    </Link>
                    {c.cin && <p className="text-xs text-gray-400">CIN : {c.cin}</p>}
                  </td>
                  <td className="px-5 py-3 text-gray-600">{c.email ?? '—'}</td>
                  <td className="px-5 py-3 text-gray-600">{c.telephone ?? '—'}</td>
                  <td className="px-5 py-3 text-gray-600">{c.ville ?? '—'}</td>
                  <td className="px-5 py-3">
                    <div className="flex gap-2">
                      <Link href={`/dashboard/clients/${c.id}`} className="text-xs text-blue-600 hover:underline">Voir/Modifier</Link>
                      <button onClick={() => handleDelete(c.id, c.nom_complet)} disabled={deleting === c.id}
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
