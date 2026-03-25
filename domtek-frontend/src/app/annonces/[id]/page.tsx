'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Annonce, BienImage } from '@/types';

const TYPE_LABELS: Record<string, string> = {
  vente: 'Vente', loyer: 'Location',
};

const TYPE_BIEN_LABELS: Record<string, string> = {
  appartement: 'Appartement', maison: 'Maison', villa: 'Villa',
  bureau: 'Bureau', terrain: 'Terrain', autre: 'Autre',
};

export default function AnnonceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [annonce, setAnnonce] = useState<Annonce | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);

  useEffect(() => {
    api.get<{ data: Annonce }>(`/annonces/${id}`)
      .then(({ data }) => setAnnonce(data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-5xl mx-auto px-6 py-10 animate-pulse space-y-6">
          <div className="h-72 bg-gray-200 rounded-2xl" />
          <div className="h-8 bg-gray-200 rounded w-1/2" />
          <div className="h-4 bg-gray-200 rounded w-1/3" />
        </div>
      </div>
    );
  }

  if (!annonce) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">Annonce introuvable.</p>
      </div>
    );
  }

  const bien = annonce.bien;
  const images: BienImage[] = bien?.images ?? (bien?.image_principale ? [bien.image_principale] : []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-5xl mx-auto px-6 py-8">
        <Link href="/annonces" className="text-sm text-gray-400 hover:text-gray-600 mb-6 inline-block">
          ← Retour aux annonces
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-6">
            {/* Galerie photos */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="h-72 bg-gray-100 relative">
                {images.length > 0 ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={images[activeImg]?.url} alt={annonce.titre}
                    className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-200">
                    <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                        d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                )}
              </div>
              {images.length > 1 && (
                <div className="flex gap-2 p-3 overflow-x-auto">
                  {images.map((img, i) => (
                    <button key={img.id} onClick={() => setActiveImg(i)}
                      className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition ${i === activeImg ? 'border-blue-500' : 'border-transparent'}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Titre + description */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <h1 className="text-xl font-bold text-gray-800 leading-tight">{annonce.titre}</h1>
                {bien && (
                  <span className={`flex-shrink-0 text-xs font-semibold px-3 py-1 rounded-full ${bien.type_transaction === 'vente' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                    {TYPE_LABELS[bien.type_transaction]}
                  </span>
                )}
              </div>
              {annonce.description && (
                <p className="text-gray-600 text-sm leading-relaxed">{annonce.description}</p>
              )}
            </div>

            {/* Détails du bien */}
            {bien && (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-sm font-semibold text-gray-700 mb-4">Détails du bien</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {[
                    { label: 'Type', value: TYPE_BIEN_LABELS[bien.type_bien] ?? bien.type_bien },
                    { label: 'Ville', value: bien.ville },
                    { label: 'Superficie', value: bien.superficie ? `${bien.superficie} m²` : null },
                    { label: 'Pièces', value: bien.nb_pieces },
                    { label: 'Chambres', value: bien.nb_chambres },
                    { label: 'SDB', value: bien.nb_salles_bain },
                    { label: 'Étage', value: bien.etage },
                    { label: 'Adresse', value: bien.adresse },
                  ].filter((r) => r.value != null).map((r) => (
                    <div key={r.label} className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-400 mb-0.5">{r.label}</p>
                      <p className="text-sm font-medium text-gray-700">{String(r.value)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Colonne latérale */}
          <div className="space-y-4">
            {/* Prix */}
            {bien && (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <p className="text-3xl font-extrabold text-blue-600">
                  {Number(bien.prix).toLocaleString('fr-TN')} TND
                  {bien.type_transaction === 'loyer' && (
                    <span className="text-base font-normal text-gray-400"> /mois</span>
                  )}
                </p>
                {bien.superficie && (
                  <p className="text-xs text-gray-400 mt-1">
                    {(Number(bien.prix) / bien.superficie).toFixed(0)} TND/m²
                  </p>
                )}
              </div>
            )}

            {/* Agence */}
            {annonce.organisation && (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Agence</h3>
                <Link href={`/agences/${annonce.organisation.slug}`}
                  className="text-blue-600 hover:underline font-medium text-sm">
                  {annonce.organisation.nom}
                </Link>
                {annonce.organisation.ville && (
                  <p className="text-xs text-gray-400 mt-1">{annonce.organisation.ville}</p>
                )}
                {annonce.organisation.telephone && (
                  <a href={`tel:${annonce.organisation.telephone}`}
                    className="block mt-3 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg text-center transition">
                    📞 {annonce.organisation.telephone}
                  </a>
                )}
                {annonce.organisation.email && (
                  <a href={`mailto:${annonce.organisation.email}`}
                    className="block mt-2 px-4 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg text-center transition">
                    ✉️ Envoyer un email
                  </a>
                )}
              </div>
            )}

            {/* Publiée le */}
            {annonce.date_publication && (
              <p className="text-xs text-gray-400 text-center">
                Publiée le {new Date(annonce.date_publication).toLocaleDateString('fr-FR')}
              </p>
            )}
          </div>
        </div>
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
          <Link href="/annonces" className="text-blue-600 font-semibold">Annonces</Link>
          <Link href="/agences" className="text-gray-600 hover:text-gray-900 font-medium">Agences</Link>
          <Link href="/login" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition">
            Connexion
          </Link>
        </nav>
      </div>
    </header>
  );
}
