# Feature Details — Backend

---

## Auth Module

| Endpoint                        | Method | Access  | Description                      |
|---------------------------------|--------|---------|----------------------------------|
| `/api/v1/auth/login`            | POST   | public  | Login, returns token + role      |
| `/api/v1/auth/register`         | POST   | public  | Register as org or client        |
| `/api/v1/auth/logout`           | POST   | auth    | Revoke current token             |
| `/api/v1/auth/me`               | GET    | auth    | Return authenticated user info   |

---

## Admin Module

| Endpoint                                   | Method | Description                        |
|--------------------------------------------|--------|------------------------------------|
| `/api/v1/admin/organisations`              | GET    | List all organizations             |
| `/api/v1/admin/organisations/{id}`         | GET    | Get single organization            |
| `/api/v1/admin/organisations/{id}/activate`| PATCH  | Activate organization              |
| `/api/v1/admin/organisations/{id}/deactivate`| PATCH| Deactivate organization            |
| `/api/v1/admin/organisations/{id}`         | DELETE | Delete organization                |
| `/api/v1/admin/organisations/{id}/annonces`| GET    | View org listings                  |
| `/api/v1/admin/organisations/{id}/investissement`| GET | View org investment rates     |
| `/api/v1/admin/organisations/{id}/comptes` | GET    | View org accounts                  |

---

## Organization Module

| Endpoint                                   | Method      | Description                  |
|--------------------------------------------|-------------|------------------------------|
| `/api/v1/org/properties`                   | GET / POST  | List or create properties    |
| `/api/v1/org/properties/{id}`              | GET/PUT/DELETE | Manage single property    |
| `/api/v1/org/listings`                     | GET / POST  | List or create listings      |
| `/api/v1/org/listings/{id}/publish`        | PATCH       | Publish listing              |
| `/api/v1/org/listings/{id}/schedule`       | PATCH       | Schedule publication date    |
| `/api/v1/org/contracts`                    | GET / POST  | Sale and rental contracts    |
| `/api/v1/org/clients`                      | GET / POST  | Client CRM                   |
| `/api/v1/org/clients/{id}`                 | GET/PUT/DELETE | Manage client             |
| `/api/v1/org/clients/{id}/bills`           | GET / POST  | Utility bills for client     |
| `/api/v1/org/employees`                    | GET / POST  | Employee CRM                 |
| `/api/v1/org/employees/{id}`               | GET/PUT/DELETE | Manage employee           |

---

## Public Module

| Endpoint                          | Method | Description                      |
|-----------------------------------|--------|----------------------------------|
| `/api/v1/annonces`                | GET    | All published listings           |
| `/api/v1/annonces/{id}`           | GET    | Single listing detail            |
| `/api/v1/agences`                 | GET    | All active agencies              |
| `/api/v1/agences/{slug}`          | GET    | Agency profile + listings        |

---

## Form Request Validation (Example)

```php
// app/Http/Requests/StoreListingRequest.php
class StoreListingRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'property_id'      => 'required|exists:properties,id',
            'type'             => 'required|in:sale,rental',
            'price'            => 'required|numeric|min:0',
            'scheduled_at'     => 'nullable|date|after:now',
            'description'      => 'required|string|max:2000',
        ];
    }
}
```
