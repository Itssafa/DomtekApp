# Feature Details — Database Tables

## users

| Column          | Type             | Notes                               |
|-----------------|------------------|-------------------------------------|
| id              | BIGINT PK        |                                     |
| name            | VARCHAR(255)     |                                     |
| email           | VARCHAR(255)     | unique                              |
| password        | VARCHAR(255)     | hashed                              |
| role            | ENUM             | admin, organization, client         |
| organisation_id | BIGINT FK        | nullable — null for admin/client    |
| created_by      | BIGINT           |                                     |
| created_at      | TIMESTAMP        |                                     |
| updated_by      | BIGINT           |                                     |
| updated_at      | TIMESTAMP        |                                     |

---

## organisations

| Column       | Type         | Notes                              |
|--------------|--------------|------------------------------------|
| id           | BIGINT PK    |                                    |
| name         | VARCHAR(255) |                                    |
| slug         | VARCHAR(255) | unique — used in URL routing       |
| status       | ENUM         | pending, active, inactive          |
| deleted_at   | TIMESTAMP    | soft delete                        |
| created_by   | BIGINT       |                                    |
| created_at   | TIMESTAMP    |                                    |
| updated_by   | BIGINT       |                                    |
| updated_at   | TIMESTAMP    |                                    |

---

## properties

| Column          | Type         | Notes                |
|-----------------|--------------|----------------------|
| id              | BIGINT PK    |                      |
| organisation_id | BIGINT FK    |                      |
| title           | VARCHAR(255) |                      |
| type            | ENUM         | sale, rental         |
| address         | TEXT         |                      |
| area_m2         | DECIMAL      |                      |
| deleted_at      | TIMESTAMP    | soft delete          |
| created_by ... updated_at | — | required 4 columns |

---

## listings

| Column          | Type         | Notes                              |
|-----------------|--------------|------------------------------------|
| id              | BIGINT PK    |                                    |
| organisation_id | BIGINT FK    |                                    |
| property_id     | BIGINT FK    |                                    |
| type            | ENUM         | sale, rental                       |
| price           | DECIMAL      |                                    |
| description     | TEXT         |                                    |
| status          | ENUM         | draft, scheduled, published        |
| scheduled_at    | TIMESTAMP    | nullable — future publication date |
| published_at    | TIMESTAMP    | nullable                           |
| deleted_at      | TIMESTAMP    | soft delete                        |
| created_by ... updated_at | — | required 4 columns        |

---

## contracts

| Column          | Type         | Notes                |
|-----------------|--------------|----------------------|
| id              | BIGINT PK    |                      |
| organisation_id | BIGINT FK    |                      |
| property_id     | BIGINT FK    |                      |
| client_id       | BIGINT FK    |                      |
| type            | ENUM         | sale, rental         |
| start_date      | DATE         |                      |
| end_date        | DATE         | nullable             |
| amount          | DECIMAL      |                      |
| created_by ... updated_at | — | required 4 columns |

---

## clients

| Column          | Type         | Notes                |
|-----------------|--------------|----------------------|
| id              | BIGINT PK    |                      |
| organisation_id | BIGINT FK    |                      |
| user_id         | BIGINT FK    | nullable             |
| name            | VARCHAR(255) |                      |
| email           | VARCHAR(255) |                      |
| phone           | VARCHAR(50)  |                      |
| deleted_at      | TIMESTAMP    | soft delete          |
| created_by ... updated_at | — | required 4 columns |

---

## utility_bills

| Column          | Type         | Notes                       |
|-----------------|--------------|-----------------------------|
| id              | BIGINT PK    |                             |
| organisation_id | BIGINT FK    |                             |
| client_id       | BIGINT FK    |                             |
| type            | ENUM         | water, electricity, gas     |
| amount          | DECIMAL      |                             |
| period          | DATE         | billing month               |
| created_by ... updated_at | — | required 4 columns   |

---

## employees

| Column          | Type         | Notes                |
|-----------------|--------------|----------------------|
| id              | BIGINT PK    |                      |
| organisation_id | BIGINT FK    |                      |
| user_id         | BIGINT FK    | nullable             |
| name            | VARCHAR(255) |                      |
| role            | VARCHAR(100) | job title            |
| created_by ... updated_at | — | required 4 columns |

