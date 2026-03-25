'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Organisation, PaginatedResponse } from '@/types';

export default function AgencesPage() {
  const [data, setData] = useState<PaginatedResponse<Organisation> | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const fetchAgences = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    params.set('page', String(page));
    api.get<PaginatedResponse<Organisation>>(`/agences?${params}`)
      .then(({ data: res }) => setData(res))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, page]);

  useEffect(() => { fetchAgences(); }, [fetchAgences]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-gray-900">Domtek</Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link href="/annonces" className="text-gray-600 hover:text-gray-900 font-medium">Annonces</Link>
            <Link href="/agences" className="text-blue-600 font-semibold">Agences</Link>
            <Link href="/login" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition">
              Connexion
            </Link>
          </nav>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-1">Agences immobilières</h1>
          <p className="text-gray-500 text-sm">Trouvez une agence partenaire en Tunisie</p>
        </div>

        {/* Recherche */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Rechercher par nom..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="border border-gray-200 bg-white rounded-xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full max-w-sm shadow-sm"
          />
        </div>

        {/* Liste */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm animate-pulse h-40" />
            ))}
          </div>
        ) : !data?.data.length ? (
          <div className="text-center py-16 text-gray-400">Aucune agence trouvée.</div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {data.data.map((org) => (
                <Link
                  key={org.id}
                  href={`/agences/${org.slug}`}
                  className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col gap-3"
                >
                  {/* Icône / Logo */}
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>

                  <div className="flex-1">
                    <h3 className="font-bold text-gray-800">{org.nom}</h3>
                    {org.ville && <p className="text-sm text-gray-500 mt-0.5">{org.ville}</p>}
                    {org.description && (
                      <p className="text-xs text-gray-400 mt-2 line-clamp-2">{org.description}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-gray-100">
                    <span>{org.annonces_count ?? 0} annonce(s)</span>
                    <span className="text-blue-600 font-medium">Voir le profil →</span>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {data.meta.last_page > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-sm disabled:opacity-40 hover:bg-gray-50">
                  ← Précédent
                </button>
                <span className="text-sm text-gray-500">Page {page} / {data.meta.last_page}</span>
                <button onClick={() => setPage((p) => Math.min(data.meta.last_page, p + 1))} disabled={page === data.meta.last_page}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-sm disabled:opacity-40 hover:bg-gray-50">
                  Suivant →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
