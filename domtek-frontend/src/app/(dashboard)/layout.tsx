'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { NotificationsPopup } from '@/components/NotificationsPopup';

// ─── Structure de navigation ──────────────────────────────────────────────────

const NAV_SECTIONS_DEF = [
  {
    label: 'Général',
    items: [
      { path: '',                 label: 'Dashboard',       icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
      { path: '/immeubles',       label: 'Immeubles',       icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
      { path: '/biens',           label: 'Biens',           icon: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z' },
      { path: '/annonces',        label: 'Annonces',        icon: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z' },
      { path: '/contrats',        label: 'Contrats',        icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
      { path: '/factures',        label: 'Factures',        icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' },
      { path: '/etat-lieux',      label: 'États des lieux', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
    ],
  },
  {
    label: 'CRM',
    items: [
      { path: '/clients',         label: 'Clients',         icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
      { path: '/prospects',       label: 'Prospects',       icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
      { path: '/employes',        label: 'Employés',        icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
      { path: '/investissements', label: 'Statistiques',    icon: 'M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z' },
      { path: '/taches',          label: 'Mes tâches',      icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
    ],
  },
  {
    label: 'Compte',
    items: [
      { path: '/compte', label: 'Mon compte', icon: 'M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
    ],
  },
];

function NavIcon({ d }: { d: string }) {
  return (
    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
    </svg>
  );
}

// ─── Sidebar (desktop + mobile partagent ce composant) ───────────────────────

interface SidebarInnerProps {
  base: string;
  pathname: string;
  orgNom?: string;
  userName?: string;
  userEmail?: string;
  role?: string;
  collapsed: boolean;
  showCloseBtn: boolean;
  onClose: () => void;
  onLogout: () => void;
}

const EMPLOYE_PATHS = new Set(['', '/immeubles', '/biens', '/annonces', '/etat-lieux', '/contrats', '/clients', '/prospects', '/taches', '/compte']);

function SidebarInner({
  base, pathname, orgNom, userName, userEmail,
  collapsed, showCloseBtn, onClose, onLogout, role,
}: SidebarInnerProps) {
  const navSections = NAV_SECTIONS_DEF
    .map(s => ({
      ...s,
      items: s.items
        .filter(item => role !== 'employe' || EMPLOYE_PATHS.has(item.path))
        .map(item => ({
          ...item,
          href: item.path === '' ? base : `${base}${item.path}`,
        })),
    }))
    .filter(s => s.items.length > 0);

  const isActive = (href: string) =>
    href === base
      ? pathname === base || pathname === '/dashboard'
      : pathname.startsWith(href);

  return (
    <>
      {/* Logo / header */}
      <div className={`border-b border-gray-200 flex items-center flex-shrink-0 h-16
        ${collapsed ? 'justify-center px-0' : 'justify-between px-5'}`}>
        {!collapsed && (
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-gray-900 leading-tight">Domtek</h1>
            <p className="text-xs text-gray-500 truncate">{orgNom ?? 'Organisation'}</p>
          </div>
        )}
        {collapsed && (
          <span className="text-lg font-bold text-blue-600">D</span>
        )}
        {showCloseBtn && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            aria-label="Fermer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 space-y-5">
        {navSections.map((section) => (
          <div key={section.label}>
            {!collapsed && (
              <p className="px-4 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                {section.label}
              </p>
            )}
            {collapsed && <div className="mx-3 mb-1.5 h-px bg-gray-100" />}
            <div className="space-y-0.5 px-2">
              {section.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    title={collapsed ? item.label : undefined}
                    className={`flex items-center rounded-lg text-sm font-medium transition-colors
                      ${collapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5'}
                      ${active
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                  >
                    <span className={`flex-shrink-0 ${active ? 'text-blue-600' : 'text-gray-400'}`}>
                      <NavIcon d={item.icon} />
                    </span>
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User */}
      <div className={`border-t border-gray-200 flex-shrink-0 py-4
        ${collapsed ? 'flex flex-col items-center gap-2 px-2' : 'px-4'}`}>
        {!collapsed && (
          <>
            <p className="text-xs font-medium text-gray-700 truncate">{userName}</p>
            <p className="text-xs text-gray-400 truncate mb-3">{userEmail}</p>
          </>
        )}
        <button
          onClick={onLogout}
          title={collapsed ? 'Déconnexion' : undefined}
          className={`flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors
            ${collapsed ? 'justify-center p-2 rounded-lg hover:bg-gray-100 w-full' : ''}`}
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {!collapsed && 'Déconnexion'}
        </button>
      </div>
    </>
  );
}

// ─── Layout principal ─────────────────────────────────────────────────────────

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const { role, clearAuth, user, organisation } = useAuthStore();

  const [collapsed,    setCollapsed]    = useState(false);   // desktop : réduit/étendu
  const [mobileOpen,   setMobileOpen]   = useState(false);   // mobile  : drawer ouvert

  const base = organisation?.slug ? `/${organisation.slug}` : '/dashboard';

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  useEffect(() => {
    if (role && role !== 'organisation' && role !== 'employe') router.replace('/admin');
  }, [role, router]);

  const handleLogout = () => { clearAuth(); router.push('/login'); };

  const sharedProps = {
    base,
    pathname,
    orgNom:    organisation?.nom,
    userName:  user?.name,
    userEmail: user?.email,
    onLogout:  handleLogout,
    role:      role ?? undefined,
  };

  return (
    <div className="flex h-screen bg-gray-100">

      {/* ── Sidebar desktop ────────────────────────────────────────────────── */}
      <aside
        className={`hidden lg:flex flex-col flex-shrink-0 bg-white border-r border-gray-200
          transition-all duration-300 ease-in-out
          ${collapsed ? 'w-16' : 'w-64'}`}
      >
        {/* Bouton toggle collapse */}
        <div className={`absolute top-4 z-10 ${collapsed ? 'left-10' : 'left-52'} transition-all duration-300`}>
          <button
            onClick={() => setCollapsed(v => !v)}
            className="hidden lg:flex items-center justify-center w-6 h-6 rounded-full bg-white border border-gray-200 shadow-sm text-gray-500 hover:text-gray-800 hover:shadow-md transition-all"
            aria-label={collapsed ? 'Étendre le menu' : 'Réduire le menu'}
          >
            <svg className={`w-3 h-3 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>

        <SidebarInner
          {...sharedProps}
          collapsed={collapsed}
          showCloseBtn={false}
          onClose={() => {}}
        />
      </aside>

      {/* ── Overlay mobile ────────────────────────────────────────────────── */}
      <div
        aria-hidden="true"
        onClick={() => setMobileOpen(false)}
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 lg:hidden
          ${mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      />

      {/* ── Drawer mobile ─────────────────────────────────────────────────── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200
          flex flex-col flex-shrink-0
          transform transition-transform duration-300 ease-in-out lg:hidden
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <SidebarInner
          {...sharedProps}
          collapsed={false}
          showCloseBtn={true}
          onClose={() => setMobileOpen(false)}
        />
      </aside>

      {/* ── Zone principale ───────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

        {/* Top bar mobile */}
        <header className="lg:hidden flex items-center gap-3 px-4 h-14 bg-white border-b border-gray-200 flex-shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-1.5 rounded-md text-gray-500 hover:text-gray-800 hover:bg-gray-100"
            aria-label="Ouvrir le menu"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-sm font-semibold text-gray-800 truncate">
            {organisation?.nom ?? 'Domtek'}
          </span>
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      <NotificationsPopup />
    </div>
  );
}
