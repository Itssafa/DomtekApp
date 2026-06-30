'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { AxiosError } from 'axios';

interface OrgOption { id: number; nom: string; }

const inputCls    = 'w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all';
const inputErrCls = 'w-full border border-red-400 bg-red-50 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 transition-all';

export default function RegisterEmployePage() {
  const [orgs, setOrgs] = useState<OrgOption[]>([]);
  const [form, setForm] = useState({
    nom: '',
    prenom: '',
    email: '',
    password: '',
    password_confirmation: '',
    organisation_id: '',
    date_naissance: '',
    cin: '',
    cin_delivree_le: '',
    cin_delivree_a: 'Tunis',
  });
  const [errors, setErrors]   = useState<Record<string, string[]>>({});
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  useEffect(() => {
    api.get('/organisations', { params: { per_page: 100 } }).then(({ data }) => {
      setOrgs(data.data ?? []);
    }).catch(() => {});
  }, []);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    setMessage('');
    setLoading(true);
    try {
      await api.post('/auth/register/employe', {
        ...form,
        organisation_id: Number(form.organisation_id),
      });
      setMessage("Votre compte a été créé avec succès. Il sera activé par votre organisation avant que vous puissiez vous connecter.");
    } catch (err) {
      const ax = err as AxiosError<{ message?: string; errors?: Record<string, string[]> }>;
      if (ax.response?.data?.errors) setErrors(ax.response.data.errors);
      else setMessage(ax.response?.data?.message ?? 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-[52%] bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 relative overflow-hidden flex-col justify-between p-14">
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-white/5 rounded-full" />
        <div className="absolute -bottom-24 -left-16 w-80 h-80 bg-white/5 rounded-full" />
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <span className="text-white text-2xl font-bold tracking-tight">Domtek</span>
        </div>
        <div className="relative z-10 space-y-6">
          <h2 className="text-4xl font-bold text-white leading-tight">
            Rejoignez votre<br />organisation sur<br />Domtek
          </h2>
          <p className="text-blue-100 text-base leading-relaxed max-w-sm">
            Créez votre compte employé et accédez aux outils de gestion immobilière de votre organisation.
          </p>
          <div className="space-y-3 pt-2">
            {[
              'Accès aux biens et annonces',
              'Suivi des contrats et clients',
              'Gestion de vos tâches',
            ].map((f) => (
              <div key={f} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-blue-100 text-sm">{f}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="relative z-10">
          <p className="text-blue-200/50 text-xs">© {new Date().getFullYear()} Domtek. Tous droits réservés.</p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50 overflow-y-auto">
        <div className="w-full max-w-lg animate-fade-in py-8">

          <div className="lg:hidden flex items-center gap-2 justify-center mb-8">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
              </svg>
            </div>
            <span className="text-xl font-bold text-gray-900">Domtek</span>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Créer un compte employé</h1>
            <p className="text-gray-500 text-sm mb-7">Remplissez vos informations pour rejoindre votre organisation</p>

            {message && (
              <div className={`flex items-start gap-2.5 rounded-xl px-4 py-3 mb-5 text-sm animate-fade-in-fast ${
                message.startsWith('Votre compte a été créé')
                  ? 'bg-green-50 border border-green-200 text-green-700'
                  : 'bg-red-50 border border-red-100 text-red-700'
              }`}>
                <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {message.startsWith('Votre compte a été créé')
                    ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />}
                </svg>
                <span>{message}</span>
              </div>
            )}

            {!message.startsWith('Votre compte a été créé') && (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Nom + Prénom */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Nom <span className="text-red-500">*</span></label>
                    <input type="text" required value={form.nom} onChange={set('nom')} className={errors.nom ? inputErrCls : inputCls} />
                    {errors.nom && <p className="text-red-500 text-xs mt-1">{errors.nom[0]}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Prénom <span className="text-red-500">*</span></label>
                    <input type="text" required value={form.prenom} onChange={set('prenom')} className={errors.prenom ? inputErrCls : inputCls} />
                    {errors.prenom && <p className="text-red-500 text-xs mt-1">{errors.prenom[0]}</p>}
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Adresse e-mail <span className="text-red-500">*</span></label>
                  <input type="email" required value={form.email} onChange={set('email')} className={errors.email ? inputErrCls : inputCls} placeholder="votre@email.com" />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email[0]}</p>}
                </div>

                {/* Date de naissance */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Date de naissance</label>
                  <input type="date" value={form.date_naissance} onChange={set('date_naissance')} className={inputCls} />
                  {errors.date_naissance && <p className="text-red-500 text-xs mt-1">{errors.date_naissance[0]}</p>}
                </div>

                {/* CIN */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">CIN</label>
                    <input type="text" value={form.cin} onChange={set('cin')} className={errors.cin ? inputErrCls : inputCls} placeholder="12345678" />
                    {errors.cin && <p className="text-red-500 text-xs mt-1">{errors.cin[0]}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Délivré le</label>
                    <input type="date" value={form.cin_delivree_le} onChange={set('cin_delivree_le')} className={errors.cin_delivree_le ? inputErrCls : inputCls} />
                    {errors.cin_delivree_le && <p className="text-red-500 text-xs mt-1">{errors.cin_delivree_le[0]}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Délivré à</label>
                    <input type="text" value={form.cin_delivree_a} onChange={set('cin_delivree_a')} className={errors.cin_delivree_a ? inputErrCls : inputCls} />
                    {errors.cin_delivree_a && <p className="text-red-500 text-xs mt-1">{errors.cin_delivree_a[0]}</p>}
                  </div>
                </div>

                {/* Organisation */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Organisation <span className="text-red-500">*</span></label>
                  <select required value={form.organisation_id} onChange={set('organisation_id')} className={errors.organisation_id ? inputErrCls : inputCls}>
                    <option value="">— Sélectionnez votre organisation —</option>
                    {orgs.map((o) => (
                      <option key={o.id} value={o.id}>{o.nom}</option>
                    ))}
                  </select>
                  {errors.organisation_id && <p className="text-red-500 text-xs mt-1">{errors.organisation_id[0]}</p>}
                </div>

                {/* Mot de passe */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Mot de passe <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input type={showPwd ? 'text' : 'password'} required autoComplete="new-password"
                      value={form.password} onChange={set('password')} placeholder="8 caractères minimum"
                      className={(errors.password ? inputErrCls : inputCls) + ' pr-10'} />
                    <button type="button" onClick={() => setShowPwd((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        {showPwd
                          ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          : <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></>}
                      </svg>
                    </button>
                  </div>
                  {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password[0]}</p>}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Confirmer le mot de passe <span className="text-red-500">*</span></label>
                  <input type={showPwd ? 'text' : 'password'} required autoComplete="new-password"
                    value={form.password_confirmation} onChange={set('password_confirmation')}
                    placeholder="Répétez le mot de passe"
                    className={inputCls} />
                </div>

                <button type="submit" disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl text-sm transition-all shadow-sm hover:shadow-md mt-1">
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Création…
                    </span>
                  ) : 'Créer mon compte'}
                </button>
              </form>
            )}

            {message.startsWith('Votre compte a été créé') && (
              <div className="text-center mt-4">
                <Link href="/login"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors">
                  Se connecter
                </Link>
              </div>
            )}

            <p className="text-center text-sm text-gray-500 mt-6">
              Déjà un compte ?{' '}
              <Link href="/login" className="text-blue-600 hover:text-blue-700 font-semibold">
                Se connecter
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
