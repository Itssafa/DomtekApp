'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Annonce } from '@/types';

const TYPE_LABELS: Record<string, string> = { vente: 'Vente', loyer: 'Location' };
const TYPE_COLORS: Record<string, string> = {
  vente: 'bg-blue-100 text-blue-700',
  loyer: 'bg-emerald-100 text-emerald-700',
};
const TYPE_BIEN_LABELS: Record<string, string> = {
  appartement: 'Appartement', maison: 'Maison', villa: 'Villa',
  bureau: 'Bureau', terrain: 'Terrain', autre: 'Autre',
};

function AnnonceCard({ annonce }: { annonce: Annonce }) {
  return (
    <Link
      href={`/annonces/${annonce.id}`}
      className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group flex flex-col border border-gray-100 hover:-translate-y-1"
    >
      {/* Image */}
      <div className="h-48 bg-gray-100 relative overflow-hidden flex-shrink-0">
        {annonce.bien?.image_principale ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={annonce.bien.image_principale.url}
            alt={annonce.titre}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 text-gray-300 gap-2">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
          </div>
        )}
        {annonce.bien && (
          <span className={`absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm ${TYPE_COLORS[annonce.bien.type_transaction] ?? 'bg-gray-100 text-gray-600'}`}>
            {TYPE_LABELS[annonce.bien.type_transaction]}
          </span>
        )}
      </div>

      {/* Contenu */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-gray-800 text-sm leading-tight mb-1.5 line-clamp-2">
          {annonce.titre}
        </h3>
        {annonce.bien && (
          <p className="text-xs text-gray-400 mb-3 capitalize">
            {TYPE_BIEN_LABELS[annonce.bien.type_bien] ?? annonce.bien.type_bien}
            {annonce.bien.ville && ` · ${annonce.bien.ville}`}
            {annonce.bien.superficie && ` · ${annonce.bien.superficie} m²`}
          </p>
        )}
        <p className="text-base font-bold text-blue-600 mb-3">
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
            <div className="w-6 h-6 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-3.5 h-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
              </svg>
            </div>
            <span className="text-xs text-gray-500 truncate">{annonce.organisation.nom}</span>
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

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Header ── */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <svg className="w-4.5 h-4.5 text-white w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
              </svg>
            </div>
            <span className="text-lg font-bold text-gray-900">Domtek</span>
          </Link>
          <nav className="flex items-center gap-2 text-sm">
            <Link href="/annonces" className="px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg font-medium transition-colors">
              Annonces
            </Link>
            <Link href="/organisations" className="px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg font-medium transition-colors">
              Organisations
            </Link>
            <Link href="/login"
              className="ml-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg transition-all shadow-sm hover:shadow-md">
              Connexion
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 text-white pt-20 pb-24 overflow-hidden">
        {/* Décorations */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-10 left-[10%] w-72 h-72 bg-blue-400/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-[5%] w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-white/5 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2" />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center animate-slide-up">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm text-blue-100 text-xs font-medium px-4 py-1.5 rounded-full mb-6 border border-white/20">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
            Plateforme immobilière en Tunisie
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 leading-tight tracking-tight">
            Trouvez votre bien<br />idéal en Tunisie
          </h1>
          <p className="text-blue-100 text-lg mb-10">
            Vente, location — appartements, maisons, villas, bureaux et terrains
          </p>

          {/* Barre de recherche */}
          <form onSubmit={(e) => e.preventDefault()}
            className="bg-white rounded-2xl shadow-2xl p-3 flex flex-col sm:flex-row gap-2.5">
            <div className="flex-1 relative">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
              </svg>
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Titre, description…"
                className="w-full pl-9 pr-4 py-2.5 text-sm text-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 border border-gray-100" />
            </div>
            <div className="relative">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
              <input type="text" value={ville} onChange={(e) => setVille(e.target.value)}
                placeholder="Ville"
                className="w-full sm:w-32 pl-9 pr-4 py-2.5 text-sm text-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 border border-gray-100" />
            </div>
            <select value={typeTransaction} onChange={(e) => setTypeTransaction(e.target.value)}
              className="border border-gray-100 bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Vente & Location</option>
              <option value="vente">Vente</option>
              <option value="loyer">Location</option>
            </select>
            <button type="submit"
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl text-sm transition-all shadow-sm hover:shadow-md whitespace-nowrap">
              Rechercher
            </button>
          </form>
        </div>
      </section>

      {/* ── Annonces ── */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-7">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Toutes les annonces</h2>
            {!loading && (
              <p className="text-sm text-gray-400 mt-0.5">
                {total} annonce{total !== 1 ? 's' : ''} disponible{total !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          <Link href="/organisations" className="text-sm text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 transition-colors">
            Voir les organisations
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm animate-pulse h-72" />
            ))}
          </div>
        ) : annonces.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-base font-semibold text-gray-600">Aucune annonce trouvée</p>
            <p className="text-sm text-gray-400 mt-1">Essayez d&apos;autres critères de recherche.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {annonces.map((a) => <AnnonceCard key={a.id} annonce={a} />)}
            </div>
            {page < lastPage && (
              <div className="mt-10 text-center">
                <button onClick={() => loadAnnonces(page + 1, false)} disabled={loadingMore}
                  className="px-8 py-3 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-xl text-sm transition-all hover:shadow-sm disabled:opacity-40">
                  {loadingMore ? 'Chargement…' : `Charger plus · ${total - annonces.length} restante(s)`}
                </button>
              </div>
            )}
            {page >= lastPage && annonces.length > 0 && (
              <p className="mt-8 text-center text-xs text-gray-400">
                Toutes les annonces ont été chargées ({total} au total)
              </p>
            )}
          </>
        )}
      </section>

      {/* ── CTA ── */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-10 text-center text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/3 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/4" />
          <div className="relative z-10">
            <h2 className="text-3xl font-bold mb-3">Vous êtes une organisation immobilière ?</h2>
            <p className="text-blue-100 mb-7 text-base">
              Créez votre compte et gérez vos biens, annonces et clients sur Domtek.
            </p>
            <Link href="/register/organisation"
              className="inline-block px-8 py-3.5 bg-white text-blue-700 font-bold rounded-xl hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5">
              Créer un compte organisation
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-gray-900 text-gray-400 text-sm py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
              </svg>
            </div>
            <span className="text-white font-bold text-base">Domtek</span>
          </div>
          <p>© {new Date().getFullYear()} Domtek. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}
