import { useEffect, useMemo, useState } from "react";
import {
  FaArrowRight,
  FaBuildingColumns,
  FaCalendarDays,
  FaCheck,
  FaCircleExclamation,
  FaClockRotateLeft,
  FaEye,
  FaKeyboard,
  FaListCheck,
  FaMagnifyingGlass,
  FaTags,
  FaTriangleExclamation,
  FaUserTie,
  FaXmark,
} from "react-icons/fa6";
import { mockPolicies, policyCategories, buildPolicyDetail } from "../../data";

const TODAY = new Date("2026-05-06T00:00:00+05:30");

function formatDate(value) {
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function daysBetween(target) {
  const t = new Date(target);
  const diffMs = t - TODAY;
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

function isInputTarget(event) {
  const t = event.target;
  if (!t) return false;
  const tag = (t.tagName || "").toLowerCase();
  return (
    tag === "input" ||
    tag === "textarea" ||
    tag === "select" ||
    t.isContentEditable
  );
}

function ReviewerQueue() {
  const initial = useMemo(
    () => mockPolicies.filter((p) => p.status === "In Review"),
    [],
  );

  const [policies, setPolicies] = useState(initial);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [focusIndex, setFocusIndex] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return policies.filter((p) => {
      if (categoryFilter !== "All" && p.category !== categoryFilter) return false;
      if (!term) return true;
      const hay = `${p.code} ${p.title} ${p.owner} ${p.department}`.toLowerCase();
      return hay.includes(term);
    });
  }, [policies, search, categoryFilter]);

  const safeFocus =
    filtered.length === 0 ? 0 : Math.min(focusIndex, filtered.length - 1);
  const focusedPolicy = filtered[safeFocus] ?? null;
  const focusedDetail = useMemo(
    () => (focusedPolicy ? buildPolicyDetail(focusedPolicy) : null),
    [focusedPolicy],
  );

  function toggleSelect(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelectedIds((prev) => {
      const allSelected = filtered.every((p) => prev.has(p.id));
      if (allSelected) {
        const next = new Set(prev);
        filtered.forEach((p) => next.delete(p.id));
        return next;
      }
      const next = new Set(prev);
      filtered.forEach((p) => next.add(p.id));
      return next;
    });
  }

  function showFeedback(tone, message) {
    setFeedback({ tone, message, id: Date.now() });
  }

  useEffect(() => {
    if (!feedback) return undefined;
    const handle = window.setTimeout(() => setFeedback(null), 2400);
    return () => window.clearTimeout(handle);
  }, [feedback]);

  function approveIds(ids) {
    if (ids.length === 0) return;
    setPolicies((prev) => prev.filter((p) => !ids.includes(p.id)));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.delete(id));
      return next;
    });
    showFeedback(
      "success",
      ids.length === 1
        ? "Approved 1 policy — moved to Approved status."
        : `Approved ${ids.length} policies.`,
    );
  }

  function rejectIds(ids, reason) {
    if (ids.length === 0) return;
    setPolicies((prev) => prev.filter((p) => !ids.includes(p.id)));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.delete(id));
      return next;
    });
    showFeedback(
      "warning",
      ids.length === 1
        ? `Sent back to draft${reason ? ` — “${reason}”` : ""}.`
        : `Sent ${ids.length} policies back to draft.`,
    );
  }

  function openDetail(id) {
    if (!id) return;
    window.location.href = `/policy-management?policy=${encodeURIComponent(id)}`;
  }

  function handleKeyDown(event) {
    if (rejectTarget) return;
    if (isInputTarget(event)) return;
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    if (filtered.length === 0) return;

    const key = event.key.toLowerCase();

    if (key === "j") {
      event.preventDefault();
      setFocusIndex(Math.min(filtered.length - 1, safeFocus + 1));
    } else if (key === "k") {
      event.preventDefault();
      setFocusIndex(Math.max(0, safeFocus - 1));
    } else if (key === "enter") {
      event.preventDefault();
      if (focusedPolicy) openDetail(focusedPolicy.id);
    } else if (key === "a") {
      event.preventDefault();
      if (focusedPolicy) approveIds([focusedPolicy.id]);
    } else if (key === "r") {
      event.preventDefault();
      if (focusedPolicy)
        setRejectTarget({ ids: [focusedPolicy.id], scope: "row" });
    } else if (key === " ") {
      event.preventDefault();
      if (focusedPolicy) toggleSelect(focusedPolicy.id);
    }
  }

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  const selectedArray = useMemo(
    () => filtered.filter((p) => selectedIds.has(p.id)).map((p) => p.id),
    [filtered, selectedIds],
  );

  function bulkApprove() {
    approveIds(selectedArray);
  }

  function bulkRejectStart() {
    if (selectedArray.length === 0) return;
    setRejectTarget({ ids: selectedArray, scope: "bulk" });
  }

  return (
    <div className="grid min-w-0 gap-5 max-[900px]:gap-4">
      <Header
        total={initial.length}
        remaining={policies.length}
        focused={focusedPolicy}
      />

      {feedback && (
        <FeedbackBar tone={feedback.tone} message={feedback.message} />
      )}

      <section className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid min-w-0 content-start gap-5">
          <Toolbar
            search={search}
            onSearch={setSearch}
            categoryFilter={categoryFilter}
            onCategoryFilter={setCategoryFilter}
            visibleCount={filtered.length}
            totalCount={policies.length}
            selectedCount={selectedArray.length}
            onApprove={bulkApprove}
            onReject={bulkRejectStart}
          />

          <QueueTable
            policies={filtered}
            selectedIds={selectedIds}
            focusIndex={safeFocus}
            onFocus={setFocusIndex}
            onToggleSelect={toggleSelect}
            onToggleSelectAll={toggleSelectAll}
            onOpen={openDetail}
            onApprove={(id) => approveIds([id])}
            onReject={(id) => setRejectTarget({ ids: [id], scope: "row" })}
          />

          <ShortcutHint />
        </div>

        <PreviewPane
          policy={focusedDetail}
          onOpen={() => focusedPolicy && openDetail(focusedPolicy.id)}
          onApprove={() => focusedPolicy && approveIds([focusedPolicy.id])}
          onReject={() =>
            focusedPolicy &&
            setRejectTarget({ ids: [focusedPolicy.id], scope: "row" })
          }
        />
      </section>

      {rejectTarget && (
        <RejectDialog
          count={rejectTarget.ids.length}
          onClose={() => setRejectTarget(null)}
          onConfirm={(reason) => {
            rejectIds(rejectTarget.ids, reason);
            setRejectTarget(null);
          }}
        />
      )}
    </div>
  );
}

