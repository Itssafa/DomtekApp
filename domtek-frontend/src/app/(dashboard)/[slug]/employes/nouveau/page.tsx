'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from '@/components/OrgLink';
import api from '@/lib/api';
import { orgPath } from '@/lib/org-path';
import { AxiosError } from 'axios';
import StepForm, { FormStep } from '@/components/StepForm';
import { isValidEmail, isValidPhone, isValidCin, isValidCityOrPlace } from '@/lib/validation';

export default function NouvelEmployePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    nom: '', prenom: '', email: '', telephone: '',
    cin: '', cin_delivree_le: '', cin_delivree_a: '',
    poste: '', date_embauche: '', statut: 'actif',
  });
  const [errors, setErrors]   = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);

  const set = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const setDigitsOnly = (field: string, maxLength?: number) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => setForm((prev) => {
    let digits = e.target.value.replace(/\D/g, '');
    if (maxLength) digits = digits.slice(0, maxLength);
    return { ...prev, [field]: digits };
  });

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    try {
      await api.post('/org/employes', form);
      router.push(orgPath('/dashboard/employes'));
    } catch (err) {
      const axiosError = err as AxiosError<{ errors?: Record<string, string[]> }>;
      setErrors(axiosError.response?.data?.errors ?? {});
    } finally {
      setLoading(false);
    }
  };

  const inp = (label: string, field: string, type = 'text', placeholder = '', required = false, onChange = set(field)) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        value={(form as Record<string, string>)[field]}
        onChange={onChange}
        placeholder={placeholder}
        className={errors[field]
          ? 'w-full border border-red-400 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 bg-red-50'
          : 'w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500'}
      />
      {errors[field] && <p className="text-red-500 text-xs mt-1">{errors[field][0]}</p>}
    </div>
  );

  const steps: FormStep[] = [
    {
      title: 'Identité & Contact',
      validate: () => {
        if (!form.nom.trim())       return 'Le nom est obligatoire.';
        if (!form.prenom.trim())    return 'Le prénom est obligatoire.';
        if (!form.telephone.trim()) return 'Le téléphone est obligatoire.';
        if (!isValidPhone(form.telephone)) return 'Le numéro de téléphone est invalide.';
        if (form.email.trim() && !isValidEmail(form.email)) return "L'adresse e-mail est invalide.";
        return null;
      },
      content: (
        <>
          <div className="grid grid-cols-2 gap-4">
            {inp('Nom', 'nom', 'text', 'Ben Ali', true)}
            {inp('Prénom', 'prenom', 'text', 'Sonia', true)}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {inp('Téléphone', 'telephone', 'tel', '+216 22 000 000', true)}
            {inp('Email', 'email', 'email', 'sonia@organisation.tn')}
          </div>
        </>
      ),
    },
    {
      title: "Document d'identité",
      validate: () => {
        if (!form.cin.trim())            return 'Le numéro CIN est obligatoire.';
        if (!isValidCin(form.cin)) return 'Le numéro CIN doit contenir exactement 8 chiffres.';
        if (!form.cin_delivree_le)       return 'La date de délivrance est obligatoire.';
        if (!form.cin_delivree_a.trim()) return 'La ville de délivrance est obligatoire.';
        if (!isValidCityOrPlace(form.cin_delivree_a)) return 'La ville de délivrance est invalide.';
        return null;
      },
      content: (
        <>
          {inp('N° CIN', 'cin', 'text', '12345678', true, setDigitsOnly('cin', 8))}
          <div className="grid grid-cols-2 gap-4">
            {inp('Délivrée le', 'cin_delivree_le', 'date', '', true)}
            {inp('Délivrée à (ville)', 'cin_delivree_a', 'text', 'Tunis', true)}
          </div>
        </>
      ),
    },
    {
      title: 'Poste',
      content: (
        <>
          {inp('Poste occupé', 'poste', 'text', 'Agent immobilier')}
          <div className="grid grid-cols-2 gap-4">
            {inp("Date d'embauche", 'date_embauche', 'date')}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
              <select value={form.statut} onChange={set('statut')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
                <option value="actif">Actif</option>
                <option value="inactif">Inactif</option>
              </select>
            </div>
          </div>
        </>
      ),
    },
  ];

  return (
    <div className="p-8 max-w-xl">
      <div className="mb-6">
        <Link href="/dashboard/employes" className="text-sm text-gray-400 hover:text-gray-600">← Retour</Link>
        <h1 className="text-2xl font-bold text-gray-800 mt-2">Nouvel employé</h1>
      </div>
      <StepForm
        steps={steps}
        onSubmit={handleSubmit}
        submitLabel="Créer l'employé"
        loading={loading}
        cancelHref="/dashboard/employes"
      />
    </div>
  );
}
