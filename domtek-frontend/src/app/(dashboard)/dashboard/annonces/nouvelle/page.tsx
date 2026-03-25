'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Bien } from '@/types';
import { AxiosError } from 'axios';

export default function NouvelleAnnoncePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [biens, setBiens] = useState<Bien[]>([]);
  const [form, setForm] = useState({
    titre: '', description: '', bien_id: '', statut: 'brouillon', date_publication: '',
  });
  const [photos, setPhotos]       = useState<File[]>([]);
  const [previews, setPreviews]   = useState<string[]>([]);
  const [errors, setErrors]       = useState<Record<string, string[]>>({});
  const [loading, setLoading]     = useState(false);

  useEffect(() => {
    api.get('/org/biens?per_page=100')
      .then(({ data }) => setBiens(data.data ?? []))
      .catch(() => {});
  }, []);

  const set = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files);
    setPhotos((prev) => [...prev, ...arr]);
    const urls = arr.map((f) => URL.createObjectURL(f));
    setPreviews((prev) => [...prev, ...urls]);
  };

  const removePhoto = (index: number) => {
    URL.revokeObjectURL(previews[index]);
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('titre', form.titre);
      fd.append('description', form.description);
      if (form.bien_id) fd.append('bien_id', form.bien_id);
      fd.append('statut', form.statut);
      if (form.date_publication) fd.append('date_publication', form.date_publication);
      photos.forEach((f) => fd.append('photos[]', f));

      await api.post('/org/annonces', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      router.push('/dashboard/annonces');
    } catch (err) {
      const axiosError = err as AxiosError<{ errors?: Record<string, string[]>; message?: string }>;
      setErrors(axiosError.response?.data?.errors ?? {});
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <Link href="/dashboard/annonces" className="text-sm text-gray-400 hover:text-gray-600">← Retour</Link>
        <h1 className="text-2xl font-bold text-gray-800 mt-2">Nouvelle annonce</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
            <input type="text" value={form.titre} onChange={set('titre')} placeholder="Beau F3 lumineux…"
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
              <option value="">— Sélectionner un bien —</option>
              {biens.map((b) => (
                <option key={b.id} value={b.id}>{b.titre} ({b.ville})</option>
              ))}
            </select>
            {errors.bien_id && <p className="text-red-500 text-xs mt-1">{errors.bien_id[0]}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
              <select value={form.statut} onChange={set('statut')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="brouillon">Brouillon</option>
                <option value="planifiee">Planifiée</option>
                <option value="publiee">Publier maintenant</option>
              </select>
            </div>
            {form.statut === 'planifiee' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date de publication</label>
                <input type="datetime-local" value={form.date_publication} onChange={set('date_publication')}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                {errors.date_publication && <p className="text-red-500 text-xs mt-1">{errors.date_publication[0]}</p>}
              </div>
            )}
          </div>

          {/* Photos */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Photos</label>
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition"
            >
              <p className="text-sm text-gray-400">Cliquez ou glissez des photos ici</p>
              <p className="text-xs text-gray-300 mt-1">JPG, PNG, WEBP — max 5 Mo chacune</p>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
              onChange={(e) => handleFiles(e.target.files)} />
            {errors['photos'] && <p className="text-red-500 text-xs mt-1">{errors['photos'][0]}</p>}
            {errors['photos.0'] && <p className="text-red-500 text-xs mt-1">{errors['photos.0'][0]}</p>}

            {previews.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mt-3">
                {previews.map((url, i) => (
                  <div key={i} className="relative group aspect-square">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="w-full h-full object-cover rounded-lg" />
                    <button type="button" onClick={() => removePhoto(i)}
                      className="absolute top-1 right-1 bg-black/60 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition">
              {loading ? 'Enregistrement…' : 'Créer l\'annonce'}
            </button>
            <Link href="/dashboard/annonces"
              className="px-6 py-2.5 border border-gray-300 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition">
              Annuler
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
