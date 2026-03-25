# Testing — Laravel Backend

## Tools

| Tool          | Purpose                          |
|---------------|----------------------------------|
| PHPUnit       | Test runner (built into Laravel) |
| Factories     | Generate fake model data         |
| RefreshDatabase | Reset DB between tests         |
| `actingAs()`  | Authenticate user in tests       |

---

## Test Structure

```
tests/
├── Feature/
│   ├── Auth/
│   │   ├── LoginTest.php
│   │   └── RegisterTest.php
│   ├── Admin/
│   │   └── OrganisationManagementTest.php
│   └── Org/
│       ├── ListingTest.php
│       ├── PropertyTest.php
│       ├── ClientTest.php
│       └── UtilityBillTest.php
└── Unit/
    └── Services/
        └── ListingServiceTest.php
```

---

## Feature Test Template

```php
class ListingTest extends TestCase
{
    use RefreshDatabase;

    public function test_org_can_create_listing(): void
    {
        $org = Organisation::factory()->active()->create();
        $user = User::factory()->for($org)->orgRole()->create();
        $property = Property::factory()->for($org)->create();

        $this->actingAs($user)
            ->postJson('/api/v1/org/listings', [
                'property_id'  => $property->id,
                'type'         => 'sale',
                'price'        => 150000,
                'description'  => 'Modern 3-bedroom apartment',
            ])
            ->assertCreated()
            ->assertJsonPath('data.type', 'sale');
    }

    public function test_inactive_org_cannot_create_listing(): void
    {
        $org = Organisation::factory()->pending()->create();
        $user = User::factory()->for($org)->orgRole()->create();

        $this->actingAs($user)
            ->postJson('/api/v1/org/listings', [...])
            ->assertForbidden();
    }
}
```

---

## Run Tests

```bash
php artisan test
php artisan test --filter ListingTest
php artisan test --coverage
```

---

## Factories — Required Column Convention

All factories must fill audit columns:

```php
public function definition(): array
{
    return [
        // model fields...
        'created_by' => 1,
        'updated_by' => 1,
    ];
}
```
