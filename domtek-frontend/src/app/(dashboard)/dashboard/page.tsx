'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

interface DashStats {
  biens: number;
  annonces_publiees: number;
  contrats_actifs: number;
  clients: number;
  employes: number;
  factures_en_attente: number;
}

const statCards = (s: DashStats) => [
  { label: 'Biens', value: s.biens, href: '/dashboard/biens', color: 'text-blue-600', bg: 'bg-blue-50' },
  { label: 'Annonces publiées', value: s.annonces_publiees, href: '/dashboard/annonces', color: 'text-green-600', bg: 'bg-green-50' },
  { label: 'Contrats actifs', value: s.contrats_actifs, href: '/dashboard/contrats', color: 'text-purple-600', bg: 'bg-purple-50' },
  { label: 'Clients', value: s.clients, href: '/dashboard/clients', color: 'text-orange-600', bg: 'bg-orange-50' },
  { label: 'Employés', value: s.employes, href: '/dashboard/employes', color: 'text-teal-600', bg: 'bg-teal-50' },
  { label: 'Factures en attente', value: s.factures_en_attente, href: '/dashboard/factures', color: 'text-red-600', bg: 'bg-red-50' },
];

export default function DashboardPage() {
  const [stats, setStats] = useState<DashStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/org/biens?per_page=1'),
      api.get('/org/annonces?statut=publiee&per_page=1'),
      api.get('/org/contrats?statut=actif&per_page=1'),
      api.get('/org/clients?per_page=1'),
      api.get('/org/employes?per_page=1'),
      api.get('/org/factures?statut=en_attente&per_page=1'),
    ])
      .then(([biens, annonces, contrats, clients, employes, factures]) => {
        setStats({
          biens: biens.data.meta?.total ?? 0,
          annonces_publiees: annonces.data.meta?.total ?? 0,
          contrats_actifs: contrats.data.meta?.total ?? 0,
          clients: clients.data.meta?.total ?? 0,
          employes: employes.data.meta?.total ?? 0,
          factures_en_attente: factures.data.meta?.total ?? 0,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-1">Tableau de bord</h1>
      <p className="text-gray-500 text-sm mb-8">Vue d'ensemble de votre agence</p>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm p-6 animate-pulse h-24" />
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {statCards(stats).map((card) => (
            <Link
              key={card.label}
              href={card.href}
              className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${card.bg} mb-3`}>
                <span className={`text-lg font-bold ${card.color}`}>{card.value}</span>
              </div>
              <p className="text-sm text-gray-500">{card.label}</p>
            </Link>
          ))}
        </div>
      ) : null}

      {/* Raccourcis */}
      <div className="mt-10">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Actions rapides</h2>
        <div className="flex flex-wrap gap-3">
          {[
            { href: '/dashboard/biens/nouveau', label: '+ Nouveau bien' },
            { href: '/dashboard/annonces/nouvelle', label: '+ Nouvelle annonce' },
            { href: '/dashboard/contrats/nouveau', label: '+ Nouveau contrat' },
            { href: '/dashboard/clients/nouveau', label: '+ Nouveau client' },
            { href: '/dashboard/factures/nouvelle', label: '+ Nouvelle facture' },
          ].map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition"
            >
              {a.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
