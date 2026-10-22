'use client';

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { aideChamp, erreurChamp } from '@/lib/regles-champs';

/** Événement émis par un formulaire à étapes quand « Suivant » est refusé. */
export const EVENEMENT_VALIDER_TOUT = 'domtek:valider-tout';

export interface RenduChamp {
  /** Vrai quand un message d'erreur est affiché : pour colorer le champ en rouge. */
  invalide: boolean;
  /** À étaler sur le champ pour que les lecteurs d'écran annoncent condition et erreur. */
  aria: { 'aria-invalid'?: true; 'aria-describedby'?: string };
}

interface Props {
  /** Nom du champ : il désigne sa règle dans `REGLES_CHAMPS` et sa valeur dans `form`. */
  nom: string;
  /** Valeurs du formulaire. Un champ peut dépendre d'un autre (confirmation, type de pièce). */
  form: object;
  /** Champ obligatoire : « Le prénom est obligatoire. » s'il est laissé vide. */
  requis?: boolean;
  /** Erreur déjà connue (renvoyée par le serveur, ou levée à l'envoi). */
  erreur?: string | null;
  /** Remplace la condition du registre ; `null` la supprime (ex. : connexion). */
  aide?: string | null;
  /**
   * Le champ lui-même, si on veut qu'il soit enveloppé (le composant lui rend
   * alors `invalide` et `aria`). Sans enfant, `Champ` se pose **juste après** le
   * champ, à la place de la ligne d'erreur, et surveille son voisin.
   */
  children?: ReactNode | ((rendu: RenduChamp) => ReactNode);
}

/**
 * Ajoute à un champ de formulaire deux choses :
 *
 *  1. la **condition de saisie**, affichée en permanence sous le champ
 *     (« 8 chiffres, indicatif +216 facultatif ») ;
 *  2. le **message d'erreur**, affiché dès que l'utilisateur quitte le champ
 *     (« Les mots de passe ne correspondent pas. »), puis tenu à jour à chaque
 *     frappe jusqu'à ce que la saisie soit correcte.
 *
 * Les règles viennent du registre `REGLES_CHAMPS` : le formulaire ne fait que
 * nommer son champ. Tous les champs d'un formulaire sont aussi contrôlés d'un
 * coup à l'envoi, ou quand un formulaire à étapes refuse de passer à la suite,
 * pour que chaque message apparaisse à côté du champ concerné.
 *
 * **Deux façons de l'employer**
 *  - posé à côté du champ : `<input … /><Champ nom="telephone" form={form} />`.
 *    Il surveille le champ qui le précède dans le même bloc, et le colore en
 *    rouge par l'attribut `aria-invalid` (règle CSS globale) ;
 *  - enveloppant le champ : `<Champ …>{({ invalide, aria }) => <input … />}</Champ>`.
 */
export function Champ({ nom, form, requis = false, erreur = null, aide, children }: Props) {
  const id = useId();
  const marque = useRef<HTMLElement>(null);
  const [touche, setTouche] = useState(false);

  const enveloppe = children !== undefined;
  const valeur = String((form as Record<string, unknown>)[nom] ?? '');

  // Une erreur renvoyée par le serveur ne vaut que pour la valeur qui l'a
  // provoquée : dès que l'utilisateur corrige, elle disparaît d'elle-même au
  // lieu de rester affichée jusqu'au prochain envoi.
  const [vue, setVue] = useState({ erreur, valeur });
  if (erreur !== vue.erreur) setVue({ erreur, valeur });
  const erreurServeur = erreur && vue.valeur === valeur ? erreur : null;

  const erreurSaisie = touche ? erreurChamp(nom, valeur, form as Record<string, unknown>, requis) : null;
  const message = erreurSaisie ?? erreurServeur;
  const condition = aide === undefined ? aideChamp(nom, form as Record<string, unknown>) : aide;

  const idAide = `${id}-aide`;
  const idErreur = `${id}-erreur`;
  const decrit = [condition && idAide, message && idErreur].filter(Boolean).join(' ');

  // Le bloc surveillé : l'enveloppe elle-même, ou le parent du champ voisin.
  const conteneur = () => (enveloppe ? marque.current : marque.current?.parentElement) ?? null;

  useEffect(() => {
    const zone = conteneur();
    const toucher = () => setTouche(true);
    const formulaire = marque.current?.closest('form');
    // Dès que la saisie perd le focus, même au profit du bouton œil d'un mot de
    // passe : au clavier, Tab y mène en premier, et attendre un second Tab ferait
    // apparaître le message avec un champ de retard.
    zone?.addEventListener('focusout', toucher);
    // Phase de capture : le champ est marqué avant que le formulaire ne traite l'envoi.
    formulaire?.addEventListener('submit', toucher, true);
    document.addEventListener(EVENEMENT_VALIDER_TOUT, toucher);
    return () => {
      zone?.removeEventListener('focusout', toucher);
      formulaire?.removeEventListener('submit', toucher, true);
      document.removeEventListener(EVENEMENT_VALIDER_TOUT, toucher);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mode « posé à côté » : on pose nous-mêmes les attributs d'accessibilité sur
  // le champ voisin, qui n'a pas été prévu pour les recevoir.
  useEffect(() => {
    if (enveloppe) return;
    const champ = conteneur()?.querySelector<HTMLElement>('input:not([type=hidden]), select, textarea');
    if (!champ) return;
    if (message) champ.setAttribute('aria-invalid', 'true');
    else champ.removeAttribute('aria-invalid');
    if (decrit) champ.setAttribute('aria-describedby', decrit);
    else champ.removeAttribute('aria-describedby');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message, decrit, enveloppe]);

  const messages = (
    <>
      {condition && <p id={idAide} className="text-[11px] text-gray-400 mt-1">{condition}</p>}
      {message && <p id={idErreur} role="alert" className="text-red-500 text-xs mt-1">{message}</p>}
    </>
  );

  if (!enveloppe) {
    return (
      <>
        <span ref={marque} className="hidden" aria-hidden="true" />
        {messages}
      </>
    );
  }

  const rendu: RenduChamp = {
    invalide: !!message,
    aria: {
      ...(message ? { 'aria-invalid': true as const } : {}),
      ...(decrit ? { 'aria-describedby': decrit } : {}),
    },
  };

  return (
    <div ref={marque as React.RefObject<HTMLDivElement>}>
      {typeof children === 'function' ? children(rendu) : children}
      {messages}
    </div>
  );
}
