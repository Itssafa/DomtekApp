'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from '@/components/OrgLink';
import api from '@/lib/api'
import { orgPath } from '@/lib/org-path';
import { useAuthStore } from '@/store/authStore';
import { Bien, Client, Organisation, Prospect } from '@/types';
import { AxiosError } from 'axios';
import { ContratPreview, type ContratPreviewData } from '@/components/ContratPreview';

// ─── Constantes ───────────────────────────────────────────────────────────────

const TYPES_CONTRAT = [
  { value: 'bail_habitation',    label: 'Bail d\'habitation' },
  { value: 'bail_etudiant',      label: 'Bail étudiant' },
  { value: 'bail_professionnel', label: 'Bail professionnel' },
  { value: 'bail_commercial',    label: 'Bail commercial' },
  { value: 'bail_saisonnier',    label: 'Bail saisonnier' },
  { value: 'loyer',              label: 'Location (général)' },
  { value: 'vente',              label: 'Vente' },
  { value: 'autre',              label: 'Autre' },
];

const TYPES_LOCATION = ['bail_habitation','bail_etudiant','bail_professionnel','bail_commercial','bail_saisonnier','loyer'];

// Types affichés dans le sélecteur "Type" uniquement pour les contrats de location
const TYPES_LOCATION_OPTS = TYPES_CONTRAT.filter(t => TYPES_LOCATION.includes(t.value));

const UTILISATIONS = [
  { value: 'residence_primaire',   label: 'Résidence primaire' },
  { value: 'residence_secondaire', label: 'Résidence secondaire' },
  { value: 'professionnel',        label: 'Usage professionnel' },
  { value: 'commercial',           label: 'Usage commercial' },
  { value: 'autre',                label: 'Autre' },
];

