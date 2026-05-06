import { useMemo, useState } from "react";
import {
  FaArrowLeft,
  FaArrowRight,
  FaBuildingColumns,
  FaCalendarDays,
  FaCircleCheck,
  FaCircleExclamation,
  FaClockRotateLeft,
  FaCloudArrowUp,
  FaFile,
  FaFileLines,
  FaListCheck,
  FaRegLightbulb,
  FaTags,
  FaUsers,
  FaUserTie,
  FaWandMagicSparkles,
} from "react-icons/fa6";
import { getPolicyDetail } from "../../../data";

const TODAY = new Date("2026-05-06T00:00:00+05:30");

const statusStyles = {
  Draft: "bg-slate-100 text-slate-700 ring-slate-200",
  "In Review": "bg-amber-50 text-amber-700 ring-amber-200",
  Approved: "bg-cyan-50 text-cyan-700 ring-cyan-200",
  Active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Archived: "bg-slate-100 text-slate-500 ring-slate-200",
};

const transitionMap = {
  Draft: "In Review",
  "In Review": "Approved",
  Approved: "Active",
  Active: "Archived",
  Archived: null,
};

const TABS = [
  { id: "overview", label: "Overview", Icon: FaFileLines },
  { id: "versions", label: "Versions", Icon: FaClockRotateLeft },
  { id: "acks", label: "Acknowledgements", Icon: FaUsers },
  { id: "jci", label: "JCI Tags", Icon: FaTags },
  { id: "ai", label: "AI", Icon: FaWandMagicSparkles },
  { id: "activity", label: "Activity", Icon: FaListCheck },
];

