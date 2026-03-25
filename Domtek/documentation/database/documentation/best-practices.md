# Best Practices — Database (MySQL)

---

## 1. Required 4 Columns on Every Table

Non-negotiable. Always add at the bottom of every `Schema::create()`:

```php
$table->unsignedBigInteger('created_by')->nullable();
$table->unsignedBigInteger('updated_by')->nullable();
$table->timestamps(); // created_at + updated_at
```

---

## 2. Use `softDeletes()` on Main Tables

For organisations, properties, listings, clients — never hard delete. Use:

```php
$table->softDeletes(); // adds deleted_at column
```

In the model: `use SoftDeletes;`

---

## 3. Always Add `organisation_id` to Resource Tables

Every table that belongs to an organization must have:

```php
$table->foreignId('organisation_id')->constrained()->cascadeOnDelete();
```

This enforces data isolation at the DB level.

---

## 4. Index Frequently Queried Columns

```php
$table->index('organisation_id');
$table->index('status');
$table->index('scheduled_at');
$table->index(['organisation_id', 'status']); // composite index
```

---

## 5. Use ENUMs for Fixed Sets

Use `enum` for columns with a fixed set of values:

```php
$table->enum('status', ['pending', 'active', 'inactive']);
$table->enum('type', ['sale', 'rental']);
$table->enum('bill_type', ['water', 'electricity', 'gas']);
```

---

## 6. Naming Conventions

| Item              | Convention              | Example                 |
|-------------------|-------------------------|-------------------------|
| Tables            | snake_case plural       | `utility_bills`         |
| FK columns        | `{table_singular}_id`   | `organisation_id`       |
| Boolean columns   | `is_` prefix            | `is_featured`           |
| Date-only columns | `_date` suffix          | `start_date`            |
| Timestamp columns | `_at` suffix            | `published_at`          |
| Enum columns      | no suffix, clear name   | `status`, `type`        |

---

## 7. Never Store Derived Data

Don't store values that can be calculated from other columns. Calculate in the application layer or with DB views.

---

## 8. Migrate, Don't Alter Manually

Never modify the database directly in production. Always write a new migration for schema changes.

---

## 9. Use `constrained()` for Foreign Keys

```php
// Bad
$table->unsignedBigInteger('organisation_id');

// Good
$table->foreignId('organisation_id')->constrained()->cascadeOnDelete();
```
