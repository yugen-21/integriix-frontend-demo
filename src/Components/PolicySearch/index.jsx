import { useMemo, useState } from "react";
import {
  FaArrowRight,
  FaCircleCheck,
  FaLightbulb,
  FaMagnifyingGlass,
  FaQuoteLeft,
  FaStar,
  FaWandMagicSparkles,
  FaXmark,
} from "react-icons/fa6";
import { highlightTokens, searchPolicies } from "../../services/searchPolicies";
import { suggestedQueries } from "../../data/mockSearch";

function readQueryFromUrl() {
  if (typeof window === "undefined") return "";
  const params = new URLSearchParams(window.location.search);
  return params.get("q") ?? "";
}

function navigateToSearch(query) {
  const trimmed = (query ?? "").trim();
  const url = trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : "/search";
  window.location.assign(url);
}

function navigateToPolicy(id) {
  window.location.assign(`/policy-management?policy=${encodeURIComponent(id)}`);
}

const statusStyles = {
  Draft: "bg-slate-100 text-slate-700 ring-slate-200",
  "In Review": "bg-amber-50 text-amber-700 ring-amber-200",
  Approved: "bg-cyan-50 text-cyan-700 ring-cyan-200",
  Active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Archived: "bg-slate-100 text-slate-500 ring-slate-200",
};

