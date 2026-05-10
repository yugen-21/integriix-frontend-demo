import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  changeStatus,
  fetchAudit,
  fetchPolicyVersions,
  runAudit,
} from "../../../store/policiesSlice";
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
  FaDownload,
  FaFile,
  FaFileLines,
  FaHand,
  FaListCheck,
  FaPrint,
  FaQuoteLeft,
  FaRegLightbulb,
  FaRegSquare,
  FaRobot,
  FaSquareCheck,
  FaTags,
  FaUserTie,
  FaWandMagicSparkles,
} from "react-icons/fa6";
import jsPDF from "jspdf";
import VersionUploader from "./VersionUploader";
import policyAPI from "../../../services/policyAPI";

const TODAY = new Date("2026-05-06T00:00:00+05:30");

const statusStyles = {
  Draft: "bg-slate-100 text-slate-700 ring-slate-200",
  "In Review": "bg-amber-50 text-amber-700 ring-amber-200",
  Approved: "bg-cyan-50 text-cyan-700 ring-cyan-200",
  Active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Archived: "bg-slate-100 text-slate-500 ring-slate-200",
};

// Backend currently allows any-to-any transitions (no auth → governance is
// in the activity log, not the state machine). Mirror that here: every
// current state can move to any other state. Tighten if/when the backend
// re-introduces a real workflow.
const ALL_STATUS_LABELS = ["Draft", "In Review", "Active", "Archived"];
const ALLOWED_TRANSITIONS = ALL_STATUS_LABELS.reduce((acc, s) => {
  acc[s] = ALL_STATUS_LABELS.filter((t) => t !== s);
  return acc;
}, {});

const STATUS_UI_TO_API = {
  Draft: "draft",
  "In Review": "in_review",
  Active: "published",
  Archived: "archived",
};

const TABS = [
  { id: "overview", label: "Overview", Icon: FaFileLines },
  { id: "versions", label: "Versions", Icon: FaClockRotateLeft },
  { id: "checklist", label: "Checklist", Icon: FaSquareCheck },
  // { id: "ai", label: "AI", Icon: FaWandMagicSparkles },
  { id: "activity", label: "Activity", Icon: FaListCheck },
];

