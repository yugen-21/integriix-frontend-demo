import { useEffect, useMemo, useRef, useState } from "react";
import { FaCircleCheck, FaXmark } from "react-icons/fa6";
import riskAPI from "../../../services/riskAPI";

// Matches the slice's tier denormalizer — keep in sync.
const TIER_TO_API = {
  Operational: "operational",
  "Process-Level": "process_level",
  Strategic: "strategic",
};

// Backend enum *values* (lowercase, str-enum) are what FastAPI accepts on
// the wire. The slice denormalizes display strings on the way back in.
const TIER_OPTIONS = [
  { value: "Operational", label: "Operational" }, // slice maps -> "operational"
  { value: "Process-Level", label: "Process-Level" }, // -> "process_level"
  { value: "Strategic", label: "Strategic" }, // -> "strategic"
];

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "proposed", label: "Proposed" },
  { value: "retired", label: "Retired" },
];

const CONTROL_TYPE_OPTIONS = [
  { value: "", label: "—" },
  { value: "manual", label: "Manual" },
  { value: "automated", label: "Automated" },
  { value: "both", label: "Both" },
];

const CONTROL_NATURE_OPTIONS = [
  { value: "", label: "—" },
  { value: "preventive", label: "Preventive" },
  { value: "detective", label: "Detective" },
  { value: "both", label: "Both" },
];

const emptyDraft = {
  riskNumber: "",
  departmentId: "",
  category: "",
  tier: "Operational",
  status: "active",
  title: "",
  description: "",
  context: "",
  owner: "",
  likelihood: 3,
  impact: 3,
  controlEffectiveness: 2,
  controlDescription: "",
  controlAttributeType: "",
  controlAttributeNature: "",
  controlAttributeFrequency: "",
  mitigationPlan: "",
  mitigationOwner: "",
  mitigationTimeline: "",
};

