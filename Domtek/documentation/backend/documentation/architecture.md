# Backend Architecture — Laravel

## Pattern: MVC + Service Layer

```mermaid
flowchart LR
    REQ["HTTP Request"] --> ROUTE["routes/api.php"]
    ROUTE --> MW["Middleware Stack"]
    MW --> CTRL["Controller"]
    CTRL --> SVC["Service"]
    SVC --> MDL["Model"]
    MDL --> DB[("MySQL")]
    DB --> MDL
    MDL --> SVC
    SVC --> CTRL
    CTRL --> RS["API Resource"]
    RS --> JSON["JSON Response"]
```

---

## API Design

- **Base URL:** `/api/v1/`
- **Format:** JSON REST
- **Auth:** Laravel Sanctum (token-based)
- **Versioning:** URL-based (`/api/v1/`)

---

## Middleware Stack

| Middleware        | Purpose                                  |
|-------------------|------------------------------------------|
| `auth:sanctum`    | Validate token                           |
| `role:admin`      | Restrict to admin                        |
| `role:organization` | Restrict to organization users        |
| `org.active`      | Block pending/inactive orgs              |
| `org.owner`       | Ensure org user accesses only their data |

---

## Module Breakdown

| Module         | Description                                      |
|----------------|--------------------------------------------------|
| Auth           | Login, register, logout, token refresh           |
| Organizations  | Admin CRUD, activation, status management        |
| Properties     | Sale and rental property management per org      |
| Listings       | Create, schedule, publish listings               |
| Contracts      | Sale and rental contract management              |
| Clients        | Client CRM per organization                      |
| Employees      | Employee CRM per organization                    |
| UtilityBills   | Water, electricity, gas billing per client       |

```mermaid
graph TB
    subgraph API["Laravel API v1"]
        AUTH_M[Auth]
        ADMIN_M[Admin]
        ORG_M[Organization]
        PUB_M[Public]
    end

    AUTH_M --> UM[User Model]
    ADMIN_M --> OM[Organisation Model]

    ORG_M --> PM[Property Model]
    ORG_M --> LM[Listing Model]
    ORG_M --> CM[Client Model]
    ORG_M --> EM[Employee Model]
    ORG_M --> CTM[Contract Model]
    ORG_M --> BM[UtilityBill Model]

    PUB_M --> LM
    PUB_M --> OM
```

---

## Service Layer Convention

Each module has a dedicated Service class. Controllers stay thin.

```php
// Bad — logic in controller
public function store(Request $request) {
    $listing = Listing::create([...]);
    $listing->notify(...);
}

// Good — delegate to service
public function store(StoreListingRequest $request) {
    return $this->listingService->create($request->validated());
}
```

---

## Response Format

```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message",
  "meta": { "page": 1, "total": 42 }
}
```

Errors:
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": { "field": ["error message"] }
}
```
