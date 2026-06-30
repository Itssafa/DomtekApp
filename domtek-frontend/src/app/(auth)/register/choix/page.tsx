'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { AuthResponse } from '@/types';
import { AxiosError } from 'axios';

export default function ChoixComptePage() {
  const { setAuth } = useAuthStore();
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [prefill, setPrefill] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const g = params.get('g');
    if (!g) {
      window.location.replace('/login');
      return;
    }

    setGoogleToken(g);

    api.post<{ name: string; email: string }>('/auth/google/prefill', { token: g })
      .then(({ data }) => setPrefill(data))
      .catch(() => setError('Le lien Google a expiré. Veuillez recommencer.'));
  }, []);

  const handleClient = async () => {
    if (!googleToken) return;
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post<AuthResponse>('/auth/register/client-google', {
        google_token: googleToken,
      });
      setAuth(data.token, data.user, data.role);
      window.location.replace('/annonces');
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      setError(axiosError.response?.data?.message ?? 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  const handleOrganisation = () => {
    if (!googleToken) return;
    window.location.replace(`/register/organisation?g=${encodeURIComponent(googleToken)}`);
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center">
          <p className="text-red-600 text-sm mb-4">{error}</p>
          <a
            href="/login"
            className="inline-block bg-blue-600 text-white text-sm px-5 py-2.5 rounded-lg hover:bg-blue-700 transition"
          >
            Retour à la connexion
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">

        <div className="text-center mb-7">
          <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-7 h-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-800">
            Quel type de compte souhaitez-vous créer ?
          </h1>
          {prefill && (
            <p className="text-sm text-gray-500 mt-1">
              Connecté avec Google : <span className="font-medium text-gray-700">{prefill.email}</span>
            </p>
          )}
        </div>

        <div className="space-y-3">
          {/* Option Organisation */}
          <button
            onClick={handleOrganisation}
            disabled={!googleToken}
            className="w-full text-left border-2 border-gray-200 hover:border-blue-500 disabled:opacity-50 rounded-xl p-4 transition group"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-50 group-hover:bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 transition">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-gray-800">Agence / Organisation</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Gérez vos biens, contrats, employés et clients
                </p>
              </div>
            </div>
          </button>

          {/* Option Client */}
          <button
            onClick={handleClient}
            disabled={loading || !googleToken}
            className="w-full text-left border-2 border-gray-200 hover:border-green-500 disabled:opacity-50 rounded-xl p-4 transition group"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-green-50 group-hover:bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 transition">
                {loading ? (
                  <svg className="w-5 h-5 text-green-600 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 12 h4z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                )}
              </div>
              <div>
                <p className="font-semibold text-gray-800">
                  {loading ? 'Création en cours…' : 'Particulier / Client'}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Consultez les annonces et contactez les agences
                </p>
              </div>
            </div>
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Vous avez déjà un compte ?{' '}
          <a href="/login" className="text-blue-600 hover:underline">Se connecter</a>
        </p>
      </div>
    </div>
  );
}
