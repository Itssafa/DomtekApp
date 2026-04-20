'use client';

import { useEffect, useState } from 'react';
import Link from '@/components/OrgLink';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

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
  const [stats, setStats]   = useState<DashStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, organisation } = useAuthStore();

  const greet = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Bonjour';
    if (h < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

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
      <div className="mb-8 bg-gradient-to-br from-slate-900 via-violet-950 to-indigo-950 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-violet-500/10 rounded-full -translate-y-1/3 translate-x-1/4" />
        <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-indigo-500/10 rounded-full translate-y-1/2" />
        <div className="absolute top-1/2 right-1/4 w-24 h-24 bg-amber-400/5 rounded-full" />
        <div className="relative z-10">
          <p className="text-violet-300 text-sm font-medium mb-1">{greet()},</p>
          <h1 className="text-2xl font-bold capitalize">{displayName}</h1>
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
    </div>
  );
}
