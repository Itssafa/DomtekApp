# Feature Details — Frontend

---

## Public Pages

| Page                    | Route                  | Description                          |
|-------------------------|------------------------|--------------------------------------|
| Listings list           | `/annonces`            | Browse all published listings        |
| Listing detail          | `/annonces/[id]`       | View single listing                  |
| Agencies list           | `/agences`             | Browse all active agencies           |
| Agency profile          | `/agences/[slug]`      | Agency info + their listings         |

---

## Auth Pages

| Page        | Route            | Description                         |
|-------------|------------------|-------------------------------------|
| Login       | `/auth/login`    | Role-based login → redirect by role |
| Register    | `/auth/register` | Register as client or organization  |

---

## Admin Pages (Back Office)

| Page                    | Route                                     | Description                  |
|-------------------------|-------------------------------------------|------------------------------|
| Organisations list      | `/admin/organisations`                    | All orgs with status         |
| Org detail              | `/admin/organisations/[id]`               | View and manage org          |
| Org listings            | `/admin/organisations/[id]/annonces`      | Org's listings               |
| Org investment          | `/admin/organisations/[id]/investissement`| Investment rates             |
| Org accounts            | `/admin/organisations/[id]/comptes`       | Account overview             |

---

## Organization Portal Pages

| Page              | Route                         | Description                         |
|-------------------|-------------------------------|-------------------------------------|
| Properties        | `/[org]/proprietes`           | List and manage properties          |
| Listings          | `/[org]/annonces`             | Create, schedule, publish listings  |
| Contracts         | `/[org]/contrats`             | Sale and rental contracts           |
| Clients CRM       | `/[org]/clients`              | Client list and details             |
| Client bills      | `/[org]/clients/[id]/factures`| Utility bills for a client          |
| Employees CRM     | `/[org]/employes`             | Employee management                 |

---

## Key Components

| Component              | Location                          | Purpose                          |
|------------------------|-----------------------------------|----------------------------------|
| `<DataTable />`        | `components/ui/DataTable.tsx`     | Reusable paginated table         |
| `<StatusBadge />`      | `components/ui/StatusBadge.tsx`   | Active / inactive / pending badge|
| `<OrgSidebar />`       | `components/layout/OrgSidebar.tsx`| Org portal navigation            |
| `<AdminSidebar />`     | `components/layout/AdminSidebar.tsx`| Admin navigation               |
| `<ListingCard />`      | `components/listings/ListingCard.tsx`| Public listing card           |
| `<ScheduleModal />`    | `components/listings/ScheduleModal.tsx`| Schedule publication date  |
| `<BillForm />`         | `components/bills/BillForm.tsx`   | Add utility bill form            |

---

## Listing Scheduling Feature

The `ScheduleModal` component allows an org to pick a future date for automatic publication:

```tsx
// components/listings/ScheduleModal.tsx
<DatePicker
  minDate={new Date()}
  onChange={(date) => scheduleListing(listing.id, date)}
/>
```
