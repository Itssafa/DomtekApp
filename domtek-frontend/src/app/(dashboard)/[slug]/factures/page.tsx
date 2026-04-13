'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from '@/components/OrgLink';
import api from '@/lib/api'
import { orgPath } from '@/lib/org-path';
import { Facture, PaginatedResponse } from '@/types';

const STATUT_STYLES: Record<string, string> = {
  en_attente: 'bg-yellow-100 text-yellow-700',
  payee: 'bg-green-100 text-green-700',
  en_retard: 'bg-red-100 text-red-600',
};

const TYPE_LABELS: Record<string, string> = {
  eau: 'Eau',
  electricite: 'Électricité',
  gaz: 'Gaz',
  electricite_gaz: 'Électricité et Gaz',
  loyer: 'Loyer',
};

export default function FacturesPage() {
  const router = useRouter();
  const [data, setData] = useState<PaginatedResponse<Facture> | null>(null);
  const [loading, setLoading] = useState(true);
  const [statut, setStatut] = useState('');
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);
  const [payingId, setPayingId] = useState<number | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const fetchFactures = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statut) params.set('statut', statut);
    if (type) params.set('type', type);
    params.set('page', String(page));
    api.get<PaginatedResponse<Facture>>(`/org/factures?${params}`)
      .then(({ data: res }) => setData(res))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [statut, type, page]);

  useEffect(() => { fetchFactures(); }, [fetchFactures]);

  const handleDownloadPdf = async (f: Facture) => {
    setDownloadingId(f.id);
    try {
      const res = await api.get(`/org/factures/${f.id}/pdf`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a   = document.createElement('a');
      a.href     = url;
      a.download = `facture-${f.reference ?? f.id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { /* noop */ }
    finally { setDownloadingId(null); }
  };

  const handlePayer = async (id: number) => {
    setPayingId(id);
    try {
      await api.patch(`/org/factures/${id}/payer`);
      fetchFactures();
    } catch { /* noop */ }
    finally { setPayingId(null); }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Factures</h1>
          <p className="text-gray-500 text-sm">Eau, électricité et gaz, loyer</p>
        </div>
        <Link href="/dashboard/factures/nouvelle"
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition">
          + Nouvelle facture
        </Link>
      </div>

      <div className="flex gap-3 mb-6">
        <select value={type} onChange={(e) => { setType(e.target.value); setPage(1); }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Tous types</option>
          <option value="eau">Eau</option>
          <option value="electricite_gaz">Électricité et Gaz</option>
          <option value="loyer">Loyer</option>
        </select>
        <select value={statut} onChange={(e) => { setStatut(e.target.value); setPage(1); }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Tous statuts</option>
          <option value="en_attente">En attente</option>
          <option value="payee">Payée</option>
          <option value="en_retard">En retard</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Chargement…</div>
        ) : !data?.data.length ? (
          <div className="p-8 text-center text-gray-400 text-sm">Aucune facture.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Type</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Client</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Référence</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Montant</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Échéance</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Statut</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.data.map((f) => (
                <tr key={f.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => router.push(orgPath(`/dashboard/factures/${f.id}`))}>
                  <td className="px-5 py-3 text-gray-700">{TYPE_LABELS[f.type] ?? f.type}</td>
                  <td className="px-5 py-3 text-gray-600">{f.client?.nom_complet ?? '—'}</td>
                  <td className="px-5 py-3 text-gray-500 text-xs">{f.reference ?? '—'}</td>
                  <td className="px-5 py-3 font-medium text-gray-800">{Number(f.montant).toLocaleString('fr-TN')} TND</td>
                  <td className="px-5 py-3 text-gray-500">{new Date(f.date_echeance).toLocaleDateString('fr-FR')}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUT_STYLES[f.statut]}`}>
                      {f.statut === 'en_attente' ? 'En attente' : f.statut === 'payee' ? 'Payée' : 'En retard'}
                    </span>
                  </td>
                  <td className="px-5 py-3" onClick={e => e.stopPropagation()}>
                    <div className="flex gap-2 items-center">
                      <button onClick={() => handleDownloadPdf(f)} disabled={downloadingId === f.id}
                        className="text-xs text-gray-500 hover:text-gray-800 disabled:opacity-40 border border-gray-200 rounded px-2 py-1 hover:bg-gray-50 transition"
                        title="Télécharger PDF">
                        {downloadingId === f.id ? '…' : '⬇ PDF'}
                      </button>
                      {f.statut !== 'payee' && (
                        <button onClick={() => handlePayer(f.id)} disabled={payingId === f.id}
                          className="text-xs text-green-600 hover:underline disabled:opacity-40">Marquer payée</button>
                      )}
                      <Link href={`/dashboard/factures/${f.id}`} className="text-xs text-blue-600 hover:underline">Modifier</Link>
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