function PolicySearch() {
  const initialQuery = useMemo(() => readQueryFromUrl(), []);
  const [draft, setDraft] = useState(initialQuery);

  const result = useMemo(() => searchPolicies(initialQuery), [initialQuery]);

  function handleSubmit(event) {
    event.preventDefault();
    navigateToSearch(draft);
  }

  function pickSuggestion(query) {
    navigateToSearch(query);
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

      {result.mode === "empty" ? (
        <EmptyLanding onPick={pickSuggestion} />
      ) : (
        <ResultsView
          result={result}
          query={initialQuery}
          onPick={pickSuggestion}
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

function EmptyLanding({ onPick }) {
  return (
    <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="rounded-3xl border border-white/80 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)] max-[520px]:rounded-2xl max-[520px]:p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-cyan-700">
          Try one of these
        </p>
        <h2 className="mt-1 text-base font-semibold text-slate-900">
          Curated demo queries
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Click a query to see how the engine surfaces policies even when the
          exact words are not in them.
        </p>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {suggestedQueries.map((query) => (
            <button
              key={query}
              type="button"
              onClick={() => onPick(query)}
              className="group flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-left transition hover:-translate-y-0.5 hover:border-cyan-300 hover:bg-white hover:shadow-sm"
            >
              <span className="min-w-0 text-sm font-medium text-slate-800 group-hover:text-cyan-700">
                {query}
              </span>
              <FaArrowRight
                className="h-3 w-3 shrink-0 text-slate-400 group-hover:text-cyan-600"
                aria-hidden="true"
              />
            </button>
          ))}
        </div>
      </div>

      <aside className="grid content-start gap-3">
        <div className="rounded-3xl border border-cyan-200 bg-gradient-to-br from-white to-cyan-50/40 p-5 shadow-sm max-[520px]:rounded-2xl max-[520px]:p-4">
          <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-cyan-700">
            <FaLightbulb className="h-3 w-3" aria-hidden="true" />
            How it works
          </p>
          <p className="mt-2 text-[11px] leading-5 text-slate-600">
            We embed policy paragraphs and concept tags, then rank them against
            the query. Demo mode uses curated answers; the real backend will
            swap in vector search without changing this UI.
          </p>
        </div>
        <div className="rounded-3xl border border-white/80 bg-white p-5 shadow-sm max-[520px]:rounded-2xl max-[520px]:p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Tip
          </p>
          <p className="mt-2 text-[11px] leading-5 text-slate-600">
            Phrase the question the way a clinician would: “what do we do
            when…”, “who can…”. Keyword fragments still work, but full sentences
            score better.
          </p>
        </div>
      </aside>
    </section>
  );
}

function ResultsView({ result, query, onPick }) {
  const { results, mode, rationale, curatedLabel } = result;

  if (results.length === 0) {
    return <NoResults query={query} onPick={onPick} />;
  }

  return (
    <div className="grid gap-4">
      {(mode === "curated" || mode === "curated-fuzzy") && (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-cyan-200 bg-cyan-50/70 px-4 py-3 text-xs text-cyan-900">
          <FaStar className="h-3 w-3" aria-hidden="true" />
          <span className="font-semibold">
            Matched curated answer{" "}
            {mode === "curated-fuzzy" && curatedLabel
              ? `(${curatedLabel})`
              : ""}
          </span>
          <span className="text-cyan-800/80">— {rationale}</span>
        </div>
      )}

      <p className="text-[11px] text-slate-500">
        {results.length} result{results.length === 1 ? "" : "s"} for{" "}
        <span className="font-semibold text-slate-700">“{query}”</span>
      </p>

      <ol className="grid gap-3">
        {results.map((entry, idx) => (
          <ResultCard
            key={`${entry.policy.id}-${entry.paragraph?.id ?? idx}`}
            entry={entry}
            rank={idx + 1}
            query={query}
          />
        ))}
      </ol>
    </div>
  );
}

function ResultCard({ entry, rank, query }) {
  const { policy, paragraph, score, why } = entry;
  const titleParts = highlightTokens(policy.title, query);
  const snippetParts = paragraph
    ? highlightTokens(paragraph.text, query)
    : null;

  return (
    <li>
      <button
        type="button"
        onClick={() => navigateToPolicy(policy.id)}
        className="group grid w-full gap-3 rounded-3xl border border-white/80 bg-white p-5 text-left shadow-[0_18px_45px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-[0_22px_55px_rgba(15,23,42,0.10)] max-[520px]:rounded-2xl max-[520px]:p-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="grid h-6 w-6 place-items-center rounded-md bg-slate-900 text-[10px] font-semibold text-white">
                {rank}
              </span>
              <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                {policy.code}
              </span>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${statusStyles[policy.status] ?? statusStyles.Draft}`}
              >
                {policy.status}
              </span>
              {policy.accreditationTags?.map((tag) => (
                <span
                  key={tag}
                  className="rounded bg-cyan-50 px-1.5 py-0.5 text-[10px] font-semibold text-cyan-700 ring-1 ring-cyan-200"
                >
                  {tag}
                </span>
              ))}
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
              {policy.department} · {policy.owner}
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <ScorePill score={score} />
          </div>
        </div>

        {paragraph && (
          <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
            <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              <FaQuoteLeft className="h-2.5 w-2.5" aria-hidden="true" />
              {paragraph.heading}
            </p>
            <p className="mt-2 text-xs leading-5 text-slate-700">
              {snippetParts?.map((part) =>
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
            {paragraph.concepts?.length > 0 && (
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {paragraph.concepts.map((concept) => (
                  <span
                    key={concept}
                    className="rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-slate-600 ring-1 ring-slate-200"
                  >
                    {concept}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {why && (
          <p className="inline-flex items-center gap-1.5 text-[11px] text-slate-500">
            <FaCircleCheck
              className="h-2.5 w-2.5 text-cyan-600"
              aria-hidden="true"
            />
            {why}
          </p>
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
  const pct = Math.round(score * 100);
  const tone =
    score >= 0.85
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : score >= 0.65
        ? "bg-cyan-50 text-cyan-700 ring-cyan-200"
        : "bg-slate-100 text-slate-700 ring-slate-200";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${tone}`}
    >
      {score.toFixed(2)}
      <span className="text-[10px] font-medium opacity-70">({pct}%)</span>
    </span>
  );
}

function NoResults({ query, onPick }) {
  return (
    <section className="grid gap-3 rounded-3xl border border-white/80 bg-white p-6 text-center shadow-[0_18px_45px_rgba(15,23,42,0.06)] max-[520px]:rounded-2xl max-[520px]:p-4">
      <span className="mx-auto grid h-10 w-10 place-items-center rounded-2xl bg-slate-100 text-slate-500">
        <FaMagnifyingGlass className="h-4 w-4" aria-hidden="true" />
      </span>
      <p className="text-sm font-semibold text-slate-700">
        Nothing matched “{query}” strongly enough
      </p>
      <p className="mx-auto max-w-md text-xs text-slate-500">
        Try one of the curated demo queries below — they show off the semantic
        engine even when the exact words are not in the policy text.
      </p>
      <div className="mt-2 flex flex-wrap justify-center gap-2">
        {suggestedQueries.slice(0, 4).map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => onPick(q)}
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700"
          >
            {q}
          </button>
        ))}
      </div>
    </section>
  );
}

export default PolicySearch;
