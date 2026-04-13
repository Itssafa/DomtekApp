'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from '@/components/OrgLink';
import api from '@/lib/api'
import { orgPath } from '@/lib/org-path';
import { Employe } from '@/types';
import { AxiosError } from 'axios';

export default function EditEmployePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [form, setForm] = useState({
    nom: '', prenom: '', email: '', telephone: '',
    poste: '', date_embauche: '', statut: 'actif',
  });
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get<{ data: Employe }>(`/org/employes/${id}`)
      .then(({ data }) => {
        const e = data.data;
        setForm({
          nom: e.nom, prenom: e.prenom, email: e.email ?? '',
          telephone: e.telephone ?? '', poste: e.poste ?? '',
          date_embauche: e.date_embauche ?? '', statut: e.statut,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const set = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSaving(true);
    try {
      await api.put(`/org/employes/${id}`, form);
      router.push(orgPath('/dashboard/employes'));
    } catch (err) {
      const axiosError = err as AxiosError<{ errors?: Record<string, string[]> }>;
      setErrors(axiosError.response?.data?.errors ?? {});
    } finally {
      setSaving(false);
    }
  };

  const inp = (label: string, field: string, type = 'text') => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input type={type} value={(form as Record<string, string>)[field]} onChange={set(field)}
        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      {errors[field] && <p className="text-red-500 text-xs mt-1">{errors[field][0]}</p>}
    </div>
  );

  if (loading) return <div className="p-8 animate-pulse h-40 bg-gray-100 rounded-xl" />;

  return (
    <div className="p-8 max-w-xl">
      <div className="mb-6">
        <Link href="/dashboard/employes" className="text-sm text-gray-400 hover:text-gray-600">← Retour</Link>
        <h1 className="text-2xl font-bold text-gray-800 mt-2">Modifier l'employé</h1>
      </div>
      <div className="bg-white rounded-xl shadow-sm p-6">
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            {inp('Nom', 'nom')}
            {inp('Prénom', 'prenom')}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {inp('Email', 'email', 'email')}
            {inp('Téléphone', 'telephone', 'tel')}
          </div>
          {inp('Poste', 'poste')}
          <div className="grid grid-cols-2 gap-4">
            {inp("Date d'embauche", 'date_embauche', 'date')}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
              <select value={form.statut} onChange={set('statut')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="actif">Actif</option>
                <option value="inactif">Inactif</option>
              </select>
            </div>
          </div>
          <button type="submit" disabled={saving}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition">
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </form>
      </div>
    </div>
  );
}
