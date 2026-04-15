'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from '@/components/OrgLink';
import api from '@/lib/api';
import { Bien, Prospect, ImpressionVisite, PaginatedResponse } from '@/types';
import { AxiosError } from 'axios';

// ─── Modale planifier une visite ──────────────────────────────────────────────

function ModalVisite({ prospects, defaultProspectId, onClose, onDone }: {
  prospects: Prospect[];
  defaultProspectId?: number;
  onClose: () => void;
  onDone: () => void;
}) {
  const [biens, setBiens]     = useState<Bien[]>([]);
  const [saving, setSaving]   = useState(false);
  const [errors, setErrors]   = useState<Record<string, string[]>>({});
  const [globalError, setGlobalError] = useState('');

  const now = new Date();
  now.setMinutes(0, 0, 0);
  now.setHours(now.getHours() + 1);
  const defaultDatetime = now.toISOString().slice(0, 16);

  const [form, setForm] = useState({
    prospect_id:      defaultProspectId ? String(defaultProspectId) : '',
    bien_id:          '',
    nom_agent:        '',
    date_visite:      defaultDatetime,
    statut:           'planifiee',
    impression_client:'' as ImpressionVisite | '',
    notes:            '',
  });

  useEffect(() => {
    api.get('/org/biens?per_page=200')
      .then(r => setBiens(r.data.data ?? []))
      .catch(() => {});
  }, []);

  const set = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm(p => ({ ...p, [field]: e.target.value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setGlobalError('');
    setSaving(true);
    try {
      await api.post('/org/visites', {
        prospect_id:       Number(form.prospect_id),
        bien_id:           Number(form.bien_id),
        nom_agent:         form.nom_agent,
        date_visite:       form.date_visite,
        statut:            form.statut,
        impression_client: form.statut === 'effectuee' && form.impression_client ? form.impression_client : undefined,
        notes:             form.notes || undefined,
      });
      onDone();
    } catch (err) {
      const ae = err as AxiosError<{ errors?: Record<string, string[]>; message?: string }>;
      if (ae.response?.data?.errors) setErrors(ae.response.data.errors);
      else setGlobalError(ae.response?.data?.message ?? 'Une erreur est survenue.');
    } finally {
      setSaving(false);
    }
  };

  const errMsg = (f: string) => errors[f]
    ? <p className="text-red-500 text-xs mt-1">{errors[f][0]}</p>
    : null;

  const ic = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
  const lc = 'block text-xs font-medium text-gray-500 mb-1';

  const selectedBien = biens.find(b => b.id === Number(form.bien_id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-800">Planifier une visite</h2>
              <p className="text-xs text-gray-400">Réservation d'une visite de bien</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>

        <form onSubmit={handleSave} className="px-6 py-5 space-y-4">
          {globalError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{globalError}</div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lc}>Prospect *</label>
              <select value={form.prospect_id} onChange={set('prospect_id')} className={ic}>
                <option value="">— Sélectionner —</option>
                {prospects.map(c => (
                  <option key={c.id} value={c.id}>{c.nom_complet}</option>
                ))}
              </select>
              {errMsg('prospect_id')}
            </div>
            <div>
              <label className={lc}>Agent accompagnateur *</label>
              <input type="text" value={form.nom_agent} onChange={set('nom_agent')}
                placeholder="Nom de l'agent" className={ic} autoFocus />
              {errMsg('nom_agent')}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lc}>Date et heure *</label>
              <input type="datetime-local" value={form.date_visite} onChange={set('date_visite')} className={ic} />
              {errMsg('date_visite')}
            </div>
            <div>
              <label className={lc}>Statut</label>
              <select value={form.statut} onChange={set('statut')} className={ic}>
                <option value="planifiee">Planifiée</option>
                <option value="effectuee">Effectuée</option>
                <option value="annulee">Annulée</option>
              </select>
            </div>
          </div>

          {form.statut === 'effectuee' && (
            <div>
              <label className={lc}>Impression du prospect</label>
              <div className="flex gap-2">
                {(['satisfait','neutre','non_satisfait'] as ImpressionVisite[]).map(v => {
                  const labels = { très_satisfait : '😄très satisfait' ,satisfait: '😊 Satisfait', neutre: '😐 Neutre',  plutot_non_satisfait: ' 😞 plutot Non satisfait' , non_satisfait: '😠 Non satisfait'  };
                  const styles = {
                    très_satisfait:    form.impression_client === v ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-green-100',
                    satisfait:          form.impression_client === v ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-green-100',
                    neutre:           form.impression_client === v ? 'bg-yellow-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-yellow-100',
                    plutot_non_satisfait: form.impression_client === v ? 'bg-red-500 text-white'   : 'bg-gray-100 text-gray-600 hover:bg-red-100',
                    non_satisfait:        form.impression_client === v ? 'bg-red-500 text-white'   : 'bg-gray-100 text-gray-600 hover:bg-red-100',
                     
                  };
                  return (
                    <button key={v} type="button"
                      onClick={() => setForm(p => ({ ...p, impression_client: p.impression_client === v ? '' : v }))}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition ${styles[v]}`}>
                      {labels[v]}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <label className={lc}>Bien à visiter *</label>
            <select value={form.bien_id} onChange={set('bien_id')} className={ic}>
              <option value="">— Sélectionner un bien —</option>
              {biens.map(b => (
                <option key={b.id} value={b.id}>
                  {b.designation}{b.ville ? ` — ${b.ville}` : ''}{b.type_bien ? ` (${b.type_bien})` : ''}
                </option>
              ))}
            </select>
            {errMsg('bien_id')}
          </div>

          {selectedBien && (
            <div className="bg-blue-50 rounded-lg px-4 py-2.5 text-xs text-gray-600 flex gap-4">
              <span><span className="font-medium">Type :</span> {selectedBien.type_bien ?? '—'}</span>
              <span><span className="font-medium">Ville :</span> {selectedBien.ville ?? '—'}</span>
              {selectedBien.superficie && (
                <span><span className="font-medium">Superficie :</span> {selectedBien.superficie} m²</span>
              )}
            </div>
          )}

          <div>
            <label className={lc}>Notes</label>
            <textarea value={form.notes} onChange={set('notes')} rows={2}
              placeholder="Remarques, demandes particulières du prospect…"
              className={ic} />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="submit"
              disabled={saving || !form.prospect_id || !form.bien_id || !form.nom_agent || !form.date_visite}
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition">
              {saving ? 'Enregistrement…' : 'Planifier la visite'}
            </button>
            <button type="button" onClick={onClose}
              className="px-5 py-2.5 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition">
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Badge score d'opportunité ────────────────────────────────────────────────

function ScoreBadge({ score }: { score: number }) {
  const { bg, label } =
    score >= 81 ? { bg: 'bg-green-100 text-green-700',  label: 'Excellent' } :
    score >= 61 ? { bg: 'bg-blue-100 text-blue-700',    label: 'Bon'       } :
    score >= 31 ? { bg: 'bg-orange-100 text-orange-700',label: 'Moyen'     } :
                  { bg: 'bg-red-100 text-red-600',       label: 'Faible'    };
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-16 h-1.5 rounded-full bg-gray-200 overflow-hidden">
        <div className="h-full rounded-full transition-all"
          style={{ width: `${score}%`, background: score >= 81 ? '#16a34a' : score >= 61 ? '#2563eb' : score >= 31 ? '#ea580c' : '#dc2626' }} />
      </div>
      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${bg}`}>{score}% {label}</span>
    </div>
  );
}

// ─── Page prospects ───────────────────────────────────────────────────────────

export default function ProspectsPage() {
  const [data, setData]         = useState<PaginatedResponse<Prospect> | null>(null);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [page, setPage]         = useState(1);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [allProspects, setAllProspects] = useState<Prospect[]>([]);

  const [showVisite, setShowVisite]             = useState(false);
  const [visiteProspectId, setVisiteProspectId] = useState<number | undefined>(undefined);

  const fetchProspects = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    params.set('page', String(page));
    api.get<PaginatedResponse<Prospect>>(`/org/prospects?${params}`)
      .then(({ data: res }) => setData(res))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, page]);

  useEffect(() => { fetchProspects(); }, [fetchProspects]);

  useEffect(() => {
    api.get('/org/prospects?per_page=200')
      .then(r => setAllProspects(r.data.data ?? []))
      .catch(() => {});
  }, []);

  const openVisite = (prospectId?: number) => {
    setVisiteProspectId(prospectId);
    setShowVisite(true);
  };

  const handleDelete = async (id: number, nom: string) => {
    if (!confirm(`Supprimer "${nom}" ?`)) return;
    setDeleting(id);
    try {
      await api.delete(`/org/prospects/${id}`);
      fetchProspects();
    } catch { /* noop */ }
    finally { setDeleting(null); }
  };

  return (
    <div className="p-8">
      {showVisite && (
        <ModalVisite
          prospects={allProspects}
          defaultProspectId={visiteProspectId}
          onClose={() => setShowVisite(false)}
          onDone={() => setShowVisite(false)}
        />
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Prospects</h1>
          <p className="text-gray-500 text-sm">CRM — Fiche prospects</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => openVisite()}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Planifier une visite
          </button>
          <Link href="/dashboard/prospects/nouveau"
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition">
            + Nouveau prospect
          </Link>
        </div>
      </div>

      <div className="mb-6">
        <input type="text" placeholder="Rechercher par nom, email ou téléphone…" value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-80" />
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Chargement…</div>
        ) : !data?.data.length ? (
          <div className="p-8 text-center text-gray-400 text-sm">Aucun prospect.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Nom</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Email</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Téléphone</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Ville</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Score d'opportunité</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.data.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <Link href={`/dashboard/prospects/${c.id}`} className="font-medium text-gray-800 hover:text-blue-600">
                      {c.nom_complet}
                    </Link>
                    {c.cin && <p className="text-xs text-gray-400">CIN : {c.cin}</p>}
                  </td>
                  <td className="px-5 py-3 text-gray-600">{c.email ?? '—'}</td>
                  <td className="px-5 py-3 text-gray-600">{c.telephone ?? '—'}</td>
                  <td className="px-5 py-3 text-gray-600">{c.ville ?? '—'}</td>
                  <td className="px-5 py-3">
                    <ScoreBadge score={c.score_opportunite ?? 0} />
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex gap-2 items-center">
                      <button onClick={() => openVisite(c.id)}
                        className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Visite
                      </button>
                      <Link href={`/dashboard/prospects/${c.id}`} className="text-xs text-blue-600 hover:underline">
                        Voir/Modifier
                      </Link>
                      <button onClick={() => handleDelete(c.id, c.nom_complet)} disabled={deleting === c.id}
                        className="text-xs text-red-600 hover:underline disabled:opacity-40">Supprimer</button>
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
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50">←</button>
              <button onClick={() => setPage((p) => Math.min(data.meta.last_page, p + 1))} disabled={page === data.meta.last_page}
                className="px-3 py-1 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50">→</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
