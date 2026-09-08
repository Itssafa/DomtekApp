'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from '@/components/OrgLink';
import api from '@/lib/api'
import { Employe } from '@/types';
import { AxiosError } from 'axios';
import { isValidEmail, isValidPhone, isValidCin, isValidCityOrPlace } from '@/lib/validation';

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

export default function EditEmployePage() {
  const { id } = useParams<{ id: string }>();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    nom: '', prenom: '', email: '', telephone: '',
    cin: '', cin_delivree_le: '', cin_delivree_a: '',
    poste: '', date_embauche: '', statut: 'actif',
  });
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchEmploye = () => {
    setLoading(true);
    api.get<{ data: Employe }>(`/org/employes/${id}`)
      .then(({ data }) => {
        const e = data.data;
        setForm({
          nom:             e.nom,
          prenom:          e.prenom,
          email:           e.email ?? '',
          telephone:       e.telephone ?? '',
          cin:             (e as any).cin ?? '',
          cin_delivree_le: (e as any).cin_delivree_le ?? '',
          cin_delivree_a:  (e as any).cin_delivree_a ?? '',
          poste:           e.poste ?? '',
          date_embauche:   e.date_embauche ?? '',
          statut:          e.statut,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchEmploye(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const handleSave = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setErrors({});
    const newErrors: Record<string, string[]> = {};
    if (form.telephone.trim() && !isValidPhone(form.telephone)) {
      newErrors.telephone = ['Le numéro de téléphone est invalide.'];
    }
    if (form.email.trim() && !isValidEmail(form.email)) {
      newErrors.email = ["L'adresse e-mail est invalide."];
    }
    if (form.cin.trim() && !isValidCin(form.cin)) {
      newErrors.cin = ['Le numéro CIN doit contenir exactement 8 chiffres.'];
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
      await api.put(`/org/employes/${id}`, form);
      setEditing(false);
      fetchEmploye();
    } catch (err) {
      const axiosError = err as AxiosError<{ errors?: Record<string, string[]> }>;
      setErrors(axiosError.response?.data?.errors ?? {});
    } finally {
      setSaving(false);
    }
  };

  const inp = (
    label: string, field: string,
    type = 'text', placeholder = '', required = false, onChange = set(field)
  ) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        value={(form as Record<string, string>)[field]}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
      />
      {errors[field] && <p className="text-red-500 text-xs mt-1">{errors[field][0]}</p>}
    </div>
  );

  if (loading) return <div className="p-8 animate-pulse h-40 bg-gray-100 rounded-xl" />;

  /* ── Vue fiche (lecture seule) ── */
  if (!editing) {
    return (
      <div className="p-8 max-w-xl">
        <div className="mb-6">
          <Link href="/dashboard/employes" className="text-sm text-gray-400 hover:text-gray-600">← Retour</Link>
          <div className="flex items-center justify-between mt-2">
            <h1 className="text-2xl font-bold text-gray-800">{form.prenom} {form.nom}</h1>
            <button onClick={() => setEditing(true)}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition">
              Modifier
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 space-y-5">
          <Section title="Identité" />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Nom" value={form.nom} />
            <Field label="Prénom" value={form.prenom} />
          </div>

          <Section title="Contact" />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Téléphone" value={form.telephone} />
            <Field label="Email" value={form.email} />
          </div>

          <Section title="Document d'identité" />
          <Field label="N° CIN" value={form.cin} />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Délivrée le" value={fmtDate(form.cin_delivree_le)} />
            <Field label="Délivrée à" value={form.cin_delivree_a} />
          </div>

          <Section title="Poste" />
          <Field label="Poste occupé" value={form.poste} />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Date d'embauche" value={fmtDate(form.date_embauche)} />
            <Field label="Statut" value={form.statut === 'actif' ? 'Actif' : 'Inactif'} />
          </div>
        </div>
      </div>
    );
  }

  /* ── Formulaire de modification ── */
  return (
    <div className="p-8 max-w-xl">
      <div className="mb-6">
        <Link href="/dashboard/employes" className="text-sm text-gray-400 hover:text-gray-600">← Retour</Link>
        <h1 className="text-2xl font-bold text-gray-800 mt-2">Modifier l&apos;employé</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <form onSubmit={handleSave} className="space-y-5">

          <Section title="Identité" />
          <div className="grid grid-cols-2 gap-4">
            {inp('Nom', 'nom', 'text', '', true)}
            {inp('Prénom', 'prenom', 'text', '', true)}
          </div>

          <Section title="Contact" />
          <div className="grid grid-cols-2 gap-4">
            {inp('Téléphone', 'telephone', 'tel', '', true)}
            {inp('Email', 'email', 'email')}
          </div>

          <Section title="Document d'identité" />
          <div className="grid grid-cols-1 gap-4">
            {inp('N° CIN', 'cin', 'text', '', true, setDigitsOnly('cin', 8))}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {inp('Délivrée le', 'cin_delivree_le', 'date', '', true)}
            {inp('Délivrée à (ville)', 'cin_delivree_a', 'text', '', true)}
          </div>

          <Section title="Poste" />
          {inp('Poste occupé', 'poste')}
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

          <div className="flex gap-3 pt-2">
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
    </div>
  );
}
