import wordDefinitions from '@/data/word-definitions.json';

export type DictionaryDefinition = {
  definition: string;
  example?: string;
};

export type DictionaryMeaning = {
  partOfSpeech: string;
  definitions: DictionaryDefinition[];
};

export type DictionaryEntry = {
  word: string;
  phonetic?: string;
  meanings: DictionaryMeaning[];
};

type DefinitionsStore = Readonly<Record<string, readonly DictionaryEntry[]>>;

const DEFINITIONS = wordDefinitions as DefinitionsStore;

/**
 * Look up vendored dictionary entries for an answer-list word.
 * Returns null when the word is absent or was stored as an empty miss.
 */
export function getLocalDefinitionEntries(
  word: string,
): readonly DictionaryEntry[] | null {
  const key = word.trim().toLowerCase();
  if (!key) return null;
  const entries = DEFINITIONS[key];
  if (!entries || entries.length === 0) return null;
  return entries;
}
