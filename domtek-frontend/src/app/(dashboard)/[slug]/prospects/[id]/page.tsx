'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from '@/components/OrgLink';
import api from '@/lib/api'
import { Bien, BesoinProspect, BienSuggestion, Prospect } from '@/types';
import { AxiosError } from 'axios';
import { isValidEmail, isValidPhone, isValidCin, isValidCinOrPasseport, isValidCityOrPlace } from '@/lib/validation';

const Section = ({ title }: { title: string }) => (
  <div className="flex items-center gap-3 pt-2">
    <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide whitespace-nowrap">{title}</span>
    <div className="flex-1 h-px bg-gray-200" />
  </div>
);

// ─── Drag & drop priorités ────────────────────────────────────────────────────

const BESOINS_LABELS: Record<BesoinProspect, string> = {
  prix:        '💰 Prix',
  emplacement: '📍 Emplacement',
  superficie:  '📐 Superficie',
  transport:   '🚌 Transport',
  commodites:  '🏪 Commodités',
};
const DEFAULT_BESOINS: BesoinProspect[] = ['prix','emplacement','superficie','transport','commodites'];

function DragList({ items, onChange }: { items: BesoinProspect[]; onChange: (v: BesoinProspect[]) => void }) {
  const [dragging, setDragging] = useState<number | null>(null);
  const [over, setOver]         = useState<number | null>(null);

  const onDrop = () => {
    if (dragging === null || over === null || dragging === over) { setDragging(null); setOver(null); return; }
    const next = [...items];
    const [moved] = next.splice(dragging, 1);
    next.splice(over, 0, moved);
    onChange(next);
    setDragging(null); setOver(null);
  };

  return (
    <div className="space-y-1.5">
      {items.map((b, i) => (
        <div key={b} draggable
          onDragStart={() => setDragging(i)}
          onDragEnter={() => setOver(i)}
          onDragOver={e => e.preventDefault()}
          onDrop={onDrop}
          className={`flex items-center gap-3 px-3 py-2 rounded-lg border text-sm cursor-grab select-none transition
            ${over === i && dragging !== i ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
          <span className="text-gray-300">⠿</span>
          <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">{i + 1}</span>
          <span>{BESOINS_LABELS[b]}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Badge score ──────────────────────────────────────────────────────────────

function ScoreBadge({ score }: { score: number }) {
  const { color, label } =
    score >= 81 ? { color: '#16a34a', label: 'Excellent' } :
    score >= 61 ? { color: '#2563eb', label: 'Bon'       } :
    score >= 31 ? { color: '#ea580c', label: 'Moyen'     } :
                  { color: '#dc2626', label: 'Faible'    };
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, background: color }} />
      </div>
      <span className="text-sm font-bold" style={{ color }}>{score}%</span>
      <span className="text-sm text-gray-500">{label}</span>
    </div>
  );
}

function ScoreCircle({ score }: { score: number }) {
  const color = score >= 75 ? '#16a34a' : score >= 50 ? '#2563eb' : score >= 30 ? '#ea580c' : '#9ca3af';
  return (
    <div className="flex flex-col items-center min-w-[48px]">
      <span className="text-xl font-bold leading-none" style={{ color }}>{score}</span>
      <span className="text-xs text-gray-400">/100</span>
    </div>
  );
}

const TYPE_LABELS: Record<string, string> = {
  appartement: 'Appartement', maison: 'Maison', villa: 'Villa', bureau: 'Bureau',
  terrain: 'Terrain', studio: 'Studio', duplex: 'Duplex',
  local_commercial: 'Local commercial', entrepot: 'Entrepôt', ferme: 'Ferme', autre: 'Autre',
};

const Field = ({ label, value }: { label: string; value?: string | null }) => (
  <div>
    <p className="text-xs text-gray-400 mb-0.5">{label}</p>
    <p className="text-sm text-gray-800 font-medium">{value || '—'}</p>
  </div>
);

const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FicheProspectPage() {
  const { id } = useParams<{ id: string }>();
  const fileRef = useRef<HTMLInputElement>(null);

  const [editing, setEditing]   = useState(false);
  const [prospect, setProspect] = useState<Prospect | null>(null);
  const [biens, setBiens]       = useState<Bien[]>([]);

  const [form, setForm] = useState({
    civilite: '', nom: '', prenom: '',
    telephone: '', email: '', ville: '',
    date_naissance: '', lieu_naissance: '',
    type_piece: '', cin: '',
    cin_delivree_le: '', cin_delivree_a: '',
    notes: '',
    source_connaissance: '', source_connaissance_detail: '',
    profession: '', profession_detail: '',
    revenus_mensuels: '',
    score_solvabilite: '',
    impression_premiere_visite: '',
  });
  const [compositionFoyer, setCompositionFoyer] = useState<string[]>([]);
  const [biensInteret, setBiensInteret]         = useState<number[]>([]);
  const [hierarchie, setHierarchie]             = useState<BesoinProspect[]>(DEFAULT_BESOINS);
  const [visitEffectuee, setVisitEffectuee]     = useState(false);

  const [suggestions, setSuggestions]           = useState<BienSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSugg]    = useState(false);
  const [suggestionsLoaded, setSuggestionsLoaded] = useState(false);

  const [errors, setErrors]         = useState<Record<string, string[]>>({});
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [uploading, setUploading]   = useState(false);
  const [uploadDone, setUploadDone] = useState(false);

  const fetchProspect = () => {
    setLoading(true);
    Promise.allSettled([
      api.get<{ data: Prospect }>(`/org/prospects/${id}`),
      api.get('/org/biens?per_page=200'),
    ]).then(([p, b]) => {
      if (p.status === 'fulfilled') {
        const pr = p.value.data.data;
        setProspect(pr);
        setForm({
          civilite:                   pr.civilite ?? '',
          nom:                        pr.nom,
          prenom:                     pr.prenom,
          telephone:                  pr.telephone ?? '',
          email:                      pr.email ?? '',
          ville:                      pr.ville ?? '',
          date_naissance:             pr.date_naissance ?? '',
          lieu_naissance:             pr.lieu_naissance ?? '',
          type_piece:                 pr.type_piece ?? '',
          cin:                        pr.cin ?? '',
          cin_delivree_le:            pr.cin_delivree_le ?? '',
          cin_delivree_a:             pr.cin_delivree_a ?? '',
          notes:                      pr.notes ?? '',
          source_connaissance:        pr.source_connaissance ?? '',
          source_connaissance_detail: pr.source_connaissance_detail ?? '',
          profession:                 pr.profession ?? '',
          profession_detail:          '',
          revenus_mensuels:           pr.revenus_mensuels ?? '',
          score_solvabilite:          pr.score_solvabilite ?? '',
          impression_premiere_visite: pr.impression_premiere_visite ?? '',
        });
        setCompositionFoyer(pr.composition_foyer ?? []);
        setBiensInteret(pr.biens_interet ?? []);
        if (pr.hierarchie_besoins?.length) setHierarchie(pr.hierarchie_besoins as BesoinProspect[]);
        if (pr.score_solvabilite || pr.hierarchie_besoins?.length || pr.impression_premiere_visite) setVisitEffectuee(true);
      }
      if (b.status === 'fulfilled') setBiens(b.value.data.data ?? []);
    }).finally(() => setLoading(false));
  };

  const fetchSuggestions = async () => {
    if (loadingSuggestions) return;
    setLoadingSugg(true);
    try {
      const { data } = await api.get(`/org/prospects/${id}/suggestions`);
      setSuggestions(data.suggestions ?? []);
      setSuggestionsLoaded(true);
    } catch { /* noop */ }
    finally { setLoadingSugg(false); }
  };

  useEffect(() => { fetchProspect(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const setDigitsOnly = (field: string, maxLength?: number) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm(prev => {
    let digits = e.target.value.replace(/\D/g, '');
    if (maxLength) digits = digits.slice(0, maxLength);
    return { ...prev, [field]: digits };
  });

  const toggleFoyer = (v: string) =>
    setCompositionFoyer(p => p.includes(v) ? p.filter(x => x !== v) : [...p, v]);

  const toggleBienInteret = (bid: number) =>
    setBiensInteret(p => p.includes(bid) ? p.filter(x => x !== bid) : [...p, bid]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const newErrors: Record<string, string[]> = {};
    if (form.telephone.trim() && !isValidPhone(form.telephone)) {
      newErrors.telephone = ['Le numéro de téléphone est invalide.'];
    }
    if (form.email.trim() && !isValidEmail(form.email)) {
      newErrors.email = ["L'adresse e-mail est invalide."];
    }
    if (form.lieu_naissance.trim() && !isValidCityOrPlace(form.lieu_naissance)) {
      newErrors.lieu_naissance = ['Le lieu de naissance est invalide.'];
    }
    if (form.cin.trim() && form.type_piece === 'CIN' && !isValidCin(form.cin)) {
      newErrors.cin = ['Le numéro CIN doit contenir exactement 8 chiffres.'];
    }
    if (form.cin.trim() && form.type_piece !== 'CIN' && !isValidCinOrPasseport(form.cin)) {
      newErrors.cin = ['Le numéro de pièce ne doit contenir que des chiffres.'];
    }
    if (form.cin_delivree_a.trim() && !isValidCityOrPlace(form.cin_delivree_a)) {
      newErrors.cin_delivree_a = ['La ville de délivrance est invalide.'];
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setSaving(true);
    try {
      const professionFinale = form.profession === 'autre' ? (form.profession_detail || '') : form.profession;
      await api.put(`/org/prospects/${id}`, {
        ...form,
        profession: professionFinale,
        composition_foyer:          compositionFoyer,
        biens_interet:              biensInteret,
        hierarchie_besoins:         visitEffectuee ? hierarchie : [],
        score_solvabilite:          visitEffectuee ? (form.score_solvabilite || null) : null,
        impression_premiere_visite: visitEffectuee ? (form.impression_premiere_visite || null) : null,
      });
      setEditing(false);
      fetchProspect();
    } catch (err) {
      const axiosError = err as AxiosError<{ errors?: Record<string, string[]> }>;
      setErrors(axiosError.response?.data?.errors ?? {});
    } finally {
      setSaving(false);
    }
  };

  const handleUploadDocument = async (file: File) => {
    setUploading(true);
    setUploadDone(false);
    try {
      const fd = new FormData();
      fd.append('document', file);
      const { data } = await api.post(`/org/prospects/${id}/document`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setProspect(data.data);
      setUploadDone(true);
    } catch { /* noop */ }
    finally { setUploading(false); }
  };

  const inp = (label: string, key: string, type: React.HTMLInputTypeAttribute = 'text', placeholder = '', required = false, onChange = set(key)) => (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input type={type} value={(form as Record<string, string>)[key]} onChange={onChange}
        placeholder={placeholder} required={required}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
      {errors[key] && <p className="text-red-500 text-xs mt-1">{errors[key][0]}</p>}
    </div>
  );

  if (loading) return <div className="p-8 animate-pulse h-40 bg-gray-100 rounded-xl" />;

  /* ── Vue fiche (lecture seule) ── */
  if (!editing) {
    const CANAL_LABELS: Record<string, string> = {
      facebook: 'Facebook', instagram: 'Instagram', amis_famille: 'Amis / Famille',
      publicite: 'Publicité', site_web: 'Site web', google: 'Google',
      agence_partenaire: 'Agence partenaire', autre: 'Autre',
    };
    const REVENUS_LABELS: Record<string, string> = {
      moins_1000: '< 1 000 DT', '1000_2000': '1 000 – 2 000 DT',
      '3000_6000': '3 000 – 6 000 DT', '7000_10000': '7 000 – 10 000 DT', plus_10000: '> 10 000 DT',
    };
    const SOLVABILITE_LABELS: Record<string, string> = {
      verifie: '✅ Vérifié', plutot_verifie: '🟢 Plutôt vérifié',
      plutot_non_verifie: '🟠 Plutôt non vérifié', non_verifie: '❌ Non vérifié',
    };
    const IMPRESSION_LABELS: Record<string, string> = {
      satisfait: '😊 Satisfait', neutre: '😐 Neutre', non_satisfait: '😞 Non satisfait',
    };
    const bienNoms = biens.filter(b => biensInteret.includes(b.id)).map(b => b.designation).join(', ');
    return (
      <div className="p-8 max-w-3xl">
        <div className="mb-6">
          <Link href="/dashboard/prospects" className="text-sm text-gray-400 hover:text-gray-600">← Retour</Link>
          <div className="flex items-start justify-between mt-2">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{prospect?.nom_complet}</h1>
              {prospect?.converti && (
                <span className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                  Converti en client
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {prospect && (
                <div className="w-48">
                  <p className="text-xs text-gray-400 mb-1">Score d&apos;opportunité</p>
                  <ScoreBadge score={prospect.score_opportunite ?? 0} />
                </div>
              )}
              <button onClick={() => setEditing(true)}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition">
                Modifier
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 space-y-5">
          <Section title="Identité" />
          <div className="grid grid-cols-3 gap-4">
            <Field label="Civilité" value={form.civilite} />
            <Field label="Nom" value={form.nom} />
            <Field label="Prénom" value={form.prenom} />
          </div>

          <Section title="Contact" />
          <div className="grid grid-cols-3 gap-4">
            <Field label="Téléphone" value={form.telephone} />
            <Field label="Email" value={form.email} />
            <Field label="Ville" value={form.ville} />
          </div>

          <Section title="Naissance" />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Date de naissance" value={fmtDate(form.date_naissance)} />
            <Field label="Lieu de naissance" value={form.lieu_naissance} />
          </div>

          <Section title="Document d'identité" />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Type de pièce" value={form.type_piece} />
            <Field label="N° de pièce (CIN)" value={form.cin} />
            <Field label="Délivrée le" value={fmtDate(form.cin_delivree_le)} />
            <Field label="Délivrée à" value={form.cin_delivree_a} />
          </div>
          {prospect?.document_url && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm">
              <span className="text-gray-500 flex-1">Pièce jointe</span>
              <a href={prospect.document_url} target="_blank" rel="noopener noreferrer"
                className="text-violet-600 hover:underline text-xs">Voir le fichier</a>
            </div>
          )}

          <Section title="Profil" />
          <div className="grid grid-cols-3 gap-4">
            <Field label="Source" value={CANAL_LABELS[form.source_connaissance] ?? form.source_connaissance} />
            <Field label="Profession" value={form.profession} />
            <Field label="Revenus mensuels" value={REVENUS_LABELS[form.revenus_mensuels] ?? form.revenus_mensuels} />
          </div>
          {compositionFoyer.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {compositionFoyer.map(v => (
                <span key={v} className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full capitalize">
                  {v === 'enfants' ? '👶 Enfants' : '🐾 Animaux'}
                </span>
              ))}
            </div>
          )}
          {bienNoms && <Field label="Biens d'intérêt" value={bienNoms} />}

          {visitEffectuee && (
            <>
              <Section title="Évaluation" />
              <div className="grid grid-cols-2 gap-4">
                {form.score_solvabilite && (
                  <Field label="Score de solvabilité" value={SOLVABILITE_LABELS[form.score_solvabilite] ?? form.score_solvabilite} />
                )}
                {form.impression_premiere_visite && (
                  <Field label="Impression" value={IMPRESSION_LABELS[form.impression_premiere_visite] ?? form.impression_premiere_visite} />
                )}
              </div>
              {hierarchie.length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 mb-2">Hiérarchie des besoins</p>
                  <div className="flex gap-2 flex-wrap">
                    {hierarchie.map((b, i) => (
                      <span key={b} className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        {i + 1}. {BESOINS_LABELS[b]}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {form.notes && (
            <>
              <Section title="Note" />
              <p className="text-sm text-gray-700 whitespace-pre-line">{form.notes}</p>
            </>
          )}
        </div>

        {/* ── Suggestions IA ── */}
        <div className="bg-white rounded-xl shadow-sm p-6 mt-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-800">Suggestions IA — Biens compatibles</h2>
              <p className="text-xs text-gray-400 mt-0.5">Biens disponibles correspondant au profil de ce prospect</p>
            </div>
            <button
              onClick={fetchSuggestions}
              disabled={loadingSuggestions}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg
                bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600
                text-white shadow-sm disabled:opacity-50 transition"
            >
              {loadingSuggestions ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Analyse en cours…
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  {suggestionsLoaded ? 'Relancer' : 'Analyser'}
                </>
              )}
            </button>
          </div>

          {suggestions.length > 0 && (
            <div className="space-y-2">
              {suggestions.map((s) => (
                <Link key={s.id} href={`/dashboard/biens/${s.id}`}
                  className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200
                    hover:border-violet-300 hover:bg-violet-50 transition group">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-800 text-sm truncate group-hover:text-violet-700 transition">
                      {s.designation}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {TYPE_LABELS[s.type_bien] ?? s.type_bien}
                      {s.ville && <span> · {s.ville}</span>}
                      {s.superficie && <span> · {s.superficie} m²</span>}
                      {s.nb_pieces && <span> · {s.nb_pieces} pièces</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    {s.prix != null && (
                      <span className="text-sm font-semibold text-gray-700">
                        {Number(s.prix).toLocaleString('fr-FR')} DT
                      </span>
                    )}
                    <ScoreCircle score={s.score} />
                  </div>
                </Link>
              ))}
            </div>
          )}

          {suggestionsLoaded && suggestions.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-6">
              Aucun bien disponible ne correspond au profil de ce prospect.
            </p>
          )}

          {!suggestionsLoaded && !loadingSuggestions && (
            <p className="text-xs text-gray-300 text-center py-4">
              Cliquez sur &quot;Analyser&quot; pour lancer la recherche IA.
            </p>
          )}
        </div>
      </div>
    );
  }

  /* ── Formulaire de modification ── */
  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-6">
        <Link href="/dashboard/prospects" className="text-sm text-gray-400 hover:text-gray-600">← Retour</Link>
        <div className="flex items-start justify-between mt-2">
          <h1 className="text-2xl font-bold text-gray-800">{prospect?.nom_complet}</h1>
          {prospect && (
            <div className="w-64">
              <p className="text-xs text-gray-400 mb-1">Score d'opportunité</p>
              <ScoreBadge score={prospect.score_opportunite ?? 0} />
            </div>
          )}
        </div>
        {prospect?.converti && (
          <span className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
            Converti en client
          </span>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <form onSubmit={handleSave} className="space-y-4">

          <Section title="Identité" />
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Civilité</label>
              <select value={form.civilite} onChange={set('civilite')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
                <option value="">—</option>
                <option value="M.">M.</option>
                <option value="Mme">Mme</option>
                <option value="Mlle">Mlle</option>
              </select>
            </div>
            {inp('Nom', 'nom', 'text', '', true)}
            {inp('Prénom', 'prenom', 'text', '', true)}
          </div>

          <Section title="Contact" />
          <div className="grid grid-cols-3 gap-4">
            {inp('N° Téléphone', 'telephone', 'tel', '', true)}
            {inp('Email', 'email', 'email')}
            {inp('Ville', 'ville')}
          </div>

          <Section title="Naissance" />
          <div className="grid grid-cols-2 gap-4">
            {inp('Date de naissance', 'date_naissance', 'date')}
            {inp('Lieu de naissance', 'lieu_naissance')}
          </div>

          <Section title="Document d'identité" />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Type de pièce</label>
              <select value={form.type_piece} onChange={set('type_piece')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
                <option value="">— Sélectionner —</option>
                <option value="CIN">CIN</option>
                <option value="Passeport">Passeport</option>
              </select>
            </div>
            {inp('N° de pièce (CIN)', 'cin', 'text', '', true, setDigitsOnly('cin', form.type_piece === 'CIN' ? 8 : undefined))}
            {inp('Délivrée le', 'cin_delivree_le', 'date', '', true)}
            {inp('Délivrée à (ville)', 'cin_delivree_a', 'text', '', true)}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Pièce jointe <span className="text-gray-400 font-normal">(PDF, JPG, PNG — max 5 Mo)</span>
            </label>
            {prospect?.document_url && (
              <div className="flex items-center gap-3 mb-2 p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm">
                <span className="text-gray-500 flex-1">Document actuel</span>
                <a href={prospect.document_url} target="_blank" rel="noopener noreferrer"
                  className="text-violet-600 hover:underline text-xs">Voir le fichier</a>
              </div>
            )}
            <div onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg px-4 py-4 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition">
              {uploading ? <p className="text-sm text-gray-400">Envoi en cours…</p>
                : uploadDone ? <p className="text-sm text-green-600 font-medium">Document mis à jour</p>
                : <p className="text-sm text-gray-400">{prospect?.document_url ? 'Cliquer pour remplacer' : 'Cliquer pour importer'}</p>}
            </div>
            <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleUploadDocument(f); }} />
          </div>

          <Section title="Note" />
          <textarea value={form.notes} onChange={set('notes')} rows={2}
            placeholder="Remarques internes…"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />

          {/* ── Source de connaissance ── */}
          <Section title="Comment nous avez-vous connus ?" />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Canal</label>
              <select value={form.source_connaissance} onChange={set('source_connaissance')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
                <option value="">— Sélectionner —</option>
                <option value="facebook">Facebook</option>
                <option value="instagram">Instagram</option>
                <option value="amis_famille">Amis / Famille</option>
                <option value="publicite">Publicité (presse / TV / radio)</option>
                <option value="site_web">Site web</option>
                <option value="google">Google</option>
                <option value="agence_partenaire">Agence partenaire</option>
                <option value="autre">Autre (à préciser)</option>
              </select>
            </div>
            {form.source_connaissance === 'autre' && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Préciser</label>
                <input type="text" value={form.source_connaissance_detail}
                  onChange={set('source_connaissance_detail')}
                  placeholder="Ex : panneau publicitaire, salon immobilier…"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
              </div>
            )}
          </div>

          {/* ── Profil Prospect ── */}
          <Section title="Profil Prospect" />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Profession</label>
              <select value={form.profession} onChange={set('profession')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
                <option value="">— Sélectionner —</option>
                <option value="Salarié du privé">Salarié du privé</option>
                <option value="Fonctionnaire / Salarié public">Fonctionnaire / Salarié public</option>
                <option value="Médecin / Dentiste">Médecin / Dentiste</option>
                <option value="Avocat / Notaire">Avocat / Notaire</option>
                <option value="Ingénieur">Ingénieur</option>
                <option value="Architecte">Architecte</option>
                <option value="Enseignant / Formateur">Enseignant / Formateur</option>
                <option value="Commerçant / Entrepreneur">Commerçant / Entrepreneur</option>
                <option value="Profession libérale">Profession libérale</option>
                <option value="Agriculteur">Agriculteur</option>
                <option value="Retraité">Retraité</option>
                <option value="Étudiant">Étudiant</option>
                <option value="Sans emploi">Sans emploi</option>
                <option value="autre">Autre (à préciser)</option>
              </select>
              {form.profession === 'autre' && (
                <input type="text" value={form.profession_detail}
                  onChange={set('profession_detail')}
                  placeholder="Préciser la profession…"
                  className="mt-2 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Revenus mensuels</label>
              <select value={form.revenus_mensuels} onChange={set('revenus_mensuels')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
                <option value="">— Non précisé —</option>
                <option value="moins_1000">{'< 1 000 DT'}</option>
                <option value="1000_2000">1 000 – 2 000 DT</option>
                <option value="3000_6000">3 000 – 6 000 DT</option>
                <option value="7000_10000">7 000 – 10 000 DT</option>
                <option value="plus_10000">{'> 10 000 DT'}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Composition du foyer</label>
            <div className="flex gap-3">
              {[{ v:'enfants', label:'👶 Enfants' }, { v:'animaux', label:'🐾 Animaux de compagnie' }].map(({ v, label }) => (
                <button key={v} type="button" onClick={() => toggleFoyer(v)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm transition
                    ${compositionFoyer.includes(v) ? 'bg-violet-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Biens d'intérêt</label>
            <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
              {biens.map(b => (
                <label key={b.id} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                  <input type="checkbox" checked={biensInteret.includes(b.id)} onChange={() => toggleBienInteret(b.id)}
                    className="rounded border-gray-300 text-blue-600" />
                  <span className="truncate">{b.designation}{b.ville ? ` (${b.ville})` : ''}</span>
                </label>
              ))}
            </div>
            {biens.length === 0 && <p className="text-xs text-gray-400">Aucun bien disponible.</p>}
          </div>

          {/* ── Évaluation Prospect ── */}
          <Section title="Évaluation prospect" />
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setVisitEffectuee(p => !p)}
              className={`w-10 h-6 rounded-full transition-colors relative ${visitEffectuee ? 'bg-violet-600' : 'bg-gray-300'}`}>
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${visitEffectuee ? 'left-5' : 'left-1'}`} />
            </button>
            <span className="text-sm text-gray-700 font-medium">Visite effectuée</span>
          </div>

          {visitEffectuee && (
            <div className="space-y-4 bg-indigo-50 rounded-xl p-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Score de solvabilité</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { v:'verifie',            label:'✅ Vérifié',            cls:'bg-green-500 text-white' },
                    { v:'plutot_verifie',      label:'🟢 Plutôt vérifié',     cls:'bg-green-200 text-green-800' },
                    { v:'plutot_non_verifie',  label:'🟠 Plutôt non vérifié', cls:'bg-orange-200 text-orange-800' },
                    { v:'non_verifie',         label:'❌ Non vérifié',         cls:'bg-red-200 text-red-800' },
                  ].map(({ v, label, cls }) => (
                    <button key={v} type="button"
                      onClick={() => setForm(p => ({ ...p, score_solvabilite: p.score_solvabilite === v ? '' : v }))}
                      className={`py-2 rounded-lg text-xs font-medium border-2 transition
                        ${form.score_solvabilite === v ? cls + ' border-transparent' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Première impression du prospect</label>
                <div className="flex gap-2">
                  {([
                    { v: 'satisfait',     label: '😊 Satisfait',     active: 'bg-green-500 text-white',  idle: 'bg-white border-gray-200 text-gray-600 hover:bg-green-50' },
                    { v: 'neutre',        label: '😐 Neutre',         active: 'bg-yellow-500 text-white', idle: 'bg-white border-gray-200 text-gray-600 hover:bg-yellow-50' },
                    { v: 'non_satisfait', label: '😞 Non satisfait',  active: 'bg-red-500 text-white',    idle: 'bg-white border-gray-200 text-gray-600 hover:bg-red-50' },
                  ] as const).map(({ v, label, active, idle }) => (
                    <button key={v} type="button"
                      onClick={() => setForm(p => ({ ...p, impression_premiere_visite: p.impression_premiere_visite === v ? '' : v }))}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium border-2 transition
                        ${form.impression_premiere_visite === v ? active + ' border-transparent' : idle}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  Hiérarchie des besoins <span className="text-gray-400 font-normal">(glisser-déposer pour classer)</span>
                </label>
                <DragList items={hierarchie} onChange={setHierarchie} />
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-2">
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
    </div>
  );
}
