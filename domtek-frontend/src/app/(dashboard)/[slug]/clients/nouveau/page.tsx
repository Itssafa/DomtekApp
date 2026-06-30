'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from '@/components/OrgLink';
import api from '@/lib/api';
import { orgPath } from '@/lib/org-path';
import { AxiosError } from 'axios';
import StepForm, { FormStep } from '@/components/StepForm';

export default function NouveauClientPage() {
  const router  = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    civilite: '', nom: '', prenom: '',
    telephone: '', email: '', ville: '',
    date_naissance: '', lieu_naissance: '',
    type_piece: '', cin: '', cin_delivree_le: '', cin_delivree_a: '',
    urgence_nom: '', urgence_telephone: '', urgence_relation: '',
    notes: '',
  });
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [errors, setErrors]             = useState<Record<string, string[]>>({});
  const [loading, setLoading]           = useState(false);

  const set = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const inp = (label: string, key: string, type: React.HTMLInputTypeAttribute = 'text', placeholder = '', required = false) => (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input type={type} value={(form as Record<string, string>)[key]} onChange={set(key)}
        placeholder={placeholder}
        className={errors[key]
          ? 'w-full border border-red-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 bg-red-50'
          : 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500'} />
      {errors[key] && <p className="text-red-500 text-xs mt-1">{errors[key][0]}</p>}
    </div>
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    try {
      const payload = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v) payload.append(k, v); });
      if (documentFile) payload.append('document_identite', documentFile);
      const { data } = await api.post('/org/clients', payload, { headers: { 'Content-Type': 'multipart/form-data' } });
      router.push(orgPath(`/dashboard/clients/${data.data.id}`));
    } catch (err) {
      const axiosError = err as AxiosError<{ errors?: Record<string, string[]> }>;
      setErrors(axiosError.response?.data?.errors ?? {});
    } finally {
      setLoading(false);
    }
  };

  const steps: FormStep[] = [
    {
      title: 'Identité & Contact',
      validate: () => {
        if (!form.nom.trim())       return 'Le nom est obligatoire.';
        if (!form.prenom.trim())    return 'Le prénom est obligatoire.';
        if (!form.telephone.trim()) return 'Le téléphone est obligatoire.';
        return null;
      },
      content: (
        <>
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
            {inp('Nom', 'nom', 'text', 'Ben Ali', true)}
            {inp('Prénom', 'prenom', 'text', 'Ahmed', true)}
          </div>
          <div className="grid grid-cols-3 gap-4">
            {inp('N° Téléphone', 'telephone', 'tel', '+216 22 000 000', true)}
            {inp('Email', 'email', 'email', 'ahmed@email.com')}
            {inp('Ville', 'ville', 'text', 'Tunis')}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {inp('Date de naissance', 'date_naissance', 'date')}
            {inp('Lieu de naissance', 'lieu_naissance', 'text', 'Tunis')}
          </div>
        </>
      ),
    },
    {
      title: "Document d'identité",
      validate: () => {
        if (!form.cin.trim()) return 'Le numéro de pièce est obligatoire.';
        return null;
      },
      content: (
        <>
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
            {inp('N° de pièce (CIN)', 'cin', 'text', '12345678', true)}
            {inp('Délivrée le', 'cin_delivree_le', 'date', '', true)}
            {inp('Délivrée à (ville)', 'cin_delivree_a', 'text', 'Tunis', true)}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Pièce jointe <span className="text-gray-400 font-normal">(PDF, JPG, PNG — max 5 Mo)</span>
            </label>
            <div onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg px-4 py-4 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition">
              {documentFile
                ? <p className="text-sm text-blue-600 font-medium">{documentFile.name}</p>
                : <p className="text-sm text-gray-400">Cliquer pour importer (copie CIN, passeport…)</p>
              }
            </div>
            <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
              onChange={(e) => setDocumentFile(e.target.files?.[0] ?? null)} />
            {errors.document_identite && <p className="text-red-500 text-xs mt-1">{errors.document_identite[0]}</p>}
          </div>
        </>
      ),
    },
    {
      title: "Contact d'urgence & Notes",
      content: (
        <>
          <div className="grid grid-cols-3 gap-4">
            {inp('Nom', 'urgence_nom')}
            {inp('N° Téléphone', 'urgence_telephone', 'tel')}
            {inp('Relation', 'urgence_relation', 'text', 'Parent, conjoint…')}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
            <textarea value={form.notes} onChange={set('notes')} rows={3}
              placeholder="Remarques internes…"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
          </div>
        </>
      ),
    },
  ];

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <Link href="/dashboard/clients" className="text-sm text-gray-400 hover:text-gray-600">← Retour</Link>
        <h1 className="text-2xl font-bold text-gray-800 mt-2">Nouveau client</h1>
      </div>
      <StepForm
        steps={steps}
        onSubmit={handleSubmit}
        submitLabel="Créer le client"
        loading={loading}
        cancelHref="/dashboard/clients"
      />
    </div>
  );
}
