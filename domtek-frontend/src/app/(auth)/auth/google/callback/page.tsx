'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';

export default function GoogleCallbackPage() {
  const { setAuth } = useAuthStore();
  const [error, setError] = useState('');

  useEffect(() => {
    // Lire les params directement depuis window.location (pas de Suspense requis)
    const params = new URLSearchParams(window.location.search);
    const token  = params.get('token');
    const role   = params.get('role');
    const name   = params.get('name') ?? '';
    const email  = params.get('email') ?? '';
    const err    = params.get('error');

    if (err) {
      const messages: Record<string, string> = {
        google_failed:    'La connexion avec Google a échoué. Réessayez.',
        account_disabled: "Votre compte a été désactivé. Contactez l'administrateur.",
      };
      setError(messages[err] ?? 'Une erreur est survenue.');
      return;
    }

    if (!token || !role) {
      setError('Réponse invalide de Google.');
      return;
    }

    const orgSlug = params.get('org_slug') ?? '';

    // Stocker l'auth (cookie + zustand)
    setAuth(token, { name, role, email } as never, role as never);
    if (orgSlug) {
      // le cookie org-slug est posé par setAuth uniquement si organisation est passée
      // on le pose manuellement ici car le backend ne renvoie pas l'objet complet
      document.cookie = `org-slug=${orgSlug};path=/;max-age=${7 * 86400};SameSite=Lax`;
    }

    // Rechargement complet pour que le cookie soit bien lu dès la prochaine page
    if (role === 'admin') {
      window.location.replace('/admin');
    } else if (orgSlug) {
      window.location.replace(`/${orgSlug}`);
    } else {
      window.location.replace('/');
    }
  }, [setAuth]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center">
          <div className="text-red-500 text-4xl mb-4">✕</div>
          <p className="text-gray-700 font-medium mb-2">Connexion Google échouée</p>
          <p className="text-gray-500 text-sm mb-6">{error}</p>
          <a href="/login"
            className="inline-block px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition">
            Retour à la connexion
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 text-sm">Connexion en cours…</p>
      </div>
    </div>
  );
}
