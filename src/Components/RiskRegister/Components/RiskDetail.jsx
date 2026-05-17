import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  FaArrowLeft,
  FaArrowRight,
  FaCircleCheck,
  FaCircleExclamation,
  FaCircleXmark,
  FaPenToSquare,
  FaSpinner,
  FaTrash,
  FaXmark,
} from "react-icons/fa6";
import { fetchControllingPolicies } from "../../../store/risksSlice";

const tierStyles = {
  Operational: "bg-slate-100 text-slate-700 ring-slate-200",
  "Process-Level": "bg-indigo-50 text-indigo-700 ring-indigo-200",
  Strategic: "bg-orange-50 text-orange-700 ring-orange-200",
};

const CONTROL_OPTIONS = [
  { value: 1, label: "Strong", cls: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  { value: 2, label: "Moderate", cls: "bg-amber-50 text-amber-700 ring-amber-200" },
  { value: 3, label: "Weak", cls: "bg-rose-50 text-rose-700 ring-rose-200" },
];

function inherentBandClass(value) {
  if (value <= 6) return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  if (value <= 12) return "bg-amber-50 text-amber-700 ring-amber-200";
  return "bg-rose-50 text-rose-700 ring-rose-200";
}

function residualBandClass(value) {
  if (value <= 8) return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  if (value <= 24) return "bg-amber-50 text-amber-700 ring-amber-200";
  return "bg-rose-50 text-rose-700 ring-rose-200";
}

// The parent passes `key={risk.id}` so this component remounts when the
// selected risk changes — that's why `useState(risk)` here can safely act as
// the source of truth without a reset effect.
function RiskDetail({ risk, mutating, onBack, onUpdate, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(risk);

  const inherent = useMemo(
    () => draft.likelihood * draft.impact,
    [draft.likelihood, draft.impact],
  );
  const residual = useMemo(
    () => inherent * draft.controlEffectiveness,
    [inherent, draft.controlEffectiveness],
  );

  function patch(partial) {
    setDraft((prev) => ({ ...prev, ...partial }));
  }

  async function save() {
    // The slice strips server-managed fields (inherentRating, residualRating,
    // department, macroCategory, etc.) before sending.
    await onUpdate?.(draft);
    setIsEditing(false);
  }

  function cancel() {
    setDraft(risk);
    setIsEditing(false);
  }

  const ctrl = CONTROL_OPTIONS.find((c) => c.value === draft.controlEffectiveness);

  return (
    <div className="grid min-w-0 gap-5 max-[900px]:gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
        >
          <FaArrowLeft className="h-3 w-3" aria-hidden="true" />
          Back to register
        </button>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={cancel}
                disabled={mutating}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              >
                <FaXmark className="h-3 w-3" aria-hidden="true" />
                Cancel
              </button>
              <button
                type="button"
                onClick={save}
                disabled={mutating}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-slate-900 px-3 text-xs font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FaCircleCheck className="h-3 w-3" aria-hidden="true" />
                {mutating ? "Saving…" : "Save changes"}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <FaPenToSquare className="h-3 w-3" aria-hidden="true" />
                Edit
              </button>
              {onDelete && (
                <button
                  type="button"
                  onClick={onDelete}
                  disabled={mutating}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 text-xs font-medium text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
                >
                  <FaTrash className="h-3 w-3" aria-hidden="true" />
                  Delete
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <Hero risk={risk} />

      <section className="grid gap-5 lg:grid-cols-[2fr_1fr]">
        <Card title="Description">
          <div className="grid gap-4">
            <Field label="Risk description">
              <p className="text-sm leading-relaxed text-slate-800">
                {risk.description}
              </p>
            </Field>
            <Field label="Context">
              <p className="text-sm leading-relaxed text-slate-700">
                {risk.context}
              </p>
            </Field>
          </div>
        </Card>

        <Card title="Ownership">
          <dl className="grid gap-3 text-xs">
            <Meta label="Risk number" value={risk.riskNumber} mono />
            <Meta label="Category" value={risk.category} />
            <Meta label="Department" value={risk.department} />
            <Meta label="Macro-category" value={risk.macroCategory} />
            <Meta label="Owner" value={risk.owner} />
            <Meta label="Tier">
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${
                  tierStyles[risk.tier] ?? tierStyles.Operational
                }`}
              >
                {risk.tier}
              </span>
            </Meta>
          </dl>
        </Card>
      </section>

      <Card title="Scoring">
        <div className="grid gap-6 lg:grid-cols-2">
          <ScoringHalf
            title="Inherent (pre-controls)"
            description="Likelihood × Impact — the raw risk before any controls."
            formula={`${draft.likelihood} × ${draft.impact} = ${inherent}`}
            value={inherent}
            valueClass={inherentBandClass(inherent)}
            matrix={
              <MiniMatrix
                likelihood={draft.likelihood}
                impact={draft.impact}
                scaleMax={25}
              />
            }
            inputs={
              <div className="grid grid-cols-2 gap-3">
                <NumberSelect
                  label="Likelihood (L)"
                  value={draft.likelihood}
                  disabled={!isEditing}
                  min={1}
                  max={5}
                  onChange={(v) => patch({ likelihood: v })}
                />
                <NumberSelect
                  label="Impact (I)"
                  value={draft.impact}
                  disabled={!isEditing}
                  min={1}
                  max={5}
                  onChange={(v) => patch({ impact: v })}
                />
              </div>
            }
          />
          <ScoringHalf
            title="Residual (post-controls)"
            description="Inherent × Control Effectiveness — what remains after controls."
            formula={`${inherent} × ${draft.controlEffectiveness} = ${residual}`}
            value={residual}
            valueClass={residualBandClass(residual)}
            matrix={
              <ControlBar
                value={draft.controlEffectiveness}
                disabled={!isEditing}
                onChange={(v) => patch({ controlEffectiveness: v })}
              />
            }
            inputs={
              <p className="text-[11px] text-slate-500">
                Control effectiveness:{" "}
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${
                    ctrl?.cls ?? ""
                  }`}
                >
                  {ctrl?.label ?? "—"}
                </span>{" "}
                · lower control rating means a stronger control.
              </p>
            }
          />
        </div>
      </Card>

      <Card title="Controls">
        <div className="grid gap-4">
          <Field label="Control description">
            {isEditing ? (
              <textarea
                value={draft.controlDescription}
                onChange={(e) => patch({ controlDescription: e.target.value })}
                rows={3}
                className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              />
            ) : (
              <p className="text-sm leading-relaxed text-slate-800">
                {risk.controlDescription}
              </p>
            )}
          </Field>
          <Field label="Control attributes">
            <div className="flex flex-wrap gap-2">
              {(risk.controlAttributes ?? []).map((attr) => (
                <span
                  key={attr}
                  className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-700 ring-1 ring-slate-200"
                >
                  {attr}
                </span>
              ))}
            </div>
          </Field>
          <Field label="Effectiveness rating">
            {isEditing ? (
              <div className="flex flex-wrap gap-2">
                {CONTROL_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => patch({ controlEffectiveness: opt.value })}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 transition ${
                      draft.controlEffectiveness === opt.value
                        ? `${opt.cls} scale-105`
                        : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {opt.value} · {opt.label}
                  </button>
                ))}
              </div>
            ) : (
              <div className="grid gap-1.5">
                <span
                  className={`inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${
                    ctrl?.cls ?? "bg-slate-50 text-slate-500 ring-slate-200"
                  }`}
                >
                  {ctrl?.value ?? "—"} · {ctrl?.label ?? "—"}
                </span>
                <EffectivenessProvenance riskId={risk.id} />
              </div>
            )}
          </Field>
        </div>
      </Card>

      <Card title="Mitigation">
        <div className="grid gap-4 lg:grid-cols-[1fr_220px_220px]">
          <Field label="Mitigation plan">
            {isEditing ? (
              <textarea
                value={draft.mitigationPlan}
                onChange={(e) => patch({ mitigationPlan: e.target.value })}
                rows={3}
                className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              />
            ) : (
              <p className="text-sm leading-relaxed text-slate-800">
                {risk.mitigationPlan}
              </p>
            )}
          </Field>
          <Field label="Mitigation owner">
            {isEditing ? (
              <input
                type="text"
                value={draft.mitigationOwner}
                onChange={(e) => patch({ mitigationOwner: e.target.value })}
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              />
            ) : (
              <p className="text-sm text-slate-800">{risk.mitigationOwner}</p>
            )}
          </Field>
          <Field label="Mitigation timeline">
            {isEditing ? (
              <input
                type="text"
                value={draft.mitigationTimeline}
                onChange={(e) => patch({ mitigationTimeline: e.target.value })}
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              />
            ) : (
              <p className="text-sm text-slate-800">{risk.mitigationTimeline}</p>
            )}
          </Field>
        </div>
      </Card>

      <Card title="Linked references">
        <div className="grid gap-3">
          <LinkedPolicies riskId={risk.id} />
          <div className="grid gap-3 sm:grid-cols-2">
            <ReferenceTile
              heading="Linked incidents"
              body="Will populate from Quality, Safety & Accreditation → Incidents."
              tone="amber"
            />
            <ReferenceTile
              heading="Audit history"
              body="Will populate from Internal Audit."
              tone="indigo"
            />
          </div>
        </div>
      </Card>
    </div>
  );
}

