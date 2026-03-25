'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import { Annonce, PaginatedResponse } from '@/types';

const STATUT_STYLES: Record<string, string> = {
  brouillon: 'bg-gray-100 text-gray-600',
  planifiee: 'bg-blue-100 text-blue-700',
  publiee: 'bg-green-100 text-green-700',
  archivee: 'bg-red-100 text-red-600',
};

const STATUT_LABELS: Record<string, string> = {
  brouillon: 'Brouillon',
  planifiee: 'Planifiée',
  publiee: 'Publiée',
  archivee: 'Archivée',
};

export default function OrgAnnoncesPage() {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<PaginatedResponse<Annonce> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    api
      .get<PaginatedResponse<Annonce>>(`/admin/organisations/${slug}/annonces?page=${page}`)
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
        <h2 className="text-sm font-semibold text-gray-700">Annonces</h2>
      </div>
      {!data?.data.length ? (
        <p className="p-6 text-sm text-gray-400 text-center">Aucune annonce trouvée.</p>
      ) : (
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-5 py-3 font-medium text-gray-600">Titre</th>
              <th className="text-left px-5 py-3 font-medium text-gray-600">Statut</th>
              <th className="text-left px-5 py-3 font-medium text-gray-600">Date publication</th>
              <th className="text-left px-5 py-3 font-medium text-gray-600">Créée le</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.data.map((a) => (
              <tr key={a.id} className="hover:bg-gray-50">
                <td className="px-5 py-3">
                  <p className="font-medium text-gray-800">{a.titre}</p>
                  {a.bien && <p className="text-xs text-gray-400">{a.bien.titre}</p>}
                </td>
                <td className="px-5 py-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUT_STYLES[a.statut] ?? 'bg-gray-100 text-gray-600'}`}>
                    {STATUT_LABELS[a.statut] ?? a.statut}
                  </span>
                </td>
                <td className="px-5 py-3 text-gray-500">
                  {a.date_publication
                    ? new Date(a.date_publication).toLocaleDateString('fr-FR')
                    : <span className="text-gray-300">—</span>}
                </td>
                <td className="px-5 py-3 text-gray-500">
                  {new Date(a.created_at).toLocaleDateString('fr-FR')}
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
