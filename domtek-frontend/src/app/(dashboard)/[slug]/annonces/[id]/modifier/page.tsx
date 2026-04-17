'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from '@/components/OrgLink';
import api from '@/lib/api';
import { orgPath } from '@/lib/org-path';
import { Annonce, AnnoncePhoto, Bien } from '@/types';
import { AxiosError } from 'axios';

export default function ModifierAnnoncePage() {
  const { id }       = useParams<{ id: string }>();
  const router       = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [biens, setBiens]                       = useState<Bien[]>([]);
  const [existingPhotos, setExistingPhotos]     = useState<AnnoncePhoto[]>([]);
  const [newFiles, setNewFiles]                 = useState<File[]>([]);
  const [newPreviews, setNewPreviews]           = useState<string[]>([]);
  const [deletingPhotoId, setDeletingPhotoId]   = useState<number | null>(null);
  const [uploadingPhotos, setUploadingPhotos]   = useState(false);

  const [form, setForm] = useState({
    titre: '', description: '', bien_id: '', statut: 'brouillon', date_publication: '',
  });
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);

  const fetchAnnonce = () => {
    setLoading(true);
    Promise.all([
      api.get<{ data: Annonce }>(`/org/annonces/${id}`),
      api.get('/org/biens?per_page=100'),
    ]).then(([annonceRes, biensRes]) => {
      const a = annonceRes.data.data;
      setForm({
        titre:            a.titre,
        description:      a.description ?? '',
        bien_id:          String(a.bien?.id ?? ''),
        statut:           a.statut,
        date_publication: a.date_publication
          ? a.date_publication.replace(' ', 'T').substring(0, 16)
          : '',
      });
      setExistingPhotos(a.photos ?? []);
      setBiens(biensRes.data.data ?? []);
    }).catch(() => {})
    .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAnnonce(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files);
    setNewFiles((prev) => [...prev, ...arr]);
    setNewPreviews((prev) => [...prev, ...arr.map((f) => URL.createObjectURL(f))]);
  };

  const removeNewFile = (index: number) => {
    URL.revokeObjectURL(newPreviews[index]);
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
    setNewPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDeletePhoto = async (photoId: number) => {
    setDeletingPhotoId(photoId);
    try {
      await api.delete(`/org/annonces/${id}/photos/${photoId}`);
      setExistingPhotos((prev) => prev.filter((p) => p.id !== photoId));
    } catch { /* noop */ }
    finally { setDeletingPhotoId(null); }
  };

  const handleUploadNewPhotos = async () => {
    if (!newFiles.length) return;
    setUploadingPhotos(true);
    try {
      const fd = new FormData();
      newFiles.forEach((f) => fd.append('photos[]', f));
      const { data } = await api.post(`/org/annonces/${id}/photos`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setExistingPhotos((prev) => [...prev, ...(data.photos ?? [])]);
      newPreviews.forEach((url) => URL.revokeObjectURL(url));
      setNewFiles([]);
      setNewPreviews([]);
    } catch { /* noop */ }
    finally { setUploadingPhotos(false); }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSaving(true);
    try {
      await api.put(`/org/annonces/${id}`, {
        ...form,
        bien_id:          form.bien_id ? Number(form.bien_id) : undefined,
        date_publication: form.date_publication || undefined,
      });
      router.push(orgPath(`/dashboard/annonces/${id}`));
    } catch (err) {
      const axiosError = err as AxiosError<{ errors?: Record<string, string[]> }>;
      setErrors(axiosError.response?.data?.errors ?? {});
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 animate-pulse h-40 bg-gray-100 rounded-xl" />;

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <Link href={`/dashboard/annonces/${id}`} className="text-sm text-gray-400 hover:text-gray-600">← Retour à la fiche</Link>
        <h1 className="text-2xl font-bold text-gray-800 mt-2">Modifier l&apos;annonce</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
            <input type="text" value={form.titre} onChange={set('titre')}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            {errors.titre && <p className="text-red-500 text-xs mt-1">{errors.titre[0]}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={form.description} onChange={set('description')} rows={4}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bien associé</label>
            <select value={form.bien_id} onChange={set('bien_id')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">— Sélectionner —</option>
              {biens.map((b) => <option key={b.id} value={b.id}>{b.designation}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
              <select value={form.statut} onChange={set('statut')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="brouillon">Brouillon</option>
                <option value="planifiee">Planifiée</option>
                <option value="publiee">Publiée</option>
                <option value="archivee">Archivée</option>
              </select>
            </div>
            {form.statut === 'planifiee' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date de publication</label>
                <input type="datetime-local" value={form.date_publication} onChange={set('date_publication')}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={saving}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition">
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
            <Link href={`/dashboard/annonces/${id}`}
              className="px-6 py-2.5 border border-gray-300 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition">
              Annuler
            </Link>
          </div>
        </form>

        {/* Section photos */}
        <div className="border-t border-gray-100 pt-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Photos de l&apos;annonce</h2>
          {existingPhotos.length > 0 && (
            <div className="grid grid-cols-4 gap-2 mb-4">
              {existingPhotos.map((photo) => (
                <div key={photo.id} className="relative group aspect-square">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.url} alt="" className="w-full h-full object-cover rounded-lg" />
                  <button type="button" onClick={() => handleDeletePhoto(photo.id)} disabled={deletingPhotoId === photo.id}
                    className="absolute top-1 right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition disabled:opacity-40">
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          <div onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
            className="border-2 border-dashed border-gray-300 rounded-lg p-5 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition">
            <p className="text-sm text-gray-400">Cliquez ou glissez des photos ici</p>
            <p className="text-xs text-gray-300 mt-1">JPG, PNG, WEBP — max 5 Mo chacune</p>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
            onChange={(e) => handleFiles(e.target.files)} />
          {newPreviews.length > 0 && (
            <div className="mt-3">
              <div className="grid grid-cols-4 gap-2">
                {newPreviews.map((url, i) => (
                  <div key={i} className="relative group aspect-square">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="w-full h-full object-cover rounded-lg border-2 border-blue-300" />
                    <button type="button" onClick={() => removeNewFile(i)}
                      className="absolute top-1 right-1 bg-black/60 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={handleUploadNewPhotos} disabled={uploadingPhotos}
                className="mt-3 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition">
                {uploadingPhotos ? 'Envoi…' : `Ajouter ${newFiles.length} photo${newFiles.length > 1 ? 's' : ''}`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
