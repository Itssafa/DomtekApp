'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Bien, Client } from '@/types';
import { AxiosError } from 'axios';

export default function NouveauContratPage() {
  const router = useRouter();
  const [biens, setBiens] = useState<Bien[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [form, setForm] = useState({
    type: 'loyer', bien_id: '',
    montant: '', date_debut: '', date_fin: '', notes: '',
  });
  const [clientIds, setClientIds] = useState<number[]>([]);
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

  const set = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const addClient = (id: number) => {
    if (id && !clientIds.includes(id)) setClientIds((prev) => [...prev, id]);
  };

  const removeClient = (id: number) => setClientIds((prev) => prev.filter((cid) => cid !== id));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setGlobalError('');
    setLoading(true);
    try {
      await api.post('/org/contrats', {
        ...form,
        bien_id: Number(form.bien_id),
        client_ids: clientIds,
        montant: Number(form.montant),
        date_fin: form.type === 'loyer' ? form.date_fin || undefined : undefined,
      });
      router.push('/dashboard/contrats');
    } catch (err) {
      const axiosError = err as AxiosError<{ errors?: Record<string, string[]>; message?: string }>;
      const validationErrors = axiosError.response?.data?.errors;
      if (validationErrors) {
        setErrors(validationErrors);
      } else {
        setGlobalError(axiosError.response?.data?.message ?? 'Une erreur est survenue. Vérifiez que la migration a été exécutée (`php artisan migrate`).');
      }
    } finally {
      setLoading(false);
    }
  };

  const err = (field: string) => errors[field] ? (
    <p className="text-red-500 text-xs mt-1">{errors[field][0]}</p>
  ) : null;

  const selectedClients = clients.filter((c) => clientIds.includes(c.id));
  const availableClients = clients.filter((c) => !clientIds.includes(c.id));

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <Link href="/dashboard/contrats" className="text-sm text-gray-400 hover:text-gray-600">← Retour</Link>
        <h1 className="text-2xl font-bold text-gray-800 mt-2">Nouveau contrat</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        {globalError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {globalError}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select value={form.type} onChange={set('type')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="loyer">Location</option>
              <option value="vente">Vente</option>
            </select>
          </div>

          {/* Bien */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bien</label>
            <select value={form.bien_id} onChange={set('bien_id')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">— Sélectionner —</option>
              {biens.map((b) => <option key={b.id} value={b.id}>{b.titre} ({b.ville})</option>)}
            </select>
            {err('bien_id')}
          </div>

          {/* Clients impliqués */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Clients impliqués
              <span className="ml-1 text-xs font-normal text-gray-400">(acheteur·s / locataire·s)</span>
            </label>

            {/* Tags des clients sélectionnés */}
            {selectedClients.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-2">
                {selectedClients.map((c) => (
                  <span key={c.id}
                    className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-xs font-medium px-3 py-1 rounded-full">
                    {c.nom_complet}
                    <button type="button" onClick={() => removeClient(c.id)}
                      className="hover:text-red-500 transition-colors font-bold leading-none">×</button>
                  </span>
                ))}
              </div>
            )}

            {/* Select d'ajout */}
            {availableClients.length > 0 && (
              <select
                value=""
                onChange={(e) => { addClient(Number(e.target.value)); e.target.value = ''; }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">+ Ajouter un client…</option>
                {availableClients.map((c) => (
                  <option key={c.id} value={c.id}>{c.nom_complet}</option>
                ))}
              </select>
            )}

            {clientIds.length === 0 && (
              <p className="text-xs text-gray-400 mt-1">Sélectionnez au moins un client.</p>
            )}
            {err('client_ids')}
          </div>

          {/* Montant */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Montant (TND)</label>
            <input type="number" value={form.montant} onChange={set('montant')} placeholder="1500"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            {err('montant')}
          </div>

          {/* Dates */}
          <div className={`grid gap-4 ${form.type === 'loyer' ? 'grid-cols-2' : 'grid-cols-1'}`}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date début</label>
              <input type="date" value={form.date_debut} onChange={set('date_debut')}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              {err('date_debut')}
            </div>

            {form.type === 'loyer' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date fin <span className="text-red-500 text-xs font-normal">*</span>
                </label>
                <input type="date" value={form.date_fin} onChange={set('date_fin')}
                  min={form.date_debut || undefined}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                {err('date_fin')}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea value={form.notes} onChange={set('notes')} rows={3}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading || clientIds.length === 0}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition">
              {loading ? 'Enregistrement…' : 'Créer le contrat'}
            </button>
            <Link href="/dashboard/contrats"
              className="px-6 py-2.5 border border-gray-300 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition">
              Annuler
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
