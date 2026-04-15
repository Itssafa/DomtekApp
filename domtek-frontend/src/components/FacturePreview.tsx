'use client';

import { useRef, useEffect, useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FacturePreviewData {
  reference:    string;
  type:         string;
  statut:       string;
  montant:      string | number;
  dateEmission: string;
  dateEcheance: string;
  periodeDebut: string;
  periodeFin:   string;
  notes:        string;
  // Organisation
  orgNom:       string;
  orgAdresse:   string;
  orgVille:     string;
  orgTelephone: string;
  orgEmail:     string;
  // Client
  clientNom:    string;
  clientAdresse: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  eau:              'Eau potable',
  electricite:      'Électricité',
  gaz:              'Gaz naturel',
  electricite_gaz:  'Électricité et Gaz',
  loyer:            'Loyer',
};

const STATUT_COLOR: Record<string, { bg: string; text: string; label: string }> = {
  en_attente: { bg: '#fef3c7', text: '#92400e', label: 'En attente de paiement' },
  payee:      { bg: '#d1fae5', text: '#065f46', label: 'Payée' },
  en_retard:  { bg: '#fee2e2', text: '#991b1b', label: 'En retard' },
};

function fmt(d: string) {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('fr-TN', { day: '2-digit', month: 'long', year: 'numeric' }); }
  catch { return d; }
}

function fmtMoney(v: string | number) {
  const n = typeof v === 'string' ? parseFloat(v) : v;
  if (!v || isNaN(n)) return '—';
  return n.toLocaleString('fr-TN', { minimumFractionDigits: 3, maximumFractionDigits: 3 }) + ' TND';
}

// ─── Scaling wrapper ──────────────────────────────────────────────────────────

const A4_W = 794;
const A4_H = 1123;

function ScaledDoc({ children }: { children: React.ReactNode }) {
  const outerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const outer = outerRef.current;
    if (!outer) return;
    const upd = () => setScale(Math.min(1, outer.clientWidth / A4_W));
    const obs = new ResizeObserver(upd);
    obs.observe(outer);
    upd();
    return () => obs.disconnect();
  }, []);

  return (
    /* Wrapper : hauteur = A4 scalé — la facture tient toujours en 1 page */
    <div ref={outerRef}
      className="w-full overflow-hidden print:overflow-visible print:h-auto"
      style={{ height: A4_H * scale }}>
      <div style={{ width: A4_W, transformOrigin: 'top left', transform: `scale(${scale})` }}>
        {children}
      </div>
    </div>
  );
}

// ─── Invoice document (une seule page A4 exacte) ─────────────────────────────

