import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  FaCheck,
  FaCircleExclamation,
  FaMagnifyingGlass,
  FaSpinner,
  FaWandMagicSparkles,
  FaXmark,
} from "react-icons/fa6";
import policyAPI from "../../../services/policyAPI";
import { audienceRules, policyCategories } from "../../../data";
import { fetchDepartments } from "../../../store/risksSlice";
import { OwnerPicker, AudiencePicker } from "./PolicyForm";

// Generate Policy wizard: browse the template catalog → generate a
// JCI-grounded policy → review/edit → save (stage-then-commit). Wired to
// the real backend: GET /v1/templates, POST /v1/policies/generate,
// POST /v1/policies/generate/save.

function apiError(err, fallback) {
  return err?.response?.data?.detail ?? err?.message ?? fallback;
}

function GeneratePolicyWizard({ onClose, onGenerated }) {
  const dispatch = useDispatch();
  // Real departments for the review-step dropdown (shared with Risk module).
  const departments = useSelector((s) => s.risks?.departments ?? []);

  useEffect(() => {
    if (departments.length === 0) dispatch(fetchDepartments());
  }, [dispatch, departments.length]);

  // Catalog (loaded once on open).
  const [templates, setTemplates] = useState([]);
  const [folders, setFolders] = useState([]);
  // "loading" | "ready" | "error"
  const [catalogStatus, setCatalogStatus] = useState("loading");

  const [search, setSearch] = useState("");
  const [area, setArea] = useState("All");
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  // Collected BEFORE generate so the AI tailors the body to them.
  const [department, setDepartment] = useState("");
  const [owner, setOwner] = useState("");

  // "idle" | "working" | "done" | "saving" | "error"
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");
  // Editable copy of the generated draft, shown in the review step.
  const [draft, setDraft] = useState(null);

  const isWorking = status === "working";
  const isSaving = status === "saving";
  const isDone = status === "done" || isSaving;
  const isBusy = isWorking || isSaving;

  useEffect(() => {
    let cancelled = false;
    policyAPI
      .listTemplates()
      .then((res) => {
        if (cancelled) return;
        setTemplates(res.data.items ?? []);
        setFolders(res.data.folders ?? []);
        setCatalogStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setCatalogStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredTemplates = useMemo(() => {
    const term = search.trim().toLowerCase();
    return templates.filter((t) => {
      if (area !== "All" && t.folder !== area) return false;
      if (term && !t.title.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [templates, search, area]);

  async function handleGenerate() {
    if (!selectedTemplate || isBusy) return;
    setStatus("working");
    setErrorMsg("");
    try {
      const { data } = await policyAPI.generatePolicy({
        template_id: selectedTemplate.id,
        department: department || null,
        owner: owner || null,
      });
      setDraft({
        code: data.suggested_code,
        title: data.template_title,
        category: policyCategories[0],
        audienceRule: audienceRules[0].id,
        nextReview: "",
        body: data.generated_text,
        templateId: selectedTemplate.id,
      });
      setStatus("done");
    } catch (err) {
      setErrorMsg(apiError(err, "Generation failed. Try again."));
      setStatus("error");
    }
  }

  function updateDraft(field, value) {
    setDraft((d) => ({ ...d, [field]: value }));
  }

  async function handleSaveDraft() {
    if (!draft || isSaving) return;
    setStatus("saving");
    setErrorMsg("");
    try {
      const rule = audienceRules.find((r) => r.id === draft.audienceRule);
      const { data } = await policyAPI.saveGeneratedPolicy({
        template_id: draft.templateId,
        code: draft.code,
        title: draft.title,
        category: draft.category || null,
        owner: owner || null,
        department: department || null,
        audience_rule: rule?.label ?? draft.audienceRule ?? null,
        next_review_date: draft.nextReview || null,
        body_text: draft.body,
        uploaded_by: "Author",
      });
      onGenerated?.(data);
    } catch (err) {
      setErrorMsg(apiError(err, "Save failed. Try again."));
      setStatus("done");
    }
  }

  const canGenerate = Boolean(selectedTemplate) && catalogStatus === "ready";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="generate-policy-title"
      className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 px-4 py-6 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !isBusy) onClose?.();
      }}
    >
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2
              id="generate-policy-title"
              className="flex items-center gap-2 text-base font-semibold text-slate-900"
            >
              <FaWandMagicSparkles
                className="h-4 w-4 text-cyan-600"
                aria-hidden="true"
              />
              Generate policy
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {isDone
                ? "Review and edit the generated draft, then save it as a Draft policy."
                : "Pick a template and let AI draft a JCI-grounded policy for Riverside Metropolitan Hospital. You can edit everything afterwards."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
            aria-label="Close"
            className="grid h-8 w-8 place-items-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FaXmark className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {isDone && draft ? (
          <div className="grid gap-4 overflow-y-auto px-6 py-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1">
                <span className="text-[11px] font-medium text-slate-600">
                  Code
                </span>
                <input
                  type="text"
                  value={draft.code}
                  onChange={(e) =>
                    updateDraft("code", e.target.value.toUpperCase())
                  }
                  className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                />
              </label>
              <label className="grid gap-1">
                <span className="text-[11px] font-medium text-slate-600">
                  Category
                </span>
                <select
                  value={draft.category}
                  onChange={(e) => updateDraft("category", e.target.value)}
                  className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                >
                  {policyCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1 sm:col-span-2">
                <span className="text-[11px] font-medium text-slate-600">
                  Title
                </span>
                <input
                  type="text"
                  value={draft.title}
                  onChange={(e) => updateDraft("title", e.target.value)}
                  className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                />
              </label>
              <label className="grid gap-1 sm:col-span-2">
                <span className="text-[11px] font-medium text-slate-600">
                  Next review date
                </span>
                <input
                  type="date"
                  value={draft.nextReview}
                  onChange={(e) => updateDraft("nextReview", e.target.value)}
                  className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                />
              </label>
              <div className="grid gap-1 sm:col-span-2">
                <span className="text-[11px] font-medium text-slate-600">
                  Audience rule
                </span>
                <AudiencePicker
                  value={draft.audienceRule}
                  onChange={(value) => updateDraft("audienceRule", value)}
                />
              </div>
              <div className="rounded-lg bg-slate-50 px-3 py-2 text-[11px] text-slate-500 sm:col-span-2">
                Department:{" "}
                <span className="font-medium text-slate-700">
                  {department || "—"}
                </span>{" "}
                · Owner:{" "}
                <span className="font-medium text-slate-700">
                  {owner || "—"}
                </span>{" "}
                <span className="text-slate-400">
                  (set before generating)
                </span>
              </div>
            </div>
            <label className="grid gap-1">
              <span className="text-[11px] font-medium text-slate-600">
                Policy text
              </span>
              <textarea
                value={draft.body}
                onChange={(e) => updateDraft("body", e.target.value)}
                rows={14}
                className="w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-xs leading-relaxed text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              />
            </label>
          </div>
        ) : (
          <div className="grid gap-4 overflow-y-auto px-6 py-5">
            <div className="flex flex-wrap items-center gap-2">
              <label className="relative min-w-[220px] flex-1">
                <span className="sr-only">Search templates</span>
                <FaMagnifyingGlass
                  className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search templates by name"
                  className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/80 pl-9 pr-3 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-500/20"
                />
              </label>

              <select
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="h-9 max-w-[220px] rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              >
                <option value="All">All areas</option>
                {folders.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-lg border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
                <span className="text-[11px] font-medium text-slate-600">
                  Templates
                </span>
                <span className="text-[11px] text-slate-400">
                  {catalogStatus === "ready"
                    ? `${filteredTemplates.length} of ${templates.length}`
                    : ""}
                </span>
              </div>
              <div className="max-h-[220px] overflow-y-auto">
                {catalogStatus === "loading" ? (
                  <p className="flex items-center justify-center gap-2 px-4 py-10 text-center text-xs text-slate-500">
                    <FaSpinner
                      className="h-3 w-3 animate-spin"
                      aria-hidden="true"
                    />
                    Loading templates…
                  </p>
                ) : catalogStatus === "error" ? (
                  <p className="px-4 py-10 text-center text-xs text-red-600">
                    Couldn't load templates.
                  </p>
                ) : filteredTemplates.length === 0 ? (
                  <p className="px-4 py-10 text-center text-xs text-slate-500">
                    No templates match your search.
                  </p>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {filteredTemplates.map((t) => {
                      const isSelected = selectedTemplate?.id === t.id;
                      return (
                        <li key={t.id}>
                          <button
                            type="button"
                            onClick={() => setSelectedTemplate(t)}
                            aria-pressed={isSelected}
                            className={`flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left transition ${
                              isSelected ? "bg-cyan-50" : "hover:bg-slate-50"
                            }`}
                          >
                            <span className="min-w-0">
                              <span
                                className={`block truncate text-xs font-medium ${
                                  isSelected
                                    ? "text-cyan-800"
                                    : "text-slate-800"
                                }`}
                              >
                                {t.title}
                              </span>
                              <span className="mt-0.5 block text-[11px] text-slate-500">
                                {t.code} · {t.folder}
                              </span>
                            </span>
                            {isSelected && (
                              <FaCheck
                                className="h-3.5 w-3.5 shrink-0 text-cyan-600"
                                aria-hidden="true"
                              />
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>

            {selectedTemplate && (
              <div className="grid gap-3">
                <p className="text-[11px] text-slate-500">
                  The AI uses the department and owner to tailor the policy
                  text — set them before generating.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-1">
                    <span className="text-[11px] font-medium text-slate-600">
                      Department
                    </span>
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                    >
                      <option value="">— Select department —</option>
                      {departments.map((d) => (
                        <option key={d.id ?? d.code ?? d.name} value={d.name}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="grid gap-1">
                    <span className="text-[11px] font-medium text-slate-600">
                      Owner
                    </span>
                    <OwnerPicker
                      value={owner}
                      onChange={(value) => setOwner(value)}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {(status === "error" || (isDone && errorMsg)) && (
          <div className="mx-6 mb-1 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            <FaCircleExclamation
              className="mt-0.5 h-3.5 w-3.5 shrink-0"
              aria-hidden="true"
            />
            <span>{errorMsg || "Generation failed. Try again."}</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-6 py-4">
          {isDone ? (
            <>
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="inline-flex h-9 items-center rounded-lg border border-slate-200 bg-white px-4 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={isSaving}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-slate-900 px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <FaSpinner
                      className="h-3 w-3 animate-spin"
                      aria-hidden="true"
                    />
                    Saving…
                  </>
                ) : (
                  <>
                    <FaCheck className="h-3 w-3" aria-hidden="true" />
                    Save draft
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                disabled={isWorking}
                className="inline-flex h-9 items-center rounded-lg border border-slate-200 bg-white px-4 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={!canGenerate || isWorking}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-slate-900 px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isWorking ? (
                  <>
                    <FaSpinner
                      className="h-3 w-3 animate-spin"
                      aria-hidden="true"
                    />
                    Generating…
                  </>
                ) : (
                  <>
                    <FaWandMagicSparkles
                      className="h-3 w-3"
                      aria-hidden="true"
                    />
                    {status === "error" ? "Retry" : "Generate"}
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default GeneratePolicyWizard;
