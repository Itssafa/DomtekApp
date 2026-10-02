'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { AuthResponse } from '@/types';
import { AxiosError } from 'axios';
import { GoogleAuthButton } from '@/components/GoogleAuthButton';
import { isValidEmail } from '@/lib/validation';

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const [form, setForm]               = useState({ email: '', password: '' });
  const [error, setError]             = useState('');
  const [loading, setLoading]         = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!isValidEmail(form.email)) {
      setError("Adresse e-mail invalide.");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post<AuthResponse>('/auth/login', form);
      setAuth(data.token, data.user, data.role, data.organisation);
      if (data.role === 'admin') router.push('/admin');
      else if (data.role === 'organisation') router.push(`/${data.organisation?.slug ?? 'dashboard'}`);
      else if (data.role === 'employe') router.push(`/${data.organisation?.slug ?? 'dashboard'}`);
      else if (data.role === 'client') router.push('/espace');
      else router.push('/');
    } catch (err) {
      const axiosError = err as AxiosError<{ message: string; statut?: string }>;
      const message = axiosError.response?.data?.message ?? 'Erreur de connexion.';
      const statut  = axiosError.response?.data?.statut;
      if (statut === 'en_attente') router.push('/en-attente');
      else setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">

      {/* ── Panneau gauche — branding ── */}
      <div className="hidden lg:flex lg:w-[52%] bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 relative overflow-hidden flex-col justify-between p-14">
        {/* Cercles décoratifs */}
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-white/5 rounded-full" />
        <div className="absolute -bottom-24 -left-16 w-80 h-80 bg-white/5 rounded-full" />
        <div className="absolute top-1/3 right-1/4 w-40 h-40 bg-blue-400/20 rounded-full blur-2xl" />
        <div className="absolute bottom-1/3 left-1/3 w-32 h-32 bg-indigo-300/20 rounded-full blur-xl" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <span className="text-white text-2xl font-bold tracking-tight">Domtek</span>
        </div>

        {/* Texte central */}
        <div className="relative z-10 space-y-6">
          <h2 className="text-4xl font-bold text-white leading-tight">
            Gérez votre patrimoine<br />immobilier en toute<br />simplicité
          </h2>
          <p className="text-blue-100 text-base leading-relaxed max-w-sm">
            Biens, contrats, clients, annonces — centralisés et accessibles en temps réel.
          </p>
          <div className="space-y-3 pt-2">
            {[
              'Gestion complète des biens immobiliers',
              'Suivi des contrats et loyers',
              'CRM clients, prospects et employés',
            ].map((f) => (
              <div key={f} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-blue-100 text-sm">{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10">
          <p className="text-blue-200/50 text-xs">© {new Date().getFullYear()} Domtek. Tous droits réservés.</p>
        </div>
      </div>

      {/* ── Panneau droit — formulaire ── */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50 min-h-screen">
        <div className="w-full max-w-md animate-fade-in">

          {/* Logo mobile */}
          <div className="lg:hidden flex items-center gap-2 justify-center mb-8">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
              </svg>
            </div>
            <span className="text-xl font-bold text-gray-900">Domtek</span>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Bon retour !</h1>
            <p className="text-gray-500 text-sm mb-7">Connectez-vous à votre espace Domtek</p>

            {error && (
              <div className="flex items-center gap-2.5 bg-red-50 border border-red-100 text-red-700 rounded-xl px-4 py-3 mb-5 text-sm animate-fade-in-fast">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            <GoogleAuthButton />

            <div className="flex items-center gap-3 my-5">
              <span className="flex-1 h-px bg-gray-100" />
              <span className="text-xs text-gray-400 font-medium">ou par e-mail</span>
              <span className="flex-1 h-px bg-gray-100" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Adresse e-mail</label>
                <input
                  type="email" required autoComplete="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="votre@email.com"
                  className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-gray-700">Mot de passe</label>
                  <Link href="/forgot-password" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                    Oublié ?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'} required
                    autoComplete="current-password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-2.5 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all"
                  />
                  <button type="button" onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                    {showPassword ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl text-sm transition-all duration-200 shadow-sm hover:shadow-md mt-1">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Connexion…
                  </span>
                ) : 'Se connecter'}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-100 space-y-2 text-center text-sm text-gray-500">
              <p>
                Vous êtes une organisation ?{' '}
                <Link href="/register/organisation" className="text-blue-600 hover:text-blue-700 font-semibold">
                  Créer un compte
                </Link>
              </p>
              <p>
                Vous êtes un employé ?{' '}
                <Link href="/register/employe" className="text-blue-600 hover:text-blue-700 font-semibold">
                  Créer un compte employé
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
