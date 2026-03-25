'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Immeuble } from '@/types';
import { AxiosError } from 'axios';

const TYPES_BIEN = ['appartement', 'maison', 'villa', 'bureau', 'terrain', 'autre'];

const Section = ({ title }: { title: string }) => (
  <div className="flex items-center gap-3 pt-1">
    <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide whitespace-nowrap">{title}</span>
    <div className="flex-1 h-px bg-gray-200" />
  </div>
);

export default function NouveauBienPage() {
  const router = useRouter();

  const [immeubles, setImmeubles] = useState<Immeuble[]>([]);
  const [batiment, setBatiment]   = useState<'independant' | 'immeuble'>('independant');
  const [immeubleId, setImmeubleId] = useState('');

  const [form, setForm] = useState({
    titre: '', description: '', type_transaction: 'vente', type_bien: 'appartement',
    prix: '', superficie: '', adresse: '', ville: '',
    nb_pieces: '', nb_chambres: '', nb_salles_bain: '',
    etage: '', bloc: '',
  });
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/org/immeubles?per_page=200')
      .then((res) => setImmeubles(res.data.data ?? []))
      .catch(() => {});
  }, []);

  const selectedImmeuble = useMemo(
    () => immeubles.find((i) => i.id === Number(immeubleId)) ?? null,
    [immeubleId, immeubles]
  );

  const set = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    try {
      const payload: Record<string, unknown> = { ...form };
      if (batiment === 'immeuble' && immeubleId) {
        payload.immeuble_id = Number(immeubleId);
        payload.etage       = form.etage ? Number(form.etage) : undefined;
        payload.bloc        = form.bloc  ? Number(form.bloc)  : undefined;
      } else {
        payload.immeuble_id = null;
        payload.bloc        = null;
        payload.etage       = form.etage ? Number(form.etage) : undefined;
      }
      const { data } = await api.post('/org/biens', payload);
      router.push(`/dashboard/biens/${data.data.id}`);
    } catch (err) {
      const axiosError = err as AxiosError<{ errors?: Record<string, string[]> }>;
      setErrors(axiosError.response?.data?.errors ?? {});
    } finally {
      setLoading(false);
    }
  };

  const inp = (label: string, key: string, type = 'text', placeholder = '') => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input type={type} value={(form as Record<string, string>)[key]} onChange={set(key)} placeholder={placeholder}
        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      {errors[key] && <p className="text-red-500 text-xs mt-1">{errors[key][0]}</p>}
    </div>
  );

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <Link href="/dashboard/biens" className="text-sm text-gray-400 hover:text-gray-600">← Retour aux biens</Link>
        <h1 className="text-2xl font-bold text-gray-800 mt-2">Nouveau bien</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* ── Informations générales ── */}
          <Section title="Informations générales" />
          {inp('Titre', 'titre', 'text', 'Appartement F3 à Tunis')}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={form.description} onChange={set('description')} rows={3} placeholder="Décrivez le bien…"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Transaction</label>
              <select value={form.type_transaction} onChange={set('type_transaction')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="vente">Vente</option>
                <option value="loyer">Location</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type de bien</label>
              <select value={form.type_bien} onChange={set('type_bien')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {TYPES_BIEN.map((t) => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {inp('Prix (TND)', 'prix', 'number', '250000')}
            {inp('Superficie (m²)', 'superficie', 'number', '85')}
          </div>

          {/* ── Bâtiment ── */}
          <Section title="Bâtiment" />
          <div className="flex gap-3">
            {(['independant', 'immeuble'] as const).map((v) => (
              <button key={v} type="button" onClick={() => { setBatiment(v); setImmeubleId(''); setForm((p) => ({ ...p, bloc: '', etage: '' })); }}
                className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition ${
                  batiment === v
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}>
                {v === 'independant' ? 'Indépendant' : 'Appartient à un immeuble'}
              </button>
            ))}
          </div>

          {batiment === 'immeuble' && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              {/* Immeuble */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Immeuble</label>
                <select value={immeubleId} onChange={(e) => { setImmeubleId(e.target.value); setForm((p) => ({ ...p, bloc: '', etage: '' })); }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">— Sélectionner un immeuble —</option>
                  {immeubles.map((imm) => (
                    <option key={imm.id} value={imm.id}>{imm.nom} {imm.ville ? `— ${imm.ville}` : ''}</option>
                  ))}
                </select>
                {immeubles.length === 0 && (
                  <p className="text-amber-600 text-xs mt-1">Aucun immeuble créé. <Link href="/dashboard/immeubles/nouveau" className="underline">Créer un immeuble</Link></p>
                )}
              </div>

              {selectedImmeuble && (
                <div className="grid grid-cols-2 gap-4">
                  {/* Étage */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Étage</label>
                    <select value={form.etage} onChange={set('etage')}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">— Sélectionner —</option>
                      <option value="0">RDC (0)</option>
                      {Array.from({ length: selectedImmeuble.nb_etages }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>Étage {n}</option>
                      ))}
                    </select>
                  </div>

                  {/* Bloc — uniquement si l'immeuble a des blocs */}
                  {selectedImmeuble.a_blocs && selectedImmeuble.nb_blocs && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bloc</label>
                      <select value={form.bloc} onChange={set('bloc')}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">— Sélectionner —</option>
                        {Array.from({ length: selectedImmeuble.nb_blocs }, (_, i) => i + 1).map((n) => (
                          <option key={n} value={n}>Bloc {n}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Étage libre si indépendant */}
          {batiment === 'independant' && (
            <div className="grid grid-cols-4 gap-4">
              {inp('Pièces', 'nb_pieces', 'number', '4')}
              {inp('Chambres', 'nb_chambres', 'number', '2')}
              {inp('SDB', 'nb_salles_bain', 'number', '1')}
              {inp('Étage', 'etage', 'number', '2')}
            </div>
          )}

          {/* ── Localisation ── */}
          <Section title="Localisation" />
          <div className="grid grid-cols-2 gap-4">
            {inp('Adresse', 'adresse', 'text', 'Rue de la République')}
            {inp('Ville', 'ville', 'text', 'Tunis')}
          </div>

          {/* Détails si immeuble (pièces/SDB sans étage) */}
          {batiment === 'immeuble' && (
            <div className="grid grid-cols-3 gap-4">
              {inp('Pièces', 'nb_pieces', 'number', '4')}
              {inp('Chambres', 'nb_chambres', 'number', '2')}
              {inp('SDB', 'nb_salles_bain', 'number', '1')}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition">
              {loading ? 'Enregistrement…' : 'Créer le bien'}
            </button>
            <Link href="/dashboard/biens"
              className="px-6 py-2.5 border border-gray-300 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition">
              Annuler
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
