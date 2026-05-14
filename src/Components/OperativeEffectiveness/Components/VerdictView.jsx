import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  FaArrowLeft,
  FaCircleCheck,
  FaCircleInfo,
  FaCircleMinus,
  FaCircleXmark,
  FaPenToSquare,
  FaTriangleExclamation,
  FaXmark,
} from "react-icons/fa6";
import {
  acceptVerdict,
  overrideFinding,
  rejectVerdict,
} from "../../../store/operativeEffectivenessSlice";

const FINDING_STYLES = {
  compliant: {
    label: "Compliant",
    icon: FaCircleCheck,
    cls: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    iconCls: "text-emerald-600",
  },
  warning: {
    label: "Warning",
    icon: FaTriangleExclamation,
    cls: "bg-amber-50 text-amber-700 ring-amber-200",
    iconCls: "text-amber-600",
  },
  non_compliant: {
    label: "Non-compliant",
    icon: FaCircleXmark,
    cls: "bg-rose-50 text-rose-700 ring-rose-200",
    iconCls: "text-rose-600",
  },
  missing: {
    label: "Missing",
    icon: FaCircleMinus,
    cls: "bg-slate-100 text-slate-600 ring-slate-200",
    iconCls: "text-slate-500",
  },
};

const OVERRIDE_TYPE_OPTIONS = [
  { value: "compliant", label: "Compliant" },
  { value: "warning", label: "Warning" },
  { value: "non_compliant", label: "Non-compliant" },
  { value: "missing", label: "Missing" },
];

function complianceBandClass(pct) {
  if (pct == null) return "bg-slate-50 text-slate-500 ring-slate-200";
  if (pct >= 90) return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  if (pct >= 70) return "bg-amber-50 text-amber-700 ring-amber-200";
  return "bg-rose-50 text-rose-700 ring-rose-200";
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(iso));
}

