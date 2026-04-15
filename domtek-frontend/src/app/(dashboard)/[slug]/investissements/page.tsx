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

interface VisitePoint {
  mois_key:   string;
  planifiees: number;
  effectuees: number;
}

interface CanalPoint {
  canal: string;
  count: number;
  pct:   number;
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

const CANAL_LABELS: Record<string, string> = {
  facebook:          'Facebook',
  instagram:         'Instagram',
  amis_famille:      'Amis / Famille',
  publicite:         'Publicité',
  site_web:          'Site web',
  google:            'Google',
  agence_partenaire: 'Agence partenaire',
  autre:             'Autre',
};

const CANAL_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#06b6d4', '#6b7280',
];

// ─── Composant graphe SVG (une ligne) ─────────────────────────────────────────

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

      {grid.map(v => (
        <g key={v}>
          <line x1={PL} y1={py(v)} x2={W - PR} y2={py(v)}
            stroke={v === 0 ? '#d1d5db' : '#f3f4f6'} strokeWidth={v === 0 ? 1 : 0.8} />
          <text x={PL - 5} y={py(v) + 3.5} textAnchor="end" fontSize={9} fill="#9ca3af">{v}%</text>
        </g>
      ))}

      <path d={areaD} fill={`url(#${gradId})`} />
      <path d={lineD} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />

      {pts.map((p, i) => (
        <text key={i} x={p.x} y={H - 8} textAnchor="middle" fontSize={9} fill="#9ca3af">
          {fmtMoisCourt(p.d.mois_key)}
        </text>
      ))}

      {pts.map((p, i) => (
        <g key={i} onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)} style={{ cursor: 'crosshair' }}>
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
          <circle cx={p.x} cy={p.y} r={hov === i ? 6 : 3.5}
            fill={hov === i ? color : 'white'} stroke={color} strokeWidth={2}
            style={{ transition: 'r 0.12s' }} />
        </g>
      ))}

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

// ─── Graphe double ligne (visites planifiées vs effectuées) ───────────────────

const VW = 620, VH = 240;
const VPL = 42, VPR = 16, VPT = 14, VPB = 36;
const VCW = VW - VPL - VPR;
const VCH = VH - VPT - VPB;

function vpx(i: number, n: number) { return VPL + (n > 1 ? (i / (n - 1)) * VCW : VCW / 2); }
function vpy(v: number, max: number) {
  if (max === 0) return VPT + VCH;
  return VPT + (1 - v / max) * VCH;
}

