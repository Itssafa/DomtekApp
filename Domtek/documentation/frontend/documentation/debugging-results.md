# Debugging Results — Next.js Frontend

## Tools

| Tool                  | Purpose                                       |
|-----------------------|-----------------------------------------------|
| React DevTools        | Component tree, state, props inspection       |
| Next.js error overlay | Runtime error display in dev mode             |
| Browser DevTools      | Network tab for API call inspection           |
| `console.error` logs  | Caught errors from React Query                |

---

## Common Issues and Fixes

### 1. Hydration mismatch error
**Symptom:** `Error: Hydration failed because the initial UI does not match what was rendered on the server.`
**Cause:** Rendering different content on server vs client (e.g., using `window`, `localStorage`, or `Date.now()` in a Server Component).
**Fix:** Move that logic to a Client Component with `"use client"`.

---

### 2. API calls returning 401 on page load
**Cause:** Token not attached — interceptor not running or token expired.
**Fix:** Check `lib/api.ts` interceptor. Verify token exists in storage before rendering protected pages.

---

### 3. `useRouter` / `useSearchParams` not working
**Cause:** Used inside a Server Component.
**Fix:** Add `"use client"` directive at top of file.

---

### 4. Stale data after mutation
**Cause:** React Query cache not invalidated after create/update/delete.
**Fix:**
```ts
const queryClient = useQueryClient();
useMutation({
  mutationFn: createListing,
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['listings'] }),
});
```

---

### 5. `[org_slug]` route not matching
**Cause:** Folder named incorrectly (e.g., `[orgSlug]` vs `[org_slug]`).
**Fix:** Folder name must exactly match the param used in `params.org_slug`.

---

### 6. Environment variable undefined in browser
**Cause:** Server-only variable (no `NEXT_PUBLIC_` prefix) used in a Client Component.
**Fix:** Rename to `NEXT_PUBLIC_API_URL` for client-accessible variables.

---

### 7. Infinite re-render loop
**Cause:** Object or array created inline as a `useEffect` dependency.
**Fix:** Wrap with `useMemo` or move outside the component.

---

## Debug API Calls Fast

Open browser DevTools → Network tab → filter by `api/v1` → check:
- Status code
- Request payload (check `body`)
- Response body for error message
