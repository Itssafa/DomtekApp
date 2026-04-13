'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from '@/components/OrgLink';
import api from '@/lib/api'
import { orgPath } from '@/lib/org-path';
import { Contrat, EtatLieu } from '@/types';
import { AxiosError } from 'axios';

export default function EditEtatLieuPage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();

  const [etatLieu, setEtatLieu] = useState<EtatLieu | null>(null);
  const [contrats, setContrats] = useState<Contrat[]>([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [errors, setErrors]     = useState<Record<string, string[]>>({});
  const [globalError, setGlobalError] = useState('');

  const [form, setForm] = useState({
    contrat_id:          '',
    designation:         '',
    type:                'entree',
    date:                '',
    releve_eau:          '',
    releve_electricite:  '',
    releve_gaz:          '',
    remise_cles:         false,
    commentaire:         '',
  });

  useEffect(() => {
    Promise.all([
      api.get<{ data: EtatLieu }>(`/org/etat-lieux/${id}`),
      api.get('/org/contrats?per_page=200'),
    ]).then(([el, c]) => {
      const e = el.data.data;
      setEtatLieu(e);
      setForm({
        contrat_id:         String(e.contrat?.id ?? ''),
        designation:        e.designation ?? '',
        type:               e.type,
        date:               e.date,
        releve_eau:         e.releve_eau != null ? String(e.releve_eau) : '',
        releve_electricite: e.releve_electricite != null ? String(e.releve_electricite) : '',
        releve_gaz:         e.releve_gaz != null ? String(e.releve_gaz) : '',
        remise_cles:        e.remise_cles,
        commentaire:        e.commentaire ?? '',
      });
      setContrats(c.data.data ?? []);
    }).catch(() => {})
    .finally(() => setLoading(false));
  }, [id]);

  const set = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm(p => ({ ...p, [field]: e.target.value }));

  const selectedContrat = contrats.find(c => c.id === Number(form.contrat_id)) ?? null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setGlobalError('');
    setSaving(true);
    try {
      await api.put(`/org/etat-lieux/${id}`, {
        contrat_id:         Number(form.contrat_id),
        designation:        form.designation || undefined,
        type:               form.type,
        date:               form.date,
        releve_eau:         form.releve_eau ? Number(form.releve_eau) : null,
        releve_electricite: form.releve_electricite ? Number(form.releve_electricite) : null,
        releve_gaz:         form.releve_gaz ? Number(form.releve_gaz) : null,
        remise_cles:        form.remise_cles,
        commentaire:        form.commentaire || undefined,
      });
      router.push(orgPath('/dashboard/etat-lieux'));
    } catch (err) {
      const ae = err as AxiosError<{ errors?: Record<string, string[]>; message?: string }>;
      if (ae.response?.data?.errors) setErrors(ae.response.data.errors);
      else setGlobalError(ae.response?.data?.message ?? 'Une erreur est survenue.');
    } finally {
      setSaving(false);
    }
  };

  const errMsg = (f: string) => errors[f]
    ? <p className="text-red-500 text-xs mt-1">{errors[f][0]}</p>
    : null;

  const ic = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
  const lc = 'block text-xs font-medium text-gray-500 mb-1';

  if (loading) return <div className="p-8 animate-pulse h-40 bg-gray-100 rounded-xl" />;

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <Link href="/dashboard/etat-lieux" className="text-sm text-gray-400 hover:text-gray-600">← Retour</Link>
        <h1 className="text-2xl font-bold text-gray-800 mt-2">Modifier l'état des lieux</h1>
        {etatLieu?.designation && (
          <p className="text-gray-400 text-sm mt-0.5">{etatLieu.designation}</p>
        )}
      </div>

      {globalError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{globalError}</div>
      )}

      <form onSubmit={handleSave} className="space-y-4">

        {/* ── Identification ── */}
        <div className="bg-white rounded-xl shadow-sm p-5 space-y-3">
          <h2 className="text-sm font-semibold text-gray-700">Identification</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lc}>Type *</label>
              <select value={form.type} onChange={set('type')} className={ic}>
                <option value="entree">État d'entrée</option>
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
          </div>
        </div>

        {/* ── Contrat lié ── */}
        <div className="bg-white rounded-xl shadow-sm p-5 space-y-3">
          <h2 className="text-sm font-semibold text-gray-700">Contrat de location *</h2>
          <div>
            <select value={form.contrat_id} onChange={set('contrat_id')} className={ic}>
              <option value="">— Sélectionner un contrat —</option>
              {contrats.map(c => (
                <option key={c.id} value={c.id}>
                  {c.designation ?? `Contrat #${c.id}`}
                  {c.bien ? ` — ${c.bien.designation}` : ''}
                </option>
              ))}
            </select>
            {errMsg('contrat_id')}
          </div>
          {selectedContrat && (
            <div className="bg-blue-50 rounded-lg p-3 text-xs space-y-1 text-gray-600">
              <p><span className="font-medium">Bien :</span> {selectedContrat.bien?.designation ?? '—'}</p>
              <p><span className="font-medium">Client(s) :</span> {selectedContrat.clients?.map(c => c.nom_complet).join(', ') ?? '—'}</p>
              <p><span className="font-medium">Début :</span> {new Date(selectedContrat.date_debut).toLocaleDateString('fr-FR')}</p>
            </div>
          )}
        </div>

        {/* ── Relevés de compteurs ── */}
        <div className="bg-white rounded-xl shadow-sm p-5 space-y-3">
          <h2 className="text-sm font-semibold text-gray-700">Relevés de compteurs</h2>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={lc}>Compteur eau (m³)</label>
              <input type="number" step="0.001" min="0" value={form.releve_eau} onChange={set('releve_eau')}
                placeholder="0.000" className={ic} />
              {errMsg('releve_eau')}
            </div>
            <div>
              <label className={lc}>Compteur électricité (kWh)</label>
              <input type="number" step="0.001" min="0" value={form.releve_electricite} onChange={set('releve_electricite')}
                placeholder="0.000" className={ic} />
              {errMsg('releve_electricite')}
            </div>
            <div>
              <label className={lc}>Compteur gaz (m³)</label>
              <input type="number" step="0.001" min="0" value={form.releve_gaz} onChange={set('releve_gaz')}
                placeholder="0.000" className={ic} />
              {errMsg('releve_gaz')}
            </div>
          </div>
        </div>

        {/* ── Remise des clés & Commentaire ── */}
        <div className="bg-white rounded-xl shadow-sm p-5 space-y-3">
          <h2 className="text-sm font-semibold text-gray-700">Remise des clés & Commentaire</h2>
          <div>
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <button
                type="button"
                onClick={() => setForm(p => ({ ...p, remise_cles: !p.remise_cles }))}
                className={`w-10 h-6 rounded-full transition-colors ${form.remise_cles ? 'bg-green-500' : 'bg-gray-300'} relative`}
              >
                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.remise_cles ? 'left-5' : 'left-1'}`} />
              </button>
              <span className="text-sm text-gray-700">
                {form.remise_cles ? 'Clés remises au locataire' : 'Clés non remises'}
              </span>
            </label>
          </div>
          <div>
            <label className={lc}>Commentaire</label>
            <textarea value={form.commentaire} onChange={set('commentaire')} rows={4}
              placeholder="Observations, état général du bien, réserves éventuelles…"
              className={ic} />
          </div>
        </div>

        {/* ── Actions ── */}
        <div className="flex gap-3 pb-6">
          <button type="submit" disabled={saving}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition">
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
          <Link href="/dashboard/etat-lieux"
            className="px-6 py-2.5 border border-gray-300 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition">
            Annuler
          </Link>
        </div>
      </form>
    </div>
  );
}
