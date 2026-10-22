'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { Champ } from '@/components/Champ';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Tache {
  id: number;
  titre: string;
  description?: string;
  date_echeance?: string;
  statut: 'a_faire' | 'en_cours' | 'terminee';
  priorite: 'basse' | 'normale' | 'haute';
}

interface Visite {
  id: number;
  prospect?: { id: number; nom_complet: string };
  bien?: { id: number; designation?: string; ville?: string };
  date_visite: string;
  statut: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUT_LABELS: Record<Tache['statut'], string> = {
  a_faire:  'À faire',
  en_cours: 'En cours',
  terminee: 'Terminée',
};

const PRIORITE_COLORS: Record<Tache['priorite'], string> = {
  haute:   'bg-red-100 text-red-700',
  normale: 'bg-yellow-100 text-yellow-700',
  basse:   'bg-gray-100 text-gray-500',
};

const STATUT_COLORS: Record<Tache['statut'], string> = {
  a_faire:  'bg-blue-100 text-blue-700',
  en_cours: 'bg-orange-100 text-orange-700',
  terminee: 'bg-green-100 text-green-700',
};

function formatDate(d?: string) {
  if (!d) return null;
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function isOverdue(d?: string, statut?: Tache['statut']) {
  if (!d || statut === 'terminee') return false;
  return new Date(d) < new Date(new Date().toDateString());
}

// ─── Modal ajout / édition ────────────────────────────────────────────────────

interface ModalProps {
  tache: Partial<Tache> | null;
  onClose: () => void;
  onSaved: () => void;
}

function TacheModal({ tache, onClose, onSaved }: ModalProps) {
  const isEdit = !!(tache && tache.id);
  const [form, setForm] = useState({
    titre:         tache?.titre         ?? '',
    description:   tache?.description   ?? '',
    date_echeance: tache?.date_echeance ? tache.date_echeance.slice(0, 10) : '',
    priorite:      tache?.priorite      ?? 'normale',
    statut:        tache?.statut        ?? 'a_faire',
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!form.titre.trim()) { setError('Le titre est requis.'); return; }
    setSaving(true);
    setError('');
    try {
      const payload = {
        titre:         form.titre.trim(),
        description:   form.description || null,
        date_echeance: form.date_echeance || null,
        priorite:      form.priorite,
        ...(isEdit ? { statut: form.statut } : {}),
      };
      if (isEdit) {
        await api.put(`/org/taches/${tache!.id}`, payload);
      } else {
        await api.post('/org/taches', payload);
      }
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">
            {isEdit ? 'Modifier la tâche' : 'Nouvelle tâche'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Titre */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Titre *</label>
            <input
              type="text"
              value={form.titre}
              onChange={e => set('titre', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              placeholder="Ex : Appeler le propriétaire…"
              autoFocus
            />
            <Champ nom="titre" form={form} />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
              placeholder="Détails optionnels…"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Date d'échéance */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Date d&apos;échéance</label>
              <input
                type="date"
                value={form.date_echeance}
                onChange={e => set('date_echeance', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
              <Champ nom="date_echeance" form={form} />
            </div>

            {/* Priorité */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Priorité</label>
              <select
                value={form.priorite}
                onChange={e => set('priorite', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="basse">Basse</option>
                <option value="normale">Normale</option>
                <option value="haute">Haute</option>
              </select>
            </div>
          </div>

          {/* Statut (édition seulement) */}
          {isEdit && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Statut</label>
              <select
                value={form.statut}
                onChange={e => set('statut', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="a_faire">À faire</option>
                <option value="en_cours">En cours</option>
                <option value="terminee">Terminée</option>
              </select>
            </div>
          )}

          {error && <p className="text-xs text-red-600">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2 rounded-lg bg-violet-600 text-sm font-medium text-white hover:bg-violet-700 transition disabled:opacity-60"
            >
              {saving ? 'Sauvegarde…' : isEdit ? 'Enregistrer' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Carte tâche ──────────────────────────────────────────────────────────────

function TacheCard({ tache, onEdit, onDelete, onToggleStatut, onMarkDone }: {
  tache: Tache;
  onEdit: () => void;
  onDelete: () => void;
  onToggleStatut: () => void;
  onMarkDone: () => void;
}) {
  const overdue = isOverdue(tache.date_echeance, tache.statut);

  return (
    <div className={`bg-white rounded-xl border p-4 flex gap-3 group transition hover:shadow-sm
      ${tache.statut === 'terminee' ? 'opacity-60' : ''}`}>

      {/* Checkbox statut */}
      <button
        onClick={onToggleStatut}
        title="Changer le statut"
        className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition
          ${tache.statut === 'terminee'
            ? 'bg-green-500 border-green-500'
            : tache.statut === 'en_cours'
            ? 'bg-orange-400 border-orange-400'
            : 'border-gray-300 hover:border-blue-400'
          }`}
      >
        {tache.statut !== 'a_faire' && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      {/* Contenu */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium text-gray-800 leading-snug
          ${tache.statut === 'terminee' ? 'line-through text-gray-400' : ''}`}>
          {tache.titre}
        </p>
        {tache.description && (
          <p className="text-xs text-gray-500 mt-0.5 truncate">{tache.description}</p>
        )}
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${PRIORITE_COLORS[tache.priorite]}`}>
            {tache.priorite.charAt(0).toUpperCase() + tache.priorite.slice(1)}
          </span>
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${STATUT_COLORS[tache.statut]}`}>
            {STATUT_LABELS[tache.statut]}
          </span>
          {tache.date_echeance && (
            <span className={`text-[10px] flex items-center gap-1
              ${overdue ? 'text-red-600 font-semibold' : 'text-gray-400'}`}>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {overdue ? 'En retard · ' : ''}{formatDate(tache.date_echeance)}
            </span>
          )}
        </div>

        {tache.statut !== 'terminee' && (
          <button
            onClick={onMarkDone}
            className="mt-3 flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 px-3 py-1.5 rounded-lg transition"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            Marquer terminée
          </button>
        )}
      </div>

      {/* Actions (visibles au survol) */}
      <div className="flex-shrink-0 flex items-start gap-1 opacity-0 group-hover:opacity-100 transition">
        <button
          onClick={onEdit}
          className="p-1.5 rounded-lg text-gray-400 hover:text-violet-600 hover:bg-blue-50 transition"
          title="Modifier"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
          title="Supprimer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ─── Carte visite planifiée ───────────────────────────────────────────────────

function VisiteCard({ visite }: { visite: Visite }) {
  const nomProspect = visite.prospect?.nom_complet ?? '—';
  const bien = visite.bien?.designation ?? visite.bien?.ville ?? '—';
  const dateStr = formatDate(visite.date_visite);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow = new Date(visite.date_visite).toDateString() === tomorrow.toDateString();

  return (
    <div className="bg-white rounded-xl border border-blue-100 p-4 flex gap-3">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mt-0.5">
        <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium text-gray-800">{nomProspect}</p>
          {isTomorrow && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
              Demain
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-0.5 truncate">Bien : {bien}</p>
        <p className="text-xs text-blue-600 mt-1 font-medium">{dateStr}</p>
      </div>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function TachesPage() {
  const [taches,   setTaches]   = useState<Tache[]>([]);
  const [visites,  setVisites]  = useState<Visite[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState<Partial<Tache> | null | false>(false);
  const [filter,   setFilter]   = useState<'tout' | 'a_faire' | 'en_cours' | 'terminee'>('tout');

  const fetchTaches = useCallback(async () => {
    try {
      const { data } = await api.get<{ data: Tache[] }>('/org/taches');
      setTaches(data.data);
    } catch { /* noop */ }
  }, []);

  const fetchVisites = useCallback(async () => {
    try {
      // Visites planifiées (à venir)
      const { data } = await api.get<{ data: Visite[] }>('/org/visites?statut=planifiee&per_page=50');
      // On garde les 14 prochains jours
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() + 14);
      const upcoming = data.data.filter(v => new Date(v.date_visite) <= cutoff)
        .sort((a, b) => new Date(a.date_visite).getTime() - new Date(b.date_visite).getTime());
      setVisites(upcoming);
    } catch { /* noop */ }
  }, []);

  useEffect(() => {
    Promise.all([fetchTaches(), fetchVisites()]).finally(() => setLoading(false));
  }, [fetchTaches, fetchVisites]);

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cette tâche ?')) return;
    try {
      await api.delete(`/org/taches/${id}`);
      setTaches(ts => ts.filter(t => t.id !== id));
    } catch { /* noop */ }
  };

  const handleToggleStatut = async (tache: Tache) => {
    const nextStatut: Record<Tache['statut'], Tache['statut']> = {
      a_faire:  'en_cours',
      en_cours: 'terminee',
      terminee: 'a_faire',
    };
    const next = nextStatut[tache.statut];

    // Mise à jour optimiste : l'UI répond immédiatement
    setTaches(ts => ts.map(t => t.id === tache.id ? { ...t, statut: next } : t));

    try {
      await api.patch(`/org/taches/${tache.id}`, { statut: next });
    } catch (err: any) {
      // Annuler si l'API échoue
      setTaches(ts => ts.map(t => t.id === tache.id ? { ...t, statut: tache.statut } : t));
      const msg = err?.response?.data?.message ?? 'Impossible de mettre à jour le statut.';
      alert(msg);
    }
  };

  const handleMarkDone = async (tache: Tache) => {
    setTaches(ts => ts.map(t => t.id === tache.id ? { ...t, statut: 'terminee' } : t));
    try {
      await api.patch(`/org/taches/${tache.id}`, { statut: 'terminee' });
    } catch (err: any) {
      setTaches(ts => ts.map(t => t.id === tache.id ? { ...t, statut: tache.statut } : t));
      const msg = err?.response?.data?.message ?? 'Impossible de mettre à jour le statut.';
      alert(msg);
    }
  };

  const displayed = filter === 'tout'
    ? taches
    : taches.filter(t => t.statut === filter);

  const counts = {
    a_faire:  taches.filter(t => t.statut === 'a_faire').length,
    en_cours: taches.filter(t => t.statut === 'en_cours').length,
    terminee: taches.filter(t => t.statut === 'terminee').length,
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* En-tête */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Mes tâches</h1>
          <p className="text-gray-500 text-sm mt-1">Gérez vos tâches et suivez vos visites planifiées</p>
        </div>
        <button
          onClick={() => setModal({})}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nouvelle tâche
        </button>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {([
          { label: 'À faire',  key: 'a_faire',  color: 'blue'   },
          { label: 'En cours', key: 'en_cours', color: 'orange' },
          { label: 'Terminées', key: 'terminee', color: 'green'  },
        ] as const).map(({ label, key, color }) => (
          <button
            key={key}
            onClick={() => setFilter(f => f === key ? 'tout' : key)}
            className={`rounded-xl p-4 text-left border transition
              ${filter === key
                ? color === 'blue'   ? 'bg-blue-50 border-blue-200'
                : color === 'orange' ? 'bg-orange-50 border-orange-200'
                :                     'bg-green-50 border-green-200'
                : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
          >
            <p className={`text-2xl font-bold
              ${color === 'blue'   ? 'text-blue-700'
              : color === 'orange' ? 'text-orange-700'
              :                     'text-green-700'}`}>
              {counts[key]}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ── Colonne tâches (2/3) ────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-700">
              {filter === 'tout' ? 'Toutes les tâches' : STATUT_LABELS[filter]}
              {filter !== 'tout' && (
                <button
                  onClick={() => setFilter('tout')}
                  className="ml-2 text-xs text-blue-500 hover:text-blue-700 font-normal"
                >
                  (voir tout)
                </button>
              )}
            </h2>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-400 text-sm">Chargement…</div>
          ) : displayed.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">
              {filter === 'tout' ? 'Aucune tâche pour le moment.' : `Aucune tâche "${STATUT_LABELS[filter as Tache['statut']]}".`}
            </div>
          ) : (
            <div className="space-y-3">
              {displayed.map(tache => (
                <TacheCard
                  key={tache.id}
                  tache={tache}
                  onEdit={() => setModal(tache)}
                  onDelete={() => handleDelete(tache.id)}
                  onToggleStatut={() => handleToggleStatut(tache)}
                  onMarkDone={() => handleMarkDone(tache)}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Colonne visites planifiées (1/3) ────────────────────────────── */}
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-gray-700 flex items-center gap-2">
            <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Visites planifiées
            <span className="text-xs font-normal text-gray-400">(14 prochains jours)</span>
          </h2>

          {loading ? (
            <div className="text-sm text-gray-400">Chargement…</div>
          ) : visites.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-400">
              Aucune visite planifiée à venir.
            </div>
          ) : (
            <div className="space-y-3">
              {visites.map(v => (
                <VisiteCard key={v.id} visite={v} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {modal !== false && (
        <TacheModal
          tache={modal || null}
          onClose={() => setModal(false)}
          onSaved={fetchTaches}
        />
      )}
    </div>
  );
}