function Hero({ risk }) {
  return (
    <section className="relative min-w-0 overflow-hidden rounded-3xl border border-white/80 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.10)] max-[520px]:rounded-2xl">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,#cffafe_0%,transparent_55%),radial-gradient(circle_at_bottom_left,#e0f2fe_0%,transparent_50%)]"
      />
      <div className="relative grid gap-2 p-6 max-[520px]:p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-md bg-slate-900 px-2 py-0.5 font-mono text-[11px] font-semibold text-white">
            {risk.riskNumber}
          </span>
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${
              tierStyles[risk.tier] ?? tierStyles.Operational
            }`}
          >
            {risk.tier}
          </span>
          <span className="inline-flex items-center rounded-full bg-cyan-50 px-2 py-0.5 text-[11px] font-medium text-cyan-700 ring-1 ring-cyan-200">
            {risk.department}
          </span>
          <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600 ring-1 ring-slate-200">
            {risk.category}
          </span>
        </div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900 max-[520px]:text-lg">
          {risk.title}
        </h1>
        <p className="text-xs text-slate-500">
          Owner · <span className="font-medium text-slate-700">{risk.owner}</span>
          {" · "}
          Macro-category ·{" "}
          <span className="font-medium text-slate-700">{risk.macroCategory}</span>
        </p>
      </div>
    </section>
  );
}

function Card({ title, children }) {
  return (
    <section className="relative min-w-0 overflow-hidden rounded-3xl border border-white/80 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)] max-[520px]:rounded-2xl">
      <header className="border-b border-slate-100 px-5 py-3">
        <h2 className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
          {title}
        </h2>
      </header>
      <div className="p-5 max-[520px]:p-4">{children}</div>
    </section>
  );
}

function Field({ label, children }) {
  return (
    <div className="grid gap-1.5">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      {children}
    </div>
  );
}

function Meta({ label, value, mono, children }) {
  return (
    <div className="grid gap-0.5">
      <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd
        className={`text-sm text-slate-800 ${mono ? "font-mono font-semibold" : ""}`}
      >
        {children ?? value}
      </dd>
    </div>
  );
}

function NumberSelect({ label, value, disabled, min, max, onChange }) {
  const range = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  return (
    <label className="grid gap-1.5">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
      >
        {range.map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
    </label>
  );
}

function ScoringHalf({ title, description, formula, value, valueClass, matrix, inputs }) {
  return (
    <div className="grid gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
      <div>
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="mt-0.5 text-[11px] text-slate-500">{description}</p>
      </div>
      <div className="flex items-center gap-3">
        <span
          className={`grid h-14 min-w-[3.5rem] place-items-center rounded-xl px-3 text-2xl font-bold ring-1 ${valueClass}`}
        >
          {value}
        </span>
        <span className="text-xs text-slate-600">{formula}</span>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <div>{matrix}</div>
        <div className="min-w-[160px] flex-1">{inputs}</div>
      </div>
    </div>
  );
}

function MiniMatrix({ likelihood, impact }) {
  return (
    <div
      className="grid gap-0.5"
      style={{ gridTemplateColumns: "repeat(5, 16px)", gridTemplateRows: "repeat(5, 16px)" }}
    >
      {[5, 4, 3, 2, 1].flatMap((L) =>
        [1, 2, 3, 4, 5].map((I) => {
          const v = L * I;
          const isHere = L === likelihood && I === impact;
          let cls = "bg-emerald-100";
          if (v > 6 && v <= 12) cls = "bg-amber-100";
          if (v > 12) cls = "bg-rose-100";
          return (
            <div
              key={`${L}-${I}`}
              className={`flex items-center justify-center rounded-[3px] text-[8px] font-semibold transition ${
                isHere
                  ? "bg-slate-900 text-white ring-2 ring-slate-900"
                  : `${cls} text-transparent`
              }`}
              aria-label={`L${L} I${I} = ${v}`}
            >
              {isHere ? v : "·"}
            </div>
          );
        }),
      )}
    </div>
  );
}

function ControlBar({ value, disabled, onChange }) {
  return (
    <div className="grid gap-1">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        Control effectiveness
      </span>
      <div className="inline-flex overflow-hidden rounded-lg ring-1 ring-slate-200">
        {CONTROL_OPTIONS.map((opt) => {
          const active = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              disabled={disabled}
              onClick={() => onChange(opt.value)}
              className={`flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold transition ${
                active
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed"
              }`}
            >
              {opt.value}·{opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Policies the system believes control this risk. Reads the
// `policy_risk_links` table via GET /v1/risks/{id}/policies. The risk
// endpoint serialises camelCase (policyId, matchScore, …).
function LinkedPolicies({ riskId }) {
  const dispatch = useDispatch();
  const loading = useSelector((s) => s.risks.controllingPoliciesLoading);
  const linkedRiskId = useSelector(
    (s) => s.risks.controllingPoliciesRiskId,
  );
  const policies = useSelector((s) => s.risks.controllingPolicies);
  const error = useSelector((s) => s.risks.controllingPoliciesError);

  useEffect(() => {
    if (riskId != null) dispatch(fetchControllingPolicies(riskId));
  }, [dispatch, riskId]);

  const ready = linkedRiskId === riskId;

  const shell =
    "rounded-xl border border-dashed border-cyan-200 bg-cyan-50/60 p-4 ring-1 ring-cyan-200";
  const headingRow = (
    <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-cyan-900">
      <FaCircleExclamation className="h-3 w-3" aria-hidden="true" />
      Linked policies
    </div>
  );

  if (!ready || loading) {
    return (
      <div className={shell}>
        {headingRow}
        <p className="mt-2 flex items-center gap-2 text-[11px] text-cyan-900">
          <FaSpinner className="h-3 w-3 animate-spin" aria-hidden="true" />
          Loading policies that control this risk…
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={shell}>
        {headingRow}
        <p className="mt-2 flex items-center gap-2 text-[11px] text-rose-700">
          <FaCircleXmark className="h-3 w-3" aria-hidden="true" />
          {typeof error === "string"
            ? error
            : "Couldn't load linked policies."}
        </p>
      </div>
    );
  }

  if (policies.length === 0) {
    return (
      <div className={shell}>
        {headingRow}
        <p className="mt-2 text-[11px] leading-relaxed text-cyan-900">
          No policy in the library currently enforces this risk's control.
          Upload a relevant policy and it will be linked automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-cyan-200 bg-white p-4 ring-1 ring-cyan-200">
      {headingRow}
      <ul className="mt-3 grid gap-2">
        {policies.map((p) => (
          <li key={p.policyId}>
            <button
              type="button"
              onClick={() =>
                window.location.assign(
                  `/policy-management?policy=${encodeURIComponent(
                    p.policyId,
                  )}`,
                )
              }
              title="Open policy detail"
              className="w-full rounded-lg border border-slate-100 bg-slate-50/60 p-3 text-left transition hover:border-cyan-300 hover:bg-cyan-50/40"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                    <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-600">
                      {p.code}
                    </span>
                    <span className="truncate">{p.title}</span>
                  </p>
                  <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-slate-500">
                    {p.summary ?? "Summary is being generated…"}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <span
                    className="rounded-full bg-cyan-50 px-2 py-0.5 text-[10px] font-medium text-cyan-700 ring-1 ring-cyan-200"
                    title="Cosine match score"
                  >
                    {Math.round((p.matchScore ?? 0) * 100)}% match
                  </span>
                  <FaArrowRight
                    className="h-3 w-3 text-slate-400"
                    aria-hidden="true"
                  />
                </div>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ReferenceTile({ heading, body, tone }) {
  const tones = {
    cyan: "bg-cyan-50 ring-cyan-200 text-cyan-900",
    amber: "bg-amber-50 ring-amber-200 text-amber-900",
    indigo: "bg-indigo-50 ring-indigo-200 text-indigo-900",
  };
  return (
    <div
      className={`rounded-xl border border-dashed p-4 ring-1 ${
        tones[tone] ?? "bg-slate-50 ring-slate-200 text-slate-700"
      }`}
    >
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide">
        <FaCircleExclamation className="h-3 w-3" aria-hidden="true" />
        {heading}
      </div>
      <p className="mt-2 text-[11px] leading-relaxed">{body}</p>
    </div>
  );
}

// Shows where the Control Effectiveness rating actually came from. If an
// accepted verdict exists for a policy controlling this risk, we surface a
// clickable link to that verdict; otherwise we honestly say it's a manual
// estimate.
function EffectivenessProvenance({ riskId }) {
  const policies = useSelector(
    (state) => state.operativeEffectiveness.policies,
  );
  const uploads = useSelector(
    (state) => state.operativeEffectiveness.uploads,
  );

  // Find the policies that control this risk via the effectiveness mapping.
  const controllingPolicyIds = useMemo(() => {
    return policies
      .filter((p) => p.controlsRiskIds?.includes(riskId))
      .map((p) => p.id);
  }, [policies, riskId]);

  // Latest accepted upload whose verdict touches any controlling policy.
  const latestVerdict = useMemo(() => {
    if (controllingPolicyIds.length === 0) return null;
    const candidates = uploads
      .filter((u) => u.status === "accepted")
      .filter((u) =>
        (u.verdict?.policyResults ?? []).some((r) =>
          controllingPolicyIds.includes(r.policyId),
        ),
      );
    if (candidates.length === 0) return null;
    return candidates.sort(
      (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime(),
    )[0];
  }, [uploads, controllingPolicyIds]);

  if (controllingPolicyIds.length === 0) {
    return (
      <p className="text-[11px] text-slate-500">
        Manual estimate · no policy linked to this risk yet.
      </p>
    );
  }

  if (!latestVerdict) {
    return (
      <p className="text-[11px] text-slate-500">
        Manual estimate · no evidence uploaded yet for the controlling policy.
      </p>
    );
  }

  const daysAgo = relativeDays(latestVerdict.uploadedAt);

  return (
    <a
      href={`/risk-audit-governance/operative-effectiveness?upload=${encodeURIComponent(latestVerdict.id)}`}
      className="group inline-flex w-fit items-center gap-1 text-[11px] font-medium text-cyan-700 transition hover:text-cyan-800"
    >
      Evidence-backed · last verdict {daysAgo}
      <FaArrowRight className="h-2.5 w-2.5 transition group-hover:translate-x-0.5" aria-hidden="true" />
    </a>
  );
}

function relativeDays(iso) {
  if (!iso) return "—";
  const diffDays = Math.round(
    (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diffDays <= 0) return "today";
  if (diffDays === 1) return "1 day ago";
  if (diffDays < 30) return `${diffDays} days ago`;
  const months = Math.round(diffDays / 30);
  return months === 1 ? "1 month ago" : `${months} months ago`;
}

export default RiskDetail;