function formatDate(value) {
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function isOverdue(dateValue) {
  return new Date(dateValue) < TODAY;
}

function PolicyDetail({ policyId, onBack }) {
  const policy = useMemo(() => getPolicyDetail(policyId), [policyId]);
  const [activeTab, setActiveTab] = useState("overview");
  const [status, setStatus] = useState(policy?.status ?? "Draft");

  if (!policy) {
    return (
      <div className="rounded-3xl border border-white/80 bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-medium text-slate-700">Policy not found.</p>
        <button
          type="button"
          onClick={onBack}
          className="mt-3 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          <FaArrowLeft className="h-3 w-3" aria-hidden="true" />
          Back to register
        </button>
      </div>
    );
  }

  const nextStatus = transitionMap[status];

  return (
    <div className="grid min-w-0 gap-5 max-[900px]:gap-4">
      <DetailHeader
        policy={policy}
        status={status}
        onBack={onBack}
        nextStatus={nextStatus}
        onTransition={() => nextStatus && setStatus(nextStatus)}
      />

      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        <section className="relative min-w-0 overflow-hidden rounded-3xl border border-white/80 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)] max-[520px]:rounded-2xl">
          <div className="border-b border-slate-100">
            <nav
              className="flex flex-wrap gap-1 px-3 pt-2"
              aria-label="Policy detail tabs"
            >
              {TABS.map((tab) => {
                const isActive = tab.id === activeTab;
                const Icon = tab.Icon;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative inline-flex items-center gap-1.5 rounded-t-md px-3 py-2 text-xs font-medium transition ${
                      isActive
                        ? "text-cyan-700"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <Icon className="h-3 w-3" aria-hidden="true" />
                    {tab.label}
                    {isActive && (
                      <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-cyan-600" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-5 max-[520px]:p-4">
            {activeTab === "overview" && <OverviewTab policy={policy} />}
            {activeTab === "versions" && <VersionsTab policy={policy} />}
            {activeTab === "acks" && <AcknowledgementsTab policy={policy} />}
            {activeTab === "jci" && <JciTagsTab policy={policy} />}
            {activeTab === "ai" && <AiTab />}
            {activeTab === "activity" && <ActivityTab policy={policy} />}
          </div>
        </section>

        <SidePanel
          policy={policy}
          status={status}
          nextStatus={nextStatus}
          onTransition={() => nextStatus && setStatus(nextStatus)}
        />
      </div>
    </div>
  );
}

function DetailHeader({ policy, status, onBack, nextStatus, onTransition }) {
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

      <div className="relative grid gap-4 p-6 max-[520px]:p-4">
        <nav
          className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500"
          aria-label="Breadcrumb"
        >
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-cyan-700 transition hover:bg-cyan-50"
          >
            <FaArrowLeft className="h-2.5 w-2.5" aria-hidden="true" />
            Policy register
          </button>
          <span className="text-slate-300">/</span>
          <span className="text-slate-700">{policy.code}</span>
        </nav>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-md bg-slate-900 px-2 py-0.5 text-[11px] font-semibold text-white">
                {policy.code}
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${
                  statusStyles[status] ?? statusStyles.Draft
                }`}
              >
                {status === "Active" && (
                  <FaCircleCheck className="h-2.5 w-2.5" aria-hidden="true" />
                )}
                {status}
              </span>
              <span className="text-[11px] text-slate-500">{policy.version}</span>
            </div>
            <h1 className="mt-2 text-2xl font-semibold leading-tight text-slate-900 max-[520px]:text-xl">
              {policy.title}
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              {policy.category} · {policy.department} · Updated{" "}
              {formatDate(policy.lastUpdated)}
            </p>
          </div>

          {nextStatus && (
            <button
              type="button"
              onClick={onTransition}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-slate-900 px-3 text-xs font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800"
            >
              Transition to {nextStatus}
              <FaArrowRight className="h-3 w-3" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

function SidePanel({ policy, status, nextStatus, onTransition }) {
  const overdue = isOverdue(policy.nextReview);

  const items = [
    {
      label: "Owner",
      value: policy.owner,
      Icon: FaUserTie,
    },
    {
      label: "Department",
      value: policy.department,
      Icon: FaBuildingColumns,
    },
    {
      label: "Category",
      value: policy.category,
      Icon: FaFile,
    },
    {
      label: "Next review",
      value: formatDate(policy.nextReview),
      Icon: FaCalendarDays,
      tone: overdue ? "danger" : "default",
      hint: overdue ? "Overdue" : null,
    },
  ];

  return (
    <aside className="grid min-w-0 content-start gap-4 max-[520px]:rounded-2xl">
      <div className="rounded-3xl border border-white/80 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] max-[520px]:rounded-2xl max-[520px]:p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-cyan-700">
          Key facts
        </p>
        <dl className="mt-3 grid gap-3">
          {items.map((item) => {
            const Icon = item.Icon;
            return (
              <div
                key={item.label}
                className="grid grid-cols-[24px_minmax(0,1fr)] items-start gap-3"
              >
                <span
                  className={`mt-0.5 grid h-6 w-6 place-items-center rounded-md ${
                    item.tone === "danger"
                      ? "bg-red-50 text-red-600"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  <Icon className="h-3 w-3" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <dt className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                    {item.label}
                  </dt>
                  <dd
                    className={`mt-0.5 text-xs font-medium ${
                      item.tone === "danger"
                        ? "text-red-700"
                        : "text-slate-900"
                    }`}
                  >
                    {item.value}
                    {item.hint && (
                      <span className="ml-1.5 inline-flex items-center gap-1 rounded-full bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold text-red-700 ring-1 ring-red-200">
                        <FaCircleExclamation
                          className="h-2.5 w-2.5"
                          aria-hidden="true"
                        />
                        {item.hint}
                      </span>
                    )}
                  </dd>
                </div>
              </div>
            );
          })}
        </dl>

        {policy.accreditationTags?.length > 0 && (
          <div className="mt-4 border-t border-slate-100 pt-3">
            <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
              Accreditation
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {policy.accreditationTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-md bg-cyan-50 px-2 py-0.5 text-[11px] font-semibold text-cyan-700 ring-1 ring-cyan-200"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={onTransition}
          disabled={!nextStatus}
          className="mt-5 inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-3 text-xs font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none disabled:hover:translate-y-0"
        >
          {nextStatus
            ? `Transition status → ${nextStatus}`
            : `Final status: ${status}`}
        </button>
      </div>

      <div className="rounded-3xl border border-cyan-200 bg-gradient-to-br from-white to-cyan-50/40 p-5 shadow-sm max-[520px]:rounded-2xl max-[520px]:p-4">
        <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-cyan-700">
          <FaRegLightbulb className="h-3 w-3" aria-hidden="true" />
          Hint
        </p>
        <p className="mt-2 text-[11px] leading-5 text-slate-600">
          The AI tab will suggest summary, gaps and accreditation crosswalks
          once the LLM pipeline is wired in a later step.
        </p>
      </div>
    </aside>
  );
}

function OverviewTab({ policy }) {
  return (
    <div className="grid gap-4">
      <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
        <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
          Summary
        </p>
        <p className="mt-1.5 text-xs leading-5 text-slate-700">
          {policy.detail.summary}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-100 bg-white p-4">
          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
            Applies to
          </p>
          <ul className="mt-2 grid gap-1.5">
            {policy.detail.appliesTo.map((item) => (
              <li
                key={item}
                className="flex items-center gap-2 text-xs text-slate-700"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-500" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-4">
          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
            Key clauses
          </p>
          <ol className="mt-2 grid gap-2">
            {policy.detail.keyClauses.map((clause, idx) => (
              <li
                key={clause}
                className="flex items-start gap-2 text-xs leading-5 text-slate-700"
              >
                <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-600">
                  {idx + 1}
                </span>
                {clause}
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
          <p className="inline-flex items-center gap-2 text-[11px] font-semibold text-slate-700">
            <FaFile className="h-3 w-3 text-slate-400" aria-hidden="true" />
            {policy.code} {policy.version} · current PDF
          </p>
          <span className="text-[10px] text-slate-500">
            Uploaded {formatDate(policy.lastUpdated)}
          </span>
        </div>
        <div className="grid h-64 place-items-center bg-slate-50/60 text-center">
          <div className="grid place-items-center gap-2 text-slate-400">
            <FaFileLines className="h-8 w-8" aria-hidden="true" />
            <p className="text-xs font-medium text-slate-500">
              PDF preview will render here
            </p>
            <p className="text-[10px] text-slate-400">
              Wired up to the file vault in a later step.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function VersionsTab({ policy }) {
  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-slate-500">
          {policy.detail.versions.length} versions on file
        </p>
        <button
          type="button"
          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          <FaCloudArrowUp className="h-3 w-3" aria-hidden="true" />
          Upload version
        </button>
      </div>

      <ol className="grid gap-2">
        {policy.detail.versions.map((version) => (
          <li
            key={version.id}
            className={`grid gap-3 rounded-2xl border p-4 sm:grid-cols-[80px_minmax(0,1fr)_auto] sm:items-center ${
              version.isCurrent
                ? "border-cyan-200 bg-cyan-50/40"
                : "border-slate-100 bg-white"
            }`}
          >
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                Version
              </p>
              <p className="text-base font-semibold text-slate-900">
                {version.version}
              </p>
              {version.isCurrent && (
                <span className="mt-1 inline-flex rounded-full bg-cyan-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                  Current
                </span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs leading-5 text-slate-700">
                {version.changeNote}
              </p>
              <p className="mt-1 text-[11px] text-slate-500">
                Uploaded by {version.uploadedBy} on{" "}
                {formatDate(version.uploadedAt)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="inline-flex h-8 items-center rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                View PDF
              </button>
              {!version.isCurrent && (
                <button
                  type="button"
                  className="inline-flex h-8 items-center rounded-md bg-slate-900 px-3 text-xs font-semibold text-white hover:bg-slate-800"
                >
                  Make current
                </button>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function AcknowledgementsTab({ policy }) {
  const { overallPercent, targetPercent, deadline, totalRequired, byDepartment } =
    policy.detail.acknowledgements;
  const overdue = isOverdue(deadline);

  return (
    <div className="grid gap-4">
      <div className="rounded-2xl border border-slate-100 bg-white p-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
              Overall completion
            </p>
            <p className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">
              {overallPercent}
              <span className="text-base text-slate-400">%</span>
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              Target {targetPercent}% by {formatDate(deadline)} ·{" "}
              {totalRequired} required
            </p>
          </div>
          <span
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${
              overdue
                ? "bg-red-50 text-red-700 ring-red-200"
                : overallPercent >= targetPercent
                  ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                  : "bg-amber-50 text-amber-700 ring-amber-200"
            }`}
          >
            {overdue
              ? "Overdue"
              : overallPercent >= targetPercent
                ? "Target met"
                : "Below target"}
          </span>
        </div>

        <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full ${
              overallPercent >= targetPercent
                ? "bg-emerald-500"
                : "bg-cyan-500"
            }`}
            style={{ width: `${overallPercent}%` }}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white">
        <div className="border-b border-slate-100 px-4 py-2.5">
          <p className="text-[11px] font-semibold text-slate-700">
            Completion by department
          </p>
        </div>
        <ul className="divide-y divide-slate-100">
          {byDepartment.map((row) => {
            const pct = row.percent;
            const tone =
              pct >= 90
                ? "bg-emerald-500"
                : pct >= 70
                  ? "bg-cyan-500"
                  : pct >= 50
                    ? "bg-amber-500"
                    : "bg-red-500";
            return (
              <li
                key={row.department}
                className="grid grid-cols-[140px_minmax(0,1fr)_72px] items-center gap-3 px-4 py-3 max-[520px]:grid-cols-[100px_minmax(0,1fr)_56px]"
              >
                <p className="text-xs font-medium text-slate-700">
                  {row.department}
                </p>
                <div className="min-w-0">
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${tone}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="mt-1 text-[10px] text-slate-500">
                    {row.completed} of {row.required} acknowledged
                  </p>
                </div>
                <p className="text-right text-xs font-semibold text-slate-900">
                  {pct}%
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function JciTagsTab({ policy }) {
  const acceptedCount = policy.detail.jciTags.filter((t) => t.accepted).length;
  const suggestedCount = policy.detail.jciTags.length - acceptedCount;

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
          {acceptedCount} accepted
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-50 px-2.5 py-0.5 text-[11px] font-semibold text-cyan-700 ring-1 ring-cyan-200">
          {suggestedCount} AI-suggested
        </span>
        <p className="ml-auto text-[11px] text-slate-500">
          Confidence pills indicate model certainty.
        </p>
      </div>

      <ul className="grid gap-2">
        {policy.detail.jciTags.map((tag) => {
          const confidencePct = Math.round(tag.confidence * 100);
          const confidenceTone =
            confidencePct >= 85
              ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
              : confidencePct >= 70
                ? "bg-cyan-50 text-cyan-700 ring-cyan-200"
                : "bg-amber-50 text-amber-700 ring-amber-200";

          return (
            <li
              key={tag.code}
              className={`grid gap-3 rounded-2xl border p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center ${
                tag.accepted
                  ? "border-emerald-200 bg-emerald-50/30"
                  : "border-slate-100 bg-white"
              }`}
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-slate-900 px-2 py-0.5 text-[11px] font-semibold text-white">
                    {tag.code}
                  </span>
                  <span className="text-sm font-medium text-slate-900">
                    {tag.label}
                  </span>
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${confidenceTone}`}
                  >
                    {confidencePct}% confidence
                  </span>
                </div>
                <p className="mt-1.5 text-[11px] leading-5 text-slate-600">
                  {tag.rationale}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {tag.accepted ? (
                  <span className="inline-flex h-8 items-center gap-1.5 rounded-md bg-emerald-600 px-3 text-xs font-semibold text-white">
                    <FaCircleCheck className="h-3 w-3" aria-hidden="true" />
                    Accepted
                  </span>
                ) : (
                  <>
                    <button
                      type="button"
                      className="inline-flex h-8 items-center rounded-md bg-slate-900 px-3 text-xs font-semibold text-white hover:bg-slate-800"
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      className="inline-flex h-8 items-center rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Dismiss
                    </button>
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function AiTab() {
  const cards = [
    {
      title: "Plain-language summary",
      description:
        "An LLM-generated overview of the policy's intent, scope, and obligations for staff onboarding.",
      tone: "cyan",
    },
    {
      title: "Gap analysis vs JCI",
      description:
        "Compare clauses against accreditation requirements and surface missing or weak language.",
      tone: "amber",
    },
    {
      title: "Conflict detection",
      description:
        "Flag overlaps and contradictions with other policies in the register.",
      tone: "red",
    },
    {
      title: "Suggested updates",
      description:
        "Recommend redlines based on incident, audit, and regulatory feedback.",
      tone: "emerald",
    },
  ];

  const tones = {
    cyan: "border-cyan-200 bg-gradient-to-br from-cyan-50/60 to-white",
    amber: "border-amber-200 bg-gradient-to-br from-amber-50/60 to-white",
    red: "border-red-200 bg-gradient-to-br from-red-50/60 to-white",
    emerald: "border-emerald-200 bg-gradient-to-br from-emerald-50/60 to-white",
  };

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between rounded-2xl border border-cyan-200 bg-cyan-50/40 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-cyan-600 text-white">
            <FaWandMagicSparkles className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-semibold text-slate-900">
              AI insights
            </p>
            <p className="text-[11px] text-slate-500">
              Coming online once the LLM pipeline is connected.
            </p>
          </div>
        </div>
        <button
          type="button"
          disabled
          className="inline-flex h-8 cursor-not-allowed items-center rounded-md bg-slate-200 px-3 text-xs font-semibold text-slate-500"
        >
          Generate
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {cards.map((card) => (
          <article
            key={card.title}
            className={`rounded-2xl border p-4 ${tones[card.tone]}`}
          >
            <p className="text-sm font-semibold text-slate-900">
              {card.title}
            </p>
            <p className="mt-1.5 text-[11px] leading-5 text-slate-600">
              {card.description}
            </p>
            <p className="mt-3 inline-flex items-center gap-1 rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-semibold text-slate-500 ring-1 ring-slate-200">
              Coming soon
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}

function ActivityTab({ policy }) {
  return (
    <ol className="relative grid gap-4 pl-5">
      <span
        aria-hidden="true"
        className="absolute left-1.5 top-2 bottom-2 w-px bg-slate-200"
      />
      {policy.detail.activity.map((entry) => (
        <li key={entry.id} className="relative">
          <span
            aria-hidden="true"
            className="absolute -left-[18px] top-1 h-2.5 w-2.5 rounded-full bg-cyan-500 ring-2 ring-white"
          />
          <p className="text-xs font-medium text-slate-900">{entry.action}</p>
          <p className="mt-0.5 text-[11px] text-slate-500">
            {formatDateTime(entry.at)}
          </p>
        </li>
      ))}
    </ol>
  );
}

export default PolicyDetail;
