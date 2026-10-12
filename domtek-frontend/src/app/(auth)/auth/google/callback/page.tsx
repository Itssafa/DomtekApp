'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { AuthResponse } from '@/types';

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

    // Premier enregistrement avec ce que contient l'URL : il pose le cookie de
    // session, sans lequel l'appel suivant ne serait pas authentifié.
    setAuth(token, { name, role, email } as never, role as never);

    // L'URL ne transporte que le slug, pas l'organisation elle-même. Sans elle
    // dans le store, le menu du tableau de bord construisait ses liens sur
    // `/dashboard` et affichait « Organisation » au lieu du nom — ce qui ne
    // touchait que les comptes connectés par Google, donc les organisations.
    // /auth/me renvoie le profil complet, organisation comprise.
    const terminer = (slug: string) => {
      if (role === 'admin') window.location.replace('/admin');
      else if (role === 'client') window.location.replace('/espace');
      else if (slug) window.location.replace(`/${slug}`);
      else window.location.replace('/');
    };

    api.get<AuthResponse>('/auth/me')
      .then(({ data }) => {
        setAuth(token, data.user, data.role, data.organisation);
        terminer(data.organisation?.slug ?? orgSlug);
      })
      .catch(() => {
        // Profil indisponible : on garde au moins le slug de l'URL pour la
        // redirection. Le layout du tableau de bord complétera l'organisation.
        if (orgSlug) {
          document.cookie = `org-slug=${orgSlug};path=/;max-age=${7 * 86400};SameSite=Lax`;
        }
        terminer(orgSlug);
      });
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
