'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from '@/components/OrgLink';
import api from '@/lib/api'
import { orgPath } from '@/lib/org-path';
import { useAuthStore } from '@/store/authStore';
import { Facture, Client, Contrat } from '@/types';
import { AxiosError } from 'axios';
import { FacturePreview, printFacture, type FacturePreviewData } from '@/components/FacturePreview';

export default function EditFacturePage() {
  const { id }   = useParams<{ id: string }>();
  const router   = useRouter();
  const { organisation } = useAuthStore();
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

  useEffect(() => {
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
  }, [id]);

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
      router.push(orgPath('/dashboard/factures'));
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
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="eau">Eau</option>
                <option value="electricite">Électricité</option>
                <option value="gaz">Gaz</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
              <select value={form.statut} onChange={set('statut')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="en_attente">En attente</option>
                <option value="payee">Payée</option>
                <option value="en_retard">En retard</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
            <select value={form.client_id} onChange={set('client_id')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">— Sélectionner —</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.nom_complet}</option>)}
            </select>
            {errors.client_id && <p className="text-red-500 text-xs mt-1">{errors.client_id[0]}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Montant (TND)</label>
            <input type="number" step="0.01" value={form.montant} onChange={set('montant')}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date émission</label>
              <input type="date" value={form.date_emission} onChange={set('date_emission')}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date échéance</label>
              <input type="date" value={form.date_echeance} onChange={set('date_echeance')}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Référence</label>
            <input type="text" value={form.reference} onChange={set('reference')}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <button type="submit" disabled={saving}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition">
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </form>
      </div>

      {/* ── Colonne droite : aperçu ── */}
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
      </div>{/* fin grid */}
    </div>
  );
}
