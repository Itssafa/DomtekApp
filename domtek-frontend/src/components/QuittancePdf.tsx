'use client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface QuittanceDocData {
  // Quittance
  id: number;
  periode: string;
  date_echeance: string;
  montant: number;
  montant_paye: number | null;
  date_paiement: string | null;
  statut: string;
  notes: string | null;
  // Location
  location_id: number;
  type_bail: string;
  date_debut: string;
  date_fin: string | null;
  periodicite: string;
  jour_paiement: number;
  montant_ht: number;
  tva: number;
  montant_ttc: number;
  frais_syndic: number;
  retenue_source: number;
  depot_garantie: number;
  // Locataire
  locataire_nom: string;
  // Bien
  bien_designation: string;
  bien_ville: string | null;
  // Organisation
  org_nom: string;
  org_adresse: string;
  org_ville: string;
  org_telephone: string;
  org_email: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TYPE_BAIL: Record<string, string> = {
  bail_habitation:    'Bail d\'habitation',
  bail_etudiant:      'Bail étudiant',
  bail_professionnel: 'Bail professionnel',
  bail_commercial:    'Bail commercial',
  bail_saisonnier:    'Bail saisonnier',
  loyer:              'Loyer',
};

const PERIODICITE: Record<string, string> = {
  mensuel:      'Mensuel',
  bimestriel:   'Bimestriel',
  trimestriel:  'Trimestriel',
  quadrimestriel:'Quadrimestriel',
  semestriel:   'Semestriel',
  annuel:       'Annuel',
};

const STATUT_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  prevu:          { bg: '#dbeafe', text: '#1e40af', label: 'Prévu' },
  paye:           { bg: '#d1fae5', text: '#065f46', label: 'Payé' },
  impaye:         { bg: '#fee2e2', text: '#991b1b', label: 'Impayé' },
  partiel:        { bg: '#fef3c7', text: '#92400e', label: 'Partiel' },
  paye_en_retard: { bg: '#ffedd5', text: '#9a3412', label: 'Payé en retard' },
};

function fmtDate(d: string | null) {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }); }
  catch { return d; }
}

function fmtMoney(v: number | null | undefined) {
  if (v == null) return '—';
  return Number(v).toLocaleString('fr-TN', { minimumFractionDigits: 3, maximumFractionDigits: 3 }) + ' DT';
}

// ─── Document A4 ─────────────────────────────────────────────────────────────

