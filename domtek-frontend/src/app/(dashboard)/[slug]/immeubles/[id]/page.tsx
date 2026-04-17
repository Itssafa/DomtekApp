'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from '@/components/OrgLink';
import api from '@/lib/api';
import { Immeuble, ImmeublePhoto } from '@/types';

const Section = ({ title }: { title: string }) => (
  <div className="flex items-center gap-3 pt-2">
    <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide whitespace-nowrap">{title}</span>
    <div className="flex-1 h-px bg-gray-200" />
  </div>
);

const Field = ({ label, value }: { label: string; value?: string | null }) => (
  <div>
    <p className="text-xs text-gray-400 mb-0.5">{label}</p>
    <p className="text-sm text-gray-800 font-medium">{value || '—'}</p>
  </div>
);

export default function ImmeubleShowPage() {
  const { id }    = useParams<{ id: string }>();
  const photosRef = useRef<HTMLInputElement>(null);

  const [immeuble, setImmeuble]     = useState<Immeuble | null>(null);
  const [uploading, setUploading]   = useState(false);
  const [deletingPhotoId, setDeletingPhotoId] = useState<number | null>(null);
  const [loading, setLoading]       = useState(true);

  const fetchImmeuble = () => {
    api.get<{ data: Immeuble }>(`/org/immeubles/${id}`)
      .then(({ data }) => setImmeuble(data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchImmeuble(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAddPhotos = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      const fd = new FormData();
      Array.from(files).forEach((f) => fd.append('photos[]', f));
      const { data: res } = await api.post(`/org/immeubles/${id}/photos`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImmeuble(res.data);
    } catch { /* noop */ }
    finally { setUploading(false); }
  };

  const handleDeletePhoto = async (photo: ImmeublePhoto) => {
    if (!confirm('Supprimer cette photo ?')) return;
    setDeletingPhotoId(photo.id);
    try {
      await api.delete(`/org/immeubles/${id}/photos/${photo.id}`);
      setImmeuble((prev) => prev
        ? { ...prev, photos: prev.photos?.filter((p) => p.id !== photo.id) }
        : prev
      );
    } catch { /* noop */ }
    finally { setDeletingPhotoId(null); }
  };

  if (loading) return <div className="p-8 animate-pulse h-40 bg-gray-100 rounded-xl m-8" />;
  if (!immeuble) return <div className="p-8"><p className="text-red-600 font-semibold">Immeuble introuvable.</p></div>;

  const typeUsageLabel: Record<string, string> = { residentiel: 'Résidentiel', professionnel: 'Professionnel', mixte: 'Mixte' };
  const typePropLabel: Record<string, string>  = { auto_propriete: 'Auto-propriété', co_propriete: 'Co-propriété' };

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <Link href="/dashboard/immeubles" className="text-sm text-gray-400 hover:text-gray-600">← Retour</Link>
        <div className="flex items-center justify-between mt-2">
          <h1 className="text-2xl font-bold text-gray-800">{immeuble.nom}</h1>
          <Link href={`/dashboard/immeubles/${id}/modifier`}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition">
            Modifier
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 mb-6 space-y-5">
        <Section title="Identification" />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Type d'usage" value={typeUsageLabel[immeuble.type_usage] ?? immeuble.type_usage} />
          <Field label="Type de propriété" value={typePropLabel[immeuble.type_propriete] ?? immeuble.type_propriete} />
        </div>

        <Section title="Structure" />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Nombre d'étages" value={String(immeuble.nb_etages)} />
          {immeuble.a_blocs && immeuble.nb_blocs && <Field label="Nombre de blocs" value={String(immeuble.nb_blocs)} />}
        </div>
        <div className="flex gap-3 flex-wrap">
          {immeuble.sous_sol && <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">Sous-sol</span>}
          {immeuble.cameras_surveillance && <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">Caméras de surveillance</span>}
        </div>

        <Section title="Localisation" />
        <div className="grid grid-cols-3 gap-4">
          <Field label="Adresse" value={immeuble.adresse} />
          <Field label="Ville" value={immeuble.ville} />
          <Field label="Pays" value={immeuble.pays} />
        </div>
      </div>

      {/* Photos */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-700">Photos ({immeuble.photos?.length ?? 0})</h2>
          <button onClick={() => photosRef.current?.click()} disabled={uploading}
            className="text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg transition">
            {uploading ? 'Envoi…' : '+ Ajouter'}
          </button>
        </div>
        <input ref={photosRef} type="file" multiple accept=".jpg,.jpeg,.png,.webp" className="hidden"
          onChange={(e) => handleAddPhotos(e.target.files)} />

        {!immeuble.photos?.length ? (
          <div onClick={() => photosRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded-lg px-4 py-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition">
            <p className="text-sm text-gray-400">Cliquer pour ajouter des photos</p>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {immeuble.photos.map((photo) => (
              <div key={photo.id} className="relative group aspect-square">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.url} alt="" className="w-full h-full object-cover rounded-lg" />
                <button type="button" onClick={() => handleDeletePhoto(photo)} disabled={deletingPhotoId === photo.id}
                  className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition flex items-center justify-center disabled:opacity-60">
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
