'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { EspaceResume, EspaceAgence, EspaceFacture } from '@/types';
import { fmtMontant, fmtDate, TYPE_FACTURE_LABELS, STATUT_FACTURE, estEnRetard } from '@/lib/espace';

export default function EspaceAccueilPage() {
  const [resume, setResume]     = useState<EspaceResume | null>(null);
  const [agences, setAgences]   = useState<EspaceAgence[]>([]);
  const [impayees, setImpayees] = useState<EspaceFacture[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [r, f] = await Promise.all([
          api.get('/client/resume'),
          api.get('/client/factures', { params: { statut: 'impayees', per_page: 5 } }),
        ]);
        setResume(r.data.resume);
        setAgences(r.data.agences);
        setImpayees(f.data.data);
      } catch { /* l'écran reste vide plutôt que de casser */ }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-48 bg-gray-200 rounded" />
        <div className="grid grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => <div key={i} className="h-24 bg-gray-100 rounded-xl" />)}
        </div>
        <div className="h-40 bg-gray-100 rounded-xl" />
      </div>
    );
  }

  // Compte créé par inscription spontanée, qu'aucune agence n'a encore
  // rattaché à une fiche client : l'espace n'a rien à montrer.
  if (agences.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center max-w-xl mx-auto">
        <h1 className="text-lg font-bold text-gray-900 mb-2">Votre espace est prêt</h1>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
          Aucune agence ne vous a encore rattaché de contrat. Dès qu&apos;un contrat
          sera signé à votre nom, vous le retrouverez ici avec vos factures.
        </p>
        <Link href="/annonces"
          className="inline-block px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition">
          Parcourir les annonces
        </Link>
      </div>
    );
  }

  const stats = [
    { label: 'Contrats actifs',   valeur: String(resume?.contrats_actifs ?? 0),        accent: 'text-gray-900' },
    { label: 'Factures à régler', valeur: String(resume?.factures_impayees ?? 0),      accent: (resume?.factures_impayees ?? 0) > 0 ? 'text-amber-600' : 'text-gray-900' },
    { label: 'Montant dû',        valeur: fmtMontant(resume?.montant_du ?? 0),         accent: (resume?.montant_du ?? 0) > 0 ? 'text-amber-600' : 'text-gray-900' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Votre espace</h1>
        <p className="text-sm text-gray-500 mt-1">
          Retrouvez ici vos contrats et vos factures.
        </p>
      </div>

      {/* Chiffres de tête */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1.5">{s.label}</p>
            <p className={`text-2xl font-bold ${s.accent}`}>{s.valeur}</p>
          </div>
        ))}
      </div>

      {/* Factures en attente de règlement */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700">À régler</h2>
          <Link href="/espace/factures" className="text-xs text-blue-600 hover:underline">
            Toutes mes factures →
          </Link>
        </div>

        {impayees.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <p className="text-sm text-gray-500">Vous n&apos;avez aucune facture en attente.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {impayees.map((f) => {
              const retard = estEnRetard(f);
              const badge  = retard ? STATUT_FACTURE.en_retard : STATUT_FACTURE.en_attente;
              return (
                <div key={f.id} className="flex items-center gap-4 p-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {TYPE_FACTURE_LABELS[f.type] ?? f.type}
                        {f.reference && <span className="text-gray-400 font-normal"> · {f.reference}</span>}
                      </p>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${badge.classes}`}>
                        {badge.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">
                      Échéance {fmtDate(f.date_echeance)}
                      {f.organisation && ` · ${f.organisation.nom}`}
                    </p>
                  </div>

                  <p className="text-sm font-bold text-gray-900 whitespace-nowrap">{fmtMontant(f.montant)}</p>

                  {f.payment_url && (
                    <a href={f.payment_url}
                      className="shrink-0 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition">
                      Payer
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Agences de rattachement — l'interlocuteur du client en cas de question */}
      {agences.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">
            {agences.length > 1 ? 'Vos agences' : 'Votre agence'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {agences.map((a) => (
              <div key={a.client_id} className="bg-white rounded-xl border border-gray-200 p-5">
                <p className="text-sm font-semibold text-gray-800">{a.agence?.nom ?? '—'}</p>
                <div className="mt-2 space-y-1 text-xs text-gray-500">
                  {a.agence?.telephone && <p>{a.agence.telephone}</p>}
                  {a.agence?.email && <p>{a.agence.email}</p>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
