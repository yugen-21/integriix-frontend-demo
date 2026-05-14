import { useMemo, useState } from "react";
import {
  FaCircleCheck,
  FaCircleExclamation,
  FaClipboardCheck,
  FaCloudArrowUp,
  FaFilter,
  FaMagnifyingGlass,
  FaSort,
  FaSortDown,
  FaSortUp,
} from "react-icons/fa6";
import { evidenceDepartments } from "../../../data";
import { uploadAverageCompliance } from "../../../store/operativeEffectivenessSlice";

const PAGE_SIZE = 10;

const STATUS_OPTIONS = [
  { value: "All", label: "All statuses" },
  { value: "pending", label: "Pending review" },
  { value: "accepted", label: "Accepted" },
  { value: "overridden", label: "Overridden" },
];

const COMPLIANCE_BANDS = [
  { value: "All", label: "All compliance bands" },
  { value: "high", label: "Strong · ≥ 90%" },
  { value: "medium", label: "Moderate · 70 – 89%" },
  { value: "low", label: "Weak · < 70%" },
];

const DATE_RANGES = [
  { value: "All", label: "Any time" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
];

const STATUS_STYLES = {
  pending: "bg-amber-50 text-amber-700 ring-amber-200",
  accepted: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  overridden: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  rejected: "bg-slate-100 text-slate-500 ring-slate-200",
};

const STATUS_LABEL = {
  pending: "Pending",
  accepted: "Accepted",
  overridden: "Overridden",
  rejected: "Rejected",
};

const FILE_TYPE_STYLES = {
  csv: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  pdf: "bg-rose-50 text-rose-700 ring-rose-200",
  xlsx: "bg-cyan-50 text-cyan-700 ring-cyan-200",
  image: "bg-indigo-50 text-indigo-700 ring-indigo-200",
};

function complianceBandClass(pct) {
  if (pct == null) return "bg-slate-50 text-slate-500 ring-slate-200";
  if (pct >= 90) return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  if (pct >= 70) return "bg-amber-50 text-amber-700 ring-amber-200";
  return "bg-rose-50 text-rose-700 ring-rose-200";
}

function matchesComplianceBand(pct, band) {
  if (band === "All" || pct == null) return band === "All";
  if (band === "high") return pct >= 90;
  if (band === "medium") return pct >= 70 && pct < 90;
  if (band === "low") return pct < 70;
  return true;
}

function matchesDateRange(uploadedAtIso, range) {
  if (range === "All" || !uploadedAtIso) return range === "All";
  const days = { "7d": 7, "30d": 30, "90d": 90 }[range];
  if (!days) return true;
  const now = Date.now();
  const then = new Date(uploadedAtIso).getTime();
  return now - then <= days * 24 * 60 * 60 * 1000;
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(iso));
}

function relativeDate(iso) {
  if (!iso) return "—";
  const diff = (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24);
  const days = Math.round(diff);
  if (days <= 0) return "today";
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  const months = Math.round(days / 30);
  return months === 1 ? "1 month ago" : `${months} months ago`;
}

const COLUMNS = [
  { key: "fileName", label: "File", align: "left" },
  { key: "uploadedBy", label: "Uploaded by", align: "left" },
  { key: "uploadedAt", label: "Date", align: "left" },
  { key: "department", label: "Department", align: "left" },
  { key: "matchedPolicies", label: "Policies", align: "center" },
  { key: "compliance", label: "Compliance", align: "center" },
  { key: "status", label: "Status", align: "left" },
  { key: "action", label: "", align: "right" },
];

function compare(a, b, key) {
  if (key === "matchedPolicies") {
    return (a.matchedPoliciesCount ?? 0) - (b.matchedPoliciesCount ?? 0);
  }
  if (key === "compliance") {
    return (a.compliance ?? -1) - (b.compliance ?? -1);
  }
  if (key === "uploadedAt") {
    return new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
  }
  const av = a[key];
  const bv = b[key];
  if (typeof av === "number" && typeof bv === "number") return av - bv;
  return String(av ?? "").localeCompare(String(bv ?? ""));
}

