# Authentication Flow

---

## Login and Role-Based Routing

```mermaid
flowchart TD
    LOGIN[User submits login form] --> API["POST /api/auth/login"]
    API --> VERIFY{Credentials valid?}
    VERIFY -->|No| ERROR[Return 401 Unauthorized]
    VERIFY -->|Yes| ROLE{Check user role}

    ROLE -->|admin| ADMIN_TOKEN[Issue admin token]
    ROLE -->|organization| ORG_CHECK{Organization active?}
    ROLE -->|client| CLIENT_TOKEN[Issue client token]

    ORG_CHECK -->|Yes| ORG_TOKEN[Issue org token]
    ORG_CHECK -->|No| BLOCKED[Return 403 - Pending activation]

    ADMIN_TOKEN --> ADMIN_REDIRECT["Redirect to /admin"]
    ORG_TOKEN --> ORG_REDIRECT["Redirect to /org-name/dashboard"]
    CLIENT_TOKEN --> CLIENT_REDIRECT["Redirect to /annonces"]
```

---

## Token Structure (JWT Payload)

```mermaid
graph LR
    TOKEN[JWT Token] --> SUB[sub: user_id]
    TOKEN --> ROLE[role: admin / organization / client]
    TOKEN --> ORG[org_slug: organization_name]
    TOKEN --> EXP[exp: expiry timestamp]
```

---

## Organization Registration and Activation

```mermaid
sequenceDiagram
    participant Org as Organization
    participant API as Laravel API
    participant DB as MySQL
    participant Admin as Admin

    Org->>API: POST /api/auth/register
    API->>DB: Create user with role=organization, status=pending
    API-->>Org: 201 Created - Awaiting activation

    Admin->>API: PATCH /api/admin/organisations/{id}/activate
    API->>DB: Update status=active
    API-->>Admin: 200 OK

    Org->>API: POST /api/auth/login
    API->>DB: Check status
    DB-->>API: status=active
    API-->>Org: 200 OK + JWT token
```

---

## Route Protection Rules

| Route Pattern               | Allowed Roles          |
|-----------------------------|------------------------|
| `/admin/*`                  | admin only             |
| `/{org_name}/*`             | organization (own org) |
| `/api/admin/*`              | admin only             |
| `/api/org/*`                | organization (active)  |
| `/api/public/*`             | everyone               |
| `/annonces`, `/agences`     | everyone               |
