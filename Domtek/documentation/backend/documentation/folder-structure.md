# Folder Structure — Laravel Backend

```
backend/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Admin/
│   │   │   │   └── OrganisationController.php
│   │   │   ├── Auth/
│   │   │   │   └── AuthController.php
│   │   │   ├── Org/
│   │   │   │   ├── PropertyController.php
│   │   │   │   ├── ListingController.php
│   │   │   │   ├── ContractController.php
│   │   │   │   ├── ClientController.php
│   │   │   │   ├── EmployeeController.php
│   │   │   │   └── UtilityBillController.php
│   │   │   └── Public/
│   │   │       ├── AnnonceController.php
│   │   │       └── AgenceController.php
│   │   ├── Middleware/
│   │   │   ├── RoleMiddleware.php
│   │   │   ├── OrgActiveMiddleware.php
│   │   │   └── OrgOwnerMiddleware.php
│   │   └── Requests/
│   │       ├── Auth/
│   │       ├── Admin/
│   │       └── Org/
│   ├── Models/
│   │   ├── User.php
│   │   ├── Organisation.php
│   │   ├── Property.php
│   │   ├── Listing.php
│   │   ├── Contract.php
│   │   ├── Client.php
│   │   ├── Employee.php
│   │   └── UtilityBill.php
│   ├── Services/
│   │   ├── AuthService.php
│   │   ├── OrganisationService.php
│   │   ├── ListingService.php
│   │   ├── ContractService.php
│   │   └── UtilityBillService.php
│   ├── Resources/                  # API response transformers
│   │   ├── OrganisationResource.php
│   │   ├── ListingResource.php
│   │   └── ...
│   └── Policies/                   # Authorization policies
│       ├── ListingPolicy.php
│       └── PropertyPolicy.php
│
├── database/
│   ├── migrations/
│   └── seeders/
│
├── routes/
│   ├── api.php                     # All API routes
│   └── web.php                     # Minimal (health check only)
│
├── tests/
│   ├── Feature/
│   │   ├── Auth/
│   │   ├── Admin/
│   │   └── Org/
│   └── Unit/
│       └── Services/
│
└── .env.example
```

---

## Naming Conventions

| Type           | Convention         | Example                      |
|----------------|--------------------|------------------------------|
| Controller     | PascalCase + suffix| `ListingController`          |
| Service        | PascalCase + suffix| `ListingService`             |
| Model          | PascalCase singular| `Property`                   |
| Migration      | snake_case + date  | `2024_01_01_create_users_table` |
| Route names    | dot notation       | `org.listings.store`         |
| Request class  | Action + Model + Request | `StoreListingRequest` |
