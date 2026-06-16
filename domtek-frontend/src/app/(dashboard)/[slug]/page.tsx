'use client';

import { useEffect, useState } from 'react';
import Link from '@/components/OrgLink';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

interface DashSuggestion {
  score: number;
  prospect: { id: number; nom: string; ville: string | null };
  bien: { id: number; designation: string; type_bien: string; type_transaction: string; prix: number | null; ville: string | null; superficie: number | null };
}

const TYPE_LABELS: Record<string, string> = {
  appartement: 'Appt', maison: 'Maison', villa: 'Villa', bureau: 'Bureau',
  terrain: 'Terrain', studio: 'Studio', duplex: 'Duplex',
  local_commercial: 'Local', entrepot: 'Entrepôt', ferme: 'Ferme', autre: 'Bien',
};

function ScoreDot({ score }: { score: number }) {
  const [bg, text] =
    score >= 75 ? ['bg-green-100', 'text-green-700'] :
    score >= 50 ? ['bg-blue-100',  'text-blue-700']  :
    score >= 30 ? ['bg-orange-100','text-orange-700'] :
                  ['bg-gray-100',  'text-gray-500'];
  return (
    <span className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold shrink-0 ${bg} ${text}`}>
      {score}
    </span>
  );
}

interface DashStats {
  biens: number;
  annonces_publiees: number;
  contrats_actifs: number;
  clients: number;
  employes: number;
  factures_en_attente: number;
}

const STAT_CARDS = (s: DashStats) => [
  {
    label: 'Biens', value: s.biens, href: '/dashboard/biens',
    gradient: 'from-violet-600 to-indigo-700',
    icon: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z',
  },
  {
    label: 'Annonces publiées', value: s.annonces_publiees, href: '/dashboard/annonces',
    gradient: 'from-emerald-500 to-teal-600',
    icon: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z',
  },
  {
    label: 'Contrats actifs', value: s.contrats_actifs, href: '/dashboard/contrats',
    gradient: 'from-amber-500 to-orange-600',
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  },
  {
    label: 'Prospects', value: s.clients, href: '/dashboard/prospects',
    gradient: 'from-rose-500 to-pink-600',
    icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  },
  {
    label: 'Employés', value: s.employes, href: '/dashboard/employes',
    gradient: 'from-cyan-500 to-sky-600',
    icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  },
  {
    label: 'Factures en attente', value: s.factures_en_attente, href: '/dashboard/factures',
    gradient: 'from-slate-600 to-slate-800',
    icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z',
  },
];

const QUICK_ACTIONS = [
  { href: '/dashboard/biens/nouveau',      label: 'Nouveau bien',      color: 'bg-violet-600 hover:bg-violet-700',   icon: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z' },
  { href: '/dashboard/annonces/nouvelle',  label: 'Annonce',           color: 'bg-emerald-600 hover:bg-emerald-700', icon: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z' },
  { href: '/dashboard/contrats/nouveau',   label: 'Contrat',           color: 'bg-amber-600 hover:bg-amber-700',     icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { href: '/dashboard/prospects/nouveau',  label: 'Prospect',          color: 'bg-rose-600 hover:bg-rose-700',       icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z' },
  { href: '/dashboard/factures/nouvelle',  label: 'Facture',           color: 'bg-slate-700 hover:bg-slate-800',     icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' },
];

export default function DashboardPage() {
  const [stats, setStats]           = useState<DashStats | null>(null);
  const [loading, setLoading]       = useState(true);
  const [suggestions, setSuggestions]     = useState<DashSuggestion[]>([]);
  const [lastUpdated, setLastUpdated]     = useState<string | null>(null);
  const [loadingSugg, setLoadingSugg]     = useState(true);
  const { user, organisation } = useAuthStore();

  const fetchSuggestions = () => {
    setLoadingSugg(true);
    api.get('/org/dashboard/suggestions')
      .then(({ data }) => {
        setSuggestions(data.suggestions ?? []);
        setLastUpdated(data.last_updated ?? null);
      })
      .catch(() => {})
      .finally(() => setLoadingSugg(false));
  };

  const greet = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Bonjour';
    if (h < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  useEffect(() => { fetchSuggestions(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    Promise.all([
      api.get('/org/biens?per_page=1'),
      api.get('/org/annonces?statut=publiee&per_page=1'),
      api.get('/org/contrats?statut=actif&per_page=1'),
      api.get('/org/prospects?per_page=1'),
      api.get('/org/employes?per_page=1'),
      api.get('/org/factures?statut=en_attente&per_page=1'),
    ]).then(([biens, annonces, contrats, clients, employes, factures]) => {
      setStats({
        biens:               biens.data.meta?.total    ?? 0,
        annonces_publiees:   annonces.data.meta?.total ?? 0,
        contrats_actifs:     contrats.data.meta?.total ?? 0,
        clients:             clients.data.meta?.total  ?? 0,
        employes:            employes.data.meta?.total ?? 0,
        factures_en_attente: factures.data.meta?.total ?? 0,
      });
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const displayName = user?.name ?? organisation?.nom ?? 'votre organisation';

  return (
    <div className="p-8">

      {/* ── Bannière d'accueil ── */}
      <div className="mb-8 bg-gradient-to-br from-sky-50 via-white to-indigo-50 border border-slate-200 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-sky-100/60 rounded-full -translate-y-1/3 translate-x-1/4" />
        <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-indigo-100/40 rounded-full translate-y-1/2" />
        <div className="absolute top-1/2 right-1/4 w-24 h-24 bg-amber-100/30 rounded-full" />
        <div className="relative z-10">
          <p className="text-sky-600 text-sm font-medium mb-1">{greet()},</p>
          <h1 className="text-2xl font-bold capitalize text-slate-800">{displayName}</h1>
          <p className="text-slate-400 text-sm mt-1">L'immobilier, simplifié</p>
        </div>
      </div>

      {/* ── Statistiques ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
        {loading
          ? [...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 animate-pulse h-28" />
            ))
          : stats && STAT_CARDS(stats).map((card, i) => (
              <Link
                key={card.label}
                href={card.href}
                style={{ animationDelay: `${i * 60}ms` }}
                className="animate-fade-in bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5 flex items-center gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
              >
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform duration-200`}>
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={card.icon} />
                  </svg>
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900 leading-none">{card.value}</p>
                  <p className="text-sm text-gray-500 mt-1">{card.label}</p>
                </div>
                <svg className="w-4 h-4 text-gray-300 ml-auto group-hover:text-gray-400 group-hover:translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))
        }
      </div>

      {/* ── Actions rapides ── */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Actions rapides</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {QUICK_ACTIONS.map((a) => (
            <Link key={a.href} href={a.href}
              className={`${a.color} text-white rounded-xl px-4 py-4 flex flex-col items-center gap-2.5 text-center transition-all hover:shadow-md hover:-translate-y-0.5 group`}>
              <div className="w-9 h-9 bg-white/15 rounded-lg flex items-center justify-center group-hover:bg-white/25 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={a.icon} />
                </svg>
              </div>
              <span className="text-xs font-semibold leading-tight">{a.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Suggestions IA — Associations Prospects / Biens ── */}
      <div className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Suggestions IA</p>
            <p className="text-sm text-slate-700 font-medium mt-0.5">Associations Prospects → Biens disponibles</p>
          </div>
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="text-xs text-gray-400">
                Mis à jour {new Date(lastUpdated).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <button
              onClick={fetchSuggestions}
              disabled={loadingSugg}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 transition disabled:opacity-50"
            >
              <svg className={`w-3.5 h-3.5 ${loadingSugg ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Actualiser
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
          {loadingSugg ? (
            <div className="divide-y divide-gray-100">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-gray-100 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-100 rounded w-1/3" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : suggestions.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-gray-400">Aucune association détectée pour le moment.</p>
              <p className="text-xs text-gray-300 mt-1">Les associations apparaissent dès qu&apos;un prospect et un bien compatible sont créés.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {suggestions.map((s, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition group">
                  <ScoreDot score={s.score} />

                  {/* Prospect */}
                  <div className="flex-1 min-w-0">
                    <Link href={`/dashboard/prospects/${s.prospect.id}`}
                      className="text-sm font-semibold text-gray-800 hover:text-violet-600 transition truncate block">
                      {s.prospect.nom}
                    </Link>
                    {s.prospect.ville && (
                      <p className="text-xs text-gray-400 truncate">{s.prospect.ville}</p>
                    )}
                  </div>

                  {/* Flèche */}
                  <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>

                  {/* Bien */}
                  <div className="flex-1 min-w-0 text-right">
                    <Link href={`/dashboard/biens/${s.bien.id}`}
                      className="text-sm font-semibold text-gray-800 hover:text-violet-600 transition truncate block">
                      {s.bien.designation}
                    </Link>
                    <p className="text-xs text-gray-400 truncate">
                      {TYPE_LABELS[s.bien.type_bien] ?? s.bien.type_bien}
                      {s.bien.ville && <span> · {s.bien.ville}</span>}
                      {s.bien.prix != null && (
                        <span className="font-medium text-gray-600"> · {Number(s.bien.prix).toLocaleString('fr-FR')} DT</span>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
