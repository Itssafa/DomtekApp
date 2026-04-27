'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from '@/components/OrgLink';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

interface Quittance {
  id: number;
  periode: string;
  date_echeance: string;
  montant: number;
  montant_paye: number | null;
  date_paiement: string | null;
  statut: 'prevu' | 'paye' | 'impaye' | 'partiel' | 'paye_en_retard';
  notes: string | null;
}

interface LocationDetail {
  id: number;
  locataire_nom: string;
  locataire_type: 'client' | 'prospect' | 'nouveau';
  designation: string | null;
  type: string;
  utilisation: string | null;
  statut: 'actif' | 'expire' | 'resilie';
  date_debut: string;
  date_fin: string | null;
  premiere_echeance: string;
  montant_ht: number;
  tva: number;
  montant_ttc: number;
  frais_syndic: number;
  retenue_source: number;
  montant_paiement: number;
  periodicite: string;
  jour_paiement: number;
  depot_garantie: number;
  renouvellement_auto: boolean;
  assurance: string | null;
  assurance_nom: string | null;
  notes: string | null;
  bien: { id: number; designation: string; ville: string | null } | null;
  quittances: Quittance[];
}

const statutQCls: Record<string, string> = {
  prevu:          'bg-blue-100 text-blue-700',
  paye:           'bg-green-100 text-green-700',
  impaye:         'bg-red-100 text-red-600',
  partiel:        'bg-amber-100 text-amber-700',
  paye_en_retard: 'bg-orange-100 text-orange-600',
};
const statutQLabel: Record<string, string> = {
  prevu: 'Prévu', paye: 'Payé', impaye: 'Impayé', partiel: 'Partiel', paye_en_retard: 'Payé en retard',
};

const typeLabel: Record<string, string> = {
  bail_habitation:    'Bail habitation',
  bail_etudiant:      'Bail étudiant',
  bail_professionnel: 'Bail professionnel',
  bail_commercial:    'Bail commercial',
  bail_saisonnier:    'Bail saisonnier',
  loyer:              'Loyer',
};

const periodiciteLabel: Record<string, string> = {
  mensuel: 'Mensuel', trimestriel: 'Trimestriel', semestriel: 'Semestriel', annuel: 'Annuel',
};

