'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { EspaceFacture } from '@/types';
import { fmtMontant, fmtDate, TYPE_FACTURE_LABELS, STATUT_FACTURE, estEnRetard } from '@/lib/espace';

const FILTRES = [
  { valeur: '',          label: 'Toutes' },
  { valeur: 'impayees',  label: 'À régler' },
  { valeur: 'payee',     label: 'Payées' },
];

export default function MesFacturesPage() {
  const [factures, setFactures] = useState<EspaceFacture[]>([]);
  const [statut, setStatut]     = useState('');
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get('/client/factures', { params: { statut: statut || undefined, per_page: 50 } })
      .then(({ data }) => setFactures(data.data))
      .catch(() => setFactures([]))
      .finally(() => setLoading(false));
  }, [statut]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mes factures</h1>
        <p className="text-sm text-gray-500 mt-1">
          Réglez en ligne vos factures en attente.
        </p>
      </div>

      <div className="flex gap-2">
        {FILTRES.map((f) => (
          <button key={f.valeur} onClick={() => setStatut(f.valeur)}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg border transition ${
              statut === f.valeur
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2 animate-pulse">
          {[0, 1, 2].map((i) => <div key={i} className="h-20 bg-gray-100 rounded-xl" />)}
        </div>
      ) : factures.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-sm text-gray-500">Aucune facture à afficher.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {factures.map((f) => {
            const badge = f.statut === 'payee'
              ? STATUT_FACTURE.payee
              : estEnRetard(f) ? STATUT_FACTURE.en_retard : STATUT_FACTURE.en_attente;

            return (
              <div key={f.id} className="flex items-center gap-4 p-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {TYPE_FACTURE_LABELS[f.type] ?? f.type}
                      {f.reference && <span className="text-gray-400 font-normal"> · {f.reference}</span>}
                    </p>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${badge.classes}`}>
                      {badge.label}
                    </span>
                  </div>

                  <p className="text-xs text-gray-400">
                    Émise le {fmtDate(f.date_emission)} · Échéance {fmtDate(f.date_echeance)}
                  </p>

                  {(f.periode_debut || f.periode_fin) && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      Période : {fmtDate(f.periode_debut)} → {fmtDate(f.periode_fin)}
                    </p>
                  )}

                  {f.contrat?.bien && (
                    <p className="text-xs text-gray-400 mt-0.5 truncate">
                      {f.contrat.bien.designation}
                      {f.contrat.bien.ville && ` · ${f.contrat.bien.ville}`}
                    </p>
                  )}
                </div>

                <p className="text-sm font-bold text-gray-900 whitespace-nowrap">{fmtMontant(f.montant)}</p>

                {f.payment_url ? (
                  <a href={f.payment_url}
                    className="shrink-0 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition">
                    Payer
                  </a>
                ) : (
                  <span className="shrink-0 w-[62px]" aria-hidden />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
