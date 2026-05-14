import { useEffect, useMemo, useState } from "react";
import {
  FaArrowRight,
  FaCircleExclamation,
  FaMagnifyingGlass,
  FaQuoteLeft,
  FaSpinner,
  FaWandMagicSparkles,
  FaXmark,
} from "react-icons/fa6";
import policyAPI from "../../services/policyAPI";

const SEARCH_LIMIT = 20;

function readQueryFromUrl() {
  if (typeof window === "undefined") return "";
  const params = new URLSearchParams(window.location.search);
  return params.get("q") ?? "";
}

function navigateToSearch(query) {
  const trimmed = (query ?? "").trim();
  const url = trimmed
    ? `/search-policy-list?q=${encodeURIComponent(trimmed)}`
    : "/search-policy-list";
  window.location.assign(url);
}

function navigateToPolicy(id) {
  window.location.assign(`/policy-management?policy=${encodeURIComponent(id)}`);
}

const STATUS_LABEL = {
  draft: "Draft",
  in_review: "In Review",
  published: "Active",
  archived: "Archived",
};

const STATUS_STYLES = {
  draft: "bg-slate-100 text-slate-700 ring-slate-200",
  in_review: "bg-amber-50 text-amber-700 ring-amber-200",
  published: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  archived: "bg-slate-100 text-slate-500 ring-slate-200",
};

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
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

// Pure: split `text` into segments, marking matches against query tokens.
function highlightTokens(text, query) {
  const tokens = tokenize(query);
  if (tokens.length === 0 || !text) {
    return [{ type: "text", value: text ?? "", key: "0" }];
  }
  const escaped = tokens
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");
  const regex = new RegExp(`(${escaped})`, "gi");
  const parts = String(text).split(regex);
  return parts
    .filter((part) => part !== "")
    .map((part, idx) => {
      const lower = part.toLowerCase();
      const isMatch = tokens.some((t) => lower === t || lower.startsWith(t));
      return isMatch
        ? { type: "match", value: part, key: `${idx}-m` }
        : { type: "text", value: part, key: `${idx}-t` };
    });
}

