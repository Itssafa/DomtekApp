'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Contrat, Bien } from '@/types';
import { AxiosError } from 'axios';

export default function EditContratPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [biens, setBiens] = useState<Bien[]>([]);
  const [contrat, setContrat] = useState<Contrat | null>(null);
  const [form, setForm] = useState({
    type: 'loyer', bien_id: '', montant: '',
    date_debut: '', date_fin: '', statut: 'actif', notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchAll = () => {
    setLoading(true);
    Promise.all([
      api.get<{ data: Contrat }>(`/org/contrats/${id}`),
      api.get('/org/biens?per_page=100'),
    ]).then(([c, b]) => {
      const contrat = c.data.data;
      setContrat(contrat);
      setForm({
        type: contrat.type,
        bien_id: String(contrat.bien?.id ?? ''),
        montant: String(contrat.montant),
        date_debut: contrat.date_debut,
        date_fin: contrat.date_fin ?? '',
        statut: contrat.statut,
        notes: contrat.notes ?? '',
      });
      setBiens(b.data.data ?? []);
    }).catch(() => {})
    .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSaving(true);
    try {
      await api.put(`/org/contrats/${id}`, {
        ...form,
        bien_id: Number(form.bien_id),
        montant: Number(form.montant),
        date_fin: form.date_fin || undefined,
      });
      router.push('/dashboard/contrats');
    } catch (err) {
      const axiosError = err as AxiosError<{ errors?: Record<string, string[]> }>;
      setErrors(axiosError.response?.data?.errors ?? {});
    } finally {
      setSaving(false);
    }
  };

  const handleUploadFichier = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('fichier', file);
    try {
      await api.post(`/org/contrats/${id}/fichier`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      fetchAll();
    } catch { /* noop */ }
    finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  if (loading) return <div className="p-8 animate-pulse h-40 bg-gray-100 rounded-xl" />;

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <Link href="/dashboard/contrats" className="text-sm text-gray-400 hover:text-gray-600">← Retour</Link>
        <h1 className="text-2xl font-bold text-gray-800 mt-2">Modifier le contrat</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select value={form.type} onChange={set('type')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="loyer">Location</option>
                <option value="vente">Vente</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
              <select value={form.statut} onChange={set('statut')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="actif">Actif</option>
                <option value="termine">Terminé</option>
                <option value="resilie">Résilié</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bien</label>
            <select value={form.bien_id} onChange={set('bien_id')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">— Sélectionner —</option>
              {biens.map((b) => <option key={b.id} value={b.id}>{b.titre}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Clients</label>
            <div className="flex flex-wrap gap-2 min-h-[42px] border border-gray-200 rounded-lg px-3 py-2 bg-gray-50">
              {contrat?.clients?.length ? contrat.clients.map((c) => (
                <span key={c.id} className="inline-block bg-blue-50 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-full">
                  {c.nom_complet}
                </span>
              )) : <span className="text-sm text-gray-400">—</span>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Montant (TND)</label>
            <input type="number" value={form.montant} onChange={set('montant')}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            {errors.montant && <p className="text-red-500 text-xs mt-1">{errors.montant[0]}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date début</label>
              <input type="date" value={form.date_debut} onChange={set('date_debut')}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date fin</label>
              <input type="date" value={form.date_fin} onChange={set('date_fin')}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea value={form.notes} onChange={set('notes')} rows={3}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <button type="submit" disabled={saving}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition">
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </form>
      </div>

      {/* Fichier PDF */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Fichier contrat (PDF)</h2>
        {contrat?.fichier ? (
          <p className="text-sm text-green-600 mb-3">✓ Fichier attaché</p>
        ) : (
          <p className="text-sm text-gray-400 mb-3">Aucun fichier.</p>
        )}
        <label className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg cursor-pointer transition inline-block">
          {uploading ? 'Upload…' : 'Remplacer le fichier'}
          <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={handleUploadFichier} />
        </label>
      </div>
    </div>
  );
}
