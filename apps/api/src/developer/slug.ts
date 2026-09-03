// Cyrillic -> Latin transliteration (Russian + Uzbek Cyrillic). Applied after
// lowercasing but BEFORE the [^a-z0-9] strip, so an all-Cyrillic name (e.g.
// "ЖК Бунёдкор") produces a real Latin slug ("jk-bunyodkor") instead of collapsing
// to an empty base and colliding as "jk-", "jk--2", …. Keys are lowercase; empty
// values (ъ/ь) drop the character.
const CYRILLIC_TO_LATIN: Record<string, string> = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  д: 'd',
  е: 'e',
  ж: 'j',
  з: 'z',
  и: 'i',
  й: 'y',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'x',
  ц: 'ts',
  ч: 'ch',
  ш: 'sh',
  щ: 'sh',
  ъ: '',
  ы: 'i',
  ь: '',
  э: 'e',
  ю: 'yu',
  я: 'ya',
  ё: 'yo',
  // Uzbek Cyrillic extras
  ў: 'o',
  қ: 'q',
  ғ: 'g',
  ҳ: 'h',
};

/** Replace each Cyrillic letter with its Latin equivalent; pass other chars through. */
function transliterate(input: string): string {
  let out = '';
  for (const ch of input) {
    const mapped = CYRILLIC_TO_LATIN[ch];
    out += mapped ?? ch;
  }
  return out;
}

// Kebab-slug from an arbitrary name, matching the realtor-slug regex shape.
export function slugify(input: string): string {
  const base = transliterate(input.toLowerCase())
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 38);
  if (base.length >= 3) return base;
  // Short/empty base: prefix with 'jk'. NEVER emit a trailing dash — when the base
  // is empty (all-symbol or now-transliterated-away input) fall back to plain 'jk'.
  return base ? `jk-${base}`.slice(0, 40) : 'jk';
}
