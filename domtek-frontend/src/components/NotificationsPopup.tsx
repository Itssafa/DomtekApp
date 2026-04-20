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
  message: string;
}

const STORAGE_KEY = 'domtek_notif_dismissed';

function getDismissedKey(): string {
  const today = new Date().toISOString().slice(0, 10);
  return `${STORAGE_KEY}_${today}`;
}

export function NotificationsPopup() {
  const [notifs,   setNotifs]   = useState<Notif[]>([]);
  const [visible,  setVisible]  = useState(false);
  const [current,  setCurrent]  = useState(0);

  const fetchNotifs = useCallback(async () => {
    try {
      const { data } = await api.get<{ data: Notif[] }>('/org/notifications');
      const all = data.data ?? [];
      if (all.length === 0) return;

      // Filtrer celles déjà fermées aujourd'hui
      const dismissed: string[] = JSON.parse(localStorage.getItem(getDismissedKey()) ?? '[]');
      const pending = all.filter(n => !dismissed.includes(`${n.type}-${n.id}`));
      if (pending.length === 0) return;

      setNotifs(pending);
      setCurrent(0);
      setVisible(true);
    } catch { /* noop */ }
  }, []);

  useEffect(() => {
    // Délai court pour laisser le dashboard se charger
    const t = setTimeout(fetchNotifs, 1200);
    return () => clearTimeout(t);
  }, [fetchNotifs]);

  const dismiss = () => {
    const notif = notifs[current];
    if (!notif) return;

    // Mémoriser comme fermée pour aujourd'hui
    const key = getDismissedKey();
    const dismissed: string[] = JSON.parse(localStorage.getItem(key) ?? '[]');
    dismissed.push(`${notif.type}-${notif.id}`);
    localStorage.setItem(key, JSON.stringify(dismissed));

    if (current + 1 < notifs.length) {
      setCurrent(c => c + 1);
    } else {
      setVisible(false);
    }
  };

  const dismissAll = () => {
    const key = getDismissedKey();
    const ids = notifs.map(n => `${n.type}-${n.id}`);
    localStorage.setItem(key, JSON.stringify(ids));
    setVisible(false);
  };

  if (!visible || notifs.length === 0) return null;

  const notif = notifs[current];
  const isAnniv = notif.type === 'anniversaire';

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className={`rounded-2xl shadow-2xl border overflow-hidden
        ${isAnniv ? 'bg-amber-50 border-amber-200' : 'bg-violet-50 border-violet-200'}`}>

        {/* Header */}
        <div className={`px-4 py-3 flex items-center justify-between
          ${isAnniv ? 'bg-amber-100' : 'bg-violet-100'}`}>
          <div className="flex items-center gap-2">
            <span className="text-xl">{isAnniv ? '🎂' : '📅'}</span>
            <span className={`text-sm font-semibold
              ${isAnniv ? 'text-amber-800' : 'text-violet-800'}`}>
              {isAnniv ? 'Anniversaire aujourd\'hui' : 'Visite demain'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {notifs.length > 1 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium
                ${isAnniv ? 'bg-amber-200 text-amber-700' : 'bg-violet-200 text-violet-700'}`}>
                {current + 1}/{notifs.length}
              </span>
            )}
            <button onClick={dismissAll}
              className={`ml-1 p-1 rounded-lg transition
                ${isAnniv ? 'hover:bg-amber-200 text-amber-600' : 'hover:bg-violet-200 text-violet-600'}`}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Corps */}
        <div className="px-4 py-4">
          <p className={`font-semibold text-sm mb-0.5
            ${isAnniv ? 'text-amber-900' : 'text-violet-900'}`}>
            {notif.nom}
          </p>
          {isAnniv && notif.age && (
            <p className="text-xs text-amber-700 mb-2">{notif.age} ans aujourd&apos;hui</p>
          )}
          {!isAnniv && notif.bien && (
            <p className="text-xs text-violet-700 mb-2">Bien : {notif.bien}</p>
          )}

          <div className="flex gap-2 mt-3">
            <button onClick={dismiss}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition
                ${isAnniv
                  ? 'bg-amber-500 hover:bg-amber-600 text-white'
                  : 'bg-violet-600 hover:bg-violet-700 text-white'}`}>
              {current + 1 < notifs.length ? 'Suivant →' : 'Fermer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
