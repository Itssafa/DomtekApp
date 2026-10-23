'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { AxiosError } from 'axios';
import { GoogleAuthButton } from '@/components/GoogleAuthButton';
import { PasswordInput } from '@/components/PasswordInput';
import { Champ } from '@/components/Champ';
import { isValidEmail, isValidPhone, filtreTelephone, validatePassword, isValidCityOrPlace } from '@/lib/validation';

interface FormState {
  name:                 string;
  email:                string;
  password:             string;
  password_confirmation: string;
  nom_organisation:     string;
  ville:                string;
  telephone:            string;
  email_organisation:   string;
  description:          string;
}

export default function RegisterOrganisationPage() {
  const router = useRouter();

  // Token Google chiffré reçu depuis le backend après OAuth
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [fromGoogle,  setFromGoogle]  = useState(false);

  const [form, setForm] = useState<FormState>({
    name: '', email: '', password: '', password_confirmation: '',
    nom_organisation: '', ville: '', telephone: '',
    email_organisation: '', description: '',
  });
  const [errors,  setErrors]  = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);

  // Lire le token Google depuis l'URL (?g=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const g = params.get('g');
    if (!g) return;

    setGoogleToken(g);
    setFromGoogle(true);

    // Déchiffrer côté client pour pré-remplir nom + email
    // On appelle un endpoint léger qui renvoie juste les infos publiques
    api.post<{ name: string; email: string }>('/auth/google/prefill', { token: g })
      .then(({ data }) => {
        setForm(prev => ({ ...prev, name: data.name, email: data.email }));
      })
      .catch(() => {
        // Token invalide/expiré
        setErrors({ google: ['Le lien Google a expiré. Veuillez recommencer.'] });
        setFromGoogle(false);
        setGoogleToken(null);
      });
  }, []);

  const set = (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});

    const newErrors: Record<string, string[]> = {};
    if (!isValidEmail(form.email)) {
      newErrors.email = ["Adresse e-mail invalide."];
    }
    if (form.email_organisation && !isValidEmail(form.email_organisation)) {
      newErrors.email_organisation = ["Adresse e-mail invalide."];
    }
    if (form.telephone && !isValidPhone(form.telephone)) {
      newErrors.telephone = ["Le numéro de téléphone doit contenir exactement 8 chiffres."];
    }
    if (form.ville && !isValidCityOrPlace(form.ville)) {
      newErrors.ville = ["Ville invalide."];
    }
    if (!fromGoogle) {
      const passwordError = validatePassword(form.password);
      if (passwordError) newErrors.password = [passwordError];
      if (form.password !== form.password_confirmation) {
        newErrors.password_confirmation = ["Les mots de passe ne correspondent pas."];
      }
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      if (fromGoogle && googleToken) {
        await api.post('/auth/register/organisation-google', {
          google_token:       googleToken,
          nom_organisation:   form.nom_organisation,
          ville:              form.ville,
          telephone:          form.telephone,
          email_organisation: form.email_organisation,
          description:        form.description,
        });
      } else {
        await api.post('/auth/register/organisation', form);
      }
      router.push('/en-attente');
    } catch (err) {
      const axiosError = err as AxiosError<{ errors?: Record<string, string[]>; message?: string }>;
      if (axiosError.response?.data?.errors) {
        setErrors(axiosError.response.data.errors);
      } else if (axiosError.response?.data?.message) {
        setErrors({ general: [axiosError.response.data.message] });
      }
    } finally {
      setLoading(false);
    }
  };

  const textField = (label: string, name: keyof FormState, type = 'text', placeholder = '', required = false) => {
    const props = {
      value: form[name],
      onChange: type === 'tel'
        ? (e: React.ChangeEvent<HTMLInputElement>) => setForm(prev => ({ ...prev, [name]: filtreTelephone(e.target.value) }))
        : set(name),
      placeholder,
      required,
      readOnly: fromGoogle && (name === 'name' || name === 'email'),
      className: `w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 ${
        fromGoogle && (name === 'name' || name === 'email')
          ? 'border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed focus:ring-blue-500'
          : errors[name]
            ? 'border-red-400 bg-red-50 focus:ring-red-400'
            : 'border-gray-300 focus:ring-blue-500'
      }`,
    };
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        {type === 'password'
          ? <PasswordInput {...props} autoComplete="new-password" />
          : <input type={type} {...props} />}
        <Champ nom={name} form={form} requis={required} erreur={errors[name]?.[0]}
          aide={fromGoogle && (name === 'name' || name === 'email') ? null : undefined} />
      </div>
    );
  };

  return (
    <div className="min-h-screen flex">
      {/* Panneau de présentation (bleu) */}
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
            Gérez votre agence<br />immobilière sur<br />Domtek
          </h2>
          <p className="text-blue-100 text-base leading-relaxed max-w-sm">
            Créez le compte de votre organisation et pilotez biens, contrats, clients et équipe depuis un seul espace.
          </p>
          <div className="space-y-3 pt-2">
            {[
              'Biens, immeubles et annonces',
              'Contrats, locations et factures',
              'Clients, prospects et employés',
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

      {/* Panneau du formulaire */}
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
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Créer un compte organisation</h1>
        <p className="text-gray-500 text-sm mb-7">
          Votre compte sera activé après validation par un administrateur.
        </p>

        {errors.general && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">
            {errors.general[0]}
          </div>
        )}
        {errors.google && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">
            {errors.google[0]}
          </div>
        )}

        {/* Bouton Google — uniquement si pas déjà depuis Google */}
        {!fromGoogle && (
          <>
            <GoogleAuthButton label="S'inscrire avec Google" intent="organisation" />
            <div className="flex items-center gap-3 my-5">
              <span className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400">ou avec un e-mail</span>
              <span className="flex-1 h-px bg-gray-200" />
            </div>
          </>
        )}

        {/* Badge Google si pré-rempli */}
        {fromGoogle && (
          <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-5">
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-blue-800">Connecté avec Google</p>
              <p className="text-xs text-blue-600 truncate">{form.email}</p>
            </div>
            <button type="button" onClick={() => { setFromGoogle(false); setGoogleToken(null); setForm(prev => ({ ...prev, name: '', email: '' })); }}
              className="text-xs text-blue-500 hover:underline flex-shrink-0">
              Changer
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Section responsable */}
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Responsable</p>
          {textField('Nom complet', 'name', 'text', 'Ahmed Ben Ali', true)}
          {textField('Email de connexion', 'email', 'email', 'admin@organisation.tn', true)}

          {/* Champs mot de passe — cachés si Google */}
          {!fromGoogle && (
            <>
              {textField('Mot de passe', 'password', 'password', '', true)}
              {textField('Confirmer le mot de passe', 'password_confirmation', 'password', '', true)}
            </>
          )}

          {/* Section organisation */}
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider pt-2">Organisation</p>
          {textField("Nom de l'organisation", 'nom_organisation', 'text', 'Soleil Immobilier', true)}
          {textField('Ville', 'ville', 'text', 'Tunis')}
          {textField('Téléphone', 'telephone', 'tel', '71123456')}
          {textField("Email de l'organisation", 'email_organisation', 'email', 'contact@organisation.tn')}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={set('description')}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Présentez votre organisation..."
            />
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg text-sm transition">
            {loading ? 'Envoi en cours…' : 'Créer mon compte'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Déjà un compte ?{' '}
          <Link href="/login" className="text-blue-600 hover:underline font-medium">Se connecter</Link>
        </p>
          </div>
        </div>
      </div>
    </div>
  );
}
