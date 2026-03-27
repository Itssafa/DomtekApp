'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function SuccesContent() {
  const params = useSearchParams();
  const sessionId = params.get('session_id');

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md w-full text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-3">Paiement confirmé !</h1>
        <p className="text-gray-500 text-sm mb-8 leading-relaxed">
          Votre paiement a bien été reçu. Votre facture sera mise à jour sous quelques instants.
          Un reçu vous sera envoyé par e-mail.
        </p>
        {sessionId && (
          <p className="text-xs text-gray-300 mb-6 font-mono break-all">
            Réf. transaction : {sessionId}
          </p>
        )}
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition"
        >
          Retour à l'accueil
        </Link>
      </div>
    </div>
  );
}

export default function PaiementSuccesPage() {
  return (
    <Suspense>
      <SuccesContent />
    </Suspense>
  );
}
