/**
 * Refresh app/data/wordle-words.mjs from cfreshman gists.
 * Update URLs/dates in app/data/WORDLIST_SOURCE.md when you change sources.
 */
import { createWriteStream } from 'node:fs';
import { get } from 'node:https';

const SOURCES = {
  answers:
    'https://gist.githubusercontent.com/cfreshman/a03ef2cba789d8cf00c08f767e0fad7b/raw/wordle-answers-alphabetical.txt',
  allowed:
    'https://gist.githubusercontent.com/cfreshman/8b92bc418b43096094cf5d1b0eea8f84/raw/nyt-wordle-allowed-guesses-2026-03-06.txt',
};

function fetchText(url) {
  return new Promise((resolve, reject) => {
    get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        const next = res.headers.location;
        if (!next) {
          reject(new Error('Redirect without location'));
          return;
        }
        fetchText(next).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        return;
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    }).on('error', reject);
  });
}

function lines(s) {
  return s
    .split(/\r?\n/)
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);
}

const [allowedRaw, answersRaw] = await Promise.all([
  fetchText(SOURCES.allowed),
  fetchText(SOURCES.answers),
]);

const allowed = lines(allowedRaw);
const answers = lines(answersRaw);
const aSet = new Set(answers);
const rest = allowed.filter((w) => !aSet.has(w));

if (
  answers.some((w) => w.length !== 5) ||
  allowed.some((w) => w.length !== 5)
) {
  throw new Error('Non-5-letter word in source');
}
const missing = answers.filter((w) => !new Set(allowed).has(w));
if (missing.length > 0) {
  throw new Error(
    `Answers not in allowed list: ${missing.slice(0, 5).join(', ')}`,
  );
}

const outPath = new URL('../app/data/wordle-words.mjs', import.meta.url);
const ws = createWriteStream(outPath);
ws.write(`/**
 * Vendored Wordle-style word lists (see WORDLIST_SOURCE.md).
 * Generated — do not edit by hand.
 */
export const answers = [
`);
for (let i = 0; i < answers.length; i++) {
  ws.write(
    `  ${JSON.stringify(answers[i])}${i < answers.length - 1 ? ',' : ''}\n`,
  );
}
ws.write(`];

export const rest = [
`);
for (let i = 0; i < rest.length; i++) {
  ws.write(`  ${JSON.stringify(rest[i])}${i < rest.length - 1 ? ',' : ''}\n`);
}
ws.write(`];

export const all = [...answers, ...rest];
`);
await new Promise((resolve, reject) => {
  ws.on('error', reject);
  ws.end(() => resolve());
});

console.log(
  `Wrote ${outPath.pathname} (${answers.length} answers, ${rest.length} guess-only, ${allowed.length} allowed total)`,
);
