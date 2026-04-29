'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from '@/components/OrgLink';
import api from '@/lib/api'
import { orgPath } from '@/lib/org-path';
import { useAuthStore } from '@/store/authStore';
import { Contrat } from '@/types';
import { AxiosError } from 'axios';
import { FacturePreview, printFacture, type FacturePreviewData } from '@/components/FacturePreview';

const TYPE_OPTIONS = [
  { value: 'eau',             label: 'Eau' },
  { value: 'electricite_gaz', label: 'Électricité et Gaz' },
];

export default function NouvelleFacturePage() {
  const router = useRouter();
  const { organisation } = useAuthStore();
  const [contrats, setContrats] = useState<Contrat[]>([]);
  const [form, setForm] = useState({
    type:           'eau',
    bien_id:        '',
    client_id:      '',
    montant:        '',
    date_emission:  '',
    date_echeance:  '',
    periode_debut:  '',
    periode_fin:    '',
    reference:      '',
    notes:          '',
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

  const contratsFiltered = useMemo(() => contrats, [contrats]);

  // Biens uniques issus des contrats filtrés
  const biens = useMemo(() => {
    const map = new Map<number, { id: number; designation: string }>();
    contratsFiltered.forEach((c) => {
      if (c.bien?.id) map.set(c.bien.id, {
        id: c.bien.id,
        designation: c.bien.designation ?? c.bien.titre ?? `Bien #${c.bien.id}`,
      });
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
        periode_debut: form.periode_debut || undefined,
        periode_fin:   form.periode_fin   || undefined,
        reference:     form.reference     || undefined,
        notes:         form.notes         || undefined,
      });
      router.push(orgPath('/dashboard/factures'));
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

  const ic = 'w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500';

  const previewData: FacturePreviewData = {
    reference:    form.reference,
    type:         form.type,
    statut:       'en_attente',
    montant:      form.montant,
    dateEmission: form.date_emission,
    dateEcheance: form.date_echeance,
    periodeDebut: form.periode_debut,
    periodeFin:   form.periode_fin,
    notes:        form.notes,
    orgNom:       organisation?.nom       ?? '',
    orgAdresse:   organisation?.adresse   ?? '',
    orgVille:     organisation?.ville     ?? '',
    orgTelephone: organisation?.telephone ?? '',
    orgEmail:     organisation?.email     ?? '',
    clientNom:    selectedContrat?.clients?.find(c => String(c.id) === form.client_id)?.nom_complet ?? '',
    clientAdresse: '',
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link href="/dashboard/factures" className="text-sm text-gray-400 hover:text-gray-600">← Retour</Link>
        <h1 className="text-2xl font-bold text-gray-800 mt-2">Nouvelle facture</h1>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type de facture</label>
            <select value={form.type} onChange={setType} className={ic}>
              {TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Bien */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bien</label>
            <select value={form.bien_id} onChange={setBien} className={ic}>
              <option value="">— Sélectionner un bien —</option>
              {biens.map((b) => (
                <option key={b.id} value={b.id}>{b.designation}</option>
              ))}
            </select>
            {biens.length === 0 && (
              <p className="text-amber-600 text-xs mt-1">Aucun bien avec un contrat actif.</p>
            )}
          </div>

          {/* Client (affiché une fois le bien sélectionné) */}
          {selectedContrat && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
              <select value={form.client_id} onChange={set('client_id')} className={ic}>
                <option value="">— Sélectionner —</option>
                {clientsDisponibles.map((c) => (
                  <option key={c.id} value={c.id}>{c.nom_complet}</option>
                ))}
              </select>
              {err('client_id')}
            </div>
          )}

          {/* Période concernée */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Période concernée
              <span className="text-gray-400 font-normal ml-1 text-xs">(optionnel — ex : facture d&apos;électricité du 01/03 au 31/03)</span>
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Du</label>
                <input type="date" value={form.periode_debut} onChange={set('periode_debut')} className={ic} />
                {err('periode_debut')}
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Au</label>
                <input type="date" value={form.periode_fin} onChange={set('periode_fin')} className={ic} />
                {err('periode_fin')}
              </div>
            </div>
          </div>

          {/* Montant */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Montant (TND)</label>
            <input type="number" step="0.01" value={form.montant} onChange={set('montant')} placeholder="120.50"
              className={ic} />
            {err('montant')}
          </div>

          {/* Dates d'émission / échéance */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date d&apos;émission</label>
              <input type="date" value={form.date_emission} onChange={set('date_emission')} className={ic} />
              {err('date_emission')}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date d&apos;échéance</label>
              <input type="date" value={form.date_echeance} onChange={set('date_echeance')} className={ic} />
              {err('date_echeance')}
            </div>
          </div>

          {/* Référence */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Référence</label>
            <input type="text" value={form.reference} onChange={set('reference')} placeholder="FACT-2025-001"
              className={ic} />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea value={form.notes} onChange={set('notes')} rows={2} className={ic} />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading || !form.bien_id || !form.client_id}
              className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition">
              {loading ? 'Enregistrement…' : 'Créer la facture'}
            </button>
            <Link href="/dashboard/factures"
              className="px-6 py-2.5 border border-gray-300 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition">
              Annuler
            </Link>
          </div>
        </form>
      </div>

      {/* ── Colonne droite : aperçu ── */}
      <div className="xl:sticky xl:top-6 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700">Aperçu de la facture</span>
          <button type="button" onClick={() => printFacture('facture-nouvelle-doc')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-900 text-white text-sm font-medium rounded-lg transition">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Télécharger PDF
          </button>
        </div>
        <div className="border border-gray-200 rounded-xl shadow-sm bg-white overflow-hidden">
          <FacturePreview data={previewData} printId="facture-nouvelle-doc" />
        </div>
      </div>
      </div>{/* fin grid */}
    </div>
  );
}
