'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from '@/components/OrgLink';
import api from '@/lib/api';
import { orgPath } from '@/lib/org-path';
import { useAuthStore } from '@/store/authStore';
import { Contrat } from '@/types';
import { AxiosError } from 'axios';
import { FacturePreview, printFacture, type FacturePreviewData } from '@/components/FacturePreview';
import StepForm, { FormStep } from '@/components/StepForm';
import { isPositiveAmount } from '@/lib/validation';

const TYPE_OPTIONS = [
  { value: 'eau',             label: 'Eau' },
  { value: 'electricite_gaz', label: 'Électricité et Gaz' },
];

export default function NouvelleFacturePage() {
  const router = useRouter();
  const { organisation } = useAuthStore();
  const [contrats, setContrats] = useState<Contrat[]>([]);
  const [form, setForm] = useState({
    type: 'eau', bien_id: '', client_id: '',
    montant: '', date_emission: '', date_echeance: '',
    periode_debut: '', periode_fin: '', reference: '', notes: '',
  });
  const [errors, setErrors]   = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/org/contrats?statut=actif&per_page=200')
      .then((res) => setContrats(res.data.data ?? [])).catch(() => {});
  }, []);

  const set = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const setType = (e: React.ChangeEvent<HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, type: e.target.value, bien_id: '', client_id: '' }));

  const setBien = (e: React.ChangeEvent<HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, bien_id: e.target.value, client_id: '' }));

  const biens = useMemo(() => {
    const map = new Map<number, { id: number; designation: string }>();
    contrats.forEach((c) => {
      if (c.bien?.id) map.set(c.bien.id, {
        id: c.bien.id,
        designation: c.bien.designation ?? c.bien.designation ?? `Bien #${c.bien.id}`,
      });
    });
    return Array.from(map.values());
  }, [contrats]);

  const selectedContrat = useMemo(
    () => contrats.find((c) => c.bien?.id === Number(form.bien_id)) ?? null,
    [form.bien_id, contrats],
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
    ? <p className="text-red-500 text-xs mt-1">{errors[field][0]}</p> : null;

  const ic = 'w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500';

  const previewData: FacturePreviewData = {
    reference: form.reference, type: form.type, statut: 'en_attente',
    montant: form.montant, dateEmission: form.date_emission, dateEcheance: form.date_echeance,
    periodeDebut: form.periode_debut, periodeFin: form.periode_fin, notes: form.notes,
    orgNom: organisation?.nom ?? '', orgAdresse: organisation?.adresse ?? '',
    orgVille: organisation?.ville ?? '', orgTelephone: organisation?.telephone ?? '',
    orgEmail: organisation?.email ?? '',
    clientNom: selectedContrat?.clients?.find(c => String(c.id) === form.client_id)?.nom_complet ?? '',
    clientAdresse: '',
  };

  const steps: FormStep[] = [
    {
      title: 'Bien & Client',
      validate: () => {
        if (!form.bien_id)   return 'Veuillez sélectionner un bien.';
        if (!form.client_id) return 'Veuillez sélectionner un client.';
        return null;
      },
      content: (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type de facture</label>
            <select value={form.type} onChange={setType} className={ic}>
              {TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bien *</label>
            <select value={form.bien_id} onChange={setBien} className={ic}>
              <option value="">— Sélectionner un bien —</option>
              {biens.map((b) => <option key={b.id} value={b.id}>{b.designation}</option>)}
            </select>
            {biens.length === 0 && <p className="text-amber-600 text-xs mt-1">Aucun bien avec un contrat actif.</p>}
          </div>
          {selectedContrat && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client *</label>
              <select value={form.client_id} onChange={set('client_id')} className={ic}>
                <option value="">— Sélectionner —</option>
                {clientsDisponibles.map((c) => <option key={c.id} value={c.id}>{c.nom_complet}</option>)}
              </select>
              {err('client_id')}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Période concernée
              <span className="text-gray-400 font-normal ml-1 text-xs">(optionnel)</span>
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Du</label>
                <input type="date" value={form.periode_debut} onChange={set('periode_debut')} className={ic} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Au</label>
                <input type="date" value={form.periode_fin} onChange={set('periode_fin')} className={ic} min={form.periode_debut || undefined} />
              </div>
            </div>
          </div>
        </>
      ),
    },
    {
      title: 'Montant & Dates',
      validate: () => {
        if (!form.montant)       return 'Le montant est obligatoire.';
        if (!isPositiveAmount(form.montant)) return 'Le montant doit être supérieur à 0.';
        if (!form.date_emission) return "La date d'émission est obligatoire.";
        if (!form.date_echeance) return "La date d'échéance est obligatoire.";
        return null;
      },
      content: (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Montant (TND) *</label>
            <input type="number" step="0.01" min="0" value={form.montant} onChange={set('montant')} placeholder="120.50" className={ic} />
            {err('montant')}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date d'émission *</label>
              <input type="date" value={form.date_emission} onChange={set('date_emission')} className={ic} />
              {err('date_emission')}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date d'échéance *</label>
              <input type="date" value={form.date_echeance} onChange={set('date_echeance')} className={ic} min={form.date_emission || undefined} />
              {err('date_echeance')}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Référence</label>
            <input type="text" value={form.reference} onChange={set('reference')} placeholder="FACT-2025-001" className={ic} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea value={form.notes} onChange={set('notes')} rows={2} className={ic} />
          </div>
        </>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link href="/dashboard/factures" className="text-sm text-gray-400 hover:text-gray-600">← Retour</Link>
        <h1 className="text-2xl font-bold text-gray-800 mt-2">Nouvelle facture</h1>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        <StepForm
          steps={steps}
          onSubmit={handleSubmit}
          submitLabel="Créer la facture"
          loading={loading}
          cancelHref="/dashboard/factures"
        />

        {/* ── Aperçu (toujours visible) ── */}
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
      </div>
    </div>
  );
}
