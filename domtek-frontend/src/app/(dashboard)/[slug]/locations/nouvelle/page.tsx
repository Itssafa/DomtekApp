'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

interface SelectOption { id: number; label: string; }

const inputCls = 'w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all';
const inputReadCls = inputCls + ' bg-violet-50 text-violet-700 font-semibold cursor-default';
const labelCls = 'block text-xs font-medium text-gray-600 mb-1.5';

const TYPES = [
  { value: 'bail_habitation',    label: 'Bail habitation' },
  { value: 'bail_etudiant',      label: 'Bail étudiant' },
  { value: 'bail_professionnel', label: 'Bail professionnel' },
  { value: 'bail_commercial',    label: 'Bail commercial' },
  { value: 'bail_saisonnier',    label: 'Bail saisonnier' },
  { value: 'loyer',              label: 'Loyer simple' },
];

const PERIODICITES = [
  { value: 'mensuel',     label: 'Mensuel' },
  { value: 'trimestriel', label: 'Trimestriel' },
  { value: 'semestriel',  label: 'Semestriel' },
  { value: 'annuel',      label: 'Annuel' },
];

/** First payment date on or after dateDebut with jour_paiement as day-of-month */
function computePremierEcheance(dateDebut: string, jourPaiement: number): string {
  if (!dateDebut || !jourPaiement) return '';
  const jour = Math.min(jourPaiement, 28);
  const d = new Date(dateDebut);
  const candidate = new Date(d.getFullYear(), d.getMonth(), jour);
  if (candidate >= d) return candidate.toISOString().slice(0, 10);
  const next = new Date(d.getFullYear(), d.getMonth() + 1, jour);
  return next.toISOString().slice(0, 10);
}

/** Human-readable duration between two dates */
function computeDuree(dateDebut: string, dateFin: string): string {
  if (!dateDebut || !dateFin) return '';
  const d = new Date(dateDebut);
  const f = new Date(dateFin);
  const months = (f.getFullYear() - d.getFullYear()) * 12 + (f.getMonth() - d.getMonth());
  if (months <= 0) return '';
  if (months < 12) return `${months} mois`;
  const y = Math.floor(months / 12), m = months % 12;
  return m === 0 ? `${y} an${y > 1 ? 's' : ''}` : `${y} an${y > 1 ? 's' : ''} et ${m} mois`;
}

