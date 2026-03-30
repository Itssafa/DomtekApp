'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Bien, BienDocument, BienImage, Immeuble } from '@/types';
import { AxiosError } from 'axios';

const TYPES_BIEN = [
  { value: 'appartement',     label: 'Appartement' },
  { value: 'maison',          label: 'Maison' },
  { value: 'villa',           label: 'Villa' },
  { value: 'bureau',          label: 'Bureau' },
  { value: 'terrain',         label: 'Terrain' },
  { value: 'studio',          label: 'Studio' },
  { value: 'duplex',          label: 'Duplex' },
  { value: 'local_commercial',label: 'Local commercial' },
  { value: 'entrepot',        label: 'Entrepôt' },
  { value: 'ferme',           label: 'Ferme' },
  { value: 'autre',           label: 'Autre' },
];

const OPTIONS_BIEN = [
  { key: 'garage',           label: 'Garage' },
  { key: 'jardin',           label: 'Jardin' },
  { key: 'piscine',          label: 'Piscine' },
  { key: 'chauffage_central',label: 'Chauffage central' },
  { key: 'gaz_ville',        label: 'Gaz de ville' },
  { key: 'ascenseur',        label: 'Ascenseur' },
  { key: 'cave',             label: 'Cave' },
  { key: 'terrasse',         label: 'Terrasse' },
  { key: 'balcon',           label: 'Balcon' },
  { key: 'parking',          label: 'Parking' },
  { key: 'climatisation',    label: 'Climatisation' },
  { key: 'gardien',          label: 'Gardien' },
  { key: 'interphone',       label: 'Interphone' },
  { key: 'digicode',         label: 'Digicode' },
];

const Section = ({ title }: { title: string }) => (
  <div className="flex items-center gap-3 pt-1">
    <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide whitespace-nowrap">{title}</span>
    <div className="flex-1 h-px bg-gray-200" />
  </div>
);

const inputCls  = 'w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
const selectCls = 'w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

