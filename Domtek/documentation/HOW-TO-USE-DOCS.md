# How to Use This Documentation

This project follows a structured documentation system split across three layers. Here is how to navigate and use it effectively.

---

## Documentation Structure

```
dashboard/
├── HOW-TO-USE-DOCS.md          ← you are here
│
├── docs/                       ← start here for the big picture
│   ├── system-overview.md      architecture, roles, URL routing, org lifecycle (Mermaid)
│   ├── user-flows.md           step-by-step user journeys — admin, org, client (Mermaid)
│   └── auth-flow.md            login routing, token structure, route protection (Mermaid)
│
├── frontend/documentation/     ← open when working on Next.js
│   ├── architecture.md         (Mermaid diagrams)
│   ├── feature-details.md
│   ├── folder-structure.md
│   ├── best-practices.md
│   ├── testing.md
│   └── debugging-results.md
│
├── backend/documentation/      ← open when working on Laravel
│   ├── architecture.md         (Mermaid diagrams)
│   ├── feature-details.md
│   ├── folder-structure.md
│   ├── best-practices.md
│   ├── testing.md
│   └── debugging-results.md
│
└── database/documentation/     ← open when working on MySQL / migrations
    ├── architecture.md         (Mermaid ERD)
    ├── feature-details.md
    ├── folder-structure.md
    ├── best-practices.md
    ├── testing.md
    └── debugging-results.md
```

---

## Where to Start — By Situation

| Situation                                    | Read this first                              |
|----------------------------------------------|----------------------------------------------|
| First time on the project                    | `docs/system-overview.md`                    |
| Need to understand user journeys             | `docs/user-flows.md`                         |
| Implementing login / roles / guards          | `docs/auth-flow.md`                          |
| Adding a new API endpoint                    | `backend/documentation/feature-details.md`   |
| Creating a new database table                | `database/documentation/best-practices.md`   |
| Adding a new page or component               | `frontend/documentation/feature-details.md`  |
| Unsure how to structure a new feature        | `*/documentation/folder-structure.md`        |
| Writing tests                                | `*/documentation/testing.md`                 |
| Something is broken and you need to debug    | `*/documentation/debugging-results.md`       |

---

## File Descriptions

### `architecture.md`
The overall design of that layer — patterns used, how data flows, key decisions, Mermaid diagrams.
Read this before writing any new code in that layer.

### `feature-details.md`
The full list of features, routes, endpoints, and components already planned or implemented.
Check this before adding something new to avoid duplication.

### `folder-structure.md`
The exact directory layout with naming conventions.
Use this as a reference when creating new files to place them correctly.

### `best-practices.md`
Short, practical rules the whole team follows.
Read once when joining. Revisit when code review comments seem repetitive.

### `testing.md`
How to write tests for that layer, with copy-paste templates.
Use this when writing feature tests or setting up the test environment.

### `debugging-results.md`
A log of real issues encountered and how they were solved.
Check this first when you hit an error — the fix may already be documented.

---

## How to Keep This Documentation Up to Date

**After adding a new feature:**
- Add its endpoints or pages to `feature-details.md`
- If you created new files or folders, update `folder-structure.md`
- Add a changelog entry at the bottom of every file you modified (see Versioning below)

**After fixing a recurring bug:**
- Add the issue and fix to `debugging-results.md`

**After agreeing on a new team convention:**
- Add it to `best-practices.md`

**After creating a new database table:**
- Add the table schema to `database/documentation/feature-details.md`
- Confirm the 4 required columns (`created_by`, `created_at`, `updated_by`, `updated_at`) are documented

---

## Versioning and Changelog

Every documentation file tracks its own changes at the bottom using a `## Changelog` section.

### Format

```markdown
## Changelog

- 2026-02-28: Initial version (Claude)
- 2026-03-15: Added Listing scheduling feature (dev-name)
- 2026-04-01: Updated endpoint table — removed deprecated /publish route (dev-name)
```

### Rules

- Add an entry every time you make a meaningful change to a doc file
- Use `YYYY-MM-DD` date format
- Write who made the change — your name or `Claude` if AI-generated
- Do not log typo fixes or formatting-only changes
- Do not use SemVer for documentation — dates are sufficient
- Keep the changelog at the very bottom of the file, after all content

---

## Writing Feature Documentation (Instructions for Claude and Developers)

When you implement a new feature, document it immediately using the template below. Do not wait until the end of the sprint.

### Which files to update

