'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from '@/components/OrgLink';
import api from '@/lib/api';
import { orgPath } from '@/lib/org-path';
import { Contrat } from '@/types';
import { AxiosError } from 'axios';

/* ── Types ── */

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
  meuble:        'Meuble',
  electromenager:'Électroménager',
  equipement:    'Équipement',
  textile:       'Textile',
};

const emptyItem = (): InventaireItem => ({
  piece: '', categorie: 'meuble', designation: '', description: '', date: '',
});

/* ── Inner page (needs searchParams) ── */

function NouvelEtatLieuInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locationIdParam = searchParams.get('location_id');

  const [tab, setTab]             = useState<'etat' | 'inventaire'>('etat');
  const [contrats, setContrats]   = useState<Contrat[]>([]);
  const [location, setLocation]   = useState<LocationSummary | null>(null);
  const [errors, setErrors]       = useState<Record<string, string[]>>({});
  const [globalError, setGlobalError] = useState('');
  const [loading, setLoading]     = useState(false);

  const [form, setForm] = useState({
    contrat_id:         '',
    designation:        '',
    type:               'entree',
    date:               new Date().toISOString().split('T')[0],
    releve_eau:         '',
    releve_electricite: '',
    releve_gaz:         '',
    remise_cles:        false,
    commentaire:        '',
  });

  const [inventaire, setInventaire] = useState<InventaireItem[]>([]);

  /* Load location summary if location_id param present */
  useEffect(() => {
    if (!locationIdParam) return;
    api.get(`/org/locations/${locationIdParam}`)
      .then(({ data }) => {
        const loc = data.data;
        setLocation({
          id:            loc.id,
          locataire_nom: loc.locataire_nom,
          bien:          loc.bien ?? null,
        });
      })
      .catch(() => {});
  }, [locationIdParam]);

  /* Load contrats de location (only when no location param) */
  useEffect(() => {
    if (locationIdParam) return;
    api.get('/org/contrats?per_page=200&statut=actif')
      .then(r => setContrats((r.data.data ?? []).filter((c: Contrat) => c.type !== 'vente')))
      .catch(() => {});
  }, [locationIdParam]);

  const set = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm(p => ({ ...p, [field]: e.target.value }));

  const selectedContrat = contrats.find(c => c.id === Number(form.contrat_id)) ?? null;

  /* ── Inventaire helpers ── */

  const addItem = () => setInventaire(p => [...p, emptyItem()]);

  const removeItem = (i: number) =>
    setInventaire(p => p.filter((_, idx) => idx !== i));

  const setItem = (i: number, field: keyof InventaireItem, value: string) =>
    setInventaire(p => p.map((item, idx) =>
      idx === i ? { ...item, [field]: value } : item
    ));

  /* ── Submit ── */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setGlobalError('');
    setLoading(true);

    const payload: Record<string, unknown> = {
      designation:        form.designation || undefined,
      type:               form.type,
      date:               form.date,
      releve_eau:         form.releve_eau ? Number(form.releve_eau) : undefined,
      releve_electricite: form.releve_electricite ? Number(form.releve_electricite) : undefined,
      releve_gaz:         form.releve_gaz ? Number(form.releve_gaz) : undefined,
      remise_cles:        form.remise_cles,
      commentaire:        form.commentaire || undefined,
      inventaires:        inventaire.length ? inventaire.map(it => ({
        ...it,
        description: it.description || undefined,
        date:        it.date || undefined,
      })) : undefined,
    };

    if (locationIdParam) {
      payload.location_id = Number(locationIdParam);
    } else if (form.contrat_id) {
      payload.contrat_id = Number(form.contrat_id);
    }

    try {
      await api.post('/org/etat-lieux', payload);
      router.push(orgPath('/dashboard/etat-lieux'));
    } catch (err) {
      const ae = err as AxiosError<{ errors?: Record<string, string[]>; message?: string }>;
      if (ae.response?.data?.errors) {
        setErrors(ae.response.data.errors);
        /* If inventaire errors, switch to inventaire tab */
        const keys = Object.keys(ae.response.data.errors);
        if (keys.some(k => k.startsWith('inventaires'))) setTab('inventaire');
      } else {
        setGlobalError(ae.response?.data?.message ?? 'Une erreur est survenue.');
      }
    } finally {
      setLoading(false);
    }
  };

  const errMsg = (f: string) => errors[f]
    ? <p className="text-red-500 text-xs mt-1">{errors[f][0]}</p>
    : null;

  const ic = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500';
  const lc = 'block text-xs font-medium text-gray-500 mb-1';

  const canSubmit = !loading && form.date && (locationIdParam || form.contrat_id);

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <Link href="/dashboard/etat-lieux" className="text-sm text-gray-400 hover:text-gray-600">← Retour</Link>
        <h1 className="text-2xl font-bold text-gray-800 mt-2">Nouvel état des lieux</h1>
      </div>

      {globalError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{globalError}</div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {(['etat', 'inventaire'] as const).map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition -mb-px ${
              tab === t
                ? 'border-violet-600 text-violet-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            {t === 'etat' ? 'État des lieux' : `Inventaire${inventaire.length ? ` (${inventaire.length})` : ''}`}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* ══════════════════ Tab 1 : État des lieux ══════════════════ */}
        {tab === 'etat' && (
          <>
            {/* Identification */}
            <div className="bg-white rounded-xl shadow-sm p-5 space-y-3">
              <h2 className="text-sm font-semibold text-gray-700">Identification</h2>
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
            </div>

            {/* Référence : location (from URL param) ou contrat */}
            <div className="bg-white rounded-xl shadow-sm p-5 space-y-3">
              <h2 className="text-sm font-semibold text-gray-700">
                {locationIdParam ? 'Location associée' : 'Contrat de location *'}
              </h2>

              {locationIdParam ? (
                location ? (
                  <div className="bg-teal-50 rounded-lg p-3 text-sm space-y-1 text-gray-700">
                    <p><span className="font-medium">Locataire :</span> {location.locataire_nom}</p>
                    {location.bien && (
                      <p><span className="font-medium">Bien :</span> {location.bien.designation}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">Chargement…</p>
                )
              ) : (
                <>
                  <select value={form.contrat_id} onChange={set('contrat_id')} className={ic}>
                    <option value="">— Sélectionner un contrat de location —</option>
                    {contrats.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.designation ?? `Contrat #${c.id}`}
                        {c.bien ? ` — ${c.bien.designation}` : ''}
                      </option>
                    ))}
                  </select>
                  {errMsg('contrat_id')}
                  {selectedContrat && (
                    <div className="bg-blue-50 rounded-lg p-3 text-xs space-y-1 text-gray-600">
                      <p><span className="font-medium">Bien :</span> {selectedContrat.bien?.designation ?? '—'}</p>
                      <p><span className="font-medium">Client(s) :</span> {selectedContrat.clients?.map(c => c.nom_complet).join(', ') ?? '—'}</p>
                      <p><span className="font-medium">Début :</span> {new Date(selectedContrat.date_debut).toLocaleDateString('fr-FR')}</p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Relevés de compteurs */}
            <div className="bg-white rounded-xl shadow-sm p-5 space-y-3">
              <h2 className="text-sm font-semibold text-gray-700">Relevés de compteurs</h2>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={lc}>Eau (m³)</label>
                  <input type="number" step="0.001" min="0" value={form.releve_eau} onChange={set('releve_eau')}
                    placeholder="0.000" className={ic} />
                  {errMsg('releve_eau')}
                </div>
                <div>
                  <label className={lc}>Électricité (kWh)</label>
                  <input type="number" step="0.001" min="0" value={form.releve_electricite} onChange={set('releve_electricite')}
                    placeholder="0.000" className={ic} />
                  {errMsg('releve_electricite')}
                </div>
                <div>
                  <label className={lc}>Gaz (m³)</label>
                  <input type="number" step="0.001" min="0" value={form.releve_gaz} onChange={set('releve_gaz')}
                    placeholder="0.000" className={ic} />
                  {errMsg('releve_gaz')}
                </div>
              </div>
            </div>

            {/* Remise des clés & Commentaire */}
            <div className="bg-white rounded-xl shadow-sm p-5 space-y-3">
              <h2 className="text-sm font-semibold text-gray-700">Remise des clés & Commentaire</h2>
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
                  placeholder="Observations, état général du bien, réserves éventuelles…"
                  className={ic} />
              </div>
            </div>
          </>
        )}

        {/* ══════════════════ Tab 2 : Inventaire ══════════════════ */}
        {tab === 'inventaire' && (
          <div className="space-y-4">
            {inventaire.length === 0 && (
              <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <p className="text-gray-400 text-sm mb-4">Aucun article ajouté pour l'instant.</p>
                <button type="button" onClick={addItem}
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition">
                  + Ajouter un article
                </button>
              </div>
            )}

            {inventaire.map((item, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm p-5 space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Article {i + 1}</span>
                  <button type="button" onClick={() => removeItem(i)}
                    className="text-xs text-red-400 hover:text-red-600 hover:underline">
                    Supprimer
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={lc}>Pièce *</label>
                    <input type="text" value={item.piece}
                      onChange={e => setItem(i, 'piece', e.target.value)}
                      placeholder="Ex : Salon, Chambre 1, Cuisine…" className={ic} />
                    {errMsg(`inventaires.${i}.piece`)}
                  </div>
                  <div>
                    <label className={lc}>Catégorie *</label>
                    <select value={item.categorie}
                      onChange={e => setItem(i, 'categorie', e.target.value as InventaireItem['categorie'])}
                      className={ic}>
                      {Object.entries(categorieLabel).map(([v, l]) => (
                        <option key={v} value={v}>{l}</option>
                      ))}
                    </select>
                    {errMsg(`inventaires.${i}.categorie`)}
                  </div>
                </div>

                <div>
                  <label className={lc}>Désignation *</label>
                  <input type="text" value={item.designation}
                    onChange={e => setItem(i, 'designation', e.target.value)}
                    placeholder="Ex : Canapé 3 places, Réfrigérateur, Rideau occultant…" className={ic} />
                  {errMsg(`inventaires.${i}.designation`)}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={lc}>Description</label>
                    <textarea value={item.description}
                      onChange={e => setItem(i, 'description', e.target.value)}
                      rows={2} placeholder="État, couleur, marque, observations…" className={ic} />
                  </div>
                  <div>
                    <label className={lc}>Date</label>
                    <input type="date" value={item.date}
                      onChange={e => setItem(i, 'date', e.target.value)} className={ic} />
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
        )}

        {/* ── Actions ── */}
        <div className="flex gap-3 pb-6 pt-2">
          <button type="submit" disabled={!canSubmit}
            className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition">
            {loading ? 'Enregistrement…' : 'Créer l\'état des lieux'}
          </button>
          <Link href="/dashboard/etat-lieux"
            className="px-6 py-2.5 border border-gray-300 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition">
            Annuler
          </Link>
        </div>
      </form>
    </div>
  );
}

/* ── Wrap in Suspense (required for useSearchParams in Next.js App Router) ── */

export default function NouvelEtatLieuPage() {
  return (
    <Suspense fallback={<div className="p-8 text-gray-400 text-sm">Chargement…</div>}>
      <NouvelEtatLieuInner />
    </Suspense>
  );
}
