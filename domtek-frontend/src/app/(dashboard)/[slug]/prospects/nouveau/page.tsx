'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from '@/components/OrgLink';
import api from '@/lib/api'
import { orgPath } from '@/lib/org-path';
import { Bien, BesoinProspect } from '@/types';
import { AxiosError } from 'axios';

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

  const onDragStart = (i: number) => setDragging(i);
  const onDragEnter = (i: number) => setOver(i);
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
          onDragStart={() => onDragStart(i)}
          onDragEnter={() => onDragEnter(i)}
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

const Section = ({ title }: { title: string }) => (
  <div className="flex items-center gap-3 pt-2">
    <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide whitespace-nowrap">{title}</span>
    <div className="flex-1 h-px bg-gray-200" />
  </div>
);

export default function NouveauProspectPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    civilite: '', nom: '', prenom: '',
    telephone: '', email: '', ville: '',
    date_naissance: '', lieu_naissance: '',
    type_piece: '', cin: '',
    cin_delivree_le: '', cin_delivree_a: '',
    notes: '',
    source_connaissance: '', source_connaissance_detail: '',
    // Prospect
    profession: '', profession_detail: '',
    revenus_mensuels: '',
    score_solvabilite: '',
    impression_premiere_visite: '',
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

  const toggleFoyer = (v: string) =>
    setCompositionFoyer(p => p.includes(v) ? p.filter(x => x !== v) : [...p, v]);

  const toggleBienInteret = (id: number) =>
    setBiensInteret(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const set = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    try {
      const payload = new FormData();
      // profession : si "autre" on envoie le champ libre, sinon la valeur du select
      const professionFinale = form.profession === 'autre' ? (form.profession_detail || '') : form.profession;
      Object.entries({ ...form, profession: professionFinale }).forEach(([k, v]) => {
        if (k === 'profession_detail') return; // champ interne seulement
        if (v) payload.append(k, v);
      });
      if (documentFile) payload.append('document_identite', documentFile);
      compositionFoyer.forEach(v => payload.append('composition_foyer[]', v));
      biensInteret.forEach(id => payload.append('biens_interet[]', String(id)));
      if (visitEffectuee) {
        hierarchie.forEach(v => payload.append('hierarchie_besoins[]', v));
      }

      const { data } = await api.post('/org/prospects', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      router.push(orgPath(`/dashboard/prospects/${data.data.id}`));
    } catch (err) {
      const axiosError = err as AxiosError<{ errors?: Record<string, string[]> }>;
      setErrors(axiosError.response?.data?.errors ?? {});
    } finally {
      setLoading(false);
    }
  };

  const inp = (
    label: string, key: string,
    type: React.HTMLInputTypeAttribute = 'text',
    placeholder = '', required = false
  ) => (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input type={type} value={(form as Record<string, string>)[key]} onChange={set(key)}
        placeholder={placeholder} required={required}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
      {errors[key] && <p className="text-red-500 text-xs mt-1">{errors[key][0]}</p>}
    </div>
  );

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <Link href="/dashboard/prospects" className="text-sm text-gray-400 hover:text-gray-600">← Retour</Link>
        <h1 className="text-2xl font-bold text-gray-800 mt-2">Nouveau prospect</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* ── 1. Identité ── */}
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
            {inp('Nom', 'nom', 'text', 'Ben Ali', true)}
            {inp('Prénom', 'prenom', 'text', 'Ahmed', true)}
          </div>

          {/* ── 2. Contact ── */}
          <Section title="Contact" />
          <div className="grid grid-cols-3 gap-4">
            {inp('N° Téléphone', 'telephone', 'tel', '+216 22 000 000', true)}
            {inp('Email', 'email', 'email', 'ahmed@email.com')}
            {inp('Ville', 'ville', 'text', 'Tunis')}
          </div>

          {/* ── 3. Naissance ── */}
          <Section title="Naissance" />
          <div className="grid grid-cols-2 gap-4">
            {inp('Date de naissance', 'date_naissance', 'date')}
            {inp('Lieu de naissance', 'lieu_naissance', 'text', 'Tunis')}
          </div>

          {/* ── 4. Document d'identité ── */}
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
            {inp('N° de pièce (CIN)', 'cin', 'text', '12345678', true)}
            {inp('Délivrée le', 'cin_delivree_le', 'date', '', true)}
            {inp('Délivrée à (ville)', 'cin_delivree_a', 'text', 'Tunis', true)}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Pièce jointe <span className="text-gray-400 font-normal">(PDF, JPG, PNG — max 5 Mo)</span>
            </label>
            <div onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg px-4 py-4 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition">
              {documentFile
                ? <p className="text-sm text-blue-600 font-medium">{documentFile.name}</p>
                : <p className="text-sm text-gray-400">Cliquer pour importer (copie CIN, passeport…)</p>
              }
            </div>
            <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
              onChange={(e) => setDocumentFile(e.target.files?.[0] ?? null)} />
            {errors.document_identite && <p className="text-red-500 text-xs mt-1">{errors.document_identite[0]}</p>}
          </div>

          {/* ── 5. Note ── */}
          <Section title="Note" />
          <textarea value={form.notes} onChange={set('notes')} rows={2}
            placeholder="Remarques internes…"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />

          {/* ── 6. Source de connaissance ── */}
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

          {/* ── 7. Profil Prospect ── */}
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
                <button key={v} type="button"
                  onClick={() => toggleFoyer(v)}
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

          {/* ── 7. Évaluation Prospect ── */}
          <Section title="Évaluation prospect" />
          <div className="flex items-center gap-3">
            <button type="button"
              onClick={() => setVisitEffectuee(p => !p)}
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
                    { v:'verifie',             label:'✅ Vérifié',              cls:'bg-green-500 text-white' },
                    { v:'plutot_verifie',       label:'🟢 Plutôt vérifié',       cls:'bg-green-200 text-green-800' },
                    { v:'plutot_non_verifie',   label:'🟠 Plutôt non vérifié',   cls:'bg-orange-200 text-orange-800' },
                    { v:'non_verifie',          label:'❌ Non vérifié',           cls:'bg-red-200 text-red-800' },
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
                    { v: 'très_satisfait',     label: '😄 Très Satisfait',     active: 'bg-green-500 text-white',  idle: 'bg-white border-gray-200 text-gray-600 hover:bg-green-50' },
                    { v: 'satisfait',     label: '😊 Satisfait',     active: 'bg-green-500 text-white',  idle: 'bg-white border-gray-200 text-gray-600 hover:bg-green-50' },
                    { v: 'neutre',        label: '😐 Neutre',         active: 'bg-yellow-500 text-white', idle: 'bg-white border-gray-200 text-gray-600 hover:bg-yellow-50' },
                    { v: 'plutot_non_satisfait', label: '😞 Plutot Non satisfait',  active: 'bg-red-500 text-white',    idle: 'bg-white border-gray-200 text-gray-600 hover:bg-red-50' },
                    { v: 'non_satisfait', label: '😠 Non satisfait',  active: 'bg-red-500 text-white',    idle: 'bg-white border-gray-200 text-gray-600 hover:bg-red-50' },
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

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading}
              className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition">
              {loading ? 'Enregistrement…' : 'Créer le prospect'}
            </button>
            <Link href="/dashboard/prospects"
              className="px-6 py-2.5 border border-gray-300 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition">
              Annuler
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
