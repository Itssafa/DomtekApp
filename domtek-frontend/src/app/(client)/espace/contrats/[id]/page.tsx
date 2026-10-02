'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { EspaceContrat } from '@/types';
import {
  fmtMontant, fmtDate, TYPE_CONTRAT_LABELS, PERIODICITE_LABELS,
  STATUT_CONTRAT, STATUT_FACTURE, TYPE_FACTURE_LABELS, estEnRetard,
} from '@/lib/espace';

const Ligne = ({ label, valeur }: { label: string; valeur?: string | null }) => (
  <div>
    <p className="text-xs text-gray-400 mb-0.5">{label}</p>
    <p className="text-sm text-gray-800 font-medium">{valeur || '—'}</p>
  </div>
);

const Titre = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center gap-3 pt-2">
    <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide whitespace-nowrap">{children}</span>
    <div className="flex-1 h-px bg-gray-200" />
  </div>
);

export default function DetailContratPage() {
  const { id } = useParams<{ id: string }>();
  const [contrat, setContrat] = useState<EspaceContrat | null>(null);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur]   = useState(false);
  const [pdfEnCours, setPdfEnCours] = useState(false);

  // La route PDF exige le token Bearer : un lien direct renverrait un 401.
  // On récupère donc le binaire via l'instance axios, puis on déclenche le
  // téléchargement depuis un blob local.
  const telechargerPdf = async () => {
    setPdfEnCours(true);
    try {
      const { data } = await api.get(`/client/contrats/${id}/pdf`, { responseType: 'blob' });
      const url  = URL.createObjectURL(data as Blob);
      const lien = document.createElement('a');
      lien.href = url;
      lien.download = `contrat-${id}.pdf`;
      lien.click();
      URL.revokeObjectURL(url);
    } catch { /* le bouton se réactive, le client peut réessayer */ }
    finally { setPdfEnCours(false); }
  };

  useEffect(() => {
    api.get(`/client/contrats/${id}`)
      .then(({ data }) => setContrat(data.data))
      .catch(() => setErreur(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />;

  if (erreur || !contrat) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <p className="text-sm text-gray-500 mb-4">Ce contrat est introuvable.</p>
        <Link href="/espace/contrats" className="text-sm text-blue-600 hover:underline">
          ← Retour à mes contrats
        </Link>
      </div>
    );
  }

  const badge = STATUT_CONTRAT[contrat.statut] ?? STATUT_CONTRAT.termine;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/espace/contrats" className="text-sm text-gray-400 hover:text-gray-600">← Retour</Link>
        <div className="flex items-start justify-between gap-4 mt-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">
              {contrat.designation || contrat.bien?.designation || `Contrat n°${contrat.id}`}
            </h1>
            <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full border ${badge.classes}`}>
              {badge.label}
            </span>
          </div>

          <button onClick={telechargerPdf} disabled={pdfEnCours}
            className="shrink-0 flex items-center gap-2 px-3.5 py-2 border border-gray-300 hover:bg-gray-50 disabled:opacity-60 text-gray-700 text-xs font-medium rounded-lg transition">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {pdfEnCours ? 'Préparation…' : 'Télécharger le PDF'}
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-1">{TYPE_CONTRAT_LABELS[contrat.type] ?? contrat.type}</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <Titre>Le bien</Titre>
        {contrat.bien ? (
          <div className="flex gap-4">
            {contrat.bien.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={contrat.bien.image} alt=""
                className="w-32 h-32 object-cover rounded-lg shrink-0 bg-gray-100" />
            )}
            <div className="grid grid-cols-2 gap-4 flex-1">
              <Ligne label="Désignation" valeur={contrat.bien.designation} />
              <Ligne label="Type" valeur={contrat.bien.type_bien} />
              <Ligne label="Adresse" valeur={[contrat.bien.adresse, contrat.bien.ville].filter(Boolean).join(', ')} />
              <Ligne label="Superficie" valeur={contrat.bien.superficie ? `${contrat.bien.superficie} m²` : null} />
              <Ligne label="Pièces" valeur={contrat.bien.nb_pieces ? String(contrat.bien.nb_pieces) : null} />
            </div>
          </div>
        ) : <p className="text-sm text-gray-400">—</p>}

        <Titre>Durée</Titre>
        <div className="grid grid-cols-2 gap-4">
          <Ligne label="Date de début" valeur={fmtDate(contrat.date_debut)} />
          <Ligne label="Date de fin" valeur={contrat.date_fin ? fmtDate(contrat.date_fin) : 'Sans terme'} />
        </div>

        <Titre>Conditions financières</Titre>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Ligne label="Montant HT" valeur={fmtMontant(contrat.montant_ht)} />
          <Ligne label="TVA" valeur={contrat.tva !== null ? `${contrat.tva} %` : null} />
          <Ligne label="Montant TTC" valeur={fmtMontant(contrat.montant_ttc)} />
          <Ligne label="Dépôt de garantie" valeur={fmtMontant(contrat.depot_garantie)} />
          <Ligne label="Périodicité"
            valeur={contrat.periodicite_paiement
              ? PERIODICITE_LABELS[contrat.periodicite_paiement] ?? contrat.periodicite_paiement
              : null} />
          <Ligne label="Jour de paiement"
            valeur={contrat.jour_paiement ? `Le ${contrat.jour_paiement} du mois` : null} />
        </div>

        {contrat.organisation && (
          <>
            <Titre>Votre agence</Titre>
            <div className="grid grid-cols-2 gap-4">
              <Ligne label="Nom" valeur={contrat.organisation.nom} />
              <Ligne label="Téléphone" valeur={contrat.organisation.telephone} />
              <Ligne label="Email" valeur={contrat.organisation.email} />
              <Ligne label="Adresse"
                valeur={[contrat.organisation.adresse, contrat.organisation.ville].filter(Boolean).join(', ')} />
            </div>
          </>
        )}
      </div>

      {/* États des lieux — les relevés qui engagent le client à l'entrée et à la sortie */}
      {!!contrat.etats_lieux?.length && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            États des lieux ({contrat.etats_lieux.length})
          </h2>

          <div className="space-y-3">
            {contrat.etats_lieux.map((e) => (
              <div key={e.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                    e.type === 'entree'
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-purple-50 text-purple-700 border-purple-200'
                  }`}>
                    {e.type === 'entree' ? 'Entrée' : 'Sortie'}
                  </span>
                  <p className="text-sm font-medium text-gray-800">
                    {e.designation || (e.type === 'entree' ? 'État des lieux d\'entrée' : 'État des lieux de sortie')}
                  </p>
                  <span className="text-xs text-gray-400 ml-auto">{fmtDate(e.date)}</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <Ligne label="Relevé eau" valeur={e.releve_eau !== null ? `${e.releve_eau} m³` : null} />
                  <Ligne label="Relevé électricité" valeur={e.releve_electricite !== null ? `${e.releve_electricite} kWh` : null} />
                  <Ligne label="Relevé gaz" valeur={e.releve_gaz !== null ? `${e.releve_gaz} m³` : null} />
                  <Ligne label="Remise des clés" valeur={e.remise_cles ? 'Oui' : 'Non'} />
                </div>

                {e.commentaire && (
                  <p className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-100 whitespace-pre-line">
                    {e.commentaire}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Factures rattachées à ce contrat */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">
          Factures ({contrat.factures?.length ?? 0})
        </h2>

        {!contrat.factures?.length ? (
          <p className="text-sm text-gray-400">Aucune facture pour ce contrat.</p>
        ) : (
          <div className="divide-y divide-gray-100 -my-3">
            {contrat.factures.map((f) => {
              const b = f.statut === 'payee'
                ? STATUT_FACTURE.payee
                : estEnRetard(f) ? STATUT_FACTURE.en_retard : STATUT_FACTURE.en_attente;

              return (
                <div key={f.id} className="flex items-center gap-4 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-gray-800 truncate">
                        {TYPE_FACTURE_LABELS[f.type] ?? f.type}
                        {f.reference && <span className="text-gray-400"> · {f.reference}</span>}
                      </p>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${b.classes}`}>
                        {b.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">Échéance {fmtDate(f.date_echeance)}</p>
                  </div>

                  <p className="text-sm font-semibold text-gray-900 whitespace-nowrap">{fmtMontant(f.montant)}</p>

                  {f.payment_url && (
                    <a href={f.payment_url}
                      className="shrink-0 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition">
                      Payer
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