function Header({ total, remaining, focused }) {
  const cleared = total - remaining;
  return (
    <section className="relative min-w-0 overflow-hidden rounded-3xl border border-white/80 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.10)] max-[520px]:rounded-2xl">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,#fef3c7_0%,transparent_55%),radial-gradient(circle_at_bottom_left,#fde68a55_0%,transparent_50%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -right-16 h-64 w-64 rounded-full bg-amber-200/40 blur-3xl"
      />

      <div className="relative grid gap-5 p-6 max-[520px]:p-4">
        <div className="min-w-0">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700 ring-1 ring-amber-200">
            <FaListCheck className="h-3 w-3" aria-hidden="true" />
            Reviewer queue
          </span>
          <h1 className="mt-2 text-xl font-semibold leading-tight text-slate-900 max-[520px]:text-lg">
            Policies waiting for approval
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Step through the list with{" "}
            <kbd className="rounded border border-slate-200 bg-white px-1 text-[10px] font-semibold text-slate-700">
              j
            </kbd>{" "}
            /{" "}
            <kbd className="rounded border border-slate-200 bg-white px-1 text-[10px] font-semibold text-slate-700">
              k
            </kbd>
            , approve with{" "}
            <kbd className="rounded border border-slate-200 bg-white px-1 text-[10px] font-semibold text-slate-700">
              A
            </kbd>
            , reject with{" "}
            <kbd className="rounded border border-slate-200 bg-white px-1 text-[10px] font-semibold text-slate-700">
              R
            </kbd>
            .
          </p>

          <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 max-w-2xl">
            <Stat label="Awaiting review" value={remaining} accent="text-amber-700" />
            <Stat label="Cleared today" value={cleared} accent="text-emerald-700" />
            <Stat
              label="Currently focused"
              value={focused?.code ?? "—"}
              accent="text-slate-900"
            />
            <Stat
              label="Total in cycle"
              value={total}
              accent="text-slate-900"
            />
          </dl>
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div className="rounded-xl border border-white/80 bg-white/80 p-3 shadow-sm backdrop-blur">
      <dt className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd
        className={`mt-1 truncate text-xl font-semibold leading-none ${accent}`}
      >
        {value}
      </dd>
    </div>
  );
}

