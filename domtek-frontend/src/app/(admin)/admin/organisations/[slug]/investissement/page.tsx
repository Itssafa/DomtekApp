'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import { TauxInvestissement, PaginatedResponse } from '@/types';

const PERIODE_LABELS: Record<string, string> = {
  mensuel: 'Mensuel',
  trimestriel: 'Trimestriel',
  annuel: 'Annuel',
};

export default function OrgInvestissementPage() {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<PaginatedResponse<TauxInvestissement> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    api
      .get<PaginatedResponse<TauxInvestissement>>(`/admin/organisations/${slug}/investissements?page=${page}`)
      .then(({ data: res }) => setData(res))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug, page]);

  if (loading) {
    return <div className="animate-pulse h-40 bg-gray-100 rounded-xl" />;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-700">Taux d&apos;investissement</h2>
      </div>
      {!data?.data.length ? (
        <p className="p-6 text-sm text-gray-400 text-center">Aucun taux enregistré.</p>
      ) : (
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-5 py-3 font-medium text-gray-600">Taux</th>
              <th className="text-left px-5 py-3 font-medium text-gray-600">Période</th>
              <th className="text-left px-5 py-3 font-medium text-gray-600">Du</th>
              <th className="text-left px-5 py-3 font-medium text-gray-600">Au</th>
              <th className="text-left px-5 py-3 font-medium text-gray-600">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.data.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="px-5 py-3 font-bold text-blue-600 text-lg">{t.taux}%</td>
                <td className="px-5 py-3 text-gray-600">{PERIODE_LABELS[t.periode] ?? t.periode}</td>
                <td className="px-5 py-3 text-gray-500">{new Date(t.date_debut).toLocaleDateString('fr-FR')}</td>
                <td className="px-5 py-3 text-gray-500">
                  {t.date_fin ? new Date(t.date_fin).toLocaleDateString('fr-FR') : <span className="text-gray-300">—</span>}
                </td>
                <td className="px-5 py-3 text-gray-500">{t.description ?? <span className="text-gray-300">—</span>}</td>
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
  );
}