function InvoiceDoc({ d }: { d: FacturePreviewData }) {
  const statut    = STATUT_COLOR[d.statut] ?? STATUT_COLOR.en_attente;
  const typeLabel = TYPE_LABELS[d.type] ?? d.type;
  const montant   = fmtMoney(d.montant);

  return (
    <>
      {/* Style d'impression : 1 page A4 sans marges navigateur */}
      <style>{`@media print { @page { size: A4 portrait; margin: 0; } }`}</style>

      <div style={{
        width: 794, height: 1123,           /* A4 exact — 1 page */
        background: '#fff',
        padding: '36px 52px 28px',
        fontFamily: '"Helvetica Neue", Arial, sans-serif',
        fontSize: 11, lineHeight: 1.5, color: '#1a1a2e',
        boxSizing: 'border-box' as const,
        display: 'flex', flexDirection: 'column' as const,
        overflow: 'hidden',
      }}>

        {/* ── En-tête ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: 18, borderBottom: '3px solid #1e40af', marginBottom: 22 }}>
          <div>
            <div style={{ fontSize: 19, fontWeight: 800, color: '#1e40af', letterSpacing: -0.5 }}>
              {d.orgNom || 'Organisation'}
            </div>
            <div style={{ fontSize: 10, color: '#6b7280', marginTop: 4, lineHeight: 1.6 }}>
              {[d.orgAdresse, d.orgVille].filter(Boolean).join(' — ')}
              {d.orgTelephone && <><br />Tél. {d.orgTelephone}</>}
              {d.orgEmail     && <><br />{d.orgEmail}</>}
            </div>
          </div>
          <div style={{ textAlign: 'right' as const }}>
            <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: 3, color: '#1e40af' }}>FACTURE</div>
            <div style={{ fontSize: 11, color: '#374151', marginTop: 4 }}>N° <strong>{d.reference || '—'}</strong></div>
            <span style={{ display: 'inline-block', marginTop: 6, background: statut.bg, color: statut.text, fontWeight: 700, fontSize: 10, padding: '3px 10px', borderRadius: 12 }}>
              {statut.label}
            </span>
          </div>
        </div>

        {/* ── Facturé à + Dates ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 22 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase' as const, color: '#9ca3af', letterSpacing: 1.2, marginBottom: 6 }}>Facturé à</div>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#111827' }}>{d.clientNom || '—'}</div>
            {d.clientAdresse && <div style={{ color: '#6b7280', fontSize: 10, marginTop: 3 }}>{d.clientAdresse}</div>}
          </div>
          <div style={{ textAlign: 'right' as const, fontSize: 10 }}>
            <div style={{ marginBottom: 4 }}>
              <span style={{ color: '#9ca3af' }}>Date d'émission : </span>
              <strong>{fmt(d.dateEmission)}</strong>
            </div>
            <div style={{ marginBottom: 4 }}>
              <span style={{ color: '#9ca3af' }}>Date d'échéance : </span>
              <strong style={{ color: '#dc2626' }}>{fmt(d.dateEcheance)}</strong>
            </div>
            {(d.periodeDebut || d.periodeFin) && (
              <div>
                <span style={{ color: '#9ca3af' }}>Période : </span>
                <strong>{fmt(d.periodeDebut)} – {fmt(d.periodeFin)}</strong>
              </div>
            )}
          </div>
        </div>

        {/* ── Tableau services ── */}
        <table style={{ width: '100%', borderCollapse: 'collapse' as const, marginBottom: 12 }}>
          <thead>
            <tr style={{ background: '#1e40af' }}>
              <th style={{ textAlign: 'left' as const, padding: '9px 14px', fontSize: 10, fontWeight: 700, color: '#fff', borderRadius: '6px 0 0 6px' }}>Désignation</th>
              <th style={{ textAlign: 'center' as const, padding: '9px 14px', fontSize: 10, fontWeight: 700, color: '#fff' }}>Période</th>
              <th style={{ textAlign: 'right' as const, padding: '9px 14px', fontSize: 10, fontWeight: 700, color: '#fff', borderRadius: '0 6px 6px 0' }}>Montant TTC</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: '11px 14px', fontSize: 11, borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>{typeLabel}</td>
              <td style={{ padding: '11px 14px', fontSize: 10, textAlign: 'center' as const, color: '#6b7280', borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
                {d.periodeDebut && d.periodeFin ? `${fmt(d.periodeDebut)} – ${fmt(d.periodeFin)}` : '—'}
              </td>
              <td style={{ padding: '11px 14px', fontSize: 11, fontWeight: 700, textAlign: 'right' as const, borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>{montant}</td>
            </tr>
          </tbody>
        </table>

        {/* ── Total ── */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 18 }}>
          <div style={{ background: '#1e40af', color: '#fff', borderRadius: 8, padding: '10px 22px', display: 'flex', gap: 32, alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.5 }}>TOTAL TTC</span>
            <span style={{ fontSize: 17, fontWeight: 800 }}>{montant}</span>
          </div>
        </div>

        {/* ── Notes ── */}
        {d.notes ? (
          <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 6, padding: '10px 14px', marginBottom: 16 }}>
            <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase' as const, color: '#9ca3af', letterSpacing: 1, marginBottom: 4 }}>Notes</div>
            <p style={{ fontSize: 10, color: '#374151', margin: 0, whiteSpace: 'pre-wrap' as const }}>{d.notes}</p>
          </div>
        ) : <div style={{ flex: 1 }} />}

        {/* ── Spacer pour pousser signatures en bas ── */}
        <div style={{ flex: 1 }} />

        {/* ── Bas de page : conditions + signatures ── */}
        <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 18 }}>
          <p style={{ fontSize: 9, color: '#9ca3af', textAlign: 'center' as const, marginBottom: 20 }}>
            Paiement à effectuer par virement bancaire ou en espèces avant la date d'échéance indiquée ci-dessus.
            Tout retard de paiement entraîne des pénalités conformément à la législation en vigueur.
          </p>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ textAlign: 'center' as const, width: 200 }}>
              <div style={{ borderTop: '1px solid #d1d5db', paddingTop: 8 }}>
                <div style={{ fontSize: 9, color: '#6b7280' }}>Cachet et signature</div>
                <div style={{ fontSize: 9, color: '#9ca3af', marginTop: 2 }}>{d.orgNom}</div>
              </div>
            </div>
            <div style={{ textAlign: 'center' as const, width: 200 }}>
              <div style={{ borderTop: '1px solid #d1d5db', paddingTop: 8 }}>
                <div style={{ fontSize: 9, color: '#6b7280' }}>Signature du client</div>
                <div style={{ fontSize: 9, color: '#9ca3af', marginTop: 2 }}>{d.clientNom || '—'}</div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}

// ─── Print helper ─────────────────────────────────────────────────────────────

export function printFacture(containerId: string) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const win = window.open('', '_blank', 'width=900,height=700');
  if (!win) return;

  /* Construire le document via DOM (évite document.write déprécié) */
  win.document.documentElement.lang = 'fr';
  win.document.head.innerHTML = `
    <meta charset="utf-8">
    <title>Facture</title>
    <style>*{margin:0;padding:0;box-sizing:border-box}@page{size:A4 portrait;margin:0}body{background:#fff}</style>`;
  win.document.body.innerHTML = el.innerHTML;

  win.focus();
  win.onload = () => { win.print(); win.close(); };
  setTimeout(() => { try { win.print(); win.close(); } catch { /* noop */ } }, 600);
}

// InvoiceDoc exporté pour pouvoir le rendre hors-écran dans la liste
export { InvoiceDoc };

// ─── Exported component ───────────────────────────────────────────────────────

export function FacturePreview({ data, printId }: { data: FacturePreviewData; printId?: string }) {
  return (
    <ScaledDoc>
      <div id={printId}>
        <InvoiceDoc d={data} />
      </div>
    </ScaledDoc>
  );
}