function FeedbackBar({ tone, message }) {
  const styles =
    tone === "success"
      ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
      : tone === "warning"
        ? "bg-amber-50 text-amber-800 ring-amber-200"
        : "bg-slate-50 text-slate-800 ring-slate-200";
  const Icon = tone === "success" ? FaCheck : FaCircleExclamation;
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
  visibleCount,
  totalCount,
  selectedCount,
  onApprove,
  onReject,
}) {
  return (
    <div className="rounded-2xl border border-white/80 bg-white p-3 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
      <div className="flex flex-wrap items-center gap-2">
        <label className="relative min-w-[220px] flex-1">
          <span className="sr-only">Search queue</span>
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

        <span className="ml-auto text-[11px] text-slate-500">
          {visibleCount} of {totalCount}
        </span>

        <div className="flex items-center gap-2 border-l border-slate-100 pl-2">
          <button
            type="button"
            onClick={onReject}
            disabled={selectedCount === 0}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <FaXmark className="h-3 w-3" aria-hidden="true" />
            Reject selected{selectedCount > 0 ? ` (${selectedCount})` : ""}
          </button>
          <button
            type="button"
            onClick={onApprove}
            disabled={selectedCount === 0}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none disabled:hover:translate-y-0"
          >
            <FaCheck className="h-3 w-3" aria-hidden="true" />
            Approve selected{selectedCount > 0 ? ` (${selectedCount})` : ""}
          </button>
        </div>
      </div>
    </div>
  );
}