export default function NouvelleLocationPage() {
  const router = useRouter();
  const { organisation } = useAuthStore();
  const assuranceRef  = useRef<HTMLInputElement>(null);
  const [assuranceNom, setAssuranceNom] = useState('');

  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const [biens,     setBiens]     = useState<SelectOption[]>([]);
  const [clients,   setClients]   = useState<SelectOption[]>([]);
  const [prospects, setProspects] = useState<SelectOption[]>([]);
  const [locataireType, setLocataireType] = useState<'client' | 'prospect' | 'nouveau'>('client');

  const [form, setForm] = useState({
    bien_id:             '',
    locataire_id:        '',
    locataire_nom:       '',
    designation:         '',
    type:                'bail_habitation',
    utilisation:         '',
    date_debut:          '',
    date_fin:            '',
    montant_ht:          '',
    tva:                 '19',
    frais_syndic:        '0',
    retenue_source:      '5',
    periodicite:         'mensuel',
    jour_paiement:       '1',
    depot_garantie:      '0',
    renouvellement_auto: false,
    notes:               '',
    statut:              'actif',
  });

  // Auto-calculated fields
  const premiereEcheance = computePremierEcheance(form.date_debut, Number(form.jour_paiement));
  const duree            = computeDuree(form.date_debut, form.date_fin);
  const ht      = parseFloat(form.montant_ht)     || 0;
  const tva     = parseFloat(form.tva)            || 0;
  const frais   = parseFloat(form.frais_syndic)   || 0;
  const retenue = parseFloat(form.retenue_source) || 0;
  const ttc     = Math.round(ht * (1 + tva / 100) * 100) / 100;
  const paiement= Math.round((ttc + frais - ht * retenue / 100) * 100) / 100;

  useEffect(() => {
    api.get('/org/biens?per_page=200').then(({ data: r }) =>
      setBiens((r.data ?? []).map((b: { id: number; designation: string }) => ({ id: b.id, label: b.designation })))
    ).catch(() => {});
    api.get('/org/clients?per_page=200').then(({ data: r }) =>
      setClients((r.data ?? []).map((c: { id: number; nom_complet: string }) => ({ id: c.id, label: c.nom_complet })))
    ).catch(() => {});
    api.get('/org/prospects?per_page=200').then(({ data: r }) =>
      setProspects((r.data ?? []).map((p: { id: number; nom: string; prenom: string }) => ({
        id: p.id, label: `${p.prenom} ${p.nom}`,
      })))
    ).catch(() => {});
  }, []);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!premiereEcheance) { setError('Renseignez la date de début et le jour de paiement.'); return; }
    setError('');
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        bien_id:             Number(form.bien_id),
        locataire_type:      locataireType,
        locataire_id:        locataireType !== 'nouveau' && form.locataire_id ? Number(form.locataire_id) : null,
        locataire_nom:       locataireType === 'nouveau' ? form.locataire_nom : null,
        designation:         form.designation || null,
        type:                form.type,
        utilisation:         form.utilisation || null,
        date_debut:          form.date_debut,
        date_fin:            form.date_fin || null,
        premiere_echeance:   premiereEcheance,
        montant_ht:          ht,
        tva,
        frais_syndic:        frais,
        retenue_source:      retenue,
        periodicite:         form.periodicite,
        jour_paiement:       Number(form.jour_paiement),
        depot_garantie:      parseFloat(form.depot_garantie) || 0,
        renouvellement_auto: form.renouvellement_auto,
        notes:               form.notes || null,
        statut:              form.statut,
      };

      const { data: created } = await api.post('/org/locations', payload);
      const locId = created.data?.id ?? created.id;

      // Upload assurance file if selected
      const file = assuranceRef.current?.files?.[0];
      if (file && locId) {
        const fd = new FormData();
        fd.append('assurance', file);
        await api.post(`/org/locations/${locId}/assurance`, fd).catch(() => {});
      }

      const base = organisation?.slug ? `/${organisation.slug}` : '/dashboard';
      router.push(`${base}/locations/${locId}`);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message ?? 'Erreur lors de la création.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Nouvelle location</h1>
        <p className="text-gray-500 text-sm mt-1">Les quittances sont générées automatiquement pour toute la durée du bail.</p>
      </div>

      {error && (
        <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── Locataire ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Locataire</h2>
          <div className="flex gap-2">
            {(['client', 'prospect', 'nouveau'] as const).map(t => (
              <button key={t} type="button" onClick={() => setLocataireType(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                  locataireType === t ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}>
                {t === 'client' ? 'Client existant' : t === 'prospect' ? 'Prospect' : 'Nouveau'}
              </button>
            ))}
          </div>
          {locataireType === 'client' && (
            <div>
              <label className={labelCls}>Client *</label>
              <select required value={form.locataire_id} onChange={set('locataire_id')} className={inputCls}>
                <option value="">— Sélectionner —</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
          )}
          {locataireType === 'prospect' && (
            <div>
              <label className={labelCls}>Prospect *</label>
              <select required value={form.locataire_id} onChange={set('locataire_id')} className={inputCls}>
                <option value="">— Sélectionner —</option>
                {prospects.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </div>
          )}
          {locataireType === 'nouveau' && (
            <div>
              <label className={labelCls}>Nom complet *</label>
              <input required type="text" value={form.locataire_nom} onChange={set('locataire_nom')} className={inputCls} placeholder="Prénom Nom" />
            </div>
          )}
        </div>

        {/* ── Bien & Identification ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Bien & Identification</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Bien *</label>
              <select required value={form.bien_id} onChange={set('bien_id')} className={inputCls}>
                <option value="">— Sélectionner —</option>
                {biens.map(b => <option key={b.id} value={b.id}>{b.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Type de bail *</label>
              <select value={form.type} onChange={set('type')} className={inputCls}>
                {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className={labelCls}>Désignation</label>
              <input type="text" value={form.designation} onChange={set('designation')} className={inputCls} placeholder="Ex: Appartement F3 – Lot 14" />
            </div>
            <div>
              <label className={labelCls}>Utilisation</label>
              <input type="text" value={form.utilisation} onChange={set('utilisation')} className={inputCls} placeholder="Ex: Résidence principale" />
            </div>
            <div>
              <label className={labelCls}>Statut</label>
              <select value={form.statut} onChange={set('statut')} className={inputCls}>
                <option value="actif">Actif</option>
                <option value="expire">Expiré</option>
                <option value="resilie">Résilié</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── Dates ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Dates du bail</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Date de début *</label>
              <input required type="date" value={form.date_debut} onChange={set('date_debut')} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Date de fin</label>
              <input type="date" value={form.date_fin} onChange={set('date_fin')} className={inputCls} />
            </div>
            {duree && (
              <div className="col-span-2">
                <label className={labelCls}>Durée du bail (calculée)</label>
                <div className={inputReadCls}>{duree}</div>
              </div>
            )}
          </div>
        </div>

        {/* ── Financier ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Financier</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Montant HT (DH) *</label>
              <input required type="number" step="0.01" min="0" value={form.montant_ht} onChange={set('montant_ht')} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>TVA (%)</label>
              <input type="number" step="0.01" min="0" max="100" value={form.tva} onChange={set('tva')} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Montant TTC (auto)</label>
              <input readOnly value={ttc.toFixed(2)} className={inputCls + ' bg-gray-100 text-gray-500 cursor-default'} />
            </div>
            <div>
              <label className={labelCls}>Frais syndic (DH)</label>
              <input type="number" step="0.01" min="0" value={form.frais_syndic} onChange={set('frais_syndic')} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Retenue à la source (%)</label>
              <input type="number" step="0.01" min="0" max="100" value={form.retenue_source} onChange={set('retenue_source')} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Montant paiement (auto)</label>
              <input readOnly value={paiement.toFixed(2)} className={inputReadCls} />
            </div>
            <div>
              <label className={labelCls}>Dépôt de garantie (DH)</label>
              <input type="number" step="0.01" min="0" value={form.depot_garantie} onChange={set('depot_garantie')} className={inputCls} />
            </div>
          </div>
        </div>

        {/* ── Paiement ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Paiement</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Périodicité *</label>
              <select value={form.periodicite} onChange={set('periodicite')} className={inputCls}>
                {PERIODICITES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Jour de paiement (1-28) *</label>
              <input required type="number" min="1" max="28" value={form.jour_paiement} onChange={set('jour_paiement')} className={inputCls} />
            </div>
            <div className="col-span-2">
              <label className={labelCls}>Première échéance (calculée)</label>
              <input readOnly value={premiereEcheance || '— renseignez la date de début et le jour de paiement'} className={inputReadCls} />
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <input type="checkbox" checked={form.renouvellement_auto}
                onChange={e => setForm(p => ({ ...p, renouvellement_auto: e.target.checked }))}
                className="w-4 h-4 accent-violet-600" />
              <span className="text-sm text-gray-600">Renouvellement automatique</span>
            </div>
          </div>
        </div>

        {/* ── Assurance ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-3">
          <h2 className="text-sm font-semibold text-gray-700">Assurance</h2>
          <label className={labelCls}>Document d'assurance (PDF, JPG, PNG — max 10 Mo)</label>
          <div className="flex items-center gap-3">
            <input ref={assuranceRef} type="file" accept=".pdf,.jpg,.jpeg,.png"
              className="hidden" id="assurance-input"
              onChange={e => setAssuranceNom(e.target.files?.[0]?.name ?? '')} />
            <label htmlFor="assurance-input"
              className="px-4 py-2.5 border border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-violet-400 hover:text-violet-600 cursor-pointer transition flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Choisir un fichier
            </label>
            <span className="text-xs text-gray-400 truncate max-w-xs">
              {assuranceNom || 'Aucun fichier sélectionné'}
            </span>
          </div>
        </div>

        {/* ── Notes ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <label className={labelCls}>Notes</label>
          <textarea rows={3} value={form.notes} onChange={set('notes')} className={inputCls + ' resize-none'} />
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => router.back()}
            className="px-5 py-2.5 text-sm text-gray-600 hover:text-gray-800 border border-gray-200 rounded-xl transition">
            Annuler
          </button>
          <button type="submit" disabled={saving}
            className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition">
            {saving ? 'Enregistrement…' : 'Créer la location'}
          </button>
        </div>
      </form>
    </div>
  );
}

