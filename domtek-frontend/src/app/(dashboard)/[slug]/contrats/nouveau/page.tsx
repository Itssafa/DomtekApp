'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from '@/components/OrgLink';
import api from '@/lib/api';
import { orgPath } from '@/lib/org-path';
import { useAuthStore } from '@/store/authStore';
import { Bien, Client, Prospect } from '@/types';
import { AxiosError } from 'axios';
import { ContratPreview, type ContratPreviewData } from '@/components/ContratPreview';
import StepForm, { FormStep } from '@/components/StepForm';
import { isValidEmail, isValidPhone, isPositiveAmount, isValidCin, isValidCityOrPlace } from '@/lib/validation';

// ─── Constantes ───────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  bail_habitation:    'Bail d\'habitation',
  bail_etudiant:      'Bail étudiant',
  bail_professionnel: 'Bail professionnel',
  bail_commercial:    'Bail commercial',
  bail_saisonnier:    'Bail saisonnier',
  loyer:              'Loyer',
};

const PERIODICITE_LABELS: Record<string, string> = {
  mensuel: 'Mensuel', trimestriel: 'Trimestriel',
  semestriel: 'Semestriel', annuel: 'Annuel',
};

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

interface LocationOption {
  id: number;
  designation: string | null;
  type: string;
  locataire_nom: string;
  locataire_type: 'client' | 'prospect' | 'nouveau';
  locataire_id: number | null;
  bien: { id: number; designation: string; type_bien: string; ville: string | null; adresse: string | null; superficie: number | null } | null;
  date_debut: string;
  date_fin: string | null;
  premiere_echeance: string;
  montant_ht: number;
  tva: number;
  montant_ttc: number;
  frais_syndic: number;
  retenue_source: number;
  montant_paiement: number;
  periodicite: string;
  jour_paiement: number;
  depot_garantie: number;
  utilisation: string | null;
}

// ─── Formulaire par défaut ────────────────────────────────────────────────────

function defaultForm() {
  return {
    designation:          '',
    forme_juridique:      '',
    representant:         '',
    cin_delivree_le:      '',
    date_contrat:         new Date().toISOString().split('T')[0],
    ville_signature:      '',
    notes:                '',
    // Vente uniquement
    type:                 'vente',
    bien_id:              '',
    date_debut:           '',
    date_fin:             '',
    montant_ht:           '',
    tva:                  '19',
    frais_syndic:         '',
    retenue_source:       '',
    periodicite_paiement: '',
    jour_paiement:        '',
    depot_garantie:       '',
    assurance:            '',
  };
}

