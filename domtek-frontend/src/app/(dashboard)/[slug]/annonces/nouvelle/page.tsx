'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from '@/components/OrgLink';
import api from '@/lib/api';
import { orgPath } from '@/lib/org-path';
import { Bien } from '@/types';
import { AxiosError } from 'axios';
import StepForm, { FormStep } from '@/components/StepForm';
import { Champ } from '@/components/Champ';

const cls = 'w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500';

export default function NouvelleAnnoncePage() {
  const router       = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [biens, setBiens]       = useState<Bien[]>([]);
  const [form, setForm]         = useState({ titre: '', description: '', bien_id: '', statut: 'brouillon', date_publication: '' });
  const [photos, setPhotos]     = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [errors, setErrors]     = useState<Record<string, string[]>>({});
  const [loading, setLoading]   = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError]     = useState('');

  useEffect(() => {
    api.get('/org/biens?per_page=100').then(({ data }) => setBiens(data.data ?? [])).catch(() => {});
  }, []);

  const generateDescription = async () => {
    if (!form.bien_id || generating) return;
    setGenerating(true);
    setGenError('');
    try {
      const { data } = await api.post(`/org/biens/${form.bien_id}/generate-description`);
      setForm((prev) => ({ ...prev, description: data.description ?? '' }));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? 'Erreur de génération. Réessayez.';
      setGenError(msg);
    } finally {
      setGenerating(false);
    }
  };

  const set = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files);
    setPhotos((prev) => [...prev, ...arr]);
    setPreviews((prev) => [...prev, ...arr.map((f) => URL.createObjectURL(f))]);
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
      await api.post('/org/annonces', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      router.push(orgPath('/dashboard/annonces'));
    } catch (err) {
      const axiosError = err as AxiosError<{ errors?: Record<string, string[]>; message?: string }>;
      setErrors(axiosError.response?.data?.errors ?? {});
    } finally {
      setLoading(false);
    }
  };

  const steps: FormStep[] = [
    {
      title: 'Annonce',
      validate: () => {
        if (!form.titre.trim()) return 'Le titre est obligatoire.';
        if (!form.bien_id) return 'Veuillez sélectionner un bien associé.';
        return null;
      },
      content: (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
            <input type="text" value={form.titre} onChange={set('titre')} placeholder="Beau F3 lumineux…" className={cls} />
            <Champ nom="titre" form={form} erreur={errors.titre?.[0]} />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <button
                type="button"
                onClick={generateDescription}
                disabled={!form.bien_id || generating}
                className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg border transition
                  disabled:opacity-40 disabled:cursor-not-allowed
                  bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600
                  text-white border-transparent shadow-sm"
              >
                {generating ? (
                  <>
                    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Génération…
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Générer avec IA
                  </>
                )}
              </button>
            </div>
            {genError && (
              <p className="text-amber-600 text-xs mb-1 flex items-center gap-1">
                <span>⚠</span> {genError}
              </p>
            )}
            <textarea value={form.description} onChange={set('description')} rows={4} className={cls}
              placeholder={!form.bien_id ? "Sélectionnez d'abord un bien pour activer la génération IA…" : 'Description de l\'annonce…'} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bien associé *</label>
            <select value={form.bien_id} onChange={set('bien_id')} className={cls}>
              <option value="">— Sélectionner un bien —</option>
              {biens.map((b) => (
                <option key={b.id} value={b.id}>{b.designation} ({b.ville})</option>
              ))}
            </select>
            <Champ nom="bien_id" form={form} erreur={errors.bien_id?.[0]} />
          </div>
        </>
      ),
    },
    {
      title: 'Publication',
      content: (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
              <select value={form.statut} onChange={set('statut')} className={cls}>
                <option value="brouillon">Brouillon</option>
                <option value="planifiee">Planifiée</option>
                <option value="publiee">Publier maintenant</option>
              </select>
            </div>
            {form.statut === 'planifiee' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date de publication</label>
                <input type="datetime-local" value={form.date_publication} onChange={set('date_publication')} className={cls} />
                {errors.date_publication && <p className="text-red-500 text-xs mt-1">{errors.date_publication[0]}</p>}
              </div>
            )}
          </div>
        </>
      ),
    },
    {
      title: 'Photos',
      content: (
        <>
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
        </>
      ),
    },
  ];

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <Link href="/dashboard/annonces" className="text-sm text-gray-400 hover:text-gray-600">← Retour</Link>
        <h1 className="text-2xl font-bold text-gray-800 mt-2">Nouvelle annonce</h1>
      </div>
      <StepForm
        steps={steps}
        onSubmit={handleSubmit}
        submitLabel="Créer l'annonce"
        loading={loading}
        cancelHref="/dashboard/annonces"
      />
    </div>
  );
}
