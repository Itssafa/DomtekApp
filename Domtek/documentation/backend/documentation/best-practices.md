# Best Practices — Laravel Backend

---

## 1. Required Columns on Every Table

Every migration must include these four columns:

```php
$table->unsignedBigInteger('created_by')->nullable();
$table->unsignedBigInteger('updated_by')->nullable();
$table->timestamps(); // created_at + updated_at
```

Auto-fill via model observer or base model trait:

```php
trait HasAuditColumns
{
    protected static function bootHasAuditColumns(): void
    {
        static::creating(fn ($m) => $m->created_by = auth()->id());
        static::updating(fn ($m) => $m->updated_by = auth()->id());
    }
}
```

---

## 2. Keep Controllers Thin

Controllers should only: validate → call service → return response.
No business logic in controllers.

---

## 3. Use Form Requests for Validation

Never validate in controllers directly. Always use `FormRequest` classes.

---

## 4. Scope Queries by Organization

Organization users must never access other orgs' data.
Use global scopes or always filter by `organisation_id`:

```php
// In service, always scope to authenticated org
Listing::where('organisation_id', auth()->user()->organisation_id)->get();
```

---

## 5. Use API Resources for Responses

Never return raw Eloquent models. Use `JsonResource` to control output:

```php
return ListingResource::collection($listings);
```

---

## 6. Environment Variables

- Never hardcode credentials
- Use `.env` for all secrets
- Validate `.env` keys in `config/` files, not directly with `env()`

---

## 7. Consistent HTTP Status Codes

| Situation           | Code |
|---------------------|------|
| Success (read)      | 200  |
| Created             | 201  |
| No content (delete) | 204  |
| Validation error    | 422  |
| Unauthorized        | 401  |
| Forbidden           | 403  |
| Not found           | 404  |
| Server error        | 500  |

---

## 8. Soft Deletes

Use `SoftDeletes` on all main models (organizations, properties, listings, clients).
This preserves audit history.

---

## 9. Pagination

Always paginate list endpoints. Never return unbounded collections.

```php
Listing::paginate(20);
```