function defaultNouveauClient() {
  return { civilite: '', nom: '', prenom: '', email: '', telephone: '', adresse: '', ville: '', cin: '', date_naissance: '' };
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function NouveauContratPage() {
  const router = useRouter();
  const { organisation } = useAuthStore();

  const [nature, setNature]   = useState<'location' | 'vente'>('vente');
  const [lang,   setLang]     = useState<'fr' | 'ar'>('fr');

  // Données pour mode vente
  const [biens,     setBiens]     = useState<Bien[]>([]);
  const [clients,   setClients]   = useState<Client[]>([]);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [form, setForm]           = useState(defaultForm());
  const [modePB, setModePB]       = useState<ModePB>('client_existant');
  const [clientId,    setClientId]    = useState('');
  const [prospectId,  setProspectId]  = useState('');
  const [ncForm, setNcForm]       = useState(defaultNouveauClient());

  // Données pour mode location
  const [locations,           setLocations]           = useState<LocationOption[]>([]);
  const [selectedLocationId,  setSelectedLocationId]  = useState('');
  const [selectedLocation,    setSelectedLocation]    = useState<LocationOption | null>(null);

  const [contratsExistants, setContratsExistants] = useState<Array<{
    date_debut: string; date_fin: string | null; statut: string; type: string; designation: string | null;
  }>>([]);
  const [errors, setErrors]           = useState<Record<string, string[]>>({});
  const [globalError, setGlobalError] = useState('');
  const [loading, setLoading]         = useState(false);

  // ── Chargements initiaux ──────────────────────────────────────────────────
  useEffect(() => {
    Promise.allSettled([
      api.get('/org/biens?per_page=200'),
      api.get('/org/clients?per_page=200'),
      api.get('/org/prospects?per_page=200'),
      api.get('/org/locations?per_page=200&statut=actif'),
    ]).then(([b, c, p, l]) => {
      if (b.status === 'fulfilled') setBiens(b.value.data.data ?? []);
      if (c.status === 'fulfilled') setClients(c.value.data.data ?? []);
      if (p.status === 'fulfilled') setProspects(p.value.data.data ?? []);
      if (l.status === 'fulfilled') setLocations(l.value.data.data ?? []);
    });
  }, []);

  useEffect(() => {
    if (organisation?.ville && !form.ville_signature) {
      setForm(prev => ({ ...prev, ville_signature: organisation.ville ?? '' }));
    }
  }, [organisation]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!form.bien_id || nature !== 'vente') { setContratsExistants([]); return; }
    api.get(`/org/contrats?bien_id=${form.bien_id}&per_page=100`)
      .then(r => setContratsExistants(r.data.data ?? []))
      .catch(() => setContratsExistants([]));
  }, [form.bien_id, nature]);

  // ── Sélection d'une location ──────────────────────────────────────────────
  const handleSelectLocation = (id: string) => {
    setSelectedLocationId(id);
    const loc = locations.find(l => l.id === Number(id)) ?? null;
    setSelectedLocation(loc);

    if (!loc) return;

    if (loc.locataire_type === 'client' && loc.locataire_id) {
      setModePB('client_existant');
      setClientId(String(loc.locataire_id));
      setProspectId('');
      const cl = clients.find(c => c.id === loc.locataire_id);
      setForm(prev => ({ ...prev, cin_delivree_le: cl?.cin_delivree_le ?? '' }));
    } else if (loc.locataire_type === 'prospect' && loc.locataire_id) {
      setModePB('prospect');
      setProspectId(String(loc.locataire_id));
      setClientId('');
      const pr = prospects.find(p => p.id === loc.locataire_id);
      setForm(prev => ({ ...prev, cin_delivree_le: pr?.cin_delivree_le ?? '' }));
    } else {
      setModePB('nouveau_client');
      const parts = loc.locataire_nom.split(' ');
      setNcForm(prev => ({ ...prev, prenom: parts[0] ?? '', nom: parts.slice(1).join(' ') }));
      setClientId('');
      setProspectId('');
    }
  };

  const handleNatureChange = (n: 'location' | 'vente') => {
    setNature(n);
    setSelectedLocationId('');
    setSelectedLocation(null);
    setForm(prev => ({
      ...prev,
      type: n === 'vente' ? 'vente' : 'bail_habitation',
      bien_id: '', date_debut: '', date_fin: '',
      montant_ht: '', frais_syndic: '',
      periodicite_paiement: n === 'location' ? 'mensuel' : '',
      jour_paiement: '',
    }));
  };

  const set = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm(p => ({ ...p, [field]: e.target.value }));

  const setNc = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => setNcForm(p => ({ ...p, [field]: e.target.value }));

  const setNcDigitsOnly = (field: string, maxLength?: number) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => setNcForm(p => {
    let digits = e.target.value.replace(/\D/g, '');
    if (maxLength) digits = digits.slice(0, maxLength);
    return { ...p, [field]: digits };
  });

  // ── Dérivations ──────────────────────────────────────────────────────────
  const selectedBien    = biens.find(b => b.id === Number(form.bien_id)) ?? null;
  const selectedClient  = clients.find(c => c.id === Number(clientId)) ?? null;
  const selectedProspect = prospects.find(p => p.id === Number(prospectId)) ?? null;

  const clientPreview: ClientPreview | null = useMemo(() => {
    if (nature === 'location' && selectedLocation) {
      if (selectedLocation.locataire_type === 'client') {
        const cl = clients.find(c => c.id === selectedLocation.locataire_id);
        if (cl) return cl;
      }
      if (selectedLocation.locataire_type === 'prospect') {
        const pr = prospects.find(p => p.id === selectedLocation.locataire_id);
        if (pr) return pr as unknown as ClientPreview;
      }
      return { nom_complet: selectedLocation.locataire_nom };
    }
    if (modePB === 'client_existant' && selectedClient) return selectedClient;
    if (modePB === 'prospect' && selectedProspect) return selectedProspect as unknown as ClientPreview;
    if (modePB === 'nouveau_client' && (ncForm.nom || ncForm.prenom)) {
      return {
        civilite: ncForm.civilite || null,
        nom_complet: `${ncForm.civilite ? ncForm.civilite + ' ' : ''}${ncForm.prenom} ${ncForm.nom}`.trim(),
        date_naissance: ncForm.date_naissance || null,
        cin: ncForm.cin || null,
        adresse: ncForm.adresse || null,
        ville: ncForm.ville || null,
      };
    }
    return null;
  }, [nature, selectedLocation, modePB, selectedClient, selectedProspect, ncForm, clients, prospects]);

  const montantTtc = useMemo(() => {
    if (!form.montant_ht) return '';
    const ht = parseFloat(form.montant_ht);
    const tva = parseFloat(form.tva || '0');
    return isNaN(ht) ? '' : (ht * (1 + tva / 100)).toFixed(3);
  }, [form.montant_ht, form.tva]);

  const dureeVente = useMemo(() => calcDuree(form.date_debut, form.date_fin), [form.date_debut, form.date_fin]);

  const conflitVente = useMemo(() => {
    if (nature !== 'vente' || !form.bien_id) return null;
    const dejaVendu = contratsExistants.find(c => c.type === 'vente' && c.statut !== 'resilie');
    if (!dejaVendu) return null;
    const debut = new Date(dejaVendu.date_debut).toLocaleDateString('fr-FR');
    return `Ce bien a déjà été vendu (${dejaVendu.designation ?? 'Contrat du ' + debut}). Un bien ne peut faire l'objet que d'un seul contrat de vente.`;
  }, [nature, form.bien_id, contratsExistants]);

  const partieB_valide = useMemo(() => {
    if (nature === 'location') return !!selectedLocation;
    if (modePB === 'client_existant') return !!clientId;
    if (modePB === 'prospect')        return !!prospectId;
    if (modePB === 'nouveau_client')  return !!(ncForm.nom && ncForm.prenom);
    return false;
  }, [nature, selectedLocation, modePB, clientId, prospectId, ncForm]);

  // ── Soumission ──────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setGlobalError('');
    setLoading(true);

    try {
      let payload: Record<string, unknown> = {
        designation:     form.designation || undefined,
        forme_juridique: form.forme_juridique || undefined,
        representant:    form.representant || undefined,
        date_contrat:    form.date_contrat || undefined,
        ville_signature: form.ville_signature || undefined,
        notes:           form.notes || undefined,
        cin_delivree_le: form.cin_delivree_le || undefined,
      };

      if (nature === 'location' && selectedLocation) {
        const loc = selectedLocation;

        if (loc.locataire_type === 'client' && loc.locataire_id) {
          payload.client_ids = [loc.locataire_id];
        } else if (loc.locataire_type === 'prospect' && loc.locataire_id) {
          payload.prospect_id = loc.locataire_id;
        } else {
          const parts = loc.locataire_nom.split(' ');
          payload.nouveau_client = { prenom: parts[0] ?? loc.locataire_nom, nom: parts.slice(1).join(' ') || '-' };
        }

        payload = {
          ...payload,
          type:                 loc.type,
          bien_id:              loc.bien?.id,
          date_debut:           loc.date_debut,
          date_fin:             loc.date_fin || undefined,
          montant_ht:           loc.montant_ht,
          tva:                  loc.tva,
          montant_ttc:          loc.montant_ttc,
          frais_syndic:         loc.frais_syndic || undefined,
          retenue_source:       loc.retenue_source || undefined,
          periodicite_paiement: loc.periodicite,
          jour_paiement:        loc.jour_paiement,
          depot_garantie:       loc.depot_garantie || undefined,
          premiere_echeance:    loc.premiere_echeance,
          utilisation:          loc.utilisation || undefined,
        };
      } else {
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
        payload = {
          ...payload,
          ...partieB,
          type:        'vente',
          bien_id:     Number(form.bien_id),
          date_debut:  form.date_debut,
          montant_ht:  Number(form.montant_ht),
          tva:         form.tva ? Number(form.tva) : 0,
          montant_ttc: montantTtc ? Number(montantTtc) : undefined,
          depot_garantie: form.depot_garantie ? Number(form.depot_garantie) : undefined,
          assurance:   form.assurance || undefined,
        };
      }

      await api.post('/org/contrats', payload);
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

  const ic  = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500';
  const dc  = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500';
  const lc  = 'block text-xs font-medium text-gray-500 mb-1';
  const tabClass = (mode: ModePB) =>
    `px-4 py-2 text-xs font-medium rounded-lg transition-colors ${
      modePB === mode ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
    }`;

  // ── Nature toggle (commun aux deux modes) ────────────────────────────────
  const natureToggle = (
    <div className="grid grid-cols-2 gap-2">
      <button type="button" onClick={() => handleNatureChange('location')}
        className={`py-2.5 rounded-lg text-sm font-medium border transition ${
          nature === 'location' ? 'bg-violet-600 text-white border-violet-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'
        }`}>
        Location
      </button>
      <button type="button" onClick={() => handleNatureChange('vente')}
        className={`py-2.5 rounded-lg text-sm font-medium border transition ${
          nature === 'vente' ? 'bg-emerald-600 text-white border-emerald-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'
        }`}>
        Vente
      </button>
    </div>
  );

  // ── Aperçu du contrat ────────────────────────────────────────────────────
  const previewBien = nature === 'location' ? selectedLocation?.bien : selectedBien;
  const previewData: ContratPreviewData = {
    type:                nature === 'location' ? (selectedLocation?.type ?? 'bail_habitation') : 'vente',
    isLocation:          nature === 'location',
    designation:         form.designation,
    utilisation:         nature === 'location' ? (selectedLocation?.utilisation ?? '') : '',
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
    bienDesignation:     previewBien?.designation ?? '',
    bienType:            previewBien?.type_bien ?? '',
    bienAdresse:         [previewBien?.adresse, previewBien?.ville].filter(Boolean).join(', '),
    bienSuperficie:      previewBien?.superficie != null ? String(previewBien.superficie) : '',
    dateContrat:         form.date_contrat,
    dateDebut:           nature === 'location' ? (selectedLocation?.date_debut ?? '') : form.date_debut,
    dateFin:             nature === 'location' ? (selectedLocation?.date_fin ?? '') : '',
    duree:               nature === 'location'
      ? calcDuree(selectedLocation?.date_debut ?? '', selectedLocation?.date_fin ?? '')
      : dureeVente,
    montantHt:           nature === 'location' ? String(selectedLocation?.montant_ht ?? '') : form.montant_ht,
    tva:                 nature === 'location' ? String(selectedLocation?.tva ?? '') : form.tva,
    montantTtc:          nature === 'location' ? String(selectedLocation?.montant_ttc ?? '') : montantTtc,
    periodicite:         nature === 'location' ? (selectedLocation?.periodicite ?? '') : '',
    jourPaiement:        nature === 'location' ? String(selectedLocation?.jour_paiement ?? '') : '',
    depotGarantie:       nature === 'location' ? String(selectedLocation?.depot_garantie ?? '') : form.depot_garantie,
    premiereEcheance:    nature === 'location' ? (selectedLocation?.premiere_echeance ?? '') : '',
    assurance:           form.assurance,
    villeSignature:      form.ville_signature,
  };

  // ── Étapes selon le mode ─────────────────────────────────────────────────
  const steps: FormStep[] = nature === 'location' ? [
    {
      title: 'Type & Location',
      validate: () => {
        if (!selectedLocationId) return 'Veuillez sélectionner une location.';
        return null;
      },
      content: (
        <>
          {natureToggle}
          <div>
            <label className={lc}>Location *</label>
            <select value={selectedLocationId} onChange={e => handleSelectLocation(e.target.value)} className={ic}>
              <option value="">— Sélectionner une location —</option>
              {locations.map(l => (
                <option key={l.id} value={l.id}>
                  {l.designation ?? TYPE_LABELS[l.type] ?? l.type} — {l.locataire_nom}
                  {l.bien ? ` (${l.bien.designation})` : ''}
                </option>
              ))}
            </select>
            {locations.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">Aucune location active. <Link href="/dashboard/locations/nouvelle" className="underline">Créer une location</Link></p>
            )}
            {selectedLocation && (
              <div className="mt-3 bg-violet-50 border border-violet-100 rounded-xl p-4 text-xs space-y-2">
                <p className="font-semibold text-violet-800 text-sm">
                  {TYPE_LABELS[selectedLocation.type] ?? selectedLocation.type}
                </p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-gray-600">
                  <span><span className="font-medium text-gray-700">Bien :</span> {selectedLocation.bien?.designation ?? '—'}</span>
                  <span><span className="font-medium text-gray-700">Locataire :</span> {selectedLocation.locataire_nom}</span>
                  <span><span className="font-medium text-gray-700">Début :</span> {fmtDate(selectedLocation.date_debut)}</span>
                  <span><span className="font-medium text-gray-700">Fin :</span> {selectedLocation.date_fin ? fmtDate(selectedLocation.date_fin) : 'Ouvert'}</span>
                  <span><span className="font-medium text-gray-700">Montant :</span> {Number(selectedLocation.montant_paiement).toFixed(3)} DT / {PERIODICITE_LABELS[selectedLocation.periodicite] ?? selectedLocation.periodicite}</span>
                  <span><span className="font-medium text-gray-700">Dépôt :</span> {Number(selectedLocation.depot_garantie).toFixed(3)} DT</span>
                </div>
              </div>
            )}
          </div>
          <div>
            <label className={lc}>Désignation du contrat</label>
            <input type="text" value={form.designation} onChange={set('designation')}
              placeholder="Ex : Bail appartement F3 — Ref 2026-001" className={ic} />
          </div>
        </>
      ),
    },
    {
      title: 'Partie A — Organisation',
      content: (
        <>
          <div>
            <label className={lc}>Nom</label>
            <input type="text" value={organisation?.nom ?? ''} disabled className={dc} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lc}>Forme juridique</label>
              <select value={form.forme_juridique} onChange={set('forme_juridique')} className={ic}>
                <option value="">— Sélectionner —</option>
                {['SARL', 'SUARL', 'SA', 'Association', 'Personne physique', 'Autre'].map(f => <option key={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className={lc}>Adresse siège</label>
              <input type="text" value={[organisation?.adresse, organisation?.ville].filter(Boolean).join(', ')} disabled className={dc} />
            </div>
          </div>
          <div>
            <label className={lc}>Représentant légal</label>
            <input type="text" value={form.representant} onChange={set('representant')} placeholder="M. Ahmed Ben Ali" className={ic} />
          </div>
          {selectedLocation && (
            <div className="mt-2 space-y-3">
              <h3 className="text-xs font-semibold text-gray-600 flex items-center gap-2">
                <span className="w-5 h-5 bg-green-100 text-green-700 rounded-full text-xs flex items-center justify-center font-bold">B</span>
                Partie B — Locataire
              </h3>
              <div className="bg-green-50 rounded-lg p-3 space-y-2">
                <p className="text-sm font-medium text-green-800">{selectedLocation.locataire_nom}</p>
                {clientPreview && (
                  <div className="grid grid-cols-2 gap-3 text-xs text-gray-600">
                    {clientPreview.cin && <span><span className="font-medium">CIN :</span> {clientPreview.cin}</span>}
                    {form.cin_delivree_le && <span><span className="font-medium">Délivrée le :</span> {fmtDate(form.cin_delivree_le)}</span>}
                    {clientPreview.date_naissance && <span><span className="font-medium">Né(e) :</span> {fmtDate(clientPreview.date_naissance)}</span>}
                    {clientPreview.adresse && <span className="col-span-2"><span className="font-medium">Adresse :</span> {[clientPreview.adresse, clientPreview.ville].filter(Boolean).join(', ')}</span>}
                  </div>
                )}
                {!form.cin_delivree_le && (
                  <div>
                    <label className={lc + ' mt-1'}>CIN délivrée le <span className="text-gray-400 font-normal">(non renseigné dans le profil)</span></label>
                    <input type="date" value={form.cin_delivree_le} onChange={set('cin_delivree_le')} className={ic} />
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      ),
    },
    {
      title: 'Finalisation',
      content: (
        <>
          <div>
            <label className={lc}>Notes internes</label>
            <textarea value={form.notes} onChange={set('notes')} rows={3} className={ic} />
          </div>
          <div>
            <label className={lc}>Date du contrat</label>
            <input type="date" value={form.date_contrat} onChange={set('date_contrat')} className={ic} />
          </div>
          <div>
            <label className={lc}>Ville de signature</label>
            <input type="text" value={form.ville_signature} onChange={set('ville_signature')} placeholder="Tunis" className={ic} />
          </div>
          {globalError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{globalError}</div>
          )}
        </>
      ),
    },
  ] : [
    {
      title: 'Type & Bien',
      validate: () => {
        if (!form.bien_id) return 'Veuillez sélectionner un bien.';
        if (conflitVente) return conflitVente;
        return null;
      },
      content: (
        <>
          {natureToggle}
          <div>
            <label className={lc}>Bien *</label>
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
          {conflitVente && (
            <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-300 rounded-lg text-sm text-red-800">
              <svg className="w-5 h-5 text-red-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              <div><p className="font-semibold">Vente impossible</p><p className="text-xs mt-0.5 text-red-700">{conflitVente}</p></div>
            </div>
          )}
          <div>
            <label className={lc}>Désignation du contrat</label>
            <input type="text" value={form.designation} onChange={set('designation')}
              placeholder="Ex : Vente appartement F3 — Ref 2026-001" className={ic} />
          </div>
        </>
      ),
    },
    {
      title: 'Partie A — Organisation',
      content: (
        <>
          <div>
            <label className={lc}>Nom</label>
            <input type="text" value={organisation?.nom ?? ''} disabled className={dc} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lc}>Forme juridique</label>
              <select value={form.forme_juridique} onChange={set('forme_juridique')} className={ic}>
                <option value="">— Sélectionner —</option>
                {['SARL', 'SUARL', 'SA', 'Association', 'Personne physique', 'Autre'].map(f => <option key={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className={lc}>Adresse siège</label>
              <input type="text" value={[organisation?.adresse, organisation?.ville].filter(Boolean).join(', ')} disabled className={dc} />
            </div>
          </div>
          <div>
            <label className={lc}>Représentant légal</label>
            <input type="text" value={form.representant} onChange={set('representant')} placeholder="M. Ahmed Ben Ali" className={ic} />
          </div>
        </>
      ),
    },
    {
      title: 'Partie B — Client',
      validate: () => {
        if (!partieB_valide) return 'Veuillez renseigner les informations du client.';
        if (modePB === 'nouveau_client') {
          if (ncForm.email && !isValidEmail(ncForm.email)) return "L'email du client est invalide.";
          if (ncForm.telephone && !isValidPhone(ncForm.telephone)) return 'Le téléphone du client est invalide (format tunisien attendu).';
          if (ncForm.cin && !isValidCin(ncForm.cin)) return 'Le CIN du client doit contenir exactement 8 chiffres.';
          if (ncForm.ville && !isValidCityOrPlace(ncForm.ville)) return 'La ville du client est invalide.';
        }
        return null;
      },
      content: (
        <>
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
                  {clients.map(c => <option key={c.id} value={c.id}>{c.nom_complet}</option>)}
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
                    <label className={lc}>N° CIN</label>
                    <input type="text" value={selectedClient.cin ?? '—'} disabled className={dc} />
                  </div>
                  <div>
                    <label className={lc}>CIN délivrée le</label>
                    {selectedClient.cin_delivree_le
                      ? <input type="text" value={fmtDate(selectedClient.cin_delivree_le)} disabled className={dc} />
                      : <input type="date" value={form.cin_delivree_le} onChange={set('cin_delivree_le')} className={ic} placeholder="Non renseigné" />
                    }
                  </div>
                  <div>
                    <label className={lc}>Résidence</label>
                    <input type="text" value={[selectedClient.adresse, selectedClient.ville].filter(Boolean).join(', ') || '—'} disabled className={dc} />
                  </div>
                </div>
              )}
            </div>
          )}

          {modePB === 'prospect' && (
            <div className="space-y-3">
              <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
                Le prospect sera converti en client lors de la création du contrat.
              </p>
              <div>
                <label className={lc}>Sélectionner un prospect *</label>
                <select value={prospectId} onChange={e => {
                  setProspectId(e.target.value);
                  const pr = prospects.find(p => p.id === Number(e.target.value));
                  setForm(prev => ({ ...prev, cin_delivree_le: pr?.cin_delivree_le ?? '' }));
                }} className={ic}>
                  <option value="">— Sélectionner —</option>
                  {prospects.map(p => <option key={p.id} value={p.id}>{p.nom_complet}</option>)}
                </select>
                {errMsg('prospect_id')}
              </div>
              {selectedProspect && (
                <div className="grid grid-cols-2 gap-3 bg-amber-50 rounded-lg p-3 text-sm">
                  <div><label className={lc}>CIN</label><input type="text" value={selectedProspect.cin ?? '—'} disabled className={dc} /></div>
                  <div><label className={lc}>Ville</label><input type="text" value={selectedProspect.ville ?? '—'} disabled className={dc} /></div>
                  <div>
                    <label className={lc}>CIN délivrée le</label>
                    {selectedProspect.cin_delivree_le
                      ? <input type="text" value={fmtDate(selectedProspect.cin_delivree_le)} disabled className={dc} />
                      : <input type="date" value={form.cin_delivree_le} onChange={set('cin_delivree_le')} className={ic} placeholder="Non renseigné" />
                    }
                  </div>
                </div>
              )}
            </div>
          )}

          {modePB === 'nouveau_client' && (
            <div className="space-y-3">
              <p className="text-xs text-blue-700 bg-blue-50 rounded-lg px-3 py-2">Ce client sera créé et directement lié au contrat.</p>
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
                <div><label className={lc}>Nom *</label><input type="text" value={ncForm.nom} onChange={setNc('nom')} className={ic} />{errMsg('nouveau_client.nom')}</div>
                <div><label className={lc}>Prénom *</label><input type="text" value={ncForm.prenom} onChange={setNc('prenom')} className={ic} />{errMsg('nouveau_client.prenom')}</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={lc}>Email</label><input type="email" value={ncForm.email} onChange={setNc('email')} className={ic} /></div>
                <div><label className={lc}>Téléphone</label><input type="tel" value={ncForm.telephone} onChange={setNc('telephone')} className={ic} /></div>
                <div><label className={lc}>CIN</label><input type="text" value={ncForm.cin} onChange={setNcDigitsOnly('cin', 8)} className={ic} /></div>
                <div><label className={lc}>Date de naissance</label><input type="date" value={ncForm.date_naissance} onChange={setNc('date_naissance')} className={ic} /></div>
                <div><label className={lc}>Adresse</label><input type="text" value={ncForm.adresse} onChange={setNc('adresse')} className={ic} /></div>
                <div><label className={lc}>Ville</label><input type="text" value={ncForm.ville} onChange={setNc('ville')} className={ic} /></div>
              </div>
              <div><label className={lc}>CIN délivrée le</label><input type="date" value={form.cin_delivree_le} onChange={set('cin_delivree_le')} className={ic} /></div>
            </div>
          )}
        </>
      ),
    },
    {
      title: 'Durée & Finances',
      validate: () => {
        if (!form.date_debut) return "La date de prise d'effet est obligatoire.";
        if (!form.montant_ht) return 'Le montant HT est obligatoire.';
        if (!isPositiveAmount(form.montant_ht)) return 'Le montant HT doit être un nombre positif.';
        if (form.tva !== '' && (Number(form.tva) < 0 || Number(form.tva) > 100)) return 'La TVA doit être comprise entre 0 et 100.';
        if (form.depot_garantie !== '' && Number(form.depot_garantie) < 0) return "L'acompte / dépôt de garantie ne peut pas être négatif.";
        return null;
      },
      content: (
        <>
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
          </div>
          <div>
            <label className={lc}>Montant HT (DT) *</label>
            <input type="number" step="0.001" min="0" value={form.montant_ht} onChange={set('montant_ht')} placeholder="1500.000" className={ic} />
            {errMsg('montant_ht')}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lc}>TVA (%)</label>
              <input type="number" step="0.1" min="0" max="100" value={form.tva} onChange={set('tva')} placeholder="19" className={ic} />
            </div>
            <div>
              <label className={lc}>Montant TTC (calculé)</label>
              <input type="text" value={montantTtc ? `${Number(montantTtc).toLocaleString('fr-TN', {minimumFractionDigits:3})} DT` : ''} disabled className={dc} />
            </div>
          </div>
          <div>
            <label className={lc}>Acompte (DT)</label>
            <input type="number" step="0.001" min="0" value={form.depot_garantie} onChange={set('depot_garantie')} placeholder="3000.000" className={ic} />
          </div>
        </>
      ),
    },
    {
      title: 'Finalisation',
      content: (
        <>
          <div>
            <label className={lc}>Assurance</label>
            <textarea value={form.assurance} onChange={set('assurance')} rows={2}
              placeholder="Références de l'assurance…" className={ic} />
          </div>
          <div>
            <label className={lc}>Notes internes</label>
            <textarea value={form.notes} onChange={set('notes')} rows={2} className={ic} />
          </div>
          <div>
            <label className={lc}>Ville de signature</label>
            <input type="text" value={form.ville_signature} onChange={set('ville_signature')} placeholder="Tunis" className={ic} />
          </div>
          {globalError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{globalError}</div>
          )}
        </>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link href="/dashboard/contrats" className="text-sm text-gray-400 hover:text-gray-600">← Retour</Link>
        <h1 className="text-2xl font-bold text-gray-800 mt-2">Nouveau contrat</h1>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        <StepForm
          key={nature}
          steps={steps}
          onSubmit={handleSubmit}
          submitLabel="Créer le contrat"
          loading={loading}
          cancelHref="/dashboard/contrats"
        />

        {/* ── Aperçu (toujours visible) ── */}
        <div className="xl:sticky xl:top-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">Aperçu du contrat</span>
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button type="button" onClick={() => setLang('fr')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${lang === 'fr' ? 'bg-white shadow text-blue-700' : 'text-gray-500 hover:text-gray-800'}`}>
                FR — Français
              </button>
              <button type="button" onClick={() => setLang('ar')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${lang === 'ar' ? 'bg-white shadow text-blue-700' : 'text-gray-500 hover:text-gray-800'}`}
                style={{ fontFamily: 'Tahoma, Arial, sans-serif' }}>
                AR — عربي
              </button>
            </div>
          </div>
          <div className="border border-gray-200 rounded-xl shadow-sm overflow-auto bg-white max-h-[85vh]">
            <ContratPreview lang={lang} data={previewData} />
          </div>
        </div>
      </div>
    </div>
  );
}
