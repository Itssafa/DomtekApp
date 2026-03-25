# Debugging Results — Laravel Backend

## Tools

| Tool               | Purpose                              | Install                         |
|--------------------|--------------------------------------|---------------------------------|
| Laravel Telescope  | Request / query / log inspector      | `composer require laravel/telescope` |
| Laravel Debugbar   | In-browser query and timing panel    | dev only                        |
| Storage logs       | `/storage/logs/laravel.log`          | built-in                        |
| `dd()` / `dump()`  | Quick inline inspection              | built-in                        |

---

## Common Issues and Fixes

### 1. 401 on protected route
**Cause:** Missing `Authorization: Bearer {token}` header or expired token.
**Fix:** Ensure Sanctum token is sent. Check `SANCTUM_STATEFUL_DOMAINS` in `.env`.

---

### 2. 403 for organization user
**Cause:** `org.active` middleware blocking — org is still `pending`.
**Fix:** Admin must activate the organization first via `PATCH /api/v1/admin/organisations/{id}/activate`.

---

### 3. Mass assignment exception
**Cause:** Field not in `$fillable` on the model.
**Fix:** Add the field to the model's `$fillable` array.

---

### 4. N+1 query problem
**Symptom:** Slow API, hundreds of queries visible in Telescope.
**Fix:** Eager load relationships:
```php
// Bad
Listing::all(); // then $listing->property in loop

// Good
Listing::with('property', 'organisation')->paginate(20);
```

---

### 5. Migration foreign key error
**Cause:** Referenced table doesn't exist yet (wrong migration order).
**Fix:** Rename migration file to run after the referenced table migration, or use `Schema::disableForeignKeyConstraints()` temporarily.

---

### 6. `.env` changes not reflected
**Fix:** Run `php artisan config:clear` after changing `.env`.

---

## Log Levels to Use

```php
Log::info('Listing created', ['id' => $listing->id]);
Log::warning('Org activation attempted on already active org', ['org_id' => $id]);
Log::error('Payment processing failed', ['error' => $e->getMessage()]);
```

---

## Telescope Usage

Access at `/telescope` (local only).
Key panels to check:
- **Requests** — see all incoming API calls and their response codes
- **Queries** — detect slow or repeated queries
- **Exceptions** — full stack traces for unhandled errors