function DualLineChart({ points }: { points: VisitePoint[] }) {
  const [hov, setHov] = useState<number | null>(null);
  const n = points.length;
  if (n === 0) return <div className="h-48 flex items-center justify-center text-gray-300 text-sm">Aucune donnée</div>;

  const maxVal = Math.max(...points.map(p => Math.max(p.planifiees, p.effectuees)), 1);
  // Round up to a nice grid ceiling
  const gridMax = Math.ceil(maxVal / 5) * 5 || 5;
  const gridStep = gridMax <= 10 ? 2 : gridMax <= 20 ? 5 : gridMax <= 50 ? 10 : Math.ceil(gridMax / 5 / 10) * 10;
  const gridLines: number[] = [];
  for (let g = 0; g <= gridMax; g += gridStep) gridLines.push(g);

  const planPts = points.map((p, i) => ({ x: vpx(i, n), y: vpy(p.planifiees, gridMax), d: p }));
  const effPts  = points.map((p, i) => ({ x: vpx(i, n), y: vpy(p.effectuees, gridMax), d: p }));

  const lineD = (pts: typeof planPts) =>
    pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  const COLOR_PLAN = '#3b82f6'; // bleu
  const COLOR_EFF  = '#10b981'; // vert

  const hovPt = hov !== null ? planPts[hov] : null;
  const tipW = 140;
  const tipX = hovPt ? Math.min(Math.max(hovPt.x - tipW / 2, 4), VW - tipW - 4) : 0;
  const tipY = hovPt ? Math.max(Math.min(planPts[hov!].y, effPts[hov!].y) - 58, 4) : 0;

  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} className="w-full" style={{ height: VH }}>
      <defs>
        <filter id="dual-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#00000018" />
        </filter>
      </defs>

      {/* Grille horizontale */}
      {gridLines.map(v => (
        <g key={v}>
          <line x1={VPL} y1={vpy(v, gridMax)} x2={VW - VPR} y2={vpy(v, gridMax)}
            stroke={v === 0 ? '#d1d5db' : '#f3f4f6'} strokeWidth={v === 0 ? 1 : 0.8} />
          <text x={VPL - 5} y={vpy(v, gridMax) + 3.5} textAnchor="end" fontSize={9} fill="#9ca3af">{v}</text>
        </g>
      ))}

      {/* Lignes */}
      <path d={lineD(planPts)} fill="none" stroke={COLOR_PLAN} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" strokeDasharray="6 3" />
      <path d={lineD(effPts)}  fill="none" stroke={COLOR_EFF}  strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />

      {/* Labels mois */}
      {planPts.map((p, i) => (
        <text key={i} x={p.x} y={VH - 8} textAnchor="middle" fontSize={9} fill="#9ca3af">
          {fmtMoisCourt(points[i].mois_key)}
        </text>
      ))}

      {/* Zones de survol */}
      {planPts.map((p, i) => (
        <g key={i} onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)} style={{ cursor: 'crosshair' }}>
          <rect
            x={i === 0 ? VPL : (planPts[i-1].x + p.x) / 2}
            width={
              i === 0
                ? (planPts[1]?.x ?? p.x + 20) / 2 - VPL + (planPts[1]?.x ?? p.x + 20 - p.x) / 2
                : i === n - 1
                  ? p.x - (planPts[i-1].x + p.x) / 2 + VPR
                  : (planPts[i+1].x + p.x) / 2 - (planPts[i-1].x + p.x) / 2
            }
            y={VPT} height={VCH} fill="transparent" />
          {/* Point planifiées */}
          <circle cx={p.x} cy={p.y} r={hov === i ? 6 : 3.5}
            fill={hov === i ? COLOR_PLAN : 'white'} stroke={COLOR_PLAN} strokeWidth={2}
            style={{ transition: 'r 0.12s' }} />
          {/* Point effectuées */}
          <circle cx={effPts[i].x} cy={effPts[i].y} r={hov === i ? 6 : 3.5}
            fill={hov === i ? COLOR_EFF : 'white'} stroke={COLOR_EFF} strokeWidth={2}
            style={{ transition: 'r 0.12s' }} />
        </g>
      ))}

      {/* Tooltip */}
      {hovPt && hov !== null && (
        <g filter="url(#dual-shadow)">
          <rect x={tipX} y={tipY} width={tipW} height={52} rx={6}
            fill="white" stroke="#e5e7eb" strokeWidth={1} />
          <text x={tipX + 10} y={tipY + 17} fontSize={10} fontWeight="700" fill={COLOR_PLAN}>
            ● Planifiées : {points[hov].planifiees}
          </text>
          <text x={tipX + 10} y={tipY + 33} fontSize={10} fontWeight="700" fill={COLOR_EFF}>
            ● Effectuées : {points[hov].effectuees}
          </text>
          <text x={tipX + tipW / 2} y={tipY + 48} textAnchor="middle" fontSize={9} fill="#9ca3af">
            {fmtMoisLong(points[hov].mois_key)}
          </text>
        </g>
      )}
    </svg>
  );
}

// ─── Graphe donut (canaux) ────────────────────────────────────────────────────

const DONUT_R = 80;
const DONUT_HOLE = 50;
const DONUT_CX = 130;
const DONUT_CY = 110;
const DONUT_W = 440;
const DONUT_H = 220;