function VerdictView({ upload, onBack }) {
  const dispatch = useDispatch();
  const policies = useSelector((state) => state.operativeEffectiveness.policies);
  const risks = useSelector((state) => state.risks.items);

  const policyResults = useMemo(
    () => upload.verdict?.policyResults ?? [],
    [upload.verdict],
  );

  const affectedRisks = useMemo(() => {
    const riskIds = new Set();
    for (const result of policyResults) {
      const hasNegative = (result.findings ?? []).some((f) => {
        const effectiveType = f.override?.type ?? f.type;
        return effectiveType === "non_compliant" || effectiveType === "missing";
      });
      if (!hasNegative) continue;
      const policy = policies.find((p) => p.id === result.policyId);
      for (const rid of policy?.controlsRiskIds ?? []) {
        riskIds.add(rid);
      }
    }
    return Array.from(riskIds)
      .map((rid) => risks.find((r) => r.id === rid))
      .filter(Boolean);
  }, [policyResults, policies, risks]);

  const isLocked = upload.status === "accepted" || upload.status === "rejected";

  function handleOverride(policyId, findingId, override) {
    dispatch(overrideFinding({ uploadId: upload.id, policyId, findingId, override }));
  }

  function handleAcceptAll() {
    dispatch(acceptVerdict(upload.id));
  }

  function handleReject() {
    if (!window.confirm("Reject this verdict? The upload will be marked rejected and won't update the Risk Register.")) {
      return;
    }
    dispatch(rejectVerdict(upload.id));
    onBack?.();
  }

  return (
    <div className="grid min-w-0 gap-5 pb-24 max-[900px]:gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
        >
          <FaArrowLeft className="h-3 w-3" aria-hidden="true" />
          Back to dashboard
        </button>
        <StatusBadge status={upload.status} />
      </div>

      <Hero upload={upload} />

      <DescriptionCard description={upload.aiDescription} />

      <div className="grid gap-4">
        {policyResults.map((result) => (
          <PolicyResultCard
            key={result.policyId}
            result={result}
            isLocked={isLocked}
            onOverride={(findingId, override) =>
              handleOverride(result.policyId, findingId, override)
            }
          />
        ))}
      </div>

      <AffectedRisksPanel risks={affectedRisks} />

      {!isLocked && (
        <StickyFooter
          onReject={handleReject}
          onAcceptAll={handleAcceptAll}
        />
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    pending: { label: "Pending review", cls: "bg-amber-50 text-amber-700 ring-amber-200" },
    accepted: { label: "Accepted", cls: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
    overridden: { label: "Overridden", cls: "bg-indigo-50 text-indigo-700 ring-indigo-200" },
    rejected: { label: "Rejected", cls: "bg-slate-100 text-slate-500 ring-slate-200" },
  };
  const m = map[status] ?? map.pending;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${m.cls}`}>
      {m.label}
    </span>
  );
}

function Hero({ upload }) {
  return (
    <section className="relative min-w-0 overflow-hidden rounded-3xl border border-white/80 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.10)] max-[520px]:rounded-2xl">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,#cffafe_0%,transparent_55%),radial-gradient(circle_at_bottom_left,#e0f2fe_0%,transparent_50%)]"
      />
      <div className="relative grid gap-2 p-6 max-[520px]:p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-md bg-slate-900 px-2 py-0.5 font-mono text-[11px] font-semibold text-white">
            {upload.id}
          </span>
          <span className="inline-flex items-center rounded-full bg-cyan-50 px-2 py-0.5 text-[11px] font-medium text-cyan-700 ring-1 ring-cyan-200">
            {upload.department}
          </span>
          <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600 ring-1 ring-slate-200">
            {upload.period}
          </span>
        </div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900 max-[520px]:text-lg">
          {upload.fileName}
        </h1>
        <p className="text-xs text-slate-500">
          Uploaded by <span className="font-medium text-slate-700">{upload.uploadedBy}</span>
          {" · "}
          {formatDate(upload.uploadedAt)}
        </p>
      </div>
    </section>
  );
}

function DescriptionCard({ description }) {
  return (
    <section className="relative min-w-0 overflow-hidden rounded-3xl border border-white/80 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)] max-[520px]:rounded-2xl">
      <header className="border-b border-slate-100 px-5 py-3">
        <div className="flex items-center gap-2">
          <h2 className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            AI description
          </h2>
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 ring-1 ring-amber-200">
            <FaCircleInfo className="h-2.5 w-2.5" aria-hidden="true" />
            Advisory
          </span>
        </div>
      </header>
      <div className="p-5 max-[520px]:p-4">
        <p className="text-sm leading-relaxed text-slate-800">{description}</p>
        <p className="mt-3 text-[11px] text-slate-500">
          Confirm the AI read the file correctly before trusting the verdict. If
          the description is wrong, reject and re-upload.
        </p>
      </div>
    </section>
  );
}

function PolicyResultCard({ result, isLocked, onOverride }) {
  const [open, setOpen] = useState(true);

  return (
    <section className="relative min-w-0 overflow-hidden rounded-3xl border border-white/80 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)] max-[520px]:rounded-2xl">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3 text-left transition hover:bg-slate-50/40"
      >
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Policy
          </p>
          <h3 className="mt-0.5 text-sm font-semibold text-slate-900">
            <span className="font-mono text-slate-600">{result.policyCode}</span>{" "}
            · {result.policyTitle}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex h-7 min-w-[3rem] items-center justify-center rounded-md px-2 text-xs font-bold ring-1 ${complianceBandClass(
              result.compliancePercent,
            )}`}
          >
            {result.compliancePercent}%
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 ring-1 ring-amber-200">
            Advisory
          </span>
          <span className="text-[10px] text-slate-400">{open ? "Collapse" : "Expand"}</span>
        </div>
      </button>

      {open && (
        <ul className="divide-y divide-slate-100">
          {result.findings.map((finding) => (
            <FindingRow
              key={finding.id}
              finding={finding}
              isLocked={isLocked}
              onOverride={(override) => onOverride(finding.id, override)}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function FindingRow({ finding, isLocked, onOverride }) {
  const [editing, setEditing] = useState(false);
  const [draftType, setDraftType] = useState(
    finding.override?.type ?? finding.type,
  );
  const [draftNote, setDraftNote] = useState(finding.override?.note ?? "");

  const effectiveType = finding.override?.type ?? finding.type;
  const style = FINDING_STYLES[effectiveType] ?? FINDING_STYLES.compliant;
  const Icon = style.icon;
  const isOverridden = Boolean(finding.override);

  function startEdit() {
    setDraftType(finding.override?.type ?? finding.type);
    setDraftNote(finding.override?.note ?? "");
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
  }

  function saveEdit() {
    onOverride({
      type: draftType,
      note: draftNote,
      by: "K. Iyer (Quality Officer)",
      at: new Date().toISOString(),
    });
    setEditing(false);
  }

  function clearOverride() {
    onOverride(null);
    setEditing(false);
  }

  return (
    <li className="px-5 py-4 max-[520px]:px-4">
      <div className="flex items-start gap-3">
        <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${style.iconCls}`} aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${style.cls}`}
            >
              {style.label}
            </span>
            {isOverridden && (
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 ring-1 ring-indigo-200">
                <FaPenToSquare className="h-2.5 w-2.5" aria-hidden="true" />
                Overridden from {FINDING_STYLES[finding.type]?.label ?? finding.type}
              </span>
            )}
            <span className="font-mono text-[11px] text-slate-500">
              {finding.evidenceRef}
            </span>
          </div>
          <p className="mt-1 text-sm leading-relaxed text-slate-800">{finding.reasoning}</p>
          <p className="mt-1 text-[11px] text-slate-500">
            <span className="font-medium text-slate-600">Policy clause:</span>{" "}
            {finding.policyClauseRef}
          </p>

          {isOverridden && !editing && (
            <div className="mt-2 rounded-lg border border-indigo-100 bg-indigo-50/50 px-3 py-2 text-[11px] text-indigo-900">
              <p className="font-medium">Override note:</p>
              <p className="mt-0.5 text-indigo-800">{finding.override.note || "—"}</p>
              <p className="mt-1 text-[10px] text-indigo-700">
                {finding.override.by} · {formatDate(finding.override.at)}
              </p>
            </div>
          )}

          {editing && (
            <div className="mt-3 grid gap-2 rounded-lg border border-slate-200 bg-slate-50/60 p-3">
              <label className="grid gap-1">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  New verdict
                </span>
                <select
                  value={draftType}
                  onChange={(e) => setDraftType(e.target.value)}
                  className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                >
                  {OVERRIDE_TYPE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  Note (why are you overriding?)
                </span>
                <textarea
                  value={draftNote}
                  onChange={(e) => setDraftNote(e.target.value)}
                  rows={2}
                  className="rounded-md border border-slate-200 bg-white p-2 text-xs text-slate-800 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                  placeholder="Explain the override reasoning."
                />
              </label>
              <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                {isOverridden && (
                  <button
                    type="button"
                    onClick={clearOverride}
                    className="inline-flex h-7 items-center rounded-md px-2 text-[11px] font-medium text-rose-600 transition hover:bg-rose-50"
                  >
                    Clear override
                  </button>
                )}
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="inline-flex h-7 items-center rounded-md border border-slate-200 bg-white px-2 text-[11px] font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveEdit}
                  className="inline-flex h-7 items-center rounded-md bg-slate-900 px-2 text-[11px] font-semibold text-white transition hover:bg-slate-800"
                >
                  Save override
                </button>
              </div>
            </div>
          )}
        </div>

        {!isLocked && !editing && (
          <button
            type="button"
            onClick={startEdit}
            className="inline-flex h-7 items-center gap-1 rounded-md border border-slate-200 bg-white px-2 text-[11px] font-medium text-slate-600 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700"
          >
            <FaPenToSquare className="h-2.5 w-2.5" aria-hidden="true" />
            {isOverridden ? "Edit override" : "Override"}
          </button>
        )}
      </div>
    </li>
  );
}

function AffectedRisksPanel({ risks }) {
  return (
    <section className="relative min-w-0 overflow-hidden rounded-3xl border border-white/80 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)] max-[520px]:rounded-2xl">
      <header className="border-b border-slate-100 px-5 py-3">
        <h2 className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
          Affected risks
        </h2>
      </header>
      <div className="p-5 max-[520px]:p-4">
        {risks.length === 0 ? (
          <p className="text-xs text-slate-500">
            No risks are currently affected by this verdict — all findings are
            within policy.
          </p>
        ) : (
          <>
            <p className="text-xs text-slate-500">
              {risks.length} risk{risks.length === 1 ? " is" : "s are"} linked
              to policies with non-compliant or missing evidence in this verdict.
              Accepting the verdict will recompute Control Effectiveness on each.
            </p>
            <ul className="mt-3 divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200 bg-white">
              {risks.map((risk) => (
                <li key={risk.id}>
                  <a
                    href={`/risk-audit-governance/risk-register?risk=${encodeURIComponent(risk.id)}`}
                    className="grid grid-cols-[80px_1fr_auto] items-center gap-3 px-3 py-2 text-left text-xs transition hover:bg-slate-50"
                  >
                    <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-700">
                      {risk.riskNumber}
                    </span>
                    <span className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {risk.title}
                      </p>
                      <p className="truncate text-[11px] text-slate-500">
                        {risk.department}
                      </p>
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Residual{" "}
                      <span className="font-bold text-slate-700">
                        {risk.residualRating}
                      </span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </section>
  );
}

function StickyFooter({ onReject, onAcceptAll }) {
  // Footer is fixed-positioned but offset by the 292px sidebar width on desktop
  // so its background band stops at the sidebar's edge rather than running
  // under it. The mobile layout collapses the sidebar (max-[900px]) so the
  // footer falls back to a full-width band there.
  return (
    <div className="fixed bottom-0 left-[292px] right-0 z-40 border-t border-slate-200 bg-white/95 shadow-[0_-12px_30px_rgba(15,23,42,0.06)] backdrop-blur max-[900px]:left-0">
      <div className="mx-auto flex w-full max-w-[1500px] flex-wrap items-center justify-between gap-2 px-8 py-3 max-[900px]:px-4 max-[520px]:px-3">
        <p className="text-[11px] text-slate-500">
          AI verdict is advisory — nothing updates the Risk Register until you
          accept.
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onReject}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 text-xs font-medium text-rose-700 transition hover:bg-rose-50"
          >
            <FaXmark className="h-3 w-3" aria-hidden="true" />
            Reject (don't save)
          </button>
          <button
            type="button"
            onClick={onAcceptAll}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-slate-900 px-3 text-xs font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800"
          >
            <FaCircleCheck className="h-3 w-3" aria-hidden="true" />
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
}

export default VerdictView;
