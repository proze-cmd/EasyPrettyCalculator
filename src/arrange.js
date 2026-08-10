// arrange.js
// The "grouping engine" — pure logic, no DOM.
//
// Core rule, drawn from research on subitizing (recognising quantity without
// counting): children should never be shown a long undifferentiated line of
// items to count one-by-one. Quantities are instead broken into small,
// instantly-recognisable groups organised around the benchmarks 5 and 10.
//
//   1–6   -> canonical dice/domino pip patterns (already familiar to kids)
//   7–10  -> a row of five plus the remainder ("five and some more")
//   >10   -> groups of ten, so ten becomes a unit (place value)
//
// A number also has several *meaningful decompositions* so the same total can
// be seen more than one way (9 as 5+4, as 3+3+3, as 6+3) — this is what builds
// "conceptual subitizing".

/**
 * Pip positions inside a 3x3 grid, indexed 0-8:
 *     0 1 2
 *     3 4 5
 *     6 7 8
 * These are the standard dice faces.
 */
const PIP_CELLS = {
  1: [4], // center
  2: [0, 8], // diagonal
  3: [0, 4, 8], // diagonal
  4: [0, 2, 6, 8], // corners
  5: [0, 2, 4, 6, 8], // quincunx
  6: [0, 2, 3, 5, 6, 8], // two columns of three
};

/** Cells for a dice-style group, or null if the count is too big for pips. */
export function pipCells(n) {
  return PIP_CELLS[n] || null;
}

/**
 * Meaningful ways to split each number, most instructive first.
 * The first entry is the "default" view, and is always built around 5/10
 * for 7-10 so the five-benchmark is what children see first.
 */
const DECOMPOSITIONS = {
  1: [[1]],
  2: [[2], [1, 1]],
  3: [[3], [2, 1]],
  4: [[4], [2, 2], [3, 1]],
  5: [[5], [3, 2], [4, 1]],
  6: [[6], [3, 3], [5, 1], [2, 2, 2]],
  7: [[5, 2], [4, 3], [6, 1]],
  8: [[5, 3], [4, 4], [6, 2], [2, 2, 2, 2]],
  9: [[5, 4], [3, 3, 3], [6, 3], [8, 1]],
  10: [[5, 5], [6, 4], [7, 3], [2, 2, 2, 2, 2]],
};

/** Split into groups of `chunk`, with any remainder as a final group. */
function chunkSplit(n, chunk) {
  const groups = [];
  let left = n;
  while (left >= chunk) {
    groups.push(chunk);
    left -= chunk;
  }
  if (left > 0) groups.push(left);
  return groups;
}

/**
 * All the arrangements we're willing to show for `n`, best first.
 * Every returned group is <= 10 so it always renders in a subitizable shape.
 */
export function decompositionsFor(n) {
  const v = Math.round(n);
  if (!Number.isFinite(v) || v <= 0) return [[]];
  if (v <= 10) return DECOMPOSITIONS[v];

  const out = [chunkSplit(v, 10)];
  // For the teens, "five and five and some more" is also worth seeing.
  if (v <= 20) out.push(chunkSplit(v, 5));
  return out;
}

/** The groups for a single decomposition choice. */
export function groupsFor(n, decompIndex = 0) {
  const options = decompositionsFor(n);
  if (!options.length) return [];
  return options[((decompIndex % options.length) + options.length) % options.length];
}

/** How many alternative arrangements exist for `n`. */
export function decompositionCount(n) {
  return decompositionsFor(n).length;
}

/**
 * Multiplication is shown as equal groups: 3 x 4 is three groups of four,
 * never a flat pile. Groups are capped at 10 so each stays subitizable.
 */
export function groupsForProduct(a, b) {
  const count = Math.round(a);
  const per = Math.round(b);
  if (count <= 0 || per <= 0) return [];
  // Cap the number of groups as well as their size: a hundred plates holding
  // one thing each is not "equal groups", it's confetti.
  if (per <= 10 && count <= 10 && count * per <= 100) {
    return Array.from({ length: count }, () => per);
  }
  // Fall back to tens if the factors are too large to show as equal groups.
  return chunkSplit(count * per, 10);
}

/**
 * Every pair of parts that makes `n` — 1 and 8, 2 and 7, 3 and 6 …
 * Seeing the whole family at once is how children come to know that as one
 * part grows the other shrinks, and it's the groundwork for recalling number
 * facts rather than recomputing them.
 */
export function waysToMake(n) {
  const v = Math.round(n);
  const ways = [];
  for (let a = 1; a < v; a++) ways.push([a, v - a]);
  return ways;
}

/** A spoken/readable description of a split, e.g. "5 and 4". */
export function describeGroups(groups) {
  if (!groups || !groups.length) return '';
  return groups.join(' and ');
}
