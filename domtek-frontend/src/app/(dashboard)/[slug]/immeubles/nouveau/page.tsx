'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from '@/components/OrgLink';
import api from '@/lib/api';
import { orgPath } from '@/lib/org-path';
import { AxiosError } from 'axios';
import { MapPreview } from '@/components/MapPreview';
import StepForm, { FormStep } from '@/components/StepForm';

const Toggle = ({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) => (
  <button type="button" onClick={() => onChange(!value)}
    className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition ${
      value ? 'bg-violet-600 border-violet-600 text-white' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
    }`}>
    <span className={`w-4 h-4 rounded-full border-2 ${value ? 'border-white bg-white' : 'border-gray-400'}`} />
    {label}
  </button>
);

export default function NouvelImmeublePage() {
  const router    = useRouter();
  const photosRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    nom: '', type_usage: 'residentiel', type_propriete: 'auto_propriete',
    a_blocs: false, nb_blocs: '', nb_etages: '0',
    adresse: '', ville: '', pays: 'Tunisie', maps_url: '',
    sous_sol: false, cameras_surveillance: false,
  });
  const [photos, setPhotos]     = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [errors, setErrors]     = useState<Record<string, string[]>>({});
  const [globalError, setGlobalError] = useState('');
  const [loading, setLoading]   = useState(false);

  const set = (field: string, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const inp = (label: string, key: string, type: React.HTMLInputTypeAttribute = 'text', placeholder = '', required = false) => (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input type={type}
        value={(form as Record<string, string | boolean>)[key] as string}
        onChange={(e) => set(key, e.target.value)}
        placeholder={placeholder}
        className={errors[key]
          ? 'w-full border border-red-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 bg-red-50'
          : 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500'} />
      {errors[key] && <p className="text-red-500 text-xs mt-1">{errors[key][0]}</p>}
    </div>
  );

  const sel = (label: string, key: string, options: { value: string; label: string }[], required = false) => (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <select value={(form as Record<string, string | boolean>)[key] as string}
        onChange={(e) => set(key, e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {errors[key] && <p className="text-red-500 text-xs mt-1">{errors[key][0]}</p>}
    </div>
  );

  const handlePhotos = (files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files);
    setPhotos((p) => [...p, ...arr]);
    setPreviews((p) => [...p, ...arr.map((f) => URL.createObjectURL(f))]);
  };

  const removePhoto = (idx: number) => {
    setPhotos((p) => p.filter((_, i) => i !== idx));
    setPreviews((p) => p.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setGlobalError('');
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (typeof v === 'boolean') fd.append(k, v ? '1' : '0');
        else if (v !== '') fd.append(k, v);
      });
      photos.forEach((f) => fd.append('photos[]', f));
      await api.post('/org/immeubles', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      router.push(orgPath('/dashboard/immeubles'));
    } catch (err) {
      const axiosError = err as AxiosError<{ errors?: Record<string, string[]>; message?: string }>;
      const fieldErrors = axiosError.response?.data?.errors;
      if (fieldErrors) setErrors(fieldErrors);
      else setGlobalError(axiosError.response?.data?.message ?? 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  const steps: FormStep[] = [
    {
      title: 'Identification',
      validate: () => {
        if (!form.nom.trim()) return "Le nom de l'immeuble est obligatoire.";
        return null;
      },
      content: (
        <>
          {inp("Nom de l'immeuble", 'nom', 'text', 'Résidence Les Jasmins', true)}
          <div className="grid grid-cols-2 gap-4">
            {sel("Type d'usage", 'type_usage', [
              { value: 'residentiel',   label: 'Résidentiel' },
              { value: 'professionnel', label: 'Professionnel' },
              { value: 'mixte',         label: 'Mixte' },
            ], true)}
            {sel('Type de propriété', 'type_propriete', [
              { value: 'auto_propriete', label: 'Auto-propriété' },
              { value: 'co_propriete',   label: 'Co-propriété' },
            ], true)}
          </div>
        </>
      ),
    },
    {
      title: 'Structure & Localisation',
      validate: () => {
        if (!form.nb_etages || form.nb_etages === '0') return 'Le nombre d\'étages est obligatoire.';
        return null;
      },
      content: (
        <>
          <div className="grid grid-cols-2 gap-4">
            {inp("Nombre d'étages", 'nb_etages', 'number', '5', true)}
            <div />
          </div>
          <div className="space-y-3">
            <Toggle label="Contient des blocs" value={form.a_blocs} onChange={(v) => set('a_blocs', v)} />
            {form.a_blocs && (
              <div className="ml-1">
                {inp('Nombre de blocs', 'nb_blocs', 'number', '3')}
              </div>
            )}
          </div>
          {inp('Adresse', 'adresse', 'text', '12, Rue Habib Bourguiba')}
          <div className="grid grid-cols-2 gap-4">
            {inp('Ville', 'ville', 'text', 'Tunis')}
            {inp('Pays', 'pays', 'text', 'Tunisie')}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lien Google Maps</label>
            <MapPreview value={form.maps_url} onChange={(v) => set('maps_url', v)} />
          </div>
        </>
      ),
    },
    {
      title: 'Équipements & Photos',
      content: (
        <>
          <div className="flex flex-wrap gap-3">
            <Toggle label="Sous-sol" value={form.sous_sol} onChange={(v) => set('sous_sol', v)} />
            <Toggle label="Caméras de surveillance" value={form.cameras_surveillance} onChange={(v) => set('cameras_surveillance', v)} />
          </div>
          {previews.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {previews.map((src, i) => (
                <div key={i} className="relative group aspect-square">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="w-full h-full object-cover rounded-lg" />
                  <button type="button" onClick={() => removePhoto(i)}
                    className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          <div onClick={() => photosRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded-lg px-4 py-5 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition">
            <p className="text-sm text-gray-400">Cliquer pour ajouter des photos (JPG, PNG — max 5 Mo/photo)</p>
          </div>
          <input ref={photosRef} type="file" multiple accept=".jpg,.jpeg,.png,.webp" className="hidden"
            onChange={(e) => handlePhotos(e.target.files)} />
          {globalError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{globalError}</div>
          )}
        </>
      ),
    },
  ];

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <Link href="/dashboard/immeubles" className="text-sm text-gray-400 hover:text-gray-600">← Retour</Link>
        <h1 className="text-2xl font-bold text-gray-800 mt-2">Nouvel immeuble</h1>
      </div>
      <StepForm
        steps={steps}
        onSubmit={handleSubmit}
        submitLabel="Créer l'immeuble"
        loading={loading}
        cancelHref="/dashboard/immeubles"
      />
    </div>
  );
}
