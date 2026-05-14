import { useState } from "react";
import { FaPlus, FaXmark } from "react-icons/fa6";
import { auditDepartments, auditOwners } from "../../../data";

const PERIOD_OPTIONS = [
  "Q1 2026",
  "Q2 2026",
  "Q3 2026",
  "Q4 2026",
  "FY 2025",
  "FY 2026",
];

function freshAuditDraft(seed) {
  return {
    title: seed?.title ?? "",
    departments: seed?.departments ?? [],
    scope: seed?.scope ?? "",
    period: seed?.period ?? "Q2 2026",
    owner: seed?.owner ?? auditOwners[0],
    seedFindingTitle: seed?.seedFindingTitle ?? "",
    seedConditions: seed?.seedConditions ?? "",
    seedRiskIds: seed?.seedRiskIds ?? [],
  };
}

function NewAuditModal({ onClose, onSubmit, seed }) {
  const [draft, setDraft] = useState(() => freshAuditDraft(seed));
  const isFromTrigger = Boolean(seed);

  function toggleDept(name) {
    setDraft((d) => ({
      ...d,
      departments: d.departments.includes(name)
        ? d.departments.filter((x) => x !== name)
        : [...d.departments, name],
    }));
  }

  function handleSubmit() {
    if (!draft.title.trim() || draft.departments.length === 0) return;
    onSubmit(draft);
  }

  const submitDisabled =
    !draft.title.trim() || draft.departments.length === 0;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="grid max-h-[92vh] w-full max-w-2xl grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              {isFromTrigger ? "Promote trigger to audit" : "New audit"}
            </h3>
            <p className="text-[11px] text-slate-500">
              {isFromTrigger
                ? "Scope and metadata are pre-filled from the trigger."
                : "Set scope and metadata. You'll add findings on the next screen."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
          >
            <FaXmark className="h-3 w-3" aria-hidden="true" />
          </button>
        </div>

        <div className="grid gap-4 overflow-y-auto px-5 py-4">
          <Field label="Title" required>
            <input
              type="text"
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              placeholder="e.g. Drug Inventory Audit — Q3 2026"
              className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </Field>

          <Field label="Departments" required>
            <div className="flex flex-wrap gap-1.5">
              {auditDepartments.map((d) => {
                const active = draft.departments.includes(d);
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleDept(d)}
                    className={`inline-flex h-7 items-center rounded-full border px-2.5 text-[11px] font-medium transition ${
                      active
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                        : "border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:bg-indigo-50/40"
                    }`}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="Period">
            <select
              value={draft.period}
              onChange={(e) => setDraft({ ...draft, period: e.target.value })}
              className="h-9 w-fit rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            >
              {PERIOD_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Owner">
            <select
              value={draft.owner}
              onChange={(e) => setDraft({ ...draft, owner: e.target.value })}
              className="h-9 w-fit rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            >
              {auditOwners.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Scope">
            <textarea
              value={draft.scope}
              onChange={(e) => setDraft({ ...draft, scope: e.target.value })}
              rows={3}
              placeholder="What's in scope — facilities, sub-locations, period covered."
              className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs leading-relaxed text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </Field>

          {isFromTrigger && (
            <section className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-3">
              <h4 className="text-[11px] font-semibold uppercase tracking-wide text-indigo-700">
                Seed first finding from trigger
              </h4>
              <p className="mt-1 text-[11px] text-slate-600">
                A draft finding (AF1) will be pre-filled with the trigger's
                narrative
                {draft.seedRiskIds.length > 0
                  ? ` and ${draft.seedRiskIds.length} linked risk${draft.seedRiskIds.length === 1 ? "" : "s"}`
                  : ""}
                . You can edit anything in the next screen.
              </p>
              <p className="mt-2 text-[11px] text-slate-500">
                Seeded title:{" "}
                <span className="font-medium text-slate-700">
                  {draft.seedFindingTitle || "—"}
                </span>
              </p>
            </section>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 items-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitDisabled}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-slate-900 px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FaPlus className="h-3 w-3" aria-hidden="true" />
            {isFromTrigger ? "Create audit + seed finding" : "Create audit"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <div>
      <label className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
        {label}
        {required && <span className="ml-1 text-rose-500">*</span>}
      </label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

export default NewAuditModal;
