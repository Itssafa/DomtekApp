# Database Architecture — MySQL

## Core Rule: Every Table Must Have These 4 Columns

```sql
created_by  BIGINT UNSIGNED NULL
created_at  TIMESTAMP NULL
updated_by  BIGINT UNSIGNED NULL
updated_at  TIMESTAMP NULL
```

No exceptions. This is enforced at the migration level.

---

## Entity Relationship Diagram

```mermaid
erDiagram
    users {
        bigint id PK
        string name
        string email
        string role
        bigint organisation_id FK
    }
    organisations {
        bigint id PK
        string name
        string slug
        string status
    }
    properties {
        bigint id PK
        bigint organisation_id FK
        string title
        string type
        decimal area_m2
    }
    listings {
        bigint id PK
        bigint organisation_id FK
        bigint property_id FK
        string type
        decimal price
        string status
        timestamp scheduled_at
    }
    clients {
        bigint id PK
        bigint organisation_id FK
        string name
        string email
        string phone
    }
    contracts {
        bigint id PK
        bigint organisation_id FK
        bigint property_id FK
        bigint client_id FK
        string type
        decimal amount
        date start_date
    }
    utility_bills {
        bigint id PK
        bigint organisation_id FK
        bigint client_id FK
        string type
        decimal amount
        date period
    }
    employees {
        bigint id PK
        bigint organisation_id FK
        string name
        string role
    }

    organisations ||--o{ users : "has members"
    organisations ||--o{ properties : "owns"
    organisations ||--o{ clients : "manages"
    organisations ||--o{ employees : "employs"
    properties ||--o{ listings : "listed as"
    properties ||--o{ contracts : "covered by"
    clients ||--o{ contracts : "signs"
    clients ||--o{ utility_bills : "receives"
```

---

## Key Design Decisions

- **Soft deletes** on `organisations`, `properties`, `listings`, `clients` — preserve audit trail
- **`organisation_id` on all resource tables** — ensures strict data isolation between agencies
- **`status` on `organisations`** — `pending`, `active`, `inactive` (not boolean)
- **`type` on `properties` and `listings`** — `sale` or `rental` enum
- **`type` on `utility_bills`** — `water`, `electricity`, `gas` enum
- **`scheduled_at` on `listings`** — allows future publication date
