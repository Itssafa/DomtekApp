'use client';

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from '@/components/OrgLink';
import api from '@/lib/api'
import { orgPath } from '@/lib/org-path';
import { useAuthStore } from '@/store/authStore';
import { Contrat, PaginatedResponse } from '@/types';
import { TemplateFR, TemplateAR, printContrat, type ContratPreviewData } from '@/components/ContratPreview';
import { isPositiveAmount } from '@/lib/validation';

// ─── Constantes ───────────────────────────────────────────────────────────────

const TYPES_LOCATION = ['bail_habitation','bail_etudiant','bail_professionnel','bail_commercial','bail_saisonnier','loyer'];

const TYPES_CONTRAT = [
  { value: 'bail_habitation',    label: "Bail d'habitation" },
  { value: 'bail_etudiant',      label: 'Bail étudiant' },
  { value: 'bail_professionnel', label: 'Bail professionnel' },
  { value: 'bail_commercial',    label: 'Bail commercial' },
  { value: 'bail_saisonnier',    label: 'Bail saisonnier' },
  { value: 'loyer',              label: 'Location' },
  { value: 'vente',              label: 'Vente' },
  { value: 'autre',              label: 'Autre' },
];

const STATUT_STYLES: Record<string, string> = {
  actif:    'bg-green-100 text-green-700',
  termine:  'bg-gray-100 text-gray-600',
  resilie:  'bg-red-100 text-red-600',
};

function typeLabel(t: string) { return TYPES_CONTRAT.find(x => x.value === t)?.label ?? t; }
function fmtMontant(v: number | null | undefined) {
  if (v == null) return '—';
  return Number(v).toLocaleString('fr-TN', { minimumFractionDigits: 3 }) + ' TND';
}

// ─── Modale révision du loyer ─────────────────────────────────────────────────

