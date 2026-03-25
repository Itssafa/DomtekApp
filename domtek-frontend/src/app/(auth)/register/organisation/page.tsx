'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { AxiosError } from 'axios';

interface FormState {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  nom_organisation: string;
  ville: string;
  telephone: string;
  email_organisation: string;
  description: string;
}

export default function RegisterOrganisationPage() {
  const router = useRouter();

  const [form, setForm] = useState<FormState>({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    nom_organisation: '',
    ville: '',
    telephone: '',
    email_organisation: '',
    description: '',
  });

  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);

  const set = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      await api.post('/auth/register/organisation', form);
      router.push('/en-attente');
    } catch (err) {
      const axiosError = err as AxiosError<{ errors?: Record<string, string[]> }>;
      setErrors(axiosError.response?.data?.errors ?? {});
    } finally {
      setLoading(false);
    }
  };

  const field = (label: string, name: keyof FormState, type = 'text', placeholder = '') => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={form[name]}
        onChange={set(name)}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {errors[name] && <p className="text-red-500 text-xs mt-1">{errors[name][0]}</p>}
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-10">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">
          Créer un compte agence
        </h1>
        <p className="text-center text-gray-500 mb-6 text-sm">
          Votre compte sera activé après validation par un administrateur.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Responsable</p>
          {field('Nom complet', 'name', 'text', 'Ahmed Ben Ali')}
          {field('Email de connexion', 'email', 'email', 'admin@agence.tn')}
          {field('Mot de passe', 'password', 'password')}
          {field('Confirmer le mot de passe', 'password_confirmation', 'password')}

          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider pt-2">Agence</p>
          {field("Nom de l'agence", 'nom_organisation', 'text', 'Agence Soleil Immobilier')}
          {field('Ville', 'ville', 'text', 'Tunis')}
          {field('Téléphone', 'telephone', 'tel', '+216 71 000 000')}
          {field("Email de l'agence", 'email_organisation', 'email', 'contact@agence.tn')}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={set('description')}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Présentez votre agence..."
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg text-sm transition"
          >
            {loading ? 'Envoi en cours...' : 'Créer mon compte'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Déjà un compte ?{' '}
          <Link href="/login" className="text-blue-600 hover:underline font-medium">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
