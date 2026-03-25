'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Immeuble, ImmeublePhoto } from '@/types';
import { AxiosError } from 'axios';

const Section = ({ title }: { title: string }) => (
  <div className="flex items-center gap-3 pt-2">
    <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide whitespace-nowrap">{title}</span>
    <div className="flex-1 h-px bg-gray-200" />
  </div>
);

const Toggle = ({
  label, value, onChange,
}: { label: string; value: boolean; onChange: (v: boolean) => void }) => (
  <button type="button" onClick={() => onChange(!value)}
    className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition ${
      value ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
    }`}>
    <span className={`w-4 h-4 rounded-full border-2 ${value ? 'border-white bg-white' : 'border-gray-400'}`} />
    {label}
  </button>
);

export default function ImmeubleDetailPage() {
  const { id }   = useParams<{ id: string }>();
  const router   = useRouter();
  const photosRef = useRef<HTMLInputElement>(null);

  const [immeuble, setImmeuble] = useState<Immeuble | null>(null);
  const [form, setForm] = useState({
    nom: '', type_usage: 'residentiel', type_propriete: 'auto_propriete',
    a_blocs: false, nb_blocs: '', nb_etages: '0',
    adresse: '', ville: '', pays: 'Tunisie',
    sous_sol: false, cameras_surveillance: false,
  });
  const [errors, setErrors]         = useState<Record<string, string[]>>({});
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [uploading, setUploading]   = useState(false);
  const [deletingPhotoId, setDeletingPhotoId] = useState<number | null>(null);

  const fetchImmeuble = () => {
    setLoading(true);
    api.get<{ data: Immeuble }>(`/org/immeubles/${id}`)
      .then(({ data: res }) => {
        const imm = res.data;
        setImmeuble(imm);
        setForm({
          nom:                  imm.nom,
          type_usage:           imm.type_usage,
          type_propriete:       imm.type_propriete,
          a_blocs:              imm.a_blocs,
          nb_blocs:             imm.nb_blocs?.toString() ?? '',
          nb_etages:            imm.nb_etages.toString(),
          adresse:              imm.adresse ?? '',
          ville:                imm.ville ?? '',
          pays:                 imm.pays ?? 'Tunisie',
          sous_sol:             imm.sous_sol,
          cameras_surveillance: imm.cameras_surveillance,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchImmeuble(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (field: string, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const inp = (
    label: string, key: string,
    type: React.HTMLInputTypeAttribute = 'text',
    placeholder = '', required = false
  ) => (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input type={type}
        value={(form as Record<string, string | boolean>)[key] as string}
        onChange={(e) => set(key, e.target.value)}
        placeholder={placeholder} required={required}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
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
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {errors[key] && <p className="text-red-500 text-xs mt-1">{errors[key][0]}</p>}
    </div>
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSaving(true);
    try {
      const payload = { ...form, nb_blocs: form.nb_blocs ? Number(form.nb_blocs) : null, nb_etages: Number(form.nb_etages) };
      await api.put(`/org/immeubles/${id}`, payload);
      router.push('/dashboard/immeubles');
    } catch (err) {
      const axiosError = err as AxiosError<{ errors?: Record<string, string[]> }>;
      setErrors(axiosError.response?.data?.errors ?? {});
    } finally {
      setSaving(false);
    }
  };

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

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <Link href="/dashboard/immeubles" className="text-sm text-gray-400 hover:text-gray-600">← Retour</Link>
        <h1 className="text-2xl font-bold text-gray-800 mt-2">{immeuble?.nom}</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <form onSubmit={handleSave} className="space-y-4">

          {/* ── 1. Identification ── */}
          <Section title="Identification" />
          {inp('Nom de l\'immeuble', 'nom', 'text', '', true)}
          <div className="grid grid-cols-2 gap-4">
            {sel('Type d\'usage', 'type_usage', [
              { value: 'residentiel',   label: 'Résidentiel' },
              { value: 'professionnel', label: 'Professionnel' },
              { value: 'mixte',         label: 'Mixte' },
            ], true)}
            {sel('Type de propriété', 'type_propriete', [
              { value: 'auto_propriete', label: 'Auto-propriété' },
              { value: 'co_propriete',   label: 'Co-propriété' },
            ], true)}
          </div>

          {/* ── 2. Structure ── */}
          <Section title="Structure" />
          {inp('Nombre d\'étages', 'nb_etages', 'number', '5', true)}
          <div className="space-y-3">
            <Toggle label="Contient des blocs" value={form.a_blocs} onChange={(v) => set('a_blocs', v)} />
            {form.a_blocs && <div className="ml-1">{inp('Nombre de blocs', 'nb_blocs', 'number')}</div>}
          </div>

          {/* ── 3. Localisation ── */}
          <Section title="Localisation" />
          {inp('Adresse', 'adresse')}
          <div className="grid grid-cols-2 gap-4">
            {inp('Ville', 'ville')}
            {inp('Pays', 'pays')}
          </div>

          {/* ── 4. Équipements ── */}
          <Section title="Équipements et caractéristiques" />
          <div className="flex flex-wrap gap-3">
            <Toggle label="Sous-sol" value={form.sous_sol} onChange={(v) => set('sous_sol', v)} />
            <Toggle label="Caméras de surveillance" value={form.cameras_surveillance} onChange={(v) => set('cameras_surveillance', v)} />
          </div>

          <button type="submit" disabled={saving}
            className="mt-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition">
            {saving ? 'Enregistrement…' : 'Enregistrer les modifications'}
          </button>
        </form>
      </div>

      {/* ── Photos ── */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-700">
            Photos ({immeuble?.photos?.length ?? 0})
          </h2>
          <button onClick={() => photosRef.current?.click()} disabled={uploading}
            className="text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg transition">
            {uploading ? 'Envoi…' : '+ Ajouter'}
          </button>
        </div>
        <input ref={photosRef} type="file" multiple accept=".jpg,.jpeg,.png,.webp" className="hidden"
          onChange={(e) => handleAddPhotos(e.target.files)} />

        {!immeuble?.photos?.length ? (
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
                <button type="button"
                  onClick={() => handleDeletePhoto(photo)}
                  disabled={deletingPhotoId === photo.id}
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
