'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from '@/components/OrgLink';
import api from '@/lib/api'
import { orgPath } from '@/lib/org-path';
import { useAuthStore } from '@/store/authStore';
import { Facture, PaginatedResponse } from '@/types';
import { InvoiceDoc, printFacture, type FacturePreviewData } from '@/components/FacturePreview';

const STATUT_STYLES: Record<string, string> = {
  en_attente: 'bg-yellow-100 text-yellow-700',
  payee: 'bg-green-100 text-green-700',
  en_retard: 'bg-red-100 text-red-600',
};

const TYPE_LABELS: Record<string, string> = {
  eau:             'Eau',
  electricite:     'Électricité',
  gaz:             'Gaz',
  electricite_gaz: 'Électricité et Gaz',
};

const PRINT_ID = 'facture-list-print-area';

export default function FacturesPage() {
  const router = useRouter();
  const { organisation } = useAuthStore();
  const [data, setData] = useState<PaginatedResponse<Facture> | null>(null);
  const [loading, setLoading] = useState(true);
  const [statut, setStatut] = useState('');
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);
  const [payingId, setPayingId] = useState<number | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [printData, setPrintData] = useState<FacturePreviewData | null>(null);
  const printPending = useRef(false);

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

  /* Déclencher l'impression dès que printData est rendu dans le DOM caché */
  useEffect(() => {
    if (!printData || !printPending.current) return;
    // Laisser React finir le rendu avant d'appeler printFacture
    const t = setTimeout(() => {
      printPending.current = false;
      printFacture(PRINT_ID);
      setDownloadingId(null);
      setPrintData(null);
    }, 80);
    return () => clearTimeout(t);
  }, [printData]);

  const handleDownloadPdf = (f: Facture) => {
    setDownloadingId(f.id);
    printPending.current = true;
    setPrintData({
      reference:    f.reference    ?? '',
      type:         f.type,
      statut:       f.statut,
      montant:      f.montant,
      dateEmission: f.date_emission,
      dateEcheance: f.date_echeance,
      periodeDebut: f.periode_debut ?? '',
      periodeFin:   f.periode_fin   ?? '',
      notes:        f.notes         ?? '',
      orgNom:       organisation?.nom       ?? '',
      orgAdresse:   organisation?.adresse   ?? '',
      orgVille:     organisation?.ville     ?? '',
      orgTelephone: organisation?.telephone ?? '',
      orgEmail:     organisation?.email     ?? '',
      clientNom:    f.client?.nom_complet   ?? '',
      clientAdresse: [f.client?.adresse, f.client?.ville].filter(Boolean).join(', '),
    });
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
          <p className="text-gray-500 text-sm">Eau, électricité et gaz</p>
        </div>
        <Link href="/dashboard/factures/nouvelle"
          className="px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition">
          + Nouvelle facture
        </Link>
      </div>

      <div className="flex gap-3 mb-6">
        <select value={type} onChange={(e) => { setType(e.target.value); setPage(1); }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
          <option value="">Tous types</option>
          <option value="eau">Eau</option>
          <option value="electricite_gaz">Électricité et Gaz</option>
        </select>
        <select value={statut} onChange={(e) => { setStatut(e.target.value); setPage(1); }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
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
                      <Link href={`/dashboard/factures/${f.id}`} className="text-xs text-violet-600 hover:underline">Voir</Link>
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
      {/* Div hors-écran pour générer le PDF depuis la liste */}
      {printData && (
        <div style={{ position: 'fixed', left: '-9999px', top: 0, pointerEvents: 'none', opacity: 0 }}>
          <div id={PRINT_ID}>
            <InvoiceDoc d={printData} />
          </div>
        </div>
      )}
    </div>
  );
}
