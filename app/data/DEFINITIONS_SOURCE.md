# Word definition sources

The bundled dictionary in [`word-definitions.json`](word-definitions.json) covers every word in [`wordle-answers.mjs`](wordle-answers.mjs). Runtime lookups go through [`definitions.ts`](definitions.ts) and `/api/definition/[word]` — **no live third-party dictionary API**.

| File | Role |
|------|------|
| `word-definitions.json` | Vendored entries keyed by lowercase word |
| `definitions.ts` | Shared types + typed lookup helper |

## Licensing / attribution

- **Data:** English Wiktionary, licensed [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)
- **Generation host used once to build this snapshot:** [FreeDictionaryAPI.com](https://freedictionaryapi.com/) (Wiktionary-derived JSON)

The definition drawer shows a Wiktionary / CC BY-SA caption. Keep that attribution when regenerating.

## Regenerating

From the repo root (requires network; resume-safe):

```bash
npm run definitions
```

Options:

```bash
npm run definitions -- --force          # rebuild every answer word (including empty markers)
npm run definitions -- --limit=50       # first N answers only (dev)
```

### Resume behavior

- Words **already present** with definitions are skipped.
- Words stored as **`[]` (empty markers)** are also skipped — those are confirmed misses from a prior run. Use **`--force`** to retry them.
- Words that **failed mid-run** (network/429 after retries) are **not** written, so a plain re-run will fetch them again.

The script lives at [`scripts/regenerate-definitions.mjs`](../../scripts/regenerate-definitions.mjs). Re-run after the answer list changes so new solutions have definitions (`npm run wordlist` then `npm run definitions`).

A unit test asserts every answer word has a non-empty local definition.
