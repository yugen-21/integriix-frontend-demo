import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  FaArrowRight,
  FaBell,
  FaClipboardCheck,
  FaClockRotateLeft,
  FaFilter,
  FaListUl,
  FaMagnifyingGlass,
  FaPlus,
  FaTriangleExclamation,
  FaXmark,
} from "react-icons/fa6";
import { auditDepartments, AUDIT_STATUS_LABEL } from "../../../data";
import {
  addAudit,
  addFinding,
  dismissTrigger,
  selectAudit,
  selectFinding,
} from "../../../store/auditsSlice";
import NewAuditModal from "./NewAuditModal";

const PAGE_SIZE = 8;

const STATUS_OPTIONS = [
  { value: "All", label: "All statuses" },
  { value: "planning", label: "Planning" },
  { value: "in_progress", label: "In Progress" },
  { value: "issued", label: "Issued" },
  { value: "closed", label: "Closed" },
];

const PERIOD_OPTIONS = [
  { value: "All", label: "Any period" },
  { value: "Q1 2026", label: "Q1 2026" },
  { value: "Q2 2026", label: "Q2 2026" },
  { value: "FY 2025", label: "FY 2025" },
];

const STATUS_STYLES = {
  planning: "bg-slate-100 text-slate-700 ring-slate-200",
  in_progress: "bg-amber-50 text-amber-700 ring-amber-200",
  issued: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  closed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

const SEVERITY_STYLES = {
  low: "bg-slate-100 text-slate-700 ring-slate-200",
  medium: "bg-sky-50 text-sky-700 ring-sky-200",
  significant: "bg-amber-50 text-amber-700 ring-amber-200",
  high: "bg-rose-50 text-rose-700 ring-rose-200",
};

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

function AuditList({ audits, onSelect }) {
  const dispatch = useDispatch();
  const [tab, setTab] = useState("audits");
  const [modalSeed, setModalSeed] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const triggers = useSelector((s) => s.audits.triggers);

  function openBlank() {
    setModalSeed(null);
    setModalOpen(true);
  }

  function openFromTrigger(trigger) {
    setModalSeed({
      title: `${trigger.department} audit — ${trigger.title}`,
      departments: [trigger.department],
      scope: `Triggered by ${trigger.sourceLabel} on ${new Date(trigger.detectedAt).toLocaleDateString()}. ${trigger.summary}`,
      period: defaultPeriod(),
      seedFindingTitle: trigger.title,
      seedConditions: trigger.summary,
      seedRiskIds: trigger.suggestedRiskIds ?? [],
      triggerId: trigger.id,
    });
    setModalOpen(true);
  }

  function handleCreate(draft) {
    const now = new Date().toISOString();
    const auditId = `AUD-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const audit = {
      id: auditId,
      title: draft.title.trim(),
      departments: draft.departments,
      scope: draft.scope.trim(),
      period: draft.period,
      owner: draft.owner,
      status: draft.seedConditions ? "in_progress" : "planning",
      createdAt: now,
      updatedAt: now,
      checklist: [],
      findings: [],
    };
    dispatch(addAudit(audit));

    // If this came from a trigger, seed the first finding and dismiss the
    // trigger from the feed.
    if (modalSeed?.seedConditions) {
      const findingId = `AF-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      const seedRiskIds = modalSeed.seedRiskIds ?? [];
      const wpRef = seedRiskIds.length
        ? seedRiskIds
            .map((rid) => {
              const numeric = rid.replace(/\D/g, "") || rid;
              return `R${numeric}C${numeric}AF1`;
            })
            .join(", ")
        : "AF1";
      const finding = {
        id: findingId,
        afNumber: 1,
        title: modalSeed.seedFindingTitle ?? draft.title,
        severity: "medium",
        status: "draft",
        wpRef,
        criteria: { background: "", standardReferences: [] },
        conditions: modalSeed.seedConditions,
        rootCauses: [],
        riskIds: seedRiskIds,
        recommendations: [],
        actionPlan: "",
        targetDate: null,
        responsibleOwners: [],
        managementResponse: "",
        attachments: [],
        aiAssisted: false,
        createdAt: now,
        updatedAt: now,
      };
      dispatch(addFinding({ auditId, finding }));
      if (modalSeed.triggerId) dispatch(dismissTrigger(modalSeed.triggerId));
      // Drop straight into the seeded finding so the user can run AI assist.
      dispatch(selectAudit(auditId));
      dispatch(selectFinding(findingId));
    } else {
      dispatch(selectAudit(auditId));
    }

    setModalOpen(false);
    setModalSeed(null);
  }

  return (
    <div className="grid min-w-0 gap-5 max-[900px]:gap-4">
      <Header audits={audits} triggers={triggers} onNewAudit={openBlank} />

      <nav className="flex flex-wrap items-center gap-1 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
        <TabButton
          active={tab === "audits"}
          onClick={() => setTab("audits")}
          icon={<FaListUl className="h-3 w-3" />}
          label="Audits"
          count={audits.length}
        />
        <TabButton
          active={tab === "triggers"}
          onClick={() => setTab("triggers")}
          icon={<FaBell className="h-3 w-3" />}
          label="Trigger feed"
          count={triggers.length}
        />
        <TabButton
          active={tab === "history"}
          onClick={() => setTab("history")}
          icon={<FaClockRotateLeft className="h-3 w-3" />}
          label="History"
          count={audits.filter((a) => a.status === "closed").length}
        />
      </nav>

      {tab === "audits" && <AuditsTab audits={audits} onSelect={onSelect} />}
      {tab === "triggers" && (
        <TriggersTab triggers={triggers} onPromote={openFromTrigger} />
      )}
      {tab === "history" && (
        <AuditsTab
          audits={audits.filter((a) => a.status === "closed")}
          onSelect={onSelect}
          emptyLabel="No closed audits yet"
        />
      )}

      {modalOpen && (
        <NewAuditModal
          seed={modalSeed}
          onClose={() => {
            setModalOpen(false);
            setModalSeed(null);
          }}
          onSubmit={handleCreate}
        />
      )}
    </div>
  );
}

