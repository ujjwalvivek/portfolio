// Fuzzy scoring for the command palette. Every word of the query must match somewhere in an item: as a substring of
// its title, keywords or description, or (title and keywords only) as letters in order, so "brmtl" finds Baremetal.
// Substrings beat scattered letters, and a match at the start of a word beats one inside it.

export type Searchable = { title: string; words: string; desc: string };

const BOUNDARY = /[\s\-_:/.(,+]/;

function field(q: string, text: string, loose: boolean): number {
  const s = text.toLowerCase();
  const i = s.indexOf(q);
  if (i >= 0) {
    let n = 10 + q.length * 2;
    if (i === 0) n += 8;
    else if (BOUNDARY.test(s[i - 1] ?? "")) n += 5;
    return n;
  }
  if (!loose || q.length < 2) return 0;
  let at = -1;
  let gaps = 0;
  for (const ch of q) {
    const j = s.indexOf(ch, at + 1);
    if (j < 0) return 0;
    if (at >= 0) gaps += j - at - 1;
    at = j;
  }
  if (gaps > q.length * 3) return 0; // letters this scattered are noise, not a match
  return Math.max(1, 6 - gaps / q.length);
}

export function tokens(query: string): string[] {
  return query.toLowerCase().split(/\s+/).filter(Boolean);
}

// 0 means "no match".
export function score(item: Searchable, words: string[]): number {
  let total = 0;
  for (const q of words) {
    const best = Math.max(field(q, item.title, true) * 3, field(q, item.words, true) * 2, field(q, item.desc, false));
    if (best === 0) return 0;
    total += best;
  }
  return total;
}