function SortIcon({ active, dir }) {
  if (!active) return <FaSort className="h-2.5 w-2.5 text-slate-300" />;
  return dir === "asc" ? (
    <FaSortUp className="h-2.5 w-2.5 text-slate-700" />
  ) : (
    <FaSortDown className="h-2.5 w-2.5 text-slate-700" />
  );
}

function Dashboard({ uploads, onSelect, onUpload }) {
  const [sort, setSort] = useState({ key: "uploadedAt", dir: "desc" });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [complianceBandFilter, setComplianceBandFilter] = useState("All");
  const [dateRangeFilter, setDateRangeFilter] = useState("All");

  // Pre-derive each row's display fields once so sort/filter/render share the
  // same shape and we don't recompute on every cell.
  const decorated = useMemo(() => {
    return uploads.map((u) => ({
      ...u,
      matchedPoliciesCount: u.verdict?.policyResults?.length ?? 0,
      matchedPolicyCodes:
        u.verdict?.policyResults?.map((p) => p.policyCode) ?? [],
      compliance: uploadAverageCompliance(u),
    }));
  }, [uploads]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return decorated.filter((u) => {
      if (departmentFilter !== "All" && u.department !== departmentFilter)
        return false;
      if (statusFilter !== "All" && u.status !== statusFilter) return false;
      if (!matchesComplianceBand(u.compliance, complianceBandFilter)) return false;
      if (!matchesDateRange(u.uploadedAt, dateRangeFilter)) return false;
      if (term) {
        const haystack = [
          u.fileName,
          u.uploadedBy,
          u.department,
          u.period,
          u.aiDescription,
          ...u.matchedPolicyCodes,
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  }, [
    decorated,
    search,
    departmentFilter,
    statusFilter,
    complianceBandFilter,
    dateRangeFilter,
  ]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      const cmp = compare(a, b, sort.key);
      return sort.dir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [filtered, sort]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = sorted.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  // Stat-card numbers operate on the *unfiltered* set so the headline never
  // misleads when the user is mid-filter.
  const pendingCount = decorated.filter((u) => u.status === "pending").length;
  const acceptedCount = decorated.filter((u) => u.status === "accepted").length;
  const policiesWithoutEvidenceCount = countPoliciesWithoutEvidence(decorated);
  const avgCompliance = averageCompliance(decorated);

  const hasActiveFilters =
    Boolean(search) ||
    departmentFilter !== "All" ||
    statusFilter !== "All" ||
    complianceBandFilter !== "All" ||
    dateRangeFilter !== "All";

  function toggleSort(key) {
    if (key === "action") return;
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" },
    );
    setPage(1);
  }

  function update(setter) {
    return (value) => {
      setter(value);
      setPage(1);
    };
  }

  function resetFilters() {
    setSearch("");
    setDepartmentFilter("All");
    setStatusFilter("All");
    setComplianceBandFilter("All");
    setDateRangeFilter("All");
    setPage(1);
  }

  return (
    <div className="grid min-w-0 gap-5 max-[900px]:gap-4">
      <Header
        total={decorated.length}
        pending={pendingCount}
        accepted={acceptedCount}
        avgCompliance={avgCompliance}
        policiesWithoutEvidence={policiesWithoutEvidenceCount}
        onUpload={onUpload}
      />

      <section className="relative min-w-0 overflow-hidden rounded-3xl border border-white/80 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)] max-[520px]:rounded-2xl">
        <div className="border-b border-slate-100 p-4 max-[520px]:p-3">
          <div className="flex flex-wrap items-center gap-2">
            <label className="relative min-w-[220px] flex-1">
              <span className="sr-only">Search evidence uploads</span>
              <FaMagnifyingGlass
                className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                type="search"
                value={search}
                onChange={(e) => update(setSearch)(e.target.value)}
                placeholder="Search by file, uploader, department, description, policy code"
                className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/80 pl-9 pr-3 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-500/20"
              />
            </label>

            <select
              value={departmentFilter}
              onChange={(e) => update(setDepartmentFilter)(e.target.value)}
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
            >
              <option value="All">All departments</option>
              {evidenceDepartments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => update(setStatusFilter)(e.target.value)}
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>

            <select
              value={complianceBandFilter}
              onChange={(e) => update(setComplianceBandFilter)(e.target.value)}
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
            >
              {COMPLIANCE_BANDS.map((b) => (
                <option key={b.value} value={b.value}>
                  {b.label}
                </option>
              ))}
            </select>

            <select
              value={dateRangeFilter}
              onChange={(e) => update(setDateRangeFilter)(e.target.value)}
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
            >
              {DATE_RANGES.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-slate-500 transition hover:text-slate-700"
              >
                Clear
              </button>
            )}

            <span className="ml-auto text-[11px] text-slate-500">
              {sorted.length} of {decorated.length} upload
              {decorated.length === 1 ? "" : "s"}
            </span>
          </div>
        </div>

        <div className="min-w-0 overflow-x-auto">
          <table className="w-full min-w-[1080px] border-collapse text-left text-xs">
            <thead className="bg-slate-50/70 text-[10px] font-medium uppercase tracking-wide text-slate-500">
              <tr>
                {COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    className={`px-4 py-2.5 ${
                      col.align === "center"
                        ? "text-center"
                        : col.align === "right"
                          ? "text-right"
                          : "text-left"
                    }`}
                  >
                    {col.key === "action" ? null : (
                      <button
                        type="button"
                        onClick={() => toggleSort(col.key)}
                        className={`inline-flex items-center gap-1 transition hover:text-slate-700 ${
                          col.align === "center" ? "mx-auto" : ""
                        }`}
                      >
                        {col.label}
                        <SortIcon active={sort.key === col.key} dir={sort.dir} />
                      </button>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pageItems.length === 0 ? (
                <tr>
                  <td colSpan={COLUMNS.length} className="px-4 py-12 text-center">
                    <div className="grid place-items-center gap-2 text-slate-400">
                      <FaFilter className="h-5 w-5" aria-hidden="true" />
                      <p className="text-sm font-medium text-slate-600">
                        {hasActiveFilters
                          ? "No uploads match your filters"
                          : "No evidence uploaded yet"}
                      </p>
                      {hasActiveFilters && (
                        <button
                          type="button"
                          onClick={resetFilters}
                          className="text-xs font-medium text-cyan-700 hover:underline"
                        >
                          Clear filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                pageItems.map((upload) => (
                  <UploadRow
                    key={upload.id}
                    upload={upload}
                    onSelect={onSelect}
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
            of <span className="font-medium text-slate-700">{sorted.length}</span>
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

function Header({
  total,
  pending,
  accepted,
  avgCompliance,
  policiesWithoutEvidence,
  onUpload,
}) {
  const stats = [
    { label: "Total uploads", value: total, accent: "text-slate-900" },
    { label: "Pending review", value: pending, accent: "text-amber-700" },
    { label: "Accepted", value: accepted, accent: "text-emerald-700" },
    {
      label: "Avg. compliance",
      value: avgCompliance == null ? "—" : `${avgCompliance}%`,
      accent: "text-cyan-700",
    },
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
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-cyan-700 ring-1 ring-cyan-200">
              <FaClipboardCheck className="h-3 w-3" aria-hidden="true" />
              Operative Effectiveness
            </span>
            <h1 className="mt-2 text-xl font-semibold leading-tight text-slate-900 max-[520px]:text-lg">
              Are policies actually being followed?
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              Upload evidence, let AI verify compliance, lock in verdicts —
              feeds Control Effectiveness back to the Risk Register.{" "}
              {policiesWithoutEvidence > 0 && (
                <span className="font-medium text-amber-700">
                  {policiesWithoutEvidence} polic
                  {policiesWithoutEvidence === 1 ? "y has" : "ies have"} no
                  evidence yet.
                </span>
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={onUpload}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-4 text-xs font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800"
          >
            <FaCloudArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
            Upload evidence
          </button>
        </div>

        <dl className="grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
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
    </section>
  );
}

function UploadRow({ upload, onSelect }) {
  const fileExt = (upload.fileType ?? "").toLowerCase();
  const fileTypeClass =
    FILE_TYPE_STYLES[fileExt] ?? "bg-slate-100 text-slate-700 ring-slate-200";
  const compliance = upload.compliance;
  const statusClass = STATUS_STYLES[upload.status] ?? STATUS_STYLES.pending;

  const actionLabel = upload.status === "pending" ? "Review" : "View";

  function handleRowClick() {
    onSelect?.(upload.id);
  }

  function handleRowKeyDown(event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect?.(upload.id);
    }
  }

  return (
    <tr
      className="group cursor-pointer transition hover:bg-slate-50/60 focus-within:bg-slate-50/60"
      onClick={handleRowClick}
      onKeyDown={handleRowKeyDown}
      tabIndex={0}
      role="link"
      aria-label={`Open verdict for ${upload.fileName}`}
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {fileExt && (
            <span
              className={`inline-flex h-5 items-center rounded px-1.5 text-[9px] font-bold uppercase tracking-wide ring-1 ${fileTypeClass}`}
            >
              {fileExt}
            </span>
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-900 group-hover:text-cyan-700">
              {upload.fileName}
            </p>
            <p className="text-[11px] text-slate-500">{upload.period}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-xs text-slate-700">{upload.uploadedBy}</td>
      <td className="px-4 py-3">
        <p className="text-xs text-slate-700">{formatDate(upload.uploadedAt)}</p>
        <p className="text-[11px] text-slate-400">
          {relativeDate(upload.uploadedAt)}
        </p>
      </td>
      <td className="px-4 py-3 text-xs text-slate-700">{upload.department}</td>
      <td className="px-4 py-3 text-center">
        <span
          className="inline-flex h-6 min-w-[3.5rem] items-center justify-center rounded-md bg-slate-100 px-2 text-[11px] font-semibold text-slate-700"
          title={upload.matchedPolicyCodes.join(", ") || "No policies matched"}
        >
          {upload.matchedPoliciesCount}{" "}
          {upload.matchedPoliciesCount === 1 ? "policy" : "policies"}
        </span>
      </td>
      <td className="px-4 py-3 text-center">
        {compliance == null ? (
          <span className="text-xs text-slate-400">—</span>
        ) : (
          <span
            className={`inline-flex h-6 min-w-[3rem] items-center justify-center rounded-md px-2 text-[11px] font-bold ring-1 ${complianceBandClass(
              compliance,
            )}`}
          >
            {compliance}%
          </span>
        )}
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${statusClass}`}
        >
          {upload.status === "accepted" && (
            <FaCircleCheck className="h-2.5 w-2.5" aria-hidden="true" />
          )}
          {upload.status === "overridden" && (
            <FaCircleExclamation className="h-2.5 w-2.5" aria-hidden="true" />
          )}
          {STATUS_LABEL[upload.status] ?? upload.status}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect?.(upload.id);
          }}
          className="inline-flex h-8 items-center rounded-md border border-slate-200 bg-white px-3 text-[11px] font-medium text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700"
        >
          {actionLabel}
        </button>
      </td>
    </tr>
  );
}

function countPoliciesWithoutEvidence(decorated) {
  // Build the set of policy IDs that have at least one upload, then count the
  // gap against the full mock policy library. Used as a coverage proxy until
  // backend exposes the real "policies without evidence" count.
  const seen = new Set();
  for (const u of decorated) {
    for (const r of u.verdict?.policyResults ?? []) {
      seen.add(r.policyId);
    }
  }
  // 8 mock policies total in the slice's `policies` array — we don't import it
  // directly here to keep this component prop-driven; the caller could pass the
  // count if it ever needs to be exact. For now, return 0 if every upload has a
  // policy match — a simple "are there orphans" check works since every mock
  // upload has at least one match.
  return Math.max(0, 8 - seen.size);
}

function averageCompliance(decorated) {
  const scored = decorated
    .map((u) => u.compliance)
    .filter((v) => typeof v === "number");
  if (scored.length === 0) return null;
  return Math.round(scored.reduce((a, b) => a + b, 0) / scored.length);
}

export default Dashboard;