// Default new-audit period — current quarter, computed once.
function defaultPeriod() {
  const d = new Date();
  const q = Math.floor(d.getMonth() / 3) + 1;
  return `Q${q} ${d.getFullYear()}`;
}

// ---------- Header ----------

function Header({ audits, triggers, onNewAudit }) {
  const inProgress = audits.filter((a) => a.status === "in_progress").length;
  const openFindings = audits.reduce(
    (acc, a) =>
      acc +
      a.findings.filter((f) => f.status !== "closed" && f.status !== "responded")
        .length,
    0,
  );
  const overdueResponses = audits.reduce(
    (acc, a) =>
      acc +
      a.findings.filter((f) => {
        if (f.status !== "issued") return false;
        const issuedAt = new Date(f.updatedAt).getTime();
        return Date.now() - issuedAt > 21 * 24 * 60 * 60 * 1000;
      }).length,
    0,
  );
  const triggerCount = triggers.length;

  const stats = [
    { label: "Audits in progress", value: inProgress, accent: "text-amber-700" },
    { label: "Findings open", value: openFindings, accent: "text-slate-900" },
    {
      label: "Responses overdue",
      value: overdueResponses,
      accent: overdueResponses > 0 ? "text-rose-700" : "text-slate-900",
    },
    {
      label: "Pending triggers",
      value: triggerCount,
      accent: triggerCount > 0 ? "text-indigo-700" : "text-slate-900",
    },
  ];

  return (
    <section className="relative min-w-0 overflow-hidden rounded-3xl border border-white/80 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.10)] max-[520px]:rounded-2xl">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,#e0e7ff_0%,transparent_55%),radial-gradient(circle_at_bottom_left,#cffafe_0%,transparent_50%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -right-16 h-64 w-64 rounded-full bg-indigo-200/40 blur-3xl"
      />

      <div className="relative grid gap-5 p-6 max-[520px]:p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-700 ring-1 ring-indigo-200">
              <FaClipboardCheck className="h-3 w-3" aria-hidden="true" />
              Internal Audit
            </span>
            <h1 className="mt-2 text-xl font-semibold leading-tight text-slate-900 max-[520px]:text-lg">
              From conditions on the ground to issued findings.
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              Plan audits, write findings in the same 7-section format real
              auditors use, and let AI fill the rest from a short narrative —
              every finding stays advisory until management responds.
            </p>
          </div>

          <button
            type="button"
            onClick={onNewAudit}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-4 text-xs font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800"
          >
            <FaPlus className="h-3.5 w-3.5" aria-hidden="true" />
            New audit
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

function TabButton({ active, onClick, icon, label, count }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-xs font-medium transition ${
        active
          ? "bg-slate-900 text-white shadow-sm"
          : "text-slate-600 hover:bg-slate-50"
      }`}
    >
      {icon}
      {label}
      <span
        className={`ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-semibold ${
          active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

// ---------- Audits tab ----------

function AuditsTab({ audits, onSelect, emptyLabel }) {
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [periodFilter, setPeriodFilter] = useState("All");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return audits.filter((a) => {
      if (statusFilter !== "All" && a.status !== statusFilter) return false;
      if (periodFilter !== "All" && a.period !== periodFilter) return false;
      if (
        departmentFilter !== "All" &&
        !a.departments.includes(departmentFilter)
      )
        return false;
      if (term) {
        const haystack = [
          a.title,
          a.scope,
          a.owner,
          a.period,
          ...a.departments,
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  }, [audits, search, departmentFilter, statusFilter, periodFilter]);

  const sorted = useMemo(
    () =>
      [...filtered].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      ),
    [filtered],
  );

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = sorted.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const hasActiveFilters =
    Boolean(search) ||
    departmentFilter !== "All" ||
    statusFilter !== "All" ||
    periodFilter !== "All";

  function resetFilters() {
    setSearch("");
    setDepartmentFilter("All");
    setStatusFilter("All");
    setPeriodFilter("All");
    setPage(1);
  }

  function update(setter) {
    return (value) => {
      setter(value);
      setPage(1);
    };
  }

  return (
    <section className="relative min-w-0 overflow-hidden rounded-3xl border border-white/80 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)] max-[520px]:rounded-2xl">
      <div className="border-b border-slate-100 p-4 max-[520px]:p-3">
        <div className="flex flex-wrap items-center gap-2">
          <label className="relative min-w-[220px] flex-1">
            <span className="sr-only">Search audits</span>
            <FaMagnifyingGlass
              className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => update(setSearch)(e.target.value)}
              placeholder="Search by title, scope, owner, department"
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/80 pl-9 pr-3 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
            />
          </label>
          <select
            value={departmentFilter}
            onChange={(e) => update(setDepartmentFilter)(e.target.value)}
            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="All">All departments</option>
            {auditDepartments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => update(setStatusFilter)(e.target.value)}
            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <select
            value={periodFilter}
            onChange={(e) => update(setPeriodFilter)(e.target.value)}
            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          >
            {PERIOD_OPTIONS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
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
            {sorted.length} of {audits.length} audit
            {audits.length === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      <div className="min-w-0 overflow-x-auto">
        <table className="w-full min-w-[1000px] border-collapse text-left text-xs">
          <thead className="bg-slate-50/70 text-[10px] font-medium uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2.5 text-left">Title</th>
              <th className="px-4 py-2.5 text-left">Departments</th>
              <th className="px-4 py-2.5 text-left">Period</th>
              <th className="px-4 py-2.5 text-left">Owner</th>
              <th className="px-4 py-2.5 text-center">Findings</th>
              <th className="px-4 py-2.5 text-left">Status</th>
              <th className="px-4 py-2.5 text-left">Last activity</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pageItems.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center">
                  <div className="grid place-items-center gap-2 text-slate-400">
                    <FaFilter className="h-5 w-5" aria-hidden="true" />
                    <p className="text-sm font-medium text-slate-600">
                      {hasActiveFilters
                        ? "No audits match your filters"
                        : (emptyLabel ?? "No audits yet")}
                    </p>
                    {hasActiveFilters && (
                      <button
                        type="button"
                        onClick={resetFilters}
                        className="text-xs font-medium text-indigo-700 hover:underline"
                      >
                        Clear filters
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              pageItems.map((audit) => (
                <AuditRow
                  key={audit.id}
                  audit={audit}
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
  );
}

function AuditRow({ audit, onSelect }) {
  const statusClass = STATUS_STYLES[audit.status];
  const findingsTotal = audit.findings.length;
  const findingsOpen = audit.findings.filter((f) => f.status !== "closed").length;

  const highestSeverity = audit.findings.reduce((acc, f) => {
    const order = { low: 1, medium: 2, significant: 3, high: 4 };
    return order[f.severity] > order[acc] ? f.severity : acc;
  }, "low");

  function handleClick() {
    onSelect?.(audit.id);
  }

  function handleKey(e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect?.(audit.id);
    }
  }

  return (
    <tr
      className="group cursor-pointer transition hover:bg-slate-50/60 focus-within:bg-slate-50/60"
      onClick={handleClick}
      onKeyDown={handleKey}
      tabIndex={0}
      role="link"
      aria-label={`Open audit ${audit.title}`}
    >
      <td className="px-4 py-3">
        <p className="text-sm font-medium text-slate-900 group-hover:text-indigo-700">
          {audit.title}
        </p>
        <p className="line-clamp-1 text-[11px] text-slate-500">{audit.scope}</p>
      </td>
      <td className="px-4 py-3 text-xs text-slate-700">
        {audit.departments.join(", ")}
      </td>
      <td className="px-4 py-3 text-xs text-slate-700">{audit.period}</td>
      <td className="px-4 py-3 text-xs text-slate-700">{audit.owner}</td>
      <td className="px-4 py-3 text-center">
        <div className="inline-flex items-center gap-1.5">
          <span className="inline-flex h-6 min-w-[2.25rem] items-center justify-center rounded-md bg-slate-100 px-2 text-[11px] font-semibold text-slate-700">
            {findingsTotal}
          </span>
          {findingsTotal > 0 && (
            <span
              className={`inline-flex h-5 items-center rounded-full px-2 text-[10px] font-semibold ring-1 ${SEVERITY_STYLES[highestSeverity]}`}
              title={`Highest severity in this audit: ${highestSeverity}`}
            >
              {findingsOpen > 0 ? `${findingsOpen} open` : "All closed"}
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${statusClass}`}
        >
          {AUDIT_STATUS_LABEL[audit.status]}
        </span>
      </td>
      <td className="px-4 py-3">
        <p className="text-xs text-slate-700">{formatDate(audit.updatedAt)}</p>
        <p className="text-[11px] text-slate-400">{relativeDate(audit.updatedAt)}</p>
      </td>
      <td className="px-4 py-3 text-right">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect?.(audit.id);
          }}
          className="inline-flex h-8 items-center gap-1 rounded-md border border-slate-200 bg-white px-3 text-[11px] font-medium text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
        >
          Open
          <FaArrowRight className="h-2.5 w-2.5" aria-hidden="true" />
        </button>
      </td>
    </tr>
  );
}

// ---------- Triggers tab ----------

function TriggersTab({ triggers, onPromote }) {
  const dispatch = useDispatch();

  if (triggers.length === 0) {
    return (
      <section className="rounded-3xl border border-white/80 bg-white p-10 text-center shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
        <FaBell className="mx-auto h-6 w-6 text-slate-300" aria-hidden="true" />
        <p className="mt-3 text-sm font-medium text-slate-600">
          No pending audit triggers
        </p>
        <p className="mt-1 text-xs text-slate-400">
          Incidents, complaints, and non-compliant Operative Effectiveness
          verdicts surface here as candidates for an audit.
        </p>
      </section>
    );
  }

  return (
    <section className="grid gap-3">
      {triggers.map((t) => (
        <TriggerCard
          key={t.id}
          trigger={t}
          onDismiss={() => dispatch(dismissTrigger(t.id))}
          onPromote={() => onPromote(t)}
        />
      ))}
    </section>
  );
}

function TriggerCard({ trigger, onDismiss, onPromote }) {
  const sevClass = SEVERITY_STYLES[trigger.severity] ?? SEVERITY_STYLES.medium;
  const sourceIcon = {
    verdict: <FaClipboardCheck className="h-3 w-3" aria-hidden="true" />,
    incident: <FaTriangleExclamation className="h-3 w-3" aria-hidden="true" />,
    complaint: <FaBell className="h-3 w-3" aria-hidden="true" />,
  }[trigger.source];

  return (
    <article className="grid gap-3 rounded-3xl border border-white/80 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] max-[520px]:rounded-2xl max-[520px]:p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
              {sourceIcon}
              {trigger.sourceLabel}
            </span>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${sevClass}`}
            >
              {trigger.severity.charAt(0).toUpperCase() + trigger.severity.slice(1)}
            </span>
            <span className="text-[11px] text-slate-400">
              {formatDate(trigger.detectedAt)} · {trigger.department}
            </span>
          </div>
          <h3 className="mt-2 text-sm font-semibold text-slate-900">
            {trigger.title}
          </h3>
          <p className="mt-1 text-xs text-slate-600">{trigger.summary}</p>
          {trigger.suggestedRiskIds.length > 0 && (
            <p className="mt-2 text-[11px] text-slate-500">
              Suggested risks:{" "}
              {trigger.suggestedRiskIds.map((rid, i) => (
                <span key={rid}>
                  <span className="font-mono text-slate-700">{rid}</span>
                  {i < trigger.suggestedRiskIds.length - 1 ? ", " : ""}
                </span>
              ))}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onPromote}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-slate-900 px-3 text-xs font-semibold text-white transition hover:bg-slate-800"
          >
            Promote to audit
            <FaArrowRight className="h-3 w-3" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-2 text-slate-500 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700"
            title="Dismiss trigger"
            aria-label="Dismiss trigger"
          >
            <FaXmark className="h-3 w-3" aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
  );
}

export default AuditList;