| What you built             | Update these files                                                    |
|----------------------------|-----------------------------------------------------------------------|
| New API endpoint           | `backend/documentation/feature-details.md`                           |
| New database table         | `database/documentation/feature-details.md`, `architecture.md` (ERD) |
| New page or component      | `frontend/documentation/feature-details.md`                          |
| New folder or file         | `*/documentation/folder-structure.md`                                |
| Bug fix with root cause    | `*/documentation/debugging-results.md`                               |
| New convention or rule     | `*/documentation/best-practices.md`                                  |
| Complex flow (multi-step)  | Add a Mermaid diagram to the relevant `architecture.md`              |

### Feature documentation template

Copy this block and fill it in whenever you add a non-trivial feature:

```markdown
## Feature: [Feature Name]

**Layer:** backend / frontend / database
**Status:** planned / implemented / deprecated
**Added:** YYYY-MM-DD

### What it does
One or two sentences describing the feature's purpose from the user's perspective.

### How it works
Brief technical explanation — what classes, hooks, or tables are involved.

### Flow

[Add a Mermaid flowchart here if the feature has multiple steps or branches]

### Endpoints / Pages / Tables

| Item | Detail |
|------|--------|
| ...  | ...    |

### Notes
Edge cases, dependencies on other features, or things that are easy to get wrong.
```

### When to add a Mermaid diagram

Add a diagram when the feature involves:
- A multi-step process with branching (use `flowchart TD`)
- A sequence between frontend, backend, and database (use `sequenceDiagram`)
- A new state machine or lifecycle (use `stateDiagram-v2`)
- New entity relationships in the database (use `erDiagram`)

Do not add diagrams for simple CRUD endpoints — a table is enough.

---

## Mermaid — Safe Syntax Rules

These rules prevent rendering errors on GitHub and VS Code.

### 1. Quote labels that contain special characters

Wrap any label in double quotes if it contains `/`, `-`, `:`, `(`, `)`, or `{`:

```
GOOD: NODE["GET /api/v1/listings"]
BAD:  NODE[GET /api/v1/listings]

GOOD: NODE["Filter by type - location"]
BAD:  NODE[Filter by type - location]
```

### 2. Never use reserved words as node IDs

These words will break parsing if used as node identifiers:

```
FORBIDDEN: END, end, start, stop, graph, subgraph, style, classDef
```

Use descriptive IDs instead: `FINISH`, `REMOVED`, `ENTRY`, `DONE`.

### 3. Never use `&` for multi-target arrows

The `&` operator is not supported by all renderers. Write one arrow per line:

```
GOOD:
A --> B
A --> C
A --> D

BAD:
A --> B & C & D
```

### 4. Use `-` not `—` (em dash) inside labels

Em dashes (`—`) cause lexical errors in Mermaid node labels:

```
GOOD: NODE["Pending - awaiting activation"]
BAD:  NODE[Pending — awaiting activation]
```

### 5. Choose the right diagram type

| Situation                              | Diagram type      |
|----------------------------------------|-------------------|
| System components and connections      | `graph TB`        |
| Step-by-step process with decisions    | `flowchart TD`    |
| Communication between services         | `sequenceDiagram` |
| Lifecycle / status transitions         | `stateDiagram-v2` |
| Database table relationships           | `erDiagram`       |

### 6. Test before committing

Paste your diagram at [mermaid.live](https://mermaid.live) to verify it renders before committing. If it does not render there, it will not render on GitHub.

---

## Viewing Mermaid Diagrams

| Tool                  | How                                                                              |
|-----------------------|----------------------------------------------------------------------------------|
| VS Code               | Install **Markdown Preview Mermaid Support** extension, open preview `Ctrl+Shift+V` |
| GitHub                | Diagrams render automatically in any `.md` file                                  |
| Notion / Confluence   | Paste the mermaid block into a code block set to `mermaid`                       |
| Online                | Paste at [mermaid.live](https://mermaid.live)                                    |

---

## Rules for Everyone

1. **Do not skip the 4 required DB columns** — `created_by`, `created_at`, `updated_by`, `updated_at` on every table.
2. **Do not put business logic in controllers** — use the Service layer (backend) or custom hooks (frontend).
3. **Do not access another org's data** — always scope queries to the authenticated user's `organisation_id`.
4. **Do not commit `.env` files** — use `.env.example` / `.env.local.example` instead.
5. **Update docs when you change behaviour** — treat docs like code: they go stale if not maintained.
6. **Add a changelog entry** every time you update a documentation file.
7. **Test Mermaid diagrams at mermaid.live** before committing — never commit a diagram you have not verified.

---

## Changelog

- 2026-02-28: Initial version (Claude)
- 2026-02-28: Added Mermaid safe syntax rules, feature documentation template, versioning system, and Claude instructions (Claude)
