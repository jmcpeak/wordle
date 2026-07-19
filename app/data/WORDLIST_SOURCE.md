# Word list sources

The bundled lists in [`wordle-answers.mjs`](wordle-answers.mjs) and [`wordle-allowed.mjs`](wordle-allowed.mjs) are **community-maintained snapshots**, not an official NYT API. They are regenerated from **cfreshman** gists (chosen over kcwhite’s list because the NYT **allowed-guesses** snapshot was newer at import time).

| File / export | Source | Snapshot date (gist) |
|---------------|--------|----------------------|
| `wordle-answers.mjs` → `answers` | [wordle-answers-alphabetical.txt](https://gist.github.com/cfreshman/a03ef2cba789d8cf00c08f767e0fad7b) | Gist last updated **2026-03-29** |
| `wordle-allowed.mjs` → `all` | Union of answers + [nyt-wordle-allowed-guesses-2026-03-06.txt](https://gist.github.com/cfreshman/8b92bc418b43096094cf5d1b0eea8f84) | File dated **2026-03-06** |

- **`answers`** — Possible solution words (used by `/api/word` and server seed). Kept in a separate module so solution picking does not load the full guess list.
- **`all`** — Every **allowed guess** (solutions ∪ additional NYT allowed guesses). Used by `/api/validate`.

Raw downloads used for generation:

- `https://gist.githubusercontent.com/cfreshman/a03ef2cba789d8cf00c08f767e0fad7b/raw/wordle-answers-alphabetical.txt`
- `https://gist.githubusercontent.com/cfreshman/8b92bc418b43096094cf5d1b0eea8f84/raw/nyt-wordle-allowed-guesses-2026-03-06.txt`

## Regenerating

From the repo root:

```bash
npm run wordlist
```

Update the URLs in [`scripts/regenerate-wordlist.mjs`](../../scripts/regenerate-wordlist.mjs) when switching gists, then refresh the table above and run `npm run wordlist` again.
