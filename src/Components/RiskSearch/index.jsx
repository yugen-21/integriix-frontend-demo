import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import {
  FaArrowRight,
  FaMagnifyingGlass,
  FaQuoteLeft,
  FaWandMagicSparkles,
  FaXmark,
} from "react-icons/fa6";

const SEARCH_LIMIT = 20;

function readQueryFromUrl() {
  if (typeof window === "undefined") return "";
  const params = new URLSearchParams(window.location.search);
  return params.get("q") ?? "";
}

function navigateToSearch(query) {
  const trimmed = (query ?? "").trim();
  const url = trimmed
    ? `/search-risk-register?q=${encodeURIComponent(trimmed)}`
    : "/search-risk-register";
  window.location.assign(url);
}

function navigateToRisk(id) {
  window.location.assign(
    `/risk-audit-governance/risk-register?risk=${encodeURIComponent(id)}`,
  );
}

const STOPWORDS = new Set([
  "the", "a", "an", "of", "for", "to", "in", "on", "and", "or",
  "is", "are", "be", "we", "i", "you", "with", "by", "this", "that",
  "what", "how", "do", "does", "should", "must", "from", "at", "as",
  "our", "their", "your", "my", "have", "has", "had", "it", "its",
  "risk", "risks",
]);

function tokenize(text) {
  return (text ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

// Token-overlap scoring across weighted fields. Lightweight stand-in for a real
// semantic search until the backend is wired up.
function scoreRisk(risk, queryTokens) {
  if (queryTokens.length === 0) return 0;

  const fields = [
    { text: risk.title, weight: 4 },
    { text: risk.description, weight: 2 },
    { text: risk.category, weight: 2 },
    { text: risk.department, weight: 2 },
    { text: risk.owner, weight: 1.5 },
    { text: risk.context, weight: 1 },
    { text: risk.controlDescription, weight: 1 },
    { text: risk.mitigationPlan, weight: 1 },
  ];

  let total = 0;
  for (const field of fields) {
    const haystack = tokenize(field.text);
    if (haystack.length === 0) continue;
    const haystackSet = new Set(haystack);
    let hits = 0;
    for (const token of queryTokens) {
      if (haystackSet.has(token)) hits += 1;
      else if (haystack.some((h) => h.startsWith(token) || token.startsWith(h)))
        hits += 0.5;
    }
    total += (hits / queryTokens.length) * field.weight;
  }
  // Normalise to roughly 0..1 — total weight sum is ~14.5.
  return Math.min(1, total / 8);
}

function pickSnippet(text, queryTokens, maxLen = 240) {
  if (!text) return null;
  if (queryTokens.length === 0)
    return text.length > maxLen ? `${text.slice(0, maxLen)}…` : text;
  const lower = text.toLowerCase();
  let bestIdx = -1;
  for (const token of queryTokens) {
    const idx = lower.indexOf(token);
    if (idx !== -1 && (bestIdx === -1 || idx < bestIdx)) bestIdx = idx;
  }
  if (bestIdx === -1)
    return text.length > maxLen ? `${text.slice(0, maxLen)}…` : text;
  const start = Math.max(0, bestIdx - 60);
  const end = Math.min(text.length, start + maxLen);
  const prefix = start > 0 ? "…" : "";
  const suffix = end < text.length ? "…" : "";
  return `${prefix}${text.slice(start, end)}${suffix}`;
}

function highlightTokens(text, queryTokens) {
  if (queryTokens.length === 0 || !text)
    return [{ type: "text", value: text ?? "", key: "0" }];
  const escaped = queryTokens
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");
  const regex = new RegExp(`(${escaped})`, "gi");
  const parts = String(text).split(regex);
  return parts
    .filter((part) => part !== "")
    .map((part, idx) => {
      const lower = part.toLowerCase();
      const isMatch = queryTokens.some(
        (t) => lower === t || lower.startsWith(t),
      );
      return isMatch
        ? { type: "match", value: part, key: `${idx}-m` }
        : { type: "text", value: part, key: `${idx}-t` };
    });
}

const tierStyles = {
  Operational: "bg-slate-100 text-slate-700 ring-slate-200",
  "Process-Level": "bg-indigo-50 text-indigo-700 ring-indigo-200",
  Strategic: "bg-orange-50 text-orange-700 ring-orange-200",
};

function residualBandClass(value) {
  if (value <= 8) return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  if (value <= 24) return "bg-amber-50 text-amber-700 ring-amber-200";
  return "bg-rose-50 text-rose-700 ring-rose-200";
}

function inherentBandClass(value) {
  if (value <= 6) return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  if (value <= 12) return "bg-amber-50 text-amber-700 ring-amber-200";
  return "bg-rose-50 text-rose-700 ring-rose-200";
}

const SUGGESTED_QUERIES = [
  "patient identification",
  "transfusion mismatch",
  "ransomware",
  "medication dosing",
  "fall with injury",
  "narcotic diversion",
  "hand hygiene",
  "vendor SLA",
];

function RiskSearch() {
  const risks = useSelector((state) => state.risks.items);
  const initialQuery = useMemo(() => readQueryFromUrl(), []);
  const [draft, setDraft] = useState(initialQuery);

  const queryTokens = useMemo(() => tokenize(initialQuery), [initialQuery]);

  const results = useMemo(() => {
    if (queryTokens.length === 0) return [];
    const scored = risks
      .map((risk) => ({ risk, score: scoreRisk(risk, queryTokens) }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, SEARCH_LIMIT);
    return scored;
  }, [risks, queryTokens]);

  const topResidualRisks = useMemo(() => {
    return [...risks]
      .sort((a, b) => b.residualRating - a.residualRating)
      .slice(0, 5);
  }, [risks]);

  function handleSubmit(event) {
    event.preventDefault();
    navigateToSearch(draft);
  }

  return (
    <div className="grid min-w-0 gap-5 max-[900px]:gap-4">
      <Header />

      <SearchBar
        draft={draft}
        onChange={setDraft}
        onSubmit={handleSubmit}
        onClear={() => navigateToSearch("")}
        hasQuery={Boolean(initialQuery)}
      />

      {!initialQuery && (
        <IdleState topRisks={topResidualRisks} totalRisks={risks.length} />
      )}
      {initialQuery && results.length === 0 && (
        <NoResults query={initialQuery} />
      )}
      {initialQuery && results.length > 0 && (
        <ResultsView
          results={results}
          query={initialQuery}
          queryTokens={queryTokens}
        />
      )}
    </div>
  );
}

function Header() {
  return (
    <section className="relative min-w-0 overflow-hidden rounded-3xl border border-white/80 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.10)] max-[520px]:rounded-2xl">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,#cffafe_0%,transparent_55%),radial-gradient(circle_at_bottom_left,#e0e7ff_0%,transparent_50%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -right-16 h-64 w-64 rounded-full bg-cyan-200/40 blur-3xl"
      />
      <div className="relative grid gap-2 p-6 max-[520px]:p-4">
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-cyan-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-cyan-700 ring-1 ring-cyan-200">
          <FaWandMagicSparkles className="h-3 w-3" aria-hidden="true" />
          Search risk register
        </span>
        <h1 className="text-xl font-semibold leading-tight text-slate-900 max-[520px]:text-lg">
          Find the right risk, fast
        </h1>
        <p className="text-xs text-slate-500">
          Search across every operational, process-level and strategic risk —
          by title, description, control, owner or department.
        </p>
      </div>
    </section>
  );
}

function SearchBar({ draft, onChange, onSubmit, onClear, hasQuery }) {
  return (
    <form
      onSubmit={onSubmit}
      className="rounded-3xl border border-white/80 bg-white p-3 shadow-[0_18px_45px_rgba(15,23,42,0.06)] max-[520px]:rounded-2xl max-[520px]:p-2"
    >
      <div className="flex items-center gap-2">
        <label className="relative flex-1">
          <span className="sr-only">Search risks</span>
          <FaMagnifyingGlass
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="search"
            value={draft}
            onChange={(e) => onChange(e.target.value)}
            placeholder="e.g. patient identification errors in ICU"
            autoFocus
            className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50/70 pl-11 pr-10 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-500/10"
          />
          {draft && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              aria-label="Clear input"
            >
              <FaXmark className="h-3 w-3" aria-hidden="true" />
            </button>
          )}
        </label>
        <button
          type="submit"
          className="inline-flex h-11 items-center gap-1.5 rounded-2xl bg-slate-900 px-4 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800"
        >
          Search
          <FaArrowRight className="h-3 w-3" aria-hidden="true" />
        </button>
        {hasQuery && (
          <button
            type="button"
            onClick={onClear}
            className="hidden h-11 items-center rounded-2xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 transition hover:bg-slate-50 sm:inline-flex"
          >
            Reset
          </button>
        )}
      </div>
    </form>
  );
}

function IdleState({ topRisks, totalRisks }) {
  return (
    <div className="grid gap-5">
      <section className="grid gap-4 rounded-3xl border border-white/80 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)] max-[520px]:rounded-2xl max-[520px]:p-4">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-cyan-50 text-cyan-700">
            <FaMagnifyingGlass className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-800">
              Try one of these searches
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Searching across {totalRisks} risk{totalRisks === 1 ? "" : "s"} —
              by title, description, controls, owner or department.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {SUGGESTED_QUERIES.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => navigateToSearch(q)}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50/80 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:-translate-y-0.5 hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700"
            >
              <FaMagnifyingGlass className="h-2.5 w-2.5" aria-hidden="true" />
              {q}
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Highest residual risks right now
          </h2>
          <span className="text-[11px] text-slate-500">Top 5 by residual rating</span>
        </div>
        <ol className="grid gap-3">
          {topRisks.map((risk, idx) => (
            <ResultCard
              key={risk.id}
              risk={risk}
              score={null}
              rank={idx + 1}
              queryTokens={[]}
            />
          ))}
        </ol>
      </section>
    </div>
  );
}

function NoResults({ query }) {
  return (
    <section className="grid gap-2 rounded-3xl border border-white/80 bg-white p-6 text-center shadow-[0_18px_45px_rgba(15,23,42,0.06)] max-[520px]:rounded-2xl max-[520px]:p-4">
      <span className="mx-auto grid h-10 w-10 place-items-center rounded-2xl bg-slate-100 text-slate-500">
        <FaMagnifyingGlass className="h-4 w-4" aria-hidden="true" />
      </span>
      <p className="text-sm font-semibold text-slate-700">
        No risks matched “{query}”
      </p>
      <p className="mx-auto max-w-md text-xs text-slate-500">
        Try a different phrasing, or seed more risks via{" "}
        <span className="font-medium text-slate-700">Generate register</span> on
        the main list.
      </p>
    </section>
  );
}

function ResultsView({ results, query, queryTokens }) {
  return (
    <div className="grid gap-4">
      <p className="text-[11px] text-slate-500">
        {results.length} result{results.length === 1 ? "" : "s"} for{" "}
        <span className="font-semibold text-slate-700">“{query}”</span>
      </p>

      <ol className="grid gap-3">
        {results.map((entry, idx) => (
          <ResultCard
            key={entry.risk.id}
            risk={entry.risk}
            score={entry.score}
            rank={idx + 1}
            queryTokens={queryTokens}
          />
        ))}
      </ol>
    </div>
  );
}

function ResultCard({ risk, score, rank, queryTokens }) {
  const titleParts = highlightTokens(risk.title, queryTokens);
  const snippetText = pickSnippet(risk.description, queryTokens);
  const snippetParts = snippetText ? highlightTokens(snippetText, queryTokens) : null;

  return (
    <li>
      <button
        type="button"
        onClick={() => navigateToRisk(risk.id)}
        className="group grid w-full gap-3 rounded-3xl border border-white/80 bg-white p-5 text-left shadow-[0_18px_45px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-[0_22px_55px_rgba(15,23,42,0.10)] max-[520px]:rounded-2xl max-[520px]:p-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="grid h-6 w-6 place-items-center rounded-md bg-slate-900 text-[10px] font-semibold text-white">
                {rank}
              </span>
              <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-700">
                {risk.riskNumber}
              </span>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${
                  tierStyles[risk.tier] ?? tierStyles.Operational
                }`}
              >
                {risk.tier}
              </span>
              <span className="rounded bg-cyan-50 px-1.5 py-0.5 text-[10px] font-semibold text-cyan-700 ring-1 ring-cyan-200">
                {risk.department}
              </span>
              <span className="rounded bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 ring-1 ring-slate-200">
                {risk.category}
              </span>
            </div>

            <h3 className="mt-2 text-sm font-semibold leading-snug text-slate-900 group-hover:text-cyan-700">
              {titleParts.map((part) =>
                part.type === "match" ? (
                  <mark
                    key={part.key}
                    className="rounded bg-yellow-100 px-0.5 text-slate-900"
                  >
                    {part.value}
                  </mark>
                ) : (
                  <span key={part.key}>{part.value}</span>
                ),
              )}
            </h3>

            <p className="mt-1 text-[11px] text-slate-500">
              Owner ·{" "}
              <span className="font-medium text-slate-700">{risk.owner}</span>
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            {score != null && <ScorePill score={score} />}
            <RatingPills risk={risk} />
          </div>
        </div>

        {snippetParts && (
          <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
            <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              <FaQuoteLeft className="h-2.5 w-2.5" aria-hidden="true" />
              Description
            </p>
            <p className="mt-2 text-xs leading-5 text-slate-700">
              {snippetParts.map((part) =>
                part.type === "match" ? (
                  <mark
                    key={part.key}
                    className="rounded bg-yellow-100 px-0.5 text-slate-900"
                  >
                    {part.value}
                  </mark>
                ) : (
                  <span key={part.key}>{part.value}</span>
                ),
              )}
            </p>
          </div>
        )}

        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-cyan-700 transition group-hover:gap-2">
          Open risk
          <FaArrowRight className="h-3 w-3" aria-hidden="true" />
        </span>
      </button>
    </li>
  );
}

function RatingPills({ risk }) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-1">
      <span
        className={`inline-flex h-5 min-w-[2rem] items-center justify-center rounded-md px-1.5 text-[10px] font-semibold ring-1 ${inherentBandClass(
          risk.inherentRating,
        )}`}
        title="Inherent rating (L × I)"
      >
        I·{risk.inherentRating}
      </span>
      <span
        className={`inline-flex h-5 min-w-[2.2rem] items-center justify-center rounded-md px-1.5 text-[10px] font-bold ring-1 ${residualBandClass(
          risk.residualRating,
        )}`}
        title="Residual rating (inherent × control effectiveness)"
      >
        R·{risk.residualRating}
      </span>
    </div>
  );
}

function ScorePill({ score }) {
  const numeric = Number(score) || 0;
  const pct = Math.round(numeric * 100);
  const tone =
    numeric >= 0.6
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : numeric >= 0.3
        ? "bg-cyan-50 text-cyan-700 ring-cyan-200"
        : "bg-slate-100 text-slate-700 ring-slate-200";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${tone}`}
    >
      {numeric.toFixed(2)}
      <span className="text-[10px] font-medium opacity-70">({pct}%)</span>
    </span>
  );
}

export default RiskSearch;
