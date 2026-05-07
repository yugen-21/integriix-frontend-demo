import { useEffect, useMemo, useState } from "react";
import {
  FaArrowRight,
  FaArrowsRotate,
  FaBell,
  FaCalendarPlus,
  FaCheck,
  FaCircleExclamation,
  FaFilter,
  FaMagnifyingGlass,
  FaSort,
  FaTriangleExclamation,
  FaUserTie,
} from "react-icons/fa6";
import { mockPolicies, policyCategories } from "../../data";

const TODAY = new Date("2026-05-06T00:00:00+05:30");

function formatDate(value) {
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function daysOverdue(value) {
  const target = new Date(value);
  const diffMs = TODAY - target;
  return Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));
}

function shiftDate(isoDate, days) {
  const d = new Date(isoDate);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function openPolicyDetail(id) {
  window.location.assign(`/policy-management?policy=${encodeURIComponent(id)}`);
}

function severityFor(days) {
  if (days >= 90) return { tone: "critical", label: "Critical" };
  if (days >= 30) return { tone: "high", label: "High" };
  return { tone: "medium", label: "Medium" };
}

const severityStyles = {
  critical: "bg-red-50 text-red-700 ring-red-200",
  high: "bg-orange-50 text-orange-700 ring-orange-200",
  medium: "bg-amber-50 text-amber-700 ring-amber-200",
};

function OverduePolicies() {
  const initialOverdue = useMemo(
    () => mockPolicies.filter((p) => new Date(p.nextReview) < TODAY),
    [],
  );

  const [policies, setPolicies] = useState(initialOverdue);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [severityFilter, setSeverityFilter] = useState("All");
  const [sortMode, setSortMode] = useState("most-overdue");
  const [feedback, setFeedback] = useState(null);
  const [feedbackTick, setFeedbackTick] = useState(0);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return policies
      .map((p) => ({ ...p, days: daysOverdue(p.nextReview) }))
      .filter((p) => {
        if (categoryFilter !== "All" && p.category !== categoryFilter)
          return false;
        if (severityFilter !== "All") {
          if (severityFor(p.days).tone !== severityFilter) return false;
        }
        if (!term) return true;
        const hay =
          `${p.code} ${p.title} ${p.owner} ${p.department}`.toLowerCase();
        return hay.includes(term);
      })
      .sort((a, b) => {
        if (sortMode === "most-overdue") return b.days - a.days;
        if (sortMode === "least-overdue") return a.days - b.days;
        if (sortMode === "owner") return a.owner.localeCompare(b.owner);
        if (sortMode === "code") return a.code.localeCompare(b.code);
        return 0;
      });
  }, [policies, search, categoryFilter, severityFilter, sortMode]);

  const stats = useMemo(() => {
    const total = policies.length;
    const buckets = { critical: 0, high: 0, medium: 0 };
    let worst = 0;
    policies.forEach((p) => {
      const days = daysOverdue(p.nextReview);
      buckets[severityFor(days).tone] += 1;
      if (days > worst) worst = days;
    });
    return { total, buckets, worst };
  }, [policies]);

  function showFeedback(tone, message) {
    setFeedback({ tone, message });
    setFeedbackTick((n) => n + 1);
  }

  useEffect(() => {
    if (!feedback) return undefined;
    const handle = window.setTimeout(() => setFeedback(null), 2400);
    return () => window.clearTimeout(handle);
  }, [feedback, feedbackTick]);

  function extendReview(id, days = 30) {
    setPolicies((prev) =>
      prev
        .map((p) =>
          p.id === id ? { ...p, nextReview: shiftDate(p.nextReview, days) } : p,
        )
        .filter((p) => new Date(p.nextReview) < TODAY),
    );
    showFeedback(
      "success",
      `Review date pushed back ${days} days. Owner notified to confirm.`,
    );
  }

  function notifyOwner(id) {
    const target = policies.find((p) => p.id === id);
    if (!target) return;
    showFeedback("info", `Reminder sent to ${target.owner}.`);
  }

  function resetFilters() {
    setSearch("");
    setCategoryFilter("All");
    setSeverityFilter("All");
    setSortMode("most-overdue");
  }

  return (
    <div className="grid min-w-0 gap-5 max-[900px]:gap-4">
      <Header stats={stats} />

      {feedback && <FeedbackBar tone={feedback.tone} message={feedback.message} />}

      <section className="relative min-w-0 overflow-hidden rounded-3xl border border-white/80 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)] max-[520px]:rounded-2xl">
        <Toolbar
          search={search}
          onSearch={setSearch}
          categoryFilter={categoryFilter}
          onCategoryFilter={setCategoryFilter}
          severityFilter={severityFilter}
          onSeverityFilter={setSeverityFilter}
          sortMode={sortMode}
          onSortMode={setSortMode}
          visibleCount={filtered.length}
          totalCount={policies.length}
          onClear={resetFilters}
        />

        {filtered.length === 0 ? (
          <EmptyState onClear={resetFilters} hadFilters={
            search !== "" ||
            categoryFilter !== "All" ||
            severityFilter !== "All"
          } />
        ) : (
          <div className="min-w-0 overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse text-left text-xs">
              <thead className="bg-slate-50/70 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2.5">Code</th>
                  <th className="px-4 py-2.5">Title</th>
                  <th className="px-4 py-2.5">Owner</th>
                  <th className="px-4 py-2.5">Was due</th>
                  <th className="px-4 py-2.5">Overdue by</th>
                  <th className="px-4 py-2.5">Severity</th>
                  <th className="w-44 px-4 py-2.5 text-right">Quick action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((policy) => (
                  <OverdueRow
                    key={policy.id}
                    policy={policy}
                    onOpen={() => openPolicyDetail(policy.id)}
                    onExtend={() => extendReview(policy.id, 30)}
                    onNotify={() => notifyOwner(policy.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Header({ stats }) {
  const cards = [
    {
      label: "Overdue total",
      value: stats.total,
      accent: "text-red-700",
    },
    {
      label: "Critical (90d+)",
      value: stats.buckets.critical,
      accent: "text-red-700",
    },
    {
      label: "High (30d+)",
      value: stats.buckets.high,
      accent: "text-orange-700",
    },
    {
      label: "Worst overdue",
      value: stats.worst > 0 ? `${stats.worst}d` : "—",
      accent: "text-slate-900",
    },
  ];

  return (
    <section className="relative min-w-0 overflow-hidden rounded-3xl border border-white/80 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.10)] max-[520px]:rounded-2xl">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,#fee2e2_0%,transparent_55%),radial-gradient(circle_at_bottom_left,#fde68a55_0%,transparent_50%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -right-16 h-64 w-64 rounded-full bg-red-200/40 blur-3xl"
      />

      <div className="relative grid gap-5 p-6 max-[520px]:p-4">
        <div className="min-w-0">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-700 ring-1 ring-red-200">
            <FaTriangleExclamation className="h-3 w-3" aria-hidden="true" />
            Overdue policies
          </span>
          <h1 className="mt-2 text-xl font-semibold leading-tight text-slate-900 max-[520px]:text-lg">
            Reviews past due
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Push the review date back, nudge the owner, or open the detail view
            to triage.
          </p>

          <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 max-w-2xl">
            {cards.map((card) => (
              <div
                key={card.label}
                className="rounded-xl border border-white/80 bg-white/80 p-3 shadow-sm backdrop-blur"
              >
                <dt className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                  {card.label}
                </dt>
                <dd
                  className={`mt-1 text-xl font-semibold leading-none ${card.accent}`}
                >
                  {card.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

function FeedbackBar({ tone, message }) {
  const styles =
    tone === "success"
      ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
      : tone === "info"
        ? "bg-cyan-50 text-cyan-800 ring-cyan-200"
        : "bg-amber-50 text-amber-800 ring-amber-200";
  const Icon = tone === "success" ? FaCheck : FaBell;
  return (
    <div
      role="status"
      className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium ring-1 ${styles}`}
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      {message}
    </div>
  );
}

function Toolbar({
  search,
  onSearch,
  categoryFilter,
  onCategoryFilter,
  severityFilter,
  onSeverityFilter,
  sortMode,
  onSortMode,
  visibleCount,
  totalCount,
  onClear,
}) {
  const hasFilters =
    search !== "" || categoryFilter !== "All" || severityFilter !== "All";

  return (
    <div className="border-b border-slate-100 p-4 max-[520px]:p-3">
      <div className="flex flex-wrap items-center gap-2">
        <label className="relative min-w-[220px] flex-1">
          <span className="sr-only">Search overdue policies</span>
          <FaMagnifyingGlass
            className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search by code, title, owner, department"
            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/80 pl-9 pr-3 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-500/20"
          />
        </label>

        <select
          value={categoryFilter}
          onChange={(e) => onCategoryFilter(e.target.value)}
          className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
        >
          <option value="All">All categories</option>
          {policyCategories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          value={severityFilter}
          onChange={(e) => onSeverityFilter(e.target.value)}
          className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
        >
          <option value="All">All severities</option>
          <option value="critical">Critical (90d+)</option>
          <option value="high">High (30d+)</option>
          <option value="medium">Medium</option>
        </select>

        <div className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white pl-2 pr-1">
          <FaSort className="h-3 w-3 text-slate-400" aria-hidden="true" />
          <select
            value={sortMode}
            onChange={(e) => onSortMode(e.target.value)}
            className="h-9 bg-transparent pr-2 text-xs font-medium text-slate-700 outline-none"
          >
            <option value="most-overdue">Most overdue</option>
            <option value="least-overdue">Least overdue</option>
            <option value="owner">Owner A→Z</option>
            <option value="code">Code A→Z</option>
          </select>
        </div>

        {hasFilters && (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-slate-500 transition hover:text-slate-700"
          >
            Clear
          </button>
        )}

        <span className="ml-auto text-[11px] text-slate-500">
          {visibleCount} of {totalCount}
        </span>
      </div>
    </div>
  );
}

function OverdueRow({ policy, onOpen, onExtend, onNotify }) {
  const sev = severityFor(policy.days);

  function handleRowClick(event) {
    if (event.target.closest("[data-row-action]")) return;
    onOpen();
  }

  return (
    <tr
      onClick={handleRowClick}
      className="cursor-pointer transition hover:bg-slate-50/60"
    >
      <td className="px-4 py-3">
        <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
          {policy.code}
        </span>
      </td>
      <td className="px-4 py-3">
        <p className="text-sm font-medium text-slate-900">{policy.title}</p>
        <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
          <span>{policy.department}</span>
          <span className="text-slate-300">•</span>
          <span>{policy.category}</span>
        </p>
      </td>
      <td className="px-4 py-3">
        <p className="inline-flex items-center gap-1 text-xs text-slate-700">
          <FaUserTie className="h-3 w-3 text-slate-400" aria-hidden="true" />
          {policy.owner}
        </p>
      </td>
      <td className="px-4 py-3 text-xs text-slate-700">
        {formatDate(policy.nextReview)}
      </td>
      <td className="px-4 py-3">
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700">
          <FaCircleExclamation className="h-3 w-3" aria-hidden="true" />
          {policy.days}d
        </span>
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${severityStyles[sev.tone]}`}
        >
          {sev.label}
        </span>
      </td>
      <td className="px-4 py-3 text-right" data-row-action>
        <div className="inline-flex items-center gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNotify();
            }}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 text-[11px] font-medium text-slate-700 transition hover:bg-slate-50"
            title="Notify the owner"
          >
            <FaBell className="h-3 w-3" aria-hidden="true" />
            Notify
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onExtend();
            }}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-cyan-200 bg-cyan-50 px-2 text-[11px] font-semibold text-cyan-700 transition hover:bg-cyan-100"
            title="Push the review date out by 30 days"
          >
            <FaCalendarPlus className="h-3 w-3" aria-hidden="true" />
            +30d
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpen();
            }}
            className="grid h-8 w-8 place-items-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label={`Open ${policy.code}`}
            title="Open"
          >
            <FaArrowRight className="h-3 w-3" aria-hidden="true" />
          </button>
        </div>
      </td>
    </tr>
  );
}

function EmptyState({ onClear, hadFilters }) {
  if (hadFilters) {
    return (
      <div className="grid place-items-center gap-2 px-6 py-16 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-500">
          <FaFilter className="h-5 w-5" aria-hidden="true" />
        </span>
        <p className="text-sm font-semibold text-slate-700">
          No matches in this slice
        </p>
        <button
          type="button"
          onClick={onClear}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-700 hover:underline"
        >
          <FaArrowsRotate className="h-3 w-3" aria-hidden="true" />
          Clear filters
        </button>
      </div>
    );
  }
  return (
    <div className="grid place-items-center gap-2 px-6 py-16 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
        <FaCheck className="h-5 w-5" aria-hidden="true" />
      </span>
      <p className="text-sm font-semibold text-slate-700">
        Nothing overdue right now
      </p>
      <p className="max-w-sm text-xs text-slate-500">
        Every policy is inside its review window. Reviews falling behind will
        show up here automatically.
      </p>
    </div>
  );
}

export default OverduePolicies;
