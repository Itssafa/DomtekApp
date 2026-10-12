# System Overview — Domtek Real Estate Platform

## Stack

| Layer    | Technology          |
|----------|---------------------|
| Frontend | Next.js (App Router)|
| Backend  | Laravel (PHP)       |
| Database | MySQL               |

---

## Architecture

```mermaid
graph TB
    subgraph Client["Browser"]
        B[User]
    end

    subgraph FE["Frontend - Next.js"]
        PUB[Public Pages]
        ORG_PORTAL[Organization Portal]
        ADMIN_PANEL[Back Office]
    end

    subgraph BE["Backend - Laravel REST API"]
        AUTH[Auth Middleware]
        ADMIN_API[Admin API]
        ORG_API[Organization API]
        PUB_API[Public API]
    end

    subgraph DB["MySQL"]
        USERS[(users)]
        ORGS[(organizations)]
        PROPS[(properties)]
        LISTINGS[(listings)]
        CLIENTS[(clients)]
        CONTRACTS[(contracts)]
        BILLS[(utility_bills)]
        EMPLOYEES[(employees)]
    end

    B --> FE
    FE -->|HTTPS / JSON| BE
    BE --> DB

    AUTH --> USERS
    ADMIN_API --> ORGS
    ADMIN_API --> PROPS
    ADMIN_API --> LISTINGS
    ORG_API --> PROPS
    ORG_API --> LISTINGS
    ORG_API --> CLIENTS
    ORG_API --> CONTRACTS
    ORG_API --> BILLS
    ORG_API --> EMPLOYEES
    PUB_API --> LISTINGS
    PUB_API --> ORGS
```

---

## User Roles

```mermaid
graph LR
    Login[Login] --> Role{Role}

    Role -->|admin| ADMIN[Back Office Admin]
    Role -->|organization| ORG[Organization Portal]
    Role -->|client| CLIENT[Client View]

    ADMIN --> A1[Manage organizations - activate / deactivate / delete]
    ADMIN --> A2[View properties and listings per org]

    ORG --> O1[Manage properties - sale and rental]
    ORG --> O2[Manage listings - schedule publication]
    ORG --> O3[Manage contracts - sale and rental]
    ORG --> O4[Manage employees - CRM]
    ORG --> O5[Manage clients - CRM]
    ORG --> O6[Manage utility bills - water electricity gas]

    CLIENT --> C1[Browse listings]
    CLIENT --> C2[View agencies]
```

---

## URL Routing

```mermaid
graph TD
    ROOT["domtek /"]
    ROOT --> PUB1["/annonces - Public listings"]
    ROOT --> PUB2["/agences - Agency directory"]
    ROOT --> AUTH_R["/auth - Login and Register"]
    ROOT --> ADMIN_R["/admin - Back office"]
    ROOT --> ORG_R["/organization-name - Org portal"]

    ADMIN_R --> AD1["/admin/organisations"]
    ADMIN_R --> AD2["/admin/org/annonces"]
    ADMIN_R --> AD4["/admin/org/comptes"]

    ORG_R --> OR1["/org/proprietes"]
    ORG_R --> OR2["/org/annonces"]
    ORG_R --> OR3["/org/contrats"]
    ORG_R --> OR4["/org/clients"]
    ORG_R --> OR5["/org/employes"]
    ORG_R --> OR6["/org/factures"]
```

---

## Organization Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Registered : Organization signs up
    Registered --> PendingActivation : Account created
    PendingActivation --> Active : Admin activates
    PendingActivation --> Rejected : Admin deletes
    Active --> Inactive : Admin deactivates
    Inactive --> Active : Admin reactivates
    Active --> Deleted : Admin deletes
    Inactive --> Deleted : Admin deletes
```
