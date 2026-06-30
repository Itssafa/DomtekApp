'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';

export default function EnAttentePage() {
  const { clearAuth } = useAuthStore();

  // Vider le token : l'utilisateur n'a pas encore de session active
  useEffect(() => {
    clearAuth();
  }, [clearAuth]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-10 text-center">
        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-gray-800 mb-2">Compte en attente</h1>
        <p className="text-gray-500 text-sm mb-6">
          Votre demande a bien été reçue. Un administrateur va examiner votre dossier
          et activer votre compte dans les plus brefs délais.
        </p>
        <p className="text-gray-400 text-xs mb-6">
          Vous recevrez une confirmation par email une fois votre compte activé.
        </p>
        <Link
          href="/login"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-6 py-2.5 rounded-lg transition"
        >
          Retour à la connexion
        </Link>
      </div>
    </div>
  );
}
