'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import api from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface BienPoint {
  mois_key: string;
  total:    number;
  occupes:  number;
  taux:     number;
}

interface ProspectPoint {
  mois_key:  string;
  total:     number;
  convertis: number;
  taux:      number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MOIS_COURTS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
const MOIS_LONGS  = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

function fmtMoisCourt(key: string) {
  const m = parseInt(key.split('-')[1], 10) - 1;
  return MOIS_COURTS[m] ?? key;
}
function fmtMoisLong(key: string) {
  const [y, m] = key.split('-');
  return `${MOIS_LONGS[parseInt(m, 10) - 1]} ${y}`;
}

// ─── Composant graphe SVG ─────────────────────────────────────────────────────

const W = 620, H = 220;
const PL = 38, PR = 16, PT = 14, PB = 36;
const CW = W - PL - PR;
const CH = H - PT - PB;

function px(i: number, n: number) { return PL + (n > 1 ? (i / (n - 1)) * CW : CW / 2); }
function py(v: number)            { return PT + (1 - Math.min(v, 100) / 100) * CH; }

interface LineChartProps<T extends { mois_key: string; taux: number }> {
  points:     T[];
  color:      string;
  gradId:     string;
  renderTip:  (p: T) => string;
}

function LineChart<T extends { mois_key: string; taux: number }>({
  points, color, gradId, renderTip,
}: LineChartProps<T>) {
  const [hov, setHov] = useState<number | null>(null);
  const n = points.length;
  if (n === 0) return <div className="h-48 flex items-center justify-center text-gray-300 text-sm">Aucune donnée</div>;

  const pts = points.map((p, i) => ({ x: px(i, n), y: py(p.taux), d: p }));
  const lineD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaD = `${lineD} L${pts[n-1].x.toFixed(1)},${(PT+CH).toFixed(1)} L${pts[0].x.toFixed(1)},${(PT+CH).toFixed(1)} Z`;
  const grid  = [0, 25, 50, 75, 100];

  const hovPt = hov !== null ? pts[hov] : null;
  // Tooltip X clamped so it doesn't overflow
  const tipW = 110;
  const tipX = hovPt ? Math.min(Math.max(hovPt.x - tipW / 2, 4), W - tipW - 4) : 0;
  const tipY = hovPt ? Math.max(hovPt.y - 52, 4) : 0;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 220 }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0.01" />
        </linearGradient>
        <filter id={`${gradId}-shadow`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#00000018" />
        </filter>
      </defs>

      {/* Grille horizontale */}
      {grid.map(v => (
        <g key={v}>
          <line x1={PL} y1={py(v)} x2={W - PR} y2={py(v)}
            stroke={v === 0 ? '#d1d5db' : '#f3f4f6'} strokeWidth={v === 0 ? 1 : 0.8} />
          <text x={PL - 5} y={py(v) + 3.5} textAnchor="end" fontSize={9} fill="#9ca3af">{v}%</text>
        </g>
      ))}

      {/* Zone remplie */}
      <path d={areaD} fill={`url(#${gradId})`} />

      {/* Ligne */}
      <path d={lineD} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />

      {/* Labels mois */}
      {pts.map((p, i) => (
        <text key={i} x={p.x} y={H - 8} textAnchor="middle" fontSize={9} fill="#9ca3af">
          {fmtMoisCourt(p.d.mois_key)}
        </text>
      ))}

      {/* Zones de survol invisibles + points */}
      {pts.map((p, i) => (
        <g key={i}
          onMouseEnter={() => setHov(i)}
          onMouseLeave={() => setHov(null)}
          style={{ cursor: 'crosshair' }}>
          {/* Zone de détection large */}
          <rect
            x={i === 0 ? PL : (pts[i-1].x + p.x) / 2}
            width={
              i === 0
                ? (pts[1]?.x ?? p.x + 20) / 2 - PL + (pts[1]?.x ?? p.x + 20 - p.x) / 2
                : i === n - 1
                  ? p.x - (pts[i-1].x + p.x) / 2 + PR
                  : (pts[i+1].x + p.x) / 2 - (pts[i-1].x + p.x) / 2
            }
            y={PT} height={CH} fill="transparent" />
          {/* Point visible */}
          <circle cx={p.x} cy={p.y} r={hov === i ? 6 : 3.5}
            fill={hov === i ? color : 'white'} stroke={color} strokeWidth={2}
            style={{ transition: 'r 0.12s' }} />
        </g>
      ))}

      {/* Tooltip */}
      {hovPt && (
        <g filter={`url(#${gradId}-shadow)`}>
          <rect x={tipX} y={tipY} width={tipW} height={40} rx={6}
            fill="white" stroke="#e5e7eb" strokeWidth={1} />
          <text x={tipX + tipW / 2} y={tipY + 15} textAnchor="middle"
            fontSize={13} fontWeight="700" fill={color}>
            {hovPt.d.taux}%
          </text>
          <text x={tipX + tipW / 2} y={tipY + 30} textAnchor="middle"
            fontSize={9} fill="#6b7280">
            {renderTip(hovPt.d)}
          </text>
        </g>
      )}
    </svg>
  );
}

// ─── Carte statistique résumé ─────────────────────────────────────────────────

