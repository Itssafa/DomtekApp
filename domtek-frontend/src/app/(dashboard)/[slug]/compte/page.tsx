'use client';

import { useRef, useState } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { AxiosError } from 'axios';
import { isValidEmail, isValidPhone } from '@/lib/validation';

const Section = ({ title, subtitle }: { title: string; subtitle?: string }) => (
  <div className="mb-5">
    <h2 className="text-base font-semibold text-gray-800">{title}</h2>
    {subtitle && <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>}
  </div>
);

const Field = ({ label, value }: { label: string; value?: string | null }) => (
  <div>
    <p className="text-xs text-gray-400 mb-0.5">{label}</p>
    <p className="text-sm font-medium text-gray-700 bg-gray-50 rounded-lg px-3 py-2.5 border border-gray-100">{value || '—'}</p>
  </div>
);

type Feedback = { type: 'success' | 'error'; message: string } | null;

export default function ComptePage() {
  const { user, organisation, role, setAuth } = useAuthStore();
  const isOrg = role === 'organisation';

  // ── Section email ──
  const [email, setEmail]           = useState(user?.email ?? '');
  const [savingEmail, setSavingEmail] = useState(false);
  const [emailFeedback, setEmailFeedback] = useState<Feedback>(null);

  // ── Section mot de passe ──
  const [pwd, setPwd] = useState({ current_password: '', password: '', password_confirmation: '' });
  const [savingPwd, setSavingPwd]   = useState(false);
  const [pwdFeedback, setPwdFeedback] = useState<Feedback>(null);
  const [pwdErrors, setPwdErrors]   = useState<Record<string, string[]>>({});
  const [showPwd, setShowPwd]       = useState(false);

  // ── Section organisation ──
  const [orgForm, setOrgForm] = useState({
    email:       organisation?.email       ?? '',
    telephone:   organisation?.telephone   ?? '',
    ville:       organisation?.ville       ?? '',
    description: organisation?.description ?? '',
  });
  const [logoFile, setLogoFile]       = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [savingOrg, setSavingOrg]     = useState(false);
  const [orgFeedback, setOrgFeedback] = useState<Feedback>(null);
  const logoRef = useRef<HTMLInputElement>(null);

  const handleEmailSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailFeedback(null);
    if (!isValidEmail(email)) {
      setEmailFeedback({ type: 'error', message: 'Adresse e-mail invalide.' });
      return;
    }
    setSavingEmail(true);
    try {
      const { data } = await api.put('/auth/me', { email });
      // Mettre à jour le store
      if (user) {
        const token = useAuthStore.getState().token ?? '';
        setAuth(token, { ...user, email: data.user.email }, user.role as never, organisation ?? undefined);
      }
      setEmailFeedback({ type: 'success', message: 'Adresse e-mail mise à jour.' });
    } catch (err) {
      const ax = err as AxiosError<{ message?: string; errors?: Record<string, string[]> }>;
      const msg = ax.response?.data?.errors?.email?.[0] ?? ax.response?.data?.message ?? 'Erreur lors de la mise à jour.';
      setEmailFeedback({ type: 'error', message: msg });
    } finally {
      setSavingEmail(false);
    }
  };

  const handlePwdSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdFeedback(null);
    setPwdErrors({});
    setSavingPwd(true);
    try {
      await api.put('/auth/me/password', pwd);
      setPwdFeedback({ type: 'success', message: 'Mot de passe modifié avec succès.' });
      setPwd({ current_password: '', password: '', password_confirmation: '' });
    } catch (err) {
      const ax = err as AxiosError<{ message?: string; errors?: Record<string, string[]> }>;
      if (ax.response?.data?.errors) setPwdErrors(ax.response.data.errors);
      else setPwdFeedback({ type: 'error', message: ax.response?.data?.message ?? 'Erreur lors du changement.' });
    } finally {
      setSavingPwd(false);
    }
  };

  const handleOrgSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setOrgFeedback(null);
    if (orgForm.email && !isValidEmail(orgForm.email)) {
      setOrgFeedback({ type: 'error', message: 'Adresse e-mail de l\'organisation invalide.' });
      return;
    }
    if (orgForm.telephone && !isValidPhone(orgForm.telephone)) {
      setOrgFeedback({ type: 'error', message: 'Numéro de téléphone de l\'organisation invalide.' });
      return;
    }
    setSavingOrg(true);
    try {
      const fd = new FormData();
      Object.entries(orgForm).forEach(([k, v]) => { if (v !== '') fd.append(k, v); });
      if (logoFile) fd.append('logo', logoFile);
      const { data } = await api.post('/org/profil', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (user) {
        const token = useAuthStore.getState().token ?? '';
        setAuth(token, user, user.role as never, data.organisation);
      }
      setOrgFeedback({ type: 'success', message: 'Organisation mise à jour.' });
      setLogoFile(null);
      setLogoPreview(null);
    } catch (err) {
      const ax = err as AxiosError<{ message?: string }>;
      setOrgFeedback({ type: 'error', message: ax.response?.data?.message ?? 'Erreur lors de la mise à jour.' });
    } finally {
      setSavingOrg(false);
    }
  };

  const handleLogoChange = (f: File | null) => {
    if (!f) return;
    setLogoFile(f);
    setLogoPreview(URL.createObjectURL(f));
  };

  const inputCls = 'w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all';

  const Alert = ({ fb }: { fb: Feedback }) => fb ? (
    <div className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm ${fb.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
      <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        {fb.type === 'success'
          ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />}
      </svg>
      {fb.message}
    </div>
  ) : null;

  const SaveBtn = ({ loading, label = 'Enregistrer' }: { loading: boolean; label?: string }) => (
    <button type="submit" disabled={loading}
      className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-all shadow-sm hover:shadow-md">
      {loading ? (
        <span className="flex items-center gap-2">
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Enregistrement…
        </span>
      ) : label}
    </button>
  );

  return (
    <div className="p-8 max-w-2xl space-y-6">
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-gray-900">Mon compte</h1>
        <p className="text-sm text-gray-400 mt-1">Gérez vos informations personnelles et de sécurité</p>
      </div>

      {/* ── Informations du compte ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <Section title="Informations du compte" subtitle="Votre nom ne peut pas être modifié." />
        <Field label="Nom" value={user?.name} />
        <form onSubmit={handleEmailSave} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Adresse e-mail</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
          </div>
          <Alert fb={emailFeedback} />
          <SaveBtn loading={savingEmail} />
        </form>
      </div>

      {/* ── Organisation ── */}
      {organisation && isOrg && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <Section title="Informations de l'organisation" subtitle="Le nom et l'adresse ne peuvent pas être modifiés." />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Nom" value={organisation.nom} />
            <Field label="Adresse" value={organisation.adresse} />
          </div>
          <form onSubmit={handleOrgSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">E-mail de contact</label>
                <input type="email" value={orgForm.email}
                  onChange={(e) => setOrgForm((p) => ({ ...p, email: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Téléphone</label>
                <input type="tel" value={orgForm.telephone}
                  onChange={(e) => setOrgForm((p) => ({ ...p, telephone: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Ville</label>
                <input type="text" value={orgForm.ville}
                  onChange={(e) => setOrgForm((p) => ({ ...p, ville: e.target.value }))} className={inputCls} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Description</label>
              <textarea rows={3} value={orgForm.description}
                onChange={(e) => setOrgForm((p) => ({ ...p, description: e.target.value }))}
                className={inputCls + ' resize-none'} />
            </div>
            {/* Logo */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Logo</label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl border border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center flex-shrink-0">
                  {logoPreview || organisation.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoPreview ?? (organisation.logo ?? '')} alt="logo"
                      className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-7 h-7 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
                    </svg>
                  )}
                </div>
                <button type="button" onClick={() => logoRef.current?.click()}
                  className="px-4 py-2 border border-gray-200 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
                  {logoFile ? logoFile.name : 'Choisir un logo'}
                </button>
                <input ref={logoRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => handleLogoChange(e.target.files?.[0] ?? null)} />
              </div>
            </div>
            <Alert fb={orgFeedback} />
            <SaveBtn loading={savingOrg} label="Mettre à jour l'organisation" />
          </form>
        </div>
      )}

      {/* ── Mot de passe ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <Section title="Sécurité" subtitle="Changez votre mot de passe régulièrement." />
        <form onSubmit={handlePwdSave} className="space-y-3">
          {[
            { key: 'current_password', label: 'Mot de passe actuel' },
            { key: 'password',         label: 'Nouveau mot de passe' },
            { key: 'password_confirmation', label: 'Confirmer le nouveau mot de passe' },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">{label}</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'} required
                  autoComplete={key === 'current_password' ? 'current-password' : 'new-password'}
                  value={pwd[key as keyof typeof pwd]}
                  onChange={(e) => setPwd((p) => ({ ...p, [key]: e.target.value }))}
                  className={inputCls + ' pr-10'}
                />
                <button type="button" onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {showPwd
                      ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      : <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></>}
                  </svg>
                </button>
              </div>
              {pwdErrors[key] && <p className="text-red-500 text-xs mt-1">{pwdErrors[key][0]}</p>}
            </div>
          ))}
          <Alert fb={pwdFeedback} />
          <SaveBtn loading={savingPwd} label="Changer le mot de passe" />
        </form>
      </div>
    </div>
  );
}