// Modal-style form used for "Create Risk" (and could be reused for edit later).
function RiskForm({ initial, departments, submitting, error, onCancel, onSubmit }) {
  const [draft, setDraft] = useState(() => ({ ...emptyDraft, ...(initial ?? {}) }));
  // Stays false until the user explicitly edits the auto-filled risk number.
  // While false, picking a new (department, tier) re-fetches the next number.
  const [numberOverridden, setNumberOverridden] = useState(false);
  const [autoFillLoading, setAutoFillLoading] = useState(false);

  useEffect(() => {
    setDraft({ ...emptyDraft, ...(initial ?? {}) });
    setNumberOverridden(Boolean(initial?.riskNumber));
  }, [initial]);

  // Auto-fill the risk number whenever department + tier are both chosen and
  // the user hasn't manually overridden the field. Backend computes the next
  // free `<DEPT>-<R|P|S><n>` so the user never has to know the convention.
  const autoFillRef = useRef(0);
  useEffect(() => {
    if (numberOverridden) return;
    if (!draft.departmentId) return;
    const tierApi = TIER_TO_API[draft.tier];
    if (!tierApi) return;

    const requestId = ++autoFillRef.current;
    setAutoFillLoading(true);
    riskAPI
      .nextRiskNumber(Number(draft.departmentId), tierApi)
      .then((res) => {
        // Ignore stale responses if the user has changed dept/tier since.
        if (requestId !== autoFillRef.current) return;
        const next = res?.data?.nextNumber;
        if (next) {
          setDraft((prev) =>
            prev.riskNumber === next ? prev : { ...prev, riskNumber: next },
          );
        }
      })
      .catch(() => {
        // Silent — the field stays editable so the user can still type one.
      })
      .finally(() => {
        if (requestId === autoFillRef.current) setAutoFillLoading(false);
      });
  }, [draft.departmentId, draft.tier, numberOverridden]);

  const inherent = useMemo(
    () => Number(draft.likelihood) * Number(draft.impact),
    [draft.likelihood, draft.impact],
  );
  const residual = useMemo(
    () => inherent * Number(draft.controlEffectiveness),
    [inherent, draft.controlEffectiveness],
  );

  function patch(partial) {
    setDraft((prev) => ({ ...prev, ...partial }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    // Strip empty optional enums — backend rejects "" for enum fields.
    const payload = {
      ...draft,
      departmentId: Number(draft.departmentId),
      likelihood: Number(draft.likelihood),
      impact: Number(draft.impact),
      controlEffectiveness: Number(draft.controlEffectiveness),
      controlAttributeType: draft.controlAttributeType || null,
      controlAttributeNature: draft.controlAttributeNature || null,
    };
    onSubmit?.(payload);
  }

  const isValid =
    draft.riskNumber.trim() &&
    draft.title.trim() &&
    draft.departmentId &&
    Number(draft.likelihood) >= 1 &&
    Number(draft.impact) >= 1 &&
    Number(draft.controlEffectiveness) >= 1;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="grid max-h-[90vh] w-full max-w-3xl gap-4 overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
      >
        <header className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Create risk</h2>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <FaXmark className="h-4 w-4" />
          </button>
        </header>

        {error && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
            {String(error)}
          </div>
        )}

        <section className="grid gap-3 sm:grid-cols-2">
          <Field
            label="Risk number *"
            hint={
              !draft.departmentId
                ? "Pick a department to auto-generate"
                : numberOverridden
                  ? "Manually set — auto-generate is off"
                  : autoFillLoading
                    ? "Auto-generating…"
                    : "Auto-generated from department + tier"
            }
            action={
              numberOverridden && draft.departmentId ? (
                <button
                  type="button"
                  onClick={() => setNumberOverridden(false)}
                  className="text-[10px] font-semibold uppercase tracking-wide text-cyan-700 hover:underline"
                >
                  Reset to auto
                </button>
              ) : null
            }
          >
            <input
              required
              type="text"
              value={draft.riskNumber}
              onChange={(e) => {
                setNumberOverridden(true);
                patch({ riskNumber: e.target.value });
              }}
              placeholder={
                draft.departmentId ? "e.g. ED-R12" : "Pick a department first"
              }
              className={`h-9 w-full rounded-lg border px-3 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 ${
                numberOverridden
                  ? "border-slate-300 bg-white"
                  : "border-slate-200 bg-slate-50 text-slate-700"
              }`}
            />
          </Field>
          <Field label="Department *">
            <select
              required
              value={draft.departmentId}
              onChange={(e) => patch({ departmentId: e.target.value })}
              className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
            >
              <option value="">Select department…</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.macro_category})
                </option>
              ))}
            </select>
          </Field>

          <Field label="Title *">
            <input
              required
              type="text"
              value={draft.title}
              onChange={(e) => patch({ title: e.target.value })}
              className="h-9 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
            />
          </Field>
          <Field label="Category">
            <input
              type="text"
              value={draft.category ?? ""}
              onChange={(e) => patch({ category: e.target.value })}
              placeholder="e.g. JCI IPSG Risk"
              className="h-9 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
            />
          </Field>

          <Field label="Tier">
            <select
              value={draft.tier}
              onChange={(e) => patch({ tier: e.target.value })}
              className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
            >
              {TIER_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Status">
            <select
              value={draft.status}
              onChange={(e) => patch({ status: e.target.value })}
              className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Owner">
            <input
              type="text"
              value={draft.owner ?? ""}
              onChange={(e) => patch({ owner: e.target.value })}
              className="h-9 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
            />
          </Field>
          <div />
        </section>

        <Field label="Description">
          <textarea
            rows={3}
            value={draft.description ?? ""}
            onChange={(e) => patch({ description: e.target.value })}
            className="w-full rounded-lg border border-slate-200 p-2 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
          />
        </Field>

        <Field label="Context">
          <textarea
            rows={3}
            value={draft.context ?? ""}
            onChange={(e) => patch({ context: e.target.value })}
            className="w-full rounded-lg border border-slate-200 p-2 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
          />
        </Field>

        <section className="grid gap-3 sm:grid-cols-3">
          <NumberSelect
            label="Likelihood (1-5)"
            min={1}
            max={5}
            value={draft.likelihood}
            onChange={(v) => patch({ likelihood: v })}
          />
          <NumberSelect
            label="Impact (1-5)"
            min={1}
            max={5}
            value={draft.impact}
            onChange={(v) => patch({ impact: v })}
          />
          <NumberSelect
            label="Control effectiveness (1=Strong, 3=Weak)"
            min={1}
            max={3}
            value={draft.controlEffectiveness}
            onChange={(v) => patch({ controlEffectiveness: v })}
          />
        </section>

        <div className="flex items-center gap-4 rounded-xl bg-slate-50 px-4 py-2 text-xs text-slate-600">
          <span>
            Inherent · <strong className="text-slate-900">{inherent}</strong>
          </span>
          <span>
            Residual · <strong className="text-slate-900">{residual}</strong>
          </span>
          <span className="text-slate-400">Auto-calculated server-side.</span>
        </div>

        <Field label="Control description">
          <textarea
            rows={2}
            value={draft.controlDescription ?? ""}
            onChange={(e) => patch({ controlDescription: e.target.value })}
            className="w-full rounded-lg border border-slate-200 p-2 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
          />
        </Field>

        <section className="grid gap-3 sm:grid-cols-3">
          <Field label="Control type">
            <select
              value={draft.controlAttributeType ?? ""}
              onChange={(e) => patch({ controlAttributeType: e.target.value })}
              className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
            >
              {CONTROL_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Control nature">
            <select
              value={draft.controlAttributeNature ?? ""}
              onChange={(e) => patch({ controlAttributeNature: e.target.value })}
              className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
            >
              {CONTROL_NATURE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Control frequency">
            <input
              type="text"
              value={draft.controlAttributeFrequency ?? ""}
              onChange={(e) =>
                patch({ controlAttributeFrequency: e.target.value })
              }
              placeholder="e.g. Per Encounter"
              className="h-9 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
            />
          </Field>
        </section>

        <Field label="Mitigation plan">
          <textarea
            rows={2}
            value={draft.mitigationPlan ?? ""}
            onChange={(e) => patch({ mitigationPlan: e.target.value })}
            className="w-full rounded-lg border border-slate-200 p-2 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
          />
        </Field>

        <section className="grid gap-3 sm:grid-cols-2">
          <Field label="Mitigation owner">
            <input
              type="text"
              value={draft.mitigationOwner ?? ""}
              onChange={(e) => patch({ mitigationOwner: e.target.value })}
              className="h-9 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
            />
          </Field>
          <Field label="Mitigation timeline">
            <input
              type="text"
              value={draft.mitigationTimeline ?? ""}
              onChange={(e) => patch({ mitigationTimeline: e.target.value })}
              placeholder="e.g. Within 6 months"
              className="h-9 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
            />
          </Field>
        </section>

        <footer className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <FaXmark className="h-3 w-3" />
            Cancel
          </button>
          <button
            type="submit"
            disabled={!isValid || submitting}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-slate-900 px-3 text-xs font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FaCircleCheck className="h-3 w-3" />
            {submitting ? "Saving…" : "Create risk"}
          </button>
        </footer>
      </form>
    </div>
  );
}

function Field({ label, hint, action, children }) {
  return (
    <label className="grid gap-1.5">
      <span className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
          {label}
        </span>
        {action}
      </span>
      {children}
      {hint && <span className="text-[10px] text-slate-400">{hint}</span>}
    </label>
  );
}

function NumberSelect({ label, min, max, value, onChange }) {
  const range = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  return (
    <Field label={label}>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
      >
        {range.map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
    </Field>
  );
}

export default RiskForm;
