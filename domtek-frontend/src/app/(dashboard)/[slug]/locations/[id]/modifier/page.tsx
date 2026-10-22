'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { orgPath } from '@/lib/org-path';
import { useAuthStore } from '@/store/authStore';
import StepForm, { FormStep } from '@/components/StepForm';
import { Champ } from '@/components/Champ';

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

function computePremierEcheance(dateDebut: string, jourPaiement: number): string {
  if (!dateDebut || !jourPaiement) return '';
  const jour = Math.min(jourPaiement, 28);
  const d = new Date(dateDebut);
  const candidate = new Date(d.getFullYear(), d.getMonth(), jour);
  if (candidate >= d) return candidate.toISOString().slice(0, 10);
  const next = new Date(d.getFullYear(), d.getMonth() + 1, jour);
  return next.toISOString().slice(0, 10);
}

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

export default function ModifierLocationPage() {
  const { id }   = useParams<{ id: string }>();
  const router   = useRouter();
  const { organisation } = useAuthStore();
  const assuranceRef = useRef<HTMLInputElement>(null);

  const [loaded,        setLoaded]        = useState(false);
  const [saving,        setSaving]        = useState(false);
  const [error,         setError]         = useState('');
  const [assuranceNom,  setAssuranceNom]  = useState('');
  const [assuranceUrl,  setAssuranceUrl]  = useState<string | null>(null);

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

  const premiereEcheance = computePremierEcheance(form.date_debut, Number(form.jour_paiement));
  const duree            = computeDuree(form.date_debut, form.date_fin);
  const ht      = parseFloat(form.montant_ht)     || 0;
  const tva     = parseFloat(form.tva)            || 0;
  const frais   = parseFloat(form.frais_syndic)   || 0;
  const retenue = parseFloat(form.retenue_source) || 0;
  const ttc     = Math.round(ht * (1 + tva / 100) * 100) / 100;
  const paiement= Math.round((ttc + frais - ht * retenue / 100) * 100) / 100;

  useEffect(() => {
    Promise.all([
      api.get('/org/biens?per_page=200'),
      api.get('/org/clients?per_page=200'),
      api.get('/org/prospects?per_page=200'),
      api.get(`/org/locations/${id}`),
    ]).then(([bRes, cRes, pRes, locRes]) => {
      setBiens((bRes.data.data ?? []).map((b: { id: number; designation: string }) => ({ id: b.id, label: b.designation })));
      setClients((cRes.data.data ?? []).map((c: { id: number; nom_complet: string }) => ({ id: c.id, label: c.nom_complet })));
      setProspects((pRes.data.data ?? []).map((p: { id: number; nom: string; prenom: string }) => ({ id: p.id, label: `${p.prenom} ${p.nom}` })));

      const loc = locRes.data.data;
      setLocataireType(loc.locataire_type ?? 'client');
      setAssuranceUrl(loc.assurance ?? null);
      setAssuranceNom(loc.assurance_nom ?? '');
      setForm({
        bien_id:             String(loc.bien?.id ?? ''),
        locataire_id:        String(loc.locataire_id ?? ''),
        locataire_nom:       loc.locataire_nom ?? '',
        designation:         loc.designation ?? '',
        type:                loc.type ?? 'bail_habitation',
        utilisation:         loc.utilisation ?? '',
        date_debut:          loc.date_debut ?? '',
        date_fin:            loc.date_fin ?? '',
        montant_ht:          String(loc.montant_ht ?? 0),
        tva:                 String(loc.tva ?? 19),
        frais_syndic:        String(loc.frais_syndic ?? 0),
        retenue_source:      String(loc.retenue_source ?? 5),
        periodicite:         loc.periodicite ?? 'mensuel',
        jour_paiement:       String(loc.jour_paiement ?? 1),
        depot_garantie:      String(loc.depot_garantie ?? 0),
        renouvellement_auto: !!loc.renouvellement_auto,
        notes:               loc.notes ?? '',
        statut:              loc.statut ?? 'actif',
      });
      setLoaded(true);
    }).catch(() => {});
  }, [id]);

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

      await api.put(`/org/locations/${id}`, payload);

      const file = assuranceRef.current?.files?.[0];
      if (file) {
        const fd = new FormData();
        fd.append('assurance', file);
        await api.post(`/org/locations/${id}/assurance`, fd).catch(() => {});
      }

      const base = organisation?.slug ? `/${organisation.slug}` : '/dashboard';
      router.push(`${base}/locations/${id}`);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message ?? 'Erreur lors de la mise à jour.');
    } finally {
      setSaving(false);
    }
  };

  if (!loaded) return <div className="p-8 text-gray-400 text-sm">Chargement…</div>;

  const steps: FormStep[] = [
    {
      title: 'Locataire',
      validate: () => {
        if (locataireType !== 'nouveau' && !form.locataire_id) return 'Veuillez sélectionner un locataire.';
        if (locataireType === 'nouveau' && !form.locataire_nom.trim()) return 'Le nom du locataire est obligatoire.';
        return null;
      },
      content: (
        <>
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
              <select value={form.locataire_id} onChange={set('locataire_id')} className={inputCls}>
                <option value="">— Sélectionner —</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
              <Champ nom="locataire_id" form={form} />
            </div>
          )}
          {locataireType === 'prospect' && (
            <div>
              <label className={labelCls}>Prospect *</label>
              <select value={form.locataire_id} onChange={set('locataire_id')} className={inputCls}>
                <option value="">— Sélectionner —</option>
                {prospects.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
              <Champ nom="locataire_id" form={form} />
            </div>
          )}
          {locataireType === 'nouveau' && (
            <div>
              <label className={labelCls}>Nom complet *</label>
              <input type="text" value={form.locataire_nom} onChange={set('locataire_nom')} className={inputCls} />
              <Champ nom="locataire_nom" form={form} />
            </div>
          )}
        </>
      ),
    },
    {
      title: 'Bien & Identification',
      validate: () => {
        if (!form.bien_id) return 'Veuillez sélectionner un bien.';
        return null;
      },
      content: (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Bien *</label>
              <select value={form.bien_id} onChange={set('bien_id')} className={inputCls}>
                <option value="">— Sélectionner —</option>
                {biens.map(b => <option key={b.id} value={b.id}>{b.label}</option>)}
              </select>
              <Champ nom="bien_id" form={form} />
            </div>
            <div>
              <label className={labelCls}>Type de bail *</label>
              <select value={form.type} onChange={set('type')} className={inputCls}>
                {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className={labelCls}>Désignation</label>
              <input type="text" value={form.designation} onChange={set('designation')} className={inputCls} />
              <Champ nom="designation" form={form} />
            </div>
            <div>
              <label className={labelCls}>Utilisation</label>
              <input type="text" value={form.utilisation} onChange={set('utilisation')} className={inputCls} />
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
        </>
      ),
    },
    {
      title: 'Dates du bail',
      validate: () => {
        if (!form.date_debut) return 'La date de début est obligatoire.';
        return null;
      },
      content: (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Date de début *</label>
              <input type="date" value={form.date_debut} onChange={set('date_debut')} className={inputCls} />
              <Champ nom="date_debut" form={form} />
            </div>
            <div>
              <label className={labelCls}>Date de fin</label>
              <input type="date" value={form.date_fin} onChange={set('date_fin')} className={inputCls} min={form.date_debut || undefined} />
              <Champ nom="date_fin" form={form} />
            </div>
            {duree && (
              <div className="col-span-2">
                <label className={labelCls}>Durée du bail (calculée)</label>
                <div className={inputReadCls}>{duree}</div>
              </div>
            )}
          </div>
        </>
      ),
    },
    {
      title: 'Financier & Paiement',
      validate: () => {
        if (!form.montant_ht) return 'Le montant HT est obligatoire.';
        return null;
      },
      content: (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Montant HT (DT) *</label>
              <input type="number" step="0.01" min="0" value={form.montant_ht} onChange={set('montant_ht')} className={inputCls} />
              <Champ nom="montant_ht" form={form} />
            </div>
            <div>
              <label className={labelCls}>TVA (%)</label>
              <input type="number" step="0.01" min="0" max="100" value={form.tva} onChange={set('tva')} className={inputCls} />
              <Champ nom="tva" form={form} />
            </div>
            <div>
              <label className={labelCls}>Montant TTC (auto)</label>
              <input readOnly value={ttc.toFixed(2)} className={inputCls + ' bg-gray-100 text-gray-500 cursor-default'} />
            </div>
            <div>
              <label className={labelCls}>Frais syndic (DT)</label>
              <input type="number" step="0.01" min="0" value={form.frais_syndic} onChange={set('frais_syndic')} className={inputCls} />
              <Champ nom="frais_syndic" form={form} />
            </div>
            <div>
              <label className={labelCls}>Retenue à la source (%)</label>
              <input type="number" step="0.01" min="0" max="100" value={form.retenue_source} onChange={set('retenue_source')} className={inputCls} />
              <Champ nom="retenue_source" form={form} />
            </div>
            <div>
              <label className={labelCls}>Montant paiement (auto)</label>
              <input readOnly value={paiement.toFixed(2)} className={inputReadCls} />
            </div>
            <div>
              <label className={labelCls}>Dépôt de garantie (DT)</label>
              <input type="number" step="0.01" min="0" value={form.depot_garantie} onChange={set('depot_garantie')} className={inputCls} />
              <Champ nom="depot_garantie" form={form} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Périodicité *</label>
              <select value={form.periodicite} onChange={set('periodicite')} className={inputCls}>
                {PERIODICITES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Jour de paiement (1-28) *</label>
              <input type="number" min="1" max="28" value={form.jour_paiement} onChange={set('jour_paiement')} className={inputCls} />
              <Champ nom="jour_paiement" form={form} />
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
        </>
      ),
    },
    {
      title: 'Assurance & Notes',
      content: (
        <>
          {assuranceUrl && !assuranceNom.startsWith('blob') && (
            <div className="flex items-center gap-2 text-sm text-violet-700 bg-violet-50 px-3 py-2 rounded-lg">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <a href={assuranceUrl} target="_blank" rel="noreferrer" className="hover:underline truncate">
                {assuranceNom || 'Document existant'}
              </a>
              <span className="text-xs text-gray-400 ml-1">(remplacer ci-dessous)</span>
            </div>
          )}
          <div>
            <label className={labelCls}>
              {assuranceUrl ? 'Remplacer le document (PDF, JPG, PNG — max 10 Mo)' : "Document d'assurance (PDF, JPG, PNG — max 10 Mo)"}
            </label>
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
              {assuranceNom && !assuranceUrl && (
                <span className="text-xs text-gray-500 truncate max-w-xs">{assuranceNom}</span>
              )}
            </div>
          </div>
          <div>
            <label className={labelCls}>Notes</label>
            <textarea rows={3} value={form.notes} onChange={set('notes')} className={inputCls + ' resize-none'} />
          </div>
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>
          )}
        </>
      ),
    },
  ];

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Modifier la location</h1>
        <p className="text-gray-500 text-sm mt-1">Les quittances manquantes seront générées automatiquement.</p>
      </div>
      <StepForm
        steps={steps}
        onSubmit={handleSubmit}
        submitLabel="Enregistrer"
        loading={saving}
        cancelHref={orgPath(`/dashboard/locations/${id}`)}
      />
    </div>
  );
}
