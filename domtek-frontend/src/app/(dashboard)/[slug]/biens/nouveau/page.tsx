'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from '@/components/OrgLink';
import api from '@/lib/api'
import { orgPath } from '@/lib/org-path';
import { Immeuble } from '@/types';
import { AxiosError } from 'axios';
import { MapPreview } from '@/components/MapPreview';

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

const inputCls = 'w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
const selectCls = 'w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

export default function NouveauBienPage() {
  const router = useRouter();

  const [immeubles, setImmeubles] = useState<Immeuble[]>([]);
  const [batiment, setBatiment]   = useState<'independant' | 'immeuble'>('independant');
  const [immeubleId, setImmeubleId] = useState('');
  const [options, setOptions]     = useState<string[]>([]);

  const [form, setForm] = useState({
    designation: '', description: '', notes: '',
    type_transaction: 'loyer', type_location: '', type_bien: 'appartement',
    prix: '', taxe_fonciere: '', regime_juridique: '',
    superficie: '', superficie_commune: '',
    adresse: '', ville: '', pays: 'Tunisie', code_postal: '', maps_url: '',
    nb_pieces: '', nb_chambres: '', nb_salles_bain: '', nb_cuisine: '',
    etage: '', bloc: '', num: '',
    date_construction: '',
    accepte_animaux: false, accepte_fumeurs: false,
  });
  const [errors, setErrors]   = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/org/immeubles?per_page=200')
      .then((res) => setImmeubles(res.data.data ?? []))
      .catch(() => {});
  }, []);

  const selectedImmeuble = useMemo(
    () => immeubles.find((i) => i.id === Number(immeubleId)) ?? null,
    [immeubleId, immeubles]
  );

  const set = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const toggleOption = (key: string) =>
    setOptions((prev) => prev.includes(key) ? prev.filter((o) => o !== key) : [...prev, key]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        ...form,
        options,
        accepte_animaux: form.accepte_animaux,
        accepte_fumeurs: form.accepte_fumeurs,
      };

      // Champs immeuble
      if (batiment === 'immeuble' && immeubleId) {
        payload.immeuble_id = Number(immeubleId);
        payload.etage = form.etage ? Number(form.etage) : undefined;
        payload.bloc  = form.bloc  ? Number(form.bloc)  : undefined;
        payload.num   = form.num   || undefined;
      } else {
        payload.immeuble_id = null;
        payload.bloc        = null;
        payload.num         = null;
        payload.etage       = form.etage ? Number(form.etage) : undefined;
      }

      // Vider type_location si vente
      if (form.type_transaction === 'vente') payload.type_location = null;

      const { data } = await api.post('/org/biens', payload);
      router.push(orgPath(`/dashboard/biens/${data.data.id}`));
    } catch (err) {
      const axiosError = err as AxiosError<{ errors?: Record<string, string[]> }>;
      setErrors(axiosError.response?.data?.errors ?? {});
    } finally {
      setLoading(false);
    }
  };

  const inp = (label: string, key: string, type = 'text', placeholder = '') => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input type={type} value={(form as Record<string, unknown>)[key] as string}
        onChange={set(key)} placeholder={placeholder} className={inputCls} />
      {errors[key] && <p className="text-red-500 text-xs mt-1">{errors[key][0]}</p>}
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
        <h1 className="text-2xl font-bold text-gray-800 mt-2">Nouveau bien</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* ── Identification ── */}
          <Section title="Identification" />
          {inp('Désignation *', 'designation', 'text', 'Ex : Appartement F3 vue mer')}
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

          {/* ── Bâtiment ── */}
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
                {immeubles.length === 0 && (
                  <p className="text-amber-600 text-xs mt-1">Aucun immeuble créé. <Link href="/dashboard/immeubles/nouveau" className="underline">Créer un immeuble</Link></p>
                )}
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

          {/* ── Localisation ── */}
          <Section title="Localisation" />
          <div className="grid grid-cols-2 gap-4">
            {inp('Adresse', 'adresse', 'text', '12 Rue de la République')}
            {inp('Ville', 'ville', 'text', 'Tunis')}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {inp('Pays', 'pays', 'text', 'Tunisie')}
            {inp('Code postal', 'code_postal', 'text', '1001')}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lien Google Maps</label>
            <MapPreview
              value={form.maps_url}
              onChange={v => setForm(p => ({ ...p, maps_url: v }))}
            />
          </div>

          {/* ── Caractéristiques ── */}
          <Section title="Caractéristiques" />
          <div className="grid grid-cols-2 gap-4">
            {inp('Superficie (m²)', 'superficie', 'number', '85')}
            {inp('Superficie commune (m²)', 'superficie_commune', 'number', '15')}
          </div>
          <div className="grid grid-cols-4 gap-4">
            {inp('Pièces', 'nb_pieces', 'number', '4')}
            {inp('Chambres', 'nb_chambres', 'number', '2')}
            {inp('Salle de bain', 'nb_salles_bain', 'number', '1')}
            {inp('Cuisine(s)', 'nb_cuisine', 'number', '1')}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {batiment === 'independant' && inp('Étage', 'etage', 'number', '2')}
            {inp('Date de construction', 'date_construction', 'date')}
          </div>

          {/* ── Finance & Juridique ── */}
          <Section title="Finance & Juridique" />
          <div className="grid grid-cols-2 gap-4">
            {inp('Prix (TND) *', 'prix', 'number', '250000')}
            {inp('Taxe foncière (TND/an)', 'taxe_fonciere', 'number', '500')}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Régime juridique</label>
            <select value={form.regime_juridique} onChange={set('regime_juridique')} className={selectCls}>
              <option value="">— Non précisé —</option>
              <option value="mono_propriete">Mono-propriété</option>
              <option value="co_propriete">Co-propriété</option>
            </select>
          </div>

          {/* ── Conditions ── */}
          <Section title="Conditions d'occupation" />
          <div className="flex gap-3">
            {toggle('Animaux acceptés', 'accepte_animaux')}
            {toggle('Fumeurs acceptés', 'accepte_fumeurs')}
          </div>

          {/* ── Équipements ── */}
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

          {/* ── Description & Notes ── */}
          <Section title="Description & Notes" />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={form.description} onChange={set('description')} rows={4}
              placeholder="Décrivez le bien, ses atouts…" className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes internes</label>
            <textarea value={form.notes} onChange={set('notes')} rows={2}
              placeholder="Notes visibles uniquement par votre équipe…" className={inputCls} />
          </div>

          {/* ── Actions ── */}
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition">
              {loading ? 'Enregistrement…' : 'Créer le bien'}
            </button>
            <Link href="/dashboard/biens"
              className="px-6 py-2.5 border border-gray-300 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition">
              Annuler
            </Link>
          </div>

        </form>
      </div>
    </div>
  );
}
