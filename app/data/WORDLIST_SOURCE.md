# Word list sources

The bundled lists in [`wordle-words.mjs`](wordle-words.mjs) are **community-maintained snapshots**, not an official NYT API. They are regenerated from **cfreshman** gists (chosen over kcwhite’s list because the NYT **allowed-guesses** snapshot was newer at import time).

| Export | Source | Snapshot date (gist) |
|--------|--------|----------------------|
| `answers` | [wordle-answers-alphabetical.txt](https://gist.github.com/cfreshman/a03ef2cba789d8cf00c08f767e0fad7b) | Gist last updated **2026-03-29** |
| `all` / `rest` | [nyt-wordle-allowed-guesses-2026-03-06.txt](https://gist.github.com/cfreshman/8b92bc418b43096094cf5d1b0eea8f84) | File dated **2026-03-06** |

- **`answers`** — Possible solution words (alphabetical list from the classic Wordle answer set; cfreshman notes that NYT may curate solutions over time, so this may not match every future NYT solution).
- **`all`** — Union of `answers` and `rest`: every **allowed guess** from the NYT allowed-guesses snapshot (lowercase in source).
- **`rest`** — Allowed guesses that are not in `answers`.

Raw downloads used for generation:

- `https://gist.githubusercontent.com/cfreshman/a03ef2cba789d8cf00c08f767e0fad7b/raw/wordle-answers-alphabetical.txt`
- `https://gist.githubusercontent.com/cfreshman/8b92bc418b43096094cf5d1b0eea8f84/raw/nyt-wordle-allowed-guesses-2026-03-06.txt`

## Regenerating

From the repo root:

```bash
npm run wordlist
```

Update the URLs in [`scripts/regenerate-wordlist.mjs`](../../scripts/regenerate-wordlist.mjs) when switching gists, then refresh the table above and run `npm run wordlist` again.
