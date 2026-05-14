import { useState } from "react";
import { useDispatch } from "react-redux";
import {
  FaArrowLeft,
  FaArrowRight,
  FaCheck,
  FaCircleCheck,
  FaClipboardCheck,
  FaClipboardList,
  FaFileExport,
  FaPlus,
} from "react-icons/fa6";
import {
  AUDIT_STATUS_LABEL,
  FINDING_STATUS_LABEL,
  SEVERITY_LABEL,
} from "../../../data";
import { addFinding } from "../../../store/auditsSlice";

const STATUS_STYLES = {
  planning: "bg-slate-100 text-slate-700 ring-slate-200",
  in_progress: "bg-amber-50 text-amber-700 ring-amber-200",
  issued: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  closed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

const FINDING_STATUS_STYLES = {
  draft: "bg-slate-100 text-slate-700 ring-slate-200",
  issued: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  responded: "bg-amber-50 text-amber-700 ring-amber-200",
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

function AuditDetail({ audit, onBack, onSelectFinding }) {
  const dispatch = useDispatch();
  const [exportToast, setExportToast] = useState(false);

  function handleAddFinding() {
    const nextAf =
      audit.findings.reduce((acc, f) => Math.max(acc, f.afNumber ?? 0), 0) + 1;
    const newFinding = {
      id: `AF-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      afNumber: nextAf,
      title: `Draft finding AF${nextAf}`,
      severity: "medium",
      status: "draft",
      wpRef: `AF${nextAf}`,
      criteria: { background: "", standardReferences: [] },
      conditions: "",
      rootCauses: [],
      riskIds: [],
      recommendations: [],
      actionPlan: "",
      targetDate: null,
      responsibleOwners: [],
      managementResponse: "",
      attachments: [],
      aiAssisted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    dispatch(addFinding({ auditId: audit.id, finding: newFinding }));
    onSelectFinding(newFinding.id);
  }

  function handleExport() {
    setExportToast(true);
    setTimeout(() => setExportToast(false), 2500);
  }

  const allClosed =
    audit.findings.length > 0 &&
    audit.findings.every((f) => f.status === "closed");

  return (
    <div className="grid min-w-0 gap-5 max-[900px]:gap-4">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex w-fit items-center gap-1.5 text-[11px] font-medium text-slate-500 transition hover:text-slate-700"
      >
        <FaArrowLeft className="h-2.5 w-2.5" aria-hidden="true" />
        Back to audit list
      </button>

      <HeaderCard audit={audit} onExport={handleExport} allClosed={allClosed} />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <FindingsCard
          audit={audit}
          onAddFinding={handleAddFinding}
          onSelectFinding={onSelectFinding}
        />
        <ScopeCard audit={audit} />
      </div>

      {exportToast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-slate-900 px-4 py-2 text-xs font-medium text-white shadow-lg">
          PDF export simulated — in production this renders each finding in the
          sample report layout.
        </div>
      )}
    </div>
  );
}

function HeaderCard({ audit, onExport, allClosed }) {
  const statusClass = STATUS_STYLES[audit.status];
  return (
    <section className="relative min-w-0 overflow-hidden rounded-3xl border border-white/80 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.10)] max-[520px]:rounded-2xl">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,#e0e7ff_0%,transparent_55%),radial-gradient(circle_at_bottom_left,#cffafe_0%,transparent_50%)]"
      />
      <div className="relative grid gap-4 p-6 max-[520px]:p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-700 ring-1 ring-indigo-200">
              <FaClipboardCheck className="h-3 w-3" aria-hidden="true" />
              Audit workpaper
            </span>
            <h1 className="mt-2 text-xl font-semibold leading-tight text-slate-900 max-[520px]:text-lg">
              {audit.title}
            </h1>
            <p className="mt-1 text-xs text-slate-500">{audit.scope}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${statusClass}`}
            >
              {AUDIT_STATUS_LABEL[audit.status]}
            </span>
            <button
              type="button"
              onClick={onExport}
              disabled={!allClosed}
              title={
                allClosed
                  ? "Export issued audit report as PDF"
                  : "Close all findings to export the report"
              }
              className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition ${
                allClosed
                  ? "border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                  : "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-400"
              }`}
            >
              <FaFileExport className="h-3 w-3" aria-hidden="true" />
              Export PDF
            </button>
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
          <Meta label="Departments" value={audit.departments.join(", ")} />
          <Meta label="Period" value={audit.period} />
          <Meta label="Owner" value={audit.owner} />
          <Meta label="Last updated" value={formatDate(audit.updatedAt)} />
        </dl>
      </div>
    </section>
  );
}

function Meta({ label, value }) {
  return (
    <div className="rounded-xl border border-white/80 bg-white/80 p-3 shadow-sm backdrop-blur">
      <dt className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium text-slate-900">{value}</dd>
    </div>
  );
}

function FindingsCard({ audit, onAddFinding, onSelectFinding }) {
  return (
    <section className="relative min-w-0 overflow-hidden rounded-3xl border border-white/80 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)] max-[520px]:rounded-2xl">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">
            Audit findings ({audit.findings.length})
          </h2>
          <p className="text-[11px] text-slate-500">
            Each finding maps risks to evidence and ends with a recommendation.
          </p>
        </div>
        <button
          type="button"
          onClick={onAddFinding}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-slate-900 px-3 text-xs font-semibold text-white transition hover:bg-slate-800"
        >
          <FaPlus className="h-3 w-3" aria-hidden="true" />
          Add finding
        </button>
      </div>

      {audit.findings.length === 0 ? (
        <div className="grid place-items-center gap-2 px-5 py-12 text-slate-400">
          <FaClipboardList className="h-5 w-5" aria-hidden="true" />
          <p className="text-sm font-medium text-slate-600">
            No findings yet for this audit
          </p>
          <p className="text-xs text-slate-400">
            Start one to walk through the 7-section format used by real
            auditors.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {audit.findings
            .slice()
            .sort((a, b) => a.afNumber - b.afNumber)
            .map((f) => (
              <FindingRow
                key={f.id}
                finding={f}
                onSelect={() => onSelectFinding(f.id)}
              />
            ))}
        </ul>
      )}
    </section>
  );
}

function FindingRow({ finding, onSelect }) {
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        className="group flex w-full flex-col gap-2 px-5 py-4 text-left transition hover:bg-slate-50/60"
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex h-6 items-center rounded bg-slate-900 px-2 text-[10px] font-bold uppercase tracking-wide text-white">
            AF{finding.afNumber}
          </span>
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${
              SEVERITY_STYLES[finding.severity]
            }`}
          >
            {SEVERITY_LABEL[finding.severity]}
          </span>
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${
              FINDING_STATUS_STYLES[finding.status]
            }`}
          >
            {finding.status === "closed" && (
              <FaCircleCheck className="mr-1 h-2.5 w-2.5" aria-hidden="true" />
            )}
            {FINDING_STATUS_LABEL[finding.status]}
          </span>
          {finding.aiAssisted && (
            <span className="inline-flex items-center rounded-full bg-cyan-50 px-2 py-0.5 text-[10px] font-semibold text-cyan-700 ring-1 ring-cyan-200">
              AI-assisted
            </span>
          )}
        </div>

        <h3 className="text-sm font-semibold text-slate-900 group-hover:text-indigo-700">
          {finding.title}
        </h3>
        <p className="font-mono text-[11px] text-slate-500">
          WP Ref: {finding.wpRef}
        </p>

        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
          <span>
            {finding.riskIds.length} linked risk
            {finding.riskIds.length === 1 ? "" : "s"}
          </span>
          <span aria-hidden="true">·</span>
          <span>
            {finding.recommendations.length} recommendation
            {finding.recommendations.length === 1 ? "" : "s"}
          </span>
          {finding.targetDate && (
            <>
              <span aria-hidden="true">·</span>
              <span>Target: {formatDate(finding.targetDate)}</span>
            </>
          )}
          <span className="ml-auto inline-flex items-center gap-1 text-indigo-700 group-hover:underline">
            Open
            <FaArrowRight className="h-2.5 w-2.5" aria-hidden="true" />
          </span>
        </div>
      </button>
    </li>
  );
}

function ScopeCard({ audit }) {
  return (
    <aside className="rounded-3xl border border-white/80 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] max-[520px]:rounded-2xl max-[520px]:p-4">
      <h3 className="text-sm font-semibold text-slate-900">Scope & checklist</h3>
      <p className="mt-1 text-[11px] text-slate-500">
        Workpaper sign-off prerequisites.
      </p>

      <ul className="mt-3 grid gap-2">
        {audit.checklist.map((c) => (
          <li
            key={c.id}
            className="flex items-start gap-2 rounded-xl border border-slate-100 bg-slate-50/60 p-2.5"
          >
            <span
              className={`mt-0.5 inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-md ring-1 ${
                c.done
                  ? "bg-emerald-500 text-white ring-emerald-500"
                  : "bg-white text-transparent ring-slate-300"
              }`}
              aria-hidden="true"
            >
              <FaCheck className="h-2.5 w-2.5" />
            </span>
            <span
              className={`text-xs ${
                c.done ? "text-slate-500 line-through" : "text-slate-700"
              }`}
            >
              {c.text}
            </span>
          </li>
        ))}
      </ul>
    </aside>
  );
}

export default AuditDetail;
