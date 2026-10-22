'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from '@/components/OrgLink';
import api from '@/lib/api';
import { EtatLieu, EtatLieuInventaire } from '@/types';

interface LocationSummary {
  id: number;
  locataire_nom: string;
  locataire_type: string;
  bien?: { id: number; designation: string; ville?: string | null } | null;
}
import { AxiosError } from 'axios';
import { Champ } from '@/components/Champ';

const categorieLabel: Record<string, string> = {
  meuble:         'Meuble',
  electromenager: 'Électroménager',
  equipement:     'Équipement',
  textile:        'Textile',
};

const emptyItem = (): EtatLieuInventaire => ({
  piece: '', categorie: 'meuble', designation: '', description: '', date: '',
});

const Field = ({ label, value }: { label: string; value?: string | null }) => (
  <div>
    <p className="text-xs text-gray-400 mb-0.5">{label}</p>
    <p className="text-sm text-gray-800 font-medium">{value || '—'}</p>
  </div>
);

const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';

export default function EtatLieuDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [tab, setTab]             = useState<'etat' | 'inventaire'>('etat');
  const [editing, setEditing]     = useState(false);
  const [etatLieu, setEtatLieu]   = useState<EtatLieu | null>(null);
  const [locations, setLocations] = useState<LocationSummary[]>([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [errors, setErrors]       = useState<Record<string, string[]>>({});
  const [globalError, setGlobalError] = useState('');

  const [form, setForm] = useState({
    location_id:         '',
    designation:         '',
    type:                'entree',
    date:                '',
    releve_eau:          '',
    releve_electricite:  '',
    releve_gaz:          '',
    remise_cles:         false,
    commentaire:         '',
  });

  const [inventaire, setInventaire] = useState<EtatLieuInventaire[]>([]);

  const fetchEtatLieu = () => {
    setLoading(true);
    Promise.all([
      api.get<{ data: EtatLieu }>(`/org/etat-lieux/${id}`),
      api.get('/org/locations?per_page=200&statut=actif'),
    ]).then(([el, loc]) => {
      const e = el.data.data;
      setEtatLieu(e);
      setForm({
        location_id:        String(e.location?.id ?? ''),
        designation:        e.designation ?? '',
        type:               e.type,
        date:               e.date,
        releve_eau:         e.releve_eau != null ? String(e.releve_eau) : '',
        releve_electricite: e.releve_electricite != null ? String(e.releve_electricite) : '',
        releve_gaz:         e.releve_gaz != null ? String(e.releve_gaz) : '',
        remise_cles:        e.remise_cles,
        commentaire:        e.commentaire ?? '',
      });
      setInventaire(
        (e.inventaires ?? []).map(inv => ({
          id:          inv.id,
          piece:       inv.piece,
          categorie:   inv.categorie,
          designation: inv.designation,
          description: inv.description ?? '',
          date:        inv.date ?? '',
        }))
      );
      setLocations(loc.data.data ?? []);
    }).catch(() => {})
    .finally(() => setLoading(false));
  };

  useEffect(() => { fetchEtatLieu(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm(p => ({ ...p, [field]: e.target.value }));

  const selectedLocation = locations.find(l => l.id === Number(form.location_id)) ?? null;

  /* ── Inventaire helpers ── */
  const addItem    = () => setInventaire(p => [...p, emptyItem()]);
  const removeItem = (i: number) => setInventaire(p => p.filter((_, idx) => idx !== i));
  const setItem    = (i: number, field: keyof EtatLieuInventaire, value: string) =>
    setInventaire(p => p.map((item, idx) => idx === i ? { ...item, [field]: value } : item));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setGlobalError('');
    setSaving(true);
    try {
      await api.put(`/org/etat-lieux/${id}`, {
        location_id:        Number(form.location_id),
        designation:        form.designation || undefined,
        type:               form.type,
        date:               form.date,
        releve_eau:         form.releve_eau ? Number(form.releve_eau) : null,
        releve_electricite: form.releve_electricite ? Number(form.releve_electricite) : null,
        releve_gaz:         form.releve_gaz ? Number(form.releve_gaz) : null,
        remise_cles:        form.remise_cles,
        commentaire:        form.commentaire || undefined,
        inventaires:        inventaire.map(it => ({
          piece:       it.piece,
          categorie:   it.categorie,
          designation: it.designation,
          description: it.description || undefined,
          date:        it.date || undefined,
        })),
      });
      setEditing(false);
      fetchEtatLieu();
    } catch (err) {
      const ae = err as AxiosError<{ errors?: Record<string, string[]>; message?: string }>;
      if (ae.response?.data?.errors) {
        setErrors(ae.response.data.errors);
        if (Object.keys(ae.response.data.errors).some(k => k.startsWith('inventaires')))
          setTab('inventaire');
      } else {
        setGlobalError(ae.response?.data?.message ?? 'Une erreur est survenue.');
      }
    } finally {
      setSaving(false);
    }
  };

  const errMsg = (f: string) => errors[f]
    ? <p className="text-red-500 text-xs mt-1">{errors[f][0]}</p>
    : null;

  const ic = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500';
  const lc = 'block text-xs font-medium text-gray-500 mb-1';

  if (loading) return <div className="p-8 animate-pulse h-40 bg-gray-100 rounded-xl" />;

  const typeLabel = form.type === 'entree' ? "État d'entrée" : 'État de sortie';

  /* ══════════════════════════════════════════════════════════════
     Vue lecture
  ══════════════════════════════════════════════════════════════ */
  if (!editing) {
    return (
      <div className="p-6 max-w-3xl">
        <div className="mb-6">
          <Link href="/dashboard/etat-lieux" className="text-sm text-gray-400 hover:text-gray-600">← Retour</Link>
          <div className="flex items-center justify-between mt-2">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{etatLieu?.designation || typeLabel}</h1>
              <p className="text-gray-400 text-sm mt-0.5">{fmtDate(form.date)}</p>
            </div>
            <button onClick={() => setEditing(true)}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition">
              Modifier
            </button>
          </div>
        </div>

        {/* Tabs lecture */}
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

        {/* ── Tab État ── */}
        {tab === 'etat' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm p-5 space-y-3">
              <h2 className="text-sm font-semibold text-gray-700">Identification</h2>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Type" value={typeLabel} />
                <Field label="Date" value={fmtDate(form.date)} />
              </div>
              {form.designation && <Field label="Désignation" value={form.designation} />}
            </div>

            <div className="bg-white rounded-xl shadow-sm p-5 space-y-3">
              <h2 className="text-sm font-semibold text-gray-700">Location associée</h2>
              {etatLieu?.location ? (
                <div className="space-y-2 text-sm text-gray-700">
                  <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Bien</p>
                    <p className="font-medium">{etatLieu.location.bien?.designation ?? '—'}</p>
                    {etatLieu.location.bien?.ville && <p className="text-xs text-gray-400">{etatLieu.location.bien.ville}</p>}
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Locataire
                      <span className="ml-2 px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded text-[10px] normal-case font-normal capitalize">
                        {etatLieu.location.locataire_type}
                      </span>
                    </p>
                    <p className="font-medium">
                      {etatLieu.location.locataire?.nom_complet ?? etatLieu.location.locataire_nom}
                    </p>
                    {etatLieu.location.locataire?.email && (
                      <p className="text-xs text-gray-400">{etatLieu.location.locataire.email}</p>
                    )}
                    {etatLieu.location.locataire?.telephone && (
                      <p className="text-xs text-gray-400">{etatLieu.location.locataire.telephone}</p>
                    )}
                  </div>
                  {etatLieu.location.date_debut && (
                    <p className="text-xs text-gray-400">Début de location : {fmtDate(etatLieu.location.date_debut)}</p>
                  )}
                </div>
              ) : <p className="text-sm text-gray-400">Aucune location associée.</p>}
            </div>

            <div className="bg-white rounded-xl shadow-sm p-5 space-y-3">
              <h2 className="text-sm font-semibold text-gray-700">Relevés de compteurs</h2>
              <div className="grid grid-cols-3 gap-4">
                <Field label="Eau (m³)" value={form.releve_eau} />
                <Field label="Électricité (kWh)" value={form.releve_electricite} />
                <Field label="Gaz (m³)" value={form.releve_gaz} />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-5 space-y-3">
              <h2 className="text-sm font-semibold text-gray-700">Remise des clés & Commentaire</h2>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${form.remise_cles ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {form.remise_cles ? '✓ Clés remises' : 'Clés non remises'}
              </span>
              {form.commentaire && <p className="text-sm text-gray-700 whitespace-pre-line">{form.commentaire}</p>}
            </div>
          </div>
        )}

        {/* ── Tab Inventaire (lecture) ── */}
        {tab === 'inventaire' && (
          <div className="space-y-3">
            {inventaire.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-400 text-sm">
                Aucun article dans l&apos;inventaire.
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Pièce</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Catégorie</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Désignation</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Description</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {inventaire.map((item, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-800">{item.piece}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                            {categorieLabel[item.categorie]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-700">{item.designation}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{item.description || '—'}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{item.date ? fmtDate(item.date) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════════
     Formulaire de modification
  ══════════════════════════════════════════════════════════════ */
  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <Link href="/dashboard/etat-lieux" className="text-sm text-gray-400 hover:text-gray-600">← Retour</Link>
        <h1 className="text-2xl font-bold text-gray-800 mt-2">Modifier l&apos;état des lieux</h1>
        {etatLieu?.designation && <p className="text-gray-400 text-sm mt-0.5">{etatLieu.designation}</p>}
      </div>

      {globalError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{globalError}</div>
      )}

      {/* Tabs modification */}
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

      <form onSubmit={handleSave} className="space-y-4">

        {/* ── Tab État (modification) ── */}
        {tab === 'etat' && (
          <>
            <div className="bg-white rounded-xl shadow-sm p-5 space-y-3">
              <h2 className="text-sm font-semibold text-gray-700">Identification</h2>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lc}>Type *</label>
                  <select value={form.type} onChange={set('type')} className={ic}>
                    <option value="entree">État d&apos;entrée</option>
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
                <Champ nom="designation" form={form} erreur={errors.designation?.[0]} />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-5 space-y-3">
              <h2 className="text-sm font-semibold text-gray-700">Location *</h2>
              <select value={form.location_id} onChange={set('location_id')} className={ic}>
                <option value="">— Sélectionner une location —</option>
                {locations.map(l => (
                  <option key={l.id} value={l.id}>
                    {l.locataire_nom}
                    {l.bien ? ` — ${l.bien.designation}` : ''}
                  </option>
                ))}
              </select>
              <Champ nom="location_id" form={form} erreur={errors.location_id?.[0]} />
              {errMsg('location_id')}
              {selectedLocation && (
                <div className="bg-blue-50 rounded-lg p-3 text-xs space-y-1 text-gray-600">
                  <p><span className="font-medium">Bien :</span> {selectedLocation.bien?.designation ?? '—'}{selectedLocation.bien?.ville ? ` · ${selectedLocation.bien.ville}` : ''}</p>
                  <p><span className="font-medium">Locataire :</span> {selectedLocation.locataire_nom}</p>
                  <p><span className="font-medium">Type :</span> <span className="capitalize">{selectedLocation.locataire_type}</span></p>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm p-5 space-y-3">
              <h2 className="text-sm font-semibold text-gray-700">Relevés de compteurs</h2>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={lc}>Eau (m³)</label>
                  <input type="number" step="0.001" min="0" value={form.releve_eau} onChange={set('releve_eau')} placeholder="0.000" className={ic} />
                  <Champ nom="releve_eau" form={form} erreur={errors.releve_eau?.[0]} />
                  {errMsg('releve_eau')}
                </div>
                <div>
                  <label className={lc}>Électricité (kWh)</label>
                  <input type="number" step="0.001" min="0" value={form.releve_electricite} onChange={set('releve_electricite')} placeholder="0.000" className={ic} />
                  <Champ nom="releve_electricite" form={form} erreur={errors.releve_electricite?.[0]} />
                  {errMsg('releve_electricite')}
                </div>
                <div>
                  <label className={lc}>Gaz (m³)</label>
                  <input type="number" step="0.001" min="0" value={form.releve_gaz} onChange={set('releve_gaz')} placeholder="0.000" className={ic} />
                  <Champ nom="releve_gaz" form={form} erreur={errors.releve_gaz?.[0]} />
                  {errMsg('releve_gaz')}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-5 space-y-3">
              <h2 className="text-sm font-semibold text-gray-700">Remise des clés & Commentaire</h2>
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <button type="button"
                  onClick={() => setForm(p => ({ ...p, remise_cles: !p.remise_cles }))}
                  className={`w-10 h-6 rounded-full transition-colors relative ${form.remise_cles ? 'bg-green-500' : 'bg-gray-300'}`}>
                  <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.remise_cles ? 'left-5' : 'left-1'}`} />
                </button>
                <span className="text-sm text-gray-700">{form.remise_cles ? 'Clés remises au locataire' : 'Clés non remises'}</span>
              </label>
              <div>
                <label className={lc}>Commentaire</label>
                <textarea value={form.commentaire} onChange={set('commentaire')} rows={4}
                  placeholder="Observations, état général du bien, réserves éventuelles…" className={ic} />
              </div>
            </div>
          </>
        )}

        {/* ── Tab Inventaire (modification) ── */}
        {tab === 'inventaire' && (
          <div className="space-y-4">
            {inventaire.length === 0 && (
              <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <p className="text-gray-400 text-sm mb-4">Aucun article ajouté pour l&apos;instant.</p>
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
                      onChange={e => setItem(i, 'categorie', e.target.value)}
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
                    placeholder="Ex : Canapé 3 places, Réfrigérateur…" className={ic} />
                  <Champ nom="designation" form={item} erreur={errors.designation?.[0]} />
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

        <div className="flex gap-3 pb-6 pt-2">
          <button type="submit" disabled={saving}
            className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition">
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
          <button type="button" onClick={() => setEditing(false)}
            className="px-6 py-2.5 border border-gray-300 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition">
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}
