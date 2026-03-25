'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import { User } from '@/types';

interface ComptesResponse {
  data: {
    proprietaire: User | null;
    employes: User[];
  };
}

export default function OrgComptesPage() {
  const { slug } = useParams<{ slug: string }>();
  const [proprietaire, setProprietaire] = useState<User | null>(null);
  const [employes, setEmployes] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get<ComptesResponse>(`/admin/organisations/${slug}/comptes`)
      .then(({ data: res }) => {
        setProprietaire(res.data.proprietaire);
        setEmployes(res.data.employes ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return <div className="animate-pulse h-40 bg-gray-100 rounded-xl" />;
  }

  const allUsers: (User & { role_label: string })[] = [
    ...(proprietaire ? [{ ...proprietaire, role_label: 'Propriétaire' }] : []),
    ...employes.map((e) => ({ ...e, role_label: 'Employé' })),
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-700">Comptes utilisateurs</h2>
      </div>
      {!allUsers.length ? (
        <p className="p-6 text-sm text-gray-400 text-center">Aucun compte trouvé.</p>
      ) : (
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-5 py-3 font-medium text-gray-600">Nom</th>
              <th className="text-left px-5 py-3 font-medium text-gray-600">Email</th>
              <th className="text-left px-5 py-3 font-medium text-gray-600">Rôle</th>
              <th className="text-left px-5 py-3 font-medium text-gray-600">Actif</th>
              <th className="text-left px-5 py-3 font-medium text-gray-600">Inscrit le</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {allUsers.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-5 py-3 font-medium text-gray-800">{u.name}</td>
                <td className="px-5 py-3 text-gray-600">{u.email}</td>
                <td className="px-5 py-3 text-gray-600">{u.role_label}</td>
                <td className="px-5 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {u.is_active ? 'Oui' : 'Non'}
                  </span>
                </td>
                <td className="px-5 py-3 text-gray-500">{new Date(u.created_at).toLocaleDateString('fr-FR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
