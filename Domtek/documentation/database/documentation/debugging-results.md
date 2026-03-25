# Debugging Results — Database

## Tools

| Tool                     | Purpose                                    |
|--------------------------|--------------------------------------------|
| Laravel Telescope        | Query inspector — shows SQL + execution time|
| MySQL EXPLAIN            | Analyze query execution plan               |
| `DB::listen()`           | Log all queries in dev                     |
| `php artisan tinker`     | Interactive DB query testing               |

---

## Enable Query Logging (Dev Only)

```php
// AppServiceProvider.php — boot()
if (app()->isLocal()) {
    DB::listen(fn ($query) => logger($query->sql, $query->bindings));
}
```

---

## Common Issues and Fixes

### 1. Foreign key constraint violation
**Symptom:** `SQLSTATE[23000]: Integrity constraint violation`
**Fix:** Ensure the referenced record exists before inserting. Check cascade rules.

---

### 2. Migration fails — table already exists
**Fix:** Never run `migrate` after manually creating tables. Use `migrate:fresh` on dev to reset.

```bash
php artisan migrate:fresh --seed
```

---

### 3. Soft-deleted records appearing in queries
**Cause:** Model using `SoftDeletes` but querying without Eloquent (raw query or non-model).
**Fix:** Use Eloquent model, or add `WHERE deleted_at IS NULL` to raw queries.

---

### 4. Slow queries on large tables
**Diagnose with:**
```sql
EXPLAIN SELECT * FROM listings WHERE organisation_id = 5 AND status = 'published';
```
**Fix:** Add composite index:
```php
$table->index(['organisation_id', 'status']);
```

---

### 5. `created_by` / `updated_by` always null
**Cause:** Trait not applied to model, or user not authenticated during seeding.
**Fix:** Ensure `HasAuditColumns` trait is on the model. In seeders, use a hardcoded ID (e.g., `1` for the admin user).

---

### 6. Enum value rejected
**Symptom:** `SQLSTATE[HY000]: General error: 1265 Data truncated for column`
**Fix:** Value passed doesn't match the defined ENUM values. Check spelling and case — ENUMs are case-sensitive in MySQL.

---

## Useful Tinker Commands

```bash
php artisan tinker

# Check org status
App\Models\Organisation::find(3)->status;

# Count listings per org
App\Models\Listing::where('organisation_id', 1)->count();

# Check if soft-deleted
App\Models\Organisation::withTrashed()->find(5)->deleted_at;
```
