'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from '@/components/OrgLink';
import api from '@/lib/api';
import { orgPath } from '@/lib/org-path';
import { AxiosError } from 'axios';
import StepForm, { FormStep } from '@/components/StepForm';

interface LocationOption {
  id: number;
  locataire_nom: string;
  locataire_type: string;
  bien?: { id: number; designation: string; ville?: string | null } | null;
}

interface LocationSummary {
  id: number;
  locataire_nom: string;
  bien: { id: number; designation: string } | null;
}

interface InventaireItem {
  piece: string;
  categorie: 'meuble' | 'electromenager' | 'equipement' | 'textile';
  designation: string;
  description: string;
  date: string;
}

const categorieLabel: Record<string, string> = {
  meuble: 'Meuble', electromenager: 'Électroménager', equipement: 'Équipement', textile: 'Textile',
};

const emptyItem = (): InventaireItem => ({ piece: '', categorie: 'meuble', designation: '', description: '', date: '' });

function NouvelEtatLieuInner() {
  const router = useRouter();
  const searchParams     = useSearchParams();
  const locationIdParam  = searchParams.get('location_id');

  const [locations, setLocations]               = useState<LocationOption[]>([]);
  const [locationPreview, setLocationPreview]   = useState<LocationSummary | null>(null);
  const [errors, setErrors]                     = useState<Record<string, string[]>>({});
  const [globalError, setGlobalError]           = useState('');
  const [loading, setLoading]                   = useState(false);
  const [inventaire, setInventaire]             = useState<InventaireItem[]>([]);

  const [form, setForm] = useState({
    location_id: '', designation: '', type: 'entree',
    date: new Date().toISOString().split('T')[0],
    releve_eau: '', releve_electricite: '', releve_gaz: '',
    remise_cles: false, commentaire: '',
  });

  useEffect(() => {
    if (!locationIdParam) return;
    api.get(`/org/locations/${locationIdParam}`)
      .then(({ data }) => {
        const loc = data.data;
        setLocationPreview({ id: loc.id, locataire_nom: loc.locataire_nom, bien: loc.bien ?? null });
        setForm(p => ({ ...p, location_id: String(loc.id) }));
      }).catch(() => {});
  }, [locationIdParam]);

  useEffect(() => {
    api.get('/org/locations?per_page=200&statut=actif')
      .then(r => setLocations(r.data.data ?? [])).catch(() => {});
  }, []);

  const set = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm(p => ({ ...p, [field]: e.target.value }));

  const selectedLocation = locations.find(l => l.id === Number(form.location_id)) ?? null;

  const addItem    = () => setInventaire(p => [...p, emptyItem()]);
  const removeItem = (i: number) => setInventaire(p => p.filter((_, idx) => idx !== i));
  const setItem    = (i: number, field: keyof InventaireItem, value: string) =>
    setInventaire(p => p.map((item, idx) => idx === i ? { ...item, [field]: value } : item));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setGlobalError('');
    setLoading(true);
    try {
      await api.post('/org/etat-lieux', {
        location_id:        form.location_id ? Number(form.location_id) : undefined,
        designation:        form.designation || undefined,
        type:               form.type,
        date:               form.date,
        releve_eau:         form.releve_eau         ? Number(form.releve_eau)         : undefined,
        releve_electricite: form.releve_electricite ? Number(form.releve_electricite) : undefined,
        releve_gaz:         form.releve_gaz         ? Number(form.releve_gaz)         : undefined,
        remise_cles:        form.remise_cles,
        commentaire:        form.commentaire || undefined,
        inventaires:        inventaire.length ? inventaire.map(it => ({
          ...it, description: it.description || undefined, date: it.date || undefined,
        })) : undefined,
      });
      router.push(orgPath('/dashboard/etat-lieux'));
    } catch (err) {
      const ae = err as AxiosError<{ errors?: Record<string, string[]>; message?: string }>;
      if (ae.response?.data?.errors) setErrors(ae.response.data.errors);
      else setGlobalError(ae.response?.data?.message ?? 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  const errMsg = (f: string) => errors[f]
    ? <p className="text-red-500 text-xs mt-1">{errors[f][0]}</p> : null;

  const ic = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500';
  const lc = 'block text-xs font-medium text-gray-500 mb-1';

  const steps: FormStep[] = [
    {
      title: 'État des lieux',
      validate: () => {
        if (!form.location_id) return 'Veuillez sélectionner une location.';
        if (!form.date)        return 'La date est obligatoire.';
        return null;
      },
      content: (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lc}>Type *</label>
              <select value={form.type} onChange={set('type')} className={ic}>
                <option value="entree">État d'entrée</option>
                <option value="sortie">État de sortie</option>
              </select>
              {errMsg('type')}
            </div>
            <div>
              <label className={lc}>Date *</label>
              <input type="date" value={form.date} onChange={set('date')} className={ic} />
              {errMsg('date')}
            </div>
          </div>
          <div>
            <label className={lc}>Désignation</label>
            <input type="text" value={form.designation} onChange={set('designation')}
              placeholder="Ex : État d'entrée — Appt 3B — Mars 2026" className={ic} />
          </div>
          <div>
            <label className={lc}>Location *</label>
            {locationIdParam && locationPreview ? (
              <div className="bg-teal-50 rounded-lg p-3 text-sm space-y-1 text-gray-700">
                <p><span className="font-medium">Locataire :</span> {locationPreview.locataire_nom}</p>
                {locationPreview.bien && (
                  <p><span className="font-medium">Bien :</span> {locationPreview.bien.designation}</p>
                )}
              </div>
            ) : (
              <>
                <select value={form.location_id} onChange={set('location_id')} className={ic}>
                  <option value="">— Sélectionner une location —</option>
                  {locations.map(l => (
                    <option key={l.id} value={l.id}>
                      {l.locataire_nom}{l.bien ? ` — ${l.bien.designation}` : ''}
                    </option>
                  ))}
                </select>
                {errMsg('location_id')}
                {selectedLocation && (
                  <div className="bg-blue-50 rounded-lg p-3 text-xs space-y-1 text-gray-600 mt-2">
                    <p><span className="font-medium">Bien :</span> {selectedLocation.bien?.designation ?? '—'}{selectedLocation.bien?.ville ? ` · ${selectedLocation.bien.ville}` : ''}</p>
                    <p><span className="font-medium">Locataire :</span> {selectedLocation.locataire_nom}</p>
                    <p><span className="font-medium">Type :</span> <span className="capitalize">{selectedLocation.locataire_type}</span></p>
                  </div>
                )}
              </>
            )}
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={lc}>Eau (m³)</label>
              <input type="number" step="0.001" min="0" value={form.releve_eau} onChange={set('releve_eau')} placeholder="0.000" className={ic} />
            </div>
            <div>
              <label className={lc}>Électricité (kWh)</label>
              <input type="number" step="0.001" min="0" value={form.releve_electricite} onChange={set('releve_electricite')} placeholder="0.000" className={ic} />
            </div>
            <div>
              <label className={lc}>Gaz (m³)</label>
              <input type="number" step="0.001" min="0" value={form.releve_gaz} onChange={set('releve_gaz')} placeholder="0.000" className={ic} />
            </div>
          </div>
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <button type="button"
              onClick={() => setForm(p => ({ ...p, remise_cles: !p.remise_cles }))}
              className={`w-10 h-6 rounded-full transition-colors relative ${form.remise_cles ? 'bg-green-500' : 'bg-gray-300'}`}>
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.remise_cles ? 'left-5' : 'left-1'}`} />
            </button>
            <span className="text-sm text-gray-700">
              {form.remise_cles ? 'Clés remises au locataire' : 'Clés non remises'}
            </span>
          </label>
          <div>
            <label className={lc}>Commentaire</label>
            <textarea value={form.commentaire} onChange={set('commentaire')} rows={4}
              placeholder="Observations, état général du bien, réserves éventuelles…" className={ic} />
          </div>
          {globalError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{globalError}</div>
          )}
        </>
      ),
    },
    {
      title: `Inventaire${inventaire.length ? ` (${inventaire.length})` : ''}`,
      content: (
        <div className="space-y-4">
          {inventaire.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-400 text-sm mb-4">Aucun article ajouté pour l'instant.</p>
              <button type="button" onClick={addItem}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition">
                + Ajouter un article
              </button>
            </div>
          )}
          {inventaire.map((item, i) => (
            <div key={i} className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Article {i + 1}</span>
                <button type="button" onClick={() => removeItem(i)}
                  className="text-xs text-red-400 hover:text-red-600 hover:underline">Supprimer</button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lc}>Pièce *</label>
                  <input type="text" value={item.piece} onChange={e => setItem(i, 'piece', e.target.value)}
                    placeholder="Ex : Salon, Chambre 1…" className={ic} />
                  {errMsg(`inventaires.${i}.piece`)}
                </div>
                <div>
                  <label className={lc}>Catégorie *</label>
                  <select value={item.categorie} onChange={e => setItem(i, 'categorie', e.target.value as InventaireItem['categorie'])} className={ic}>
                    {Object.entries(categorieLabel).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className={lc}>Désignation *</label>
                <input type="text" value={item.designation} onChange={e => setItem(i, 'designation', e.target.value)}
                  placeholder="Ex : Canapé 3 places…" className={ic} />
                {errMsg(`inventaires.${i}.designation`)}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lc}>Description</label>
                  <textarea value={item.description} onChange={e => setItem(i, 'description', e.target.value)}
                    rows={2} placeholder="État, couleur, marque…" className={ic} />
                </div>
                <div>
                  <label className={lc}>Date</label>
                  <input type="date" value={item.date} onChange={e => setItem(i, 'date', e.target.value)} className={ic} />
                </div>
              </div>
            </div>
          ))}
          {inventaire.length > 0 && (
            <button type="button" onClick={addItem}
              className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:border-violet-400 hover:text-violet-600 transition">
              + Ajouter un article
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <Link href="/dashboard/etat-lieux" className="text-sm text-gray-400 hover:text-gray-600">← Retour</Link>
        <h1 className="text-2xl font-bold text-gray-800 mt-2">Nouvel état des lieux</h1>
      </div>
      <StepForm
        steps={steps}
        onSubmit={handleSubmit}
        submitLabel="Créer l'état des lieux"
        loading={loading}
        cancelHref="/dashboard/etat-lieux"
      />
    </div>
  );
}

export default function NouvelEtatLieuPage() {
  return (
    <Suspense fallback={<div className="p-8 text-gray-400 text-sm">Chargement…</div>}>
      <NouvelEtatLieuInner />
    </Suspense>
  );
}
