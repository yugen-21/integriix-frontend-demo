import { useMemo, useState } from "react";
import {
  FaArrowLeft,
  FaArrowRight,
  FaPen,
  FaBuildingColumns,
  FaCalendarDays,
  FaCircleCheck,
  FaCircleExclamation,
  FaCircleXmark,
  FaClockRotateLeft,
  FaCloudArrowUp,
  FaFile,
  FaFileLines,
  FaHand,
  FaListCheck,
  FaQuoteLeft,
  FaRegLightbulb,
  FaRobot,
  FaTags,
  FaTriangleExclamation,
  FaUserTie,
  FaWandMagicSparkles,
} from "react-icons/fa6";
import { buildPolicyDetail } from "../../../data";
import VersionUploader from "./VersionUploader";

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

function PolicyDetail({ policy: policyInput, onBack, onEdit, onUploadVersion }) {
  const policy = useMemo(() => buildPolicyDetail(policyInput), [policyInput]);
  const [activeTab, setActiveTab] = useState("overview");
  const [status, setStatus] = useState(policy?.status ?? "Draft");
  const [uploaderOpen, setUploaderOpen] = useState(false);

  function openUploader() {
    setActiveTab("versions");
    setUploaderOpen(true);
  }

  function handleUpload(payload) {
    onUploadVersion?.(payload);
    setUploaderOpen(false);
  }

  function jumpToCitation(citation) {
    if (!citation?.id) return;
    setActiveTab("overview");
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const node = document.getElementById(`citation-${citation.id}`);
        if (!node) return;
        node.scrollIntoView({ behavior: "smooth", block: "center" });
        node.classList.add(
          "ring-2",
          "ring-cyan-400",
          "ring-offset-2",
          "ring-offset-white",
          "bg-cyan-50",
        );
        window.setTimeout(() => {
          node.classList.remove(
            "ring-2",
            "ring-cyan-400",
            "ring-offset-2",
            "ring-offset-white",
            "bg-cyan-50",
          );
        }, 2400);
      });
    });
  }

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
        onEdit={onEdit}
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
            {/* AI tab handles citations via PolicyDetail.jumpToCitation */}
            {activeTab === "versions" && (
              <VersionsTab policy={policy} onUploadClick={openUploader} />
            )}
            {activeTab === "acks" && <AcknowledgementsTab policy={policy} />}
            {activeTab === "jci" && <JciTagsTab policy={policy} />}
            {activeTab === "ai" && (
              <AiTab policy={policy} onJumpToCitation={jumpToCitation} />
            )}
            {activeTab === "activity" && <ActivityTab policy={policy} />}
          </div>
        </section>

        <SidePanel
          policy={policy}
          status={status}
          nextStatus={nextStatus}
          onTransition={() => nextStatus && setStatus(nextStatus)}
          onUploadVersionClick={openUploader}
        />
      </div>

      {uploaderOpen && (
        <VersionUploader
          policy={policy}
          onClose={() => setUploaderOpen(false)}
          onUpload={handleUpload}
        />
      )}
    </div>
  );
}

function DetailHeader({
  policy,
  status,
  onBack,
  nextStatus,
  onTransition,
  onEdit,
}) {
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

          <div className="flex flex-wrap items-center gap-2">
            {onEdit && (
              <button
                type="button"
                onClick={onEdit}
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50"
              >
                <FaPen className="h-3 w-3" aria-hidden="true" />
                Edit policy
              </button>
            )}
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
      </div>
    </section>
  );
}

function SidePanel({ policy, status, nextStatus, onTransition, onUploadVersionClick }) {
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

        <button
          type="button"
          onClick={onUploadVersionClick}
          className="mt-2 inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
        >
          <FaCloudArrowUp className="h-3 w-3" aria-hidden="true" />
          Upload new version
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

      <PdfPreview policy={policy} />
    </div>
  );
}

