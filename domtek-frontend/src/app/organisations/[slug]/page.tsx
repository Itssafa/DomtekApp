'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Organisation, Annonce, PaginatedResponse } from '@/types';

const TYPE_COLORS: Record<string, string> = {
  vente: 'bg-blue-100 text-blue-700',
  loyer: 'bg-green-100 text-green-700',
};

const TYPE_LABELS: Record<string, string> = {
  vente: 'Vente', loyer: 'Location',
};

interface OrganisationDetail {
  data: Organisation;
  annonces: PaginatedResponse<Annonce>;
}

export default function OrganisationProfilePage() {
  const { slug } = useParams<{ slug: string }>();
  const [org, setOrg] = useState<Organisation | null>(null);
  const [annonces, setAnnonces] = useState<Annonce[]>([]);
  const [meta, setMeta] = useState<{ last_page: number; total: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get<OrganisationDetail>(`/organisations/${slug}?page=1`)
      .then(({ data: res }) => {
        setOrg(res.data);
        setAnnonces(res.annonces.data);
        setMeta({ last_page: res.annonces.meta.last_page, total: res.annonces.meta.total });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  const loadMore = () => {
    if (loadingMore) return;
    const nextPage = page + 1;
    setLoadingMore(true);
    api.get<OrganisationDetail>(`/organisations/${slug}?page=${nextPage}`)
      .then(({ data: res }) => {
        setAnnonces((prev) => [...prev, ...res.annonces.data]);
        setPage(nextPage);
      })
      .catch(() => {})
      .finally(() => setLoadingMore(false));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-5xl mx-auto px-6 py-10 animate-pulse space-y-6">
          <div className="h-32 bg-gray-200 rounded-2xl" />
          <div className="grid grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => <div key={i} className="h-52 bg-gray-200 rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!org) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">Organisation introuvable.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-5xl mx-auto px-6 py-8">
        <Link href="/organisations" className="text-sm text-gray-400 hover:text-gray-600 mb-6 inline-block">
          ← Toutes les organisations
        </Link>

        {/* Profil organisation */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
          <div className="flex items-start gap-5">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center flex-shrink-0">
              <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-800">{org.nom}</h1>
              {org.ville && <p className="text-gray-500 text-sm mt-0.5">{org.ville}</p>}
              {org.description && (
                <p className="text-gray-600 text-sm mt-3 leading-relaxed">{org.description}</p>
              )}
              <div className="flex flex-wrap gap-4 mt-4">
                {org.telephone && (
                  <a href={`tel:${org.telephone}`}
                    className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline">
                    📞 {org.telephone}
                  </a>
                )}
                {org.email && (
                  <a href={`mailto:${org.email}`}
                    className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline">
                    ✉️ {org.email}
                  </a>
                )}
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-2xl font-bold text-gray-800">{meta?.total ?? 0}</p>
              <p className="text-xs text-gray-400">annonce(s)</p>
            </div>
          </div>
        </div>

        {/* Annonces de l'organisation */}
        <h2 className="text-lg font-bold text-gray-800 mb-5">Annonces publiées</h2>

        {!annonces.length ? (
          <p className="text-center text-gray-400 py-10">Aucune annonce publiée.</p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {annonces.map((a) => (
                <Link key={a.id} href={`/annonces/${a.id}`}
                  className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
                  <div className="h-40 bg-gray-100 relative overflow-hidden">
                    {a.bien?.image_principale ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={a.bien.image_principale.url} alt={a.titre}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-200">
                        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                            d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                    )}
                    {a.bien && (
                      <span className={`absolute top-2 left-2 text-xs font-semibold px-2 py-0.5 rounded-full ${TYPE_COLORS[a.bien.type_transaction]}`}>
                        {TYPE_LABELS[a.bien.type_transaction]}
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-800 text-sm leading-tight mb-1 line-clamp-1">{a.titre}</h3>
                    {a.bien && (
                      <p className="text-xs text-gray-400 mb-2 capitalize">{a.bien.type_bien} · {a.bien.ville ?? '—'}</p>
                    )}
                    {a.bien && (
                      <p className="text-sm font-bold text-blue-600">
                        {Number(a.bien.prix).toLocaleString('fr-TN')} TND
                        {a.bien.type_transaction === 'loyer' && (
                          <span className="text-xs font-normal text-gray-400"> /mois</span>
                        )}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            {/* Charger plus */}
            {meta && page < meta.last_page && (
              <div className="mt-8 text-center">
                <button onClick={loadMore} disabled={loadingMore}
                  className="px-6 py-2.5 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition disabled:opacity-40">
                  {loadingMore ? 'Chargement…' : 'Charger plus d\'annonces'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Header() {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-gray-900">Domtek</Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link href="/annonces" className="text-gray-600 hover:text-gray-900 font-medium">Annonces</Link>
          <Link href="/organisations" className="text-blue-600 font-semibold">Organisations</Link>
          <Link href="/login" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition">
            Connexion
          </Link>
        </nav>
      </div>
    </header>
  );
}
