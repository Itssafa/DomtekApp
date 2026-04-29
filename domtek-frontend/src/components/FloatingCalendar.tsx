'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { orgPath } from '@/lib/org-path';

// ─── Types ────────────────────────────────────────────────────────────────────

interface VisiteEvent {
  id: number;
  type: 'visite';
  date: string;
  heure: string;
  statut: 'planifiee' | 'effectuee';
  prospect_nom: string;
  bien: string;
}

interface QuittanceEvent {
  id: number;
  type: 'quittance';
  date: string;
  statut: string;
  periode: string;
  montant: number;
  locataire_nom: string;
  location_id: number;
}

interface AnniversaireEvent {
  id: number;
  type: 'anniversaire';
  cible: 'client' | 'prospect';
  date: string;
  nom: string;
  age: number;
}

type CalEvent = VisiteEvent | QuittanceEvent | AnniversaireEvent;

// ─── Constantes ───────────────────────────────────────────────────────────────

const JOURS   = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MOIS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin',
                 'Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

const STATUT_Q: Record<string, string> = {
  prevu: 'Prévu', paye: 'Payé', impaye: 'Impayé',
  partiel: 'Partiel', paye_en_retard: 'Payé en retard',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtMoney(n: number) {
  return n.toLocaleString('fr-TN', { minimumFractionDigits: 3, maximumFractionDigits: 3 }) + ' DT';
}

function groupByDate(events: CalEvent[]): Record<string, CalEvent[]> {
  const map: Record<string, CalEvent[]> = {};
  for (const ev of events) {
    if (!map[ev.date]) map[ev.date] = [];
    map[ev.date].push(ev);
  }
  return map;
}

// ─── Icônes ───────────────────────────────────────────────────────────────────

function IconVisite({ size = 'sm' }: { size?: 'sm' | 'md' }) {
  const cls = size === 'md' ? 'w-4 h-4' : 'w-3.5 h-3.5';
  return (
    <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

function IconQuittance({ size = 'sm' }: { size?: 'sm' | 'md' }) {
  const cls = size === 'md' ? 'w-4 h-4' : 'w-3.5 h-3.5';
  return (
    <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  );
}

// ─── Composant ────────────────────────────────────────────────────────────────

export function FloatingCalendar() {
  const router           = useRouter();
  const { organisation } = useAuthStore();
  const panelRef         = useRef<HTMLDivElement>(null);

  const [open, setOpen]               = useState(false);
  const [today]                       = useState(new Date());
  const [cursor, setCursor]           = useState({ y: today.getFullYear(), m: today.getMonth() });
  const [events, setEvents]           = useState<CalEvent[]>([]);
  const [loading, setLoading]         = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const moisParam = `${cursor.y}-${String(cursor.m + 1).padStart(2, '0')}`;

  /* ── Fetch ── */
  const fetchEvents = useCallback(() => {
    setLoading(true);
    api.get(`/org/calendrier?mois=${moisParam}`)
      .then(({ data }) => setEvents([
        ...(data.visites       ?? []),
        ...(data.quittances    ?? []),
        ...(data.anniversaires ?? []),
      ]))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [moisParam]);

  useEffect(() => { if (open) fetchEvents(); }, [open, fetchEvents]);

  /* ── Clic extérieur ── */
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  /* ── Navigation ── */
  const prevMonth = () => setCursor(c => c.m === 0  ? { y: c.y - 1, m: 11 } : { y: c.y, m: c.m - 1 });
  const nextMonth = () => setCursor(c => c.m === 11 ? { y: c.y + 1, m: 0  } : { y: c.y, m: c.m + 1 });
  const goToday   = () => { setCursor({ y: today.getFullYear(), m: today.getMonth() }); setSelectedDay(today.toISOString().slice(0, 10)); };

  /* ── Grille ── */
  const firstDay    = new Date(cursor.y, cursor.m, 1);
  const startOffset = (firstDay.getDay() + 6) % 7;          // lundi = 0
  const daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate();
  const byDate      = groupByDate(events);
  const todayStr    = today.toISOString().slice(0, 10);
  const dayStr      = (d: number) =>
    `${cursor.y}-${String(cursor.m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  /* ── Données dérivées ── */
  const dayEvents       = selectedDay ? (byDate[selectedDay] ?? []) : [];
  const totalEvents     = events.length;
  const nVisites        = events.filter(e => e.type === 'visite').length;
  const nQuittances     = events.filter(e => e.type === 'quittance').length;
  const nAnniversaires  = events.filter(e => e.type === 'anniversaire').length;

  const navigate = (ev: CalEvent) => {
    setOpen(false);
    if (ev.type === 'visite')
      router.push(orgPath('/dashboard/visites'));
    else if (ev.type === 'quittance')
      router.push(orgPath(`/dashboard/locations/${ev.location_id}`));
    else
      router.push(orgPath(`/dashboard/${ev.cible === 'client' ? 'clients' : 'prospects'}/${ev.id}`));
  };

  // ── Rendu ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ══ Bouton flottant ══ */}
      <button
        onClick={() => setOpen(v => !v)}
        aria-label="Calendrier des activités"
        className={`fixed bottom-6 right-20 z-40 w-13 h-13 w-12 h-12 rounded-full shadow-xl flex items-center justify-center transition-all duration-200
          ${open
            ? 'bg-violet-700 text-white scale-105'
            : 'bg-white text-violet-600 border-2 border-violet-200 hover:border-violet-400 hover:scale-105'}`}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        {totalEvents > 0 && !open && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {totalEvents > 99 ? '99+' : totalEvents}
          </span>
        )}
      </button>

      {/* ══ Panneau calendrier ══ */}
      {open && (
        <div
          ref={panelRef}
          className="fixed bottom-6 right-4 z-50 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
          style={{ width: 460, maxHeight: '90vh', bottom: 80 }}
        >

          {/* ── En-tête dégradé ── */}
          <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-4 flex items-center justify-between flex-shrink-0">
            <div>
              <p className="text-white font-bold text-base leading-tight">Calendrier</p>
              <p className="text-violet-200 text-xs mt-0.5">{organisation?.nom}</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Compteurs rapides */}
              <div className="flex gap-2">
                {nVisites > 0 && (
                  <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                    {nVisites} visite{nVisites > 1 ? 's' : ''}
                  </span>
                )}
                {nQuittances > 0 && (
                  <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                    {nQuittances} quitt.
                  </span>
                )}
                {nAnniversaires > 0 && (
                  <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                    🎂 {nAnniversaires}
                  </span>
                )}
              </div>
              <button onClick={() => setOpen(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* ── Navigation mois ── */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 flex-shrink-0 bg-gray-50">
            <button onClick={prevMonth}
              className="w-8 h-8 rounded-lg bg-white border border-gray-200 hover:border-violet-400 hover:text-violet-600 flex items-center justify-center text-gray-500 transition shadow-sm">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <button onClick={goToday}
              className="text-base font-bold text-gray-800 hover:text-violet-600 transition tracking-tight">
              {MOIS_FR[cursor.m]} {cursor.y}
            </button>

            <button onClick={nextMonth}
              className="w-8 h-8 rounded-lg bg-white border border-gray-200 hover:border-violet-400 hover:text-violet-600 flex items-center justify-center text-gray-500 transition shadow-sm">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* ── Grille calendrier ── */}
          <div className="px-4 pt-3 pb-2 flex-shrink-0">
            {/* Jours de la semaine */}
            <div className="grid grid-cols-7 mb-2">
              {JOURS.map(j => (
                <div key={j} className="text-center text-xs font-semibold text-gray-400 py-1 uppercase tracking-wide">
                  {j}
                </div>
              ))}
            </div>

            {/* Cellules */}
            {loading ? (
              <div className="h-40 flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-6 h-6 border-2 border-violet-300 border-t-violet-600 rounded-full animate-spin" />
                  <span className="text-xs text-gray-400">Chargement…</span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: startOffset }).map((_, i) => <div key={`e-${i}`} />)}

                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const d   = i + 1;
                  const ds  = dayStr(d);
                  const evs = byDate[ds] ?? [];
                  const isToday    = ds === todayStr;
                  const isSelected = ds === selectedDay;

                  const hasVisite       = evs.some(e => e.type === 'visite');
                  const hasQuittance    = evs.some(e => e.type === 'quittance');
                  const hasAnniversaire = evs.some(e => e.type === 'anniversaire');

                  return (
                    <button
                      key={d}
                      onClick={() => setSelectedDay(isSelected ? null : ds)}
                      className={`flex flex-col items-center justify-center gap-1 h-11 rounded-xl transition-all duration-150
                        ${isSelected
                          ? 'bg-violet-600 shadow-md shadow-violet-200'
                          : isToday
                            ? 'bg-violet-50 ring-2 ring-violet-300'
                            : evs.length > 0
                              ? 'hover:bg-gray-100'
                              : 'hover:bg-gray-50'}`}
                    >
                      {/* Numéro du jour */}
                      <span className={`text-sm font-semibold leading-none
                        ${isSelected
                          ? 'text-white'
                          : isToday
                            ? 'text-violet-700'
                            : 'text-gray-700'}`}>
                        {d}
                      </span>

                      {/* Dots événements */}
                      {evs.length > 0 && (
                        <div className="flex gap-0.5">
                          {hasVisite       && <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-blue-200'   : 'bg-blue-500'}`} />}
                          {hasQuittance    && <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-violet-200' : 'bg-violet-400'}`} />}
                          {hasAnniversaire && <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-amber-200'  : 'bg-amber-400'}`} />}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Légende ── */}
          <div className="flex items-center gap-4 px-5 py-2.5 border-t border-gray-100 bg-gray-50 flex-shrink-0">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 flex-shrink-0" />
              Visites
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="w-2.5 h-2.5 rounded-full bg-violet-400 flex-shrink-0" />
              Quittances
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 flex-shrink-0" />
              Anniversaires
            </div>
          </div>

          {/* ── Liste du jour sélectionné ── */}
          {selectedDay && (
            <div className="border-t border-gray-200 flex flex-col overflow-hidden flex-1" style={{ maxHeight: 300 }}>
              {/* Titre du jour */}
              <div className="px-5 py-3 bg-white border-b border-gray-100 flex items-center justify-between flex-shrink-0">
                <p className="text-sm font-bold text-gray-800 capitalize">
                  {new Date(selectedDay + 'T12:00:00').toLocaleDateString('fr-FR', {
                    weekday: 'long', day: 'numeric', month: 'long',
                  })}
                </p>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                  {dayEvents.length} événement{dayEvents.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Cartes événements */}
              <div className="overflow-y-auto flex-1">
                {dayEvents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 gap-2">
                    <svg className="w-8 h-8 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm text-gray-400">Aucun événement ce jour</p>
                  </div>
                ) : (
                  <div className="px-4 py-2 space-y-2">
                    {dayEvents.map((ev, i) => (
                      <button
                        key={i}
                        onClick={() => navigate(ev)}
                        className="w-full text-left rounded-xl border border-gray-100 hover:border-violet-200 hover:shadow-sm bg-white transition-all duration-150 flex items-center gap-3 p-3"
                      >
                        {/* Icône */}
                        <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-sm
                          ${ev.type === 'visite'
                            ? ev.statut === 'planifiee' ? 'bg-blue-500' : 'bg-green-500'
                            : ev.type === 'quittance'
                              ? 'bg-violet-500'
                              : 'bg-amber-400'}`}>
                          {ev.type === 'visite'       && <IconVisite size="md" />}
                          {ev.type === 'quittance'    && <IconQuittance size="md" />}
                          {ev.type === 'anniversaire' && <span className="text-base">🎂</span>}
                        </div>

                        {/* Contenu */}
                        <div className="min-w-0 flex-1">
                          {ev.type === 'visite' && (
                            <>
                              <p className="text-sm font-semibold text-gray-800 truncate">{ev.prospect_nom}</p>
                              <p className="text-xs text-gray-500 truncate mt-0.5">{ev.bien}</p>
                              <div className="flex items-center gap-2 mt-1">
                                {ev.heure && ev.heure !== '00:00' && (
                                  <span className="text-xs text-gray-400 font-medium">{ev.heure}</span>
                                )}
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                                  ${ev.statut === 'planifiee' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                                  {ev.statut === 'planifiee' ? 'Planifiée' : 'Effectuée'}
                                </span>
                              </div>
                            </>
                          )}

                          {ev.type === 'quittance' && (
                            <>
                              <p className="text-sm font-semibold text-gray-800 truncate">{ev.locataire_nom}</p>
                              <p className="text-xs text-gray-500 mt-0.5">{fmtMoney(ev.montant)} · {ev.periode}</p>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block
                                ${ev.statut === 'prevu'                                          ? 'bg-blue-100 text-blue-700'
                                : ev.statut === 'paye' || ev.statut === 'paye_en_retard'         ? 'bg-green-100 text-green-700'
                                : ev.statut === 'impaye'                                         ? 'bg-red-100 text-red-700'
                                : 'bg-amber-100 text-amber-700'}`}>
                                {STATUT_Q[ev.statut] ?? ev.statut}
                              </span>
                            </>
                          )}

                          {ev.type === 'anniversaire' && (
                            <>
                              <p className="text-sm font-semibold text-gray-800 truncate">{ev.nom}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs font-semibold text-amber-600">{ev.age} ans</span>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                                  ${ev.cible === 'client' ? 'bg-emerald-100 text-emerald-700' : 'bg-sky-100 text-sky-700'}`}>
                                  {ev.cible === 'client' ? 'Client' : 'Prospect'}
                                </span>
                              </div>
                            </>
                          )}
                        </div>

                        {/* Chevron */}
                        <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Pied résumé (quand aucun jour sélectionné) ── */}
          {!selectedDay && (
            <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex items-center gap-4 flex-shrink-0">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-xs text-gray-600"><strong>{nVisites}</strong> visite{nVisites !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-violet-400" />
                <span className="text-xs text-gray-600"><strong>{nQuittances}</strong> quittance{nQuittances !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-xs text-gray-600"><strong>{nAnniversaires}</strong> anniversaire{nAnniversaires !== 1 ? 's' : ''}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
