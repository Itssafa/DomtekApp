# Testing — Next.js Frontend

## Tools

| Tool                    | Purpose                              |
|-------------------------|--------------------------------------|
| Jest                    | Test runner                          |
| React Testing Library   | Component unit tests                 |
| MSW (Mock Service Worker)| Mock API calls in tests             |
| Playwright              | End-to-end browser tests             |

---

## Test Structure

```
frontend/
└── __tests__/
    ├── components/
    │   ├── ListingCard.test.tsx
    │   ├── BillForm.test.tsx
    │   └── StatusBadge.test.tsx
    ├── hooks/
    │   └── useListings.test.ts
    └── e2e/                          # Playwright
        ├── login.spec.ts
        ├── listing-publish.spec.ts
        └── org-activation.spec.ts
```

---

## Component Test Template

```tsx
// __tests__/components/ListingCard.test.tsx
import { render, screen } from '@testing-library/react';
import { ListingCard } from '@/components/listings/ListingCard';

const mockListing = {
  id: 1,
  title: '3-bedroom apartment',
  type: 'sale',
  price: 150000,
  organisation: { name: 'Alpha Immobilier' },
};

describe('ListingCard', () => {
  it('renders listing title and price', () => {
    render(<ListingCard listing={mockListing} />);
    expect(screen.getByText('3-bedroom apartment')).toBeInTheDocument();
    expect(screen.getByText('150,000')).toBeInTheDocument();
  });

  it('shows sale badge for sale listings', () => {
    render(<ListingCard listing={mockListing} />);
    expect(screen.getByText('Sale')).toBeInTheDocument();
  });
});
```

---

## E2E Test Template (Playwright)

```ts
// e2e/login.spec.ts
test('admin login redirects to /admin', async ({ page }) => {
  await page.goto('/auth/login');
  await page.fill('[name=email]', 'admin@domtek.com');
  await page.fill('[name=password]', 'password');
  await page.click('[type=submit]');
  await expect(page).toHaveURL('/admin/organisations');
});

test('pending org is blocked after login', async ({ page }) => {
  await page.goto('/auth/login');
  await page.fill('[name=email]', 'pending-org@test.com');
  await page.fill('[name=password]', 'password');
  await page.click('[type=submit]');
  await expect(page.locator('[data-testid=activation-notice]')).toBeVisible();
});
```

---

## Run Tests

```bash
# Unit and component tests
npm run test

# With coverage
npm run test -- --coverage

# E2E
npx playwright test
```
