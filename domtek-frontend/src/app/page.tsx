'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Annonce } from '@/types';

const TYPE_LABELS: Record<string, string> = { vente: 'Vente', loyer: 'Location' };

const TYPE_BIEN_LABELS: Record<string, string> = {
  appartement: 'Appartement', maison: 'Maison', villa: 'Villa',
  bureau: 'Bureau', terrain: 'Terrain', autre: 'Autre',
};

function AnnonceCard({ annonce }: { annonce: Annonce }) {
  return (
    <Link
      href={`/annonces/${annonce.id}`}
      className="bg-white rounded-xl overflow-hidden group flex flex-col border border-gray-200 hover:border-gray-400 hover:shadow-md transition-all duration-200"
    >
      {/* Image */}
      <div className="h-44 bg-gray-100 relative overflow-hidden flex-shrink-0">
        {annonce.bien?.image_principale ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={annonce.bien.image_principale.url}
            alt={annonce.titre}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
          </div>
        )}
        {annonce.bien && (
          <span className="absolute top-2.5 left-2.5 text-[11px] font-semibold px-2 py-0.5 rounded bg-white text-gray-700 border border-gray-200">
            {TYPE_LABELS[annonce.bien.type_transaction]}
          </span>
        )}
      </div>

      {/* Contenu */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-gray-900 text-sm leading-snug mb-1 line-clamp-2">
          {annonce.titre}
        </h3>
        {annonce.bien && (
          <p className="text-xs text-gray-400 mb-3 capitalize">
            {TYPE_BIEN_LABELS[annonce.bien.type_bien] ?? annonce.bien.type_bien}
            {annonce.bien.ville && ` · ${annonce.bien.ville}`}
            {annonce.bien.superficie && ` · ${annonce.bien.superficie} m²`}
          </p>
        )}
        <p className="text-sm font-bold text-gray-900 mb-3">
          {annonce.bien ? (
            <>
              {Number(annonce.bien.prix).toLocaleString('fr-TN')} TND
              {annonce.bien.type_transaction === 'loyer' && (
                <span className="text-xs font-normal text-gray-400"> /mois</span>
              )}
            </>
          ) : '—'}
        </p>
        {annonce.organisation && (
          <div className="mt-auto flex items-center gap-2 pt-3 border-t border-gray-100">
            <div className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
              </svg>
            </div>
            <span className="text-xs text-gray-400 truncate">{annonce.organisation.nom}</span>
          </div>
        )}
      </div>
    </Link>
  );
}

