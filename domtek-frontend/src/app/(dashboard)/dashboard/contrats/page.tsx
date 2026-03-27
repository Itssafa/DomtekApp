'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Contrat, PaginatedResponse } from '@/types';

const STATUT_STYLES: Record<string, string> = {
  actif: 'bg-green-100 text-green-700',
  termine: 'bg-gray-100 text-gray-600',
  resilie: 'bg-red-100 text-red-600',
};

export default function ContratsPage() {
  const [data, setData] = useState<PaginatedResponse<Contrat> | null>(null);
  const [loading, setLoading] = useState(true);
  const [statut, setStatut] = useState('');
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [downloading, setDownloading] = useState<number | null>(null);

  const fetchContrats = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statut) params.set('statut', statut);
    if (type) params.set('type', type);
    params.set('page', String(page));
    api.get<PaginatedResponse<Contrat>>(`/org/contrats?${params}`)
      .then(({ data: res }) => setData(res))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [statut, type, page]);

  useEffect(() => { fetchContrats(); }, [fetchContrats]);

  const handleDownloadPdf = async (id: number) => {
    setDownloading(id);
    try {
      const res = await api.get(`/org/contrats/${id}/pdf`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `contrat-${id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { /* noop */ }
    finally { setDownloading(null); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer ce contrat ?')) return;
    setDeleting(id);
    try {
      await api.delete(`/org/contrats/${id}`);
      fetchContrats();
    } catch { /* noop */ }
    finally { setDeleting(null); }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Contrats</h1>
          <p className="text-gray-500 text-sm">Vente et location</p>
        </div>
        <Link href="/dashboard/contrats/nouveau"
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition">
          + Nouveau contrat
        </Link>
      </div>

      <div className="flex gap-3 mb-6">
        <select value={type} onChange={(e) => { setType(e.target.value); setPage(1); }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Tous types</option>
          <option value="vente">Vente</option>
          <option value="loyer">Location</option>
        </select>
        <select value={statut} onChange={(e) => { setStatut(e.target.value); setPage(1); }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Tous statuts</option>
          <option value="actif">Actif</option>
          <option value="termine">Terminé</option>
          <option value="resilie">Résilié</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Chargement…</div>
        ) : !data?.data.length ? (
          <div className="p-8 text-center text-gray-400 text-sm">Aucun contrat.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Bien</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Clients</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Type</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Montant</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Date début</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Statut</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.data.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 text-gray-800 font-medium">{c.bien?.titre ?? '—'}</td>
                  <td className="px-5 py-3 text-gray-600">{c.clients?.map(cl => cl.nom_complet).join(', ') ?? '—'}</td>
                  <td className="px-5 py-3 text-gray-600 capitalize">{c.type === 'loyer' ? 'Location' : 'Vente'}</td>
                  <td className="px-5 py-3 font-medium text-gray-800">{Number(c.montant).toLocaleString('fr-TN')} TND</td>
                  <td className="px-5 py-3 text-gray-500">{new Date(c.date_debut).toLocaleDateString('fr-FR')}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUT_STYLES[c.statut]}`}>
                      {c.statut.charAt(0).toUpperCase() + c.statut.slice(1)}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex gap-2">
                      <Link href={`/dashboard/contrats/${c.id}`} className="text-xs text-blue-600 hover:underline">Modifier</Link>
                      <button onClick={() => handleDownloadPdf(c.id)} disabled={downloading === c.id}
                        className="text-xs text-emerald-600 hover:underline disabled:opacity-40">
                        {downloading === c.id ? '…' : 'PDF'}
                      </button>
                      <button onClick={() => handleDelete(c.id)} disabled={deleting === c.id}
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
