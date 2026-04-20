'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from '@/components/OrgLink';
import api from '@/lib/api';
import { orgPath } from '@/lib/org-path';
import { Employe, PaginatedResponse } from '@/types';

type Tab = 'actifs' | 'en_attente';

export default function EmployesPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('actifs');

  // Actifs list
  const [data, setData] = useState<PaginatedResponse<Employe> | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statut, setStatut] = useState('');
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState<number | null>(null);

  // Pending list
  const [pending, setPending] = useState<Employe[]>([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const [activating, setActivating] = useState<number | null>(null);

  const fetchEmployes = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (statut) params.set('statut', statut);
    params.set('page', String(page));
    api.get<PaginatedResponse<Employe>>(`/org/employes?${params}`)
      .then(({ data: res }) => setData(res))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, statut, page]);

  const fetchPending = useCallback(() => {
    setLoadingPending(true);
    api.get<{ data: Employe[] }>('/org/employes-en-attente')
      .then(({ data: res }) => setPending(res.data ?? (res as unknown as Employe[])))
      .catch(() => {})
      .finally(() => setLoadingPending(false));
  }, []);

  useEffect(() => { fetchPending(); }, [fetchPending]);

  useEffect(() => {
    if (tab === 'actifs') fetchEmployes();
    else fetchPending();
  }, [tab, fetchEmployes, fetchPending]);

  const handleDelete = async (id: number, nom: string) => {
    if (!confirm(`Supprimer "${nom}" ?`)) return;
    setDeleting(id);
    try {
      await api.delete(`/org/employes/${id}`);
      fetchEmployes();
    } catch { /* noop */ }
    finally { setDeleting(null); }
  };

  const handleActivate = async (employe: Employe) => {
    if (!confirm(`Activer le compte de "${employe.nom} ${employe.prenom}" ?`)) return;
    setActivating(employe.id);
    try {
      await api.post(`/org/employes/${employe.id}/activer`);
      fetchPending();
    } catch { /* noop */ }
    finally { setActivating(null); }
  };

  const statutBadge = (s: string) => {
    if (s === 'actif') return 'bg-green-100 text-green-700';
    if (s === 'en_attente') return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-600';
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Employés</h1>
          <p className="text-gray-500 text-sm">CRM — Gestion de l&apos;équipe</p>
        </div>
        <Link href="/dashboard/employes/nouveau"
          className="px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition">
          + Nouvel employé
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {(['actifs', 'en_attente'] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            {t === 'actifs' ? 'Employés actifs' : (
              <span className="flex items-center gap-2">
                En attente
                {pending.length > 0 && (
                  <span className="inline-flex items-center justify-center w-4 h-4 bg-yellow-500 text-white text-[10px] font-bold rounded-full">
                    {pending.length}
                  </span>
                )}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === 'actifs' ? (
        <>
          <div className="flex gap-3 mb-6">
            <input type="text" placeholder="Rechercher…" value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 w-64" />
            <select value={statut} onChange={(e) => { setStatut(e.target.value); setPage(1); }}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
              <option value="">Tous</option>
              <option value="actif">Actif</option>
              <option value="inactif">Inactif</option>
            </select>
          </div>

          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-gray-400 text-sm">Chargement…</div>
            ) : !data?.data.length ? (
              <div className="p-8 text-center text-gray-400 text-sm">Aucun employé.</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-5 py-3 font-medium text-gray-600">Nom</th>
                    <th className="text-left px-5 py-3 font-medium text-gray-600">Email</th>
                    <th className="text-left px-5 py-3 font-medium text-gray-600">Poste</th>
                    <th className="text-left px-5 py-3 font-medium text-gray-600">Embauche</th>
                    <th className="text-left px-5 py-3 font-medium text-gray-600">Statut</th>
                    <th className="text-left px-5 py-3 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.data.map((e) => (
                    <tr key={e.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => router.push(orgPath(`/dashboard/employes/${e.id}`))}>
                      <td className="px-5 py-3 font-medium text-gray-800">{e.nom_complet}</td>
                      <td className="px-5 py-3 text-gray-600">{e.email ?? '—'}</td>
                      <td className="px-5 py-3 text-gray-600">{e.poste ?? '—'}</td>
                      <td className="px-5 py-3 text-gray-500">
                        {e.date_embauche ? new Date(e.date_embauche).toLocaleDateString('fr-FR') : '—'}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statutBadge(e.statut)}`}>
                          {e.statut === 'actif' ? 'Actif' : e.statut === 'en_attente' ? 'En attente' : 'Inactif'}
                        </span>
                      </td>
                      <td className="px-5 py-3" onClick={(ev) => ev.stopPropagation()}>
                        <div className="flex gap-2">
                          <Link href={`/dashboard/employes/${e.id}`} className="text-xs text-violet-600 hover:underline">Voir</Link>
                          <button onClick={() => handleDelete(e.id, e.nom_complet)} disabled={deleting === e.id}
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
        </>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {loadingPending ? (
            <div className="p-8 text-center text-gray-400 text-sm">Chargement…</div>
          ) : !pending.length ? (
            <div className="p-8 text-center text-gray-400 text-sm">Aucun compte en attente d&apos;activation.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Nom</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Email</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">CIN</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Date de naissance</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Inscrit le</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pending.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-800">{e.prenom} {e.nom}</td>
                    <td className="px-5 py-3 text-gray-600">{e.email ?? '—'}</td>
                    <td className="px-5 py-3 text-gray-600">{e.cin ?? '—'}</td>
                    <td className="px-5 py-3 text-gray-500">
                      {e.date_naissance ? new Date(e.date_naissance).toLocaleDateString('fr-FR') : '—'}
                    </td>
                    <td className="px-5 py-3 text-gray-500">
                      {new Date(e.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => handleActivate(e)}
                        disabled={activating === e.id}
                        className="px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white text-xs font-medium rounded-lg transition">
                        {activating === e.id ? 'Activation…' : 'Activer'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
