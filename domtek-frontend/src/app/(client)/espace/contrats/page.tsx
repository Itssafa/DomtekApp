'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { EspaceContrat } from '@/types';
import { fmtMontant, fmtDate, TYPE_CONTRAT_LABELS, STATUT_CONTRAT } from '@/lib/espace';

export default function MesContratsPage() {
  const [contrats, setContrats] = useState<EspaceContrat[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    api.get('/client/contrats', { params: { per_page: 50 } })
      .then(({ data }) => setContrats(data.data))
      .catch(() => setContrats([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-2 animate-pulse">
        <div className="h-8 w-48 bg-gray-200 rounded mb-6" />
        {[0, 1].map((i) => <div key={i} className="h-28 bg-gray-100 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mes contrats</h1>
        <p className="text-sm text-gray-500 mt-1">
          Vos baux et actes de vente, en cours et passés.
        </p>
      </div>

      {contrats.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-sm text-gray-500">Aucun contrat à afficher.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {contrats.map((c) => {
            const badge = STATUT_CONTRAT[c.statut] ?? STATUT_CONTRAT.termine;
            return (
              <Link key={c.id} href={`/espace/contrats/${c.id}`}
                className="flex gap-4 bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-sm p-4 transition">

                {c.bien?.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.bien.image} alt=""
                    className="w-24 h-24 object-cover rounded-lg shrink-0 bg-gray-100" />
                ) : (
                  <div className="w-24 h-24 rounded-lg shrink-0 bg-gray-100 flex items-center justify-center">
                    <svg className="w-7 h-7 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {c.designation || c.bien?.designation || `Contrat n°${c.id}`}
                    </p>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border shrink-0 ${badge.classes}`}>
                      {badge.label}
                    </span>
                  </div>

                  <p className="text-xs text-gray-500 mb-2">
                    {TYPE_CONTRAT_LABELS[c.type] ?? c.type}
                    {c.organisation && ` · ${c.organisation.nom}`}
                  </p>

                  {c.bien && (
                    <p className="text-xs text-gray-400 truncate">
                      {[c.bien.adresse, c.bien.ville].filter(Boolean).join(', ') || c.bien.designation}
                    </p>
                  )}

                  <p className="text-xs text-gray-400 mt-1">
                    Du {fmtDate(c.date_debut)}
                    {c.date_fin ? ` au ${fmtDate(c.date_fin)}` : ''}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-gray-900">{fmtMontant(c.montant_ttc ?? c.montant_ht)}</p>
                  {c.periodicite_paiement && (
                    <p className="text-[11px] text-gray-400 mt-0.5">{c.periodicite_paiement}</p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