const PERIODICITES = [
  { value: 'mensuel',        label: 'Mensuel' },
  { value: 'bimestriel',     label: 'Bimestriel (tous les 2 mois)' },
  { value: 'trimestriel',    label: 'Trimestriel (tous les 3 mois)' },
  { value: 'quadrimestriel', label: 'Quadrimestriel (tous les 4 mois)' },
  { value: 'semestriel',     label: 'Semestriel (tous les 6 mois)' },
  { value: 'annuel',         label: 'Annuel' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(d: string | null | undefined): string {
  if (!d) return '__/__/____';
  return new Date(d).toLocaleDateString('fr-FR');
}

function calcDuree(debut: string, fin: string): string {
  if (!debut || !fin) return '';
  const d1 = new Date(debut), d2 = new Date(fin);
  const months = (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth());
  if (months <= 0) return '';
  if (months < 12) return `${months} mois`;
  const years = Math.floor(months / 12), rem = months % 12;
  return rem > 0 ? `${years} an(s) et ${rem} mois` : `${years} an(s)`;
}

function calcPremiereEcheance(debut: string, periodicite: string): string {
  if (!debut || !periodicite) return '';
  const d = new Date(debut);
  const mois: Record<string, number> = {
    mensuel: 1, bimestriel: 2, trimestriel: 3,
    quadrimestriel: 4, semestriel: 6, annuel: 12,
  };
  d.setMonth(d.getMonth() + (mois[periodicite] ?? 1));
  return d.toISOString().split('T')[0];
}

// ─── Types locaux ─────────────────────────────────────────────────────────────

type ModePB = 'client_existant' | 'prospect' | 'nouveau_client';

interface ClientPreview {
  civilite?: string | null;
  nom_complet?: string;
  date_naissance?: string | null;
  cin?: string | null;
  adresse?: string | null;
  ville?: string | null;
}

// ─── Formulaire par défaut ────────────────────────────────────────────────────

function defaultForm() {
  return {
    type:                 'bail_habitation',
    designation:          '',
    utilisation:          '',
    forme_juridique:      '',
    representant:         '',
    bien_id:              '',
    cin_delivree_le:      '',
    date_contrat:         new Date().toISOString().split('T')[0],
    date_debut:           '',
    date_fin:             '',
    montant_ht:           '',
    tva:                  '19',
    frais_syndic:         '',
    retenue_source:       '',
    periodicite_paiement: 'mensuel',
    jour_paiement:        '',
    depot_garantie:       '',
    premiere_echeance:    '',
    assurance:            '',
    ville_signature:      '',
    notes:                '',
  };
}

function defaultNouveauClient() {
  return {
    civilite:       '',
    nom:            '',
    prenom:         '',
    email:          '',
    telephone:      '',
    adresse:        '',
    ville:          '',
    cin:            '',
    date_naissance: '',
  };
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function NouveauContratPage() {
  const router = useRouter();
  const { organisation } = useAuthStore();

  const [nature, setNature]       = useState<'location' | 'vente'>('location');
  const [lang, setLang]           = useState<'fr' | 'ar'>('fr');

  const [biens, setBiens]         = useState<Bien[]>([]);
  const [clients, setClients]     = useState<Client[]>([]);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [form, setForm]           = useState(defaultForm());
  const [modePB, setModePB]       = useState<ModePB>('client_existant');

  // Sélection selon le mode
  const [clientId, setClientId]   = useState('');
  const [prospectId, setProspectId] = useState('');
  const [ncForm, setNcForm]       = useState(defaultNouveauClient());

  const [contratsExistants, setContratsExistants] = useState<Array<{
    date_debut: string; date_fin: string | null; statut: string; type: string; designation: string | null;
  }>>([]);

  const [errors, setErrors]       = useState<Record<string, string[]>>({});
  const [globalError, setGlobalError] = useState('');
  const [loading, setLoading]     = useState(false);

  useEffect(() => {
    Promise.allSettled([
      api.get('/org/biens?per_page=200'),
      api.get('/org/clients?per_page=200'),
      api.get('/org/prospects?per_page=200'),
    ]).then(([b, c, p]) => {
      if (b.status === 'fulfilled') setBiens(b.value.data.data ?? []);
      if (c.status === 'fulfilled') setClients(c.value.data.data ?? []);
      if (p.status === 'fulfilled') setProspects(p.value.data.data ?? []);
    });
  }, []);

  useEffect(() => {
    if (organisation?.ville && !form.ville_signature) {
      setForm(prev => ({ ...prev, ville_signature: organisation.ville ?? '' }));
    }
  }, [organisation]); // eslint-disable-line react-hooks/exhaustive-deps

  // Charger les contrats de location actifs du bien sélectionné
  useEffect(() => {
    if (!form.bien_id) { setContratsExistants([]); return; }
    api.get(`/org/contrats?bien_id=${form.bien_id}&per_page=100`)
      .then(r => setContratsExistants(r.data.data ?? []))
      .catch(() => setContratsExistants([]));
  }, [form.bien_id]);

  const handleNatureChange = (n: 'location' | 'vente') => {
    setNature(n);
    setForm(prev => ({
      ...prev,
      type:                 n === 'vente' ? 'vente' : 'bail_habitation',
      date_fin:             '',
      frais_syndic:         '',
      periodicite_paiement: n === 'location' ? 'mensuel' : '',
      jour_paiement:        '',
      premiere_echeance:    '',
    }));
  };

  const set = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm(p => ({ ...p, [field]: e.target.value }));

  const setNc = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => setNcForm(p => ({ ...p, [field]: e.target.value }));

  const selectedBien    = biens.find(b => b.id === Number(form.bien_id)) ?? null;
  const selectedClient  = clients.find(c => c.id === Number(clientId)) ?? null;
  const selectedProspect = prospects.find(p => p.id === Number(prospectId)) ?? null;
  const isLocation      = nature === 'location';

  // Objet unifié pour l'aperçu
  const clientPreview: ClientPreview | null = useMemo(() => {
    if (modePB === 'client_existant' && selectedClient) return selectedClient;
    if (modePB === 'prospect' && selectedProspect) return selectedProspect as unknown as ClientPreview;
    if (modePB === 'nouveau_client' && (ncForm.nom || ncForm.prenom)) {
      return {
        civilite:       ncForm.civilite || null,
        nom_complet:    `${ncForm.civilite ? ncForm.civilite + ' ' : ''}${ncForm.prenom} ${ncForm.nom}`.trim(),
        date_naissance: ncForm.date_naissance || null,
        cin:            ncForm.cin || null,
        adresse:        ncForm.adresse || null,
        ville:          ncForm.ville || null,
      };
    }
    return null;
  }, [modePB, selectedClient, selectedProspect, ncForm]);

  // Calculs automatiques
  const montantTtc = useMemo(() => {
    if (!form.montant_ht) return '';
    const ht  = parseFloat(form.montant_ht);
    const tva = parseFloat(form.tva || '0');
    return isNaN(ht) ? '' : (ht * (1 + tva / 100)).toFixed(3);
  }, [form.montant_ht, form.tva]);

  const duree = useMemo(() => calcDuree(form.date_debut, form.date_fin), [form.date_debut, form.date_fin]);

  const premiereEcheance = useMemo(
    () => form.premiere_echeance || calcPremiereEcheance(form.date_debut, form.periodicite_paiement),
    [form.premiere_echeance, form.date_debut, form.periodicite_paiement]
  );

  // Détection de vente en doublon (un même bien vendu deux fois)
  const conflitVente = useMemo(() => {
    if (isLocation || !form.bien_id) return null;

    const dejaVendu = contratsExistants.find(c =>
      c.type === 'vente' && c.statut !== 'resilie'
    );

    if (!dejaVendu) return null;

    const debut = new Date(dejaVendu.date_debut).toLocaleDateString('fr-FR');
    const label = dejaVendu.designation ?? `Contrat de vente du ${debut}`;
    return `Ce bien a déjà été vendu (${label}). Un bien ne peut faire l'objet que d'un seul contrat de vente.`;
  }, [isLocation, form.bien_id, contratsExistants]);

  // Détection de chevauchement en temps réel
  const conflitLocation = useMemo(() => {
    if (!isLocation || !form.date_debut || !form.bien_id) return null;

    const newDebut = new Date(form.date_debut);
    const newFin   = form.date_fin ? new Date(form.date_fin) : null;

    const contratEnConflit = contratsExistants.find(c => {
      if (!TYPES_LOCATION.includes(c.type)) return false;
      if (c.statut === 'termine' || c.statut === 'resilie') return false;

      const exDebut = new Date(c.date_debut);
      const exFin   = c.date_fin ? new Date(c.date_fin) : null;

      // Chevauchement : newDebut ≤ exFin  ET  exDebut ≤ newFin
      const newDebutOk = exFin === null || newDebut <= exFin;
      const exDebutOk  = newFin === null || exDebut <= newFin;
      return newDebutOk && exDebutOk;
    });

    if (!contratEnConflit) return null;

    const debut = new Date(contratEnConflit.date_debut).toLocaleDateString('fr-FR');
    const fin   = contratEnConflit.date_fin
      ? new Date(contratEnConflit.date_fin).toLocaleDateString('fr-FR')
      : 'indéterminée';
    const label = contratEnConflit.designation ?? `Contrat du ${debut}`;

    return `Ce bien est déjà loué du ${debut} au ${fin} (${label}).`;
  }, [isLocation, form.bien_id, form.date_debut, form.date_fin, contratsExistants]);

  // Validation du champ Partie B pour le bouton submit
  const partieB_valide = useMemo(() => {
    if (modePB === 'client_existant') return !!clientId;
    if (modePB === 'prospect')        return !!prospectId;
    if (modePB === 'nouveau_client')  return !!(ncForm.nom && ncForm.prenom);
    return false;
  }, [modePB, clientId, prospectId, ncForm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setGlobalError('');
    setLoading(true);

    // Construction du payload selon le mode
    let partieB: Record<string, unknown> = {};
    if (modePB === 'client_existant') {
      partieB = { client_ids: [Number(clientId)] };
    } else if (modePB === 'prospect') {
      partieB = { prospect_id: Number(prospectId) };
    } else {
      partieB = {
        nouveau_client: {
          civilite:       ncForm.civilite || undefined,
          nom:            ncForm.nom,
          prenom:         ncForm.prenom,
          email:          ncForm.email || undefined,
          telephone:      ncForm.telephone || undefined,
          adresse:        ncForm.adresse || undefined,
          ville:          ncForm.ville || undefined,
          cin:            ncForm.cin || undefined,
          date_naissance: ncForm.date_naissance || undefined,
        },
      };
    }

    try {
      await api.post('/org/contrats', {
        ...partieB,
        type:                 form.type,
        designation:          form.designation || undefined,
        utilisation:          form.utilisation || undefined,
        forme_juridique:      form.forme_juridique || undefined,
        representant:         form.representant || undefined,
        bien_id:              Number(form.bien_id),
        cin_delivree_le:      form.cin_delivree_le || undefined,
        date_contrat:         form.date_contrat || undefined,
        date_debut:           form.date_debut,
        date_fin:             nature === 'location' ? (form.date_fin || undefined) : undefined,
        montant_ht:           Number(form.montant_ht),
        tva:                  form.tva ? Number(form.tva) : 0,
        montant_ttc:          montantTtc ? Number(montantTtc) : undefined,
        frais_syndic:         nature === 'location' && form.frais_syndic ? Number(form.frais_syndic) : undefined,
        retenue_source:       form.retenue_source ? Number(form.retenue_source) : undefined,
        periodicite_paiement: nature === 'location' ? (form.periodicite_paiement || undefined) : undefined,
        jour_paiement:        nature === 'location' && form.jour_paiement ? Number(form.jour_paiement) : undefined,
        depot_garantie:       form.depot_garantie ? Number(form.depot_garantie) : undefined,
        premiere_echeance:    nature === 'location' ? (premiereEcheance || undefined) : undefined,
        assurance:            form.assurance || undefined,
        ville_signature:      form.ville_signature || undefined,
        notes:                form.notes || undefined,
      });
      router.push(orgPath('/dashboard/contrats'));
    } catch (err) {
      const axiosError = err as AxiosError<{ errors?: Record<string, string[]>; message?: string }>;
      const ve = axiosError.response?.data?.errors;
      if (ve) setErrors(ve);
      else setGlobalError(axiosError.response?.data?.message ?? 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  const errMsg = (field: string) => errors[field] ? (
    <p className="text-red-500 text-xs mt-1">{errors[field][0]}</p>
  ) : null;

  const ic = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
  const dc = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500';
  const lc = 'block text-xs font-medium text-gray-500 mb-1';

  // ─── Tabs Partie B ──────────────────────────────────────────────────────────
  const tabClass = (mode: ModePB) =>
    `px-4 py-2 text-xs font-medium rounded-lg transition-colors ${
      modePB === mode
        ? 'bg-green-600 text-white'
        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
    }`;

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link href="/dashboard/contrats" className="text-sm text-gray-400 hover:text-gray-600">← Retour</Link>
        <h1 className="text-2xl font-bold text-gray-800 mt-2">Nouveau contrat</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">

          {/* ── Colonne gauche : formulaire ── */}
          <div className="space-y-4">
            {globalError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{globalError}</div>
            )}

            {/* ── Nature + Type & Désignation ── */}
            <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
              <h2 className="text-sm font-semibold text-gray-700">Type de contrat</h2>

              {/* Toggle Location / Vente */}
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => handleNatureChange('location')}
                  className={`py-2.5 rounded-lg text-sm font-medium border transition ${
                    nature === 'location'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}>
                  Location
                </button>
                <button type="button" onClick={() => handleNatureChange('vente')}
                  className={`py-2.5 rounded-lg text-sm font-medium border transition ${
                    nature === 'vente'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}>
                  Vente
                </button>
              </div>

              {/* Type + Utilisation — location uniquement */}
              {nature === 'location' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={lc}>Type *</label>
                    <select value={form.type} onChange={set('type')} className={ic}>
                      {TYPES_LOCATION_OPTS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                    {errMsg('type')}
                  </div>
                  <div>
                    <label className={lc}>Utilisation</label>
                    <select value={form.utilisation} onChange={set('utilisation')} className={ic}>
                      <option value="">— Non précisée —</option>
                      {UTILISATIONS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className={lc}>Désignation du contrat</label>
                <input type="text" value={form.designation} onChange={set('designation')}
                  placeholder={nature === 'vente' ? 'Ex : Vente appartement F3 — Ref 2026-001' : 'Ex : Bail appartement F3 — Ref 2026-001'}
                  className={ic} />
              </div>
            </div>

            {/* ── Partie A ── */}
            <div className="bg-white rounded-xl shadow-sm p-5 space-y-3">
              <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <span className="w-5 h-5 bg-blue-100 text-blue-700 rounded-full text-xs flex items-center justify-center font-bold">A</span>
                Partie A — Organisation
              </h2>
              <div>
                <label className={lc}>Nom</label>
                <input type="text" value={organisation?.nom ?? ''} disabled className={dc} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lc}>Forme juridique</label>
                  <select value={form.forme_juridique} onChange={set('forme_juridique')} className={ic}>
                    <option value="">— Sélectionner —</option>
                    {['SARL', 'SUARL', 'SA', 'Association', 'Personne physique', 'Autre'].map(f => (
                      <option key={f}>{f}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={lc}>Adresse siège</label>
                  <input type="text"
                    value={[organisation?.adresse, organisation?.ville].filter(Boolean).join(', ')}
                    disabled className={dc} />
                </div>
              </div>
              <div>
                <label className={lc}>Représentant légal</label>
                <input type="text" value={form.representant} onChange={set('representant')}
                  placeholder="M. Ahmed Ben Ali" className={ic} />
              </div>
            </div>

            {/* ── Partie B — 3 tabs ── */}
            <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
              <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <span className="w-5 h-5 bg-green-100 text-green-700 rounded-full text-xs flex items-center justify-center font-bold">B</span>
                Partie B — Client
              </h2>

              {/* Tabs */}
              <div className="flex gap-2 flex-wrap">
                <button type="button" className={tabClass('client_existant')}
                  onClick={() => { setModePB('client_existant'); setClientId(''); setProspectId(''); }}>
                  Client existant
                </button>
                <button type="button" className={tabClass('prospect')}
                  onClick={() => { setModePB('prospect'); setClientId(''); setProspectId(''); }}>
                  Convertir un prospect
                </button>
                <button type="button" className={tabClass('nouveau_client')}
                  onClick={() => { setModePB('nouveau_client'); setClientId(''); setProspectId(''); setNcForm(defaultNouveauClient()); }}>
                  + Nouveau client
                </button>
              </div>

              {/* Cas 1 — Client existant */}
              {modePB === 'client_existant' && (
                <div className="space-y-3">
                  <div>
                    <label className={lc}>Sélectionner un client *</label>
                    <select value={clientId} onChange={e => {
                      setClientId(e.target.value);
                      const cl = clients.find(c => c.id === Number(e.target.value));
                      setForm(prev => ({ ...prev, cin_delivree_le: cl?.cin_delivree_le ?? '' }));
                    }} className={ic}>
                      <option value="">— Sélectionner —</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>{c.nom_complet}</option>
                      ))}
                    </select>
                    {errMsg('client_ids')}
                  </div>
                  {selectedClient && (
                    <div className="grid grid-cols-2 gap-3 bg-green-50 rounded-lg p-3">
                      <div>
                        <label className={lc}>Date de naissance</label>
                        <input type="text" value={selectedClient.date_naissance ? fmtDate(selectedClient.date_naissance) : '—'} disabled className={dc} />
                      </div>
                      <div>
                        <label className={lc}>N° CIN / Passeport</label>
                        <input type="text" value={selectedClient.cin ?? '—'} disabled className={dc} />
                      </div>
                      <div>
                        <label className={lc}>CIN délivrée le</label>
                        <input type="date" value={form.cin_delivree_le} onChange={set('cin_delivree_le')} className={ic} />
                      </div>
                      <div>
                        <label className={lc}>Résidence</label>
                        <input type="text"
                          value={[selectedClient.adresse, selectedClient.ville].filter(Boolean).join(', ') || '—'}
                          disabled className={dc} />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Cas 2 — Convertir un prospect */}
              {modePB === 'prospect' && (
                <div className="space-y-3">
                  <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
                    Le prospect sélectionné sera converti en client lors de la création du contrat. Il restera visible dans la liste des prospects avec le statut <strong>Converti</strong>.
                  </p>
                  <div>
                    <label className={lc}>Sélectionner un prospect *</label>
                    <select value={prospectId} onChange={e => {
                      setProspectId(e.target.value);
                      const pr = prospects.find(p => p.id === Number(e.target.value));
                      setForm(prev => ({ ...prev, cin_delivree_le: pr?.cin_delivree_le ?? '' }));
                    }} className={ic}>
                      <option value="">— Sélectionner —</option>
                      {prospects.map(p => (
                        <option key={p.id} value={p.id}>{p.nom_complet}</option>
                      ))}
                    </select>
                    {errMsg('prospect_id')}
                  </div>
                  {selectedProspect && (
                    <div className="grid grid-cols-2 gap-3 bg-amber-50 rounded-lg p-3">
                      <div>
                        <label className={lc}>Email</label>
                        <input type="text" value={selectedProspect.email ?? '—'} disabled className={dc} />
                      </div>
                      <div>
                        <label className={lc}>Téléphone</label>
                        <input type="text" value={selectedProspect.telephone ?? '—'} disabled className={dc} />
                      </div>
                      <div>
                        <label className={lc}>CIN</label>
                        <input type="text" value={selectedProspect.cin ?? '—'} disabled className={dc} />
                      </div>
                      <div>
                        <label className={lc}>Ville</label>
                        <input type="text" value={selectedProspect.ville ?? '—'} disabled className={dc} />
                      </div>
                      <div>
                        <label className={lc}>CIN délivrée le</label>
                        <input type="date" value={form.cin_delivree_le} onChange={set('cin_delivree_le')} className={ic} />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Cas 3 — Nouveau client */}
              {modePB === 'nouveau_client' && (
                <div className="space-y-3">
                  <p className="text-xs text-blue-700 bg-blue-50 rounded-lg px-3 py-2">
                    Ce client sera créé et directement lié au contrat.
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className={lc}>Civilité</label>
                      <select value={ncForm.civilite} onChange={setNc('civilite')} className={ic}>
                        <option value="">—</option>
                        <option value="M.">M.</option>
                        <option value="Mme">Mme</option>
                        <option value="Mlle">Mlle</option>
                      </select>
                    </div>
                    <div>
                      <label className={lc}>Nom *</label>
                      <input type="text" value={ncForm.nom} onChange={setNc('nom')} placeholder="Ben Ali" className={ic} />
                      {errMsg('nouveau_client.nom')}
                    </div>
                    <div>
                      <label className={lc}>Prénom *</label>
                      <input type="text" value={ncForm.prenom} onChange={setNc('prenom')} placeholder="Ahmed" className={ic} />
                      {errMsg('nouveau_client.prenom')}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={lc}>Email</label>
                      <input type="email" value={ncForm.email} onChange={setNc('email')} placeholder="ahmed@email.com" className={ic} />
                    </div>
                    <div>
                      <label className={lc}>Téléphone</label>
                      <input type="text" value={ncForm.telephone} onChange={setNc('telephone')} placeholder="+216 xx xxx xxx" className={ic} />
                    </div>
                    <div>
                      <label className={lc}>CIN</label>
                      <input type="text" value={ncForm.cin} onChange={setNc('cin')} placeholder="00000000" className={ic} />
                    </div>
                    <div>
                      <label className={lc}>Date de naissance</label>
                      <input type="date" value={ncForm.date_naissance} onChange={setNc('date_naissance')} className={ic} />
                    </div>
                    <div>
                      <label className={lc}>Adresse</label>
                      <input type="text" value={ncForm.adresse} onChange={setNc('adresse')} className={ic} />
                    </div>
                    <div>
                      <label className={lc}>Ville</label>
                      <input type="text" value={ncForm.ville} onChange={setNc('ville')} className={ic} />
                    </div>
                  </div>
                  <div>
                    <label className={lc}>CIN délivrée le</label>
                    <input type="date" value={form.cin_delivree_le} onChange={set('cin_delivree_le')} className={ic} />
                  </div>
                </div>
              )}
            </div>

            {/* ── Bien ── */}
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Le Bien *</h2>
              <select value={form.bien_id} onChange={set('bien_id')} className={ic}>
                <option value="">— Sélectionner un bien —</option>
                {biens.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.designation} — {b.type_bien}{b.ville ? ` (${b.ville})` : ''}
                  </option>
                ))}
              </select>
              {errMsg('bien_id')}
            </div>

            {/* ── Durée ── */}
            <div className="bg-white rounded-xl shadow-sm p-5 space-y-3">
              <h2 className="text-sm font-semibold text-gray-700">Durée du contrat</h2>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lc}>Date du contrat *</label>
                  <input type="date" value={form.date_contrat} onChange={set('date_contrat')} className={ic} />
                </div>
                <div>
                  <label className={lc}>Prise d'effet *</label>
                  <input type="date" value={form.date_debut} onChange={set('date_debut')} className={ic} />
                  {errMsg('date_debut')}
                </div>
                {isLocation && (
                  <div>
                    <label className={lc}>Date de fin *</label>
                    <input type="date" value={form.date_fin} onChange={set('date_fin')}
                      min={form.date_debut || undefined} className={ic} />
                    {errMsg('date_fin')}
                  </div>
                )}
                {duree && (
                  <div>
                    <label className={lc}>Durée (calculée)</label>
                    <input type="text" value={duree} disabled className={dc} />
                  </div>
                )}
              </div>

              {/* Avertissement vente en doublon */}
              {conflitVente && (
                <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-300 rounded-lg text-sm text-red-800">
                  <svg className="w-5 h-5 text-red-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  </svg>
                  <div>
                    <p className="font-semibold">Vente impossible</p>
                    <p className="text-xs mt-0.5 text-red-700">{conflitVente}</p>
                  </div>
                </div>
              )}

              {/* Avertissement chevauchement */}
              {conflitLocation && (
                <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-300 rounded-lg text-sm text-amber-800">
                  <svg className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  </svg>
                  <div>
                    <p className="font-semibold">Période indisponible</p>
                    <p className="text-xs mt-0.5 text-amber-700">{conflitLocation}</p>
                  </div>
                </div>
              )}
            </div>

            {/* ── Conditions financières ── */}
            <div className="bg-white rounded-xl shadow-sm p-5 space-y-3">
              <h2 className="text-sm font-semibold text-gray-700">Conditions financières</h2>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={lc}>Montant HT (TND) *</label>
                  <input type="number" step="0.001" value={form.montant_ht} onChange={set('montant_ht')}
                    placeholder="1500.000" className={ic} />
                  {errMsg('montant_ht')}
                </div>
                <div>
                  <label className={lc}>TVA (%)</label>
                  <input type="number" step="0.1" value={form.tva} onChange={set('tva')}
                    placeholder="19" className={ic} />
                </div>
                <div>
                  <label className={lc}>Montant TTC (calculé)</label>
                  <input type="text" value={montantTtc ? `${Number(montantTtc).toLocaleString('fr-TN', {minimumFractionDigits: 3})} TND` : ''} disabled className={dc} />
                </div>
              </div>

              {/* Frais syndic + Retenue — location uniquement pour syndic */}
              <div className="grid grid-cols-2 gap-3">
                {nature === 'location' && (
                  <div>
                    <label className={lc}>Frais de syndic (TND)</label>
                    <input type="number" step="0.001" value={form.frais_syndic} onChange={set('frais_syndic')}
                      placeholder="50.000" className={ic} />
                  </div>
                )}
                <div>
                  <label className={lc}>Retenue à la source (%)</label>
                  <input type="number" step="0.1" value={form.retenue_source} onChange={set('retenue_source')}
                    placeholder="5" className={ic} />
                </div>
              </div>

              {/* Périodicité + Jour de paiement — location uniquement */}
              {nature === 'location' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={lc}>Périodicité</label>
                    <select value={form.periodicite_paiement} onChange={set('periodicite_paiement')} className={ic}>
                      <option value="">— Non précisée —</option>
                      {PERIODICITES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={lc}>Jour de paiement (1–28)</label>
                    <input type="number" min="1" max="28" value={form.jour_paiement} onChange={set('jour_paiement')}
                      placeholder="1" className={ic} />
                  </div>
                </div>
              )}

              {/* Dépôt de garantie / Acompte + 1ère échéance */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lc}>{nature === 'vente' ? 'Acompte (TND)' : 'Dépôt de garantie (TND)'}</label>
                  <input type="number" step="0.001" value={form.depot_garantie} onChange={set('depot_garantie')}
                    placeholder="3000.000" className={ic} />
                </div>
                {nature === 'location' && (
                  <div>
                    <label className={lc}>1ère échéance{form.periodicite_paiement && form.date_debut ? ' (auto-calculée)' : ''}</label>
                    <input type="date" value={premiereEcheance}
                      onChange={e => setForm(p => ({ ...p, premiere_echeance: e.target.value }))}
                      className={ic} />
                  </div>
                )}
              </div>
            </div>

            {/* ── Assurance & Notes ── */}
            <div className="bg-white rounded-xl shadow-sm p-5 space-y-3">
              <h2 className="text-sm font-semibold text-gray-700">Assurance & Notes</h2>
              <div>
                <label className={lc}>Assurance</label>
                <textarea value={form.assurance} onChange={set('assurance')} rows={2}
                  placeholder="Références de l'assurance, compagnie, numéro de police…" className={ic} />
              </div>
              <div>
                <label className={lc}>Notes internes</label>
                <textarea value={form.notes} onChange={set('notes')} rows={2} className={ic} />
              </div>
            </div>

            {/* ── Signature ── */}
            <div className="bg-white rounded-xl shadow-sm p-5 space-y-3">
              <h2 className="text-sm font-semibold text-gray-700">Lieu de signature</h2>
              <div>
                <label className={lc}>Ville</label>
                <input type="text" value={form.ville_signature} onChange={set('ville_signature')}
                  placeholder="Tunis" className={ic} />
              </div>
            </div>

            {/* ── Actions ── */}
            <div className="flex gap-3 pb-6">
              <button type="submit"
                disabled={loading || !partieB_valide || !form.bien_id || !form.date_debut || !form.montant_ht || !!conflitLocation || !!conflitVente}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition">
                {loading ? 'Enregistrement…' : 'Créer le contrat'}
              </button>
              <Link href="/dashboard/contrats"
                className="px-6 py-2.5 border border-gray-300 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition">
                Annuler
              </Link>
            </div>
          </div>

          {/* ── Colonne droite : aperçu ── */}
          <div className="xl:sticky xl:top-6 space-y-3">

            {/* Toggle AR / FR */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">Aperçu du contrat</span>
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => setLang('fr')}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                    lang === 'fr'
                      ? 'bg-white shadow text-blue-700'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  FR — Français
                </button>
                <button
                  type="button"
                  onClick={() => setLang('ar')}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                    lang === 'ar'
                      ? 'bg-white shadow text-blue-700'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                  style={{ fontFamily: 'Tahoma, Arial, sans-serif' }}
                >
                  AR — عربي
                </button>
              </div>
            </div>

            {/* Aperçu A4 */}
            <div className="border border-gray-200 rounded-xl shadow-sm overflow-auto bg-white max-h-[85vh]">
              <ContratPreview
                lang={lang}
                data={{
                  type:                form.type,
                  isLocation:          nature === 'location',
                  designation:         form.designation,
                  utilisation:         form.utilisation,
                  notes:               form.notes,
                  orgNom:              organisation?.nom ?? '',
                  orgAdresse:          [organisation?.adresse, organisation?.ville].filter(Boolean).join(', '),
                  orgFormeJuridique:   form.forme_juridique,
                  orgRepresentant:     form.representant,
                  clientNom:           clientPreview?.nom_complet ?? '',
                  clientCivilite:      clientPreview?.civilite ?? '',
                  clientDateNaissance: clientPreview?.date_naissance ?? '',
                  clientCin:           clientPreview?.cin ?? '',
                  clientTypePiece:     'CIN',
                  clientCinDelivreeLe: form.cin_delivree_le,
                  clientAdresse:       [clientPreview?.adresse, clientPreview?.ville].filter(Boolean).join(', '),
                  bienDesignation:     selectedBien?.designation ?? '',
                  bienType:            selectedBien?.type_bien ?? '',
                  bienAdresse:         [selectedBien?.adresse, selectedBien?.ville].filter(Boolean).join(', '),
                  bienSuperficie:      selectedBien?.superficie != null ? String(selectedBien.superficie) : '',
                  dateContrat:         form.date_contrat,
                  dateDebut:           form.date_debut,
                  dateFin:             form.date_fin,
                  duree,
                  montantHt:           form.montant_ht,
                  tva:                 form.tva,
                  montantTtc,
                  periodicite:         form.periodicite_paiement,
                  jourPaiement:        form.jour_paiement,
                  depotGarantie:       form.depot_garantie,
                  premiereEcheance,
                  assurance:           form.assurance,
                  villeSignature:      form.ville_signature,
                } satisfies ContratPreviewData}
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