function PdfPreview({ policy }) {
  const citations = policy.detail.aiInsights?.summary?.citations ?? [];

  return (
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
      <div className="max-h-[460px] overflow-y-auto bg-slate-50/40 px-6 py-5">
        <article className="mx-auto grid max-w-2xl gap-4 rounded-xl bg-white px-6 py-6 text-xs leading-6 text-slate-700 shadow-sm ring-1 ring-slate-100">
          <header className="border-b border-slate-100 pb-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              {policy.code} · {policy.version}
            </p>
            <h3 className="mt-1 text-base font-semibold text-slate-900">
              {policy.title}
            </h3>
            <p className="mt-1 text-[11px] text-slate-500">
              Owner: {policy.owner} · Department: {policy.department}
            </p>
          </header>

          <section>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Para 1.1 · Purpose
            </p>
            <p className="mt-1">{policy.detail.summary}</p>
          </section>

          <section>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Para 2 · Scope — applies to
            </p>
            <ul className="mt-1 grid gap-1 pl-4 list-disc marker:text-slate-300">
              {policy.detail.appliesTo.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Para 3 · Key clauses
            </p>
            <ol className="mt-1 grid gap-1 pl-4 list-decimal marker:text-slate-400">
              {policy.detail.keyClauses.map((clause) => (
                <li key={clause}>{clause}</li>
              ))}
            </ol>
          </section>

          {citations.map((citation) => (
            <section
              key={citation.id}
              id={`citation-${citation.id}`}
              className="scroll-mt-6 rounded-lg p-3 transition-all duration-300"
            >
              <p className="text-[10px] font-semibold uppercase tracking-wide text-cyan-700">
                {citation.label} · {citation.title}
              </p>
              <p className="mt-1">{citation.excerpt}</p>
              <p className="mt-2 text-[10px] italic text-slate-400">
                [ … remainder of section continues in document … ]
              </p>
            </section>
          ))}
        </article>
      </div>
    </div>
  );
}

function VersionsTab({ policy, onUploadClick }) {
  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-slate-500">
          {policy.detail.versions.length} versions on file
        </p>
        <button
          type="button"
          onClick={onUploadClick}
          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 transition hover:bg-slate-50 hover:border-slate-300"
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
                {version.fileName && (
                  <>
                    {" · "}
                    <span className="font-medium text-slate-600">
                      {version.fileName}
                    </span>
                  </>
                )}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {version.fileUrl ? (
                <a
                  href={version.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-8 items-center rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  View PDF
                </a>
              ) : (
                <button
                  type="button"
                  className="inline-flex h-8 items-center rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  View PDF
                </button>
              )}
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

const ACCREDITATION_BODIES = ["JCI", "CBAHI", "DoH", "JAWDA"];

function AiTab({ policy, onJumpToCitation }) {
  const insights = policy.detail.aiInsights;

  const initialSuggestions = useMemo(
    () =>
      insights.tagSuggestions.map((tag) => ({
        ...tag,
        state: "pending",
      })),
    [insights.tagSuggestions],
  );
  const initialConfirmed = useMemo(
    () => insights.confirmedTags.map((tag) => ({ ...tag, state: "confirmed" })),
    [insights.confirmedTags],
  );

  const [tagState, setTagState] = useState({
    suggestions: initialSuggestions,
    confirmed: initialConfirmed,
  });

  function handleConfirm(tagId) {
    setTagState((current) => {
      const tag = current.suggestions.find((t) => t.id === tagId);
      if (!tag) return current;
      return {
        suggestions: current.suggestions.filter((t) => t.id !== tagId),
        confirmed: [
          ...current.confirmed,
          { ...tag, state: "confirmed" },
        ],
      };
    });
  }

  function handleReject(tagId) {
    setTagState((current) => ({
      ...current,
      suggestions: current.suggestions.map((t) =>
        t.id === tagId ? { ...t, state: "rejected" } : t,
      ),
    }));
  }

  function handleRestore(tagId) {
    setTagState((current) => ({
      ...current,
      suggestions: current.suggestions.map((t) =>
        t.id === tagId ? { ...t, state: "pending" } : t,
      ),
    }));
  }

  function handleAddManual({ code, label, rationale }) {
    setTagState((current) => ({
      ...current,
      confirmed: [
        ...current.confirmed,
        {
          id: `${policy.id}-manual-${current.confirmed.length + 1}`,
          code,
          label,
          rationale,
          confidence: null,
          source: "manual",
          state: "confirmed",
        },
      ],
    }));
  }

  return (
    <div className="grid gap-4">
      <AiHeader />
      <AiSummaryPanel
        summary={insights.summary}
        onJumpToCitation={onJumpToCitation}
      />
      <GapNarrativePanel
        policy={policy}
        gapAnalysis={insights.gapAnalysis}
      />
      <JciTagPickerPanel
        suggestions={tagState.suggestions}
        confirmed={tagState.confirmed}
        onConfirm={handleConfirm}
        onReject={handleReject}
        onRestore={handleRestore}
        onAddManual={handleAddManual}
      />
    </div>
  );
}

function AiHeader() {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-cyan-200 bg-gradient-to-br from-cyan-50/60 to-white px-4 py-3">
      <div className="flex items-center gap-2.5">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-cyan-600 text-white">
          <FaWandMagicSparkles className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-xs font-semibold text-slate-900">AI insights</p>
          <p className="text-[11px] text-slate-500">
            Generated from the current version of the policy. Demo mode — values
            shown are illustrative.
          </p>
        </div>
      </div>
      <button
        type="button"
        className="inline-flex h-8 items-center gap-1.5 rounded-md border border-cyan-200 bg-white px-3 text-xs font-semibold text-cyan-700 hover:bg-cyan-50"
      >
        <FaRobot className="h-3 w-3" aria-hidden="true" />
        Re-run
      </button>
    </div>
  );
}

function AiSummaryPanel({ summary, onJumpToCitation }) {
  const [activeCitation, setActiveCitation] = useState(null);

  return (
    <section className="rounded-2xl border border-slate-100 bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
        <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-cyan-700">
          <FaWandMagicSparkles className="h-3 w-3" aria-hidden="true" />
          AI summary
        </p>
        <span className="text-[10px] text-slate-500">
          2–3 sentence overview · click a chip to jump to the source paragraph
        </span>
      </div>
      <div className="p-4">
        <ol className="grid gap-2">
          {summary.sentences.map((sentence, idx) => (
            <li
              key={idx}
              className="flex items-start gap-2 text-xs leading-5 text-slate-700"
            >
              <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-cyan-100 text-[10px] font-semibold text-cyan-700">
                {idx + 1}
              </span>
              {sentence}
            </li>
          ))}
        </ol>

        <div className="mt-4">
          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
            Citations
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {summary.citations.map((citation) => {
              const isActive = activeCitation?.id === citation.id;
              return (
                <button
                  key={citation.id}
                  type="button"
                  onClick={() => {
                    setActiveCitation(isActive ? null : citation);
                    if (!isActive) onJumpToCitation?.(citation);
                  }}
                  className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold transition ${
                    isActive
                      ? "border-cyan-300 bg-cyan-600 text-white"
                      : "border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100"
                  }`}
                  title={`Scroll the PDF preview to ${citation.label}`}
                >
                  <FaQuoteLeft className="h-2.5 w-2.5" aria-hidden="true" />
                  {citation.label}
                </button>
              );
            })}
          </div>
        </div>

        {activeCitation && (
          <div className="mt-3 rounded-xl border border-cyan-200 bg-cyan-50/50 p-3">
            <div className="flex items-center justify-between">
              <p className="inline-flex items-center gap-2 text-[11px] font-semibold text-cyan-700">
                <span className="rounded-md bg-cyan-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  {activeCitation.label}
                </span>
                {activeCitation.title}
              </p>
              <button
                type="button"
                onClick={() => setActiveCitation(null)}
                className="text-[10px] font-medium text-cyan-700 hover:underline"
              >
                Close
              </button>
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-700">
              "{activeCitation.excerpt}"
            </p>
            <button
              type="button"
              onClick={() => onJumpToCitation?.(activeCitation)}
              className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-700 transition hover:underline"
            >
              Open {activeCitation.label} in the PDF preview
              <FaArrowRight className="h-2.5 w-2.5" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

function GapNarrativePanel({ policy, gapAnalysis }) {
  const initialBody = policy.accreditationTags?.[0] ?? "JCI";
  const [body, setBody] = useState(
    ACCREDITATION_BODIES.includes(initialBody) ? initialBody : "JCI",
  );
  const [activeElement, setActiveElement] = useState(null);

  const data = gapAnalysis[body] ?? { covered: [], gaps: [] };
  const coveredCodes = data.covered.map((el) => el.code).join(", ");
  const gapCodes = data.gaps.map((el) => el.code).join(", ");

  function selectElement(element, kind) {
    setActiveElement({ ...element, kind });
  }

  return (
    <section className="rounded-2xl border border-slate-100 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-2.5">
        <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-amber-700">
          <FaTriangleExclamation className="h-3 w-3" aria-hidden="true" />
          Gap narrative
        </p>
        <label className="inline-flex items-center gap-2 text-[11px] text-slate-500">
          <span>Body</span>
          <select
            value={body}
            onChange={(e) => {
              setBody(e.target.value);
              setActiveElement(null);
            }}
            className="h-7 rounded-md border border-slate-200 bg-white px-2 text-[11px] font-medium text-slate-700 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
          >
            {ACCREDITATION_BODIES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="grid gap-3">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3">
            <p className="text-xs leading-5 text-slate-700">
              This policy <span className="font-semibold">covers</span>{" "}
              <span className="font-semibold text-emerald-700">{body}</span>{" "}
              elements{" "}
              <span className="font-semibold text-emerald-700">
                {coveredCodes || "none detected"}
              </span>
              .
            </p>
            <ul className="mt-2 grid gap-1.5">
              {data.covered.map((element) => {
                const isActive = activeElement?.code === element.code;
                return (
                  <li key={element.code}>
                    <button
                      type="button"
                      onClick={() => selectElement(element, "covered")}
                      className={`grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-md px-2 py-1.5 text-left transition ${
                        isActive
                          ? "bg-emerald-100"
                          : "hover:bg-emerald-50/80"
                      }`}
                    >
                      <span className="rounded-md bg-emerald-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                        {element.code}
                      </span>
                      <span className="truncate text-xs text-slate-700">
                        {element.label}
                      </span>
                      <span className="text-[10px] font-medium text-emerald-700">
                        {element.citation.label}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="rounded-xl border border-red-200 bg-red-50/40 p-3">
            <p className="text-xs leading-5 text-slate-700">
              <span className="font-semibold text-red-700">Gaps:</span>{" "}
              {gapCodes ? (
                <>
                  <span className="font-semibold text-red-700">{gapCodes}</span>{" "}
                  not addressed.
                </>
              ) : (
                "no gaps detected at current confidence threshold."
              )}
            </p>
            <ul className="mt-2 grid gap-1.5">
              {data.gaps.map((element) => {
                const isActive = activeElement?.code === element.code;
                return (
                  <li key={element.code}>
                    <button
                      type="button"
                      onClick={() => selectElement(element, "gap")}
                      className={`grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-md px-2 py-1.5 text-left transition ${
                        isActive ? "bg-red-100" : "hover:bg-red-50/80"
                      }`}
                    >
                      <span className="rounded-md bg-red-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                        {element.code}
                      </span>
                      <span className="truncate text-xs text-slate-700">
                        {element.label}
                      </span>
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ring-1 ${
                          element.severity === "Critical"
                            ? "bg-red-50 text-red-700 ring-red-200"
                            : "bg-amber-50 text-amber-700 ring-amber-200"
                        }`}
                      >
                        {element.severity}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <aside
          className={`rounded-xl border p-3 ${
            activeElement?.kind === "gap"
              ? "border-red-200 bg-red-50/30"
              : activeElement
                ? "border-emerald-200 bg-emerald-50/30"
                : "border-slate-200 bg-slate-50/40"
          }`}
        >
          {activeElement ? (
            <>
              <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                {activeElement.kind === "gap" ? "Gap element" : "Covered element"}
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <span
                  className={`rounded-md px-1.5 py-0.5 text-[11px] font-semibold text-white ${
                    activeElement.kind === "gap"
                      ? "bg-red-600"
                      : "bg-emerald-600"
                  }`}
                >
                  {activeElement.code}
                </span>
                <span className="text-xs font-semibold text-slate-900">
                  {activeElement.label}
                </span>
              </div>
              <p className="mt-2 text-[11px] leading-5 text-slate-600">
                {activeElement.text}
              </p>

              {activeElement.kind === "covered" ? (
                <div className="mt-3 rounded-md bg-white/80 p-2 ring-1 ring-emerald-200">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                    Citation · {activeElement.citation.label}
                  </p>
                  <p className="mt-1 text-[11px] leading-5 text-slate-700">
                    "{activeElement.citation.excerpt}"
                  </p>
                </div>
              ) : (
                <div className="mt-3 rounded-md bg-white/80 p-2 ring-1 ring-red-200">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-red-700">
                    Suggested remediation
                  </p>
                  <p className="mt-1 text-[11px] leading-5 text-slate-700">
                    {activeElement.remediation}
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="grid place-items-center gap-2 py-6 text-center">
              <FaQuoteLeft
                className="h-4 w-4 text-slate-300"
                aria-hidden="true"
              />
              <p className="text-[11px] text-slate-500">
                Select a {body} element to see its text and citation.
              </p>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}

function JciTagPickerPanel({
  suggestions,
  confirmed,
  onConfirm,
  onReject,
  onRestore,
  onAddManual,
}) {
  const pendingSuggestions = suggestions.filter((t) => t.state === "pending");
  const rejectedSuggestions = suggestions.filter((t) => t.state === "rejected");
  const [manualOpen, setManualOpen] = useState(false);
  const [manualDraft, setManualDraft] = useState({
    code: "",
    label: "",
    rationale: "",
  });
  const [manualError, setManualError] = useState(null);

  function resetManual() {
    setManualDraft({ code: "", label: "", rationale: "" });
    setManualError(null);
  }

  function submitManual() {
    const code = manualDraft.code.trim().toUpperCase();
    const label = manualDraft.label.trim();
    if (!code || !label) {
      setManualError("Code and label are required.");
      return;
    }
    if (confirmed.some((t) => t.code === code)) {
      setManualError("That code is already confirmed for this policy.");
      return;
    }
    onAddManual?.({ code, label, rationale: manualDraft.rationale.trim() });
    resetManual();
    setManualOpen(false);
  }

  return (
    <section className="rounded-2xl border border-slate-100 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-2.5">
        <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-cyan-700">
          <FaTags className="h-3 w-3" aria-hidden="true" />
          JCI tag picker
        </p>
        <div className="flex items-center gap-2 text-[11px] text-slate-500">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-50 px-2 py-0.5 font-semibold text-cyan-700 ring-1 ring-cyan-200">
            {pendingSuggestions.length} pending
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700 ring-1 ring-emerald-200">
            {confirmed.length} confirmed
          </span>
          {rejectedSuggestions.length > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-600 ring-1 ring-slate-200">
              {rejectedSuggestions.length} rejected
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-4 p-4">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
            AI-suggested
          </p>
          {pendingSuggestions.length === 0 ? (
            <p className="mt-2 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-4 text-center text-[11px] text-slate-500">
              No pending suggestions. Restore a rejected one or re-run the model.
            </p>
          ) : (
            <ul className="mt-2 grid gap-2">
              {pendingSuggestions.map((tag) => (
                <TagSuggestionRow
                  key={tag.id}
                  tag={tag}
                  onConfirm={onConfirm}
                  onReject={onReject}
                />
              ))}
            </ul>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-medium uppercase tracking-wide text-emerald-700">
              Confirmed ({confirmed.length})
            </p>
            <button
              type="button"
              onClick={() => {
                resetManual();
                setManualOpen((value) => !value);
              }}
              className="inline-flex h-7 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <FaHand className="h-2.5 w-2.5" aria-hidden="true" />
              {manualOpen ? "Close" : "Add manual tag"}
            </button>
          </div>

          {manualOpen && (
            <div className="mt-2 grid gap-2 rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-[11px]">
              <div className="grid gap-2 sm:grid-cols-[120px_minmax(0,1fr)]">
                <input
                  type="text"
                  value={manualDraft.code}
                  onChange={(e) =>
                    setManualDraft((d) => ({ ...d, code: e.target.value }))
                  }
                  placeholder="Code (e.g. MOI.4)"
                  className="h-8 rounded-md border border-slate-200 bg-white px-2 text-[11px] text-slate-900 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                />
                <input
                  type="text"
                  value={manualDraft.label}
                  onChange={(e) =>
                    setManualDraft((d) => ({ ...d, label: e.target.value }))
                  }
                  placeholder="Element label"
                  className="h-8 rounded-md border border-slate-200 bg-white px-2 text-[11px] text-slate-900 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                />
              </div>
              <input
                type="text"
                value={manualDraft.rationale}
                onChange={(e) =>
                  setManualDraft((d) => ({ ...d, rationale: e.target.value }))
                }
                placeholder="Why this tag applies (optional)"
                className="h-8 rounded-md border border-slate-200 bg-white px-2 text-[11px] text-slate-900 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              />
              {manualError && (
                <p className="inline-flex items-center gap-1 text-[11px] font-medium text-red-700">
                  <FaCircleExclamation
                    className="h-2.5 w-2.5"
                    aria-hidden="true"
                  />
                  {manualError}
                </p>
              )}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    resetManual();
                    setManualOpen(false);
                  }}
                  className="inline-flex h-7 items-center rounded-md border border-slate-200 bg-white px-2 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={submitManual}
                  className="inline-flex h-7 items-center gap-1.5 rounded-md bg-emerald-600 px-2.5 text-[11px] font-semibold text-white transition hover:bg-emerald-700"
                >
                  <FaCircleCheck className="h-2.5 w-2.5" aria-hidden="true" />
                  Add tag
                </button>
              </div>
            </div>
          )}

          {confirmed.length === 0 ? (
            <p className="mt-2 rounded-xl border border-dashed border-emerald-200 bg-emerald-50/30 p-4 text-center text-[11px] text-emerald-700">
              Nothing confirmed yet. Click "Confirm" on a suggestion to move it
              here.
            </p>
          ) : (
            <ul className="mt-2 grid gap-2">
              {confirmed.map((tag) => (
                <ConfirmedTagRow key={tag.id} tag={tag} />
              ))}
            </ul>
          )}
        </div>

        {rejectedSuggestions.length > 0 && (
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
              Rejected
            </p>
            <ul className="mt-2 grid gap-2">
              {rejectedSuggestions.map((tag) => (
                <li
                  key={tag.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/40 px-3 py-2 text-xs"
                >
                  <span className="flex items-center gap-2">
                    <span className="rounded-md bg-slate-300 px-1.5 py-0.5 text-[10px] font-semibold text-white line-through">
                      {tag.code}
                    </span>
                    <span className="text-slate-500 line-through">
                      {tag.label}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => onRestore(tag.id)}
                    className="text-[11px] font-medium text-cyan-700 hover:underline"
                  >
                    Restore
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}

function ConfidencePill({ confidence }) {
  const pct = Math.round(confidence * 100);
  const tone =
    confidence >= 0.8
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : confidence >= 0.65
        ? "bg-amber-50 text-amber-700 ring-amber-200"
        : "bg-red-50 text-red-700 ring-red-200";
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${tone}`}
    >
      {pct}% confidence
    </span>
  );
}

function TagSuggestionRow({ tag, onConfirm, onReject }) {
  return (
    <li className="grid gap-3 rounded-xl border border-slate-100 bg-white p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-slate-900 px-1.5 py-0.5 text-[11px] font-semibold text-white">
            {tag.code}
          </span>
          <span className="text-sm font-medium text-slate-900">{tag.label}</span>
          <ConfidencePill confidence={tag.confidence} />
          <span className="inline-flex items-center gap-1 rounded-full bg-cyan-50 px-1.5 py-0.5 text-[10px] font-semibold text-cyan-700 ring-1 ring-cyan-200">
            <FaRobot className="h-2.5 w-2.5" aria-hidden="true" />
            AI
          </span>
        </div>
        <p className="mt-1.5 text-[11px] leading-5 text-slate-600">
          {tag.rationale}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onConfirm(tag.id)}
          className="inline-flex h-8 items-center gap-1.5 rounded-md bg-emerald-600 px-3 text-xs font-semibold text-white transition hover:bg-emerald-700"
        >
          <FaCircleCheck className="h-3 w-3" aria-hidden="true" />
          Confirm
        </button>
        <button
          type="button"
          onClick={() => onReject(tag.id)}
          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
        >
          <FaCircleXmark className="h-3 w-3" aria-hidden="true" />
          Reject
        </button>
      </div>
    </li>
  );
}

function ConfirmedTagRow({ tag }) {
  const isManual = tag.source === "manual";
  return (
    <li className="grid gap-2 rounded-xl border border-emerald-200 bg-emerald-50/40 p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-emerald-600 px-1.5 py-0.5 text-[11px] font-semibold text-white">
            {tag.code}
          </span>
          <span className="text-sm font-medium text-slate-900">{tag.label}</span>
          {isManual ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-1.5 py-0.5 text-[10px] font-semibold text-white">
              <FaHand className="h-2.5 w-2.5" aria-hidden="true" />
              Manual
            </span>
          ) : (
            tag.confidence != null && <ConfidencePill confidence={tag.confidence} />
          )}
        </div>
        {tag.rationale && (
          <p className="mt-1.5 text-[11px] leading-5 text-slate-600">
            {tag.rationale}
          </p>
        )}
      </div>
      <span className="inline-flex h-7 items-center gap-1.5 rounded-md bg-emerald-600 px-2.5 text-[11px] font-semibold text-white">
        <FaCircleCheck className="h-2.5 w-2.5" aria-hidden="true" />
        Confirmed
      </span>
    </li>
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
