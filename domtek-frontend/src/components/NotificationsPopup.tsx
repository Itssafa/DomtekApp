'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';

interface Notif {
  type:    'anniversaire' | 'visite';
  cible?:  'client' | 'prospect';
  id:      number;
  nom:     string;
  age?:    number;
  bien?:   string;
  agent?:  string;
  date_visite?: string;
  message: string;
}

const STORAGE_KEY = 'domtek_notif_dismissed';

function todayKey(): string {
  return `${STORAGE_KEY}_${new Date().toISOString().slice(0, 10)}`;
}

function notifId(n: Notif): string {
  return `${n.type}-${n.cible ?? ''}-${n.id}`;
}

function getDismissed(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(todayKey()) ?? '[]'));
  } catch {
    return new Set();
  }
}

function saveDismissed(ids: Set<string>) {
  localStorage.setItem(todayKey(), JSON.stringify([...ids]));
}

// ── Carte anniversaire ────────────────────────────────────────────────────────
function BirthdayCard({ notif, onClose }: { notif: Notif; onClose: () => void }) {
  return (
    <div className="w-80 bg-white rounded-2xl shadow-xl border border-amber-200 overflow-hidden animate-slide-up">
      {/* Bandeau */}
      <div className="bg-gradient-to-r from-amber-400 to-orange-400 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">🎂</span>
          <span className="text-white text-xs font-bold uppercase tracking-wide">Anniversaire</span>
        </div>
        <button
          onClick={onClose}
          className="text-white/70 hover:text-white p-0.5 rounded transition"
          aria-label="Fermer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Corps */}
      <div className="px-4 py-4">
        <p className="text-base font-bold text-gray-900 mb-0.5">
          Joyeux anniversaire, {notif.nom} !
        </p>
        <p className="text-sm text-gray-500">
          {notif.age ? `${notif.age} ans aujourd'hui` : "C'est son anniversaire aujourd'hui"}
          {notif.cible && (
            <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-medium capitalize">
              {notif.cible}
            </span>
          )}
        </p>
      </div>
    </div>
  );
}

// ── Carte visite ──────────────────────────────────────────────────────────────
function VisiteCard({ notif, onClose }: { notif: Notif; onClose: () => void }) {
  return (
    <div className="w-80 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-slide-up">
      {/* Bandeau */}
      <div className="bg-slate-800 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base">📅</span>
          <span className="text-slate-200 text-xs font-bold uppercase tracking-wide">Visite demain</span>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-0.5 rounded transition"
          aria-label="Fermer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Corps */}
      <div className="px-4 py-4">
        <p className="text-sm font-semibold text-gray-900 mb-1">{notif.nom}</p>
        {notif.bien && (
          <p className="text-xs text-gray-500 mb-0.5">
            <span className="font-medium text-gray-700">Bien :</span> {notif.bien}
          </p>
        )}
        {notif.agent && (
          <p className="text-xs text-gray-500">
            <span className="font-medium text-gray-700">Agent :</span> {notif.agent}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────
export function NotificationsPopup() {
  const [notifs, setNotifs] = useState<Notif[]>([]);

  const fetchNotifs = useCallback(async () => {
    try {
      const { data } = await api.get<{ data: Notif[] }>('/org/notifications');
      const all = data.data ?? [];
      if (all.length === 0) return;

      const dismissed = getDismissed();
      const pending = all.filter(n => !dismissed.has(notifId(n)));
      setNotifs(pending);
    } catch { /* noop */ }
  }, []);

  useEffect(() => {
    const t = setTimeout(fetchNotifs, 1200);
    return () => clearTimeout(t);
  }, [fetchNotifs]);

  const close = useCallback((n: Notif) => {
    const dismissed = getDismissed();
    dismissed.add(notifId(n));
    saveDismissed(dismissed);
    setNotifs(prev => prev.filter(x => notifId(x) !== notifId(n)));
  }, []);

  if (notifs.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 items-end">
      {notifs.map(n =>
        n.type === 'anniversaire'
          ? <BirthdayCard key={notifId(n)} notif={n} onClose={() => close(n)} />
          : <VisiteCard   key={notifId(n)} notif={n} onClose={() => close(n)} />
      )}
    </div>
  );
}
