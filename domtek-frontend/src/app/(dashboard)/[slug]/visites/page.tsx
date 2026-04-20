'use client';

import { useCallback, useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { PaginatedResponse } from '@/types';

interface Visite {
  id: number;
  nom_agent: string | null;
  date_visite: string;
  statut: 'planifiee' | 'effectuee' | 'annulee';
  notes: string | null;
  employe_id: number | null;
  employe: { id: number; nom: string } | null;
  prospect: { id: number; nom_complet: string; telephone: string | null } | null;
  bien: { id: number; designation: string; type_bien: string; ville: string | null } | null;
  created_at: string;
}

interface EmployeOption { id: number; nom: string; }

interface VisiteForm {
  prospect_id: string;
  bien_id: string;
  employe_id: string;
  date_visite: string;
  notes: string;
}

const statutLabel: Record<string, string> = { planifiee: 'Planifiée', effectuee: 'Effectuée', annulee: 'Annulée' };
const statutCls:   Record<string, string> = {
  planifiee: 'bg-blue-100 text-blue-700',
  effectuee: 'bg-green-100 text-green-700',
  annulee:   'bg-red-100 text-red-600',
};

const inputCls = 'w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all';

export default function VisitesPage() {
  const { role, user } = useAuthStore();
  const isEmploye = role === 'employe';

  const [data, setData]       = useState<PaginatedResponse<Visite> | null>(null);
  const [loading, setLoading] = useState(true);
  const [statut, setStatut]   = useState('');
  const [page, setPage]       = useState(1);

  // Modal création
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');
  const [employes, setEmployes]   = useState<EmployeOption[]>([]);
  const [prospects, setProspects] = useState<{ id: number; nom_complet: string }[]>([]);
  const [biens, setBiens]         = useState<{ id: number; designation: string }[]>([]);
  const [form, setForm] = useState<VisiteForm>({
    prospect_id: '', bien_id: '', employe_id: '', date_visite: '', notes: '',
  });

  const fetchVisites = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (statut) params.set('statut', statut);
    api.get<PaginatedResponse<Visite>>(`/org/visites?${params}`)
      .then(({ data: res }) => setData(res))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [statut, page]);

  useEffect(() => { fetchVisites(); }, [fetchVisites]);

  const openModal = () => {
    setForm({ prospect_id: '', bien_id: '', employe_id: '', date_visite: '', notes: '' });
    setError('');
    setShowModal(true);
    // Load dropdowns
    api.get('/org/prospects?per_page=200').then(({ data: r }) => setProspects(r.data ?? [])).catch(() => {});
    api.get('/org/biens?per_page=200').then(({ data: r }) => setBiens(r.data ?? [])).catch(() => {});
    if (!isEmploye) {
      api.get('/org/visites-employes').then(({ data: r }) => setEmployes(r.data ?? [])).catch(() => {});
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.post('/org/visites', {
        prospect_id:  Number(form.prospect_id),
        bien_id:      Number(form.bien_id),
        employe_id:   form.employe_id ? Number(form.employe_id) : null,
        date_visite:  form.date_visite,
        notes:        form.notes || null,
      });
      setShowModal(false);
      fetchVisites();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message ?? 'Erreur lors de la création.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cette visite ?')) return;
    await api.delete(`/org/visites/${id}`).catch(() => {});
    fetchVisites();
  };

  const handleStatutChange = async (id: number, newStatut: string) => {
    await api.patch(`/org/visites/${id}`, { statut: newStatut }).catch(() => {});
    fetchVisites();
  };

  const set = (k: keyof VisiteForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Visites</h1>
          <p className="text-gray-500 text-sm">
            {isEmploye ? 'Vos visites planifiées' : 'Planification et suivi des visites'}
          </p>
        </div>
        <button onClick={openModal}
          className="px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition">
          + Planifier une visite
        </button>
      </div>

      {/* Filtre statut */}
      <div className="flex gap-2 mb-6">
        {['', 'planifiee', 'effectuee', 'annulee'].map((s) => (
          <button key={s} onClick={() => { setStatut(s); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition ${
              statut === s ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}>
            {s === '' ? 'Toutes' : statutLabel[s]}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Chargement…</div>
        ) : !data?.data.length ? (
          <div className="p-8 text-center text-gray-400 text-sm">Aucune visite.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Prospect</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Bien</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Agent</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Date</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Statut</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.data.map((v) => (
                <tr key={v.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-800">{v.prospect?.nom_complet ?? '—'}</td>
                  <td className="px-5 py-3 text-gray-600">{v.bien?.designation ?? '—'}</td>
                  <td className="px-5 py-3 text-gray-600">{v.employe?.nom ?? v.nom_agent ?? '—'}</td>
                  <td className="px-5 py-3 text-gray-500">
                    {new Date(v.date_visite).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statutCls[v.statut]}`}>
                      {statutLabel[v.statut]}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex gap-2 items-center">
                      {v.statut === 'planifiee' && (
                        <button onClick={() => handleStatutChange(v.id, 'effectuee')}
                          className="text-xs text-green-600 hover:underline">Effectuée</button>
                      )}
                      {v.statut === 'planifiee' && (
                        <button onClick={() => handleStatutChange(v.id, 'annulee')}
                          className="text-xs text-orange-500 hover:underline">Annuler</button>
                      )}
                      {!isEmploye && (
                        <button onClick={() => handleDelete(v.id)}
                          className="text-xs text-red-600 hover:underline">Supprimer</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {data && data.meta.last_page > 1 && (
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between text-sm text-gray-600">
            <span>{data.meta.from}–{data.meta.to} sur {data.meta.total}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50">←</button>
              <button onClick={() => setPage(p => Math.min(data.meta.last_page, p + 1))} disabled={page === data.meta.last_page}
                className="px-3 py-1 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50">→</button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">Planifier une visite</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Prospect *</label>
                <select required value={form.prospect_id} onChange={set('prospect_id')} className={inputCls}>
                  <option value="">— Sélectionner —</option>
                  {prospects.map(p => <option key={p.id} value={p.id}>{p.nom_complet}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Bien *</label>
                <select required value={form.bien_id} onChange={set('bien_id')} className={inputCls}>
                  <option value="">— Sélectionner —</option>
                  {biens.map(b => <option key={b.id} value={b.id}>{b.designation}</option>)}
                </select>
              </div>
              {isEmploye ? (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Agent accompagnateur</label>
                  <input
                    type="text"
                    readOnly
                    value={user?.name ?? ''}
                    className={inputCls + ' bg-gray-100 cursor-default'}
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Agent accompagnateur</label>
                  <select value={form.employe_id} onChange={set('employe_id')} className={inputCls}>
                    <option value="">— Aucun —</option>
                    {employes.map(e => <option key={e.id} value={e.id}>{e.nom}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Date et heure *</label>
                <input type="datetime-local" required value={form.date_visite} onChange={set('date_visite')} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Notes</label>
                <textarea rows={2} value={form.notes} onChange={set('notes')} className={inputCls + ' resize-none'} />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-200 rounded-xl transition">
                  Annuler
                </button>
                <button type="submit" disabled={saving}
                  className="px-5 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition">
                  {saving ? 'Enregistrement…' : 'Planifier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
