'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Annonce, PaginatedResponse } from '@/types';
import { Suspense } from 'react';

const TYPE_COLORS: Record<string, string> = {
  vente: 'bg-blue-100 text-blue-700',
  loyer: 'bg-green-100 text-green-700',
};

const TYPE_LABELS: Record<string, string> = {
  vente: 'Vente', loyer: 'Location',
};

const TYPES_BIEN = ['appartement', 'maison', 'villa', 'bureau', 'terrain', 'autre'];

function AnnoncesList() {
  const searchParams = useSearchParams();

  const [data, setData] = useState<PaginatedResponse<Annonce> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const [filters, setFilters] = useState({
    search: searchParams.get('search') ?? '',
    ville: searchParams.get('ville') ?? '',
    type_transaction: searchParams.get('type_transaction') ?? '',
    type_bien: '',
    prix_min: '',
    prix_max: '',
  });

  const setFilter = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFilters((prev) => ({ ...prev, [field]: e.target.value }));
    setPage(1);
  };

  const fetchAnnonces = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
    params.set('page', String(page));
    params.set('per_page', '12');

    api.get<PaginatedResponse<Annonce>>(`/annonces?${params}`)
      .then(({ data: res }) => setData(res))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filters, page]);

  useEffect(() => { fetchAnnonces(); }, [fetchAnnonces]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-gray-900">Domtek</Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link href="/annonces" className="text-blue-600 font-semibold">Annonces</Link>
            <Link href="/agences" className="text-gray-600 hover:text-gray-900 font-medium">Agences</Link>
            <Link href="/login" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition">
              Connexion
            </Link>
          </nav>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Toutes les annonces</h1>

        {/* Filtres */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex flex-wrap gap-3">
          <input type="text" placeholder="Rechercher…" value={filters.search} onChange={setFilter('search')}
            className="border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-48" />
          <input type="text" placeholder="Ville" value={filters.ville} onChange={setFilter('ville')}
            className="border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-32" />
          <select value={filters.type_transaction} onChange={setFilter('type_transaction')}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Vente & Location</option>
            <option value="vente">Vente</option>
            <option value="loyer">Location</option>
          </select>
          <select value={filters.type_bien} onChange={setFilter('type_bien')}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Tous types</option>
            {TYPES_BIEN.map((t) => (
              <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
            ))}
          </select>
          <input type="number" placeholder="Prix min" value={filters.prix_min} onChange={setFilter('prix_min')}
            className="border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-28" />
          <input type="number" placeholder="Prix max" value={filters.prix_max} onChange={setFilter('prix_max')}
            className="border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-28" />
        </div>

        {/* Résultats */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm animate-pulse h-64" />
            ))}
          </div>
        ) : !data?.data.length ? (
          <div className="text-center py-16 text-gray-400">Aucune annonce correspondante.</div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-4">{data.meta.total} résultat(s)</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.data.map((a) => (
                <Link key={a.id} href={`/annonces/${a.id}`}
                  className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
                  <div className="h-44 bg-gray-100 relative overflow-hidden">
                    {a.bien?.image_principale ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={a.bien.image_principale.url} alt={a.titre}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-200">
                        <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                            d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                    )}
                    {a.bien && (
                      <span className={`absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full ${TYPE_COLORS[a.bien.type_transaction] ?? 'bg-gray-100'}`}>
                        {TYPE_LABELS[a.bien.type_transaction]}
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-800 text-sm leading-tight mb-1 line-clamp-2">{a.titre}</h3>
                    {a.bien && (
                      <p className="text-xs text-gray-400 mb-2 capitalize">{a.bien.type_bien} · {a.bien.ville ?? '—'}</p>
                    )}
                    {a.bien && (
                      <p className="text-base font-bold text-blue-600">
                        {Number(a.bien.prix).toLocaleString('fr-TN')} TND
                        {a.bien.type_transaction === 'loyer' && (
                          <span className="text-xs font-normal text-gray-400"> /mois</span>
                        )}
                      </p>
                    )}
                    {a.organisation && (
                      <p className="text-xs text-gray-400 mt-1">{a.organisation.nom}</p>
                    )}
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

export default function AnnoncesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">Chargement…</div>}>
      <AnnoncesList />
    </Suspense>
  );
}
