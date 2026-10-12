'use client';

import { useEffect, useState } from 'react';
import { useParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Organisation } from '@/types';

const TABS = [
  { label: 'Vue générale', suffix: '' },
  { label: 'Comptes', suffix: '/comptes' },
  { label: 'Biens', suffix: '/biens' },
  { label: 'Annonces', suffix: '/annonces' },
];

const STATUT_STYLES: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  en_attente: 'bg-yellow-100 text-yellow-700',
  inactive: 'bg-red-100 text-red-700',
};

export default function OrgDetailLayout({ children }: { children: React.ReactNode }) {
  const { slug } = useParams<{ slug: string }>();
  const pathname = usePathname();
  const [org, setOrg] = useState<Organisation | null>(null);

  useEffect(() => {
    api
      .get<{ data: Organisation }>(`/admin/organisations/${slug}`)
      .then(({ data }) => setOrg(data.data))
      .catch(() => {});
  }, [slug]);

  const basePath = `/admin/organisations/${slug}`;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <Link href="/admin/organisations" className="text-sm text-gray-400 hover:text-gray-600 mb-3 inline-block">
          ← Retour aux organisations
        </Link>
        {org ? (
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{org.nom}</h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-sm text-gray-500">{org.ville}</span>
                <span
                  className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                    STATUT_STYLES[org.statut] ?? 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {org.statut === 'en_attente' ? 'En attente' : org.statut.charAt(0).toUpperCase() + org.statut.slice(1)}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-8 bg-gray-200 rounded animate-pulse w-48" />
        )}
      </div>

      {/* Onglets */}
      <div className="flex gap-1 border-b border-gray-200 mb-6">
        {TABS.map((tab) => {
          const href = `${basePath}${tab.suffix}`;
          const isActive = tab.suffix === '' ? pathname === basePath : pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                isActive
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {children}
    </div>
  );
}
