import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  FaArrowRight,
  FaMagnifyingGlass,
  FaQuoteLeft,
  FaSpinner,
  FaWandMagicSparkles,
  FaXmark,
} from "react-icons/fa6";
import {
  clearSearch,
  fetchRisks,
  searchRisksThunk,
} from "../../store/risksSlice";

const SEARCH_LIMIT = 20;
const MIN_SCORE = 0.5;

function readQueryFromUrl() {
  if (typeof window === "undefined") return "";
  const params = new URLSearchParams(window.location.search);
  return params.get("q") ?? "";
}

// Update the URL without a full page reload — keeps the deep-link pattern
// `?q=...` working but avoids re-hydrating Redux + re-running every effect.
function pushQueryToUrl(query) {
  if (typeof window === "undefined") return;
  const trimmed = (query ?? "").trim();
  const url = trimmed
    ? `/search-risk-register?q=${encodeURIComponent(trimmed)}`
    : "/search-risk-register";
  window.history.pushState({}, "", url);
}

function navigateToRisk(id) {
  window.location.assign(
    `/risk-register?risk=${encodeURIComponent(id)}`,
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

// Snippet picking + highlight helpers — kept from the old implementation
// because they only use the query string to highlight lexically matching
// words. Useful even with semantic search: if the user typed "barcode" and
// the result mentions "barcode" we still want to point that out.
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

const MATCHED_CHUNK_LABEL = {
  risk_body: "Risk body",
  controls: "Controls",
  mitigation: "Mitigation",
};

const MATCHED_CHUNK_TONE = {
  risk_body: "bg-cyan-50 text-cyan-700 ring-cyan-200",
  controls: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  mitigation: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

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
  const dispatch = useDispatch();

  const risks = useSelector((s) => s.risks.items);
  const results = useSelector((s) => s.risks.searchResults);
  const loading = useSelector((s) => s.risks.searchLoading);
  const error = useSelector((s) => s.risks.searchError);
  const submittedQuery = useSelector((s) => s.risks.searchQuery);

  const [draft, setDraft] = useState(() => readQueryFromUrl());

  // 1) Load risks once so the IdleState's "top residual" widget has data
  //    even if the user landed here directly.
  useEffect(() => {
    if (risks.length === 0) dispatch(fetchRisks());
  }, [dispatch, risks.length]);

  // 2) If the URL has ?q=…, fire the search on mount (and whenever the URL
  //    query changes via back/forward navigation).
  useEffect(() => {
    const fromUrl = readQueryFromUrl();
    if (fromUrl) {
      setDraft(fromUrl);
      dispatch(searchRisksThunk({ q: fromUrl, limit: SEARCH_LIMIT, minScore: MIN_SCORE }));
    } else {
      dispatch(clearSearch());
    }

    function onPopState() {
      const q = readQueryFromUrl();
      setDraft(q);
      if (q) {
        dispatch(searchRisksThunk({ q, limit: SEARCH_LIMIT, minScore: MIN_SCORE }));
      } else {
        dispatch(clearSearch());
      }
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [dispatch]);

  const queryTokens = useMemo(() => tokenize(submittedQuery), [submittedQuery]);

  const topResidualRisks = useMemo(() => {
    return [...risks]
      .sort((a, b) => b.residualRating - a.residualRating)
      .slice(0, 5);
  }, [risks]);

  function runSearch(q) {
    const trimmed = (q ?? "").trim();
    pushQueryToUrl(trimmed);
    if (trimmed) {
      dispatch(searchRisksThunk({ q: trimmed, limit: SEARCH_LIMIT, minScore: MIN_SCORE }));
    } else {
      dispatch(clearSearch());
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    runSearch(draft);
  }

  function handleClear() {
    setDraft("");
    runSearch("");
  }

  const hasSubmittedQuery = Boolean(submittedQuery);

  return (
    <div className="grid min-w-0 gap-5 max-[900px]:gap-4">
      <Header />

      <SearchBar
        draft={draft}
        loading={loading}
        onChange={setDraft}
        onSubmit={handleSubmit}
        onClear={handleClear}
      />

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
          {String(error)}
        </div>
      )}

      {!hasSubmittedQuery && !loading && (
        <IdleState
          totalRisks={risks.length}
          topRisks={topResidualRisks}
          onPick={(q) => {
            setDraft(q);
            runSearch(q);
          }}
        />
      )}

      {hasSubmittedQuery && !loading && results.length === 0 && !error && (
        <NoResults query={submittedQuery} />
      )}

      {hasSubmittedQuery && results.length > 0 && (
        <ResultsView
          results={results}
          query={submittedQuery}
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
          Semantic search across every risk — matches the question against the
          risk body, controls and mitigation. Only results above{" "}
          {Math.round(MIN_SCORE * 100)}% similarity are shown.
        </p>
      </div>
    </section>
  );
}

function SearchBar({ draft, loading, onChange, onSubmit, onClear }) {
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
            type="text"
            value={draft}
            onChange={(e) => onChange(e.target.value)}
            placeholder="e.g. patient identification errors in ICU"
            autoFocus
            className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50/70 pl-11 pr-10 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-500/10"
          />
          {draft && (
            <button
              type="button"
              onClick={onClear}
              className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              aria-label="Clear search"
              title="Clear search"
            >
              <FaXmark className="h-3 w-3" aria-hidden="true" />
            </button>
          )}
        </label>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex h-11 items-center gap-1.5 rounded-2xl bg-slate-900 px-4 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <FaSpinner className="h-3 w-3 animate-spin" aria-hidden="true" />
              Searching
            </>
          ) : (
            <>
              Search
              <FaArrowRight className="h-3 w-3" aria-hidden="true" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}

function IdleState({ topRisks, totalRisks, onPick }) {
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
              semantic match against risk body, controls and mitigation.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {SUGGESTED_QUERIES.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => onPick(q)}
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
              matchScore={null}
              matchedChunk={null}
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
        No strong matches above {Math.round(MIN_SCORE * 100)}% for “{query}”
      </p>
      <p className="mx-auto max-w-md text-xs text-slate-500">
        Try rewording your question — the search compares meaning, not just
        keywords. Or browse the full register.
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
        {results.map((hit, idx) => (
          <ResultCard
            key={hit.id}
            risk={hit}
            matchScore={hit.matchScore}
            matchedChunk={hit.matchedChunk}
            rank={idx + 1}
            queryTokens={queryTokens}
          />
        ))}
      </ol>
    </div>
  );
}

function ResultCard({ risk, matchScore, matchedChunk, rank, queryTokens }) {
  const titleParts = highlightTokens(risk.title, queryTokens);
  // Pull the snippet from whichever field the backend says matched — that's
  // the one most likely to contain the user's intent.
  const snippetSource =
    matchedChunk === "controls"
      ? risk.controlDescription
      : matchedChunk === "mitigation"
        ? risk.mitigationPlan
        : risk.description;
  const snippetLabel =
    matchedChunk === "controls"
      ? "Controls"
      : matchedChunk === "mitigation"
        ? "Mitigation plan"
        : "Description";
  const snippetText = pickSnippet(snippetSource, queryTokens);
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
              {matchedChunk && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${
                    MATCHED_CHUNK_TONE[matchedChunk] ?? MATCHED_CHUNK_TONE.risk_body
                  }`}
                  title={`Matched in the ${(MATCHED_CHUNK_LABEL[matchedChunk] ?? matchedChunk).toLowerCase()} of this risk`}
                >
                  Matched in: {MATCHED_CHUNK_LABEL[matchedChunk] ?? matchedChunk}
                </span>
              )}
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
            {matchScore != null && <ScorePill score={matchScore} />}
            <RatingPills risk={risk} />
          </div>
        </div>

        {snippetParts && (
          <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
            <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              <FaQuoteLeft className="h-2.5 w-2.5" aria-hidden="true" />
              {snippetLabel}
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
    numeric >= 0.75
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : numeric >= 0.6
        ? "bg-amber-50 text-amber-700 ring-amber-200"
        : "bg-cyan-50 text-cyan-700 ring-cyan-200";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${tone}`}
      title={`${pct}% cosine similarity`}
    >
      {pct}% match
    </span>
  );
}

export default RiskSearch;
