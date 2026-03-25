'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Bien, BienImage, Immeuble } from '@/types';
import { AxiosError } from 'axios';

const TYPES_BIEN = ['appartement', 'maison', 'villa', 'bureau', 'terrain', 'autre'];

const Section = ({ title }: { title: string }) => (
  <div className="flex items-center gap-3 pt-1">
    <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide whitespace-nowrap">{title}</span>
    <div className="flex-1 h-px bg-gray-200" />
  </div>
);

export default function EditBienPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [bien, setBien]             = useState<Bien | null>(null);
  const [immeubles, setImmeubles]   = useState<Immeuble[]>([]);
  const [batiment, setBatiment]     = useState<'independant' | 'immeuble'>('independant');
  const [immeubleId, setImmeubleId] = useState('');

  const [form, setForm] = useState({
    titre: '', description: '', type_transaction: 'vente', type_bien: 'appartement',
    prix: '', superficie: '', adresse: '', ville: '',
    nb_pieces: '', nb_chambres: '', nb_salles_bain: '',
    etage: '', bloc: '',
  });
  const [errors, setErrors]       = useState<Record<string, string[]>>({});
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingImg, setDeletingImg] = useState<number | null>(null);

  const fetchBien = () => {
    setLoading(true);
    Promise.all([
      api.get<{ data: Bien }>(`/org/biens/${id}`),
      api.get('/org/immeubles?per_page=200'),
    ]).then(([bienRes, immRes]) => {
      const b   = bienRes.data.data;
      const imm = immRes.data.data ?? [];
      setBien(b);
      setImmeubles(imm);
      setForm({
        titre:           b.titre,
        description:     b.description ?? '',
        type_transaction: b.type_transaction,
        type_bien:       b.type_bien,
        prix:            String(b.prix),
        superficie:      String(b.superficie ?? ''),
        adresse:         b.adresse ?? '',
        ville:           b.ville ?? '',
        nb_pieces:       String(b.nb_pieces ?? ''),
        nb_chambres:     String(b.nb_chambres ?? ''),
        nb_salles_bain:  String(b.nb_salles_bain ?? ''),
        etage:           String(b.etage ?? ''),
        bloc:            String(b.bloc ?? ''),
      });
      if (b.immeuble_id) {
        setBatiment('immeuble');
        setImmeubleId(String(b.immeuble_id));
      } else {
        setBatiment('independant');
        setImmeubleId('');
      }
    })
    .catch(() => {})
    .finally(() => setLoading(false));
  };

  useEffect(() => { fetchBien(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedImmeuble = useMemo(
    () => immeubles.find((i) => i.id === Number(immeubleId)) ?? null,
    [immeubleId, immeubles]
  );

  const set = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSaving(true);
    try {
      const payload: Record<string, unknown> = { ...form };
      if (batiment === 'immeuble' && immeubleId) {
        payload.immeuble_id = Number(immeubleId);
        payload.etage       = form.etage ? Number(form.etage) : null;
        payload.bloc        = form.bloc  ? Number(form.bloc)  : null;
      } else {
        payload.immeuble_id = null;
        payload.bloc        = null;
        payload.etage       = form.etage ? Number(form.etage) : null;
      }
      await api.put(`/org/biens/${id}`, payload);
      router.push('/dashboard/biens');
    } catch (err) {
      const axiosError = err as AxiosError<{ errors?: Record<string, string[]> }>;
      setErrors(axiosError.response?.data?.errors ?? {});
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    const formData = new FormData();
    Array.from(files).forEach((f) => formData.append('images[]', f));
    try {
      await api.post(`/org/biens/${id}/images`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      fetchBien();
    } catch { /* noop */ }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ''; }
  };

  const handleDeleteImage = async (imgId: number) => {
    setDeletingImg(imgId);
    try {
      await api.delete(`/org/biens/${id}/images/${imgId}`);
      fetchBien();
    } catch { /* noop */ }
    finally { setDeletingImg(null); }
  };

  if (loading) return <div className="p-8"><div className="animate-pulse space-y-4">{[...Array(5)].map((_, i) => <div key={i} className="h-10 bg-gray-100 rounded-lg" />)}</div></div>;
  if (!bien)   return <div className="p-8 text-gray-500 text-sm">Bien introuvable.</div>;

  const inp = (label: string, name: string, type = 'text', placeholder = '') => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input type={type} value={(form as Record<string, string>)[name]} onChange={set(name)} placeholder={placeholder}
        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      {errors[name] && <p className="text-red-500 text-xs mt-1">{errors[name][0]}</p>}
    </div>
  );

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <Link href="/dashboard/biens" className="text-sm text-gray-400 hover:text-gray-600">← Retour aux biens</Link>
        <h1 className="text-2xl font-bold text-gray-800 mt-2">Modifier le bien</h1>
      </div>

      {/* Formulaire */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <form onSubmit={handleSave} className="space-y-5">

          {/* ── Informations générales ── */}
          <Section title="Informations générales" />
          {inp('Titre', 'titre')}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={form.description} onChange={set('description')} rows={3}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Transaction</label>
              <select value={form.type_transaction} onChange={set('type_transaction')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="vente">Vente</option>
                <option value="loyer">Location</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type de bien</label>
              <select value={form.type_bien} onChange={set('type_bien')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {TYPES_BIEN.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {inp('Prix (TND)', 'prix', 'number')}
            {inp('Superficie (m²)', 'superficie', 'number')}
          </div>

          {/* ── Bâtiment ── */}
          <Section title="Bâtiment" />
          <div className="flex gap-3">
            {(['independant', 'immeuble'] as const).map((v) => (
              <button key={v} type="button"
                onClick={() => { setBatiment(v); setImmeubleId(''); setForm((p) => ({ ...p, bloc: '', etage: '' })); }}
                className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition ${
                  batiment === v
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}>
                {v === 'independant' ? 'Indépendant' : 'Appartient à un immeuble'}
              </button>
            ))}
          </div>

          {batiment === 'immeuble' && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Immeuble</label>
                <select value={immeubleId}
                  onChange={(e) => { setImmeubleId(e.target.value); setForm((p) => ({ ...p, bloc: '', etage: '' })); }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">— Sélectionner un immeuble —</option>
                  {immeubles.map((imm) => (
                    <option key={imm.id} value={imm.id}>{imm.nom} {imm.ville ? `— ${imm.ville}` : ''}</option>
                  ))}
                </select>
              </div>

              {selectedImmeuble && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Étage</label>
                    <select value={form.etage} onChange={set('etage')}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">— Sélectionner —</option>
                      <option value="0">RDC (0)</option>
                      {Array.from({ length: selectedImmeuble.nb_etages }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>Étage {n}</option>
                      ))}
                    </select>
                  </div>
                  {selectedImmeuble.a_blocs && selectedImmeuble.nb_blocs && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bloc</label>
                      <select value={form.bloc} onChange={set('bloc')}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">— Sélectionner —</option>
                        {Array.from({ length: selectedImmeuble.nb_blocs }, (_, i) => i + 1).map((n) => (
                          <option key={n} value={n}>Bloc {n}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Localisation ── */}
          <Section title="Localisation" />
          <div className="grid grid-cols-2 gap-4">
            {inp('Adresse', 'adresse')}
            {inp('Ville', 'ville')}
          </div>

          {/* ── Détails ── */}
          <Section title="Détails" />
          {batiment === 'independant' ? (
            <div className="grid grid-cols-4 gap-4">
              {inp('Pièces', 'nb_pieces', 'number')}
              {inp('Chambres', 'nb_chambres', 'number')}
              {inp('SDB', 'nb_salles_bain', 'number')}
              {inp('Étage', 'etage', 'number')}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {inp('Pièces', 'nb_pieces', 'number')}
              {inp('Chambres', 'nb_chambres', 'number')}
              {inp('SDB', 'nb_salles_bain', 'number')}
            </div>
          )}

          <button type="submit" disabled={saving}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition">
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </form>
      </div>

      {/* Images */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-700">Photos du bien</h2>
          <label className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg cursor-pointer transition">
            {uploading ? 'Upload…' : '+ Ajouter des photos'}
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} />
          </label>
        </div>
        {!bien.images?.length ? (
          <p className="text-sm text-gray-400 text-center py-4">Aucune photo ajoutée.</p>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {bien.images.map((img: BienImage) => (
              <div key={img.id} className="relative group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt="" className="w-full h-32 object-cover rounded-lg" />
                {img.is_principale && (
                  <span className="absolute top-1 left-1 text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded">Principale</span>
                )}
                <button onClick={() => handleDeleteImage(img.id)} disabled={deletingImg === img.id}
                  className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded p-1 opacity-0 group-hover:opacity-100 transition disabled:opacity-40">
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
