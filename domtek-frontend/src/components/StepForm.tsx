'use client';

import { useState } from 'react';
import Link from '@/components/OrgLink';

export interface FormStep {
  title: string;
  content: React.ReactNode;
  /** Retourne un message d'erreur si l'étape est invalide, null sinon */
  validate?: () => string | null;
}

interface Props {
  steps: FormStep[];
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void | Promise<void>;
  submitLabel?: string;
  loading?: boolean;
  cancelHref: string;
}

export default function StepForm({ steps, onSubmit, submitLabel = 'Enregistrer', loading, cancelHref }: Props) {
  const [current, setCurrent]     = useState(0);
  const [stepError, setStepError] = useState<string | null>(null);
  const isLast = current === steps.length - 1;

  const goTo = (i: number) => {
    if (i >= 0 && i < steps.length) {
      setStepError(null);
      setCurrent(i);
    }
  };

  const tryNext = () => {
    const error = steps[current].validate?.() ?? null;
    if (error) {
      setStepError(error);
      return;
    }
    goTo(current + 1);
  };

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); if (isLast) onSubmit(e); }}
      className="space-y-6"
    >
      {/* ── Stepper ── */}
      <div className="flex items-center">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            <button
              type="button"
              disabled={i > current}
              onClick={() => { if (i < current) goTo(i); }}
              className={`flex items-center gap-2 ${i < current ? 'cursor-pointer' : 'cursor-default'}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                i < current
                  ? 'bg-violet-600 border-violet-600 text-white'
                  : i === current
                    ? 'border-violet-600 text-violet-600 bg-violet-50'
                    : 'border-gray-300 text-gray-400 bg-white'
              }`}>
                {i < current ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span>{i + 1}</span>
                )}
              </div>
              <span className={`text-xs font-medium hidden sm:block whitespace-nowrap ${
                i === current ? 'text-violet-700' : i < current ? 'text-violet-400' : 'text-gray-400'
              }`}>
                {step.title}
              </span>
            </button>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-px mx-3 min-w-4 transition-colors ${i < current ? 'bg-violet-400' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      {/* ── Contenu de l'étape courante ── */}
      <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-6">
        <div className="space-y-5">
          {steps[current].content}
        </div>

        {/* Message d'erreur de validation */}
        {stepError && (
          <div className="mt-5 flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            {stepError}
          </div>
        )}
      </div>

      {/* ── Navigation ── */}
      <div className="flex justify-between items-center">
        <div>
          {current > 0 && (
            <button
              type="button"
              onClick={() => goTo(current - 1)}
              className="px-5 py-2.5 border border-gray-300 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition"
            >
              ← Précédent
            </button>
          )}
        </div>
        <div className="flex gap-3 items-center">
          <Link href={cancelHref} className="px-4 py-2.5 text-gray-400 text-sm hover:text-gray-600 transition">
            Annuler
          </Link>
          {isLast ? (
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition"
            >
              {loading ? 'Enregistrement…' : submitLabel}
            </button>
          ) : (
            <button
              type="button"
              onClick={tryNext}
              className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition"
            >
              Suivant →
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