function QueueTable({
  policies,
  selectedIds,
  focusIndex,
  onFocus,
  onToggleSelect,
  onToggleSelectAll,
  onOpen,
  onApprove,
  onReject,
}) {
  const allSelected =
    policies.length > 0 && policies.every((p) => selectedIds.has(p.id));
  const someSelected =
    !allSelected && policies.some((p) => selectedIds.has(p.id));

  return (
    <section className="relative min-w-0 overflow-hidden rounded-3xl border border-white/80 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)] max-[520px]:rounded-2xl">
        {policies.length === 0 ? (
          <EmptyQueue />
        ) : (
          <div className="min-w-0 overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left text-xs">
              <thead className="bg-slate-50/70 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="w-10 px-4 py-2.5">
                    <input
                      type="checkbox"
                      aria-label="Select all"
                      checked={allSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = someSelected;
                      }}
                      onChange={onToggleSelectAll}
                      className="h-3.5 w-3.5 cursor-pointer accent-cyan-600"
                    />
                  </th>
                  <th className="px-4 py-2.5">Code</th>
                  <th className="px-4 py-2.5">Title</th>
                  <th className="px-4 py-2.5">Owner</th>
                  <th className="px-4 py-2.5">Submitted</th>
                  <th className="px-4 py-2.5">Review by</th>
                  <th className="w-32 px-4 py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {policies.map((policy, idx) => (
                  <QueueRow
                    key={policy.id}
                    policy={policy}
                    selected={selectedIds.has(policy.id)}
                    focused={idx === focusIndex}
                    onFocus={() => onFocus(idx)}
                    onToggleSelect={() => onToggleSelect(policy.id)}
                    onOpen={() => onOpen(policy.id)}
                    onApprove={() => onApprove(policy.id)}
                    onReject={() => onReject(policy.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
    </section>
  );
}

function QueueRow({
  policy,
  selected,
  focused,
  onFocus,
  onToggleSelect,
  onOpen,
  onApprove,
  onReject,
}) {
  const review = daysBetween(policy.nextReview);
  const reviewTone =
    review < 0
      ? "text-red-700"
      : review <= 14
        ? "text-amber-700"
        : "text-slate-700";

  function handleClick(event) {
    if (event.target.closest("[data-row-action]")) return;
    onFocus();
  }

  return (
    <tr
      onClick={handleClick}
      className={`cursor-pointer transition ${
        focused
          ? "bg-cyan-50/70 ring-1 ring-inset ring-cyan-200"
          : selected
            ? "bg-amber-50/40"
            : "hover:bg-slate-50/60"
      }`}
    >
      <td className="px-4 py-3" data-row-action>
        <input
          type="checkbox"
          aria-label={`Select ${policy.code}`}
          checked={selected}
          onChange={onToggleSelect}
          onClick={(e) => e.stopPropagation()}
          className="h-3.5 w-3.5 cursor-pointer accent-cyan-600"
        />
      </td>
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
          <span>{policy.version}</span>
        </p>
      </td>
      <td className="px-4 py-3 text-xs text-slate-700">{policy.owner}</td>
      <td className="px-4 py-3 text-xs text-slate-700">
        {formatDate(policy.lastUpdated)}
      </td>
      <td className={`px-4 py-3 text-xs font-medium ${reviewTone}`}>
        {formatDate(policy.nextReview)}
        {review < 0 && (
          <span className="ml-1 text-[10px] font-semibold">
            ({Math.abs(review)}d late)
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-right" data-row-action>
        <div className="inline-flex items-center gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onReject();
            }}
            className="grid h-7 w-7 place-items-center rounded-md text-red-600 transition hover:bg-red-50"
            aria-label={`Reject ${policy.code}`}
            title="Reject"
          >
            <FaXmark className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onApprove();
            }}
            className="grid h-7 w-7 place-items-center rounded-md text-emerald-700 transition hover:bg-emerald-50"
            aria-label={`Approve ${policy.code}`}
            title="Approve"
          >
            <FaCheck className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpen();
            }}
            className="grid h-7 w-7 place-items-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label={`Open ${policy.code}`}
            title="Open"
          >
            <FaArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      </td>
    </tr>
  );
}

function EmptyQueue() {
  return (
    <div className="grid place-items-center gap-2 px-6 py-16 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
        <FaCheck className="h-5 w-5" aria-hidden="true" />
      </span>
      <p className="text-sm font-semibold text-slate-700">Queue is clear</p>
      <p className="max-w-sm text-xs text-slate-500">
        Nothing waiting for approval. New submissions land here automatically.
      </p>
    </div>
  );
}

function ShortcutHint() {
  const items = [
    { keys: ["j"], label: "Next" },
    { keys: ["k"], label: "Previous" },
    { keys: ["Space"], label: "Tick" },
    { keys: ["Enter"], label: "Open" },
    { keys: ["A"], label: "Approve" },
    { keys: ["R"], label: "Reject" },
  ];
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-3 py-2 text-[11px] text-slate-500">
      <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700">
        <FaKeyboard className="h-3 w-3" aria-hidden="true" />
        Shortcuts
      </span>
      {items.map((item) => (
        <span key={item.label} className="inline-flex items-center gap-1">
          {item.keys.map((k) => (
            <kbd
              key={k}
              className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-700"
            >
              {k}
            </kbd>
          ))}
          <span className="text-slate-500">{item.label}</span>
        </span>
      ))}
    </div>
  );
}

