'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { AxiosError } from 'axios';

export default function NouvelEmployePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    nom: '', prenom: '', email: '', telephone: '',
    poste: '', date_embauche: '', statut: 'actif',
  });
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);

  const set = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    try {
      await api.post('/org/employes', form);
      router.push('/dashboard/employes');
    } catch (err) {
      const axiosError = err as AxiosError<{ errors?: Record<string, string[]> }>;
      setErrors(axiosError.response?.data?.errors ?? {});
    } finally {
      setLoading(false);
    }
  };

  const inp = (label: string, field: string, type = 'text', placeholder = '') => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input type={type} value={(form as Record<string, string>)[field]} onChange={set(field)} placeholder={placeholder}
        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      {errors[field] && <p className="text-red-500 text-xs mt-1">{errors[field][0]}</p>}
    </div>
  );

  return (
    <div className="p-8 max-w-xl">
      <div className="mb-6">
        <Link href="/dashboard/employes" className="text-sm text-gray-400 hover:text-gray-600">← Retour</Link>
        <h1 className="text-2xl font-bold text-gray-800 mt-2">Nouvel employé</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            {inp('Nom', 'nom', 'text', 'Ben Ali')}
            {inp('Prénom', 'prenom', 'text', 'Sonia')}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {inp('Email', 'email', 'email', 'sonia@agence.tn')}
            {inp('Téléphone', 'telephone', 'tel', '+216 22 000 000')}
          </div>
          {inp('Poste', 'poste', 'text', 'Agent immobilier')}
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
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition">
              {loading ? 'Enregistrement…' : "Créer l'employé"}
            </button>
            <Link href="/dashboard/employes"
              className="px-6 py-2.5 border border-gray-300 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition">
              Annuler
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