function PolicySearch() {
  const initialQuery = useMemo(() => readQueryFromUrl(), []);
  const [draft, setDraft] = useState(initialQuery);
  // status: "idle" | "loading" | "success" | "error"
  const [status, setStatus] = useState(initialQuery ? "loading" : "idle");
  const [items, setItems] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!initialQuery) {
      setStatus("idle");
      setItems([]);
      return;
    }

    let cancelled = false;
    setStatus("loading");
    setErrorMessage("");

    policyAPI
      .searchPolicies(initialQuery, SEARCH_LIMIT)
      .then((response) => {
        if (cancelled) return;
        const data = response?.data ?? {};
        setItems(Array.isArray(data.items) ? data.items : []);
        setStatus("success");
      })
      .catch((err) => {
        if (cancelled) return;
        const detail =
          err?.response?.data?.detail ||
          err?.message ||
          "Search request failed.";
        setErrorMessage(String(detail));
        setItems([]);
        setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [initialQuery]);

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

      {status === "idle" && <IdleState />}
      {status === "loading" && <LoadingState query={initialQuery} />}
      {status === "error" && <ErrorState message={errorMessage} />}
      {status === "success" &&
        (items.length === 0 ? (
          <NoResults query={initialQuery} />
        ) : (
          <ResultsView items={items} query={initialQuery} />
        ))}
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
          Search
        </span>
        <h1 className="text-xl font-semibold leading-tight text-slate-900 max-[520px]:text-lg">
          Ask a question, find the right policy
        </h1>
        <p className="text-xs text-slate-500">
          Type the way you would ask a colleague — the search understands
          meaning, not just keywords.
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
          <span className="sr-only">Search policies</span>
          <FaMagnifyingGlass
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="search"
            value={draft}
            onChange={(e) => onChange(e.target.value)}
            placeholder="e.g. how do we handle patient consent before procedures?"
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

function IdleState() {
  return (
    <section className="grid place-items-center gap-2 rounded-3xl border border-white/80 bg-white p-10 text-center shadow-[0_18px_45px_rgba(15,23,42,0.06)] max-[520px]:rounded-2xl max-[520px]:p-6">
      <span className="grid h-10 w-10 place-items-center rounded-2xl bg-cyan-50 text-cyan-700">
        <FaMagnifyingGlass className="h-4 w-4" aria-hidden="true" />
      </span>
      <p className="text-sm font-semibold text-slate-700">
        Type a question to begin
      </p>
      <p className="max-w-md text-xs text-slate-500">
        Results are pulled live from your indexed policies. Phrase the question
        the way a clinician would — full sentences score better than keywords.
      </p>
    </section>
  );
}

function LoadingState({ query }) {
  return (
    <section className="grid place-items-center gap-2 rounded-3xl border border-white/80 bg-white p-10 text-center shadow-[0_18px_45px_rgba(15,23,42,0.06)] max-[520px]:rounded-2xl max-[520px]:p-6">
      <FaSpinner
        className="h-5 w-5 animate-spin text-cyan-600"
        aria-hidden="true"
      />
      <p className="text-sm font-semibold text-slate-700">
        Searching for “{query}”…
      </p>
      <p className="text-[11px] text-slate-500">
        First call after server start can take a few seconds while the embedding
        model warms up.
      </p>
    </section>
  );
}

function ErrorState({ message }) {
  return (
    <section className="grid gap-2 rounded-3xl border border-rose-200 bg-rose-50/60 p-6 text-center shadow-sm max-[520px]:rounded-2xl max-[520px]:p-4">
      <span className="mx-auto grid h-10 w-10 place-items-center rounded-2xl bg-white text-rose-600 ring-1 ring-rose-200">
        <FaCircleExclamation className="h-4 w-4" aria-hidden="true" />
      </span>
      <p className="text-sm font-semibold text-rose-800">Search failed</p>
      <p className="mx-auto max-w-md text-xs text-rose-700/80">{message}</p>
    </section>
  );
}

function NoResults({ query }) {
  return (
    <section className="grid gap-2 rounded-3xl border border-white/80 bg-white p-6 text-center shadow-[0_18px_45px_rgba(15,23,42,0.06)] max-[520px]:rounded-2xl max-[520px]:p-4">
      <span className="mx-auto grid h-10 w-10 place-items-center rounded-2xl bg-slate-100 text-slate-500">
        <FaMagnifyingGlass className="h-4 w-4" aria-hidden="true" />
      </span>
      <p className="text-sm font-semibold text-slate-700">
        No policies matched “{query}”
      </p>
      <p className="mx-auto max-w-md text-xs text-slate-500">
        Try rephrasing the question, or upload more policies so the search has
        something to draw from.
      </p>
    </section>
  );
}

function ResultsView({ items, query }) {
  return (
    <div className="grid gap-4">
      <p className="text-[11px] text-slate-500">
        {items.length} result{items.length === 1 ? "" : "s"} for{" "}
        <span className="font-semibold text-slate-700">“{query}”</span>
      </p>

      <ol className="grid gap-3">
        {items.map((hit, idx) => (
          <ResultCard
            key={`${hit.id}-${hit.chunk_index ?? idx}`}
            hit={hit}
            rank={idx + 1}
            query={query}
          />
        ))}
      </ol>
    </div>
  );
}

function ResultCard({ hit, rank, query }) {
  const titleParts = highlightTokens(hit.title, query);
  const snippetParts = hit.snippet ? highlightTokens(hit.snippet, query) : null;
  const statusKey = String(hit.status ?? "").toLowerCase();
  const statusLabel = STATUS_LABEL[statusKey] ?? hit.status ?? "Unknown";
  const statusClass = STATUS_STYLES[statusKey] ?? STATUS_STYLES.draft;

  return (
    <li>
      <button
        type="button"
        onClick={() => navigateToPolicy(hit.id)}
        className="group grid w-full gap-3 rounded-3xl border border-white/80 bg-white p-5 text-left shadow-[0_18px_45px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-[0_22px_55px_rgba(15,23,42,0.10)] max-[520px]:rounded-2xl max-[520px]:p-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="grid h-6 w-6 place-items-center rounded-md bg-slate-900 text-[10px] font-semibold text-white">
                {rank}
              </span>
              <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                {hit.code}
              </span>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${statusClass}`}
              >
                {statusLabel}
              </span>
              {hit.category && (
                <span className="rounded bg-cyan-50 px-1.5 py-0.5 text-[10px] font-semibold text-cyan-700 ring-1 ring-cyan-200">
                  {hit.category}
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
          </div>

          <div className="flex flex-col items-end gap-2">
            <ScorePill score={hit.score} />
          </div>
        </div>

        {snippetParts && (
          <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
            {hit.section_name && (
              <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                <FaQuoteLeft className="h-2.5 w-2.5" aria-hidden="true" />
                {hit.section_name}
              </p>
            )}
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
          Open detail
          <FaArrowRight className="h-3 w-3" aria-hidden="true" />
        </span>
      </button>
    </li>
  );
}

function ScorePill({ score }) {
  const numeric = Number(score) || 0;
  const pct = Math.round(numeric * 100);
  const tone =
    numeric >= 0.85
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : numeric >= 0.65
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

export default PolicySearch;
