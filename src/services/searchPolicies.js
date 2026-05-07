import { mockPolicies } from "../data";
import { curatedQueries, paragraphLibrary } from "../data/mockSearch";

const STOPWORDS = new Set([
  "the", "a", "an", "of", "for", "to", "in", "on", "and", "or",
  "is", "are", "be", "we", "i", "you", "with", "by", "this", "that",
  "what", "how", "do", "does", "should", "must", "from", "at", "as",
  "our", "their", "your", "my", "have", "has", "had", "it", "its",
]);

function tokenize(text) {
  return (text ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

function policyById(id) {
  return mockPolicies.find((p) => p.id === id) ?? null;
}

function paragraphById(policyId, paragraphId) {
  const list = paragraphLibrary[policyId] ?? [];
  return list.find((p) => p.id === paragraphId) ?? null;
}

function findCurated(query) {
  const norm = query.trim().toLowerCase();
  return curatedQueries.find(
    (entry) =>
      entry.label.toLowerCase() === norm ||
      entry.aliases?.some((alias) => alias.toLowerCase() === norm),
  );
}

function curatedFuzzy(query) {
  const tokens = tokenize(query);
  if (tokens.length === 0) return null;

  let best = null;
  let bestScore = 0;
  curatedQueries.forEach((entry) => {
    const candidates = [entry.label, ...(entry.aliases ?? [])];
    candidates.forEach((candidate) => {
      const candidateTokens = tokenize(candidate);
      const overlap = tokens.filter((t) =>
        candidateTokens.some((c) => c === t || c.startsWith(t) || t.startsWith(c)),
      ).length;
      const ratio = overlap / Math.max(tokens.length, candidateTokens.length);
      if (overlap >= 2 && ratio > bestScore) {
        best = entry;
        bestScore = ratio;
      }
    });
  });
  return bestScore >= 0.6 ? best : null;
}

function buildCuratedResults(entry) {
  return entry.results
    .map((result) => {
      const policy = policyById(result.policyId);
      if (!policy) return null;
      const paragraph = paragraphById(result.policyId, result.paragraphId);
      return {
        policy,
        paragraph,
        score: result.score,
        why: result.why,
      };
    })
    .filter(Boolean);
}

function scoreFallback(query) {
  const tokens = tokenize(query);
  if (tokens.length === 0) return [];

  const results = [];

  mockPolicies.forEach((policy) => {
    const titleTokens = tokenize(`${policy.title} ${policy.code}`);
    const metaTokens = tokenize(
      `${policy.category} ${policy.department} ${policy.owner}`,
    );
    const paragraphs = paragraphLibrary[policy.id] ?? [];

    let policyTitleHits = 0;
    tokens.forEach((t) => {
      if (titleTokens.some((tt) => tt === t || tt.startsWith(t))) {
        policyTitleHits += 1;
      }
    });
    let metaHits = 0;
    tokens.forEach((t) => {
      if (metaTokens.some((mt) => mt === t || mt.startsWith(t))) metaHits += 1;
    });

    let bestParagraph = null;
    let bestParagraphScore = 0;

    paragraphs.forEach((paragraph) => {
      const pTokens = tokenize(
        `${paragraph.heading} ${paragraph.text} ${(paragraph.concepts ?? []).join(" ")}`,
      );
      let hits = 0;
      let conceptHits = 0;
      tokens.forEach((t) => {
        if (pTokens.some((pt) => pt === t || pt.startsWith(t))) hits += 1;
        if (
          (paragraph.concepts ?? []).some((c) =>
            c.toLowerCase().includes(t),
          )
        ) {
          conceptHits += 1;
        }
      });
      const score =
        hits / Math.max(tokens.length, 1) +
        conceptHits * 0.15 +
        policyTitleHits * 0.1 +
        metaHits * 0.05;
      if (score > bestParagraphScore) {
        bestParagraphScore = score;
        bestParagraph = paragraph;
      }
    });

    const finalScore = clamp(
      bestParagraphScore +
        policyTitleHits * 0.15 +
        metaHits * 0.05,
      0,
      0.95,
    );

    if (finalScore > 0.18) {
      results.push({
        policy,
        paragraph: bestParagraph,
        score: Number(finalScore.toFixed(2)),
        why:
          policyTitleHits > 0
            ? "Title matches your search terms."
            : metaHits > 0
              ? "Owner, department or category contains your search terms."
              : "Concept overlap with the policy body.",
      });
    }
  });

  return results.sort((a, b) => b.score - a.score).slice(0, 8);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function searchPolicies(query) {
  const trimmed = (query ?? "").trim();
  if (!trimmed) {
    return { mode: "empty", query: "", results: [] };
  }

  const exact = findCurated(trimmed);
  if (exact) {
    return {
      mode: "curated",
      query: trimmed,
      rationale: exact.rationale,
      curatedLabel: exact.label,
      results: buildCuratedResults(exact),
    };
  }

  const fuzzy = curatedFuzzy(trimmed);
  if (fuzzy) {
    return {
      mode: "curated-fuzzy",
      query: trimmed,
      rationale: fuzzy.rationale,
      curatedLabel: fuzzy.label,
      results: buildCuratedResults(fuzzy),
    };
  }

  return {
    mode: "fallback",
    query: trimmed,
    results: scoreFallback(trimmed),
  };
}

export function highlightTokens(text, query) {
  const tokens = tokenize(query);
  if (tokens.length === 0 || !text) return [{ type: "text", value: text, key: "0" }];

  const tokenSet = new Set(tokens);
  const escaped = tokens
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");
  const regex = new RegExp(`(${escaped})`, "gi");
  const parts = String(text).split(regex);
  return parts
    .filter((part) => part !== "")
    .map((part, idx) => {
      const lower = part.toLowerCase();
      const isMatch =
        tokenSet.has(lower) ||
        tokens.some((t) => lower === t || lower.startsWith(t) && lower.length <= t.length + 2);
      return isMatch
        ? { type: "match", value: part, key: `${idx}-m` }
        : { type: "text", value: part, key: `${idx}-t` };
    });
}
