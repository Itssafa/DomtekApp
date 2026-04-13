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

function ScaledDoc({ children }: { children: React.ReactNode }) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale]   = useState(1);
  const [wrapH, setWrapH]   = useState<number | undefined>(undefined);

  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;
    const upd = () => {
      const s = Math.min(1, outer.clientWidth / 794);
      setScale(s);
      setWrapH(inner.scrollHeight * s);
    };
    const o1 = new ResizeObserver(upd);
    const o2 = new ResizeObserver(upd);
    o1.observe(outer);
    o2.observe(inner);
    upd();
    return () => { o1.disconnect(); o2.disconnect(); };
  }, []);

  return (
    <div ref={outerRef}
      className="w-full overflow-hidden print:overflow-visible print:h-auto"
      style={{ height: wrapH }}>
      <div ref={innerRef}
        style={{ width: 794, transformOrigin: 'top left', transform: `scale(${scale})` }}>
        {children}
      </div>
    </div>
  );
}

// ─── Invoice document ─────────────────────────────────────────────────────────

function InvoiceDoc({ d }: { d: FacturePreviewData }) {
  const statut = STATUT_COLOR[d.statut] ?? STATUT_COLOR.en_attente;
  const typeLabel = TYPE_LABELS[d.type] ?? d.type;
  const montant  = fmtMoney(d.montant);

  return (
    <div style={{
      width: 794, minHeight: 1123,
      background: '#fff', padding: '48px 56px',
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: 12, lineHeight: 1.6, color: '#111',
      boxSizing: 'border-box' as const,
    }}>

      {/* ── En-tête ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40, borderBottom: '3px solid #1e40af', paddingBottom: 20 }}>
        {/* Org info */}
        <div>
          <div style={{ fontSize: 20, fontWeight: 'bold', color: '#1e40af', marginBottom: 6 }}>
            {d.orgNom || 'Organisation'}
          </div>
          {d.orgAdresse && <div style={{ fontSize: 11, color: '#4b5563' }}>{d.orgAdresse}</div>}
          {d.orgVille   && <div style={{ fontSize: 11, color: '#4b5563' }}>{d.orgVille}</div>}
          {d.orgTelephone && <div style={{ fontSize: 11, color: '#4b5563', marginTop: 4 }}>Tél. : {d.orgTelephone}</div>}
          {d.orgEmail    && <div style={{ fontSize: 11, color: '#4b5563' }}>{d.orgEmail}</div>}
        </div>
        {/* FACTURE badge */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 30, fontWeight: 'bold', letterSpacing: 4, color: '#1e40af' }}>FACTURE</div>
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
            N° {d.reference || '—'}
          </div>
        </div>
      </div>

      {/* ── Dates & Client ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 36 }}>
        {/* Facturé à */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' as const, color: '#6b7280', letterSpacing: 1, marginBottom: 8 }}>
            Facturé à
          </div>
          <div style={{ fontWeight: 'bold', fontSize: 13 }}>{d.clientNom || '—'}</div>
          {d.clientAdresse && <div style={{ color: '#4b5563', fontSize: 11, marginTop: 4 }}>{d.clientAdresse}</div>}
        </div>
        {/* Dates */}
        <div style={{ textAlign: 'right', minWidth: 220 }}>
          <table style={{ marginLeft: 'auto', borderSpacing: '0 4px', borderCollapse: 'separate' as const }}>
            <tbody>
              <tr>
                <td style={{ color: '#6b7280', fontSize: 11, paddingRight: 16 }}>Date d'émission :</td>
                <td style={{ fontWeight: 'bold', fontSize: 11 }}>{fmt(d.dateEmission)}</td>
              </tr>
              <tr>
                <td style={{ color: '#6b7280', fontSize: 11, paddingRight: 16 }}>Date d'échéance :</td>
                <td style={{ fontWeight: 'bold', fontSize: 11, color: '#dc2626' }}>{fmt(d.dateEcheance)}</td>
              </tr>
              {(d.periodeDebut || d.periodeFin) && (
                <tr>
                  <td style={{ color: '#6b7280', fontSize: 11, paddingRight: 16 }}>Période :</td>
                  <td style={{ fontSize: 11 }}>{fmt(d.periodeDebut)} – {fmt(d.periodeFin)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Tableau des services ── */}
      <table style={{ width: '100%', borderCollapse: 'collapse' as const, marginBottom: 8 }}>
        <thead>
          <tr style={{ background: '#1e40af', color: '#fff' }}>
            <th style={{ textAlign: 'left' as const, padding: '10px 14px', fontSize: 11, fontWeight: 'bold', borderRadius: '4px 0 0 4px' }}>
              Désignation
            </th>
            <th style={{ textAlign: 'center' as const, padding: '10px 14px', fontSize: 11, fontWeight: 'bold' }}>
              Période
            </th>
            <th style={{ textAlign: 'right' as const, padding: '10px 14px', fontSize: 11, fontWeight: 'bold', borderRadius: '0 4px 4px 0' }}>
              Montant TTC
            </th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ background: '#f8fafc' }}>
            <td style={{ padding: '12px 14px', fontSize: 12, borderBottom: '1px solid #e2e8f0' }}>
              {typeLabel}
            </td>
            <td style={{ padding: '12px 14px', fontSize: 11, textAlign: 'center' as const, color: '#4b5563', borderBottom: '1px solid #e2e8f0' }}>
              {d.periodeDebut && d.periodeFin
                ? `${fmt(d.periodeDebut)} – ${fmt(d.periodeFin)}`
                : '—'}
            </td>
            <td style={{ padding: '12px 14px', fontSize: 12, fontWeight: 'bold', textAlign: 'right' as const, borderBottom: '1px solid #e2e8f0' }}>
              {montant}
            </td>
          </tr>
        </tbody>
      </table>

      {/* ── Total ── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 36 }}>
        <div style={{ minWidth: 260, border: '2px solid #1e40af', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ background: '#1e40af', color: '#fff', padding: '10px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 'bold', fontSize: 13, letterSpacing: 1 }}>TOTAL TTC</span>
            <span style={{ fontWeight: 'bold', fontSize: 16 }}>{montant}</span>
          </div>
        </div>
      </div>

      {/* ── Statut ── */}
      <div style={{ marginBottom: 28 }}>
        <span style={{ display: 'inline-block', background: statut.bg, color: statut.text, fontWeight: 'bold', fontSize: 11, padding: '5px 14px', borderRadius: 20, letterSpacing: 0.5 }}>
          ● {statut.label}
        </span>
      </div>

      {/* ── Notes ── */}
      {d.notes && (
        <div style={{ marginBottom: 32, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: '12px 16px' }}>
          <div style={{ fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' as const, color: '#6b7280', letterSpacing: 1, marginBottom: 6 }}>Notes</div>
          <p style={{ fontSize: 11, color: '#374151', whiteSpace: 'pre-wrap' as const }}>{d.notes}</p>
        </div>
      )}

      {/* ── Séparateur signatures ── */}
      <div style={{ borderTop: '1px solid #d1d5db', paddingTop: 28, marginTop: 'auto', display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ textAlign: 'center' as const }}>
          <div style={{ borderTop: '1px solid #9ca3af', width: 180, marginBottom: 6 }} />
          <div style={{ fontSize: 10, color: '#6b7280' }}>Cachet et signature du bailleur</div>
          <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>{d.orgNom}</div>
        </div>
        <div style={{ textAlign: 'center' as const }}>
          <div style={{ borderTop: '1px solid #9ca3af', width: 180, marginBottom: 6 }} />
          <div style={{ fontSize: 10, color: '#6b7280' }}>Signature du locataire</div>
          <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>{d.clientNom || '—'}</div>
        </div>
      </div>

    </div>
  );
}

// ─── Exported component ───────────────────────────────────────────────────────

export function FacturePreview({ data }: { data: FacturePreviewData }) {
  return (
    <ScaledDoc>
      <InvoiceDoc d={data} />
    </ScaledDoc>
  );
}
