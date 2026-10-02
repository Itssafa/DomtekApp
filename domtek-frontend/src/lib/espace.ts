/**
 * Libellés et formatages partagés par les écrans de l'espace client.
 * Regroupés ici pour que les quatre pages parlent d'une seule voix.
 */

export const TYPE_FACTURE_LABELS: Record<string, string> = {
  eau: 'Eau',
  electricite: 'Électricité',
  gaz: 'Gaz',
  electricite_gaz: 'Électricité & Gaz',
  loyer: 'Loyer',
};

export const TYPE_CONTRAT_LABELS: Record<string, string> = {
  bail_habitation: "Bail d'habitation",
  bail_etudiant: 'Bail étudiant',
  bail_professionnel: 'Bail professionnel',
  bail_commercial: 'Bail commercial',
  bail_saisonnier: 'Bail saisonnier',
  loyer: 'Location',
  vente: 'Vente',
  autre: 'Autre',
};

export const PERIODICITE_LABELS: Record<string, string> = {
  mensuel: 'Mensuel',
  bimestriel: 'Bimestriel',
  trimestriel: 'Trimestriel',
  quadrimestriel: 'Quadrimestriel',
  semestriel: 'Semestriel',
  annuel: 'Annuel',
};

/** Badge d'une facture — la couleur porte l'urgence du règlement. */
export const STATUT_FACTURE = {
  payee:      { label: 'Payée',      classes: 'bg-green-50 text-green-700 border-green-200' },
  en_attente: { label: 'À régler',   classes: 'bg-amber-50 text-amber-700 border-amber-200' },
  en_retard:  { label: 'En retard',  classes: 'bg-red-50 text-red-700 border-red-200' },
} as const;

export const STATUT_CONTRAT = {
  actif:   { label: 'Actif',    classes: 'bg-green-50 text-green-700 border-green-200' },
  termine: { label: 'Terminé',  classes: 'bg-gray-100 text-gray-600 border-gray-200' },
  resilie: { label: 'Résilié',  classes: 'bg-red-50 text-red-700 border-red-200' },
} as const;

export const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export const fmtMontant = (m?: number | null) =>
  m === null || m === undefined
    ? '—'
    : new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(m) + ' DT';

/** Une échéance dépassée sur une facture non réglée mérite d'être signalée. */
export const estEnRetard = (f: { statut: string; date_echeance: string | null }) =>
  f.statut !== 'payee' && !!f.date_echeance && new Date(f.date_echeance) < new Date();
