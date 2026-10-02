'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

const NAV = [
  { href: '/espace',           label: 'Accueil',      exact: true },
  { href: '/espace/contrats',  label: 'Mes contrats', exact: false },
  { href: '/espace/factures',  label: 'Mes factures', exact: false },
  { href: '/espace/quittances', label: 'Mes quittances', exact: false },
];

export default function EspaceClientLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const { user, role, clearAuth } = useAuthStore();

  // Le middleware Next ne connaît que la présence du cookie, pas le rôle.
  // On écarte donc ici un utilisateur authentifié mais non-client, qui serait
  // de toute façon rejeté par l'API (403 sur role:client).
  const [verifie, setVerifie] = useState(false);
  useEffect(() => {
    if (role && role !== 'client') {
      router.replace('/');
      return;
    }
    setVerifie(true);
  }, [role, router]);

  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } catch { /* le token local part quoi qu'il arrive */ }
    clearAuth();
    router.replace('/login');
  };

  const estActif = (item: typeof NAV[number]) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  if (!verifie) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <Link href="/espace" className="text-lg font-bold text-gray-900 tracking-tight">
              Domtek
              <span className="ml-2 text-[11px] font-medium text-gray-400 uppercase tracking-widest">
                Espace client
              </span>
            </Link>

            <div className="flex items-center gap-4">
              <div className="hidden sm:block text-right leading-tight">
                <p className="text-sm font-medium text-gray-800">{user?.name}</p>
                <p className="text-xs text-gray-400">{user?.email}</p>
              </div>
              <button onClick={handleLogout}
                className="text-xs font-medium text-gray-500 hover:text-red-600 border border-gray-300 hover:border-red-200 rounded-lg px-3 py-1.5 transition">
                Déconnexion
              </button>
            </div>
          </div>

          <nav className="flex gap-1 -mb-px">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition ${
                  estActif(item)
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
