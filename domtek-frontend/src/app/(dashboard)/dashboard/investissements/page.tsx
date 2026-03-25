'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { TauxInvestissement, PaginatedResponse } from '@/types';

const PERIODE_LABELS: Record<string, string> = {
  mensuel: 'Mensuel',
  trimestriel: 'Trimestriel',
  annuel: 'Annuel',
};

const PERIODE_COLORS: Record<string, string> = {
  mensuel: 'bg-blue-100 text-blue-700',
  trimestriel: 'bg-purple-100 text-purple-700',
  annuel: 'bg-orange-100 text-orange-700',
};

export default function InvestissementsPage() {
  const [data, setData] = useState<PaginatedResponse<TauxInvestissement> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState<number | null>(null);

  const fetchTaux = useCallback(() => {
    setLoading(true);
    api
      .get<PaginatedResponse<TauxInvestissement>>(`/org/investissements?page=${page}`)
      .then(({ data: res }) => setData(res))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => { fetchTaux(); }, [fetchTaux]);

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer ce taux ?')) return;
    setDeleting(id);
    try {
      await api.delete(`/org/investissements/${id}`);
      fetchTaux();
    } catch { /* noop */ }
    finally { setDeleting(null); }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Investissements</h1>
          <p className="text-gray-500 text-sm">Taux de rendement par période</p>
        </div>
        <Link
          href="/dashboard/investissements/nouveau"
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition"
        >
          + Nouveau taux
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Chargement…</div>
        ) : !data?.data.length ? (
          <div className="p-8 text-center text-gray-400 text-sm">Aucun taux enregistré.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Taux</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Période</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Du</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Au</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Description</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.data.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <span className="text-2xl font-bold text-blue-600">{t.taux}%</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${PERIODE_COLORS[t.periode] ?? 'bg-gray-100 text-gray-600'}`}>
                      {PERIODE_LABELS[t.periode] ?? t.periode}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-500">
                    {new Date(t.date_debut).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-5 py-3 text-gray-500">
                    {t.date_fin ? new Date(t.date_fin).toLocaleDateString('fr-FR') : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-5 py-3 text-gray-500 text-xs max-w-xs truncate">
                    {t.description ?? <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex gap-2">
                      <Link href={`/dashboard/investissements/${t.id}`} className="text-xs text-blue-600 hover:underline">
                        Modifier
                      </Link>
                      <button
                        onClick={() => handleDelete(t.id)}
                        disabled={deleting === t.id}
                        className="text-xs text-red-600 hover:underline disabled:opacity-40"
                      >
                        Supprimer
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