export function QuittanceDoc({ d }: { d: QuittanceDocData }) {
  const statut  = STATUT_STYLE[d.statut] ?? STATUT_STYLE.prevu;
  const solde   = Number(d.montant) - Number(d.montant_paye ?? 0);
  const estPaye = d.statut === 'paye' || d.statut === 'paye_en_retard';

  /* Période affichée : "Mars 2026" → "mars 2026" */
  const periodeDisplay = (() => {
    const [y, m] = d.periode.split('-');
    try {
      return new Date(Number(y), Number(m) - 1, 1)
        .toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    } catch { return d.periode; }
  })();

  return (
    <>
      <style>{`@media print { @page { size: A4 portrait; margin: 0; } }`}</style>

      <div style={{
        width: 794, height: 1123,
        background: '#fff',
        padding: '36px 52px 28px',
        fontFamily: '"Helvetica Neue", Arial, sans-serif',
        fontSize: 11, lineHeight: 1.5, color: '#1a1a2e',
        boxSizing: 'border-box' as const,
        display: 'flex', flexDirection: 'column' as const,
        overflow: 'hidden',
      }}>

        {/* ── En-tête ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: 18, borderBottom: '3px solid #7c3aed', marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 19, fontWeight: 800, color: '#7c3aed', letterSpacing: -0.5 }}>
              {d.org_nom || 'Organisation'}
            </div>
            <div style={{ fontSize: 10, color: '#6b7280', marginTop: 4, lineHeight: 1.6 }}>
              {[d.org_adresse, d.org_ville].filter(Boolean).join(' — ')}
              {d.org_telephone && <><br />Tél. {d.org_telephone}</>}
              {d.org_email     && <><br />{d.org_email}</>}
            </div>
          </div>
          <div style={{ textAlign: 'right' as const }}>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: 2, color: '#7c3aed' }}>QUITTANCE DE LOYER</div>
            <div style={{ fontSize: 11, color: '#374151', marginTop: 4 }}>Période : <strong>{periodeDisplay}</strong></div>
            <div style={{ fontSize: 10, color: '#6b7280', marginTop: 2 }}>Réf. QTT-{String(d.id).padStart(5, '0')}</div>
            <span style={{
              display: 'inline-block', marginTop: 6,
              background: statut.bg, color: statut.text,
              fontWeight: 700, fontSize: 10, padding: '3px 10px', borderRadius: 12,
            }}>
              {statut.label}
            </span>
          </div>
        </div>

        {/* ── Locataire + Bien ── */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
          <div style={{ flex: 1, background: '#f5f3ff', borderRadius: 8, padding: '12px 16px' }}>
            <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase' as const, color: '#7c3aed', letterSpacing: 1.2, marginBottom: 6 }}>Locataire</div>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#111827' }}>{d.locataire_nom}</div>
          </div>
          <div style={{ flex: 1, background: '#f9fafb', borderRadius: 8, padding: '12px 16px' }}>
            <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase' as const, color: '#6b7280', letterSpacing: 1.2, marginBottom: 6 }}>Bien loué</div>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#111827' }}>{d.bien_designation}</div>
            {d.bien_ville && <div style={{ fontSize: 10, color: '#6b7280', marginTop: 2 }}>{d.bien_ville}</div>}
          </div>
        </div>

        {/* ── Détails du contrat ── */}
        <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: '12px 16px', marginBottom: 20 }}>
          <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase' as const, color: '#6b7280', letterSpacing: 1.2, marginBottom: 10 }}>Informations du contrat</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px 20px' }}>
            {[
              ['Type', TYPE_BAIL[d.type_bail] ?? d.type_bail],
              ['Périodicité', PERIODICITE[d.periodicite] ?? d.periodicite],
              ['Jour de paiement', `Le ${d.jour_paiement}`],
              ['Début du contrat', fmtDate(d.date_debut)],
              ['Fin du contrat', d.date_fin ? fmtDate(d.date_fin) : 'Ouvert'],
              ['Dépôt de garantie', fmtMoney(d.depot_garantie)],
            ].map(([lbl, val]) => (
              <div key={String(lbl)}>
                <div style={{ fontSize: 9, color: '#9ca3af', marginBottom: 2 }}>{lbl}</div>
                <div style={{ fontSize: 10, fontWeight: 600, color: '#374151' }}>{val}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Tableau des montants ── */}
        <table style={{ width: '100%', borderCollapse: 'collapse' as const, marginBottom: 16 }}>
          <thead>
            <tr style={{ background: '#7c3aed' }}>
              <th style={{ textAlign: 'left' as const, padding: '9px 14px', fontSize: 10, fontWeight: 700, color: '#fff', borderRadius: '6px 0 0 6px' }}>Désignation</th>
              <th style={{ textAlign: 'center' as const, padding: '9px 14px', fontSize: 10, fontWeight: 700, color: '#fff' }}>Échéance</th>
              <th style={{ textAlign: 'right' as const, padding: '9px 14px', fontSize: 10, fontWeight: 700, color: '#fff', borderRadius: '0 6px 6px 0' }}>Montant</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: '10px 14px', fontSize: 11, background: '#faf5ff', borderBottom: '1px solid #e5e7eb' }}>
                Loyer — {periodeDisplay}
                <div style={{ fontSize: 9, color: '#9ca3af', marginTop: 2 }}>
                  HT {fmtMoney(d.montant_ht)} · TVA {d.tva}% · TTC {fmtMoney(d.montant_ttc)}
                  {d.frais_syndic > 0 && ` · Syndic ${fmtMoney(d.frais_syndic)}`}
                  {d.retenue_source > 0 && ` · Retenue ${d.retenue_source}%`}
                </div>
              </td>
              <td style={{ padding: '10px 14px', fontSize: 10, textAlign: 'center' as const, color: '#6b7280', background: '#faf5ff', borderBottom: '1px solid #e5e7eb' }}>
                {fmtDate(d.date_echeance)}
              </td>
              <td style={{ padding: '10px 14px', fontSize: 12, fontWeight: 700, textAlign: 'right' as const, background: '#faf5ff', borderBottom: '1px solid #e5e7eb' }}>
                {fmtMoney(d.montant)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* ── Récapitulatif paiement ── */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
          <div style={{ width: 280 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #e5e7eb', fontSize: 11 }}>
              <span style={{ color: '#6b7280' }}>Montant dû</span>
              <span style={{ fontWeight: 600 }}>{fmtMoney(d.montant)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #e5e7eb', fontSize: 11 }}>
              <span style={{ color: '#6b7280' }}>Montant payé</span>
              <span style={{ fontWeight: 600, color: '#059669' }}>{fmtMoney(d.montant_paye)}</span>
            </div>
            {d.date_paiement && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #e5e7eb', fontSize: 10, color: '#6b7280' }}>
                <span>Date de paiement</span>
                <span>{fmtDate(d.date_paiement)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, background: solde > 0 ? '#fee2e2' : '#d1fae5', borderRadius: 8, padding: '10px 14px' }}>
              <span style={{ fontWeight: 700, fontSize: 12, color: solde > 0 ? '#991b1b' : '#065f46' }}>Solde restant</span>
              <span style={{ fontWeight: 800, fontSize: 15, color: solde > 0 ? '#991b1b' : '#065f46' }}>{fmtMoney(solde)}</span>
            </div>
          </div>
        </div>

        {/* ── Attestation (si payé) ── */}
        {estPaye && d.montant_paye != null && (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '12px 16px', marginBottom: 16 }}>
            <div style={{ fontSize: 10, color: '#166534', lineHeight: 1.7 }}>
              Je soussigné(e), <strong>{d.org_nom}</strong>, atteste avoir reçu de <strong>{d.locataire_nom}</strong> la somme
              de <strong>{fmtMoney(d.montant_paye)}</strong> au titre du loyer du bien <strong>{d.bien_designation}</strong>{d.bien_ville ? ` situé à ${d.bien_ville}` : ''},
              pour la période de <strong>{periodeDisplay}</strong>.
            </div>
          </div>
        )}

        {/* ── Notes ── */}
        {d.notes && (
          <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 6, padding: '10px 14px', marginBottom: 16 }}>
            <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase' as const, color: '#9ca3af', letterSpacing: 1, marginBottom: 4 }}>Notes</div>
            <p style={{ fontSize: 10, color: '#374151', margin: 0, whiteSpace: 'pre-wrap' as const }}>{d.notes}</p>
          </div>
        )}

        <div style={{ flex: 1 }} />

        {/* ── Bas de page ── */}
        <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 18 }}>
          <p style={{ fontSize: 9, color: '#9ca3af', textAlign: 'center' as const, marginBottom: 20 }}>
            Document généré automatiquement — {d.org_nom} · {d.org_email || d.org_telephone}
          </p>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ textAlign: 'center' as const, width: 200 }}>
              <div style={{ borderTop: '1px solid #d1d5db', paddingTop: 8 }}>
                <div style={{ fontSize: 9, color: '#6b7280' }}>Cachet et signature</div>
                <div style={{ fontSize: 9, color: '#9ca3af', marginTop: 2 }}>{d.org_nom}</div>
              </div>
            </div>
            <div style={{ textAlign: 'center' as const, width: 200 }}>
              <div style={{ borderTop: '1px solid #d1d5db', paddingTop: 8 }}>
                <div style={{ fontSize: 9, color: '#6b7280' }}>Signature du locataire</div>
                <div style={{ fontSize: 9, color: '#9ca3af', marginTop: 2 }}>{d.locataire_nom}</div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}

// ─── Print helper ─────────────────────────────────────────────────────────────

export function printQuittance(containerId: string) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const win = window.open('', '_blank', 'width=900,height=700');
  if (!win) return;
  win.document.documentElement.lang = 'fr';
  win.document.head.innerHTML = `
    <meta charset="utf-8">
    <title>Quittance de loyer</title>
    <style>*{margin:0;padding:0;box-sizing:border-box}@page{size:A4 portrait;margin:0}body{background:#fff}</style>`;
  win.document.body.innerHTML = el.innerHTML;
  win.focus();
  win.onload = () => { win.print(); win.close(); };
  setTimeout(() => { try { win.print(); win.close(); } catch { /* noop */ } }, 600);
}
