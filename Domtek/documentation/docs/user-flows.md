# User Flows

---

## Admin — Back Office Flow

```mermaid
flowchart TD
    A[Admin logs in] --> B[Dashboard]
    B --> C{Action}

    C --> D[View organization list]
    D --> D1[Activate organization]
    D --> D2[Deactivate organization]
    D --> D3[Delete organization]

    C --> E[Select organization]
    E --> E1[View annonces]
    E --> E2[View investissement rates]
    E --> E3[View comptes / accounts]
    E --> E4[View properties for sale or rent]
```

---

## Organization — Onboarding Flow

```mermaid
flowchart TD
    S[Agency visits site] --> R[Register account]
    R --> W[Waits for admin activation]
    W --> N{Activation decision}
    N -->|Activated| ACCESS[Access all features]
    N -->|Rejected/Deleted| REMOVED[Account removed]

    ACCESS --> P[Manage properties]
    ACCESS --> L[Manage listings]
    ACCESS --> C[Manage clients CRM]
    ACCESS --> E[Manage employees CRM]
    ACCESS --> CT[Manage contracts]
    ACCESS --> B[Manage utility bills]
```

---

## Organization — Listing Publication Flow

```mermaid
flowchart TD
    ORG[Organization user] --> ADD[Add property]
    ADD --> DETAILS[Fill property details]
    DETAILS --> TYPE{Sale or Rental}
    TYPE -->|Sale| SALE[Set sale price]
    TYPE -->|Rental| RENT[Set rental terms]
    SALE --> CREATE[Create listing]
    RENT --> CREATE
    CREATE --> SCHEDULE[Schedule publication date]
    SCHEDULE --> PUBLISHED[Listing goes live]
    PUBLISHED --> PUBLIC[Visible to clients]
```

---

## Client — Browsing Flow

```mermaid
flowchart TD
    V[Visitor] --> BROWSE["Browse /annonces"]
    BROWSE --> FILTER["Filter by type / location / price"]
    FILTER --> VIEW[View listing detail]
    VIEW --> AGENCY[View publishing agency]
    VIEW --> CONTACT[Contact agency]

    V --> REGISTER[Register as client]
    REGISTER --> LOGIN[Login]
    LOGIN --> SAVED[Save favorite listings]
```

---

## Utility Bill Management Flow

```mermaid
flowchart TD
    ORG[Organization] --> SELECT[Select client]
    SELECT --> ADD[Add utility bill]
    ADD --> TYPE{Bill type}
    TYPE --> WATER[Water]
    TYPE --> ELEC[Electricity]
    TYPE --> GAS[Gas]
    WATER --> AMOUNT[Enter amount and period]
    ELEC --> AMOUNT
    GAS --> AMOUNT
    AMOUNT --> SAVE[Save bill]
    SAVE --> HISTORY[Visible in client billing history]
```
