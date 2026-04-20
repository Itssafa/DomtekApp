'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from '@/components/OrgLink';
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore';
import { Facture, Client, Contrat } from '@/types';
import { AxiosError } from 'axios';
import { FacturePreview, printFacture, type FacturePreviewData } from '@/components/FacturePreview';

const Field = ({ label, value }: { label: string; value?: string | null }) => (
  <div>
    <p className="text-xs text-gray-400 mb-0.5">{label}</p>
    <p className="text-sm text-gray-800 font-medium">{value || '—'}</p>
  </div>
);

const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';

const STATUT_COLORS: Record<string, string> = {
  en_attente: 'bg-yellow-100 text-yellow-700',
  payee:      'bg-green-100 text-green-700',
  en_retard:  'bg-red-100 text-red-600',
};
const STATUT_LABELS: Record<string, string> = {
  en_attente: 'En attente', payee: 'Payée', en_retard: 'En retard',
};
const TYPE_LABELS: Record<string, string> = {
  eau: 'Eau', electricite: 'Électricité', gaz: 'Gaz',
};

export default function EditFacturePage() {
  const { id }   = useParams<{ id: string }>();
  const { organisation } = useAuthStore();
  const [editing, setEditing]   = useState(false);
  const [clients, setClients]   = useState<Client[]>([]);
  const [contrats, setContrats] = useState<Contrat[]>([]);
  const [facture, setFacture]   = useState<Facture | null>(null);
  const [form, setForm] = useState({
    type: 'eau', client_id: '', contrat_id: '', montant: '',
    date_emission: '', date_echeance: '', reference: '', notes: '', statut: 'en_attente',
  });
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchFacture = () => {
    setLoading(true);
    Promise.all([
      api.get<{ data: Facture }>(`/org/factures/${id}`),
      api.get('/org/clients?per_page=100'),
      api.get('/org/contrats?per_page=100'),
    ]).then(([f, c, co]) => {
      const fac = f.data.data;
      setFacture(fac);
      setForm({
        type: fac.type, client_id: String(fac.client?.id ?? ''),
        contrat_id: String(fac.contrat?.id ?? ''), montant: String(fac.montant),
        date_emission: fac.date_emission, date_echeance: fac.date_echeance,
        reference: fac.reference ?? '', notes: fac.notes ?? '', statut: fac.statut,
      });
      setClients(c.data.data ?? []);
      setContrats(co.data.data ?? []);
    }).catch(() => {})
    .finally(() => setLoading(false));
  };

  useEffect(() => { fetchFacture(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSaving(true);
    try {
      await api.put(`/org/factures/${id}`, {
        ...form,
        client_id: Number(form.client_id),
        contrat_id: form.contrat_id ? Number(form.contrat_id) : undefined,
        montant: Number(form.montant),
      });
      setEditing(false);
      fetchFacture();
    } catch (err) {
      const axiosError = err as AxiosError<{ errors?: Record<string, string[]> }>;
      setErrors(axiosError.response?.data?.errors ?? {});
    } finally {
      setSaving(false);
    }
  };

  const selectedClient = clients.find(c => String(c.id) === form.client_id) ?? null;

  const previewData: FacturePreviewData = {
    reference:    form.reference,
    type:         form.type,
    statut:       form.statut,
    montant:      form.montant,
    dateEmission: form.date_emission,
    dateEcheance: form.date_echeance,
    periodeDebut: facture?.periode_debut ?? '',
    periodeFin:   facture?.periode_fin   ?? '',
    notes:        form.notes,
    orgNom:       organisation?.nom       ?? '',
    orgAdresse:   organisation?.adresse   ?? '',
    orgVille:     organisation?.ville     ?? '',
    orgTelephone: organisation?.telephone ?? '',
    orgEmail:     organisation?.email     ?? '',
    clientNom:    selectedClient?.nom_complet ?? '',
    clientAdresse: [selectedClient?.adresse, selectedClient?.ville].filter(Boolean).join(', '),
  };

  if (loading) return <div className="p-8 animate-pulse h-40 bg-gray-100 rounded-xl" />;

  /* ── Vue fiche (lecture seule) ── */
  if (!editing) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <Link href="/dashboard/factures" className="text-sm text-gray-400 hover:text-gray-600">← Retour</Link>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-800">
                {form.reference || `Facture #${id}`}
              </h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUT_COLORS[form.statut] ?? ''}`}>
                {STATUT_LABELS[form.statut] ?? form.statut}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => printFacture('facture-show-doc')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-900 text-white text-sm font-medium rounded-lg transition">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
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
          <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Type" value={TYPE_LABELS[form.type] ?? form.type} />
              <Field label="Montant" value={`${Number(form.montant).toLocaleString('fr-TN')} TND`} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Client" value={selectedClient?.nom_complet} />
              <Field label="Référence" value={form.reference} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Date d'émission" value={fmtDate(form.date_emission)} />
              <Field label="Date d'échéance" value={fmtDate(form.date_echeance)} />
            </div>
          </div>

          <div className="xl:sticky xl:top-6 space-y-3">
            <div className="border border-gray-200 rounded-xl shadow-sm bg-white overflow-hidden">
              <FacturePreview data={previewData} printId="facture-show-doc" />
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
        <Link href="/dashboard/factures" className="text-sm text-gray-400 hover:text-gray-600">← Retour</Link>
        <h1 className="text-2xl font-bold text-gray-800 mt-2">Modifier la facture</h1>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select value={form.type} onChange={set('type')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
                  <option value="eau">Eau</option>
                  <option value="electricite">Électricité</option>
                  <option value="gaz">Gaz</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                <select value={form.statut} onChange={set('statut')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
                  <option value="en_attente">En attente</option>
                  <option value="payee">Payée</option>
                  <option value="en_retard">En retard</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
              <select value={form.client_id} onChange={set('client_id')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
                <option value="">— Sélectionner —</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.nom_complet}</option>)}
              </select>
              {errors.client_id && <p className="text-red-500 text-xs mt-1">{errors.client_id[0]}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Montant (TND)</label>
              <input type="number" step="0.01" value={form.montant} onChange={set('montant')}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date émission</label>
                <input type="date" value={form.date_emission} onChange={set('date_emission')}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date échéance</label>
                <input type="date" value={form.date_echeance} onChange={set('date_echeance')}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Référence</label>
              <input type="text" value={form.reference} onChange={set('reference')}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
            </div>
            <div className="flex gap-3">
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

        <div className="xl:sticky xl:top-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">Aperçu de la facture</span>
            <button type="button" onClick={() => printFacture('facture-edit-doc')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-900 text-white text-sm font-medium rounded-lg transition">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Télécharger PDF
            </button>
          </div>
          <div className="border border-gray-200 rounded-xl shadow-sm bg-white overflow-hidden">
            <FacturePreview data={previewData} printId="facture-edit-doc" />
          </div>
        </div>
      </div>
    </div>
  );
}
