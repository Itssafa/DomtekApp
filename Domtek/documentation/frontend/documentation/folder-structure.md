# Folder Structure — Next.js Frontend

```
frontend/
├── app/
│   ├── (public)/
│   │   ├── annonces/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   └── agences/
│   │       ├── page.tsx
│   │       └── [slug]/
│   │           └── page.tsx
│   ├── (auth)/
│   │   └── auth/
│   │       ├── login/
│   │       │   └── page.tsx
│   │       └── register/
│   │           └── page.tsx
│   ├── (admin)/
│   │   └── admin/
│   │       ├── layout.tsx
│   │       └── organisations/
│   │           ├── page.tsx
│   │           └── [id]/
│   │               ├── page.tsx
│   │               ├── annonces/page.tsx
│   │               ├── investissement/page.tsx
│   │               └── comptes/page.tsx
│   ├── (org)/
│   │   └── [org_slug]/
│   │       ├── layout.tsx
│   │       ├── proprietes/page.tsx
│   │       ├── annonces/page.tsx
│   │       ├── contrats/page.tsx
│   │       ├── clients/
│   │       │   ├── page.tsx
│   │       │   └── [id]/
│   │       │       └── factures/page.tsx
│   │       └── employes/page.tsx
│   ├── layout.tsx
│   └── page.tsx                        # Landing / redirect
│
├── components/
│   ├── layout/
│   │   ├── OrgSidebar.tsx
│   │   ├── AdminSidebar.tsx
│   │   └── Navbar.tsx
│   ├── ui/                             # Generic reusable UI
│   │   ├── DataTable.tsx
│   │   ├── StatusBadge.tsx
│   │   ├── Modal.tsx
│   │   └── Button.tsx
│   ├── listings/
│   │   ├── ListingCard.tsx
│   │   └── ScheduleModal.tsx
│   ├── properties/
│   ├── clients/
│   ├── employees/
│   ├── contracts/
│   └── bills/
│
├── lib/
│   ├── api.ts                          # Axios instance + interceptors
│   ├── auth.ts                         # Token helpers
│   └── utils.ts                        # Shared utilities
│
├── hooks/
│   ├── useListings.ts
│   ├── useClients.ts
│   └── useOrganisation.ts
│
├── types/
│   ├── listing.ts
│   ├── property.ts
│   ├── client.ts
│   └── index.ts
│
├── constants/
│   └── routes.ts                       # Centralized route strings
│
└── .env.local.example
```

---

## Naming Conventions

| Type            | Convention         | Example                         |
|-----------------|--------------------|---------------------------------|
| Page component  | default export     | `export default function ListingsPage()` |
| Component file  | PascalCase         | `ListingCard.tsx`               |
| Hook file       | camelCase + prefix | `useListings.ts`                |
| Type file       | camelCase          | `listing.ts`                    |
| API function    | camelCase verb     | `fetchListings`, `createListing`|
