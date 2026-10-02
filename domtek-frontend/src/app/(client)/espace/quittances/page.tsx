'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { EspaceQuittance } from '@/types';
import { fmtMontant, fmtDate } from '@/lib/espace';

const FILTRES = [
  { valeur: '',         label: 'Toutes' },
  { valeur: 'impayees', label: 'À régler' },
  { valeur: 'payees',   label: 'Payées' },
];

/**
 * Le statut est calculé côté serveur (Quittance::computeStatut) parmi
 * prevu | paye | impaye | partiel | paye_en_retard ; on se contente de l'habiller.
 */
const BADGES: Record<string, { label: string; classes: string }> = {
  paye:           { label: 'Payée',            classes: 'bg-green-50 text-green-700 border-green-200' },
  paye_en_retard: { label: 'Payée en retard',  classes: 'bg-green-50 text-green-700 border-green-200' },
  partiel:        { label: 'Partielle',        classes: 'bg-blue-50 text-blue-700 border-blue-200' },
  impaye:         { label: 'En retard',        classes: 'bg-red-50 text-red-700 border-red-200' },
  prevu:          { label: 'À venir',          classes: 'bg-amber-50 text-amber-700 border-amber-200' },
};

const badgeStatut = (q: EspaceQuittance) =>
  BADGES[q.statut] ?? { label: q.statut, classes: 'bg-gray-100 text-gray-600 border-gray-200' };

export default function MesQuittancesPage() {
  const [quittances, setQuittances] = useState<EspaceQuittance[]>([]);
  const [statut, setStatut]         = useState('');
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get('/client/quittances', { params: { statut: statut || undefined } })
      .then(({ data }) => setQuittances(data.data))
      .catch(() => setQuittances([]))
      .finally(() => setLoading(false));
  }, [statut]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mes quittances</h1>
        <p className="text-sm text-gray-500 mt-1">
          Vos échéances de loyer, période par période.
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
      ) : quittances.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-sm text-gray-500">Aucune quittance à afficher.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {quittances.map((q) => {
            const badge = badgeStatut(q);
            return (
              <div key={q.id} className="flex items-center gap-4 p-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-gray-800">{q.periode}</p>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${badge.classes}`}>
                      {badge.label}
                    </span>
                  </div>

                  <p className="text-xs text-gray-400">
                    Échéance {fmtDate(q.date_echeance)}
                    {q.date_paiement && ` · Réglée le ${fmtDate(q.date_paiement)}`}
                  </p>

                  {q.location?.bien && (
                    <p className="text-xs text-gray-400 mt-0.5 truncate">
                      {q.location.bien.designation}
                      {q.location.agence && ` · ${q.location.agence}`}
                    </p>
                  )}
                </div>

                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-gray-900">{fmtMontant(q.montant)}</p>
                  {q.reste_a_payer > 0 && q.montant_paye > 0 && (
                    <p className="text-[11px] text-amber-600 mt-0.5">
                      Reste {fmtMontant(q.reste_a_payer)}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