function ModalRevision({ contrat, onClose, onDone }: {
  contrat: Contrat;
  onClose: () => void;
  onDone: () => void;
}) {
  const [montantHt, setMontantHt] = useState(String(contrat.montant_ht ?? ''));
  const [tva, setTva]             = useState(String(contrat.tva ?? 19));
  const [note, setNote]           = useState('');
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');

  const montantTtc = useMemo(() => {
    const ht  = parseFloat(montantHt);
    const t   = parseFloat(tva || '0');
    return !isNaN(ht) ? (ht * (1 + t / 100)).toFixed(3) : '';
  }, [montantHt, tva]);

  const handleSave = async () => {
    if (!montantHt) { setError('Le montant HT est requis.'); return; }
    if (!isPositiveAmount(montantHt)) { setError('Le montant HT doit être un nombre positif.'); return; }
    if (tva !== '' && (Number(tva) < 0 || Number(tva) > 100)) { setError('La TVA doit être comprise entre 0 et 100.'); return; }
    setSaving(true);
    setError('');
    try {
      await api.put(`/org/contrats/${contrat.id}`, {
        montant_ht:  Number(montantHt),
        tva:         Number(tva || 0),
        montant_ttc: montantTtc ? Number(montantTtc) : undefined,
        notes: note
          ? `[Révision loyer le ${new Date().toLocaleDateString('fr-FR')}] ${note}${contrat.notes ? '\n' + contrat.notes : ''}`
          : contrat.notes ?? undefined,
      });
      onDone();
    } catch {
      setError('Une erreur est survenue.');
    } finally {
      setSaving(false);
    }
  };

  const ic = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500';
  const dc = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Révision du loyer</h2>
            <p className="text-xs text-gray-400 mt-0.5">{contrat.designation ?? `Contrat #${contrat.id}`}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        {/* Loyer actuel */}
        <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm text-gray-600">
          <span className="text-xs font-medium text-gray-500">Loyer actuel TTC : </span>
          <strong className="text-gray-800">{fmtMontant(contrat.montant_ttc ?? contrat.montant_ht)}</strong>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Nouveau montant HT (TND) *</label>
              <input type="number" step="0.001" min="0" value={montantHt} onChange={e => setMontantHt(e.target.value)}
                className={ic} autoFocus />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">TVA (%)</label>
              <input type="number" step="0.1" min="0" max="100" value={tva} onChange={e => setTva(e.target.value)}
                className={ic} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Nouveau montant TTC (calculé)</label>
            <input type="text"
              value={montantTtc ? `${Number(montantTtc).toLocaleString('fr-TN', { minimumFractionDigits: 3 })} TND` : ''}
              disabled className={dc} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Motif / Note de révision</label>
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={2}
              placeholder="Ex : Révision annuelle indice ILC +2,3%…"
              className={ic} />
          </div>
        </div>

        {error && <p className="text-red-500 text-xs mt-2">{error}</p>}

        <div className="flex gap-3 mt-5">
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition">
            {saving ? 'Enregistrement…' : 'Appliquer la révision'}
          </button>
          <button onClick={onClose}
            className="px-5 py-2.5 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition">
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modale terminer la location ──────────────────────────────────────────────

function ModalTerminer({ contrat, onClose, onDone }: {
  contrat: Contrat;
  onClose: () => void;
  onDone: () => void;
}) {
  const [dateFin, setDateFin] = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await api.put(`/org/contrats/${contrat.id}`, {
        statut:   'termine',
        date_fin: dateFin,
      });
      onDone();
    } catch {
      setError('Une erreur est survenue.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Terminer la location</h2>
            <p className="text-xs text-gray-400 mt-0.5">{contrat.designation ?? `Contrat #${contrat.id}`}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm text-orange-700 mb-4">
          Le contrat sera marqué <strong>Terminé</strong> et le bien repassera en disponible.
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Date de fin effective</label>
          <input type="date" value={dateFin} onChange={e => setDateFin(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
        </div>

        {error && <p className="text-red-500 text-xs mt-2">{error}</p>}

        <div className="flex gap-3 mt-5">
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition">
            {saving ? 'Enregistrement…' : 'Confirmer la fin de location'}
          </button>
          <button onClick={onClose}
            className="px-5 py-2.5 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition">
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

const PRINT_ID = 'contrat-list-print-area';

function buildPreviewData(c: Contrat, orgNom: string, orgAdresse: string): ContratPreviewData {
  const isLocation = TYPES_LOCATION.includes(c.type);
  const client = c.clients?.[0] ?? null;
  const bien   = c.bien ?? null;
  const months = (debut: string, fin: string | null) => {
    if (!debut || !fin) return '';
    const d1 = new Date(debut), d2 = new Date(fin);
    const m = (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth());
    if (m <= 0) return '';
    if (m < 12) return `${m} mois`;
    const y = Math.floor(m / 12), r = m % 12;
    return r > 0 ? `${y} an(s) et ${r} mois` : `${y} an(s)`;
  };
  return {
    type: c.type, isLocation,
    designation:        c.designation ?? '',
    utilisation:        c.utilisation ?? '',
    notes:              c.notes ?? '',
    orgNom,
    orgAdresse,
    orgFormeJuridique:  c.forme_juridique ?? '',
    orgRepresentant:    c.representant ?? '',
    clientNom:          client?.nom_complet ?? '',
    clientCivilite:     client?.civilite ?? '',
    clientDateNaissance: client?.date_naissance ?? '',
    clientCin:          client?.cin ?? '',
    clientTypePiece:    client?.type_piece ?? 'CIN',
    clientCinDelivreeLe: c.cin_delivree_le ?? '',
    clientAdresse:      [client?.adresse, client?.ville].filter(Boolean).join(', '),
    bienDesignation:    bien?.designation ?? '',
    bienType:           bien?.type_bien ?? '',
    bienAdresse:        [bien?.adresse, bien?.ville].filter(Boolean).join(', '),
    bienSuperficie:     bien?.superficie != null ? String(bien.superficie) : '',
    dateContrat:        c.date_contrat ?? '',
    dateDebut:          c.date_debut,
    dateFin:            c.date_fin ?? '',
    duree:              months(c.date_debut, c.date_fin),
    montantHt:          String(c.montant_ht),
    tva:                String(c.tva),
    montantTtc:         c.montant_ttc != null ? String(c.montant_ttc) : '',
    periodicite:        c.periodicite_paiement ?? '',
    jourPaiement:       c.jour_paiement != null ? String(c.jour_paiement) : '',
    depotGarantie:      c.depot_garantie != null ? String(c.depot_garantie) : '',
    premiereEcheance:   c.premiere_echeance ?? '',
    assurance:          c.assurance ?? '',
    villeSignature:     c.ville_signature ?? '',
  };
}

export default function ContratsPage() {
  const router = useRouter();
  const { organisation } = useAuthStore();
  const [data, setData]           = useState<PaginatedResponse<Contrat> | null>(null);
  const [loading, setLoading]     = useState(true);
  const [statut, setStatut]       = useState('');
  const [type, setType]           = useState('');
  const [search, setSearch]       = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage]           = useState(1);
  const [deleting, setDeleting]   = useState<number | null>(null);
  const [downloading, setDownloading] = useState<number | null>(null);
  const [expanded, setExpanded]   = useState<Set<number>>(new Set());
  const debounceRef               = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [printState, setPrintState] = useState<{ data: ContratPreviewData; lang: 'fr' | 'ar' } | null>(null);
  const printPending = useRef(false);

  // Modales
  const [modalRevision, setModalRevision] = useState<Contrat | null>(null);
  const [modalTerminer, setModalTerminer] = useState<Contrat | null>(null);

  const handleSearchChange = (val: string) => {
    setSearchInput(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(val);
      setPage(1);
    }, 350);
  };

  const toggleExpand = (id: number) =>
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const fetchContrats = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statut) params.set('statut', statut);
    if (type)   params.set('type', type);
    if (search) params.set('search', search);
    params.set('page', String(page));
    api.get<PaginatedResponse<Contrat>>(`/org/contrats?${params}`)
      .then(({ data: res }) => setData(res))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [statut, type, search, page]);

  useEffect(() => { fetchContrats(); }, [fetchContrats]);

  /* Déclencher l'impression dès que printState est rendu dans le DOM caché */
  useEffect(() => {
    if (!printState || !printPending.current) return;
    const t = setTimeout(() => {
      printPending.current = false;
      printContrat(PRINT_ID);
      setDownloading(null);
      setPrintState(null);
    }, 80);
    return () => clearTimeout(t);
  }, [printState]);

  const handleDownloadPdf = (c: Contrat, lang: 'fr' | 'ar') => {
    setDownloading(c.id);
    printPending.current = true;
    const orgAdresse = [organisation?.adresse, organisation?.ville].filter(Boolean).join(', ');
    setPrintState({ data: buildPreviewData(c, organisation?.nom ?? '', orgAdresse), lang });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer ce contrat ?')) return;
    setDeleting(id);
    try {
      await api.delete(`/org/contrats/${id}`);
      fetchContrats();
    } catch { /* noop */ }
    finally { setDeleting(null); }
  };

  return (
    <div className="p-8">
      {/* Modales */}
      {modalRevision && (
        <ModalRevision
          contrat={modalRevision}
          onClose={() => setModalRevision(null)}
          onDone={() => { setModalRevision(null); fetchContrats(); }}
        />
      )}
      {modalTerminer && (
        <ModalTerminer
          contrat={modalTerminer}
          onClose={() => setModalTerminer(null)}
          onDone={() => { setModalTerminer(null); fetchContrats(); }}
        />
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Contrats</h1>
          <p className="text-gray-500 text-sm">Baux, ventes et locations</p>
        </div>
        <Link href="/dashboard/contrats/nouveau"
          className="px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition">
          + Nouveau contrat
        </Link>
      </div>

      {/* Filtres */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
          </svg>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Rechercher désignation, bien, client…"
            className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm w-72 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>
        <select value={type} onChange={e => { setType(e.target.value); setPage(1); }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
          <option value="">Tous types</option>
          {TYPES_CONTRAT.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <select value={statut} onChange={e => { setStatut(e.target.value); setPage(1); }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
          <option value="">Tous statuts</option>
          <option value="actif">Actif</option>
          <option value="termine">Terminé</option>
          <option value="resilie">Résilié</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Chargement…</div>
        ) : !data?.data.length ? (
          <div className="p-8 text-center text-gray-400 text-sm">Aucun contrat.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="w-8 px-3 py-3" />
                <th className="text-left px-5 py-3 font-medium text-gray-600">Désignation / Bien</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Clients</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Type</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Montant TTC</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Périodicité</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Début</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Statut</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((c) => {
                const isLocation = TYPES_LOCATION.includes(c.type);
                const isActif    = c.statut === 'actif';
                const isOpen     = expanded.has(c.id);
                return (
                  <React.Fragment key={c.id}>
                    {/* ── Ligne principale ── */}
                    <tr
                      className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                      onClick={() => router.push(orgPath(`/dashboard/contrats/${c.id}`))}>
                      <td className="px-3 py-3 text-center" onClick={e => { e.stopPropagation(); toggleExpand(c.id); }}>
                        <svg
                          className={`w-4 h-4 text-gray-400 mx-auto transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
                          fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </td>
                      <td className="px-5 py-3">
                        <div className="font-medium text-gray-800">{c.designation ?? `Contrat #${c.id}`}</div>
                        <div className="text-xs text-gray-400">{c.bien?.designation ?? '—'}</div>
                      </td>
                      <td className="px-5 py-3 text-gray-600 text-xs">
                        {c.clients?.map(cl => cl.nom_complet).join(', ') ?? '—'}
                      </td>
                      <td className="px-5 py-3 text-gray-600 text-xs">{typeLabel(c.type)}</td>
                      <td className="px-5 py-3 font-medium text-gray-800 whitespace-nowrap">
                        {fmtMontant(c.montant_ttc ?? c.montant_ht)}
                      </td>
                      <td className="px-5 py-3 text-gray-500 text-xs capitalize">
                        {c.periodicite_paiement ?? '—'}
                      </td>
                      <td className="px-5 py-3 text-gray-500 whitespace-nowrap">
                        {new Date(c.date_debut).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUT_STYLES[c.statut]}`}>
                          {c.statut === 'actif' ? 'Actif' : c.statut === 'termine' ? 'Terminé' : 'Résilié'}
                        </span>
                      </td>
                    </tr>

                    {/* ── Ligne d'actions dépliable ── */}
                    {isOpen && (
                      <tr className="bg-blue-50 border-b border-blue-100">
                        <td />
                        <td colSpan={7} className="px-5 py-3">
                          <div className="flex flex-wrap gap-2">
                            <Link href={`/dashboard/contrats/${c.id}`}
                              onClick={e => e.stopPropagation()}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-medium rounded-lg transition">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                              Modifier
                            </Link>

                            <button onClick={e => { e.stopPropagation(); handleDownloadPdf(c, 'fr'); }}
                              disabled={downloading === c.id}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-medium rounded-lg transition">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                              {downloading === c.id ? '…' : 'PDF — FR'}
                            </button>
                            <button onClick={e => { e.stopPropagation(); handleDownloadPdf(c, 'ar'); }}
                              disabled={downloading === c.id}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 text-white text-xs font-medium rounded-lg transition"
                              style={{ fontFamily: 'Tahoma, Arial, sans-serif' }}>
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                              {downloading === c.id ? '…' : 'PDF — عربي'}
                            </button>

                            {isLocation && isActif && (
                              <>
                                <button onClick={e => { e.stopPropagation(); setModalRevision(c); }}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-medium rounded-lg transition">
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                  Révision du loyer
                                </button>

                                <button onClick={e => { e.stopPropagation(); setModalTerminer(c); }}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-medium rounded-lg transition">
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                  Terminer la location
                                </button>
                              </>
                            )}

                            <button onClick={e => { e.stopPropagation(); handleDelete(c.id); }}
                              disabled={deleting === c.id}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-xs font-medium rounded-lg transition">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              {deleting === c.id ? '…' : 'Supprimer'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
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

      {/* Div hors-écran pour générer le PDF contrat depuis la liste */}
      {printState && (
        <div style={{ position: 'fixed', left: '-9999px', top: 0, pointerEvents: 'none', opacity: 0 }}>
          <div id={PRINT_ID}>
            {printState.lang === 'ar'
              ? <TemplateAR d={printState.data} />
              : <TemplateFR d={printState.data} />}
          </div>
        </div>
      )}
    </div>
  );
}
