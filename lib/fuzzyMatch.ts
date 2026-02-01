/**
 * Fuzzy matching utility for finding similar strings
 * Used for character name matching, location merging, etc.
 */

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[len1][len2];
}

/**
 * Calculate similarity score between two strings (0-1, higher is more similar)
 */
export function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  if (s1 === s2) return 1.0;

  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return 1.0;

  const distance = levenshteinDistance(s1, s2);
  return 1 - distance / maxLen;
}

/**
 * Find fuzzy matches for a given string in an array of candidates
 */
export function findFuzzyMatches<T>(
  query: string,
  candidates: T[],
  accessor: (item: T) => string,
  threshold: number = 0.6
): Array<{ item: T; score: number }> {
  const results = candidates
    .map((candidate) => {
      const candidateStr = accessor(candidate);
      const score = calculateSimilarity(query, candidateStr);
      return { item: candidate, score };
    })
    .filter((result) => result.score >= threshold)
    .sort((a, b) => b.score - a.score);

  return results;
}

/**
 * Check if two strings are likely duplicates (high similarity)
 */
export function areLikelyDuplicates(str1: string, str2: string, threshold: number = 0.85): boolean {
  return calculateSimilarity(str1, str2) >= threshold;
}

/**
 * Group items by similarity
 */
export function groupBySimilarity<T>(
  items: T[],
  accessor: (item: T) => string,
  threshold: number = 0.85
): T[][] {
  const groups: T[][] = [];
  const processed = new Set<number>();

  for (let i = 0; i < items.length; i++) {
    if (processed.has(i)) continue;

    const group: T[] = [items[i]];
    processed.add(i);

    for (let j = i + 1; j < items.length; j++) {
      if (processed.has(j)) continue;

      const similarity = calculateSimilarity(accessor(items[i]), accessor(items[j]));
      if (similarity >= threshold) {
        group.push(items[j]);
        processed.add(j);
      }
    }

    groups.push(group);
  }

  return groups;
}
