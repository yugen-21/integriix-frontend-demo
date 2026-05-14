import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  FaArrowLeft,
  FaCheck,
  FaCircleCheck,
  FaFileLines,
  FaLightbulb,
  FaListUl,
  FaPaperclip,
  FaPlus,
  FaShieldHalved,
  FaTriangleExclamation,
  FaUserTie,
  FaWandMagicSparkles,
  FaXmark,
} from "react-icons/fa6";
import { FINDING_STATUS_LABEL, SEVERITY_LABEL } from "../../../data";
import {
  aiAssistFromConditions,
  closeFinding,
  issueFinding,
  rankRisksByOverlap,
  respondFinding,
  updateFinding,
} from "../../../store/auditsSlice";

const SEVERITY_STYLES = {
  low: "bg-slate-100 text-slate-700 ring-slate-200",
  medium: "bg-sky-50 text-sky-700 ring-sky-200",
  significant: "bg-amber-50 text-amber-700 ring-amber-200",
  high: "bg-rose-50 text-rose-700 ring-rose-200",
};

const FINDING_STATUS_STYLES = {
  draft: "bg-slate-100 text-slate-700 ring-slate-200",
  issued: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  responded: "bg-amber-50 text-amber-700 ring-amber-200",
  closed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

const STANDARD_REF_STYLES = {
  jci: "border-l-rose-300 bg-rose-50/60",
  policy: "border-l-indigo-300 bg-indigo-50/60",
};

function FindingEditor({ audit, finding, onBack }) {
  const dispatch = useDispatch();
  const risks = useSelector((s) => s.risks.items);

  const [draft, setDraft] = useState({ ...finding });
  const [riskPicker, setRiskPicker] = useState(false);
  const [aiRunning, setAiRunning] = useState(false);
  const [aiCandidates, setAiCandidates] = useState([]);
  const [toast, setToast] = useState("");

  const isReadOnly =
    draft.status === "closed" || draft.status === "responded";
  const isResponseMode = draft.status === "issued";

  const linkedRisks = useMemo(
    () =>
      draft.riskIds
        .map((rid) => risks.find((r) => r.id === rid))
        .filter(Boolean),
    [draft.riskIds, risks],
  );

  function patch(local) {
    setDraft((d) => ({ ...d, ...local }));
  }

  function saveLocal(local) {
    patch(local);
    dispatch(
      updateFinding({
        auditId: audit.id,
        findingId: finding.id,
        patch: local,
      }),
    );
  }

  function showToast(message) {
    setToast(message);
    setTimeout(() => setToast(""), 2500);
  }

  function handleRunAi() {
    if (!draft.conditions || draft.conditions.trim().length < 20) {
      showToast(
        "Add at least a couple of sentences to Conditions, then re-run AI assist.",
      );
      return;
    }
    setAiRunning(true);
    // Simulated pipeline latency so the user perceives work happening.
    setTimeout(() => {
      const result = aiAssistFromConditions(draft.conditions);
      const candidates = rankRisksByOverlap(draft.conditions, 5);
      setAiCandidates(candidates);
      const merged = {
        riskIds: result.riskIds,
        criteria: {
          ...draft.criteria,
          standardReferences: result.standardReferences,
        },
        rootCauses: result.rootCauses,
        recommendations: result.recommendations,
        actionPlan: result.actionPlan || draft.actionPlan,
        aiAssisted: true,
      };
      patch(merged);
      dispatch(
        updateFinding({
          auditId: audit.id,
          findingId: finding.id,
          patch: merged,
        }),
      );
      setAiRunning(false);
      showToast(
        `AI drafted standard references, root causes, recommendations and action plan from ${candidates.length} ranked risk candidates.`,
      );
    }, 900);
  }

  function handleToggleRisk(riskId) {
    const next = draft.riskIds.includes(riskId)
      ? draft.riskIds.filter((id) => id !== riskId)
      : [...draft.riskIds, riskId];
    saveLocal({ riskIds: next });
  }

  function handleIssue() {
    dispatch(issueFinding({ auditId: audit.id, findingId: finding.id }));
    patch({ status: "issued" });
    showToast("Finding issued — handed off to the responsible department.");
  }

  function handleSubmitResponse() {
    dispatch(
      respondFinding({
        auditId: audit.id,
        findingId: finding.id,
        managementResponse: draft.managementResponse,
        actionPlan: draft.actionPlan,
        targetDate: draft.targetDate,
        responsibleOwners: draft.responsibleOwners,
      }),
    );
    patch({ status: "responded" });
    showToast("Management response recorded. Awaiting auditor close-out.");
  }

  function handleClose() {
    dispatch(closeFinding({ auditId: audit.id, findingId: finding.id }));
    patch({ status: "closed" });
    showToast("Finding closed. Linked risks notified.");
  }

  function handleAttachment() {
    showToast("Attachment upload is mocked in this build.");
  }

  return (
    <div className="grid min-w-0 gap-5 pb-24 max-[900px]:gap-4">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex w-fit items-center gap-1.5 text-[11px] font-medium text-slate-500 transition hover:text-slate-700"
      >
        <FaArrowLeft className="h-2.5 w-2.5" aria-hidden="true" />
        Back to {audit.title}
      </button>

      <HeaderCard draft={draft} audit={audit} />

      <ConditionsCard
        draft={draft}
        readOnly={isReadOnly || isResponseMode}
        onChange={(v) => patch({ conditions: v })}
        onBlur={() => saveLocal({ conditions: draft.conditions })}
        onAttach={handleAttachment}
      />

      {!isReadOnly && !isResponseMode && (
        <AiAssistStrip running={aiRunning} onRun={handleRunAi} />
      )}

      <CriteriaCard
        draft={draft}
        readOnly={isReadOnly || isResponseMode}
        onChange={(criteria) => saveLocal({ criteria })}
      />

      <RisksCard
        draft={draft}
        linkedRisks={linkedRisks}
        candidates={aiCandidates}
        readOnly={isReadOnly || isResponseMode}
        onOpenPicker={() => setRiskPicker(true)}
        onRemoveRisk={(rid) =>
          saveLocal({ riskIds: draft.riskIds.filter((id) => id !== rid) })
        }
      />

      <RootCausesCard
        draft={draft}
        readOnly={isReadOnly || isResponseMode}
        onChange={(rootCauses) => saveLocal({ rootCauses })}
      />

      <RecommendationsCard
        draft={draft}
        readOnly={isReadOnly || isResponseMode}
        onChange={(recommendations) => saveLocal({ recommendations })}
      />

      <ActionPlanCard
        draft={draft}
        readOnly={isReadOnly}
        responseMode={isResponseMode}
        onChange={(local) => patch(local)}
        onCommit={(local) => saveLocal(local)}
      />

      <ResponsibleCard
        draft={draft}
        readOnly={isReadOnly}
        responseMode={isResponseMode}
        onChange={(local) => patch(local)}
        onCommit={(local) => saveLocal(local)}
      />

      <ManagementResponseCard
        draft={draft}
        readOnly={isReadOnly}
        responseMode={isResponseMode}
        onChange={(managementResponse) => patch({ managementResponse })}
        onCommit={() =>
          saveLocal({ managementResponse: draft.managementResponse })
        }
      />

      <StickyFooter
        draft={draft}
        onIssue={handleIssue}
        onSubmitResponse={handleSubmitResponse}
        onClose={handleClose}
      />

      {riskPicker && (
        <RiskPickerModal
          candidates={aiCandidates}
          allRisks={risks}
          selectedIds={draft.riskIds}
          onToggle={handleToggleRisk}
          onClose={() => setRiskPicker(false)}
        />
      )}

      {toast && (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-slate-900 px-4 py-2 text-xs font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}

// ---------- Header ----------

function HeaderCard({ draft }) {
  return (
    <section className="relative min-w-0 overflow-hidden rounded-3xl border border-white/80 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.10)] max-[520px]:rounded-2xl">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,#fee2e2_0%,transparent_55%),radial-gradient(circle_at_bottom_left,#e0e7ff_0%,transparent_50%)]"
      />
      <div className="relative grid gap-4 p-6 max-[520px]:p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex h-6 items-center rounded bg-slate-900 px-2 text-[10px] font-bold uppercase tracking-wide text-white">
                AF{draft.afNumber}
              </span>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${SEVERITY_STYLES[draft.severity]}`}
              >
                {SEVERITY_LABEL[draft.severity]}
              </span>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${FINDING_STATUS_STYLES[draft.status]}`}
              >
                {FINDING_STATUS_LABEL[draft.status]}
              </span>
              {draft.aiAssisted && (
                <span className="inline-flex items-center gap-1 rounded-full bg-cyan-50 px-2 py-0.5 text-[10px] font-semibold text-cyan-700 ring-1 ring-cyan-200">
                  <FaWandMagicSparkles className="h-2.5 w-2.5" aria-hidden="true" />
                  AI-assisted
                </span>
              )}
            </div>
            <h1 className="mt-2 text-xl font-semibold leading-tight text-slate-900 max-[520px]:text-lg">
              {draft.title}
            </h1>
            <p className="mt-1 font-mono text-[11px] text-slate-500">
              WP Ref: {draft.wpRef}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------- Conditions ----------

function ConditionsCard({ draft, readOnly, onChange, onBlur, onAttach }) {
  return (
    <SectionCard
      icon={<FaFileLines className="h-3.5 w-3.5" aria-hidden="true" />}
      title="Conditions"
      hint="What did you observe on the ground? This is the auditor's primary input — AI uses this to fill the rest of the form."
    >
      <textarea
        value={draft.conditions}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        readOnly={readOnly}
        rows={8}
        placeholder="Describe the gap you observed. Include facility names, item numbers, variance quantities, dates, and any tables of numeric evidence."
        className={`w-full rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-xs leading-relaxed text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 ${
          readOnly ? "cursor-not-allowed bg-slate-50" : ""
        }`}
      />

      {draft.attachments.length > 0 && (
        <ul className="mt-3 grid gap-2">
          {draft.attachments.map((a, i) => (
            <li
              key={`${a.name}-${i}`}
              className="flex items-center justify-between rounded-lg border border-slate-100 bg-white px-3 py-2"
            >
              <div className="flex items-center gap-2 text-xs text-slate-700">
                <span className="inline-flex h-5 items-center rounded bg-slate-100 px-1.5 text-[9px] font-bold uppercase tracking-wide text-slate-600">
                  {a.kind}
                </span>
                {a.name}
              </div>
              <span className="text-[11px] text-slate-400">{a.size}</span>
            </li>
          ))}
        </ul>
      )}

      {!readOnly && (
        <button
          type="button"
          onClick={onAttach}
          className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-lg border border-dashed border-slate-300 bg-white px-3 text-[11px] font-medium text-slate-600 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
        >
          <FaPaperclip className="h-2.5 w-2.5" aria-hidden="true" />
          Attach evidence as annexure
        </button>
      )}
    </SectionCard>
  );
}

// ---------- AI Assist strip ----------

function AiAssistStrip({ running, onRun }) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-cyan-200 bg-gradient-to-br from-cyan-50 via-white to-indigo-50 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] max-[520px]:rounded-2xl max-[520px]:p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-100 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-cyan-800">
            <FaWandMagicSparkles className="h-3 w-3" aria-hidden="true" />
            AI assist
          </span>
          <h3 className="mt-1.5 text-sm font-semibold text-slate-900">
            Fill from Conditions
          </h3>
          <p className="mt-1 text-[11px] text-slate-600">
            Runs embedding search on Conditions → ranks 5 risk candidates → pulls
            controlling policies and JCI clauses → drafts root causes,
            recommendations, and an action plan. Everything stays editable.
          </p>
        </div>
        <button
          type="button"
          onClick={onRun}
          disabled={running}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-4 text-xs font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:translate-y-0 disabled:cursor-wait disabled:opacity-70"
        >
          {running ? (
            <>
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Running…
            </>
          ) : (
            <>
              <FaWandMagicSparkles className="h-3 w-3" aria-hidden="true" />
              Fill from Conditions
            </>
          )}
        </button>
      </div>
    </section>
  );
}

// ---------- Criteria ----------

function CriteriaCard({ draft, readOnly, onChange }) {
  function updateBackground(v) {
    onChange({ ...draft.criteria, background: v });
  }
  function removeRef(idx) {
    onChange({
      ...draft.criteria,
      standardReferences: draft.criteria.standardReferences.filter(
        (_, i) => i !== idx,
      ),
    });
  }

  return (
    <SectionCard
      icon={<FaShieldHalved className="h-3.5 w-3.5" aria-hidden="true" />}
      title="Criteria"
      hint="Background context for the finding plus the policies and JCI standards that were breached."
      aiPill={draft.criteria.standardReferences.length > 0}
    >
      <div className="grid gap-3">
        <div>
          <label className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
            Background
          </label>
          <textarea
            value={draft.criteria.background}
            onChange={(e) => updateBackground(e.target.value)}
            readOnly={readOnly}
            rows={3}
            placeholder="Why this matters — the regulatory or clinical context."
            className={`mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-xs leading-relaxed text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 ${
              readOnly ? "cursor-not-allowed bg-slate-50" : ""
            }`}
          />
        </div>

        <div>
          <label className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
            Standard references
          </label>
          {draft.criteria.standardReferences.length === 0 ? (
            <div className="mt-1 rounded-xl border border-dashed border-slate-200 bg-slate-50/40 px-3 py-4 text-center text-[11px] text-slate-400">
              No standards cited. Run AI assist to pull JCI clauses + policy
              sections from the matched risks.
            </div>
          ) : (
            <ul className="mt-1 grid gap-2">
              {draft.criteria.standardReferences.map((ref, i) => (
                <li
                  key={`${ref.code}-${i}`}
                  className={`flex items-start gap-3 rounded-xl border-l-4 bg-white p-3 ring-1 ring-slate-100 ${
                    STANDARD_REF_STYLES[ref.kind] ?? "border-l-slate-300"
                  }`}
                >
                  <div className="flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                      {ref.kind === "jci" ? "JCI" : "Hospital policy"} · {ref.code}
                    </p>
                    <p className="mt-1 text-xs text-slate-700">{ref.text}</p>
                  </div>
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => removeRef(i)}
                      className="inline-flex h-6 w-6 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-rose-600"
                      aria-label="Remove standard reference"
                    >
                      <FaXmark className="h-2.5 w-2.5" aria-hidden="true" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </SectionCard>
  );
}

// ---------- Risks ----------

function RisksCard({
  draft,
  linkedRisks,
  candidates,
  readOnly,
  onOpenPicker,
  onRemoveRisk,
}) {
  return (
    <SectionCard
      icon={<FaTriangleExclamation className="h-3.5 w-3.5" aria-hidden="true" />}
      title="Risks"
      hint="Risks from the Risk Register that this finding ties to. Severity auto-derives from the highest residual rating."
      aiPill={draft.aiAssisted && draft.riskIds.length > 0}
      actions={
        !readOnly ? (
          <button
            type="button"
            onClick={onOpenPicker}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-medium text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
          >
            <FaPlus className="h-2.5 w-2.5" aria-hidden="true" />
            Pick from register
            {candidates.length > 0 && (
              <span className="ml-1 rounded-full bg-cyan-100 px-1.5 text-[9px] font-bold text-cyan-700">
                {candidates.length} suggested
              </span>
            )}
          </button>
        ) : null
      }
    >
      {linkedRisks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/40 px-3 py-4 text-center text-[11px] text-slate-400">
          No risks linked yet. Run AI assist or pick from the register.
        </div>
      ) : (
        <ul className="grid gap-2">
          {linkedRisks.map((r) => (
            <li
              key={r.id}
              className="flex items-start gap-3 rounded-xl border border-slate-100 bg-white p-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[11px] font-semibold text-slate-700">
                    {r.id}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {r.department}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${residualBandClass(r.residualRating)}`}
                  >
                    Residual {r.residualRating}
                  </span>
                </div>
                <p className="mt-1 text-xs font-medium text-slate-900">
                  {r.title}
                </p>
                <p className="mt-0.5 line-clamp-2 text-[11px] text-slate-500">
                  {r.description}
                </p>
              </div>
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => onRemoveRisk(r.id)}
                  className="inline-flex h-6 w-6 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-rose-600"
                  aria-label={`Remove ${r.id}`}
                >
                  <FaXmark className="h-2.5 w-2.5" aria-hidden="true" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

function residualBandClass(residual) {
  if (residual == null) return "bg-slate-100 text-slate-700 ring-slate-200";
  if (residual >= 30) return "bg-rose-50 text-rose-700 ring-rose-200";
  if (residual >= 15) return "bg-amber-50 text-amber-700 ring-amber-200";
  if (residual >= 6) return "bg-sky-50 text-sky-700 ring-sky-200";
  return "bg-emerald-50 text-emerald-700 ring-emerald-200";
}

// ---------- Editable numbered list (used by Root Causes + Recommendations) ----------

function EditableNumberedList({
  items,
  onChange,
  readOnly,
  placeholder,
  emptyHint,
}) {
  function update(idx, v) {
    const next = [...items];
    next[idx] = v;
    onChange(next);
  }
  function add() {
    onChange([...(items ?? []), ""]);
  }
  function remove(idx) {
    onChange(items.filter((_, i) => i !== idx));
  }

  if (!items || items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/40 px-3 py-4 text-center text-[11px] text-slate-400">
        {emptyHint}
        {!readOnly && (
          <button
            type="button"
            onClick={add}
            className="ml-2 inline-flex h-7 items-center gap-1 rounded-md border border-slate-200 bg-white px-2 text-[11px] font-medium text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
          >
            <FaPlus className="h-2.5 w-2.5" aria-hidden="true" />
            Add item
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="grid gap-2">
      <ol className="grid gap-2">
        {items.map((item, idx) => (
          <li
            key={idx}
            className="flex items-start gap-2 rounded-xl border border-slate-100 bg-white p-2.5"
          >
            <span className="mt-1 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md bg-slate-900 text-[10px] font-bold text-white">
              {idx + 1}
            </span>
            {readOnly ? (
              <p className="flex-1 whitespace-pre-wrap text-xs text-slate-700">
                {item}
              </p>
            ) : (
              <textarea
                value={item}
                onChange={(e) => update(idx, e.target.value)}
                rows={2}
                placeholder={placeholder}
                className="flex-1 resize-none rounded-lg border border-slate-200 bg-white p-2 text-xs leading-relaxed text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            )}
            {!readOnly && (
              <button
                type="button"
                onClick={() => remove(idx)}
                className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-rose-600"
                aria-label="Remove item"
              >
                <FaXmark className="h-2.5 w-2.5" aria-hidden="true" />
              </button>
            )}
          </li>
        ))}
      </ol>
      {!readOnly && (
        <button
          type="button"
          onClick={add}
          className="inline-flex h-8 w-fit items-center gap-1.5 rounded-lg border border-dashed border-slate-300 bg-white px-3 text-[11px] font-medium text-slate-600 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
        >
          <FaPlus className="h-2.5 w-2.5" aria-hidden="true" />
          Add item
        </button>
      )}
    </div>
  );
}

function RootCausesCard({ draft, readOnly, onChange }) {
  return (
    <SectionCard
      icon={<FaListUl className="h-3.5 w-3.5" aria-hidden="true" />}
      title="Root causes"
      hint="What caused the gap. AI drafts from Conditions + the picked risks; auditor curates."
      aiPill={draft.aiAssisted && draft.rootCauses.length > 0}
    >
      <EditableNumberedList
        items={draft.rootCauses}
        onChange={onChange}
        readOnly={readOnly}
        placeholder="State the underlying cause in one sentence."
        emptyHint="No root causes captured. Run AI assist or add manually."
      />
    </SectionCard>
  );
}

function RecommendationsCard({ draft, readOnly, onChange }) {
  return (
    <SectionCard
      icon={<FaLightbulb className="h-3.5 w-3.5" aria-hidden="true" />}
      title="Recommendations"
      hint="What management should do. AI drafts from the picked risks' controls."
      aiPill={draft.aiAssisted && draft.recommendations.length > 0}
    >
      <EditableNumberedList
        items={draft.recommendations}
        onChange={onChange}
        readOnly={readOnly}
        placeholder="Action management should take."
        emptyHint="No recommendations drafted. Run AI assist or add manually."
      />
    </SectionCard>
  );
}

// ---------- Action plan ----------

function ActionPlanCard({ draft, readOnly, responseMode, onChange, onCommit }) {
  const editable = responseMode || (!readOnly && !responseMode);
  // In response mode, only response-related fields are editable.
  return (
    <SectionCard
      icon={<FaWandMagicSparkles className="h-3.5 w-3.5" aria-hidden="true" />}
      title="Action plan"
      hint="Drafted by AI from each picked risk's mitigation plan; management edits during their response."
      aiPill={draft.aiAssisted && Boolean(draft.actionPlan)}
    >
      <div className="grid gap-3">
        <textarea
          value={draft.actionPlan}
          onChange={(e) => onChange({ actionPlan: e.target.value })}
          onBlur={() => onCommit({ actionPlan: draft.actionPlan })}
          readOnly={!editable}
          rows={5}
          placeholder="Either: 'We agree with the recommendations' or a specific plan addressing each root cause."
          className={`w-full rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-xs leading-relaxed text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 ${
            !editable ? "cursor-not-allowed bg-slate-50" : ""
          }`}
        />

        <div>
          <label className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
            Target completion date
          </label>
          <input
            type="date"
            value={draft.targetDate ?? ""}
            onChange={(e) => onChange({ targetDate: e.target.value || null })}
            onBlur={() => onCommit({ targetDate: draft.targetDate })}
            disabled={!editable}
            className={`mt-1 h-9 w-fit rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 ${
              !editable ? "cursor-not-allowed bg-slate-50 text-slate-400" : ""
            }`}
          />
        </div>
      </div>
    </SectionCard>
  );
}

// ---------- Responsible owners ----------

function ResponsibleCard({ draft, readOnly, responseMode, onChange, onCommit }) {
  const editable = responseMode || !readOnly;

  function update(idx, key, value) {
    const next = [...draft.responsibleOwners];
    next[idx] = { ...next[idx], [key]: value };
    onChange({ responsibleOwners: next });
  }
  function commit() {
    onCommit({ responsibleOwners: draft.responsibleOwners });
  }
  function add() {
    const next = [
      ...draft.responsibleOwners,
      { name: "", position: "" },
    ];
    onChange({ responsibleOwners: next });
    onCommit({ responsibleOwners: next });
  }
  function remove(idx) {
    const next = draft.responsibleOwners.filter((_, i) => i !== idx);
    onChange({ responsibleOwners: next });
    onCommit({ responsibleOwners: next });
  }

  return (
    <SectionCard
      icon={<FaUserTie className="h-3.5 w-3.5" aria-hidden="true" />}
      title="Responsible management & process owners"
      hint="Who owns the response and the remediation."
    >
      {draft.responsibleOwners.length === 0 && !editable ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/40 px-3 py-4 text-center text-[11px] text-slate-400">
          No owners assigned.
        </div>
      ) : (
        <div className="grid gap-2">
          {draft.responsibleOwners.map((o, idx) => (
            <div
              key={idx}
              className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-100 bg-white p-2.5"
            >
              <input
                type="text"
                value={o.name}
                onChange={(e) => update(idx, "name", e.target.value)}
                onBlur={commit}
                readOnly={!editable}
                placeholder="Name"
                className={`h-8 flex-1 min-w-[180px] rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 ${
                  !editable ? "cursor-not-allowed bg-slate-50" : ""
                }`}
              />
              <input
                type="text"
                value={o.position}
                onChange={(e) => update(idx, "position", e.target.value)}
                onBlur={commit}
                readOnly={!editable}
                placeholder="Position"
                className={`h-8 flex-1 min-w-[180px] rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 ${
                  !editable ? "cursor-not-allowed bg-slate-50" : ""
                }`}
              />
              {editable && (
                <button
                  type="button"
                  onClick={() => remove(idx)}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-rose-600"
                  aria-label="Remove owner"
                >
                  <FaXmark className="h-2.5 w-2.5" aria-hidden="true" />
                </button>
              )}
            </div>
          ))}
          {editable && (
            <button
              type="button"
              onClick={add}
              className="inline-flex h-8 w-fit items-center gap-1.5 rounded-lg border border-dashed border-slate-300 bg-white px-3 text-[11px] font-medium text-slate-600 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
            >
              <FaPlus className="h-2.5 w-2.5" aria-hidden="true" />
              Add owner
            </button>
          )}
        </div>
      )}
    </SectionCard>
  );
}

// ---------- Management response ----------

function ManagementResponseCard({
  draft,
  readOnly,
  responseMode,
  onChange,
  onCommit,
}) {
  const editable = responseMode || (!readOnly && draft.status === "responded");

  return (
    <SectionCard
      icon={<FaFileLines className="h-3.5 w-3.5" aria-hidden="true" />}
      title="Management response"
      hint="Free-text response from the responsible department. Editable once the finding is issued."
    >
      <textarea
        value={draft.managementResponse}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onCommit}
        readOnly={!editable}
        rows={5}
        placeholder={
          editable
            ? "Indicate agreement, alternative perspective, or context the audit team should know."
            : "Awaiting management response."
        }
        className={`w-full rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-xs leading-relaxed text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 ${
          !editable ? "cursor-not-allowed bg-slate-50" : ""
        }`}
      />
    </SectionCard>
  );
}

// ---------- Section card shell ----------

function SectionCard({ icon, title, hint, aiPill, actions, children }) {
  return (
    <section className="relative min-w-0 overflow-hidden rounded-3xl border border-white/80 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] max-[520px]:rounded-2xl max-[520px]:p-4">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
              {icon}
            </span>
            {title}
            {aiPill && (
              <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-cyan-50 px-2 py-0.5 text-[10px] font-semibold text-cyan-700 ring-1 ring-cyan-200">
                <FaWandMagicSparkles className="h-2.5 w-2.5" aria-hidden="true" />
                AI advisory
              </span>
            )}
          </h2>
          {hint && (
            <p className="mt-1 ml-9 text-[11px] text-slate-500">{hint}</p>
          )}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

// ---------- Sticky footer ----------

function renderPrimaryAction(draft, { onIssue, onSubmitResponse, onClose }) {
  if (draft.status === "draft") {
    return (
      <button
        type="button"
        onClick={onIssue}
        disabled={draft.riskIds.length === 0 || !draft.conditions.trim()}
        className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-4 text-xs font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <FaCircleCheck className="h-3.5 w-3.5" aria-hidden="true" />
        Issue finding
      </button>
    );
  }
  if (draft.status === "issued") {
    return (
      <button
        type="button"
        onClick={onSubmitResponse}
        disabled={!draft.managementResponse.trim() || !draft.actionPlan.trim()}
        className="inline-flex h-10 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-xs font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-indigo-500 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <FaCheck className="h-3.5 w-3.5" aria-hidden="true" />
        Submit management response
      </button>
    );
  }
  if (draft.status === "responded") {
    return (
      <button
        type="button"
        onClick={onClose}
        className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-xs font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-500"
      >
        <FaCircleCheck className="h-3.5 w-3.5" aria-hidden="true" />
        Mark closed
      </button>
    );
  }
  return (
    <span className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-50 px-4 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
      <FaCircleCheck className="h-3.5 w-3.5" aria-hidden="true" />
      Finding closed
    </span>
  );
}

function StickyFooter({ draft, onIssue, onSubmitResponse, onClose }) {
  const primary = renderPrimaryAction(draft, {
    onIssue,
    onSubmitResponse,
    onClose,
  });

  return (
    <div className="fixed bottom-0 left-[292px] right-0 z-40 border-t border-slate-200 bg-white/95 shadow-[0_-12px_30px_rgba(15,23,42,0.06)] backdrop-blur max-[900px]:left-0">
      <div className="mx-auto flex w-full max-w-[1500px] flex-wrap items-center justify-between gap-2 px-8 py-3 max-[900px]:px-4 max-[520px]:px-3">
        <p className="text-[11px] text-slate-500">
          AI suggestions are advisory — every section is editable until the
          finding is closed.
        </p>
        <div className="flex items-center gap-2">{primary}</div>
      </div>
    </div>
  );
}

// ---------- Risk picker modal ----------

function RiskPickerModal({
  candidates,
  allRisks,
  selectedIds,
  onToggle,
  onClose,
}) {
  const [search, setSearch] = useState("");

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    const candIds = new Set(candidates.map((c) => c.id));
    const ordered = [
      ...candidates,
      ...allRisks.filter((r) => !candIds.has(r.id)),
    ];
    if (!term) return ordered.slice(0, 50);
    return ordered
      .filter((r) =>
        [r.id, r.title, r.department, r.description]
          .join(" ")
          .toLowerCase()
          .includes(term),
      )
      .slice(0, 50);
  }, [candidates, allRisks, search]);

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="grid max-h-[90vh] w-full max-w-3xl grid-rows-[auto_auto_minmax(0,1fr)_auto] overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <h3 className="text-sm font-semibold text-slate-900">
            Link risks from the register
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close picker"
          >
            <FaXmark className="h-3 w-3" aria-hidden="true" />
          </button>
        </div>

        <div className="border-b border-slate-100 px-5 py-3">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search risks by ID, title, department, description"
            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/80 px-3 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
          />
          {candidates.length > 0 && (
            <p className="mt-2 text-[11px] text-cyan-700">
              {candidates.length} AI-suggested risk
              {candidates.length === 1 ? "" : "s"} based on the Conditions
              narrative — shown first.
            </p>
          )}
        </div>

        <ul className="divide-y divide-slate-100 overflow-y-auto">
          {visible.map((r) => {
            const selected = selectedIds.includes(r.id);
            const suggested = candidates.some((c) => c.id === r.id);
            return (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => onToggle(r.id)}
                  className={`flex w-full items-start gap-3 px-5 py-3 text-left transition hover:bg-slate-50/60 ${
                    selected ? "bg-indigo-50/40" : ""
                  }`}
                >
                  <span
                    className={`mt-0.5 inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded ring-1 ${
                      selected
                        ? "bg-indigo-600 text-white ring-indigo-600"
                        : "bg-white text-transparent ring-slate-300"
                    }`}
                    aria-hidden="true"
                  >
                    <FaCheck className="h-2.5 w-2.5" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[11px] font-semibold text-slate-700">
                        {r.id}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {r.department}
                      </span>
                      {suggested && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-cyan-50 px-2 py-0.5 text-[10px] font-semibold text-cyan-700 ring-1 ring-cyan-200">
                          <FaWandMagicSparkles className="h-2.5 w-2.5" aria-hidden="true" />
                          AI suggested
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs font-medium text-slate-900">
                      {r.title}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-[11px] text-slate-500">
                      {r.description}
                    </p>
                  </div>
                </button>
              </li>
            );
          })}
          {visible.length === 0 && (
            <li className="px-5 py-12 text-center text-xs text-slate-400">
              No risks match your search.
            </li>
          )}
        </ul>

        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
          <p className="text-[11px] text-slate-500">
            {selectedIds.length} risk{selectedIds.length === 1 ? "" : "s"} linked.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-slate-900 px-4 text-xs font-semibold text-white transition hover:bg-slate-800"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

export default FindingEditor;
