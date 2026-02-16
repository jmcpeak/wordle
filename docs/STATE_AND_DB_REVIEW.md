# State Management & Database Review

Summary of suggested improvements after reviewing stores, DB layer, and API usage.

---

## State management

### 1. **Clear stats store on sign-out (implemented)**

When the user signs out, the stats store kept the previous user’s data. **Done:** The stats store has a `clearStats()` action. `ClientProvider` calls `clearStats()` when `session?.user?.id` is absent, so stats are reset on sign-out and don’t leak to the next user.

---

### 2. **Stats store: normalize API response in one place (implemented)**

**Done:** The store exposes `setFromApiResponse(data: unknown)` which runs `parseStatsResponse` and sets state. `ClientProvider` now calls `setFromApiResponse(rawData)` instead of `setStats(rawData)`, so all stats API responses are normalized in one place.

---

### 3. **Theme store: show message when save fails (implemented)**

Theme store already did optimistic update and reverted on failure. **Done:** A global toast now appears when theme or stats save fails (“Failed to save theme preference…” / “Failed to save statistics…” / “Failed to reset statistics…”). See `ToastSnackbar` and `useToastStore`.

---

### 4. **i18nStore: `t()` used outside React**

`gameActions.ts` calls `t()` from `@/store/i18nStore`, which uses `useI18nStore.getState()`. That’s correct for non-React code. One caveat: if translations are loaded asynchronously after the store is created, `t()` can run before translations exist and will return the key. Layout already loads translations server-side and passes them into `I18nProvider`, so in practice this is fine. No change required unless you add client-only translation loading later.

---

## Database

### 5. **Schema initialization (implemented)**

`ensureSchema()` is called from almost every DB function (`upsertUser`, `getTheme`, `getStats`, etc.). It uses an in-memory `initialized` flag, so in a long-lived process it runs once, but in serverless each invocation can be a new process, so you may run the “ensure” logic on many requests. The operations are idempotent (CREATE TABLE IF NOT EXISTS, INSERT … ON CONFLICT), so correctness is fine, but you pay a small cost.

**Suggestion:** Either:
- Keep as-is and accept the cost, or
- Run schema/migrations at deploy time (e.g. a script or a one-off route protected by a secret) and remove `ensureSchema()` from the hot path, or
- Call `ensureSchema()` only from a single “bootstrap” path (e.g. first auth callback or a dedicated init route) and assume schema is already present elsewhere.

---

### 6. **Connection layer: no explicit read-only / timeout options**

Neon’s serverless driver supports `fetchOptions` (e.g. timeouts) and, for transactions, options like `readOnly`. Your current usage is fine for the current scale. If you add more complex or long-running queries, consider passing a timeout in `fetchOptions` and using read-only transactions where appropriate.

---

### 7. **db/stats: `upsertUser` return value**

When an existing user is found by email, you return `existingUser` from the DB. That’s the right record. Just ensure the returned shape matches what NextAuth expects (e.g. `id` as string; your schema uses TEXT so you’re fine). No change needed unless you add more fields or types from the DB that don’t match `User`.

---

### 8. **API routes: validate request body**

In `POST /api/stats` and `POST /api/theme` you read `request.json()` and destructure. If the client sends malformed or missing fields, you could get runtime errors or unexpected behavior.

**Suggestion:** Validate shape (e.g. `action` in stats is one of the allowed values, `theme` is a valid ThemeMode, `guesses` is a number when action is ADD_WIN). You can use a small validator (e.g. Zod) or simple conditionals and return 400 with a clear message for invalid input.

---

## Cross-cutting

### 9. **Single source of truth for “current user id”**

Session is read in layout (server), in API routes via `auth()`, and in client via `useSession()`. That’s correct. No change; just noting that any “ensure user exists” or “user-specific” logic should consistently use the same source (e.g. `session?.user?.id` after auth).

---

### 10. **Error handling in stores**

- **Game store:** `fetchWord` and `handleInput` set error state and messages; good.
- **Stats store:** `addWin` / `addLoss` / `resetStats` throw on non-ok response; `GamePage` catches and logs. Consider returning a result type (e.g. `{ ok: boolean; error?: string }`) if you want to show a user-facing message on failure.
- **Theme store:** Already reverts and logs; optional to add user-visible error as in (3).

---

## Summary table

| Area              | Suggestion                                      | Priority |
|------------------|--------------------------------------------------|----------|
| Stats on sign-out| Clear stats store when session is null           | Done     |
| Stats API data   | setFromApiResponse in store; ClientProvider uses it| Done     |
| Schema init      | Deploy-time route / remove from hot path        | Done     |
| API validation   | Validate POST body in stats and theme routes      | Medium   |
| Theme error UX   | Snackbar when theme/stats save fails             | Done     |

No blocking issues; the current design is consistent and the Neon transaction usage (callback form) is correct for `@neondatabase/serverless`.
