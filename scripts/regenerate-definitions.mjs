/**
 * Build app/data/word-definitions.json for every answer-list word.
 *
 * Source (generation only): FreeDictionaryAPI.com → English Wiktionary (CC BY-SA 4.0).
 * Runtime serves the vendored JSON — no live upstream dependency.
 *
 * Resume-safe: re-run skips words already present unless --force.
 * Empty-array markers mean "confirmed miss" and are also skipped on resume;
 * use --force to retry those.
 *
 *   npm run definitions
 *   npm run definitions -- --force
 *   npm run definitions -- --limit=50
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { answers } from '../app/data/wordle-answers.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = join(__dirname, '../app/data/word-definitions.json');
const SOURCE = 'https://freedictionaryapi.com/api/v1/entries/en';
const CONCURRENCY = 4;
const MAX_DEFS_PER_POS = 3;
const MAX_EXAMPLE_LEN = 160;
const REQUEST_TIMEOUT_MS = 20_000;
const MAX_RETRIES = 4;
const MIN_RATE_LIMIT_WAIT_MS = 15_000;

const args = process.argv.slice(2);
const force = args.includes('--force');
const limitArg = args.find((a) => a.startsWith('--limit='));
const limitRaw = limitArg ? Number(limitArg.slice('--limit='.length)) : null;
const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? limitRaw : null;

/** Shared cooldown so concurrent workers don't each sleep independently on 429. */
let rateLimitUntilMs = 0;

function truncate(text, max) {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

async function waitForRateLimit() {
  const waitMs = rateLimitUntilMs - Date.now();
  if (waitMs > 0) {
    await new Promise((r) => setTimeout(r, waitMs));
  }
}

function noteRateLimit(waitMs) {
  rateLimitUntilMs = Math.max(rateLimitUntilMs, Date.now() + waitMs);
}

function normalize(payload) {
  const english = (payload.entries ?? []).filter(
    (entry) => !entry.language?.code || entry.language.code === 'en',
  );
  if (english.length === 0) return null;

  const phonetic = english
    .flatMap((entry) => entry.pronunciations ?? [])
    .find((p) => p.type === 'ipa' && typeof p.text === 'string' && p.text)
    ?.text;

  /** @type {Map<string, Array<{ definition: string, example?: string }>>} */
  const meaningsByPos = new Map();

  for (const entry of english) {
    const partOfSpeech = entry.partOfSpeech?.trim() || 'unknown';
    const senses = (entry.senses ?? [])
      .filter((s) => typeof s.definition === 'string' && s.definition.trim())
      .slice(0, MAX_DEFS_PER_POS)
      .map((s) => {
        const definition = s.definition.trim();
        const rawExample = Array.isArray(s.examples)
          ? s.examples.find((ex) => typeof ex === 'string' && ex.trim())
          : undefined;
        if (!rawExample) return { definition };
        return {
          definition,
          example: truncate(rawExample.trim(), MAX_EXAMPLE_LEN),
        };
      });

    if (senses.length === 0) continue;

    const existing = meaningsByPos.get(partOfSpeech) ?? [];
    meaningsByPos.set(
      partOfSpeech,
      [...existing, ...senses].slice(0, MAX_DEFS_PER_POS),
    );
  }

  if (meaningsByPos.size === 0) return null;

  return [
    {
      word: String(payload.word ?? '').toLowerCase(),
      ...(phonetic ? { phonetic } : {}),
      meanings: [...meaningsByPos.entries()].map(
        ([partOfSpeech, definitions]) => ({
          partOfSpeech,
          definitions,
        }),
      ),
    },
  ];
}

async function fetchWord(word) {
  let delayMs = 500;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    await waitForRateLimit();

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(`${SOURCE}/${encodeURIComponent(word)}`, {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });

      if (response.status === 404) {
        return { word, entries: null, missing: true };
      }

      if (response.status === 429) {
        const retryAfter = Number(response.headers.get('retry-after'));
        // Some hosts send retry-after: 0 while still rate-limiting; ignore that.
        const waitMs =
          Number.isFinite(retryAfter) && retryAfter > 0
            ? retryAfter * 1000
            : Math.max(delayMs * 4, MIN_RATE_LIMIT_WAIT_MS);
        noteRateLimit(waitMs);
        console.warn(
          `429 for ${word}; shared cooldown ${Math.round(waitMs / 1000)}s`,
        );
        delayMs *= 2;
        continue;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const payload = await response.json();
      return { word, entries: normalize(payload), missing: false };
    } catch (error) {
      if (attempt === MAX_RETRIES) throw error;
      console.warn(
        `retry ${attempt + 1}/${MAX_RETRIES} for ${word}: ${error.message ?? error}`,
      );
      await new Promise((r) => setTimeout(r, delayMs));
      delayMs *= 2;
    } finally {
      clearTimeout(timer);
    }
  }
  throw new Error(`exhausted retries for ${word}`);
}

function loadExisting() {
  if (!existsSync(OUT_PATH)) return {};
  return JSON.parse(readFileSync(OUT_PATH, 'utf8'));
}

function save(store) {
  const sorted = Object.fromEntries(
    Object.keys(store)
      .sort()
      .map((key) => [key, store[key]]),
  );
  writeFileSync(OUT_PATH, `${JSON.stringify(sorted)}\n`, 'utf8');
}

async function main() {
  if (limitArg && limit === null) {
    console.error(`Invalid --limit value: ${limitArg}`);
    process.exitCode = 1;
    return;
  }

  const store = force ? {} : loadExisting();
  const words = (limit ? answers.slice(0, limit) : answers).map((w) =>
    w.toLowerCase(),
  );
  const pending = words.filter((w) => force || !(w in store));
  const totalPending = pending.length;

  console.log(
    `definitions: ${words.length} answers, ${totalPending} to fetch` +
      (force ? ' (--force)' : ''),
  );

  let done = 0;
  let missing = 0;
  let failed = 0;
  const failures = [];

  async function worker() {
    while (pending.length > 0) {
      const word = pending.shift();
      if (!word) return;
      try {
        const result = await fetchWord(word);
        if (result.missing || !result.entries) {
          // Empty marker so resume skips permanent misses (use --force to retry).
          store[word] = [];
          missing += 1;
        } else {
          store[word] = result.entries;
        }
      } catch (error) {
        failed += 1;
        failures.push(`${word}: ${error.message ?? error}`);
      }
      done += 1;
      if (done % 50 === 0 || pending.length === 0) {
        save(store);
        console.log(
          `progress ${done}/${totalPending} (missing=${missing}, failed=${failed})`,
        );
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
  save(store);

  const withDefs = Object.values(store).filter((e) => e.length > 0).length;
  const emptyMarkers = Object.values(store).filter((e) => e.length === 0).length;
  console.log(
    `done: ${withDefs} words with definitions, ${emptyMarkers} empty markers, ${missing} missing this run, ${failed} failed`,
  );
  console.log(`wrote ${OUT_PATH}`);
  if (failures.length) {
    console.error('failures:');
    for (const line of failures.slice(0, 20)) console.error(`  ${line}`);
    if (failures.length > 20) {
      console.error(`  …and ${failures.length - 20} more`);
    }
    process.exitCode = 1;
  }
}

await main();