function formatDate(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function formatDateTime(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function isOverdue(dateValue) {
  if (!dateValue) return false;
  return new Date(dateValue) < TODAY;
}

function StatusPicker({
  targets,
  isTransitioning,
  onPick,
  variant = "primary",
  fullWidth = false,
  currentStatus,
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const [coords, setCoords] = useState(null);

  // Position the menu under the trigger every time the popover opens, and
  // keep it correct on scroll / resize. We render through a portal to escape
  // any `overflow: hidden` ancestor (the detail header has one for the
  // decorative gradient).
  useLayoutEffect(() => {
    if (!open) return undefined;
    function place() {
      const node = triggerRef.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      const MENU_WIDTH = Math.max(200, rect.width);
      // Left-align the menu under the trigger, then clamp inside viewport
      // so we never spill off the right edge.
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
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const triggerBase =
    "inline-flex h-9 items-center justify-center gap-2 rounded-lg px-3 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60";
  const triggerVariant =
    variant === "primary"
      ? "bg-slate-900 text-white shadow-sm hover:-translate-y-0.5 hover:bg-slate-800 disabled:hover:translate-y-0"
      : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50";
  const triggerWidth = fullWidth ? "w-full" : "";

  if (targets.length === 0) {
    return (
      <button
        type="button"
        disabled
        className={`${triggerBase} ${triggerVariant} ${triggerWidth}`}
      >
        Final status{currentStatus ? `: ${currentStatus}` : ""}
      </button>
    );
  }

  return (
    <div className={fullWidth ? "w-full" : "inline-block"}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={isTransitioning}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`${triggerBase} ${triggerVariant} ${triggerWidth}`}
      >
        {isTransitioning ? "Transitioning…" : "Change status"}
        <FaArrowRight className="h-3 w-3 rotate-90" aria-hidden="true" />
      </button>
      {open &&
        coords &&
        typeof document !== "undefined" &&
        createPortal(
          <>
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
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
              <p className="border-b border-slate-100 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Move to
              </p>
              {targets.map((target) => (
                <button
                  key={target}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setOpen(false);
                    onPick(target);
                  }}
                  className="block w-full px-3 py-2 text-left text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  {target}
                </button>
              ))}
            </div>
          </>,
          document.body,
        )}
    </div>
  );
}

function PolicyDetail({
  policy: policyInput,
  initialTab,
  onBack,
  onEdit,
  onUploadVersion,
}) {
  // The adapter in PolicyManagement/index.jsx already builds the full
  // detail shape from the API response. The legacy buildPolicyDetail()
  // factory regenerates everything from mock templates and was overwriting
  // real API data — drop it.
  const policy = policyInput;
  const dispatch = useDispatch();
  const statusChangeStatus = useSelector(
    (state) => state.policies.statusChangeStatus,
  );
  const statusChangeError = useSelector(
    (state) => state.policies.statusChangeError,
  );
  const [activeTab, setActiveTab] = useState(initialTab ?? "overview");
  const status = policy?.status ?? "Draft";
  const [uploaderOpen, setUploaderOpen] = useState(false);

  function handleTransition(target) {
    if (!target || !policy?.id) return;
    const apiStatus = STATUS_UI_TO_API[target];
    if (!apiStatus) return;
    dispatch(
      changeStatus({
        policyId: policy.id,
        payload: { status: apiStatus },
      }),
    );
  }

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

  const allowedTargets = ALLOWED_TRANSITIONS[status] ?? [];
  const isTransitioning = statusChangeStatus === "loading";

  return (
    <div className="grid min-w-0 gap-5 max-[900px]:gap-4">
      {statusChangeStatus === "failed" && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          Status change failed:{" "}
          {statusChangeError?.detail ??
            statusChangeError?.message ??
            "unknown error"}
        </div>
      )}
      <DetailHeader
        policy={policy}
        status={status}
        onBack={onBack}
        allowedTargets={allowedTargets}
        isTransitioning={isTransitioning}
        onTransition={handleTransition}
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
            {activeTab === "checklist" && <ChecklistTab policy={policy} />}
            {/* AI tab is hidden — backend has no regenerate-insights endpoint
                and the data (summary + key_clauses) is already shown in the
                Overview tab. Re-enable the TABS entry above to bring it back. */}
            {/* {activeTab === "ai" && (
              <AiTab policy={policy} onJumpToCitation={jumpToCitation} />
            )} */}
            {activeTab === "activity" && <ActivityTab policy={policy} />}
          </div>
        </section>

        <SidePanel
          policy={policy}
          status={status}
          allowedTargets={allowedTargets}
          isTransitioning={isTransitioning}
          onTransition={handleTransition}
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
  allowedTargets,
  isTransitioning,
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
              <span className="text-[11px] text-slate-500">
                {policy.version}
              </span>
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
            <StatusPicker
              targets={allowedTargets}
              isTransitioning={isTransitioning}
              onPick={onTransition}
              variant="primary"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function SidePanel({
  policy,
  status,
  allowedTargets,
  isTransitioning,
  onTransition,
  onUploadVersionClick,
}) {
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
                      item.tone === "danger" ? "text-red-700" : "text-slate-900"
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

        <div className="mt-5">
          <StatusPicker
            targets={allowedTargets}
            isTransitioning={isTransitioning}
            onPick={onTransition}
            variant="primary"
            fullWidth
            currentStatus={status}
          />
        </div>

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
      <div className="bg-slate-50/40">
        {policy.fileLink ? (
          <iframe
            src={policy.fileLink}
            title={`${policy.code} current PDF`}
            className="h-[600px] w-full"
          />
        ) : (
          <div className="grid h-[200px] place-items-center text-xs text-slate-500">
            No file available for this policy.
          </div>
        )}
      </div>
    </div>
  );
}

function basenameFromPath(path) {
  if (!path) return null;
  const parts = String(path).split(/[\\/]/);
  return parts[parts.length - 1] || null;
}

function VersionsTab({ policy, onUploadClick }) {
  const dispatch = useDispatch();
  const {
    versions: apiVersions,
    versionsPolicyId,
    versionsStatus,
    versionsError,
  } = useSelector((state) => state.policies);

  useEffect(() => {
    if (policy?.id != null) {
      dispatch(fetchPolicyVersions(policy.id));
    }
  }, [dispatch, policy?.id]);

  const showApi = versionsPolicyId === policy?.id;
  const sortedApi = useMemo(() => {
    if (!showApi) return [];
    return [...apiVersions].sort((a, b) => {
      const ta = new Date(a.created_at).getTime();
      const tb = new Date(b.created_at).getTime();
      if (tb !== ta) return tb - ta;
      return (b.id ?? 0) - (a.id ?? 0);
    });
  }, [showApi, apiVersions]);

  const rows = useMemo(() => {
    const currentId = sortedApi[0]?.id;
    return sortedApi.map((v) => ({
      id: v.id,
      version: v.version ? `v${v.version}` : "—",
      isCurrent: v.id === currentId,
      changeNote: v.change_note ?? `Version ${v.version} uploaded`,
      uploadedBy: v.uploaded_by ?? "—",
      uploadedAt: v.created_at,
      fileName: basenameFromPath(v.file_path),
      fileUrl: v.id === currentId ? policy.fileLink : null,
    }));
  }, [sortedApi, policy.fileLink]);

  const isLoading = versionsStatus === "loading" && !showApi;
  const hasFailed = versionsStatus === "failed";

  if (isLoading) {
    return (
      <div className="px-4 py-12 text-center text-sm text-slate-500">
        Loading versions…
      </div>
    );
  }

  if (hasFailed) {
    return (
      <div className="px-4 py-12 text-center text-sm text-red-700">
        Failed to load versions: {versionsError?.message ?? "unknown error"}
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-slate-500">
          {rows.length} versions on file
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
        {rows.map((version) => (
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
  const {
    overallPercent,
    targetPercent,
    deadline,
    totalRequired,
    byDepartment,
  } = policy.detail.acknowledgements;
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
              overallPercent >= targetPercent ? "bg-emerald-500" : "bg-cyan-500"
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

// CBAHI / DoH / JAWDA are tracked in the backlog — backend has no audits
// for them and the UI has no rendering yet. Keeping the constant as an
// array so adding more bodies later is one line.
const ACCREDITATION_BODIES = ["JCI"];

/* AI tab is hidden — see backlog for full multi-standard rollout. The
   summary + key_clauses are already rendered in the Overview tab, and there's
   no backend endpoint to regenerate insights on demand, so the dedicated tab
   adds little. The orphan components (AiSummaryPanel, JciTagPickerPanel,
   ConfidencePill, TagSuggestionRow, ConfirmedTagRow) belong to the original
   mock-driven design and are kept here for reference only.
function AiTab({ policy }) {
  const summary = policy.detail.summary;
  const keyClauses = policy.detail.keyClauses ?? [];
  const isSummaryPlaceholder =
    !summary || summary === "Summary not available yet.";

  return (
    <div className="grid gap-4">
      <AiHeader />
      <AiSummarySection summary={summary} placeholder={isSummaryPlaceholder} />
      <KeyClausesSection clauses={keyClauses} />
      <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-[11px] leading-5 text-slate-600">
        For the JCI requirement crosswalk (covered vs gaps with remediation
        suggestions), see the{" "}
        <span className="font-semibold text-slate-800">Checklist</span> tab.
      </p>
    </div>
  );
}

function AiSummarySection({ summary, placeholder }) {
  return (
    <section className="rounded-2xl border border-slate-100 bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
        <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-cyan-700">
          <FaWandMagicSparkles className="h-3 w-3" aria-hidden="true" />
          AI summary
        </p>
        <span className="text-[10px] text-slate-500">
          Generated by the upload pipeline
        </span>
      </div>
      <div className="p-4">
        {placeholder ? (
          <p className="text-xs italic text-slate-500">
            Summary is still being generated. The background pipeline runs
            shortly after upload — refresh the page in a few seconds.
          </p>
        ) : (
          <p className="whitespace-pre-wrap text-xs leading-6 text-slate-700">
            {summary}
          </p>
        )}
      </div>
    </section>
  );
}

function KeyClausesSection({ clauses }) {
  return (
    <section className="rounded-2xl border border-slate-100 bg-white">
      <div className="border-b border-slate-100 px-4 py-2.5">
        <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-cyan-700">
          <FaWandMagicSparkles className="h-3 w-3" aria-hidden="true" />
          Key clauses
        </p>
      </div>
      <div className="p-4">
        {clauses.length === 0 ? (
          <p className="text-xs italic text-slate-500">
            No key clauses extracted yet.
          </p>
        ) : (
          <ol className="grid gap-2">
            {clauses.map((clause, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2 text-xs leading-6 text-slate-700"
              >
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-cyan-100 text-[10px] font-semibold text-cyan-700">
                  {idx + 1}
                </span>
                <span>{clause}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
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
            Generated by the background pipeline when this version was uploaded.
          </p>
        </div>
      </div>
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
*/

const ACTIVITY_TYPE_STYLES = {
  uploaded: {
    dot: "bg-cyan-500",
    label: "Uploaded",
    chip: "bg-cyan-50 text-cyan-700 ring-cyan-200",
  },
  version_uploaded: {
    dot: "bg-cyan-500",
    label: "New version",
    chip: "bg-cyan-50 text-cyan-700 ring-cyan-200",
  },
  metadata_updated: {
    dot: "bg-slate-400",
    label: "Metadata",
    chip: "bg-slate-100 text-slate-700 ring-slate-200",
  },
  status_changed: {
    dot: "bg-amber-500",
    label: "Status",
    chip: "bg-amber-50 text-amber-700 ring-amber-200",
  },
  audited: {
    dot: "bg-emerald-500",
    label: "Audit",
    chip: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  },
  deleted: {
    dot: "bg-red-500",
    label: "Deleted",
    chip: "bg-red-50 text-red-700 ring-red-200",
  },
  restored: {
    dot: "bg-emerald-500",
    label: "Restored",
    chip: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  },
};

function ActivityTab({ policy }) {
  const activity = policy.detail.activity ?? [];

  if (activity.length === 0) {
    return (
      <div className="grid place-items-center gap-2 px-4 py-12 text-center text-sm text-slate-500">
        <p>No activity recorded for this policy yet.</p>
      </div>
    );
  }

  return (
    <ol className="relative grid gap-5 pl-5">
      <span
        aria-hidden="true"
        className="absolute left-1.5 top-2 bottom-2 w-px bg-slate-200"
      />
      {activity.map((entry) => {
        const styles = ACTIVITY_TYPE_STYLES[entry.eventType] ?? {
          dot: "bg-slate-400",
          label: entry.eventType ?? "Event",
          chip: "bg-slate-100 text-slate-700 ring-slate-200",
        };
        return (
          <li key={entry.id} className="relative">
            <span
              aria-hidden="true"
              className={`absolute -left-[18px] top-1 h-2.5 w-2.5 rounded-full ring-2 ring-white ${styles.dot}`}
            />
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ${styles.chip}`}
              >
                {styles.label}
              </span>
              <p className="text-xs font-medium text-slate-900">
                {entry.action}
              </p>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              {formatDateTime(entry.at)}
              {entry.actor && (
                <>
                  {" · "}
                  <span className="font-medium text-slate-600">
                    {entry.actor}
                  </span>
                </>
              )}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

function formatChapterMeta(jciContext) {
  if (!jciContext) return null;
  const code = jciContext.chapterCode;
  const name = jciContext.chapterName;
  if (code && name) return `${code} · ${name}`;
  if (code) return code;
  if (name) return name;
  return null;
}

function adaptJciContext(ctx) {
  if (!ctx) return null;
  return {
    chapterCode: ctx.chapter_code ?? null,
    chapterName: ctx.chapter_name ?? null,
    goalCode: ctx.goal_code ?? null,
    goalName: ctx.goal_name ?? null,
    intentText: ctx.intent_text ?? null,
    rationaleText: ctx.rationale_text ?? null,
    measurableElements: (ctx.measurable_elements ?? []).map((me) => ({
      code: me.code,
      number: me.number,
      text: me.text,
    })),
  };
}

function adaptAuditToGapAnalysis(api) {
  const jci = api?.JCI ?? { covered: [], gaps: [] };
  return {
    JCI: {
      covered: (jci.covered ?? []).map((c) => ({
        code: c.code,
        label: c.label,
        text: c.text,
        citation: c.citation ?? null,
        jciContext: adaptJciContext(c.jci_context),
      })),
      gaps: (jci.gaps ?? []).map((g) => ({
        code: g.code,
        label: g.label,
        text: g.text,
        severity: g.severity,
        remediation: g.remediation,
        recommendedTemplate: g.recommended_template ?? null,
        jciContext: adaptJciContext(g.jci_context),
      })),
    },
  };
}

function ChecklistTab({ policy }) {
  const dispatch = useDispatch();
  const { audit, auditPolicyId, auditStatus, auditError } = useSelector(
    (state) => state.policies,
  );

  const isMatchingAudit = auditPolicyId === policy?.id && audit != null;

  useEffect(() => {
    if (policy?.id != null) dispatch(fetchAudit(policy.id));
  }, [dispatch, policy?.id]);

  // Poll while the background pipeline is still cooking. Cleared on unmount,
  // status change, or when the user navigates to a different policy.
  useEffect(() => {
    if (auditStatus !== "pending" || policy?.id == null) return undefined;
    const intervalId = setInterval(() => {
      dispatch(fetchAudit(policy.id));
    }, 5000);
    return () => clearInterval(intervalId);
  }, [dispatch, auditStatus, policy?.id]);

  const gapAnalysis = useMemo(
    () => (isMatchingAudit ? adaptAuditToGapAnalysis(audit) : null),
    [isMatchingAudit, audit],
  );

  const handleRerun = () => {
    if (policy?.id != null) dispatch(runAudit(policy.id));
  };

  if (!isMatchingAudit) {
    if (auditStatus === "pending") {
      return (
        <div className="grid place-items-center gap-2 px-4 py-12 text-center">
          <p className="text-sm font-medium text-slate-700">
            Audit is being generated…
          </p>
          <p className="text-xs text-slate-500">
            The process usually takes 30–60 seconds. We'll refresh
            automatically.
          </p>
        </div>
      );
    }
    if (auditStatus === "failed") {
      return (
        <div className="grid place-items-center gap-3 px-4 py-12 text-center">
          <p className="text-sm text-red-700">
            Failed to load audit: {auditError?.message ?? "unknown error"}
          </p>
          <button
            type="button"
            onClick={() => dispatch(fetchAudit(policy.id))}
            className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Retry
          </button>
        </div>
      );
    }
    return (
      <div className="px-4 py-12 text-center text-sm text-slate-500">
        Loading audit…
      </div>
    );
  }

  const generatedAt = audit?.generated_at
    ? new Date(audit.generated_at)
    : new Date();

  return (
    <ChecklistTabBody
      policy={policy}
      gapAnalysis={gapAnalysis}
      generatedAt={generatedAt}
      auditStatus={auditStatus}
      onRerun={handleRerun}
    />
  );
}

function ChecklistTabBody({
  policy,
  gapAnalysis,
  generatedAt,
  auditStatus,
  onRerun,
}) {
  const [bodyFilter, setBodyFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [detailItem, setDetailItem] = useState(null);

  const allBodySummaries = ACCREDITATION_BODIES.map((body) => {
    const data = gapAnalysis[body] ?? { covered: [], gaps: [] };
    const total = data.covered.length + data.gaps.length;
    const coveragePct =
      total === 0 ? 0 : Math.round((data.covered.length / total) * 100);
    return { body, data, total, coveragePct };
  });

  const totals = allBodySummaries.reduce(
    (acc, b) => ({
      total: acc.total + b.total,
      covered: acc.covered + b.data.covered.length,
      gaps: acc.gaps + b.data.gaps.length,
      critical:
        acc.critical +
        b.data.gaps.filter((g) => g.severity === "Critical").length,
    }),
    { total: 0, covered: 0, gaps: 0, critical: 0 },
  );
  const overallPct =
    totals.total === 0 ? 0 : Math.round((totals.covered / totals.total) * 100);

  const filteredSummaries = allBodySummaries
    .filter(({ body }) => bodyFilter === "ALL" || body === bodyFilter)
    .map(({ body, data, total, coveragePct }) => {
      if (statusFilter === "covered") {
        return {
          body,
          data: { ...data, gaps: [] },
          total,
          coveragePct,
        };
      }
      if (statusFilter === "gap") {
        return {
          body,
          data: { ...data, covered: [] },
          total,
          coveragePct,
        };
      }
      return { body, data, total, coveragePct };
    });

  function handlePrint() {
    window.print();
  }

  function handleDownloadPdf() {
    const doc = buildChecklistPdf(
      policy,
      allBodySummaries,
      totals,
      overallPct,
      generatedAt,
    );
    doc.save(`${policy.code}-accreditation-checklist.pdf`);
  }

  return (
    <div id="accreditation-checklist-print-root" className="grid gap-4">
      <header className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-cyan-200 bg-gradient-to-br from-cyan-50/60 to-white px-4 py-3 print:border-slate-300 print:bg-white">
        <div className="flex items-start gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-cyan-600 text-white print:hidden">
            <FaSquareCheck className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-cyan-700">
              Policy accreditation checklist
            </p>
            <p className="mt-0.5 text-sm font-semibold text-slate-900">
              {policy.title}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-500">
              {policy.code} · {policy.version} · {policy.category} ·{" "}
              {policy.department}
            </p>
            <p className="text-[11px] text-slate-500">
              Owner: {policy.owner} · Generated {formatDateTime(generatedAt)}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <button
            type="button"
            onClick={onRerun}
            disabled={auditStatus === "loading"}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {auditStatus === "loading" ? "Re-running…" : "Re-run audit"}
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <FaPrint className="h-3 w-3" aria-hidden="true" />
            Print
          </button>
          <button
            type="button"
            onClick={handleDownloadPdf}
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-cyan-600 px-3 text-xs font-semibold text-white hover:bg-cyan-700"
          >
            <FaDownload className="h-3 w-3" aria-hidden="true" />
            Download PDF
          </button>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryStat label="Total elements" value={totals.total} tone="slate" />
        <SummaryStat
          label="Covered"
          value={`${totals.covered} (${overallPct}%)`}
          tone="emerald"
        />
        <SummaryStat label="Gaps" value={totals.gaps} tone="red" />
        <SummaryStat
          label="Critical gaps"
          value={totals.critical}
          tone="amber"
        />
      </section>

      <div className="flex flex-wrap items-center gap-2 print:hidden">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          Filter
        </span>
        {ACCREDITATION_BODIES.length > 1 && (
          <label className="inline-flex items-center gap-1.5 text-[11px] text-slate-500">
            <span>Body</span>
            <select
              value={bodyFilter}
              onChange={(e) => setBodyFilter(e.target.value)}
              className="h-7 rounded-md border border-slate-200 bg-white px-2 text-[11px] font-medium text-slate-700 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
            >
              <option value="ALL">All bodies</option>
              {ACCREDITATION_BODIES.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="inline-flex items-center gap-1.5 text-[11px] text-slate-500">
          <span>Status</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-7 rounded-md border border-slate-200 bg-white px-2 text-[11px] font-medium text-slate-700 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
          >
            <option value="ALL">All</option>
            <option value="covered">Covered only</option>
            <option value="gap">Gaps only</option>
          </select>
        </label>
        <span className="text-[10px] text-slate-400">
          Filters affect on-screen view only — Print and Download PDF always
          export the full checklist.
        </span>
      </div>

      <div className="grid gap-4">
        {filteredSummaries.map(({ body, data, total, coveragePct }) => (
          <BodyChecklistSection
            key={body}
            body={body}
            data={data}
            total={total}
            coveragePct={coveragePct}
            onViewFull={setDetailItem}
          />
        ))}
        {filteredSummaries.every(
          ({ data }) => data.covered.length === 0 && data.gaps.length === 0,
        ) && (
          <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-xs text-slate-500">
            No items match the current filter.
          </p>
        )}
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #accreditation-checklist-print-root,
          #accreditation-checklist-print-root * { visibility: visible !important; }
          #accreditation-checklist-print-root {
            position: absolute !important;
            inset: 0 !important;
            margin: 0 !important;
            padding: 24px !important;
            background: white !important;
          }
        }
      `}</style>

      {detailItem && (
        <RequirementDetailModal
          item={detailItem}
          onClose={() => setDetailItem(null)}
        />
      )}
    </div>
  );
}

function SummaryStat({ label, value, tone }) {
  const tones = {
    slate: "border-slate-200 bg-slate-50 text-slate-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    red: "border-red-200 bg-red-50 text-red-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
  };
  return (
    <div className={`rounded-lg border p-3 ${tones[tone] ?? tones.slate}`}>
      <p className="text-[10px] font-semibold uppercase tracking-wide opacity-80">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}

function BodyChecklistSection({ body, data, total, coveragePct, onViewFull }) {
  return (
    <section className="break-inside-avoid rounded-xl border border-slate-200 print:border-slate-300">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-4 py-2 print:bg-white">
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-slate-900 px-2 py-0.5 text-[11px] font-semibold text-white">
            {body}
          </span>
          <span className="text-xs font-semibold text-slate-700">
            Standards crosswalk
          </span>
        </div>
        <span className="text-[11px] font-medium text-slate-600">
          {data.covered.length}/{total} covered ({coveragePct}%)
        </span>
      </header>

      {total === 0 ? (
        <p className="px-4 py-4 text-xs text-slate-500">
          No elements defined for this body.
        </p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {data.covered.map((el) => (
            <ChecklistRow
              key={`covered-${el.code}`}
              checked
              code={el.code}
              label={el.label}
              text={el.text}
              meta={formatChapterMeta(el.jciContext)}
              metaText={el.citation?.excerpt}
              status="covered"
              onViewFull={() => onViewFull({ kind: "covered", el })}
            />
          ))}
          {data.gaps.map((el) => (
            <ChecklistRow
              key={`gap-${el.code}`}
              checked={false}
              code={el.code}
              label={el.label}
              text={el.text}
              meta={`Gap · ${el.severity}`}
              metaText={el.remediation}
              status="gap"
              severity={el.severity}
              recommendedTemplate={el.recommendedTemplate}
              onViewFull={() => onViewFull({ kind: "gap", el })}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function JciContextSection({ ctx }) {
  if (!ctx) return null;
  const hasChapter = ctx.chapterCode || ctx.chapterName;
  const hasGoal = ctx.goalCode || ctx.goalName;
  const hasMEs = ctx.measurableElements && ctx.measurableElements.length > 0;
  if (
    !hasChapter &&
    !hasGoal &&
    !ctx.intentText &&
    !ctx.rationaleText &&
    !hasMEs
  ) {
    return null;
  }
  return (
    <section className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-600">
        JCI context
      </p>
      <dl className="mt-2 grid gap-2 text-xs leading-6 text-slate-700">
        {hasChapter && (
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Chapter
            </dt>
            <dd className="mt-0.5">
              {ctx.chapterCode && (
                <span className="font-semibold text-slate-900">
                  {ctx.chapterCode}
                </span>
              )}
              {ctx.chapterCode && ctx.chapterName && " · "}
              {ctx.chapterName}
            </dd>
          </div>
        )}
        {hasGoal && (
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Goal
            </dt>
            <dd className="mt-0.5">
              {ctx.goalCode && (
                <span className="font-semibold text-slate-900">
                  {ctx.goalCode}
                </span>
              )}
              {ctx.goalCode && ctx.goalName && " · "}
              {ctx.goalName}
            </dd>
          </div>
        )}
        {ctx.intentText && (
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Intent
            </dt>
            <dd className="mt-0.5 whitespace-pre-wrap">{ctx.intentText}</dd>
          </div>
        )}
        {ctx.rationaleText && (
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Rationale
            </dt>
            <dd className="mt-0.5 whitespace-pre-wrap">{ctx.rationaleText}</dd>
          </div>
        )}
        {hasMEs && (
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Measurable elements
            </dt>
            <dd className="mt-0.5">
              <ol className="grid gap-1.5">
                {ctx.measurableElements.map((me) => (
                  <li key={me.code} className="flex gap-2">
                    <span className="shrink-0 rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700">
                      ME {me.number}
                    </span>
                    <span className="leading-6">{me.text}</span>
                  </li>
                ))}
              </ol>
            </dd>
          </div>
        )}
      </dl>
    </section>
  );
}

function RequirementDetailModal({ item, onClose }) {
  const { kind, el } = item;
  const isCovered = kind === "covered";

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-4 print:hidden"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="grid w-full max-w-2xl gap-4 overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <header
          className={`flex items-start justify-between gap-3 px-5 py-3 ${
            isCovered ? "bg-emerald-50" : "bg-red-50"
          }`}
        >
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-md px-2 py-0.5 text-[11px] font-semibold text-white ${
                  isCovered ? "bg-emerald-600" : "bg-red-600"
                }`}
              >
                {el.code}
              </span>
              <span
                className={`text-[10px] font-semibold uppercase tracking-wide ${
                  isCovered ? "text-emerald-700" : "text-red-700"
                }`}
              >
                {isCovered ? "Covered" : "Gap"}
              </span>
              {!isCovered && el.severity && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${
                    el.severity === "Critical"
                      ? "bg-red-100 text-red-700 ring-red-200"
                      : "bg-amber-50 text-amber-700 ring-amber-200"
                  }`}
                >
                  {el.severity}
                </span>
              )}
            </div>
            <h3 className="mt-2 text-sm font-semibold leading-snug text-slate-900">
              {el.label}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-slate-500 hover:bg-white/60 hover:text-slate-700"
          >
            ×
          </button>
        </header>

        <div className="grid gap-4 px-5 pb-5 max-h-[70vh] overflow-y-auto">
          <section>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Requirement text
            </p>
            <p className="mt-1 whitespace-pre-wrap text-xs leading-6 text-slate-700">
              {el.text || "—"}
            </p>
          </section>

          <JciContextSection ctx={el.jciContext} />

          {isCovered && el.citation && (
            <section>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                Matched policy text
              </p>
              <blockquote className="mt-1 rounded-lg border-l-4 border-emerald-300 bg-emerald-50/50 px-3 py-2 text-xs leading-6 text-slate-700">
                {el.citation.excerpt || "—"}
              </blockquote>
              {el.citation.label &&
                el.citation.label !== "Matched policy text" && (
                  <p className="mt-1 text-[10px] text-slate-500">
                    From section: {el.citation.label}
                  </p>
                )}
            </section>
          )}

          {!isCovered && (
            <>
              <section>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-red-700">
                  Suggested remediation
                </p>
                <p className="mt-1 whitespace-pre-wrap text-xs leading-6 text-slate-700">
                  {el.remediation || "—"}
                </p>
              </section>
              {el.recommendedTemplate && (
                <section>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-cyan-700">
                    Recommended template
                  </p>
                  <p className="mt-1 text-xs text-slate-700">
                    <span className="font-semibold">
                      {el.recommendedTemplate.code}
                    </span>{" "}
                    — {el.recommendedTemplate.title}
                  </p>
                  {el.recommendedTemplate.filename && (
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      {el.recommendedTemplate.filename}
                    </p>
                  )}
                </section>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ChecklistRow({
  checked,
  code,
  label,
  text,
  meta,
  metaText,
  status,
  severity,
  recommendedTemplate,
  onViewFull,
}) {
  return (
    <li className="flex gap-3 px-4 py-3">
      <span
        className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded ${
          checked ? "text-emerald-600" : "text-slate-300"
        }`}
        aria-hidden="true"
      >
        {checked ? (
          <FaSquareCheck className="h-4 w-4" />
        ) : (
          <FaRegSquare className="h-4 w-4" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold text-white ${
              status === "covered" ? "bg-emerald-600" : "bg-red-600"
            }`}
          >
            {code}
          </span>
          <span className="text-xs font-semibold text-slate-900">{label}</span>
          {status === "gap" && severity && (
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ring-1 ${
                severity === "Critical"
                  ? "bg-red-50 text-red-700 ring-red-200"
                  : "bg-amber-50 text-amber-700 ring-amber-200"
              }`}
            >
              {severity}
            </span>
          )}
          {onViewFull && (
            <button
              type="button"
              onClick={onViewFull}
              className="ml-auto inline-flex h-6 items-center rounded-md border border-slate-200 bg-white px-2 text-[10px] font-semibold text-slate-700 hover:bg-slate-50 print:hidden"
            >
              View full
            </button>
          )}
        </div>
        <p className="mt-1 text-[11px] leading-5 text-slate-600">{text}</p>
        {meta && (
          <p
            className={`mt-1.5 text-[10px] font-semibold uppercase tracking-wide ${
              status === "covered" ? "text-emerald-700" : "text-red-700"
            }`}
          >
            {meta}
          </p>
        )}
        {metaText && (
          <p className="mt-0.5 text-[11px] leading-5 text-slate-600">
            {status === "covered" ? `"${metaText}"` : metaText}
          </p>
        )}
        {status === "gap" && recommendedTemplate && (
          <TemplateRecommendation
            template={recommendedTemplate}
            elementCode={code}
            elementLabel={label}
            elementText={text}
          />
        )}
      </div>
    </li>
  );
}

function TemplateRecommendation({
  template,
  elementCode,
  elementLabel,
  elementText,
}) {
  const [feedback, setFeedback] = useState(null);

  function downloadBlob(filename, body) {
    const blob =
      body instanceof Blob
        ? body
        : new Blob([body], {
            type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  async function handleDownload() {
    try {
      const response = await policyAPI.downloadTemplate(template.code);
      downloadBlob(template.filename, response.data);
      setFeedback(`Downloaded ${template.code} template.`);
    } catch (err) {
      const status = err?.response?.status;
      setFeedback(
        status === 404
          ? `Template ${template.code} is missing on the server.`
          : `Failed to download ${template.code}.`,
      );
    }
    setTimeout(() => setFeedback(null), 3500);
  }

  function handleAiFill() {
    const filename = template.filename.replace(/\.docx$/, "_AI-filled.docx");
    downloadBlob(
      filename,
      buildAiFilledTemplate(template, {
        elementCode,
        elementLabel,
        elementText,
      }),
    );
    setFeedback(`AI-filled ${template.code} drafted and downloaded.`);
    setTimeout(() => setFeedback(null), 3500);
  }

  return (
    <div className="mt-2 rounded-lg border border-cyan-200 bg-cyan-50/40 px-3 py-2 print:hidden">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-cyan-700">
        Recommended template
      </p>
      <div className="mt-1 flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-900">
            <span className="grid h-5 w-5 place-items-center rounded bg-white text-cyan-700 ring-1 ring-cyan-200">
              <FaFileLines className="h-3 w-3" aria-hidden="true" />
            </span>
            <span className="truncate">
              {template.code} — {template.title}
            </span>
          </p>
          <p className="mt-0.5 truncate text-[10px] text-slate-500">
            {template.filename}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex h-7 items-center gap-1 rounded-md border border-slate-200 bg-white px-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
          >
            <FaDownload className="h-2.5 w-2.5" aria-hidden="true" />
            Download template
          </button>
        </div>
      </div>
      {feedback && (
        <p className="mt-1.5 text-[10px] font-medium text-emerald-700">
          {feedback}
        </p>
      )}
    </div>
  );
}

function buildTemplateSkeleton({ code, title }) {
  return [
    `TITLE: ${title.toUpperCase()}`,
    `IDENTIFICATION NUMBER: ${code}`,
    `ORIGINAL DATE: January 2025`,
    `LAST REVISION DATE: —`,
    `HOSPITAL(S): XYZ HOSPITAL`,
    `NEXT REVIEW DATE: January 2028`,
    ``,
    `PURPOSE (AIM):`,
    `To establish standardized procedures, responsibilities, and quality standards for "${title}" at XYZ HOSPITAL, ensuring patient safety, regulatory compliance, operational consistency, and alignment with applicable accreditation standards.`,
    ``,
    `DEFINITION:`,
    `Refer to the hospital glossary of terms; specific definitions for "${title}" shall be inserted by the policy owner where required.`,
    ``,
    `APPLIES TO:`,
    `[ List target staff groups ]`,
    ``,
    `PATIENT GROUP:`,
    `[ Define applicable patient cohort ]`,
    ``,
    `EXCEPTIONS:`,
    `Any exception to this policy shall be documented, justified, and approved by the Department Head and Quality Department.`,
    ``,
    `TARGET AREAS:`,
    `[ List clinical / operational areas ]`,
    ``,
    `PROTOCOLS:`,
    `[ Insert hospital-specific protocols, roles, and responsibilities ]`,
    ``,
    `SPECIAL CONSIDERATIONS:`,
    `[ Insert special considerations ]`,
    ``,
    `REFERENCES:`,
    `[ Insert regulatory and accreditation references ]`,
    ``,
    `ATTACHMENTS:`,
    `[ List attached forms, checklists, and consents ]`,
  ].join("\n");
}

function buildAiFilledTemplate(template, element) {
  return [
    `TITLE: ${template.title.toUpperCase()}`,
    `IDENTIFICATION NUMBER: ${template.code}`,
    `ORIGINAL DATE: January 2025`,
    `LAST REVISION DATE: —`,
    `HOSPITAL(S): XYZ HOSPITAL`,
    `NEXT REVIEW DATE: January 2028`,
    ``,
    `— DRAFT GENERATED BY INTEGRIIX AI —`,
    `Source gap: ${element.elementCode} · ${element.elementLabel}`,
    `Requirement text: ${element.elementText}`,
    ``,
    `PURPOSE (AIM):`,
    `To define the standards and accountability framework that bring XYZ Hospital into compliance with ${element.elementCode} (${element.elementLabel}). This policy specifies the controls, roles, and review cadence required to address: ${element.elementText}`,
    ``,
    `DEFINITION:`,
    `Key terms used in this policy follow the definitions in the XYZ Hospital glossary. For the purposes of ${element.elementCode}, the policy adopts the wording of the accreditation element verbatim where applicable.`,
    ``,
    `APPLIES TO:`,
    `All staff whose duties intersect with the scope of ${element.elementCode}, including clinical, allied health, pharmacy, and supervisory personnel as relevant.`,
    ``,
    `PATIENT GROUP:`,
    `All patients within the scope of ${template.title}, irrespective of age, gender, or service line, unless explicitly excluded below.`,
    ``,
    `EXCEPTIONS:`,
    `Documented and time-limited exceptions approved by the Department Head and Quality Department.`,
    ``,
    `TARGET AREAS:`,
    `Inpatient units, outpatient clinics, emergency department, pharmacy, and any unit with workflows touching ${element.elementLabel.toLowerCase()}.`,
    ``,
    `PROTOCOLS:`,
    `1. The Department Head is the policy owner and is accountable for implementation, monitoring, and annual review.`,
    `2. All affected staff shall be trained at induction and re-trained annually on the requirements of ${element.elementCode}.`,
    `3. The hospital shall implement the controls described by ${element.elementCode}, with documented evidence retained in the unit's compliance file.`,
    `4. KPIs aligned to ${element.elementCode} shall be reported quarterly to the Quality Committee.`,
    `5. Any deviation shall be reported via the incident reporting system within 24 hours.`,
    ``,
    `SPECIAL CONSIDERATIONS:`,
    `Where local regulation imposes a stricter standard than the accreditation element, the stricter standard prevails.`,
    ``,
    `REFERENCES:`,
    `- ${element.elementCode}: ${element.elementLabel}`,
    `- ${element.elementText}`,
    `- XYZ Hospital Quality Manual, current edition.`,
    ``,
    `ATTACHMENTS:`,
    `- Compliance checklist for ${element.elementCode}`,
    `- Training acknowledgement form`,
    `- KPI monitoring template`,
    ``,
    `(This is an AI-generated draft. Hospital subject-matter experts must review, edit, and approve before issue.)`,
  ].join("\n");
}

function buildChecklistPdf(
  policy,
  bodySummaries,
  totals,
  overallPct,
  generatedAt,
) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  function ensureSpace(needed) {
    if (y + needed > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  }

  function drawTextBlock(text, options = {}) {
    const {
      size = 10,
      style = "normal",
      color = [30, 41, 59],
      lineHeight = 1.35,
      indent = 0,
      maxWidth = contentWidth - indent,
    } = options;
    doc.setFontSize(size);
    doc.setFont("helvetica", style);
    doc.setTextColor(color[0], color[1], color[2]);
    const lines = doc.splitTextToSize(String(text ?? ""), maxWidth);
    const lh = size * lineHeight;
    lines.forEach((line) => {
      ensureSpace(lh);
      doc.text(line, margin + indent, y + size);
      y += lh;
    });
  }

  function drawDivider() {
    ensureSpace(8);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(margin, y + 4, pageWidth - margin, y + 4);
    y += 10;
  }

  // Header
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(14, 116, 144);
  doc.text("POLICY ACCREDITATION CHECKLIST", margin, y + 9);
  y += 18;

  drawTextBlock(policy.title, { size: 16, style: "bold", color: [15, 23, 42] });
  drawTextBlock(
    `${policy.code} · ${policy.version} · ${policy.category} · ${policy.department}`,
    { size: 10, color: [100, 116, 139] },
  );
  drawTextBlock(
    `Owner: ${policy.owner} · Generated ${formatDateTime(generatedAt)}`,
    { size: 10, color: [100, 116, 139] },
  );

  drawDivider();

  // Summary stats
  const statBoxes = [
    {
      label: "Total elements",
      value: String(totals.total),
      bg: [241, 245, 249],
      fg: [51, 65, 85],
    },
    {
      label: "Covered",
      value: `${totals.covered} (${overallPct}%)`,
      bg: [236, 253, 245],
      fg: [6, 95, 70],
    },
    {
      label: "Gaps",
      value: String(totals.gaps),
      bg: [254, 242, 242],
      fg: [153, 27, 27],
    },
    {
      label: "Critical gaps",
      value: String(totals.critical),
      bg: [255, 251, 235],
      fg: [146, 64, 14],
    },
  ];
  const statW = (contentWidth - 12) / 4;
  const statH = 48;
  ensureSpace(statH + 12);
  statBoxes.forEach((stat, idx) => {
    const x = margin + idx * (statW + 4);
    doc.setFillColor(stat.bg[0], stat.bg[1], stat.bg[2]);
    doc.roundedRect(x, y, statW, statH, 4, 4, "F");
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(stat.fg[0], stat.fg[1], stat.fg[2]);
    doc.text(stat.label.toUpperCase(), x + 8, y + 14);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(stat.value, x + 8, y + 34);
  });
  y += statH + 14;

  // Body sections
  bodySummaries.forEach(({ body, data, total, coveragePct }) => {
    ensureSpace(48);

    // Body header bar
    doc.setFillColor(15, 23, 42);
    doc.roundedRect(margin, y, 44, 18, 3, 3, "F");
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text(body, margin + 6, y + 12);

    doc.setTextColor(51, 65, 85);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Standards crosswalk", margin + 54, y + 12);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    const coverageText = `${data.covered.length}/${total} covered (${coveragePct}%)`;
    const cw = doc.getTextWidth(coverageText);
    doc.text(coverageText, pageWidth - margin - cw, y + 12);
    y += 24;

    const items = [
      ...data.covered.map((el) => ({
        status: "covered",
        code: el.code,
        label: el.label,
        text: el.text,
        meta: formatChapterMeta(el.jciContext) ?? "",
        metaText: el.citation?.excerpt ?? "",
        severity: "",
      })),
      ...data.gaps.map((el) => ({
        status: "gap",
        code: el.code,
        label: el.label,
        text: el.text,
        meta: `Gap · ${el.severity}`,
        metaText: el.remediation ?? "",
        severity: el.severity,
      })),
    ];

    if (items.length === 0) {
      drawTextBlock("No elements defined for this body.", {
        size: 9,
        color: [100, 116, 139],
        indent: 6,
      });
      y += 6;
      return;
    }

    items.forEach((it) => {
      ensureSpace(40);

      // Checkbox
      const boxX = margin;
      const boxY = y + 2;
      const boxSize = 10;
      doc.setDrawColor(148, 163, 184);
      doc.setLineWidth(0.6);
      doc.rect(boxX, boxY, boxSize, boxSize);
      if (it.status === "covered") {
        doc.setDrawColor(5, 150, 105);
        doc.setLineWidth(1.4);
        doc.line(boxX + 2, boxY + 5, boxX + 4.5, boxY + 8);
        doc.line(boxX + 4.5, boxY + 8, boxX + 8.5, boxY + 2.5);
      }

      // Code badge
      const codeText = it.code;
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      const codeW = doc.getTextWidth(codeText) + 8;
      const codeX = margin + 18;
      const codeY = y;
      const codeColor = it.status === "covered" ? [5, 150, 105] : [220, 38, 38];
      doc.setFillColor(codeColor[0], codeColor[1], codeColor[2]);
      doc.roundedRect(codeX, codeY, codeW, 12, 2, 2, "F");
      doc.setTextColor(255, 255, 255);
      doc.text(codeText, codeX + 4, codeY + 8.5);

      // Label
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      const labelStartX = codeX + codeW + 6;
      let severityText = "";
      let severityW = 0;
      if (it.severity) {
        severityText = it.severity;
        doc.setFontSize(8);
        severityW = doc.getTextWidth(severityText) + 10;
        doc.setFontSize(10);
      }
      const labelMaxW = pageWidth - margin - labelStartX - severityW - 4;
      const labelLines = doc.splitTextToSize(it.label, labelMaxW);
      doc.text(labelLines[0], labelStartX, y + 9);

      // Severity pill
      if (it.severity) {
        const sevX = pageWidth - margin - severityW;
        const sevColors =
          it.severity === "Critical"
            ? { fill: [254, 226, 226], text: [153, 27, 27] }
            : { fill: [253, 230, 138], text: [146, 64, 14] };
        doc.setFillColor(
          sevColors.fill[0],
          sevColors.fill[1],
          sevColors.fill[2],
        );
        doc.roundedRect(sevX, y, severityW, 12, 6, 6, "F");
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(
          sevColors.text[0],
          sevColors.text[1],
          sevColors.text[2],
        );
        doc.text(severityText, sevX + 5, y + 8.5);
      }
      y += 16;

      // Description
      drawTextBlock(it.text, {
        size: 9,
        color: [71, 85, 105],
        indent: 18,
      });

      // Meta
      if (it.meta) {
        drawTextBlock(it.meta.toUpperCase(), {
          size: 7,
          style: "bold",
          color: it.status === "covered" ? [4, 120, 87] : [185, 28, 28],
          indent: 18,
        });
      }
      if (it.metaText) {
        drawTextBlock(
          it.status === "covered" ? `"${it.metaText}"` : it.metaText,
          {
            size: 9,
            color: [71, 85, 105],
            indent: 18,
          },
        );
      }

      y += 4;
      doc.setDrawColor(241, 245, 249);
      doc.setLineWidth(0.4);
      doc.line(margin, y, pageWidth - margin, y);
      y += 6;
    });

    y += 8;
  });

  // Footer
  ensureSpace(30);
  drawDivider();

  // Page numbers
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i += 1) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(148, 163, 184);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, pageHeight - 16, {
      align: "right",
    });
    doc.text(
      `${policy.code} · Accreditation checklist`,
      margin,
      pageHeight - 16,
    );
  }

  return doc;
}
export default PolicyDetail;