export default function EditBienPage() {
  const { id }  = useParams<{ id: string }>();
  const router  = useRouter();
  const fileImgRef = useRef<HTMLInputElement>(null);
  const fileDocRef = useRef<HTMLInputElement>(null);

  const [bien, setBien]           = useState<Bien | null>(null);
  const [immeubles, setImmeubles] = useState<Immeuble[]>([]);
  const [batiment, setBatiment]   = useState<'independant' | 'immeuble'>('independant');
  const [immeubleId, setImmeubleId] = useState('');
  const [options, setOptions]     = useState<string[]>([]);

  const [form, setForm] = useState({
    designation: '', description: '', notes: '',
    type_transaction: 'loyer', type_location: '', type_bien: 'appartement',
    prix: '', taxe_fonciere: '', regime_juridique: '',
    superficie: '', superficie_commune: '',
    adresse: '', ville: '', pays: '', code_postal: '',
    nb_pieces: '', nb_chambres: '', nb_salles_bain: '', nb_cuisine: '',
    etage: '', bloc: '', num: '',
    date_construction: '',
    accepte_animaux: false, accepte_fumeurs: false,
  });

  const [errors, setErrors]         = useState<Record<string, string[]>>({});
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [deletingImg, setDeletingImg]   = useState<number | null>(null);
  const [deletingDoc, setDeletingDoc]   = useState<number | null>(null);

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
      setOptions(b.options ?? []);
      setForm({
        designation:       b.designation,
        description:       b.description ?? '',
        notes:             b.notes ?? '',
        type_transaction:  b.type_transaction,
        type_location:     b.type_location ?? '',
        type_bien:         b.type_bien,
        prix:              String(b.prix),
        taxe_fonciere:     String(b.taxe_fonciere ?? ''),
        regime_juridique:  b.regime_juridique ?? '',
        superficie:        String(b.superficie ?? ''),
        superficie_commune: String(b.superficie_commune ?? ''),
        adresse:           b.adresse ?? '',
        ville:             b.ville ?? '',
        pays:              b.pays ?? '',
        code_postal:       b.code_postal ?? '',
        nb_pieces:         String(b.nb_pieces ?? ''),
        nb_chambres:       String(b.nb_chambres ?? ''),
        nb_salles_bain:    String(b.nb_salles_bain ?? ''),
        nb_cuisine:        String(b.nb_cuisine ?? ''),
        etage:             String(b.etage ?? ''),
        bloc:              String(b.bloc ?? ''),
        num:               b.num ?? '',
        date_construction: b.date_construction ?? '',
        accepte_animaux:   b.accepte_animaux,
        accepte_fumeurs:   b.accepte_fumeurs,
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

  const toggleOption = (key: string) =>
    setOptions((prev) => prev.includes(key) ? prev.filter((o) => o !== key) : [...prev, key]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        ...form,
        options,
        accepte_animaux: form.accepte_animaux,
        accepte_fumeurs: form.accepte_fumeurs,
      };

      if (batiment === 'immeuble' && immeubleId) {
        payload.immeuble_id = Number(immeubleId);
        payload.etage = form.etage ? Number(form.etage) : null;
        payload.bloc  = form.bloc  ? Number(form.bloc)  : null;
        payload.num   = form.num   || null;
      } else {
        payload.immeuble_id = null;
        payload.bloc        = null;
        payload.num         = null;
        payload.etage       = form.etage ? Number(form.etage) : null;
      }

      if (form.type_transaction === 'vente') payload.type_location = null;

      await api.put(`/org/biens/${id}`, payload);
      router.push('/dashboard/biens');
    } catch (err) {
      const axiosError = err as AxiosError<{ errors?: Record<string, string[]> }>;
      setErrors(axiosError.response?.data?.errors ?? {});
    } finally {
      setSaving(false);
    }
  };

  // ── Upload images ──────────────────────────────────────────────────────────

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploadingImg(true);
    const formData = new FormData();
    Array.from(files).forEach((f) => formData.append('images[]', f));
    try {
      await api.post(`/org/biens/${id}/images`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      fetchBien();
    } catch { /* noop */ }
    finally { setUploadingImg(false); if (fileImgRef.current) fileImgRef.current.value = ''; }
  };

  const handleDeleteImage = async (imgId: number) => {
    setDeletingImg(imgId);
    try { await api.delete(`/org/biens/${id}/images/${imgId}`); fetchBien(); }
    catch { /* noop */ }
    finally { setDeletingImg(null); }
  };

  // ── Upload documents ───────────────────────────────────────────────────────

  const handleUploadDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingDoc(true);
    const formData = new FormData();
    formData.append('document', file);
    formData.append('nom', file.name);
    try {
      await api.post(`/org/biens/${id}/documents`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      fetchBien();
    } catch { /* noop */ }
    finally { setUploadingDoc(false); if (fileDocRef.current) fileDocRef.current.value = ''; }
  };

  const handleDeleteDocument = async (docId: number) => {
    setDeletingDoc(docId);
    try { await api.delete(`/org/biens/${id}/documents/${docId}`); fetchBien(); }
    catch { /* noop */ }
    finally { setDeletingDoc(null); }
  };

  if (loading) return (
    <div className="p-8">
      <div className="animate-pulse space-y-4">{[...Array(6)].map((_, i) => <div key={i} className="h-10 bg-gray-100 rounded-lg" />)}</div>
    </div>
  );
  if (!bien) return <div className="p-8 text-gray-500 text-sm">Bien introuvable.</div>;

  const inp = (label: string, name: string, type = 'text', placeholder = '') => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input type={type} value={(form as Record<string, unknown>)[name] as string}
        onChange={set(name)} placeholder={placeholder} className={inputCls} />
      {errors[name] && <p className="text-red-500 text-xs mt-1">{errors[name][0]}</p>}
    </div>
  );

  const toggle = (label: string, key: 'accepte_animaux' | 'accepte_fumeurs') => (
    <button type="button" onClick={() => setForm((p) => ({ ...p, [key]: !p[key] }))}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition ${
        form[key] ? 'bg-green-50 border-green-400 text-green-700' : 'bg-white border-gray-300 text-gray-500'
      }`}>
      <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${form[key] ? 'border-green-500 bg-green-500' : 'border-gray-400'}`}>
        {form[key] && <span className="text-white text-xs leading-none">✓</span>}
      </span>
      {label}
    </button>
  );

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-6">
        <Link href="/dashboard/biens" className="text-sm text-gray-400 hover:text-gray-600">← Retour aux biens</Link>
        <h1 className="text-2xl font-bold text-gray-800 mt-2">Modifier le bien</h1>
      </div>

      {/* ── Formulaire principal ── */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <form onSubmit={handleSave} className="space-y-5">

          {/* Identification */}
          <Section title="Identification" />
          {inp('Désignation *', 'designation')}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Transaction *</label>
              <select value={form.type_transaction} onChange={set('type_transaction')} className={selectCls}>
                <option value="loyer">Location</option>
                <option value="vente">Vente</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type de bien *</label>
              <select value={form.type_bien} onChange={set('type_bien')} className={selectCls}>
                {TYPES_BIEN.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>
          {form.type_transaction === 'loyer' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type de location</label>
              <select value={form.type_location} onChange={set('type_location')} className={selectCls}>
                <option value="">— Non précisé —</option>
                <option value="meuble">Meublé</option>
                <option value="non_meuble">Non meublé</option>
              </select>
            </div>
          )}

          {/* Bâtiment */}
          <Section title="Bâtiment" />
          <div className="flex gap-3">
            {(['independant', 'immeuble'] as const).map((v) => (
              <button key={v} type="button"
                onClick={() => { setBatiment(v); setImmeubleId(''); setForm((p) => ({ ...p, bloc: '', etage: '', num: '' })); }}
                className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition ${
                  batiment === v ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
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
                  onChange={(e) => { setImmeubleId(e.target.value); setForm((p) => ({ ...p, bloc: '', etage: '', num: '' })); }}
                  className={selectCls}>
                  <option value="">— Sélectionner un immeuble —</option>
                  {immeubles.map((imm) => (
                    <option key={imm.id} value={imm.id}>{imm.nom}{imm.ville ? ` — ${imm.ville}` : ''}</option>
                  ))}
                </select>
              </div>
              {selectedImmeuble && (
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Étage</label>
                    <select value={form.etage} onChange={set('etage')} className={selectCls}>
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
                      <select value={form.bloc} onChange={set('bloc')} className={selectCls}>
                        <option value="">— Sélectionner —</option>
                        {Array.from({ length: selectedImmeuble.nb_blocs }, (_, i) => i + 1).map((n) => (
                          <option key={n} value={n}>Bloc {n}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  {inp('N° appartement', 'num', 'text', 'Ex : 12A')}
                </div>
              )}
            </div>
          )}

          {/* Localisation */}
          <Section title="Localisation" />
          <div className="grid grid-cols-2 gap-4">
            {inp('Adresse', 'adresse')}
            {inp('Ville', 'ville')}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {inp('Pays', 'pays')}
            {inp('Code postal', 'code_postal')}
          </div>

          {/* Caractéristiques */}
          <Section title="Caractéristiques" />
          <div className="grid grid-cols-2 gap-4">
            {inp('Superficie (m²)', 'superficie', 'number')}
            {inp('Superficie commune (m²)', 'superficie_commune', 'number')}
          </div>
          <div className="grid grid-cols-4 gap-4">
            {inp('Pièces', 'nb_pieces', 'number')}
            {inp('Chambres', 'nb_chambres', 'number')}
            {inp('Salle de bain', 'nb_salles_bain', 'number')}
            {inp('Cuisine(s)', 'nb_cuisine', 'number')}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {batiment === 'independant' && inp('Étage', 'etage', 'number')}
            {inp('Date de construction', 'date_construction', 'date')}
          </div>

          {/* Finance & Juridique */}
          <Section title="Finance & Juridique" />
          <div className="grid grid-cols-2 gap-4">
            {inp('Prix (TND) *', 'prix', 'number')}
            {inp('Taxe foncière (TND/an)', 'taxe_fonciere', 'number')}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Régime juridique</label>
            <select value={form.regime_juridique} onChange={set('regime_juridique')} className={selectCls}>
              <option value="">— Non précisé —</option>
              <option value="mono_propriete">Mono-propriété</option>
              <option value="co_propriete">Co-propriété</option>
            </select>
          </div>

          {/* Conditions */}
          <Section title="Conditions d'occupation" />
          <div className="flex gap-3">
            {toggle('Animaux acceptés', 'accepte_animaux')}
            {toggle('Fumeurs acceptés', 'accepte_fumeurs')}
          </div>

          {/* Équipements */}
          <Section title="Équipements & Options" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {OPTIONS_BIEN.map((opt) => (
              <label key={opt.key} className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-sm transition ${
                options.includes(opt.key) ? 'bg-blue-50 border-blue-400 text-blue-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}>
                <input type="checkbox" checked={options.includes(opt.key)} onChange={() => toggleOption(opt.key)} className="rounded" />
                {opt.label}
              </label>
            ))}
          </div>

          {/* Description & Notes */}
          <Section title="Description & Notes" />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={form.description} onChange={set('description')} rows={4} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes internes</label>
            <textarea value={form.notes} onChange={set('notes')} rows={2} className={inputCls} />
          </div>

          <button type="submit" disabled={saving}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition">
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </form>
      </div>

      {/* ── Photos ── */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-700">Photos du bien</h2>
          <label className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg cursor-pointer transition">
            {uploadingImg ? 'Upload…' : '+ Ajouter des photos'}
            <input ref={fileImgRef} type="file" accept="image/*" multiple className="hidden" onChange={handleUploadImage} />
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

      {/* ── Documents ── */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-700">Documents relatifs</h2>
          <label className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg cursor-pointer transition">
            {uploadingDoc ? 'Upload…' : '+ Ajouter un document'}
            <input ref={fileDocRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png" className="hidden" onChange={handleUploadDocument} />
          </label>
        </div>
        {!bien.documents?.length ? (
          <p className="text-sm text-gray-400 text-center py-4">Aucun document ajouté.</p>
        ) : (
          <div className="space-y-2">
            {bien.documents.map((doc: BienDocument) => (
              <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-lg">📄</span>
                  <div className="min-w-0">
                    <a href={doc.url} target="_blank" rel="noreferrer"
                      className="text-sm font-medium text-blue-600 hover:underline truncate block">{doc.nom}</a>
                    {doc.type_document && <span className="text-xs text-gray-400">{doc.type_document}</span>}
                  </div>
                </div>
                <button onClick={() => handleDeleteDocument(doc.id)} disabled={deletingDoc === doc.id}
                  className="ml-3 text-xs text-red-500 hover:text-red-700 disabled:opacity-40 shrink-0">
                  Supprimer
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
