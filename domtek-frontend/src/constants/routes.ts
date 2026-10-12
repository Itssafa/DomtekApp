/**
 * Centralized route constants.
 * Never hardcode route paths in JSX — always use this file.
 * Documentation: frontend/documentation/best-practices.md §5
 */

export const ROUTES = {
  // ── Public ─────────────────────────────────────────────────────────────────
  home: '/',
  annonces: '/annonces',
  annonce: (id: number) => `/annonces/${id}`,
  organisations: '/organisations',
  organisation: (slug: string) => `/organisations/${slug}`,

  // ── Auth ───────────────────────────────────────────────────────────────────
  login: '/login',
  registerOrganisation: '/register/organisation',
  registerClient: '/register/client',
  enAttente: '/en-attente',

  // ── Admin back-office ──────────────────────────────────────────────────────
  admin: {
    dashboard: '/admin',
    organisations: '/admin/organisations',
    organisation: (slug: string) => `/admin/organisations/${slug}`,
    organisationBiens: (slug: string) => `/admin/organisations/${slug}/biens`,
    organisationAnnonces: (slug: string) => `/admin/organisations/${slug}/annonces`,
    organisationComptes: (slug: string) => `/admin/organisations/${slug}/comptes`,
  },

  // ── Organisation dashboard ─────────────────────────────────────────────────
  dashboard: {
    home: '/dashboard',

    biens: '/dashboard/biens',
    bien: (id: number) => `/dashboard/biens/${id}`,
    nouveauBien: '/dashboard/biens/nouveau',

    annonces: '/dashboard/annonces',
    annonce: (id: number) => `/dashboard/annonces/${id}`,
    nouvelleAnnonce: '/dashboard/annonces/nouvelle',

    contrats: '/dashboard/contrats',
    contrat: (id: number) => `/dashboard/contrats/${id}`,
    nouveauContrat: '/dashboard/contrats/nouveau',

    factures: '/dashboard/factures',
    facture: (id: number) => `/dashboard/factures/${id}`,
    nouvelleFacture: '/dashboard/factures/nouvelle',

    prospects: '/dashboard/prospects',
    prospect: (id: number) => `/dashboard/prospects/${id}`,
    nouveauProspect: '/dashboard/prospects/nouveau',

    employes: '/dashboard/employes',
    employe: (id: number) => `/dashboard/employes/${id}`,
    nouvelEmploye: '/dashboard/employes/nouveau',

    statistiques: '/dashboard/statistiques',
  },
} as const;
