'use client';

import Link from 'next/link';

export default function PaiementAnnulePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md w-full text-center">
        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-3">Paiement annulé</h1>
        <p className="text-gray-500 text-sm mb-8 leading-relaxed">
          Votre paiement a été annulé. Aucun montant n'a été débité.
          Vous pouvez réessayer à tout moment en cliquant sur le lien dans votre e-mail.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-gray-800 hover:bg-gray-900 text-white text-sm font-semibold rounded-lg transition"
        >
          Retour à l'accueil
        </Link>
      </div>
    </div>
  );
}
