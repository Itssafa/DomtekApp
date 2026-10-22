'use client';

import { useState } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { AxiosError } from 'axios';
import { isValidEmail } from '@/lib/validation';
import { PasswordInput } from '@/components/PasswordInput';

const inputCls = 'w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all';

type Feedback = { type: 'success' | 'error'; message: string } | null;

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
    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition shadow-sm">
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

export default function AdminComptePage() {
  const { user, setAuth } = useAuthStore();

  const [email, setEmail]             = useState(user?.email ?? '');
  const [savingEmail, setSavingEmail] = useState(false);
  const [emailFeedback, setEmailFeedback] = useState<Feedback>(null);

  const [pwd, setPwd] = useState({ current_password: '', password: '', password_confirmation: '' });
  const [savingPwd, setSavingPwd]     = useState(false);
  const [pwdFeedback, setPwdFeedback] = useState<Feedback>(null);
  const [pwdErrors, setPwdErrors]     = useState<Record<string, string[]>>({});

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
      if (user) {
        const token = useAuthStore.getState().token ?? '';
        setAuth(token, { ...user, email: data.user.email }, user.role as never);
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

  return (
    <div className="p-8 max-w-2xl space-y-6">
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-gray-900">Mon compte</h1>
        <p className="text-sm text-gray-400 mt-1">Gérez vos informations et votre sécurité</p>
      </div>

      {/* ── Informations du compte ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-gray-800">Informations du compte</h2>
          <p className="text-sm text-gray-400 mt-0.5">Le nom du compte ne peut pas être modifié.</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-0.5">Nom</p>
          <p className="text-sm font-medium text-gray-700 bg-gray-50 rounded-lg px-3 py-2.5 border border-gray-100">{user?.name || '—'}</p>
        </div>
        <form onSubmit={handleEmailSave} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Adresse e-mail</label>
            <input type="email" required value={email}
              onChange={(e) => setEmail(e.target.value)} className={inputCls} />
          </div>
          <Alert fb={emailFeedback} />
          <SaveBtn loading={savingEmail} />
        </form>
      </div>

      {/* ── Mot de passe ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-gray-800">Sécurité</h2>
          <p className="text-sm text-gray-400 mt-0.5">Changez votre mot de passe régulièrement.</p>
        </div>
        <form onSubmit={handlePwdSave} className="space-y-3">
          {[
            { key: 'current_password',      label: 'Mot de passe actuel',          ac: 'current-password' },
            { key: 'password',              label: 'Nouveau mot de passe',          ac: 'new-password' },
            { key: 'password_confirmation', label: 'Confirmer le nouveau mot de passe', ac: 'new-password' },
          ].map(({ key, label, ac }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">{label}</label>
              <PasswordInput required autoComplete={ac}
                value={pwd[key as keyof typeof pwd]}
                onChange={(e) => setPwd((p) => ({ ...p, [key]: e.target.value }))}
                className={inputCls} />
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
