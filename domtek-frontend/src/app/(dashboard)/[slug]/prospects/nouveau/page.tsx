'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from '@/components/OrgLink';
import api from '@/lib/api';
import { orgPath } from '@/lib/org-path';
import { Bien, BesoinProspect } from '@/types';
import { AxiosError } from 'axios';
import StepForm, { FormStep } from '@/components/StepForm';
import { isValidEmail, isValidPhone, isValidCinOrPasseport, isValidCityOrPlace, filtreTelephone, borneDate } from '@/lib/validation';
import { Champ } from '@/components/Champ';

const BESOINS_LABELS: Record<BesoinProspect, string> = {
  prix: '💰 Prix', emplacement: '📍 Emplacement', superficie: '📐 Superficie',
  transport: '🚌 Transport', commodites: '🏪 Commodités',
};
const DEFAULT_BESOINS: BesoinProspect[] = ['prix', 'emplacement', 'superficie', 'transport', 'commodites'];

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
          onDragStart={() => setDragging(i)} onDragEnter={() => setOver(i)}
          onDragOver={e => e.preventDefault()} onDrop={onDrop}
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

export default function NouveauProspectPage() {
  const router  = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    civilite: '', nom: '', prenom: '',
    telephone: '', email: '', ville: '',
    date_naissance: '', lieu_naissance: '',
    type_piece: '', cin: '', cin_delivree_le: '', cin_delivree_a: '',
    notes: '',
    source_connaissance: '', source_connaissance_detail: '',
    profession: '', profession_detail: '', revenus_mensuels: '',
    score_solvabilite: '', impression_premiere_visite: '',
  });
  const [compositionFoyer, setCompositionFoyer] = useState<string[]>([]);
  const [biensInteret, setBiensInteret]         = useState<number[]>([]);
  const [hierarchie, setHierarchie]             = useState<BesoinProspect[]>(DEFAULT_BESOINS);
  const [visitEffectuee, setVisitEffectuee]     = useState(false);
  const [biens, setBiens]                       = useState<Bien[]>([]);
  const [documentFile, setDocumentFile]         = useState<File | null>(null);
  const [errors, setErrors]                     = useState<Record<string, string[]>>({});
  const [loading, setLoading]                   = useState(false);

  useEffect(() => {
    api.get('/org/biens?per_page=200').then(r => setBiens(r.data.data ?? [])).catch(() => {});
  }, []);

  const toggleFoyer      = (v: string)  => setCompositionFoyer(p => p.includes(v) ? p.filter(x => x !== v) : [...p, v]);
  const toggleBienInteret = (id: number) => setBiensInteret(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const set = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const setDigitsOnly = (field: string, maxLength?: number) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm((prev) => {
    let digits = e.target.value.replace(/\D/g, '');
    if (maxLength) digits = digits.slice(0, maxLength);
    return { ...prev, [field]: digits };
  });

  const handleSubmit = async (e: React.FormEvent<Element>) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    try {
      const payload = new FormData();
      const professionFinale = form.profession === 'autre' ? (form.profession_detail || '') : form.profession;
      Object.entries({ ...form, profession: professionFinale }).forEach(([k, v]) => {
        if (k === 'profession_detail') return;
        if (v) payload.append(k, v);
      });
      if (documentFile) payload.append('document_identite', documentFile);
      compositionFoyer.forEach(v => payload.append('composition_foyer[]', v));
      biensInteret.forEach(id => payload.append('biens_interet[]', String(id)));
      if (visitEffectuee) hierarchie.forEach(v => payload.append('hierarchie_besoins[]', v));
      const { data } = await api.post('/org/prospects', payload, { headers: { 'Content-Type': 'multipart/form-data' } });
      router.push(orgPath(`/dashboard/prospects/${data.data.id}`));
    } catch (err) {
      const axiosError = err as AxiosError<{ errors?: Record<string, string[]> }>;
      setErrors(axiosError.response?.data?.errors ?? {});
    } finally {
      setLoading(false);
    }
  };

  /** Setter appliquant un filtre de frappe avant d'enregistrer la valeur. */
  const setFiltre = (champ: string, filtre: (v: string) => string) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => setForm((prev) => ({ ...prev, [champ]: filtre(e.target.value) }));

  const inp = (label: string, key: string, type: React.HTMLInputTypeAttribute = 'text', placeholder = '', required = false, onChange = set(key)) => (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input type={type} value={(form as Record<string, string>)[key]} onChange={type === 'tel' ? setFiltre(key, filtreTelephone) : onChange}
        {...borneDate(key)} placeholder={placeholder}
        className={errors[key]
          ? 'w-full border border-red-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 bg-red-50'
          : 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500'} />
      <Champ nom={key} form={form} requis={required} erreur={errors[key]?.[0]} />
    </div>
  );

  const selectCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500';

  const steps: FormStep[] = [
    {
      title: 'Identité & Contact',
      validate: () => {
        if (!form.nom.trim())       return 'Le nom est obligatoire.';
        if (!form.prenom.trim())    return 'Le prénom est obligatoire.';
        if (!form.telephone.trim()) return 'Le téléphone est obligatoire.';
        if (!isValidPhone(form.telephone)) return 'Le numéro de téléphone est invalide.';
        if (form.email.trim() && !isValidEmail(form.email)) return "L'adresse e-mail est invalide.";
        if (form.lieu_naissance.trim() && !isValidCityOrPlace(form.lieu_naissance)) return 'Le lieu de naissance est invalide.';
        return null;
      },
      content: (
        <>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Civilité</label>
              <select value={form.civilite} onChange={set('civilite')} className={selectCls}>
                <option value="">—</option>
                <option value="M.">M.</option>
                <option value="Mme">Mme</option>
                <option value="Mlle">Mlle</option>
              </select>
            </div>
            {inp('Nom', 'nom', 'text', 'Ben Ali', true)}
            {inp('Prénom', 'prenom', 'text', 'Ahmed', true)}
          </div>
          <div className="grid grid-cols-3 gap-4">
            {inp('N° Téléphone', 'telephone', 'tel', '+216 22 000 000', true)}
            {inp('Email', 'email', 'email', 'ahmed@email.com')}
            {inp('Ville', 'ville', 'text', 'Tunis')}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {inp('Date de naissance', 'date_naissance', 'date')}
            {inp('Lieu de naissance', 'lieu_naissance', 'text', 'Tunis')}
          </div>
        </>
      ),
    },
    {
      title: "Document d'identité",
      validate: () => {
        // 1. Si une CIN est saisie, on vérifie qu'elle contient exactement 8 chiffres
        if (form.type_piece === 'CIN' && form.cin.trim()) {
          const cinRegex = /^\d{8}$/;
          if (!cinRegex.test(form.cin.trim())) {
            return 'Le numéro de CIN doit être composé de 8 chiffres.';
          }
        }

        // 1bis. Si passeport et un numéro est saisi, on vérifie qu'il ne contient que des chiffres
        if (form.type_piece === 'Passeport' && form.cin.trim() && !isValidCinOrPasseport(form.cin)) {
          return 'Le numéro de passeport ne doit contenir que des chiffres.';
        }

        // 2. Vérification des informations de délivrance si la pièce est renseignée
        if (form.cin.trim() && (!form.cin_delivree_le || !form.cin_delivree_a.trim())) {
          return 'Veuillez compléter la date et le lieu de délivrance de la pièce.';
        }
        if (form.cin_delivree_a.trim() && !isValidCityOrPlace(form.cin_delivree_a)) {
          return 'La ville de délivrance est invalide.';
        }
        return null;
      },
      content: (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Type de pièce</label>
              <select value={form.type_piece} onChange={set('type_piece')} className={selectCls}>
                <option value="">— Sélectionner —</option>
                <option value="CIN">CIN</option>
                <option value="Passeport">Passeport</option>
              </select>
            </div>
            {inp('N° de pièce (CIN)', 'cin', 'text', '12345678', false, setDigitsOnly('cin', form.type_piece === 'CIN' ? 8 : undefined))}
            {inp('Délivrée le', 'cin_delivree_le', 'date')}
            {inp('Délivrée à (ville)', 'cin_delivree_a', 'text', 'Tunis')}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Pièce jointe <span className="text-gray-400 font-normal">(PDF, JPG, PNG — max 5 Mo)</span>
            </label>
            <div onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg px-4 py-4 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition">
              {documentFile
                ? <p className="text-sm text-blue-600 font-medium">{documentFile.name}</p>
                : <p className="text-sm text-gray-400">Cliquer pour importer (copie CIN, passeport…)</p>}
            </div>
            <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
              onChange={(e) => setDocumentFile(e.target.files?.[0] ?? null)} />
            {errors.document_identite && <p className="text-red-500 text-xs mt-1">{errors.document_identite[0]}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
            <textarea value={form.notes} onChange={set('notes')} rows={2} placeholder="Remarques internes…"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
          </div>
        </>
      ),
    },
    {
      title: 'Source & Profil',
      content: (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Comment nous avez-vous connus ?</label>
              <select value={form.source_connaissance} onChange={set('source_connaissance')} className={selectCls}>
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
                <input type="text" value={form.source_connaissance_detail} onChange={set('source_connaissance_detail')}
                  placeholder="Ex : panneau publicitaire, salon immobilier…" className={selectCls} />
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Profession</label>
              <select value={form.profession} onChange={set('profession')} className={selectCls}>
                <option value="">— Sélectionner —</option>
                {['Salarié du privé','Fonctionnaire / Salarié public','Médecin / Dentiste','Avocat / Notaire',
                  'Ingénieur','Architecte','Enseignant / Formateur','Commerçant / Entrepreneur',
                  'Profession libérale','Agriculteur','Retraité','Étudiant','Sans emploi','autre'].map(p => (
                  <option key={p} value={p}>{p === 'autre' ? 'Autre (à préciser)' : p}</option>
                ))}
              </select>
              {form.profession === 'autre' && (
                <input type="text" value={form.profession_detail} onChange={set('profession_detail')}
                  placeholder="Préciser la profession…"
                  className="mt-2 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Revenus mensuels</label>
              <select value={form.revenus_mensuels} onChange={set('revenus_mensuels')} className={selectCls}>
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
              {[{ v: 'enfants', label: '👶 Enfants' }, { v: 'animaux', label: '🐾 Animaux de compagnie' }].map(({ v, label }) => (
                <button key={v} type="button" onClick={() => toggleFoyer(v)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm transition
                    ${compositionFoyer.includes(v) ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>
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
              {biens.length === 0 && <p className="text-xs text-gray-400">Aucun bien disponible.</p>}
            </div>
          </div>
        </>
      ),
    },
    {
      title: 'Évaluation',
      content: (
        <>
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
                    { v: 'verifie',           label: '✅ Vérifié',          cls: 'bg-green-500 text-white' },
                    { v: 'plutot_verifie',    label: '🟢 Plutôt vérifié',   cls: 'bg-green-200 text-green-800' },
                    { v: 'plutot_non_verifie',label: '🟠 Plutôt non vérifié', cls: 'bg-orange-200 text-orange-800' },
                    { v: 'non_verifie',       label: '❌ Non vérifié',       cls: 'bg-red-200 text-red-800' },
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
                <div className="flex gap-2 flex-wrap">
                  {([
                    { v: 'très_satisfait',        label: '😄 Très Satisfait',    active: 'bg-green-500 text-white',  idle: 'bg-white border-gray-200 text-gray-600 hover:bg-green-50' },
                    { v: 'satisfait',             label: '😊 Satisfait',          active: 'bg-green-500 text-white',  idle: 'bg-white border-gray-200 text-gray-600 hover:bg-green-50' },
                    { v: 'neutre',                label: '😐 Neutre',             active: 'bg-yellow-500 text-white', idle: 'bg-white border-gray-200 text-gray-600 hover:bg-yellow-50' },
                    { v: 'plutot_non_satisfait',  label: '😞 Plutôt non satisfait', active: 'bg-red-500 text-white', idle: 'bg-white border-gray-200 text-gray-600 hover:bg-red-50' },
                    { v: 'non_satisfait',         label: '😠 Non satisfait',      active: 'bg-red-500 text-white',    idle: 'bg-white border-gray-200 text-gray-600 hover:bg-red-50' },
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
          {!visitEffectuee && (
            <p className="text-sm text-gray-400 text-center py-4">Activez "Visite effectuée" pour renseigner l'évaluation.</p>
          )}
        </>
      ),
    },
  ];

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <Link href="/dashboard/prospects" className="text-sm text-gray-400 hover:text-gray-600">← Retour</Link>
        <h1 className="text-2xl font-bold text-gray-800 mt-2">Nouveau prospect</h1>
      </div>
      <StepForm
        steps={steps}
        onSubmit={handleSubmit}
        submitLabel="Créer le prospect"
        loading={loading}
        cancelHref="/dashboard/prospects"
      />
    </div>
  );
}
