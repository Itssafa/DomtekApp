'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import { Organisation } from '@/types';

export default function OrgDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [org, setOrg] = useState<Organisation | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchOrg = () => {
    setLoading(true);
    api
      .get<{ data: Organisation }>(`/admin/organisations/${slug}`)
      .then(({ data }) => setOrg(data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrg();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const handleStatut = async (action: 'activer' | 'desactiver') => {
    if (!org) return;
    setActionLoading(true);
    try {
      await api.patch(`/admin/organisations/${org.slug}/${action}`);
      fetchOrg();
    } catch {
      /* silently fail */
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded-lg" />)}</div>;
  }

  if (!org) {
    return <p className="text-gray-500 text-sm">Organisation introuvable.</p>;
  }

  const rows: [string, string | number | null][] = [
    ['Nom', org.nom],
    ['Slug', org.slug],
    ['Email', org.email],
    ['Téléphone', org.telephone],
    ['Adresse', org.adresse],
    ['Ville', org.ville],
    ['Description', org.description],
    ['Statut', org.statut],
    ['Créé le', new Date(org.created_at).toLocaleDateString('fr-FR')],
  ];

  return (
    <div className="space-y-6">
      {/* Actions rapides */}
      <div className="flex gap-3">
        {org.statut !== 'active' && (
          <button
            onClick={() => handleStatut('activer')}
            disabled={actionLoading}
            className="px-4 py-2 text-sm bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white rounded-lg font-medium transition"
          >
            Activer le compte
          </button>
        )}
        {org.statut === 'active' && (
          <button
            onClick={() => handleStatut('desactiver')}
            disabled={actionLoading}
            className="px-4 py-2 text-sm bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white rounded-lg font-medium transition"
          >
            Désactiver
          </button>
        )}
      </div>

      {/* Stats résumées */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Biens', value: org.biens_count ?? '—' },
          { label: 'Annonces', value: org.annonces_count ?? '—' },
          { label: 'Clients', value: org.clients_count ?? '—' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl shadow-sm p-5">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Infos détaillées */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <tbody className="divide-y divide-gray-100">
            {rows.map(([label, value]) => (
              <tr key={label}>
                <td className="px-5 py-3 font-medium text-gray-500 w-40">{label}</td>
                <td className="px-5 py-3 text-gray-800">{value ?? <span className="text-gray-400">—</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
