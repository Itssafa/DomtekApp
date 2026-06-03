'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import { Bien, PaginatedResponse } from '@/types';

const STATUT_STYLES: Record<string, string> = {
  disponible: 'bg-green-100 text-green-700',
  vendu: 'bg-gray-100 text-gray-600',
  loue: 'bg-blue-100 text-blue-700',
  indisponible: 'bg-red-100 text-red-600',
};

const TYPE_LABELS: Record<string, string> = {
  vente: 'Vente',
  loyer: 'Location',
};

export default function OrgBiensPage() {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<PaginatedResponse<Bien> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    api
      .get<PaginatedResponse<Bien>>(`/admin/organisations/${slug}/biens?page=${page}`)
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
        <h2 className="text-sm font-semibold text-gray-700">Biens immobiliers</h2>
      </div>
      {!data?.data.length ? (
        <p className="p-6 text-sm text-gray-400 text-center">Aucun bien trouvé.</p>
      ) : (
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-5 py-3 font-medium text-gray-600">Titre</th>
              <th className="text-left px-5 py-3 font-medium text-gray-600">Type</th>
              <th className="text-left px-5 py-3 font-medium text-gray-600">Ville</th>
              <th className="text-left px-5 py-3 font-medium text-gray-600">Prix</th>
              <th className="text-left px-5 py-3 font-medium text-gray-600">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.data.map((b) => (
              <tr key={b.id} className="hover:bg-gray-50">
                <td className="px-5 py-3">
                  <p className="font-medium text-gray-800">{b.designation}</p>
                  <p className="text-xs text-gray-400 capitalize">{b.type_bien}</p>
                </td>
                <td className="px-5 py-3 text-gray-600">{TYPE_LABELS[b.type_transaction]}</td>
                <td className="px-5 py-3 text-gray-600">{b.ville ?? '—'}</td>
                <td className="px-5 py-3 font-medium text-gray-800">
                  {Number(b.prix).toLocaleString('fr-TN')} TND
                </td>
                <td className="px-5 py-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUT_STYLES[b.statut] ?? 'bg-gray-100 text-gray-600'}`}>
                    {b.statut.charAt(0).toUpperCase() + b.statut.slice(1)}
                  </span>
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
  );
}
