'use client';

import { useState, type InputHTMLAttributes } from 'react';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>;

/**
 * Champ de mot de passe avec bouton pour afficher ou masquer la saisie.
 *
 * Composant unique pour tous les formulaires : chaque champ a exactement un
 * œil, et son état est indépendant de celui des autres champs. Le bloc d'icônes
 * était auparavant recopié dans cinq pages, avec un état partagé qui révélait
 * ensemble des champs que l'utilisateur voulait garder séparés.
 *
 * Toutes les props d'un `<input>` sont transmises (`value`, `onChange`,
 * `required`, `autoComplete`, `className`…), sauf `type`, géré ici.
 */
export function PasswordInput({ className = '', ...props }: Props) {
  const [visible, setVisible] = useState(false);

  // Le bouton occupe la droite du champ : on réserve la place du texte, quelle
  // que soit la valeur de `pr-*` que l'appelant avait prévue.
  const classes = `${className.replace(/\bpr-\d+\b/g, '')} pr-10`.trim();

  return (
    <div className="relative">
      <input {...props} type={visible ? 'text' : 'password'} className={classes} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
        aria-pressed={visible}
        title={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
      >
        {visible ? (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        )}
      </button>
    </div>
  );
}
