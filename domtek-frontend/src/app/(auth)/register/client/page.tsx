'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { AuthResponse } from '@/types';
import { AxiosError } from 'axios';

export default function RegisterClientPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const [form, setForm] = useState({
    name: '', email: '', password: '', password_confirmation: '',
  });
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    try {
      const { data } = await api.post<AuthResponse>('/auth/register/client', form);
      setAuth(data.token, data.user, data.role);
      router.push('/annonces');
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
      <input type={type} value={(form as Record<string, string>)[field]} onChange={set(field)} placeholder={placeholder} required
        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      {errors[field] && <p className="text-red-500 text-xs mt-1">{errors[field][0]}</p>}
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-10">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-6">
          <Link href="/" className="text-2xl font-bold text-gray-900">Domtek</Link>
          <p className="text-gray-500 text-sm mt-1">Créer un compte client</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {inp('Nom complet', 'name', 'text', 'Ahmed Ben Ali')}
          {inp('Email', 'email', 'email', 'ahmed@email.com')}
          {inp('Mot de passe', 'password', 'password')}
          {inp('Confirmer le mot de passe', 'password_confirmation', 'password')}

          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg text-sm transition">
            {loading ? 'Création…' : 'Créer mon compte'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Déjà un compte ?{' '}
          <Link href="/login" className="text-blue-600 hover:underline font-medium">Se connecter</Link>
        </p>
        <p className="text-center text-sm text-gray-500 mt-2">
          Vous êtes une agence ?{' '}
          <Link href="/register/organisation" className="text-blue-600 hover:underline font-medium">Créer un compte agence</Link>
        </p>
      </div>
    </div>
  );
}
