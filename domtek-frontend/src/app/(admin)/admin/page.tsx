'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface Stats {
  total: number;
  active: number;
  en_attente: number;
  inactive: number;
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/admin/organisations?per_page=1')
      .then(({ data }) => {
        // On récupère les counts depuis les méta ou on fait 3 appels séparés
        const meta = data.meta ?? {};
        setStats({
          total: meta.total ?? 0,
          active: 0,
          en_attente: 0,
          inactive: 0,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Charge les stats par statut
  useEffect(() => {
    Promise.all([
      api.get('/admin/organisations?statut=active&per_page=1'),
      api.get('/admin/organisations?statut=en_attente&per_page=1'),
      api.get('/admin/organisations?statut=inactive&per_page=1'),
      api.get('/admin/organisations?per_page=1'),
    ])
      .then(([active, enAttente, inactive, all]) => {
        setStats({
          total: all.data.meta?.total ?? 0,
          active: active.data.meta?.total ?? 0,
          en_attente: enAttente.data.meta?.total ?? 0,
          inactive: inactive.data.meta?.total ?? 0,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-1">Tableau de bord</h1>
      <p className="text-gray-500 text-sm mb-8">Vue d'ensemble des organisations</p>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm p-6 animate-pulse h-24" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard label="Total organisations" value={stats?.total ?? 0} color="text-gray-800" />
          <StatCard label="Actives" value={stats?.active ?? 0} color="text-green-600" />
          <StatCard label="En attente" value={stats?.en_attente ?? 0} color="text-yellow-600" />
          <StatCard label="Inactives" value={stats?.inactive ?? 0} color="text-red-600" />
        </div>
      )}
    </div>
  );
}
