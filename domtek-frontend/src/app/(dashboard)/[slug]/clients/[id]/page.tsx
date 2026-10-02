'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from '@/components/OrgLink';
import api from '@/lib/api'
import { Client, Contrat, Facture } from '@/types';
import { AxiosError } from 'axios';
import { isValidEmail, isValidPhone, isValidCin, isValidCinOrPasseport, isValidCityOrPlace } from '@/lib/validation';

const Section = ({ title }: { title: string }) => (
  <div className="flex items-center gap-3 pt-2">
    <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide whitespace-nowrap">{title}</span>
    <div className="flex-1 h-px bg-gray-200" />
  </div>
);

const Field = ({ label, value }: { label: string; value?: string | null }) => (
  <div>
    <p className="text-xs text-gray-400 mb-0.5">{label}</p>
    <p className="text-sm text-gray-800 font-medium">{value || '—'}</p>
  </div>
);

const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';

export default function FicheClientPage() {
  const { id } = useParams<{ id: string }>();
  const fileRef = useRef<HTMLInputElement>(null);

  const [editing, setEditing]       = useState(false);
  const [client, setClient]         = useState<Client | null>(null);
  const [contrats, setContrats]     = useState<Contrat[]>([]);
  const [factures, setFactures]     = useState<Facture[]>([]);

  const [form, setForm] = useState({
    civilite: '', nom: '', prenom: '',
    telephone: '', email: '', ville: '',
    date_naissance: '', lieu_naissance: '',
    type_piece: '', cin: '', cin_delivree_le: '', cin_delivree_a: '',
    urgence_nom: '', urgence_telephone: '', urgence_relation: '',
    notes: '',
  });

  const [errors, setErrors]         = useState<Record<string, string[]>>({});
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [uploading, setUploading]   = useState(false);
  const [uploadDone, setUploadDone] = useState(false);

  // Renvoi du lien d'activation (e-mail perdu, tombé dans les spams, expiré)
  const [resending, setResending]   = useState(false);
  const [resendMsg, setResendMsg]   = useState<{ ok: boolean; text: string } | null>(null);

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
        cin_delivree_le:   (cl as any).cin_delivree_le ?? '',
        cin_delivree_a:    (cl as any).cin_delivree_a ?? '',
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
  ) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const setDigitsOnly = (field: string, maxLength?: number) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm(prev => {
    let digits = e.target.value.replace(/\D/g, '');
    if (maxLength) digits = digits.slice(0, maxLength);
    return { ...prev, [field]: digits };
  });

  const inp = (label: string, key: string, type: React.HTMLInputTypeAttribute = 'text', placeholder = '', required = false, onChange = set(key)) => (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input type={type} value={(form as Record<string, string>)[key]} onChange={onChange}
        placeholder={placeholder} required={required}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
      {errors[key] && <p className="text-red-500 text-xs mt-1">{errors[key][0]}</p>}
    </div>
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const newErrors: Record<string, string[]> = {};
    if (form.telephone.trim() && !isValidPhone(form.telephone)) {
      newErrors.telephone = ['Le numéro de téléphone est invalide.'];
    }
    if (form.urgence_telephone.trim() && !isValidPhone(form.urgence_telephone)) {
      newErrors.urgence_telephone = ["Le numéro de téléphone d'urgence est invalide."];
    }
    // Obligatoire : identifiant de connexion du client à son espace.
    if (!form.email.trim()) {
      newErrors.email = ["L'adresse e-mail est obligatoire : elle sert d'identifiant à l'espace client."];
    } else if (!isValidEmail(form.email)) {
      newErrors.email = ["L'adresse e-mail est invalide."];
    }
    if (form.lieu_naissance.trim() && !isValidCityOrPlace(form.lieu_naissance)) {
      newErrors.lieu_naissance = ['Le lieu de naissance est invalide.'];
    }
    if (form.cin.trim() && form.type_piece === 'CIN' && !isValidCin(form.cin)) {
      newErrors.cin = ['Le numéro CIN doit contenir exactement 8 chiffres.'];
    }
    if (form.cin.trim() && form.type_piece !== 'CIN' && !isValidCinOrPasseport(form.cin)) {
      newErrors.cin = ['Le numéro de pièce ne doit contenir que des chiffres.'];
    }
    if (form.cin_delivree_a.trim() && !isValidCityOrPlace(form.cin_delivree_a)) {
      newErrors.cin_delivree_a = ['La ville de délivrance est invalide.'];
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setSaving(true);
    try {
      await api.put(`/org/clients/${id}`, form);
      setEditing(false);
      fetchClient();
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

  const handleRenvoyerAcces = async () => {
    setResending(true);
    setResendMsg(null);
    try {
      const { data } = await api.post(`/org/clients/${id}/renvoyer-acces`);
      setResendMsg({ ok: true, text: data.message });
      fetchClient();
    } catch (err) {
      const ax = err as AxiosError<{ message?: string }>;
      setResendMsg({ ok: false, text: ax.response?.data?.message ?? "L'envoi a échoué." });
    } finally {
      setResending(false);
    }
  };

  /* ── Accès du client à son espace ──
     L'agence ne voit jamais le mot de passe : seulement l'état de l'accès,
     et de quoi relancer l'invitation. */
  const accesSection = (() => {
    const statut = client?.acces_statut ?? 'aucun';

    const badge = {
      actif:  { texte: 'Compte activé',           classes: 'bg-green-50 text-green-700 border-green-200' },
      invite: { texte: "En attente d'activation", classes: 'bg-amber-50 text-amber-700 border-amber-200' },
      aucun:  { texte: 'Aucun accès',             classes: 'bg-gray-100 text-gray-500 border-gray-200' },
    }[statut];

    const description = {
      actif:  'Le client a choisi son mot de passe et peut se connecter. Ni vous ni Domtek ne le connaissez.',
      invite: "L'invitation a été envoyée. Le client n'a pas encore choisi son mot de passe.",
      aucun:  "Aucun compte n'est rattaché à cette fiche. Renseignez une adresse e-mail pour lui ouvrir un accès.",
    }[statut];

    return (
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1.5">
              <h2 className="text-sm font-semibold text-gray-700">Espace client</h2>
              <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${badge.classes}`}>
                {badge.texte}
              </span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">{description}</p>
          </div>

          {statut !== 'aucun' && (
            <button onClick={handleRenvoyerAcces} disabled={resending}
              className="shrink-0 px-3.5 py-2 border border-gray-300 hover:bg-gray-50 disabled:opacity-60 text-gray-700 text-xs font-medium rounded-lg transition">
              {resending ? 'Envoi…' : statut === 'actif' ? 'Renvoyer un lien' : "Renvoyer l'invitation"}
            </button>
          )}
        </div>

        {resendMsg && (
          <p className={`mt-3 text-xs ${resendMsg.ok ? 'text-green-600' : 'text-red-600'}`}>
            {resendMsg.text}
          </p>
        )}
      </div>
    );
  })();

  /* ── Sections contrats & factures (réutilisées en mode fiche et édition) ── */
  const contratsSection = (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
      <h2 className="text-sm font-semibold text-gray-700 mb-3">Contrats ({contrats.length})</h2>
      {!contrats.length ? <p className="text-sm text-gray-400">Aucun contrat.</p> : (
        <div className="space-y-2">
          {contrats.map(c => (
            <Link key={c.id} href={`/dashboard/contrats/${c.id}`}
              className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm transition">
              <span className="font-medium text-gray-700">{c.bien?.designation ?? c.designation ?? `Contrat #${c.id}`}</span>
              <span className="text-gray-500">{Number(c.montant_ht).toLocaleString('fr-TN')} TND — {c.statut}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );

  const facturesSection = (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-sm font-semibold text-gray-700 mb-3">Factures ({factures.length})</h2>
      {!factures.length ? <p className="text-sm text-gray-400">Aucune facture.</p> : (
        <div className="space-y-2">
          {factures.map(f => (
            <Link key={f.id} href={`/dashboard/factures/${f.id}`}
              className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm transition">
              <span className="font-medium text-gray-700 capitalize">{f.type} — {f.reference ?? `#${f.id}`}</span>
              <span className="text-gray-500">{Number(f.montant).toLocaleString('fr-TN')} TND — {f.statut}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );

  if (loading) return <div className="p-8 animate-pulse h-40 bg-gray-100 rounded-xl" />;

  /* ── Vue fiche (lecture seule) ── */
  if (!editing) {
    return (
      <div className="p-8 max-w-3xl">
        <div className="mb-6">
          <Link href="/dashboard/clients" className="text-sm text-gray-400 hover:text-gray-600">← Retour</Link>
          <div className="flex items-center justify-between mt-2">
            <h1 className="text-2xl font-bold text-gray-800">{client?.nom_complet}</h1>
            <button onClick={() => setEditing(true)}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition">
              Modifier
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 space-y-5">
          <Section title="Identité" />
          <div className="grid grid-cols-3 gap-4">
            <Field label="Civilité" value={form.civilite} />
            <Field label="Nom" value={form.nom} />
            <Field label="Prénom" value={form.prenom} />
          </div>

          <Section title="Contact" />
          <div className="grid grid-cols-3 gap-4">
            <Field label="Téléphone" value={form.telephone} />
            <Field label="Email" value={form.email} />
            <Field label="Ville" value={form.ville} />
          </div>

          <Section title="Naissance" />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Date de naissance" value={fmtDate(form.date_naissance)} />
            <Field label="Lieu de naissance" value={form.lieu_naissance} />
          </div>

          <Section title="Document d'identité" />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Type de pièce" value={form.type_piece} />
            <Field label="N° de pièce (CIN)" value={form.cin} />
            <Field label="Délivrée le" value={fmtDate(form.cin_delivree_le)} />
            <Field label="Délivrée à" value={form.cin_delivree_a} />
          </div>
          {client?.document_url && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm">
              <span className="text-gray-500 flex-1">Pièce jointe</span>
              <a href={client.document_url} target="_blank" rel="noopener noreferrer"
                className="text-violet-600 hover:underline text-xs">Voir le fichier</a>
            </div>
          )}

          {(form.urgence_nom || form.urgence_telephone) && (
            <>
              <Section title="Contact d'urgence" />
              <div className="grid grid-cols-3 gap-4">
                <Field label="Nom" value={form.urgence_nom} />
                <Field label="Téléphone" value={form.urgence_telephone} />
                <Field label="Relation" value={form.urgence_relation} />
              </div>
            </>
          )}

          {form.notes && (
            <>
              <Section title="Note" />
              <p className="text-sm text-gray-700 whitespace-pre-line">{form.notes}</p>
            </>
          )}
        </div>

        {accesSection}
        {contratsSection}
        {facturesSection}
      </div>
    );
  }

  /* ── Formulaire de modification ── */
  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-6">
        <Link href="/dashboard/clients" className="text-sm text-gray-400 hover:text-gray-600">← Retour</Link>
        <h1 className="text-2xl font-bold text-gray-800 mt-2">{client?.nom_complet}</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <form onSubmit={handleSave} className="space-y-4">

          <Section title="Identité" />
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Civilité</label>
              <select value={form.civilite} onChange={set('civilite')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
                <option value="">—</option>
                <option value="M.">M.</option>
                <option value="Mme">Mme</option>
                <option value="Mlle">Mlle</option>
              </select>
            </div>
            {inp('Nom', 'nom', 'text', '', true)}
            {inp('Prénom', 'prenom', 'text', '', true)}
          </div>

          <Section title="Contact" />
          <div className="grid grid-cols-3 gap-4">
            {inp('N° Téléphone', 'telephone', 'tel', '', true)}
            {inp('Email', 'email', 'email', '', true)}
            {inp('Ville', 'ville')}
          </div>

          <Section title="Naissance" />
          <div className="grid grid-cols-2 gap-4">
            {inp('Date de naissance', 'date_naissance', 'date')}
            {inp('Lieu de naissance', 'lieu_naissance')}
          </div>

          <Section title="Document d'identité" />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Type de pièce</label>
              <select value={form.type_piece} onChange={set('type_piece')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
                <option value="">— Sélectionner —</option>
                <option value="CIN">CIN</option>
                <option value="Passeport">Passeport</option>
              </select>
            </div>
            {inp('N° de pièce (CIN)', 'cin', 'text', '', true, setDigitsOnly('cin', form.type_piece === 'CIN' ? 8 : undefined))}
            {inp('Délivrée le', 'cin_delivree_le', 'date', '', true)}
            {inp('Délivrée à (ville)', 'cin_delivree_a', 'text', '', true)}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Pièce jointe <span className="text-gray-400 font-normal">(PDF, JPG, PNG — max 5 Mo)</span>
            </label>
            {client?.document_url && (
              <div className="flex items-center gap-3 mb-2 p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm">
                <span className="text-gray-500 flex-1">Document actuel</span>
                <a href={client.document_url} target="_blank" rel="noopener noreferrer"
                  className="text-violet-600 hover:underline text-xs">Voir le fichier</a>
              </div>
            )}
            <div onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg px-4 py-4 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition">
              {uploading ? <p className="text-sm text-gray-400">Envoi en cours…</p>
                : uploadDone ? <p className="text-sm text-green-600 font-medium">Document mis à jour</p>
                : <p className="text-sm text-gray-400">{client?.document_url ? 'Cliquer pour remplacer' : 'Cliquer pour importer'}</p>}
            </div>
            <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleUploadDocument(f); }} />
          </div>

          <Section title="Contact d'urgence" />
          <div className="grid grid-cols-3 gap-4">
            {inp('Nom', 'urgence_nom')}
            {inp('N° Téléphone', 'urgence_telephone', 'tel')}
            {inp('Relation', 'urgence_relation', 'text', 'Parent, conjoint…')}
          </div>

          <Section title="Note" />
          <textarea value={form.notes} onChange={set('notes')} rows={2}
            placeholder="Remarques internes…"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />

          <div className="flex gap-3 mt-2">
            <button type="submit" disabled={saving}
              className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition">
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
            <button type="button" onClick={() => setEditing(false)}
              className="px-6 py-2.5 border border-gray-300 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition">
              Annuler
            </button>
          </div>
        </form>
      </div>

      {contratsSection}
      {facturesSection}
    </div>
  );
}
