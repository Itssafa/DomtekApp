'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from '@/components/OrgLink';
import api from '@/lib/api';
import { Annonce, AnnoncePhoto, Bien } from '@/types';

const Field = ({ label, value }: { label: string; value?: string | null }) => (
  <div>
    <p className="text-xs text-gray-400 mb-0.5">{label}</p>
    <p className="text-sm text-gray-800 font-medium">{value || '—'}</p>
  </div>
);

const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('fr-FR', { dateStyle: 'long' }) : '—';

const STATUT_LABELS: Record<string, string> = {
  brouillon: 'Brouillon', planifiee: 'Planifiée', publiee: 'Publiée', archivee: 'Archivée',
};
const STATUT_COLORS: Record<string, string> = {
  brouillon: 'bg-gray-100 text-gray-600',
  planifiee: 'bg-yellow-100 text-yellow-700',
  publiee:   'bg-green-100 text-green-700',
  archivee:  'bg-red-100 text-red-600',
};

export default function AnnonceShowPage() {
  const { id } = useParams<{ id: string }>();

  const [biens, setBiens]               = useState<Bien[]>([]);
  const [photos, setPhotos]             = useState<AnnoncePhoto[]>([]);
  const [form, setFormData]             = useState({ titre: '', description: '', bien_id: '', statut: 'brouillon', date_publication: '' });
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<{ data: Annonce }>(`/org/annonces/${id}`),
      api.get('/org/biens?per_page=100'),
    ]).then(([annonceRes, biensRes]) => {
      const a = annonceRes.data.data;
      setFormData({
        titre:            a.titre,
        description:      a.description ?? '',
        bien_id:          String(a.bien?.id ?? ''),
        statut:           a.statut,
        date_publication: a.date_publication ?? '',
      });
      setPhotos(a.photos ?? []);
      setBiens(biensRes.data.data ?? []);
    }).catch(() => {})
    .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-8 animate-pulse h-40 bg-gray-100 rounded-xl" />;

  const selectedBien = biens.find(b => String(b.id) === form.bien_id) ?? null;

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <Link href="/dashboard/annonces" className="text-sm text-gray-400 hover:text-gray-600">← Retour</Link>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-800">{form.titre}</h1>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUT_COLORS[form.statut] ?? ''}`}>
              {STATUT_LABELS[form.statut] ?? form.statut}
            </span>
          </div>
          <Link href={`/dashboard/annonces/${id}/modifier`}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition">
            Modifier
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Bien associé" value={selectedBien?.designation} />
          {form.statut === 'planifiee' && (
            <Field label="Date de publication" value={fmtDate(form.date_publication)} />
          )}
        </div>

        {form.description && (
          <div>
            <p className="text-xs text-gray-400 mb-1">Description</p>
            <p className="text-sm text-gray-700 whitespace-pre-line">{form.description}</p>
          </div>
        )}

        {photos.length > 0 && (
          <div>
            <p className="text-xs text-gray-400 mb-2">Photos ({photos.length})</p>
            <div className="grid grid-cols-4 gap-2">
              {photos.map((photo) => (
                <div key={photo.id} className="aspect-square">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.url} alt="" className="w-full h-full object-cover rounded-lg" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
