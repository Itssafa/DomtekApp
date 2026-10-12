# Folder Structure — Database (Laravel Migrations)

```
database/
├── migrations/
│   ├── 0001_01_01_000000_create_users_table.php
│   ├── 0001_01_01_000001_create_organisations_table.php
│   ├── 0001_01_01_000002_add_organisation_id_to_users_table.php
│   ├── 0001_01_01_000003_create_properties_table.php
│   ├── 0001_01_01_000004_create_listings_table.php
│   ├── 0001_01_01_000005_create_contracts_table.php
│   ├── 0001_01_01_000006_create_clients_table.php
│   ├── 0001_01_01_000007_create_employees_table.php
│   └── 0001_01_01_000008_create_utility_bills_table.php
│
└── seeders/
    ├── DatabaseSeeder.php              # Orchestrates all seeders
    ├── AdminSeeder.php                 # Seed admin user
    ├── OrganisationSeeder.php          # Sample agencies
    ├── PropertySeeder.php              # Sample properties
    ├── ListingSeeder.php               # Sample listings
    ├── ClientSeeder.php                # Sample clients
    └── UtilityBillSeeder.php           # Sample bills
```

---

## Migration Run Order

Migrations must run in dependency order:
1. `users` (no FK deps)
2. `organisations` (no FK deps)
3. Add `organisation_id` to `users`
4. `properties` (needs `organisations`)
5. `clients` (needs `organisations`)
6. `employees` (needs `organisations`, `users`)
7. `listings` (needs `properties`, `organisations`)
8. `contracts` (needs `properties`, `clients`, `organisations`)
9. `utility_bills` (needs `clients`, `organisations`)

---

## Migration Template

```php
Schema::create('listings', function (Blueprint $table) {
    $table->id();
    $table->foreignId('organisation_id')->constrained()->cascadeOnDelete();
    $table->foreignId('property_id')->constrained()->cascadeOnDelete();
    $table->enum('type', ['sale', 'rental']);
    $table->decimal('price', 12, 2);
    $table->text('description');
    $table->enum('status', ['draft', 'scheduled', 'published'])->default('draft');
    $table->timestamp('scheduled_at')->nullable();
    $table->timestamp('published_at')->nullable();
    $table->softDeletes();

    // Required 4 columns — always last
    $table->unsignedBigInteger('created_by')->nullable();
    $table->unsignedBigInteger('updated_by')->nullable();
    $table->timestamps();
});
```
