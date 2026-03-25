'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Annonce } from '@/types';

const TYPE_LABELS: Record<string, string> = {
  vente: 'Vente',
  loyer: 'Location',
};

const TYPE_COLORS: Record<string, string> = {
  vente: 'bg-blue-100 text-blue-700',
  loyer: 'bg-green-100 text-green-700',
};

const TYPE_BIEN_LABELS: Record<string, string> = {
  appartement: 'Appartement',
  maison: 'Maison',
  villa: 'Villa',
  bureau: 'Bureau',
  terrain: 'Terrain',
  autre: 'Autre',
};

function AnnonceCard({ annonce }: { annonce: Annonce }) {
  return (
    <Link
      href={`/annonces/${annonce.id}`}
      className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden group flex flex-col"
    >
      {/* Image */}
      <div className="h-48 bg-gray-100 relative overflow-hidden flex-shrink-0">
        {annonce.bien?.image_principale ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={annonce.bien.image_principale.url}
            alt={annonce.titre}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-200 gap-2">
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
          </div>
        )}
        {annonce.bien && (
          <span className={`absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full ${TYPE_COLORS[annonce.bien.type_transaction] ?? 'bg-gray-100 text-gray-600'}`}>
            {TYPE_LABELS[annonce.bien.type_transaction]}
          </span>
        )}
      </div>

      {/* Contenu */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-gray-800 text-sm leading-tight mb-1 line-clamp-2">
          {annonce.titre}
        </h3>

        {annonce.bien && (
          <p className="text-xs text-gray-400 mb-2 capitalize">
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

        {/* Agence */}
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
  const [annonces, setAnnonces] = useState<Annonce[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Filtres (valeurs des inputs)
  const [search, setSearch] = useState('');
  const [ville, setVille] = useState('');
  const [typeTransaction, setTypeTransaction] = useState('');

  // Valeurs debouncées pour les champs texte (400 ms)
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [debouncedVille, setDebouncedVille] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedVille(ville), 400);
    return () => clearTimeout(t);
  }, [ville]);

  // Charger les annonces (reset ou append)
  const loadAnnonces = useCallback((p: number, reset: boolean) => {
    if (reset) setLoading(true);
    else setLoadingMore(true);

    const params = new URLSearchParams({ page: String(p), per_page: '12' });
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (debouncedVille) params.set('ville', debouncedVille);
    if (typeTransaction) params.set('type_transaction', typeTransaction);

    api.get(`/annonces?${params}`)
      .then(({ data }) => {
        const items: Annonce[] = data.data ?? [];
        setAnnonces((prev) => reset ? items : [...prev, ...items]);
        setLastPage(data.meta?.last_page ?? 1);
        setTotal(data.meta?.total ?? 0);
        setPage(p);
      })
      .catch(() => {})
      .finally(() => {
        setLoading(false);
        setLoadingMore(false);
      });
  }, [debouncedSearch, debouncedVille, typeTransaction]);

  // Recherche automatique dès que les filtres changent
  useEffect(() => {
    loadAnnonces(1, true);
  }, [loadAnnonces]);

  const handleLoadMore = () => {
    if (page < lastPage) loadAnnonces(page + 1, false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-gray-900">Domtek</Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link href="/annonces" className="text-gray-600 hover:text-gray-900 font-medium">
              Annonces
            </Link>
            <Link href="/agences" className="text-gray-600 hover:text-gray-900 font-medium">
              Agences
            </Link>
            <Link
              href="/login"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
            >
              Connexion
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero + Recherche */}
      <section className="bg-gradient-to-br from-blue-700 to-blue-500 text-white py-16">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h1 className="text-4xl font-extrabold mb-3 leading-tight">
            Trouvez votre bien idéal en Tunisie
          </h1>
          <p className="text-blue-100 text-lg mb-8">
            Vente, location — appartements, maisons, villas, bureaux et terrains
          </p>

          <form onSubmit={(e) => e.preventDefault()}
            className="bg-white rounded-2xl shadow-xl p-4 flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Titre, description…"
              className="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              value={ville}
              onChange={(e) => setVille(e.target.value)}
              placeholder="Ville"
              className="w-32 border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={typeTransaction}
              onChange={(e) => setTypeTransaction(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Vente & Location</option>
              <option value="vente">Vente</option>
              <option value="loyer">Location</option>
            </select>
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm transition whitespace-nowrap"
            >
              Rechercher
            </button>
          </form>
        </div>
      </section>

      {/* Liste des annonces */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Toutes les annonces</h2>
            {!loading && (
              <p className="text-sm text-gray-400 mt-0.5">
                {total} annonce{total !== 1 ? 's' : ''} disponible{total !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          <Link href="/agences" className="text-sm text-blue-600 hover:underline font-medium">
            Voir les agences →
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm animate-pulse h-72" />
            ))}
          </div>
        ) : annonces.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <svg className="w-14 h-14 mx-auto mb-4 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            <p className="text-base font-medium text-gray-500">Aucune annonce trouvée</p>
            <p className="text-sm mt-1">Essayez d'autres critères de recherche.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {annonces.map((a) => <AnnonceCard key={a.id} annonce={a} />)}
            </div>

            {/* Charger plus */}
            {page < lastPage && (
              <div className="mt-10 text-center">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="px-8 py-3 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-lg text-sm transition disabled:opacity-40"
                >
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

      {/* CTA Agences */}
      <section className="bg-white border-t border-gray-100 py-14">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-3">
            Vous êtes une agence immobilière ?
          </h2>
          <p className="text-gray-500 mb-6">
            Créez votre compte et gérez vos biens, annonces et clients sur Domtek.
          </p>
          <Link
            href="/register/organisation"
            className="inline-block px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
          >
            Créer un compte agence
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 text-sm py-8">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <p className="text-white font-bold">Domtek</p>
          <p>© {new Date().getFullYear()} Domtek. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}
