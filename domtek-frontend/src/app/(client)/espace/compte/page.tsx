'use client';

import { useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import api from '@/lib/api';
import { Champ } from '@/components/Champ';
import { PasswordInput } from '@/components/PasswordInput';
import { filtreTelephone, isValidPhone, isValidCityOrPlace, validatePassword } from '@/lib/validation';

interface Compte {
  email: string;
  nom_complet: string;
  a_une_fiche: boolean;
  identite: { civilite: string | null; nom: string; prenom: string; cin: string | null; date_naissance: string | null } | null;
  coordonnees: Record<Coordonnee, string | null> | null;
}

type Coordonnee = 'telephone' | 'adresse' | 'ville' | 'urgence_nom' | 'urgence_telephone' | 'urgence_relation';
type Retour = { type: 'ok' | 'erreur'; message: string } | null;

const VIDE: Record<Coordonnee, string> = {
  telephone: '', adresse: '', ville: '', urgence_nom: '', urgence_telephone: '', urgence_relation: '',
};

const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
const lectureCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500';
const labelCls = 'block text-xs font-medium text-gray-600 mb-1';

/** Résumé des erreurs de validation renvoyées par l'API, ou son message. */
function messageErreur(err: unknown): { champs: Record<string, string[]>; message: string } {
  const ax = err as AxiosError<{ errors?: Record<string, string[]>; message?: string }>;
  const champs = ax.response?.data?.errors ?? {};
  return { champs, message: ax.response?.data?.message ?? 'Une erreur est survenue.' };
}

function Alerte({ retour }: { retour: Retour }) {
  if (!retour) return null;
  return (
    <p role="alert" className={`text-sm rounded-lg px-3 py-2 border ${
      retour.type === 'ok' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
    }`}>
      {retour.message}
    </p>
  );
}

export default function MonComptePage() {
  const [compte, setCompte]   = useState<Compte | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Coordonnées ──
  const [form, setForm]           = useState(VIDE);
  const [errors, setErrors]       = useState<Record<string, string[]>>({});
  const [saving, setSaving]       = useState(false);
  const [retourInfos, setRetourInfos] = useState<Retour>(null);

  // ── Mot de passe ──
  const [pwd, setPwd] = useState({ current_password: '', password: '', password_confirmation: '' });
  const [pwdErrors, setPwdErrors] = useState<Record<string, string[]>>({});
  const [savingPwd, setSavingPwd] = useState(false);
  const [retourPwd, setRetourPwd] = useState<Retour>(null);

  const remplir = (c: Compte) => {
    setCompte(c);
    if (c.coordonnees) {
      setForm(Object.fromEntries(
        (Object.keys(VIDE) as Coordonnee[]).map((k) => [k, c.coordonnees?.[k] ?? ''])
      ) as Record<Coordonnee, string>);
    }
  };

  useEffect(() => {
    api.get('/client/compte')
      .then(({ data }) => remplir(data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const set = (k: Coordonnee, filtre?: (v: string) => string) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((p) => ({ ...p, [k]: filtre ? filtre(e.target.value) : e.target.value }));

  const enregistrerInfos = async (e: React.FormEvent) => {
    e.preventDefault();
    setRetourInfos(null);
    const local: Record<string, string[]> = {};
    if (!isValidPhone(form.telephone)) local.telephone = ['Le numéro de téléphone doit contenir exactement 8 chiffres.'];
    if (form.urgence_telephone && !isValidPhone(form.urgence_telephone)) local.urgence_telephone = ["Le téléphone d'urgence doit contenir exactement 8 chiffres."];
    if (form.ville && !isValidCityOrPlace(form.ville)) local.ville = ['La ville ne doit contenir que des lettres.'];
    setErrors(local);
    if (Object.keys(local).length) return;

    setSaving(true);
    try {
      const { data } = await api.put('/client/compte', form);
      remplir(data.data);
      setRetourInfos({ type: 'ok', message: data.message });
    } catch (err) {
      const { champs, message } = messageErreur(err);
      setErrors(champs);
      setRetourInfos({ type: 'erreur', message });
    } finally {
      setSaving(false);
    }
  };

  const changerMotDePasse = async (e: React.FormEvent) => {
    e.preventDefault();
    setRetourPwd(null);
    const local: Record<string, string[]> = {};
    if (!pwd.current_password) local.current_password = ['Saisissez votre mot de passe actuel.'];
    const faiblesse = validatePassword(pwd.password);
    if (faiblesse) local.password = [faiblesse];
    if (pwd.password !== pwd.password_confirmation) local.password_confirmation = ['Les mots de passe ne correspondent pas.'];
    setPwdErrors(local);
    if (Object.keys(local).length) return;

    setSavingPwd(true);
    try {
      const { data } = await api.put('/auth/me/password', pwd);
      setPwd({ current_password: '', password: '', password_confirmation: '' });
      setRetourPwd({ type: 'ok', message: data.message });
    } catch (err) {
      const { champs, message } = messageErreur(err);
      setPwdErrors(champs);
      setRetourPwd({ type: 'erreur', message: champs.current_password?.[0] ?? message });
    } finally {
      setSavingPwd(false);
    }
  };

  if (loading) {
    return <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />;
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mon compte</h1>
        <p className="text-sm text-gray-500 mt-1">Mettez à jour vos coordonnées et votre mot de passe.</p>
      </div>

      {/* ── Identité (lecture seule) ── */}
      <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-gray-800">Identité</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Ces informations figurent sur vos contrats : pour les corriger, contactez votre agence.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className={labelCls}>Nom complet</label><input className={lectureCls} value={compte?.nom_complet ?? ''} disabled /></div>
          <div><label className={labelCls}>Adresse e-mail (identifiant)</label><input className={lectureCls} value={compte?.email ?? ''} disabled /></div>
          {compte?.identite && (
            <>
              <div><label className={labelCls}>N° de CIN</label><input className={lectureCls} value={compte.identite.cin ?? '—'} disabled /></div>
              <div><label className={labelCls}>Date de naissance</label>
                <input className={lectureCls} disabled
                  value={compte.identite.date_naissance ? new Date(compte.identite.date_naissance).toLocaleDateString('fr-FR') : '—'} />
              </div>
            </>
          )}
        </div>
      </section>

      {/* ── Coordonnées (modifiables) ── */}
      {compte?.a_une_fiche ? (
        <form onSubmit={enregistrerInfos} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="text-base font-semibold text-gray-800">Mes coordonnées</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Téléphone <span className="text-red-500">*</span></label>
              <input type="tel" inputMode="numeric" className={inputCls} value={form.telephone} onChange={set('telephone', filtreTelephone)} />
              <Champ nom="telephone" form={form} requis erreur={errors.telephone?.[0]} />
            </div>
            <div>
              <label className={labelCls}>Ville</label>
              <input className={inputCls} value={form.ville} onChange={set('ville')} />
              <Champ nom="ville" form={form} erreur={errors.ville?.[0]} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Adresse</label>
              <input className={inputCls} value={form.adresse} onChange={set('adresse')} />
              <Champ nom="adresse" form={form} erreur={errors.adresse?.[0]} />
            </div>
          </div>

          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider pt-2">Contact d&apos;urgence</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Nom</label>
              <input className={inputCls} value={form.urgence_nom} onChange={set('urgence_nom')} />
              <Champ nom="urgence_nom" form={form} erreur={errors.urgence_nom?.[0]} />
            </div>
            <div>
              <label className={labelCls}>Téléphone</label>
              <input type="tel" inputMode="numeric" className={inputCls} value={form.urgence_telephone} onChange={set('urgence_telephone', filtreTelephone)} />
              <Champ nom="urgence_telephone" form={form} erreur={errors.urgence_telephone?.[0]} />
            </div>
            <div>
              <label className={labelCls}>Relation</label>
              <input className={inputCls} value={form.urgence_relation} onChange={set('urgence_relation')} placeholder="Parent, conjoint…" />
              <Champ nom="urgence_relation" form={form} erreur={errors.urgence_relation?.[0]} />
            </div>
          </div>

          <Alerte retour={retourInfos} />
          <div className="flex justify-end">
            <button type="submit" disabled={saving}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition">
              {saving ? 'Enregistrement…' : 'Enregistrer mes coordonnées'}
            </button>
          </div>
        </form>
      ) : (
        <section className="bg-white rounded-xl border border-gray-200 p-6 text-sm text-gray-500">
          Aucune agence ne vous a encore rattaché de fiche client : vos coordonnées seront modifiables ici dès votre premier contrat.
        </section>
      )}

      {/* ── Mot de passe ── */}
      <form onSubmit={changerMotDePasse} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="text-base font-semibold text-gray-800">Mot de passe</h2>
        {([
          { key: 'current_password', label: 'Mot de passe actuel', ac: 'current-password' },
          { key: 'password', label: 'Nouveau mot de passe', ac: 'new-password' },
          { key: 'password_confirmation', label: 'Confirmer le nouveau mot de passe', ac: 'new-password' },
        ] as const).map(({ key, label, ac }) => (
          <div key={key}>
            <label className={labelCls}>{label}</label>
            <PasswordInput autoComplete={ac} className={inputCls}
              value={pwd[key]} onChange={(e) => setPwd((p) => ({ ...p, [key]: e.target.value }))} />
            <Champ nom={key} form={pwd} requis erreur={pwdErrors[key]?.[0]}
              aide={key === 'current_password' ? null : undefined} />
          </div>
        ))}
        <Alerte retour={retourPwd} />
        <div className="flex justify-end">
          <button type="submit" disabled={savingPwd}
            className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition">
            {savingPwd ? 'Modification…' : 'Changer le mot de passe'}
          </button>
        </div>
      </form>
    </div>
  );
}
