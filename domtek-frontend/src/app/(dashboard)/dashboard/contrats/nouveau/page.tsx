'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Bien, Client, Organisation } from '@/types';
import { AxiosError } from 'axios';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(d: string | null | undefined): string {
  if (!d) return '__/__/____';
  return new Date(d).toLocaleDateString('fr-FR');
}

function fmtMontant(m: string): string {
  if (!m) return '______';
  return Number(m).toLocaleString('fr-TN');
}

// ─── Aperçu du contrat ────────────────────────────────────────────────────────

interface PreviewProps {
  form: {
    type: string; forme_juridique: string; representant: string;
    client_id: string; cin_delivree_le: string; bien_id: string;
    montant: string; date_contrat: string; date_debut: string;
    date_fin: string; ville_signature: string;
  };
  organisation: Organisation | null;
  selectedClient: Client | null;
  selectedBien: Bien | null;
}

function Placeholder({ text }: { text: string }) {
  return <span className="text-gray-300 italic">[{text}]</span>;
}

function Val({ v, ph }: { v: string | null | undefined; ph: string }) {
  if (v) return <strong className="text-gray-800">{v}</strong>;
  return <Placeholder text={ph} />;
}

function ContratPreview({ form, organisation, selectedClient, selectedBien }: PreviewProps) {
  const clientAdresse = [selectedClient?.adresse, selectedClient?.ville].filter(Boolean).join(', ');
  const orgAdresse = [organisation?.adresse, organisation?.ville].filter(Boolean).join(', ');
  const bienDescription = selectedBien
    ? `${selectedBien.titre} (${selectedBien.type_bien})`
    : null;
  const bienLocalisation = selectedBien
    ? [selectedBien.adresse, selectedBien.ville].filter(Boolean).join(', ')
    : null;

  const modalites = form.type === 'loyer'
    ? `Ce montant sera versé mensuellement, le premier de chaque mois, pendant toute la durée du contrat (du ${fmtDate(form.date_debut)} au ${fmtDate(form.date_fin)}).`
    : 'Ce montant sera versé en un paiement unique à la date de signature du présent contrat.';

  const natureRelation = form.type === 'loyer'
    ? 'une concession de jouissance temporaire'
    : 'une cession définitive de droits';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="bg-gray-50 border-b border-gray-100 px-5 py-3 flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Aperçu du contrat</span>
        <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${form.type === 'loyer' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
          {form.type === 'loyer' ? 'Location' : 'Vente'}
        </span>
      </div>

      <div className="p-6 text-sm leading-relaxed text-gray-700 font-serif space-y-4 max-h-[85vh] overflow-y-auto">
        {/* En-tête */}
        <p className="text-center font-bold text-base text-gray-800 uppercase tracking-wide border-b border-gray-200 pb-3">
          Contrat de {form.type === 'loyer' ? 'Location' : 'Vente'}
        </p>

        <p className="font-bold text-gray-700">ENTRE LES SOUSSIGNÉS :</p>

        {/* Partie A */}
        <div className="pl-4 border-l-2 border-blue-200">
          <p>
            <strong>1.</strong>{' '}
            <Val v={organisation?.nom} ph="Nom organisation" />,{' '}
            <Val v={form.forme_juridique} ph="Forme juridique" />,{' '}
            dont le siège social est situé à{' '}
            <Val v={orgAdresse || null} ph="Adresse siège" />,{' '}
            représentée par son représentant légal{' '}
            <Val v={form.representant} ph="Représentant légal" />,{' '}
            dûment habilité aux fins des présentes.
          </p>
          <p className="mt-1 text-gray-500 italic">Ci-après dénommée <strong className="not-italic text-gray-700">"La Partie A"</strong>.</p>
        </div>

        <p className="text-center font-bold text-gray-600">ET</p>

        {/* Partie B */}
        <div className="pl-4 border-l-2 border-green-200">
          <p>
            <strong>2.</strong>{' '}
            <Val v={selectedClient ? `${selectedClient.civilite ?? ''} ${selectedClient.nom_complet}`.trim() : null} ph="Civilité + Nom complet" />,{' '}
            né(e) le{' '}
            <Val v={selectedClient?.date_naissance ? fmtDate(selectedClient.date_naissance) : null} ph="Date de naissance" />,{' '}
            titulaire de la CIN n°{' '}
            <Val v={selectedClient?.cin} ph="Numéro CIN" />{' '}
            délivrée le{' '}
            <Val v={form.cin_delivree_le ? fmtDate(form.cin_delivree_le) : null} ph="Date délivrance" />,{' '}
            demeurant à{' '}
            <Val v={clientAdresse || null} ph="Adresse complète" />.
          </p>
          <p className="mt-1 text-gray-500 italic">Ci-après dénommé(e) <strong className="not-italic text-gray-700">"La Partie B"</strong>.</p>
        </div>

        <div className="border-t border-gray-100" />

        {/* Article 1 */}
        <div>
          <p className="font-bold text-gray-800 uppercase text-xs tracking-wide mb-2">Article 1 : Objet de la convention</p>
          <p>
            La Partie A s'engage, par la présente, à transférer à la Partie B, qui accepte,
            l'usage et la détention du bien suivant :
          </p>
          <div className="mt-2 bg-gray-50 rounded-lg p-3 space-y-1">
            <p><span className="text-gray-500">Désignation :</span>{' '}<Val v={bienDescription} ph="Description du bien" /></p>
            <p><span className="text-gray-500">Localisation :</span>{' '}<Val v={bienLocalisation} ph="Adresse ou références" /></p>
          </div>
        </div>

        {/* Article 2 */}
        <div>
          <p className="font-bold text-gray-800 uppercase text-xs tracking-wide mb-2">Article 2 : Prise d'effet</p>
          <p>
            La mise à disposition effective du bien au profit de la Partie B est fixée à la date du{' '}
            <Val v={form.date_debut ? fmtDate(form.date_debut) : null} ph="JJ/MM/AAAA" />.
            À cette date, la Partie B prendra possession du bien dans l'état où il se trouve,
            après avoir effectué un constat contradictoire avec la Partie A.
          </p>
        </div>

        {/* Article 3 */}
        <div>
          <p className="font-bold text-gray-800 uppercase text-xs tracking-wide mb-2">Article 3 : Conditions financières</p>
          <p>En contrepartie de cette mise à disposition, la Partie B s'oblige à verser à la Partie A la somme de :</p>
          <div className="mt-2 bg-gray-50 rounded-lg p-3 space-y-1">
            <p>
              <span className="text-gray-500">{form.type === 'loyer' ? 'Loyer mensuel :' : 'Montant :'}</span>{' '}
              <strong className="text-blue-700">{fmtMontant(form.montant)}</strong>{' '}
              Dinars Tunisiens (TND){form.type === 'loyer' ? '/mois' : ''}.
            </p>
            <p><span className="text-gray-500">Modalités :</span> {modalites}</p>
          </div>
        </div>

        {/* Article 4 */}
        <div>
          <p className="font-bold text-gray-800 uppercase text-xs tracking-wide mb-2">Article 4 : Obligations des parties</p>
          <p>La Partie A garantit que le bien est libre de toute entrave juridique empêchant sa jouissance par la Partie B.</p>
          <p className="mt-1">La Partie B s'engage à utiliser le bien conformément à sa destination et à ne rien faire qui puisse en dégrader la valeur ou la structure.</p>
        </div>

        {/* Article 5 */}
        <div>
          <p className="font-bold text-gray-800 uppercase text-xs tracking-wide mb-2">Article 5 : Nature de la relation</p>
          <p>
            Les parties conviennent que la nature définitive de cette convention est entendue comme{' '}
            <strong>{natureRelation}</strong>.
          </p>
        </div>

        {/* Article 6 */}
        <div>
          <p className="font-bold text-gray-800 uppercase text-xs tracking-wide mb-2">Article 6 : Élection de domicile</p>
          <p>Pour l'exécution du présent contrat et de ses suites, les parties élisent domicile à leurs adresses respectives mentionnées en tête des présentes.</p>
        </div>

        {/* Signature */}
        <div className="border-t border-gray-200 pt-4 mt-4">
          <p>
            Fait à <Val v={form.ville_signature} ph="Ville" />, le{' '}
            <Val v={form.date_contrat ? fmtDate(form.date_contrat) : null} ph="JJ/MM/AAAA" />{' '}
            en deux exemplaires originaux.
          </p>
          <div className="grid grid-cols-2 gap-8 mt-6">
            <div className="text-center">
              <div className="h-12 border-b border-gray-300" />
              <p className="text-xs text-gray-500 mt-2">La Partie A</p>
              <p className="text-xs font-medium text-gray-700">{organisation?.nom ?? ''}</p>
            </div>
            <div className="text-center">
              <div className="h-12 border-b border-gray-300" />
              <p className="text-xs text-gray-500 mt-2">La Partie B</p>
              <p className="text-xs font-medium text-gray-700">{selectedClient?.nom_complet ?? ''}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function NouveauContratPage() {
  const router = useRouter();
  const { organisation } = useAuthStore();

  const [biens, setBiens] = useState<Bien[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [form, setForm] = useState({
    type: 'loyer',
    forme_juridique: '',
    representant: '',
    bien_id: '',
    client_id: '',
    cin_delivree_le: '',
    montant: '',
    date_contrat: new Date().toISOString().split('T')[0],
    date_debut: '',
    date_fin: '',
    ville_signature: '',
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [globalError, setGlobalError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/org/biens?per_page=100'),
      api.get('/org/clients?per_page=100'),
    ]).then(([b, c]) => {
      setBiens(b.data.data ?? []);
      setClients(c.data.data ?? []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (organisation?.ville && !form.ville_signature) {
      setForm(prev => ({ ...prev, ville_signature: organisation.ville ?? '' }));
    }
  }, [organisation]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const selectedClient = clients.find(c => c.id === Number(form.client_id)) ?? null;
  const selectedBien   = biens.find(b => b.id === Number(form.bien_id)) ?? null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setGlobalError('');
    setLoading(true);
    try {
      await api.post('/org/contrats', {
        type:             form.type,
        forme_juridique:  form.forme_juridique || undefined,
        representant:     form.representant || undefined,
        bien_id:          Number(form.bien_id),
        client_ids:       [Number(form.client_id)],
        cin_delivree_le:  form.cin_delivree_le || undefined,
        montant:          Number(form.montant),
        date_contrat:     form.date_contrat || undefined,
        date_debut:       form.date_debut,
        date_fin:         form.type === 'loyer' ? form.date_fin || undefined : undefined,
        ville_signature:  form.ville_signature || undefined,
        notes:            form.notes || undefined,
      });
      router.push('/dashboard/contrats');
    } catch (err) {
      const axiosError = err as AxiosError<{ errors?: Record<string, string[]>; message?: string }>;
      const validationErrors = axiosError.response?.data?.errors;
      if (validationErrors) setErrors(validationErrors);
      else setGlobalError(axiosError.response?.data?.message ?? 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  const err = (field: string) => errors[field] ? (
    <p className="text-red-500 text-xs mt-1">{errors[field][0]}</p>
  ) : null;

  const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
  const disabledCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500';
  const labelCls = 'block text-xs font-medium text-gray-500 mb-1';

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

            {/* Type */}
            <div className="bg-white rounded-xl shadow-sm p-5">
              <label className="block text-sm font-semibold text-gray-700 mb-3">Type de contrat</label>
              <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                {(['loyer', 'vente'] as const).map((t) => (
                  <button key={t} type="button"
                    onClick={() => setForm(prev => ({ ...prev, type: t }))}
                    className={`flex-1 py-2.5 text-sm font-medium transition ${form.type === t ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                    {t === 'loyer' ? '📋 Location' : '🏠 Vente'}
                  </button>
                ))}
              </div>
            </div>

            {/* Partie A */}
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <span className="w-5 h-5 bg-blue-100 text-blue-700 rounded-full text-xs flex items-center justify-center font-bold">A</span>
                Partie A — Organisation
              </h2>
              <div className="space-y-3">
                <div>
                  <label className={labelCls}>Nom de l'organisation</label>
                  <input type="text" value={organisation?.nom ?? ''} disabled className={disabledCls} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Forme juridique</label>
                    <select value={form.forme_juridique} onChange={set('forme_juridique')} className={inputCls}>
                      <option value="">— Sélectionner —</option>
                      {['SARL', 'SUARL', 'SA', 'Association', 'Personne physique', 'Autre'].map(f => (
                        <option key={f}>{f}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Adresse siège</label>
                    <input type="text"
                      value={[organisation?.adresse, organisation?.ville].filter(Boolean).join(', ')}
                      disabled className={disabledCls} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Représentant légal</label>
                  <input type="text" value={form.representant} onChange={set('representant')}
                    placeholder="M. Ahmed Ben Ali"
                    className={inputCls} />
                  {err('representant')}
                </div>
              </div>
            </div>

            {/* Partie B */}
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <span className="w-5 h-5 bg-green-100 text-green-700 rounded-full text-xs flex items-center justify-center font-bold">B</span>
                Partie B — Client
              </h2>
              <div className="space-y-3">
                <div>
                  <label className={labelCls}>Client *</label>
                  <select value={form.client_id} onChange={set('client_id')} className={inputCls}>
                    <option value="">— Sélectionner un client —</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.nom_complet}</option>)}
                  </select>
                  {err('client_ids')}
                </div>

                {selectedClient && (
                  <div className="grid grid-cols-2 gap-3 bg-green-50 rounded-lg p-3">
                    <div>
                      <label className={labelCls}>Date de naissance</label>
                      <input type="text" value={selectedClient.date_naissance ? fmtDate(selectedClient.date_naissance) : '—'} disabled className={disabledCls} />
                    </div>
                    <div>
                      <label className={labelCls}>N° CIN / Passeport</label>
                      <input type="text" value={selectedClient.cin ?? '—'} disabled className={disabledCls} />
                    </div>
                    <div>
                      <label className={labelCls}>CIN délivrée le *</label>
                      <input type="date" value={form.cin_delivree_le} onChange={set('cin_delivree_le')} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Lieu de résidence</label>
                      <input type="text"
                        value={[selectedClient.adresse, selectedClient.ville].filter(Boolean).join(', ') || '—'}
                        disabled className={disabledCls} />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bien */}
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Le Bien *</h2>
              <select value={form.bien_id} onChange={set('bien_id')} className={inputCls}>
                <option value="">— Sélectionner un bien —</option>
                {biens.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.titre} — {b.type_bien}{b.ville ? ` (${b.ville})` : ''}
                  </option>
                ))}
              </select>
              {err('bien_id')}
            </div>

            {/* Conditions financières */}
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-4">Conditions financières</h2>
              <div className="space-y-3">
                <div>
                  <label className={labelCls}>
                    {form.type === 'loyer' ? 'Loyer mensuel (TND) *' : 'Prix de vente (TND) *'}
                  </label>
                  <input type="number" value={form.montant} onChange={set('montant')}
                    placeholder="1500" className={inputCls} />
                  {err('montant')}
                </div>

                <div className={`grid gap-3 ${form.type === 'loyer' ? 'grid-cols-3' : 'grid-cols-2'}`}>
                  <div>
                    <label className={labelCls}>Date du contrat *</label>
                    <input type="date" value={form.date_contrat} onChange={set('date_contrat')} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Prise d'effet *</label>
                    <input type="date" value={form.date_debut} onChange={set('date_debut')} className={inputCls} />
                    {err('date_debut')}
                  </div>
                  {form.type === 'loyer' && (
                    <div>
                      <label className={labelCls}>Date de fin *</label>
                      <input type="date" value={form.date_fin} onChange={set('date_fin')}
                        min={form.date_debut || undefined} className={inputCls} />
                      {err('date_fin')}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Signature & Notes */}
            <div className="bg-white rounded-xl shadow-sm p-5 space-y-3">
              <div>
                <label className={labelCls}>Ville de signature</label>
                <input type="text" value={form.ville_signature} onChange={set('ville_signature')}
                  placeholder="Tunis" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Notes internes</label>
                <textarea value={form.notes} onChange={set('notes')} rows={2} className={inputCls} />
              </div>
            </div>

            {/* Boutons */}
            <div className="flex gap-3 pb-6">
              <button type="submit"
                disabled={loading || !form.client_id || !form.bien_id || !form.date_debut || !form.montant}
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
          <div className="xl:sticky xl:top-6">
            <ContratPreview
              form={form}
              organisation={organisation ?? null}
              selectedClient={selectedClient}
              selectedBien={selectedBien}
            />
          </div>
        </div>
      </form>
    </div>
  );
}