function DonutChart({ data }: { data: CanalPoint[] }) {
  const [hov, setHov] = useState<number | null>(null);

  if (data.length === 0) {
    return <div className="h-48 flex items-center justify-center text-gray-300 text-sm">Aucune donnée</div>;
  }

  // Build arcs
  let cumAngle = -Math.PI / 2; // start at top
  const total = data.reduce((s, d) => s + d.count, 0);

  const slices = data.map((d, i) => {
    const angle = (d.count / total) * 2 * Math.PI;
    const start = cumAngle;
    cumAngle += angle;
    const end = cumAngle;
    const color = CANAL_COLORS[i % CANAL_COLORS.length];

    const x1 = DONUT_CX + DONUT_R * Math.cos(start);
    const y1 = DONUT_CY + DONUT_R * Math.sin(start);
    const x2 = DONUT_CX + DONUT_R * Math.cos(end);
    const y2 = DONUT_CY + DONUT_R * Math.sin(end);

    const ix1 = DONUT_CX + DONUT_HOLE * Math.cos(start);
    const iy1 = DONUT_CY + DONUT_HOLE * Math.sin(start);
    const ix2 = DONUT_CX + DONUT_HOLE * Math.cos(end);
    const iy2 = DONUT_CY + DONUT_HOLE * Math.sin(end);

    const large = angle > Math.PI ? 1 : 0;

    const path = [
      `M ${ix1.toFixed(2)} ${iy1.toFixed(2)}`,
      `L ${x1.toFixed(2)} ${y1.toFixed(2)}`,
      `A ${DONUT_R} ${DONUT_R} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`,
      `L ${ix2.toFixed(2)} ${iy2.toFixed(2)}`,
      `A ${DONUT_HOLE} ${DONUT_HOLE} 0 ${large} 0 ${ix1.toFixed(2)} ${iy1.toFixed(2)}`,
      'Z',
    ].join(' ');

    return { path, color, d, start, end, angle };
  });

  const hovSlice = hov !== null ? slices[hov] : null;

  return (
    <svg viewBox={`0 0 ${DONUT_W} ${DONUT_H}`} className="w-full" style={{ height: DONUT_H }}>
      {/* Slices */}
      {slices.map((s, i) => (
        <path
          key={i}
          d={s.path}
          fill={s.color}
          opacity={hov === null || hov === i ? 1 : 0.55}
          stroke="white"
          strokeWidth={2}
          style={{ cursor: 'pointer', transition: 'opacity 0.15s' }}
          onMouseEnter={() => setHov(i)}
          onMouseLeave={() => setHov(null)}
          transform={hov === i ? (() => {
            const midAngle = s.start + s.angle / 2;
            const dx = Math.cos(midAngle) * 5;
            const dy = Math.sin(midAngle) * 5;
            return `translate(${dx.toFixed(2)}, ${dy.toFixed(2)})`;
          })() : undefined}
        />
      ))}

      {/* Centre : total ou valeur survolée */}
      <text x={DONUT_CX} y={DONUT_CY - 8} textAnchor="middle" fontSize={hovSlice ? 18 : 14} fontWeight="800"
        fill={hovSlice ? hovSlice.color : '#374151'}>
        {hovSlice ? `${hovSlice.d.pct}%` : total}
      </text>
      <text x={DONUT_CX} y={DONUT_CY + 10} textAnchor="middle" fontSize={9} fill="#9ca3af">
        {hovSlice ? (CANAL_LABELS[hovSlice.d.canal] ?? hovSlice.d.canal) : 'prospects'}
      </text>
      {hovSlice && (
        <text x={DONUT_CX} y={DONUT_CY + 24} textAnchor="middle" fontSize={9} fill="#6b7280">
          {hovSlice.d.count} enregistrés
        </text>
      )}

      {/* Légende à droite */}
      {slices.map((s, i) => {
        const ly = 24 + i * 22;
        return (
          <g key={i} style={{ cursor: 'pointer' }}
            onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)}
            opacity={hov === null || hov === i ? 1 : 0.5}>
            <rect x={DONUT_CX * 2 + 16} y={ly - 9} width={12} height={12} rx={3} fill={s.color} />
            <text x={DONUT_CX * 2 + 34} y={ly} fontSize={10} fill="#374151">
              {CANAL_LABELS[s.d.canal] ?? s.d.canal}
            </text>
            <text x={DONUT_W - VPR} y={ly} textAnchor="end" fontSize={10} fontWeight="600" fill={s.color}>
              {s.d.pct}%
            </text>
          </g>
        );
      })}
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
  const [visites,       setVisites]       = useState<VisitePoint[]>([]);
  const [canaux,        setCanaux]        = useState<CanalPoint[]>([]);
  const [loadingBiens,  setLoadingBiens]  = useState(true);
  const [loadingPros,   setLoadingPros]   = useState(true);
  const [loadingVis,    setLoadingVis]    = useState(true);
  const [loadingCanaux, setLoadingCanaux] = useState(true);
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

  const fetchVisites = useCallback(() => {
    setLoadingVis(true);
    api.get('/org/statistiques/visites')
      .then(r => setVisites(r.data.data ?? []))
      .catch(() => {})
      .finally(() => setLoadingVis(false));
  }, []);

  const fetchCanaux = useCallback(() => {
    setLoadingCanaux(true);
    api.get('/org/statistiques/canaux')
      .then(r => setCanaux(r.data.data ?? []))
      .catch(() => {})
      .finally(() => setLoadingCanaux(false));
  }, []);

  const refresh = useCallback(() => {
    fetchBiens();
    fetchProspects();
    fetchVisites();
    fetchCanaux();
    setLastRefresh(new Date());
  }, [fetchBiens, fetchProspects, fetchVisites, fetchCanaux]);

  useEffect(() => {
    refresh();
    intervalRef.current = setInterval(refresh, 30_000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [refresh]);

  const dernierBien     = biens.at(-1);
  const dernierProspect = prospects.at(-1);
  const totalPlanifiees = visites.reduce((s, v) => s + v.planifiees, 0);
  const totalEffectuees = visites.reduce((s, v) => s + v.effectuees, 0);
  const tauxRealisation = totalPlanifiees > 0 ? Math.round(totalEffectuees / totalPlanifiees * 100) : 0;

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

        {dernierBien && (
          <div className="px-6 pt-5 grid grid-cols-3 gap-4">
            <StatCard label="Total biens" value={dernierBien.total} sub="inscrits à ce jour" color="text-gray-700" />
            <StatCard label="Biens occupés" value={dernierBien.occupes} sub="loués ou vendus" color="text-blue-600" />
            <StatCard label="Taux d'occupation" value={`${dernierBien.taux}%`} sub="ce mois-ci" color="text-blue-600" />
          </div>
        )}

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

        {dernierProspect && (
          <div className="px-6 pt-5 grid grid-cols-3 gap-4">
            <StatCard label="Total prospects" value={dernierProspect.total} sub="enregistrés à ce jour" color="text-gray-700" />
            <StatCard label="Convertis en clients" value={dernierProspect.convertis} sub="ayant signé un contrat" color="text-emerald-600" />
            <StatCard label="Taux de conversion" value={`${dernierProspect.taux}%`} sub="ce mois-ci" color="text-emerald-600" />
          </div>
        )}

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

      {/* ── Section 3 : Visites planifiées vs effectuées ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-800">Visites planifiées vs effectuées</h2>
            <p className="text-xs text-gray-400 mt-0.5">Nombre de visites par mois — 12 derniers mois</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-xs text-gray-400">
              <svg width="20" height="6"><line x1="0" y1="3" x2="20" y2="3" stroke="#3b82f6" strokeWidth="2.5" strokeDasharray="6 3" /></svg>
              Planifiées
            </span>
            <span className="flex items-center gap-1.5 text-xs text-gray-400">
              <span className="w-4 h-0.5 bg-emerald-500 inline-block rounded" />
              Effectuées
            </span>
          </div>
        </div>

        <div className="px-6 pt-5 grid grid-cols-3 gap-4">
          <StatCard label="Planifiées (12 mois)" value={totalPlanifiees} sub="visites programmées" color="text-blue-600" />
          <StatCard label="Effectuées (12 mois)" value={totalEffectuees} sub="visites réalisées" color="text-emerald-600" />
          <StatCard label="Taux de réalisation" value={`${tauxRealisation}%`} sub="sur les 12 derniers mois" color={tauxRealisation >= 70 ? 'text-emerald-600' : 'text-amber-500'} />
        </div>

        <div className="px-6 py-5">
          {loadingVis ? (
            <div className="h-[240px] flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <DualLineChart points={visites} />
          )}
        </div>

        <div className="px-6 pb-4 flex items-center gap-6 text-xs text-gray-400">
          <span className="flex items-center gap-1.5">
            <svg width="20" height="6"><line x1="0" y1="3" x2="20" y2="3" stroke="#3b82f6" strokeWidth="2.5" strokeDasharray="6 3" /></svg>
            Visites planifiées (pointillés bleus)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 bg-emerald-500 inline-block rounded" />
            Visites effectuées (trait vert)
          </span>
        </div>
      </div>

      {/* ── Section 4 : Canaux de découverte ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50">
          <h2 className="text-base font-semibold text-gray-800">Canaux de découverte</h2>
          <p className="text-xs text-gray-400 mt-0.5">Comment les prospects ont connu l&apos;agence — répartition par canal</p>
        </div>

        <div className="px-6 py-5">
          {loadingCanaux ? (
            <div className="h-[220px] flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <DonutChart data={canaux} />
          )}
        </div>

        {canaux.length > 0 && (
          <div className="px-6 pb-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {canaux.slice(0, 4).map((c, i) => (
                <div key={c.canal} className="bg-gray-50 rounded-xl p-3 flex flex-col gap-0.5">
                  <span className="text-xs text-gray-400">{CANAL_LABELS[c.canal] ?? c.canal}</span>
                  <span className="text-xl font-bold" style={{ color: CANAL_COLORS[i % CANAL_COLORS.length] }}>{c.pct}%</span>
                  <span className="text-xs text-gray-400">{c.count} prospect{c.count > 1 ? 's' : ''}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
