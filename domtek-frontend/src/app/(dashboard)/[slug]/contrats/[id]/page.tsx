'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from '@/components/OrgLink';
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore';
import { Bien, Client, Contrat } from '@/types';
import { AxiosError } from 'axios';
import { ContratPreview, printContrat, type ContratPreviewData } from '@/components/ContratPreview';
import { isPositiveAmount } from '@/lib/validation';

// ─── Constantes (identiques à nouveau/page.tsx) ───────────────────────────────

const TYPES_CONTRAT = [
  { value: 'bail_habitation',    label: "Bail d'habitation" },
  { value: 'bail_etudiant',      label: 'Bail étudiant' },
  { value: 'bail_professionnel', label: 'Bail professionnel' },
  { value: 'bail_commercial',    label: 'Bail commercial' },
  { value: 'bail_saisonnier',    label: 'Bail saisonnier' },
  { value: 'loyer',              label: 'Location (général)' },
  { value: 'vente',              label: 'Vente' },
  { value: 'autre',              label: 'Autre' },
];

const TYPES_LOCATION = ['bail_habitation','bail_etudiant','bail_professionnel','bail_commercial','bail_saisonnier','loyer'];

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

function calcDuree(debut: string, fin: string): string {
  if (!debut || !fin) return '';
  const d1 = new Date(debut), d2 = new Date(fin);
  const months = (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth());
  if (months <= 0) return '';
  if (months < 12) return `${months} mois`;
  const years = Math.floor(months / 12), rem = months % 12;
  return rem > 0 ? `${years} an(s) et ${rem} mois` : `${years} an(s)`;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const Field = ({ label, value }: { label: string; value?: string | null }) => (
  <div>
    <p className="text-xs text-gray-400 mb-0.5">{label}</p>
    <p className="text-sm text-gray-800 font-medium">{value || '—'}</p>
  </div>
);

const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';


const AUJOURD_HUI = new Date().toISOString().slice(0, 10);
export default function EditContratPage() {
  const { id }   = useParams<{ id: string }>();
  const fileRef  = useRef<HTMLInputElement>(null);
  const { organisation } = useAuthStore();

  const [editing, setEditing] = useState(false);
  const [contrat, setContrat] = useState<Contrat | null>(null);
  const [biens, setBiens]     = useState<Bien[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors]   = useState<Record<string, string[]>>({});
  const [globalError, setGlobalError] = useState('');
  const [lang, setLang]       = useState<'fr' | 'ar'>('fr');

  const [form, setForm] = useState({
    type:                 'bail_habitation',
    designation:          '',
    utilisation:          '',
    forme_juridique:      '',
    representant:         '',
    bien_id:              '',
    client_id:            '',
    cin_delivree_le:      '',
    date_contrat:         '',
    date_debut:           '',
    date_fin:             '',
    montant_ht:           '',
    tva:                  '19',
    frais_syndic:         '',
    retenue_source:       '',
    periodicite_paiement: '',
    jour_paiement:        '',
    depot_garantie:       '',
    premiere_echeance:    '',
    assurance:            '',
    ville_signature:      '',
    notes:                '',
    statut:               'actif',
  });

  const fetchAll = () => {
    setLoading(true);
    Promise.all([
      api.get<{ data: Contrat }>(`/org/contrats/${id}`),
      api.get('/org/biens?per_page=200'),
      api.get('/org/clients?per_page=200'),
    ]).then(([c, b, cl]) => {
      const ct = c.data.data;
      setContrat(ct);
      setForm({
        type:                 ct.type,
        designation:          ct.designation ?? '',
        utilisation:          ct.utilisation ?? '',
        forme_juridique:      ct.forme_juridique ?? '',
        representant:         ct.representant ?? '',
        bien_id:              String(ct.bien?.id ?? ''),
        client_id:            String(ct.clients?.[0]?.id ?? ''),
        cin_delivree_le:      ct.cin_delivree_le ?? '',
        date_contrat:         ct.date_contrat ?? '',
        date_debut:           ct.date_debut,
        date_fin:             ct.date_fin ?? '',
        montant_ht:           String(ct.montant_ht),
        tva:                  String(ct.tva ?? 19),
        frais_syndic:         ct.frais_syndic != null ? String(ct.frais_syndic) : '',
        retenue_source:       ct.retenue_source != null ? String(ct.retenue_source) : '',
        periodicite_paiement: ct.periodicite_paiement ?? '',
        jour_paiement:        ct.jour_paiement != null ? String(ct.jour_paiement) : '',
        depot_garantie:       ct.depot_garantie != null ? String(ct.depot_garantie) : '',
        premiere_echeance:    ct.premiere_echeance ?? '',
        assurance:            ct.assurance ?? '',
        ville_signature:      ct.ville_signature ?? '',
        notes:                ct.notes ?? '',
        statut:               ct.statut,
      });
      setBiens(b.data.data ?? []);
      setClients(cl.data.data ?? []);
    }).catch(() => {})
    .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm(p => ({ ...p, [field]: e.target.value }));

  const selectedClient = clients.find(c => c.id === Number(form.client_id)) ?? null;
  const isLocation     = TYPES_LOCATION.includes(form.type);

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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setGlobalError('');
    if (!isPositiveAmount(form.montant_ht)) {
      setGlobalError('Le montant HT doit être un nombre positif.');
      return;
    }
    if (form.tva !== '' && (Number(form.tva) < 0 || Number(form.tva) > 100)) {
      setGlobalError('La TVA doit être comprise entre 0 et 100.');
      return;
    }
    if (form.retenue_source !== '' && (Number(form.retenue_source) < 0 || Number(form.retenue_source) > 100)) {
      setGlobalError('La retenue à la source doit être comprise entre 0 et 100.');
      return;
    }
    setSaving(true);
    try {
      await api.put(`/org/contrats/${id}`, {
        type:                 form.type,
        statut:               form.statut,
        designation:          form.designation || undefined,
        utilisation:          form.utilisation || undefined,
        forme_juridique:      form.forme_juridique || undefined,
        representant:         form.representant || undefined,
        bien_id:              Number(form.bien_id),
        client_ids:           form.client_id ? [Number(form.client_id)] : undefined,
        cin_delivree_le:      form.cin_delivree_le || undefined,
        date_contrat:         form.date_contrat || undefined,
        date_debut:           form.date_debut,
        date_fin:             isLocation ? (form.date_fin || undefined) : undefined,
        montant_ht:           Number(form.montant_ht),
        tva:                  form.tva ? Number(form.tva) : 0,
        montant_ttc:          montantTtc ? Number(montantTtc) : undefined,
        frais_syndic:         form.frais_syndic ? Number(form.frais_syndic) : undefined,
        retenue_source:       form.retenue_source ? Number(form.retenue_source) : undefined,
        periodicite_paiement: form.periodicite_paiement || undefined,
        jour_paiement:        form.jour_paiement ? Number(form.jour_paiement) : undefined,
        depot_garantie:       form.depot_garantie ? Number(form.depot_garantie) : undefined,
        premiere_echeance:    premiereEcheance || undefined,
        assurance:            form.assurance || undefined,
        ville_signature:      form.ville_signature || undefined,
        notes:                form.notes || undefined,
      });
      setEditing(false);
      fetchAll();
    } catch (err) {
      const axiosError = err as AxiosError<{ errors?: Record<string, string[]>; message?: string }>;
      const ve = axiosError.response?.data?.errors;
      if (ve) setErrors(ve);
      else setGlobalError(axiosError.response?.data?.message ?? 'Une erreur est survenue.');
    } finally {
      setSaving(false);
    }
  };

  const handleUploadFichier = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('fichier', file);
    try {
      await api.post(`/org/contrats/${id}/fichier`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      fetchAll();
    } catch { /* noop */ }
    finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const errMsg = (field: string) => errors[field] ? (
    <p className="text-red-500 text-xs mt-1">{errors[field][0]}</p>
  ) : null;

  const ic = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500';
  const dc = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500';
  const lc = 'block text-xs font-medium text-gray-500 mb-1';

  if (loading) return <div className="p-8 animate-pulse h-40 bg-gray-100 rounded-xl" />;

  /* ── Vue fiche (lecture seule) ── */
  if (!editing) {
    const typeLabel  = TYPES_CONTRAT.find(t => t.value === form.type)?.label ?? form.type;
    const selectedBienShow = biens.find(b => b.id === Number(form.bien_id)) ?? null;
    const previewDataShow: ContratPreviewData = {
      type: form.type, isLocation,
      designation: form.designation, utilisation: form.utilisation, notes: form.notes,
      orgNom: organisation?.nom ?? '',
      orgAdresse: [organisation?.adresse, organisation?.ville].filter(Boolean).join(', '),
      orgFormeJuridique: form.forme_juridique, orgRepresentant: form.representant,
      clientNom: selectedClient?.nom_complet ?? '', clientCivilite: selectedClient?.civilite ?? '',
      clientDateNaissance: selectedClient?.date_naissance ?? '', clientCin: selectedClient?.cin ?? '',
      clientTypePiece: selectedClient?.type_piece ?? 'CIN', clientCinDelivreeLe: form.cin_delivree_le,
      clientAdresse: [selectedClient?.adresse, selectedClient?.ville].filter(Boolean).join(', '),
      bienDesignation: selectedBienShow?.designation ?? '', bienType: selectedBienShow?.type_bien ?? '',
      bienAdresse: [selectedBienShow?.adresse, selectedBienShow?.ville].filter(Boolean).join(', '),
      bienSuperficie: selectedBienShow?.superficie != null ? String(selectedBienShow.superficie) : '',
      dateContrat: form.date_contrat, dateDebut: form.date_debut, dateFin: form.date_fin, duree,
      montantHt: form.montant_ht, tva: form.tva, montantTtc,
      periodicite: form.periodicite_paiement, jourPaiement: form.jour_paiement,
      depotGarantie: form.depot_garantie, premiereEcheance, assurance: form.assurance,
      villeSignature: form.ville_signature,
    };
    return (
      <div className="p-6">
        <div className="mb-6">
          <Link href="/dashboard/contrats" className="text-sm text-gray-400 hover:text-gray-600">← Retour</Link>
          <div className="flex items-center justify-between mt-2">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{contrat?.designation || typeLabel}</h1>
              <p className="text-sm text-gray-400 mt-0.5">{typeLabel}</p>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => printContrat('contrat-show-doc')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-900 text-white text-sm font-medium rounded-lg transition">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                PDF
              </button>
              <button onClick={() => setEditing(true)}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition">
                Modifier
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm p-5 space-y-3">
              <h2 className="text-sm font-semibold text-gray-700">Type de contrat</h2>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Type" value={typeLabel} />
                <Field label="Statut" value={form.statut === 'actif' ? 'Actif' : form.statut === 'termine' ? 'Terminé' : 'Résilié'} />
              </div>
              {form.designation && <Field label="Désignation" value={form.designation} />}
            </div>

            <div className="bg-white rounded-xl shadow-sm p-5 space-y-3">
              <h2 className="text-sm font-semibold text-gray-700">Parties</h2>
              <Field label="Organisation" value={organisation?.nom} />
              <Field label="Client" value={selectedClient?.nom_complet} />
              <Field label="Bien" value={selectedBienShow?.designation} />
            </div>

            <div className="bg-white rounded-xl shadow-sm p-5 space-y-3">
              <h2 className="text-sm font-semibold text-gray-700">Dates</h2>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Date du contrat" value={fmtDate(form.date_contrat)} />
                <Field label="Prise d'effet" value={fmtDate(form.date_debut)} />
                {isLocation && <Field label="Date de fin" value={fmtDate(form.date_fin)} />}
                {duree && <Field label="Durée" value={duree} />}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-5 space-y-3">
              <h2 className="text-sm font-semibold text-gray-700">Conditions financières</h2>
              <div className="grid grid-cols-3 gap-4">
                <Field label="Montant HT" value={form.montant_ht ? `${Number(form.montant_ht).toLocaleString('fr-TN', { minimumFractionDigits: 3 })} TND` : '—'} />
                <Field label="TVA" value={form.tva ? `${form.tva}%` : '0%'} />
                <Field label="Montant TTC" value={montantTtc ? `${Number(montantTtc).toLocaleString('fr-TN', { minimumFractionDigits: 3 })} TND` : '—'} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                {form.periodicite_paiement && <Field label="Périodicité" value={PERIODICITES.find(p => p.value === form.periodicite_paiement)?.label} />}
                {form.depot_garantie && <Field label="Dépôt de garantie" value={`${Number(form.depot_garantie).toLocaleString('fr-TN', { minimumFractionDigits: 3 })} TND`} />}
              </div>
            </div>
          </div>

          <div className="xl:sticky xl:top-6 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-sm font-semibold text-gray-700">Aperçu du contrat</span>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                  <button type="button" onClick={() => setLang('fr')}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${lang === 'fr' ? 'bg-white shadow text-blue-700' : 'text-gray-500 hover:text-gray-800'}`}>FR</button>
                  <button type="button" onClick={() => setLang('ar')}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${lang === 'ar' ? 'bg-white shadow text-blue-700' : 'text-gray-500 hover:text-gray-800'}`}
                    style={{ fontFamily: 'Tahoma, Arial, sans-serif' }}>AR — عربي</button>
                </div>
              </div>
            </div>
            <div id="contrat-show-doc" className="border border-gray-200 rounded-xl shadow-sm bg-white overflow-hidden">
              <ContratPreview lang={lang} data={previewDataShow} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Formulaire de modification ── */
  return (
    <div className="p-6">
      <div className="mb-6">
        <Link href="/dashboard/contrats" className="text-sm text-gray-400 hover:text-gray-600">← Retour</Link>
        <h1 className="text-2xl font-bold text-gray-800 mt-2">Modifier le contrat</h1>
        {contrat?.designation && (
          <p className="text-gray-400 text-sm mt-0.5">{contrat.designation}</p>
        )}
      </div>

      {globalError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{globalError}</div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
      <form onSubmit={handleSave} className="space-y-4">

        {/* ── Type & Statut & Désignation ── */}
        <div className="bg-white rounded-xl shadow-sm p-5 space-y-3">
          <h2 className="text-sm font-semibold text-gray-700">Type de contrat</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lc}>Type *</label>
              <select value={form.type} onChange={set('type')} className={ic}>
                {TYPES_CONTRAT.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              {errMsg('type')}
            </div>
            <div>
              <label className={lc}>Statut</label>
              <select value={form.statut} onChange={set('statut')} className={ic}>
                <option value="actif">Actif</option>
                <option value="termine">Terminé</option>
                <option value="resilie">Résilié</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lc}>Utilisation</label>
              <select value={form.utilisation} onChange={set('utilisation')} className={ic}>
                <option value="">— Non précisée —</option>
                {UTILISATIONS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
              </select>
            </div>
            <div>
              <label className={lc}>Désignation</label>
              <input type="text" value={form.designation} onChange={set('designation')}
                placeholder="Ex : Bail appartement F3" className={ic} />
            </div>
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

        {/* ── Partie B ── */}
        <div className="bg-white rounded-xl shadow-sm p-5 space-y-3">
          <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <span className="w-5 h-5 bg-green-100 text-green-700 rounded-full text-xs flex items-center justify-center font-bold">B</span>
            Partie B — Client
          </h2>
          <div>
            <label className={lc}>Client *</label>
            <select value={form.client_id} onChange={set('client_id')} className={ic}>
              <option value="">— Sélectionner un client —</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.nom_complet}</option>)}
            </select>
            {errMsg('client_ids')}
          </div>
          {selectedClient && (
            <div className="grid grid-cols-2 gap-3 bg-green-50 rounded-lg p-3">
              <div>
                <label className={lc}>Date de naissance</label>
                <input type="text"
                  value={selectedClient.date_naissance
                    ? new Date(selectedClient.date_naissance).toLocaleDateString('fr-FR')
                    : '—'}
                  disabled className={dc} />
              </div>
              <div>
                <label className={lc}>N° CIN / Passeport</label>
                <input type="text" value={selectedClient.cin ?? '—'} disabled className={dc} />
              </div>
              <div>
                <label className={lc}>CIN délivrée le</label>
                <input type="date" value={form.cin_delivree_le} onChange={set('cin_delivree_le')} className={ic} max={AUJOURD_HUI} />
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
              <label className={lc}>Date du contrat</label>
              <input type="date" value={form.date_contrat} onChange={set('date_contrat')} className={ic} />
            </div>
            <div>
              <label className={lc}>Prise d'effet *</label>
              <input type="date" value={form.date_debut} onChange={set('date_debut')} className={ic} />
              {errMsg('date_debut')}
            </div>
            {isLocation && (
              <div>
                <label className={lc}>Date de fin</label>
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
        </div>

        {/* ── Conditions financières ── */}
        <div className="bg-white rounded-xl shadow-sm p-5 space-y-3">
          <h2 className="text-sm font-semibold text-gray-700">Conditions financières</h2>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={lc}>Montant HT (TND) *</label>
              <input type="number" step="0.001" min="0" value={form.montant_ht} onChange={set('montant_ht')}
                placeholder="1500.000" className={ic} />
              {errMsg('montant_ht')}
            </div>
            <div>
              <label className={lc}>TVA (%)</label>
              <input type="number" step="0.1" min="0" max="100" value={form.tva} onChange={set('tva')}
                placeholder="19" className={ic} />
            </div>
            <div>
              <label className={lc}>Montant TTC (calculé)</label>
              <input type="text"
                value={montantTtc ? `${Number(montantTtc).toLocaleString('fr-TN', { minimumFractionDigits: 3 })} TND` : ''}
                disabled className={dc} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lc}>Frais de syndic (TND)</label>
              <input type="number" step="0.001" min="0" value={form.frais_syndic} onChange={set('frais_syndic')}
                placeholder="50.000" className={ic} />
            </div>
            <div>
              <label className={lc}>Retenue à la source (%)</label>
              <input type="number" step="0.1" min="0" max="100" value={form.retenue_source} onChange={set('retenue_source')}
                placeholder="5" className={ic} />
            </div>
          </div>
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lc}>Dépôt de garantie (TND)</label>
              <input type="number" step="0.001" min="0" value={form.depot_garantie} onChange={set('depot_garantie')}
                placeholder="3000.000" className={ic} />
            </div>
            <div>
              <label className={lc}>
                1ère échéance{form.periodicite_paiement && form.date_debut ? ' (auto-calculée)' : ''}
              </label>
              <input type="date" value={premiereEcheance}
                onChange={e => setForm(p => ({ ...p, premiere_echeance: e.target.value }))}
                className={ic} />
            </div>
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
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Lieu de signature</h2>
          <input type="text" value={form.ville_signature} onChange={set('ville_signature')}
            placeholder="Tunis" className={ic} />
        </div>

        {/* ── Fichier PDF ── */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Fichier contrat (PDF)</h2>
          {contrat?.fichier
            ? <p className="text-sm text-green-600 mb-3">✓ Fichier attaché</p>
            : <p className="text-sm text-gray-400 mb-3">Aucun fichier.</p>}
          <label className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg cursor-pointer transition inline-block">
            {uploading ? 'Upload…' : 'Remplacer le fichier'}
            <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={handleUploadFichier} />
          </label>
        </div>

        {/* ── Actions ── */}
        <div className="flex gap-3 pb-6">
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

      {/* ── Colonne droite : aperçu ── */}
      {(() => {
        const selectedBien = biens.find(b => b.id === Number(form.bien_id)) ?? null;
        const previewData: ContratPreviewData = {
          type:               form.type,
          isLocation,
          designation:        form.designation,
          utilisation:        form.utilisation,
          notes:              form.notes,
          orgNom:             organisation?.nom ?? '',
          orgAdresse:         [organisation?.adresse, organisation?.ville].filter(Boolean).join(', '),
          orgFormeJuridique:  form.forme_juridique,
          orgRepresentant:    form.representant,
          clientNom:          selectedClient?.nom_complet ?? '',
          clientCivilite:     selectedClient?.civilite ?? '',
          clientDateNaissance: selectedClient?.date_naissance ?? '',
          clientCin:          selectedClient?.cin ?? '',
          clientTypePiece:    selectedClient?.type_piece ?? 'CIN',
          clientCinDelivreeLe: form.cin_delivree_le,
          clientAdresse:      [selectedClient?.adresse, selectedClient?.ville].filter(Boolean).join(', '),
          bienDesignation:    selectedBien?.designation ?? '',
          bienType:           selectedBien?.type_bien ?? '',
          bienAdresse:        [selectedBien?.adresse, selectedBien?.ville].filter(Boolean).join(', '),
          bienSuperficie:     selectedBien?.superficie != null ? String(selectedBien.superficie) : '',
          dateContrat:        form.date_contrat,
          dateDebut:          form.date_debut,
          dateFin:            form.date_fin,
          duree,
          montantHt:          form.montant_ht,
          tva:                form.tva,
          montantTtc,
          periodicite:        form.periodicite_paiement,
          jourPaiement:       form.jour_paiement,
          depotGarantie:      form.depot_garantie,
          premiereEcheance,
          assurance:          form.assurance,
          villeSignature:     form.ville_signature,
        };

        return (
          <div className="xl:sticky xl:top-6 space-y-3">
            {/* Toggle AR / FR + Imprimer */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-sm font-semibold text-gray-700">Aperçu du contrat</span>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                  <button type="button"
                    onClick={() => setLang('fr')}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${lang === 'fr' ? 'bg-white shadow text-blue-700' : 'text-gray-500 hover:text-gray-800'}`}
                  >FR</button>
                  <button type="button"
                    onClick={() => setLang('ar')}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${lang === 'ar' ? 'bg-white shadow text-blue-700' : 'text-gray-500 hover:text-gray-800'}`}
                    style={{ fontFamily: 'Tahoma, Arial, sans-serif' }}
                  >AR — عربي</button>
                </div>
                <button type="button" onClick={() => printContrat('contrat-edit-doc')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-900 text-white text-sm font-medium rounded-lg transition">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Télécharger PDF
                </button>
              </div>
            </div>

            {/* Document A4 — auto-scalé */}
            <div id="contrat-edit-doc" className="border border-gray-200 rounded-xl shadow-sm bg-white overflow-hidden">
              <ContratPreview lang={lang} data={previewData} />
            </div>
          </div>
        );
      })()}
      </div>{/* fin grid */}
    </div>
  );
}
