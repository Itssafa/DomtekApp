# Testing — Database

## Approach

Database testing is done through Laravel's migration + seeder system. Tests use an in-memory SQLite DB or a dedicated test MySQL DB.

---

## Setup

```php
// phpunit.xml
<php>
  <env name="DB_CONNECTION" value="sqlite"/>
  <env name="DB_DATABASE" value=":memory:"/>
</php>
```

Use `RefreshDatabase` trait in every test that touches the DB — it rolls back all changes after each test.

---

## Seeder Structure

```php
// DatabaseSeeder.php
public function run(): void
{
    $this->call([
        AdminSeeder::class,
        OrganisationSeeder::class,
        PropertySeeder::class,
        ListingSeeder::class,
        ClientSeeder::class,
        UtilityBillSeeder::class,
    ]);
}
```

Run seeders:

```bash
php artisan db:seed
php artisan migrate:fresh --seed   # reset + seed
```

---

## Factory Convention

Every model must have a factory. Factories must fill all required 4 columns:

```php
class ListingFactory extends Factory
{
    public function definition(): array
    {
        return [
            'organisation_id' => Organisation::factory(),
            'property_id'     => Property::factory(),
            'type'            => $this->faker->randomElement(['sale', 'rental']),
            'price'           => $this->faker->numberBetween(50000, 500000),
            'description'     => $this->faker->paragraph(),
            'status'          => 'draft',
            'scheduled_at'    => null,
            'created_by'      => 1,
            'updated_by'      => 1,
        ];
    }

    public function published(): static
    {
        return $this->state(['status' => 'published', 'published_at' => now()]);
    }
}
```

---

## Schema Verification Test

```php
public function test_listings_table_has_required_audit_columns(): void
{
    $columns = Schema::getColumnListing('listings');

    $this->assertContains('created_by', $columns);
    $this->assertContains('created_at', $columns);
    $this->assertContains('updated_by', $columns);
    $this->assertContains('updated_at', $columns);
}
```
