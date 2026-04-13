'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from '@/components/OrgLink';
import api from '@/lib/api';
import { EtatLieu, PaginatedResponse } from '@/types';

const TYPE_STYLES: Record<string, string> = {
  entree: 'bg-blue-100 text-blue-700',
  sortie: 'bg-orange-100 text-orange-700',
};

const TYPE_LABELS: Record<string, string> = {
  entree: "État d'entrée",
  sortie: 'État de sortie',
};

export default function EtatLieuxPage() {
  const [data, setData]         = useState<PaginatedResponse<EtatLieu> | null>(null);
  const [loading, setLoading]   = useState(true);
  const [type, setType]         = useState('');
  const [page, setPage]         = useState(1);
  const [deleting, setDeleting] = useState<number | null>(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (type) params.set('type', type);
    params.set('page', String(page));
    api.get<PaginatedResponse<EtatLieu>>(`/org/etat-lieux?${params}`)
      .then(({ data: res }) => setData(res))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [type, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cet état des lieux ?')) return;
    setDeleting(id);
    try {
      await api.delete(`/org/etat-lieux/${id}`);
      fetchData();
    } catch { /* noop */ }
    finally { setDeleting(null); }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">États des lieux</h1>
          <p className="text-gray-500 text-sm">Entrée et sortie des locataires</p>
        </div>
        <Link href="/dashboard/etat-lieux/nouveau"
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition">
          + Nouvel état des lieux
        </Link>
      </div>

      {/* Filtre */}
      <div className="flex gap-3 mb-6">
        <select value={type} onChange={e => { setType(e.target.value); setPage(1); }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Tous types</option>
          <option value="entree">État d'entrée</option>
          <option value="sortie">État de sortie</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Chargement…</div>
        ) : !data?.data.length ? (
          <div className="p-8 text-center text-gray-400 text-sm">Aucun état des lieux.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Désignation</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Type</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Contrat / Bien</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Client</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Date</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Clés remises</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.data.map((e) => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-800">
                    {e.designation ?? `État #${e.id}`}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${TYPE_STYLES[e.type]}`}>
                      {TYPE_LABELS[e.type]}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="text-gray-700">{e.contrat?.designation ?? `Contrat #${e.contrat?.id}`}</div>
                    <div className="text-xs text-gray-400">{e.contrat?.bien?.designation ?? '—'}</div>
                  </td>
                  <td className="px-5 py-3 text-gray-600 text-xs">
                    {e.contrat?.clients?.map(c => c.nom_complet).join(', ') ?? '—'}
                  </td>
                  <td className="px-5 py-3 text-gray-500">
                    {new Date(e.date).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-5 py-3 text-center">
                    {e.remise_cles
                      ? <span className="text-green-600 font-bold text-base">✓</span>
                      : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex gap-2">
                      <Link href={`/dashboard/etat-lieux/${e.id}`}
                        className="text-xs text-blue-600 hover:underline">Modifier</Link>
                      <button onClick={() => handleDelete(e.id)} disabled={deleting === e.id}
                        className="text-xs text-red-600 hover:underline disabled:opacity-40">
                        {deleting === e.id ? '…' : 'Supprimer'}
                      </button>
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