export default function HomePage() {
  const [annonces, setAnnonces]       = useState<Annonce[]>([]);
  const [loading, setLoading]         = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage]               = useState(1);
  const [lastPage, setLastPage]       = useState(1);
  const [total, setTotal]             = useState(0);
  const [search, setSearch]           = useState('');
  const [ville, setVille]             = useState('');
  const [typeTransaction, setTypeTransaction] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [debouncedVille, setDebouncedVille]   = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedVille(ville), 400);
    return () => clearTimeout(t);
  }, [ville]);

  const loadAnnonces = useCallback((p: number, reset: boolean) => {
    if (reset) setLoading(true); else setLoadingMore(true);
    const params = new URLSearchParams({ page: String(p), per_page: '12' });
    if (debouncedSearch)  params.set('search', debouncedSearch);
    if (debouncedVille)   params.set('ville', debouncedVille);
    if (typeTransaction)  params.set('type_transaction', typeTransaction);
    api.get(`/annonces?${params}`)
      .then(({ data }) => {
        const items: Annonce[] = data.data ?? [];
        setAnnonces((prev) => reset ? items : [...prev, ...items]);
        setLastPage(data.meta?.last_page ?? 1);
        setTotal(data.meta?.total ?? 0);
        setPage(p);
      })
      .catch(() => {})
      .finally(() => { setLoading(false); setLoadingMore(false); });
  }, [debouncedSearch, debouncedVille, typeTransaction]);

  useEffect(() => { loadAnnonces(1, true); }, [loadAnnonces]);

  const inputCls = 'w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-900 transition-colors';

  return (
    <div className="min-h-screen bg-white">

      {/* ── Header ── */}
      <header className="sticky top-0 z-20 bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gray-900 rounded-md flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
              </svg>
            </div>
            <span className="text-sm font-bold text-gray-900 tracking-tight">Domtek</span>
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            <Link href="/annonces" className="px-3 py-1.5 text-gray-500 hover:text-gray-900 rounded-lg transition-colors">
              Annonces
            </Link>
            <Link href="/organisations" className="px-3 py-1.5 text-gray-500 hover:text-gray-900 rounded-lg transition-colors">
              Organisations
            </Link>
            <Link href="/login"
              className="ml-2 px-4 py-1.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors">
              Connexion
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="border-b border-gray-100 bg-gray-50 py-16 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-4">Immobilier en Tunisie</p>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4 leading-tight tracking-tight">
            Votre réseau immobilier d'excellence
          </h1>
          <p className="text-gray-500 text-base mb-10">
            Vente et location — appartements, maisons, villas, bureaux et terrains
          </p>

          {/* Barre de recherche */}
          <form onSubmit={(e) => e.preventDefault()}
            className="bg-white border border-gray-200 rounded-xl p-2 flex flex-col sm:flex-row gap-2 shadow-sm">
            <div className="flex-1 relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
              </svg>
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher…"
                className={inputCls + ' pl-9'} />
            </div>
            <div className="relative sm:w-36">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
              <input type="text" value={ville} onChange={(e) => setVille(e.target.value)}
                placeholder="Ville"
                className={inputCls + ' pl-9'} />
            </div>
            <select value={typeTransaction} onChange={(e) => setTypeTransaction(e.target.value)}
              className={inputCls + ' sm:w-36'}>
              <option value="">Tout</option>
              <option value="vente">Vente</option>
              <option value="loyer">Location</option>
            </select>
            <button type="submit"
              className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg text-sm transition-colors whitespace-nowrap">
              Rechercher
            </button>
          </form>
        </div>
      </section>

      {/* ── Annonces ── */}
      <section className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Annonces</h2>
            {!loading && (
              <p className="text-xs text-gray-400 mt-0.5">
                {total} annonce{total !== 1 ? 's' : ''} disponible{total !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          <Link href="/organisations" className="text-xs text-gray-500 hover:text-gray-900 font-medium flex items-center gap-1 transition-colors">
            Voir les organisations
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-gray-100 rounded-xl animate-pulse h-64" />
            ))}
          </div>
        ) : annonces.length === 0 ? (
          <div className="text-center py-20 border border-gray-200 rounded-xl">
            <svg className="w-8 h-8 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            <p className="text-sm font-medium text-gray-600">Aucune annonce trouvée</p>
            <p className="text-xs text-gray-400 mt-1">Essayez d&apos;autres critères.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {annonces.map((a) => <AnnonceCard key={a.id} annonce={a} />)}
            </div>
            {page < lastPage && (
              <div className="mt-8 text-center">
                <button onClick={() => loadAnnonces(page + 1, false)} disabled={loadingMore}
                  className="px-6 py-2.5 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-lg text-sm transition-colors disabled:opacity-40">
                  {loadingMore ? 'Chargement…' : `Charger plus (${total - annonces.length} restantes)`}
                </button>
              </div>
            )}
            {page >= lastPage && annonces.length > 0 && (
              <p className="mt-8 text-center text-xs text-gray-400">
                {total} annonce{total !== 1 ? 's' : ''} au total
              </p>
            )}
          </>
        )}
      </section>

      {/* ── CTA ── */}
      <section className="border-t border-gray-100 py-14 px-6 bg-gray-50">
        <div className="max-w-xl mx-auto text-center">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-3">Pour les professionnels</p>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Vous êtes une organisation immobilière ?</h2>
          <p className="text-gray-500 text-sm mb-7">
            Gérez vos biens, annonces, contrats et clients sur Domtek.
          </p>
          <Link href="/register/organisation"
            className="inline-block px-7 py-3 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-colors text-sm">
            Créer un compte organisation
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-200 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gray-900 rounded-md flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
              </svg>
            </div>
            <span className="text-sm font-bold text-gray-900">Domtek</span>
          </div>
          <p className="text-xs text-gray-400">© {new Date().getFullYear()} Domtek. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}
