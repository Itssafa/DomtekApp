# Frontend Architecture — Next.js

## Router: App Router (Next.js 14+)

Uses the `app/` directory with layouts, nested routes, and server components.

---

## Route Groups

```mermaid
graph TB
    ROOT["app/ — Root layout"]

    ROOT --> PUBLIC["(public) — No auth required"]
    ROOT --> AUTH_G["(auth) — Login and register"]
    ROOT --> ADMIN_G["(admin) — Admin only"]
    ROOT --> ORG_G["(org) — Organization only"]

    PUBLIC --> ANN["/annonces"]
    PUBLIC --> AGE["/agences"]

    AUTH_G --> LOGIN["/auth/login"]
    AUTH_G --> REG["/auth/register"]

    ADMIN_G --> ADM["/admin/organisations"]
    ADMIN_G --> ADM2["/admin/organisations/id"]

    ORG_G --> ORG_SLUG["[org_slug]/layout.tsx"]
    ORG_SLUG --> P1["/proprietes"]
    ORG_SLUG --> P2["/annonces"]
    ORG_SLUG --> P3["/clients"]
    ORG_SLUG --> P4["/contrats"]
    ORG_SLUG --> P5["/employes"]
    ORG_SLUG --> P6["/factures"]
```

---

## Component Hierarchy

```mermaid
graph TB
    ROOT[RootLayout]

    ROOT --> PL[PublicLayout - navbar and footer]
    ROOT --> AL[AuthLayout]
    ROOT --> ADL[AdminLayout - sidebar]
    ROOT --> OL[OrgLayout - sidebar]

    PL --> LP[ListingsPage]
    PL --> AP[AgencyProfilePage]

    AL --> LGP[LoginPage]
    AL --> RP[RegisterPage]

    ADL --> AOS[OrganisationsPage]
    ADL --> AOD[OrgDetailPage]

    OL --> PP[PropertiesPage]
    OL --> LSP[ListingsPage]
    OL --> CP[ClientsPage]
    OL --> EP[EmployeesPage]
    OL --> CTP[ContractsPage]
    OL --> BP[BillsPage]
```

---

## Data Fetching Strategy

| Context                   | Method                                |
|---------------------------|---------------------------------------|
| Public pages (SEO needed) | Server Components + fetch             |
| Dashboard / org pages     | Client Components + React Query       |
| Forms / mutations         | Client Components + API calls         |

```mermaid
flowchart LR
    SC["Server Component"] -->|"fetch on server"| API["Laravel API"]
    CC["Client Component"] -->|"React Query hook"| API
    API -->|"JSON response"| SC
    API -->|"JSON response"| QC["Query Cache"]
    QC --> CC
    CC -->|"useState"| LS["Local UI State"]
    CC -->|"mutation + invalidate"| API
```

---

## State Management

- **Server state:** React Query (`@tanstack/react-query`) for API data
- **UI state:** `useState` / `useReducer` — local component state
- **Auth state:** Next-Auth session or custom context with token

---

## API Communication

All API calls go through a centralized client:

```ts
// lib/api.ts
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL + '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

// Attach token on every request
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```