export default function LocationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { role } = useAuthStore();
  const isEmploye = role === 'employe';

  const [location,  setLocation]  = useState<LocationDetail | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [payModal,  setPayModal]  = useState<Quittance | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payDate,   setPayDate]   = useState('');
  const [paying,    setPaying]    = useState(false);

  const fetch = useCallback(() => {
    setLoading(true);
    api.get(`/org/locations/${id}`)
      .then(({ data }) => setLocation({ ...data.data, quittances: data.data.quittances ?? [] }))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { fetch(); }, [fetch]);

  const openPayModal = (q: Quittance) => {
    setPayAmount(String(q.montant));
    setPayDate(new Date().toISOString().slice(0, 10));
    setPayModal(q);
  };

  const handlePayer = async () => {
    if (!payModal) return;
    setPaying(true);
    await api.patch(`/org/locations/${id}/quittances/${payModal.id}/payer`, {
      montant_paye:  parseFloat(payAmount),
      date_paiement: payDate,
    }).catch(() => {});
    setPaying(false);
    setPayModal(null);
    fetch();
  };

  if (loading) return <div className="p-8 text-gray-400 text-sm">Chargement…</div>;
  if (!location) return <div className="p-8 text-red-500 text-sm">Location introuvable.</div>;

  const fmt = (n: number) => Number(n).toLocaleString('fr-FR', { minimumFractionDigits: 2 });
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('fr-FR');

  const totalDu    = location.quittances.reduce((s, q) => s + Number(q.montant), 0);
  const totalPaye  = location.quittances.reduce((s, q) => s + Number(q.montant_paye ?? 0), 0);
  const totalSolde = totalDu - totalPaye;

  return (
    <div className="p-8 max-w-5xl mx-auto">

      {/* ── En-tête ── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{location.designation ?? location.locataire_nom}</h1>
          <p className="text-gray-500 text-sm mt-1">
            {typeLabel[location.type]} · {location.bien?.designation ?? '—'}
            {location.bien?.ville ? `, ${location.bien.ville}` : ''}
          </p>
        </div>
        {!isEmploye && (
          <Link href={`/dashboard/locations/${id}/modifier`}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition">
            Modifier
          </Link>
        )}
      </div>

      {/* ── Fiche synthèse ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-3">Locataire</p>
          <p className="text-base font-semibold text-gray-800">{location.locataire_nom}</p>
          <p className="text-xs text-gray-400 mt-1 capitalize">{location.locataire_type}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-3">Loyer</p>
          <p className="text-xl font-bold text-gray-900">{fmt(location.montant_paiement)} <span className="text-sm font-normal text-gray-400">DH</span></p>
          <p className="text-xs text-gray-400 mt-1">{periodiciteLabel[location.periodicite]} · Jour {location.jour_paiement}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-3">Solde</p>
          <p className={`text-xl font-bold ${totalSolde > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {fmt(totalSolde)} <span className="text-sm font-normal text-gray-400">DH</span>
          </p>
          <p className="text-xs text-gray-400 mt-1">Payé : {fmt(totalPaye)} / {fmt(totalDu)} DH</p>
        </div>
      </div>

      {/* ── Détails contrat ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Détails du contrat</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          {[
            ['Type', typeLabel[location.type]],
            ['Statut', location.statut],
            ['Début', fmtDate(location.date_debut)],
            ['Fin', location.date_fin ? fmtDate(location.date_fin) : 'Ouvert'],
            ['1ère échéance', fmtDate(location.premiere_echeance)],
            ['HT', `${fmt(location.montant_ht)} DH`],
            ['TVA', `${location.tva}%`],
            ['TTC', `${fmt(location.montant_ttc)} DH`],
            ['Frais syndic', `${fmt(location.frais_syndic)} DH`],
            ['Retenue source', `${location.retenue_source}%`],
            ['Dépôt garantie', `${fmt(location.depot_garantie)} DH`],
            ['Renouvellement auto', location.renouvellement_auto ? 'Oui' : 'Non'],
            ...(location.utilisation ? [['Utilisation', location.utilisation]] : []),
          ].map(([lbl, val]) => (
            <div key={String(lbl)}>
              <p className="text-xs text-gray-400 mb-0.5">{lbl}</p>
              <p className="font-medium text-gray-800">{val}</p>
            </div>
          ))}
        </div>
        {location.assurance && (
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2">
            <p className="text-xs text-gray-400 mr-1">Assurance :</p>
            <a href={location.assurance} target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-violet-600 hover:underline">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {location.assurance_nom || 'Télécharger'}
            </a>
          </div>
        )}
        {location.notes && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400 mb-1">Notes</p>
            <p className="text-sm text-gray-600 whitespace-pre-line">{location.notes}</p>
          </div>
        )}
      </div>

      {/* ── Quittances ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">Quittances ({location.quittances.length})</h2>
        </div>
        {location.quittances.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">Aucune quittance générée.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Période</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Échéance</th>
                <th className="text-right px-5 py-3 font-medium text-gray-600">Montant</th>
                <th className="text-right px-5 py-3 font-medium text-gray-600">Payé</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Date paiement</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Statut</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {location.quittances.map((q) => (
                <tr key={q.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-800">{q.periode}</td>
                  <td className="px-5 py-3 text-gray-500">{fmtDate(q.date_echeance)}</td>
                  <td className="px-5 py-3 text-right text-gray-800">{fmt(q.montant)}</td>
                  <td className="px-5 py-3 text-right text-gray-600">
                    {q.montant_paye != null ? fmt(q.montant_paye) : '—'}
                  </td>
                  <td className="px-5 py-3 text-gray-500">
                    {q.date_paiement ? fmtDate(q.date_paiement) : '—'}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statutQCls[q.statut]}`}>
                      {statutQLabel[q.statut]}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    {q.statut !== 'paye' && (
                      <button onClick={() => openPayModal(q)}
                        className="text-xs text-violet-600 hover:underline font-medium">
                        Enregistrer paiement
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Modal paiement ── */}
      {payModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-800">Enregistrer un paiement</h2>
              <button onClick={() => setPayModal(null)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-gray-500">
              Période : <strong className="text-gray-800">{payModal.periode}</strong> · Dû : <strong>{fmt(payModal.montant)} DH</strong>
            </p>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Montant payé (DH)</label>
              <input type="number" step="0.01" min="0"
                value={payAmount} onChange={e => setPayAmount(e.target.value)}
                className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Date de paiement</label>
              <input type="date" value={payDate} onChange={e => setPayDate(e.target.value)}
                className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all" />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setPayModal(null)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition">
                Annuler
              </button>
              <button onClick={handlePayer} disabled={paying}
                className="px-5 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition">
                {paying ? 'Enregistrement…' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
