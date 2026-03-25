'use client';

type Status =
  | 'active'
  | 'actif'
  | 'inactive'
  | 'inactif'
  | 'en_attente'
  | 'pending'
  | 'disponible'
  | 'vendu'
  | 'loue'
  | 'publiee'
  | 'brouillon'
  | 'planifiee'
  | 'archivee'
  | 'termine'
  | 'resilie'
  | 'payee'
  | 'impayee'
  | 'en_retard';

const STATUS_CONFIG: Record<string, { label: string; classes: string }> = {
  active:     { label: 'Active',     classes: 'bg-green-100 text-green-800' },
  actif:      { label: 'Actif',      classes: 'bg-green-100 text-green-800' },
  inactive:   { label: 'Inactive',   classes: 'bg-red-100 text-red-800' },
  inactif:    { label: 'Inactif',    classes: 'bg-red-100 text-red-800' },
  en_attente: { label: 'En attente', classes: 'bg-yellow-100 text-yellow-800' },
  pending:    { label: 'En attente', classes: 'bg-yellow-100 text-yellow-800' },
  disponible: { label: 'Disponible', classes: 'bg-green-100 text-green-800' },
  vendu:      { label: 'Vendu',      classes: 'bg-gray-100 text-gray-800' },
  loue:       { label: 'Loué',       classes: 'bg-blue-100 text-blue-800' },
  publiee:    { label: 'Publiée',    classes: 'bg-green-100 text-green-800' },
  brouillon:  { label: 'Brouillon',  classes: 'bg-gray-100 text-gray-700' },
  planifiee:  { label: 'Planifiée',  classes: 'bg-purple-100 text-purple-800' },
  archivee:   { label: 'Archivée',   classes: 'bg-gray-200 text-gray-600' },
  termine:    { label: 'Terminé',    classes: 'bg-gray-100 text-gray-700' },
  resilie:    { label: 'Résilié',    classes: 'bg-red-100 text-red-800' },
  payee:      { label: 'Payée',      classes: 'bg-green-100 text-green-800' },
  impayee:    { label: 'Impayée',    classes: 'bg-red-100 text-red-800' },
  en_retard:  { label: 'En retard',  classes: 'bg-orange-100 text-orange-800' },
};

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    classes: 'bg-gray-100 text-gray-700',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.classes}`}
    >
      {config.label}
    </span>
  );
}
