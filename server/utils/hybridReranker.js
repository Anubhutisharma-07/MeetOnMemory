const DEFAULT_WEIGHTS = Object.freeze({
  semantic: 0.4,
  graph: 0.2,
  keyword: 0.15,
  recency: 0.1,
  importance: 0.15,
});

function clamp01(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 0;
  }

  return Math.max(0, Math.min(1, number));
}

function normalizeWeights(weights = {}) {
  const merged = {
    ...DEFAULT_WEIGHTS,
    ...weights,
  };

  const safeWeights = Object.fromEntries(
    Object.entries(merged).map(([key, value]) => [
      key,
      Math.max(0, Number(value) || 0),
    ]),
  );

  const total = Object.values(safeWeights).reduce(
    (sum, value) => sum + value,
    0,
  );

  if (total <= 0) {
    return { ...DEFAULT_WEIGHTS };
  }

  return Object.fromEntries(
    Object.entries(safeWeights).map(([key, value]) => [
      key,
      value / total,
    ]),
  );
}

function tokenize(text = "") {
  return String(text)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
}

export function calculateKeywordScore(query, result) {
  const queryTokens = [...new Set(tokenize(query))];

  if (!queryTokens.length) {
    return 0;
  }

  const searchableText = [
    result.title,
    result.summary,
    ...(result.tags || []),
  ]
    .filter(Boolean)
    .join(" ");

  const resultTokens = new Set(tokenize(searchableText));

  const matchedTokens = queryTokens.filter((token) =>
    resultTokens.has(token),
  );

  return clamp01(matchedTokens.length / queryTokens.length);
}

export function calculateRecencyScore(date, now = new Date()) {
  if (!date) {
    return 0;
  }

  const timestamp = new Date(date).getTime();

  if (!Number.isFinite(timestamp)) {
    return 0;
  }

  const ageDays = Math.max(
    0,
    (now.getTime() - timestamp) / (1000 * 60 * 60 * 24),
  );

  // 30-day half-life.
  return clamp01(Math.pow(0.5, ageDays / 30));
}

export function calculateImportanceScore(result) {
  const score = Number(result.importanceScore);

  if (!Number.isFinite(score)) {
    return 0;
  }

  // Existing importance scores are stored on a 0-100 scale.
  return clamp01(score / 100);
}

export function calculateRerankScore(
  result,
  query,
  weights = DEFAULT_WEIGHTS,
  now = new Date(),
) {
  const normalizedWeights = normalizeWeights(weights);

  const semanticScore = clamp01(result.semanticScore);
  const graphScore = clamp01(result.graphScore);

  const keywordScore = calculateKeywordScore(query, result);

  const recencyScore = calculateRecencyScore(
    result.date || result.createdAt,
    now,
  );

  const importanceScore = calculateImportanceScore(result);

  const finalScore =
    normalizedWeights.semantic * semanticScore +
    normalizedWeights.graph * graphScore +
    normalizedWeights.keyword * keywordScore +
    normalizedWeights.recency * recencyScore +
    normalizedWeights.importance * importanceScore;

  return {
    ...result,
    keywordScore,
    recencyScore,
    importanceScore,
    rerankScore: finalScore,
  };
}

export function rerankResults(
  results,
  query,
  weights = DEFAULT_WEIGHTS,
  now = new Date(),
) {
  return results
    .map((result) =>
      calculateRerankScore(result, query, weights, now),
    )
    .sort((a, b) => {
      if (b.rerankScore !== a.rerankScore) {
        return b.rerankScore - a.rerankScore;
      }

      return (b.finalScore || 0) - (a.finalScore || 0);
    });
}

export { DEFAULT_WEIGHTS };