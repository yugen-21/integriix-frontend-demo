import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  FaCircleCheck,
  FaCircleExclamation,
  FaEllipsisVertical,
  FaFileContract,
  FaFilter,
  FaMagnifyingGlass,
  FaPlus,
  FaTriangleExclamation,
  FaWandMagicSparkles,
} from "react-icons/fa6";
import { policyCategories, policyStatuses } from "../../../data";

const TODAY = new Date("2026-05-06T00:00:00+05:30");
const PAGE_SIZE = 8;

const statusStyles = {
  Draft: "bg-slate-100 text-slate-700 ring-slate-200",
  "In Review": "bg-amber-50 text-amber-700 ring-amber-200",
  Approved: "bg-cyan-50 text-cyan-700 ring-cyan-200",
  Active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Archived: "bg-slate-100 text-slate-500 ring-slate-200",
};

function formatDate(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function isOverdue(dateValue) {
  if (!dateValue) return false;
  return new Date(dateValue) < TODAY;
}

function daysUntil(dateValue) {
  if (!dateValue) return null;
  const target = new Date(dateValue);
  const diffMs = target - TODAY;
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

function PolicyList({
  policies,
  onSelect,
  onCreate,
  onGenerate,
  onEdit,
  onDelete,
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState(null);

  const filteredPolicies = useMemo(() => {
    const term = search.trim().toLowerCase();

    return policies.filter((policy) => {
      if (statusFilter !== "All" && policy.status !== statusFilter)
        return false;
      if (categoryFilter !== "All" && policy.category !== categoryFilter)
        return false;
      if (overdueOnly && !isOverdue(policy.nextReview)) return false;

      if (term) {
        const haystack = [
          policy.code,
          policy.title,
          policy.owner,
          policy.department,
        ]
          .join(" ")
          .toLowerCase();

        if (!haystack.includes(term)) return false;
      }

      return true;
    });
  }, [policies, search, statusFilter, categoryFilter, overdueOnly]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredPolicies.length / PAGE_SIZE),
  );
  const safePage = Math.min(page, totalPages);
  const pageItems = filteredPolicies.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const overdueCount = policies.filter((p) => isOverdue(p.nextReview)).length;
  const activeCount = policies.filter((p) => p.status === "Active").length;
  const inReviewCount = policies.filter((p) => p.status === "In Review").length;

  function resetFilters() {
    setSearch("");
    setStatusFilter("All");
    setCategoryFilter("All");
    setOverdueOnly(false);
    setPage(1);
  }

  function handleFilterChange(setter) {
    return (value) => {
      setter(value);
      setPage(1);
    };
  }

  return (
    <div className="grid min-w-0 gap-5 max-[900px]:gap-4">
      <PolicyHeader
        total={policies.length}
        active={activeCount}
        inReview={inReviewCount}
        overdue={overdueCount}
      />

      <section className="relative min-w-0 overflow-hidden rounded-3xl border border-white/80 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)] max-[520px]:rounded-2xl">
        <div className="border-b border-slate-100 p-4 max-[520px]:p-3">
          <div className="flex flex-wrap items-center gap-2">
            <label className="relative min-w-[220px] flex-1">
              <span className="sr-only">Search policies</span>
              <FaMagnifyingGlass
                className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                type="search"
                value={search}
                onChange={(e) => handleFilterChange(setSearch)(e.target.value)}
                placeholder="Search by code, title, owner, department"
                className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/80 pl-9 pr-3 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-500/20"
              />
            </label>

            <select
              value={statusFilter}
              onChange={(e) =>
                handleFilterChange(setStatusFilter)(e.target.value)
              }
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
            >
              <option value="All">All statuses</option>
              {policyStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>

            <select
              value={categoryFilter}
              onChange={(e) =>
                handleFilterChange(setCategoryFilter)(e.target.value)
              }
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
            >
              <option value="All">All categories</option>
              {policyCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => handleFilterChange(setOverdueOnly)(!overdueOnly)}
              className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition ${
                overdueOnly
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              <FaTriangleExclamation className="h-3 w-3" aria-hidden="true" />
              Overdue only
            </button>

            {(search ||
              statusFilter !== "All" ||
              categoryFilter !== "All" ||
              overdueOnly) && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-slate-500 transition hover:text-slate-700"
              >
                Clear
              </button>
            )}

            <span className="ml-auto text-[11px] text-slate-500">
              {filteredPolicies.length} of {policies.length} policies
            </span>

            <button
              type="button"
              onClick={onGenerate}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-cyan-200 bg-cyan-50 px-3 text-xs font-semibold text-cyan-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-cyan-100"
            >
              <FaWandMagicSparkles className="h-3 w-3" aria-hidden="true" />
              Generate policy
            </button>

            <button
              type="button"
              onClick={onCreate}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-slate-900 px-3 text-xs font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800"
            >
              <FaPlus className="h-3 w-3" aria-hidden="true" />
              New policy
            </button>
          </div>
        </div>

        <div className="min-w-0 overflow-x-auto">
          <table className="w-full min-w-[920px] border-collapse text-left text-xs">
            <thead className="bg-slate-50/70 text-[10px] font-medium uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2.5">Code</th>
                <th className="px-4 py-2.5">Title</th>
                <th className="px-4 py-2.5">Category</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Owner</th>
                <th className="px-4 py-2.5">Next review</th>
                <th className="w-12 px-4 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pageItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <div className="grid place-items-center gap-2 text-slate-400">
                      <FaFilter className="h-5 w-5" aria-hidden="true" />
                      <p className="text-sm font-medium text-slate-600">
                        No policies match your filters
                      </p>
                      <button
                        type="button"
                        onClick={resetFilters}
                        className="text-xs font-medium text-cyan-700 hover:underline"
                      >
                        Clear filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                pageItems.map((policy) => (
                  <PolicyRow
                    key={policy.id}
                    policy={policy}
                    isMenuOpen={openMenuId === policy.id}
                    onToggleMenu={() =>
                      setOpenMenuId((current) =>
                        current === policy.id ? null : policy.id,
                      )
                    }
                    onCloseMenu={() => setOpenMenuId(null)}
                    onSelect={onSelect}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
          <p>
            Showing{" "}
            <span className="font-medium text-slate-700">
              {pageItems.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1}–
              {(safePage - 1) * PAGE_SIZE + pageItems.length}
            </span>{" "}
            of{" "}
            <span className="font-medium text-slate-700">
              {filteredPolicies.length}
            </span>
          </p>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="inline-flex h-8 items-center rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPage(p)}
                className={`inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-xs font-medium transition ${
                  p === safePage
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {p}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="inline-flex h-8 items-center rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function PolicyHeader({ total, active, inReview, overdue }) {
  const stats = [
    { label: "Total policies", value: total, accent: "text-slate-900" },
    { label: "Active", value: active, accent: "text-emerald-700" },
    { label: "In review", value: inReview, accent: "text-amber-700" },
    { label: "Overdue review", value: overdue, accent: "text-red-700" },
  ];

  return (
    <section className="relative min-w-0 overflow-hidden rounded-3xl border border-white/80 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.10)] max-[520px]:rounded-2xl">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,#cffafe_0%,transparent_55%),radial-gradient(circle_at_bottom_left,#e0f2fe_0%,transparent_50%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -right-16 h-64 w-64 rounded-full bg-cyan-200/40 blur-3xl"
      />

      <div className="relative grid gap-5 p-6 max-[520px]:p-4">
        <div className="min-w-0">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-cyan-700 ring-1 ring-cyan-200">
            <FaFileContract className="h-3 w-3" aria-hidden="true" />
            Policy & Document Management
          </span>
          <h1 className="mt-2 text-xl font-semibold leading-tight text-slate-900 max-[520px]:text-lg">
            Policy register
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Single source of truth for every policy, version, and review cycle.
          </p>

          <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 max-w-2xl">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-white/80 bg-white/80 p-3 shadow-sm backdrop-blur"
              >
                <dt className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                  {stat.label}
                </dt>
                <dd
                  className={`mt-1 text-xl font-semibold leading-none ${stat.accent}`}
                >
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

function PolicyRow({
  policy,
  isMenuOpen,
  onToggleMenu,
  onCloseMenu,
  onSelect,
  onEdit,
  onDelete,
}) {
  const overdue = isOverdue(policy.nextReview);
  const days = daysUntil(policy.nextReview);
  const dueSoon = !overdue && days != null && days <= 30;

  function handleRowClick(event) {
    if (event.target.closest("[data-row-action]")) return;
    onSelect?.(policy.id);
  }

  function handleRowKeyDown(event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect?.(policy.id);
    }
  }

  return (
    <tr
      className="group cursor-pointer transition hover:bg-slate-50/60 focus-within:bg-slate-50/60"
      onClick={handleRowClick}
      onKeyDown={handleRowKeyDown}
      tabIndex={0}
      role="link"
      aria-label={`Open ${policy.code} ${policy.title}`}
    >
      <td className="px-4 py-3">
        <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
          {policy.code}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-900 group-hover:text-cyan-700">
            {policy.title}
          </p>
          <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
            <span>{policy.department}</span>
            <span className="text-slate-300">•</span>
            <span>{policy.version}</span>
            {policy.accreditationTags?.length > 0 && (
              <>
                <span className="text-slate-300">•</span>
                <span className="flex gap-1">
                  {policy.accreditationTags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded bg-cyan-50 px-1.5 py-0.5 text-[10px] font-medium text-cyan-700 ring-1 ring-cyan-200"
                    >
                      {tag}
                    </span>
                  ))}
                </span>
              </>
            )}
          </p>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className="text-xs text-slate-700">{policy.category}</span>
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${
            statusStyles[policy.status] ?? statusStyles.Draft
          }`}
        >
          {policy.status === "Active" && (
            <FaCircleCheck className="h-2.5 w-2.5" aria-hidden="true" />
          )}
          {policy.status}
        </span>
      </td>
      <td className="px-4 py-3">
        <p className="text-xs text-slate-700">{policy.owner}</p>
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-col">
          <span
            className={`text-xs font-medium ${
              overdue
                ? "text-red-700"
                : dueSoon
                  ? "text-amber-700"
                  : "text-slate-700"
            }`}
          >
            {formatDate(policy.nextReview)}
          </span>
          {overdue && days != null && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-700">
              <FaCircleExclamation className="h-2.5 w-2.5" aria-hidden="true" />
              Overdue {Math.abs(days)}d
            </span>
          )}
          {dueSoon && (
            <span className="text-[10px] font-medium text-amber-700">
              Due in {days}d
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-right" data-row-action>
        <RowActionMenu
          isOpen={isMenuOpen}
          onToggle={onToggleMenu}
          onClose={onCloseMenu}
          policy={policy}
          onEdit={onEdit}
          onSelect={onSelect}
          onDelete={onDelete}
        />
      </td>
    </tr>
  );
}

function RowActionMenu({
  isOpen,
  onToggle,
  onClose,
  policy,
  onEdit,
  onSelect,
  onDelete,
}) {
  const triggerRef = useRef(null);
  const [coords, setCoords] = useState(null);

  // Position the popover under the trigger and right-align it. Re-position
  // on scroll/resize so the menu tracks the row even if the user scrolls
  // the table while it's open. Rendered through a portal so the table's
  // `overflow-x-auto` parent doesn't clip it.
  useLayoutEffect(() => {
    if (!isOpen) return undefined;
    function place() {
      const node = triggerRef.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      const MENU_WIDTH = 160;
      // Left-align under the trigger, clamp inside viewport. The 3-dot icon
      // sits in the right-most column, so clamping naturally pulls the menu
      // back inside the viewport when it would overflow.
      const left = Math.max(
        8,
        Math.min(rect.left, window.innerWidth - MENU_WIDTH - 8),
      );
      setCoords({ top: rect.bottom + 4, left, width: MENU_WIDTH });
    }
    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    function onKey(e) {
      if (e.key === "Escape") onClose?.();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  return (
    <div className="inline-block">
      <button
        ref={triggerRef}
        type="button"
        onClick={(e) => {
          // Defensive: the row's onClick already bails when the click target
          // sits inside an element with [data-row-action], but stopping
          // propagation here makes the contract explicit and survives any
          // future refactor that drops that ancestor attribute.
          e.stopPropagation();
          onToggle?.();
        }}
        className="grid h-7 w-7 place-items-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
        aria-label={`Actions for ${policy.code}`}
        aria-expanded={isOpen}
      >
        <FaEllipsisVertical className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
      {isOpen &&
        coords &&
        typeof document !== "undefined" &&
        createPortal(
          // React portals re-bubble events through their virtual-tree parent
          // (the row's <tr onClick>), so clicks on menu items would still
          // trigger handleRowClick if we didn't stop them here. Wrapping in
          // a stopPropagation handler covers every interactive child without
          // having to plumb the call onto each menu item.
          <div onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              aria-label="Close menu"
              onClick={onClose}
              className="fixed inset-0 z-40 cursor-default"
            />
            <div
              role="menu"
              style={{
                position: "fixed",
                top: coords.top,
                left: coords.left,
                width: coords.width,
              }}
              className="z-50 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg"
            >
              <button
                type="button"
                role="menuitem"
                className="block w-full px-3 py-2 text-left text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                onClick={() => {
                  onClose?.();
                  onEdit?.(policy.id);
                }}
              >
                Edit
              </button>
              <button
                type="button"
                role="menuitem"
                className="block w-full px-3 py-2 text-left text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                onClick={() => {
                  onClose?.();
                  // Open detail page on the Activity tab.
                  onSelect?.(policy.id, "activity");
                }}
              >
                View history
              </button>
              <div className="border-t border-slate-100" />
              <button
                type="button"
                role="menuitem"
                className="block w-full px-3 py-2 text-left text-xs font-medium text-red-600 transition hover:bg-red-50"
                onClick={() => {
                  onClose?.();
                  onDelete?.(policy.id, policy.code);
                }}
              >
                Delete
              </button>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

export default PolicyList;
