# Best Practices — Next.js Frontend

---

## 1. Server vs Client Components

Default to Server Components. Add `"use client"` only when needed (event handlers, hooks, browser APIs).

```tsx
// Server component (default) — no directive needed
export default async function ListingsPage() {
  const listings = await fetchListings(); // direct server fetch
  return <ListingList listings={listings} />;
}

// Client component — needs interactivity
"use client";
export default function ScheduleModal() { ... }
```

---

## 2. Centralize API Calls

Never call `fetch` or `axios` directly in components. Use hooks or dedicated API functions in `lib/api.ts`.

```ts
// hooks/useListings.ts
export function useListings() {
  return useQuery({ queryKey: ['listings'], queryFn: () => api.get('/org/listings') });
}
```

---

## 3. Type Everything

Define TypeScript interfaces for all API response shapes in `types/`.
Never use `any`.

---

## 4. Protect Routes with Middleware

Use Next.js `middleware.ts` to redirect unauthenticated or unauthorized users:

```ts
// middleware.ts
export function middleware(req: NextRequest) {
  const token = req.cookies.get('token');
  if (!token && req.nextUrl.pathname.startsWith('/admin')) {
    return NextResponse.redirect(new URL('/auth/login', req.url));
  }
}
```

---

## 5. Centralize Route Strings

Never hardcode route paths in JSX. Use `constants/routes.ts`:

```ts
export const ROUTES = {
  admin: { organisations: '/admin/organisations' },
  org: (slug: string) => ({ listings: `/${slug}/annonces` }),
};
```

---

## 6. Avoid Prop Drilling

If data needs to go more than two levels deep, use React Query cache or context.

---

## 7. Form Handling

Use `react-hook-form` with Zod validation schema for all forms.

```tsx
const schema = z.object({ price: z.number().min(0) });
const { register, handleSubmit } = useForm({ resolver: zodResolver(schema) });
```

---

## 8. Loading and Error States

Every data-fetching component must handle loading and error states explicitly. No silent failures.

---

## 9. Environment Variables

- Public variables: `NEXT_PUBLIC_` prefix
- Server-only variables: no prefix (never exposed to browser)
- Never commit `.env.local`