function PreviewPane({ policy, onOpen, onApprove, onReject }) {
  if (!policy) {
    return (
      <aside className="rounded-3xl border border-white/80 bg-white p-5 text-center shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
        <span className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-500">
          <FaEye className="h-4 w-4" aria-hidden="true" />
        </span>
        <p className="mt-2 text-sm font-semibold text-slate-700">
          Nothing to preview
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Pick a row to see its summary, key clauses, and the latest version
          here.
        </p>
      </aside>
    );
  }

  const facts = [
    { label: "Owner", value: policy.owner, Icon: FaUserTie },
    { label: "Department", value: policy.department, Icon: FaBuildingColumns },
    {
      label: "Review by",
      value: formatDate(policy.nextReview),
      Icon: FaCalendarDays,
    },
    {
      label: "Submitted",
      value: formatDate(policy.lastUpdated),
      Icon: FaClockRotateLeft,
    },
  ];

  const latestVersion = policy.detail?.versions?.[0];

  return (
    <aside className="grid min-w-0 content-start gap-4">
      <section className="rounded-3xl border border-white/80 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] max-[520px]:rounded-2xl max-[520px]:p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-md bg-slate-900 px-2 py-0.5 text-[11px] font-semibold text-white">
            {policy.code}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-200">
            In Review
          </span>
        </div>
        <h2 className="mt-2 text-base font-semibold leading-snug text-slate-900">
          {policy.title}
        </h2>

        <dl className="mt-4 grid gap-3">
          {facts.map((fact) => {
            const Icon = fact.Icon;
            return (
              <div
                key={fact.label}
                className="grid grid-cols-[24px_minmax(0,1fr)] items-start gap-3"
              >
                <span className="mt-0.5 grid h-6 w-6 place-items-center rounded-md bg-slate-100 text-slate-500">
                  <Icon className="h-3 w-3" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <dt className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                    {fact.label}
                  </dt>
                  <dd className="mt-0.5 text-xs font-medium text-slate-900">
                    {fact.value}
                  </dd>
                </div>
              </div>
            );
          })}
        </dl>

        {policy.detail?.summary && (
          <div className="mt-4 border-t border-slate-100 pt-3">
            <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
              Summary
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-700">
              {policy.detail.summary}
            </p>
          </div>
        )}

        {latestVersion && (
          <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
            <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
              Latest version
            </p>
            <p className="mt-1 text-xs font-semibold text-slate-900">
              {latestVersion.version} · {latestVersion.uploadedBy}
            </p>
            <p className="mt-1 line-clamp-3 text-[11px] leading-5 text-slate-600">
              {latestVersion.changeNote}
            </p>
          </div>
        )}

        {policy.accreditationTags?.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-1.5">
            <FaTags className="h-3 w-3 text-slate-400" aria-hidden="true" />
            {policy.accreditationTags.map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-cyan-50 px-2 py-0.5 text-[11px] font-semibold text-cyan-700 ring-1 ring-cyan-200"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-5 grid gap-2">
          <button
            type="button"
            onClick={onApprove}
            className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-500"
          >
            <FaCheck className="h-3 w-3" aria-hidden="true" />
            Approve {policy.code}
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onReject}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 text-xs font-semibold text-red-700 transition hover:bg-red-50"
            >
              <FaXmark className="h-3 w-3" aria-hidden="true" />
              Reject
            </button>
            <button
              type="button"
              onClick={onOpen}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Open detail
              <FaArrowRight className="h-3 w-3" aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>
    </aside>
  );
}

function RejectDialog({ count, onClose, onConfirm }) {
  const [reason, setReason] = useState("");

  useEffect(() => {
    function onKey(event) {
      if (event.key === "Escape") onClose?.();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 px-4 py-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reject-dialog-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className="grid w-full max-w-md gap-4 rounded-3xl border border-white/80 bg-white p-5 shadow-[0_30px_80px_rgba(15,23,42,0.25)] max-[520px]:rounded-2xl">
        <header className="grid gap-1">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-700 ring-1 ring-red-200">
            <FaTriangleExclamation className="h-3 w-3" aria-hidden="true" />
            Send back to draft
          </span>
          <h2
            id="reject-dialog-title"
            className="text-base font-semibold text-slate-900"
          >
            Reject {count === 1 ? "this policy" : `${count} policies`}?
          </h2>
          <p className="text-xs text-slate-500">
            The author will see your note in the activity log.
          </p>
        </header>

        <label className="grid gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">
            Reason (optional)
          </span>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="e.g. Tighten escalation triggers in section 4."
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs leading-5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
          />
        </label>

        <footer className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 items-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(reason.trim())}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-red-600 px-3 text-xs font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-red-500"
          >
            <FaXmark className="h-3 w-3" aria-hidden="true" />
            Send back
          </button>
        </footer>
      </div>
    </div>
  );
}

export default ReviewerQueue;
