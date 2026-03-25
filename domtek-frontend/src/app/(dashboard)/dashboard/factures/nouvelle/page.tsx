'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Contrat } from '@/types';
import { AxiosError } from 'axios';

const TYPE_OPTIONS = [
  { value: 'eau',             label: 'Eau' },
  { value: 'electricite_gaz', label: 'Électricité et Gaz' },
  { value: 'loyer',           label: 'Loyer' },
];

export default function NouvelleFacturePage() {
  const router = useRouter();
  const [contrats, setContrats] = useState<Contrat[]>([]);
  const [form, setForm] = useState({
    type: 'eau',
    bien_id: '',
    client_id: '',
    montant: '',
    date_emission: '',
    date_echeance: '',
    reference: '',
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/org/contrats?statut=actif&per_page=200')
      .then((res) => setContrats(res.data.data ?? []))
      .catch(() => {});
  }, []);

  const set = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  // Changer le type remet à zéro le bien et le client
  const setType = (e: React.ChangeEvent<HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, type: e.target.value, bien_id: '', client_id: '' }));

  // Changer le bien remet à zéro le client
  const setBien = (e: React.ChangeEvent<HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, bien_id: e.target.value, client_id: '' }));

  // Contrats filtrés selon le type de facture
  const contratsFiltered = useMemo(() => {
    if (form.type === 'loyer') return contrats.filter((c) => c.type === 'loyer');
    // eau / electricite_gaz : tous les contrats actifs (loyer + vente)
    return contrats;
  }, [form.type, contrats]);

  // Biens uniques issus des contrats filtrés
  const biens = useMemo(() => {
    const map = new Map<number, { id: number; titre: string }>();
    contratsFiltered.forEach((c) => {
      if (c.bien?.id) map.set(c.bien.id, { id: c.bien.id, titre: c.bien.titre });
    });
    return Array.from(map.values());
  }, [contratsFiltered]);

  // Contrat correspondant au bien sélectionné
  const selectedContrat = useMemo(
    () => contratsFiltered.find((c) => c.bien?.id === Number(form.bien_id)) ?? null,
    [form.bien_id, contratsFiltered]
  );

  const clientsDisponibles = selectedContrat?.clients ?? [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    try {
      await api.post('/org/factures', {
        type:          form.type,
        client_id:     Number(form.client_id),
        contrat_id:    selectedContrat?.id ?? undefined,
        montant:       Number(form.montant),
        date_emission: form.date_emission,
        date_echeance: form.date_echeance,
        reference:     form.reference || undefined,
        notes:         form.notes || undefined,
      });
      router.push('/dashboard/factures');
    } catch (err) {
      const axiosError = err as AxiosError<{ errors?: Record<string, string[]> }>;
      setErrors(axiosError.response?.data?.errors ?? {});
    } finally {
      setLoading(false);
    }
  };

  const err = (field: string) => errors[field]
    ? <p className="text-red-500 text-xs mt-1">{errors[field][0]}</p>
    : null;

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <Link href="/dashboard/factures" className="text-sm text-gray-400 hover:text-gray-600">← Retour</Link>
        <h1 className="text-2xl font-bold text-gray-800 mt-2">Nouvelle facture</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type de facture</label>
            <select value={form.type} onChange={setType}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Bien */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bien</label>
            <select value={form.bien_id} onChange={setBien}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">— Sélectionner un bien —</option>
              {biens.map((b) => (
                <option key={b.id} value={b.id}>{b.titre}</option>
              ))}
            </select>
            {biens.length === 0 && (
              <p className="text-amber-600 text-xs mt-1">
                Aucun bien avec un contrat{form.type === 'loyer' ? ' de location' : ''} actif.
              </p>
            )}
          </div>

          {/* Client (affiché une fois le bien sélectionné) */}
          {selectedContrat && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
              <select value={form.client_id} onChange={set('client_id')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">— Sélectionner —</option>
                {clientsDisponibles.map((c) => (
                  <option key={c.id} value={c.id}>{c.nom_complet}</option>
                ))}
              </select>
              {err('client_id')}
            </div>
          )}

          {/* Montant */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Montant (TND)</label>
            <input type="number" step="0.01" value={form.montant} onChange={set('montant')} placeholder="120.50"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            {err('montant')}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date d'émission</label>
              <input type="date" value={form.date_emission} onChange={set('date_emission')}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              {err('date_emission')}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date d'échéance</label>
              <input type="date" value={form.date_echeance} onChange={set('date_echeance')}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              {err('date_echeance')}
            </div>
          </div>

          {/* Référence */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Référence</label>
            <input type="text" value={form.reference} onChange={set('reference')} placeholder="FACT-2025-001"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea value={form.notes} onChange={set('notes')} rows={2}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading || !form.bien_id || !form.client_id}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition">
              {loading ? 'Enregistrement…' : 'Créer la facture'}
            </button>
            <Link href="/dashboard/factures"
              className="px-6 py-2.5 border border-gray-300 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition">
              Annuler
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