function StatCard({ label, value, sub, color }: {
  label: string; value: string | number; sub?: string; color: string;
}) {
  return (
    <div className="bg-gray-50 rounded-xl p-4 flex flex-col gap-1">
      <span className="text-xs text-gray-400 font-medium">{label}</span>
      <span className={`text-2xl font-bold ${color}`}>{value}</span>
      {sub && <span className="text-xs text-gray-400">{sub}</span>}
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function StatistiquesPage() {
  const [biens,         setBiens]         = useState<BienPoint[]>([]);
  const [prospects,     setProspects]     = useState<ProspectPoint[]>([]);
  const [loadingBiens,  setLoadingBiens]  = useState(true);
  const [loadingPros,   setLoadingPros]   = useState(true);
  const [lastRefresh,   setLastRefresh]   = useState(new Date());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchBiens = useCallback(() => {
    setLoadingBiens(true);
    api.get('/org/statistiques/biens')
      .then(r => setBiens(r.data.data ?? []))
      .catch(() => {})
      .finally(() => setLoadingBiens(false));
  }, []);

  const fetchProspects = useCallback(() => {
    setLoadingPros(true);
    api.get('/org/statistiques/prospects')
      .then(r => setProspects(r.data.data ?? []))
      .catch(() => {})
      .finally(() => setLoadingPros(false));
  }, []);

  const refresh = useCallback(() => {
    fetchBiens();
    fetchProspects();
    setLastRefresh(new Date());
  }, [fetchBiens, fetchProspects]);

  useEffect(() => {
    refresh();
    intervalRef.current = setInterval(refresh, 30_000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [refresh]);

  // Résumés du mois actuel (dernier point)
  const dernierBien     = biens.at(-1);
  const dernierProspect = prospects.at(-1);

  return (
    <div className="p-8 space-y-8 max-w-5xl">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Statistiques</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Actualisation automatique toutes les 30 s — dernière mise à jour :{' '}
            {lastRefresh.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>
        </div>
        <button onClick={refresh}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 shadow-sm transition">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Actualiser
        </button>
      </div>

      {/* ── Section 1 : Occupation des biens ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-800">Taux d&apos;occupation des biens</h2>
            <p className="text-xs text-gray-400 mt-0.5">% de biens loués ou vendus par rapport au total — 12 derniers mois</p>
          </div>
          <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" />
        </div>

        {/* Résumé chiffres */}
        {dernierBien && (
          <div className="px-6 pt-5 grid grid-cols-3 gap-4">
            <StatCard label="Total biens" value={dernierBien.total} sub="inscrits à ce jour" color="text-gray-700" />
            <StatCard label="Biens occupés" value={dernierBien.occupes} sub="loués ou vendus" color="text-blue-600" />
            <StatCard label="Taux d'occupation" value={`${dernierBien.taux}%`} sub="ce mois-ci" color="text-blue-600" />
          </div>
        )}

        {/* Graphe */}
        <div className="px-6 py-5">
          {loadingBiens ? (
            <div className="h-[220px] flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <LineChart<BienPoint>
              points={biens}
              color="#3b82f6"
              gradId="grad-biens"
              renderTip={p => `${p.occupes}/${p.total} biens · ${fmtMoisLong(p.mois_key)}`}
            />
          )}
        </div>

        {/* Légende */}
        <div className="px-6 pb-4 flex items-center gap-6 text-xs text-gray-400">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-blue-500 inline-block rounded" />
            % biens loués / vendus
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full border-2 border-blue-500 bg-white inline-block" />
            Point mensuel (survoler pour le détail)
          </span>
        </div>
      </div>

      {/* ── Section 2 : Conversion prospects → clients ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-800">Conversion Prospects → Clients</h2>
            <p className="text-xs text-gray-400 mt-0.5">% de prospects devenus clients — 12 derniers mois (cumulatif)</p>
          </div>
          <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
        </div>

        {/* Résumé chiffres */}
        {dernierProspect && (
          <div className="px-6 pt-5 grid grid-cols-3 gap-4">
            <StatCard label="Total prospects" value={dernierProspect.total} sub="enregistrés à ce jour" color="text-gray-700" />
            <StatCard label="Convertis en clients" value={dernierProspect.convertis} sub="ayant signé un contrat" color="text-emerald-600" />
            <StatCard label="Taux de conversion" value={`${dernierProspect.taux}%`} sub="ce mois-ci" color="text-emerald-600" />
          </div>
        )}

        {/* Graphe */}
        <div className="px-6 py-5">
          {loadingPros ? (
            <div className="h-[220px] flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <LineChart<ProspectPoint>
              points={prospects}
              color="#10b981"
              gradId="grad-prospects"
              renderTip={p => `${p.convertis}/${p.total} prospects · ${fmtMoisLong(p.mois_key)}`}
            />
          )}
        </div>

        {/* Légende */}
        <div className="px-6 pb-4 flex items-center gap-6 text-xs text-gray-400">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-emerald-500 inline-block rounded" />
            % prospects convertis en clients
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full border-2 border-emerald-500 bg-white inline-block" />
            Point mensuel (survoler pour le détail)
          </span>
        </div>
      </div>
    </div>
  );
}
