'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Client, Contrat, Facture } from '@/types';
import { AxiosError } from 'axios';

const Section = ({ title }: { title: string }) => (
  <div className="flex items-center gap-3 pt-2">
    <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide whitespace-nowrap">{title}</span>
    <div className="flex-1 h-px bg-gray-200" />
  </div>
);

export default function FicheClientPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [client, setClient]       = useState<Client | null>(null);
  const [contrats, setContrats]   = useState<Contrat[]>([]);
  const [factures, setFactures]   = useState<Facture[]>([]);
  const [form, setForm] = useState({
    civilite: '', nom: '', prenom: '',
    telephone: '', email: '', ville: '',
    date_naissance: '', lieu_naissance: '',
    type_piece: '', cin: '',
    urgence_nom: '', urgence_telephone: '', urgence_relation: '',
    notes: '',
  });
  const [errors, setErrors]         = useState<Record<string, string[]>>({});
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [uploading, setUploading]   = useState(false);
  const [uploadDone, setUploadDone] = useState(false);

  const fetchClient = () => {
    setLoading(true);
    Promise.all([
      api.get<{ data: Client }>(`/org/clients/${id}`),
      api.get(`/org/contrats?client_id=${id}&per_page=5`),
      api.get(`/org/factures?client_id=${id}&per_page=5`),
    ]).then(([c, co, f]) => {
      const cl = c.data.data;
      setClient(cl);
      setForm({
        civilite:          cl.civilite ?? '',
        nom:               cl.nom,
        prenom:            cl.prenom,
        telephone:         cl.telephone ?? '',
        email:             cl.email ?? '',
        ville:             cl.ville ?? '',
        date_naissance:    cl.date_naissance ?? '',
        lieu_naissance:    cl.lieu_naissance ?? '',
        type_piece:        cl.type_piece ?? '',
        cin:               cl.cin ?? '',
        urgence_nom:       cl.urgence_nom ?? '',
        urgence_telephone: cl.urgence_telephone ?? '',
        urgence_relation:  cl.urgence_relation ?? '',
        notes:             cl.notes ?? '',
      });
      setContrats(co.data.data ?? []);
      setFactures(f.data.data ?? []);
    }).catch(() => {})
    .finally(() => setLoading(false));
  };

  useEffect(() => { fetchClient(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSaving(true);
    try {
      await api.put(`/org/clients/${id}`, form);
      router.push('/dashboard/clients');
    } catch (err) {
      const axiosError = err as AxiosError<{ errors?: Record<string, string[]> }>;
      setErrors(axiosError.response?.data?.errors ?? {});
    } finally {
      setSaving(false);
    }
  };

  const handleUploadDocument = async (file: File) => {
    setUploading(true);
    setUploadDone(false);
    try {
      const fd = new FormData();
      fd.append('document', file);
      const { data } = await api.post(`/org/clients/${id}/document`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setClient(data.data);
      setUploadDone(true);
    } catch { /* noop */ }
    finally { setUploading(false); }
  };

  const inp = (
    label: string, key: string,
    type: React.HTMLInputTypeAttribute = 'text',
    placeholder = '', required = false
  ) => (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input type={type} value={(form as Record<string, string>)[key]} onChange={set(key)}
        placeholder={placeholder} required={required}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      {errors[key] && <p className="text-red-500 text-xs mt-1">{errors[key][0]}</p>}
    </div>
  );

  if (loading) return <div className="p-8 animate-pulse h-40 bg-gray-100 rounded-xl" />;

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-6">
        <Link href="/dashboard/clients" className="text-sm text-gray-400 hover:text-gray-600">← Retour</Link>
        <h1 className="text-2xl font-bold text-gray-800 mt-2">{client?.nom_complet}</h1>
      </div>

      {/* ── Formulaire principal ── */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <form onSubmit={handleSave} className="space-y-4">

          {/* ── 1. Identité ── */}
          <Section title="Identité" />
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Civilité</label>
              <select value={form.civilite} onChange={set('civilite')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">—</option>
                <option value="M.">M.</option>
                <option value="Mme">Mme</option>
                <option value="Mlle">Mlle</option>
              </select>
            </div>
            {inp('Nom', 'nom', 'text', '', true)}
            {inp('Prénom', 'prenom', 'text', '', true)}
          </div>

          {/* ── 2. Contact ── */}
          <Section title="Contact" />
          <div className="grid grid-cols-3 gap-4">
            {inp('N° Téléphone', 'telephone', 'tel')}
            {inp('Email', 'email', 'email')}
            {inp('Ville', 'ville')}
          </div>

          {/* ── 3. Naissance ── */}
          <Section title="Naissance" />
          <div className="grid grid-cols-2 gap-4">
            {inp('Date de naissance', 'date_naissance', 'date')}
            {inp('Lieu de naissance', 'lieu_naissance')}
          </div>

          {/* ── 4. Document d'identité ── */}
          <Section title="Document d'identité" />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Type de pièce</label>
              <select value={form.type_piece} onChange={set('type_piece')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">— Sélectionner —</option>
                <option value="CIN">CIN</option>
                <option value="Passeport">Passeport</option>
              </select>
            </div>
            {inp('N° de pièce', 'cin')}
          </div>
          {/* Pièce jointe — dans la même section */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Pièce jointe <span className="text-gray-400 font-normal">(PDF, JPG, PNG — max 5 Mo)</span>
            </label>
            {client?.document_url && (
              <div className="flex items-center gap-3 mb-2 p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm">
                <span className="text-gray-500 flex-1">Document actuel</span>
                <a href={client.document_url} target="_blank" rel="noopener noreferrer"
                  className="text-blue-600 hover:underline text-xs">Voir le fichier</a>
              </div>
            )}
            <div onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg px-4 py-4 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition">
              {uploading
                ? <p className="text-sm text-gray-400">Envoi en cours…</p>
                : uploadDone
                  ? <p className="text-sm text-green-600 font-medium">Document mis à jour</p>
                  : <p className="text-sm text-gray-400">
                      {client?.document_url ? 'Cliquer pour remplacer' : 'Cliquer pour importer'}
                    </p>
              }
            </div>
            <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUploadDocument(f); }} />
          </div>

          {/* ── 5. Contact d'urgence ── */}
          <Section title="Contact d'urgence" />
          <div className="grid grid-cols-3 gap-4">
            {inp('Nom', 'urgence_nom')}
            {inp('N° Téléphone', 'urgence_telephone', 'tel')}
            {inp('Relation', 'urgence_relation', 'text', 'Parent, conjoint…')}
          </div>

          {/* ── 6. Note ── */}
          <Section title="Note" />
          <textarea value={form.notes} onChange={set('notes')} rows={3}
            placeholder="Remarques internes…"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />

          <button type="submit" disabled={saving}
            className="mt-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition">
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </form>
      </div>

      {/* ── Contrats ── */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Contrats ({contrats.length})</h2>
        {!contrats.length ? <p className="text-sm text-gray-400">Aucun contrat.</p> : (
          <div className="space-y-2">
            {contrats.map((c) => (
              <div key={c.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
                <span className="font-medium text-gray-700">{c.bien?.titre ?? `Contrat #${c.id}`}</span>
                <span className="text-gray-500">{Number(c.montant).toLocaleString('fr-TN')} TND — {c.statut}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Factures ── */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Factures ({factures.length})</h2>
        {!factures.length ? <p className="text-sm text-gray-400">Aucune facture.</p> : (
          <div className="space-y-2">
            {factures.map((f) => (
              <div key={f.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
                <span className="font-medium text-gray-700 capitalize">{f.type} — {f.reference ?? `#${f.id}`}</span>
                <span className="text-gray-500">{Number(f.montant).toLocaleString('fr-TN')} TND — {f.statut}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
