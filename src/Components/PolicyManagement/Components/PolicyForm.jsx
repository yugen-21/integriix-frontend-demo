import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import {
  FaCheck,
  FaCircleExclamation,
  FaCloudArrowUp,
  FaFilePdf,
  FaMagnifyingGlass,
  FaSpinner,
  FaWandMagicSparkles,
  FaUserTie,
  FaUsers,
  FaXmark,
} from "react-icons/fa6";
import { audienceRules, policyCategories, policyOwners } from "../../../data";
import {
  cancelStagedPolicyUpload,
  stagePolicyUpload,
} from "../../../store/policiesSlice";

const DUMMY_TITLES = [
  "Hand Hygiene Compliance",
  "Patient Identification Standards",
  "Surgical Site Marking",
  "Medication Reconciliation on Admission",
  "Falls Prevention & Risk Assessment",
  "Sharps Handling & Disposal",
  "Visitor Access Control",
  "Code Blue Response",
  "Discharge Planning & Continuity of Care",
  "Antimicrobial Stewardship",
  "Pain Assessment & Management",
  "Restraint Use & Documentation",
];

const DUMMY_CODE_PREFIXES = ["HR", "CL", "AS", "OP", "SA", "NAP", "CP"];

function randomItem(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function randomCode(existingCodes) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const code = `${randomItem(DUMMY_CODE_PREFIXES)} ${Math.floor(Math.random() * 9000) + 1000}`;
    if (!existingCodes.includes(code)) return code;
  }
  return `TMP ${Date.now().toString().slice(-4)}`;
}

function randomFutureDate() {
  const now = new Date();
  const days = 30 + Math.floor(Math.random() * 365);
  const target = new Date(now.getTime() + days * 86400000);
  return target.toISOString().slice(0, 10);
}

function generateDummyFields(existingCodes) {
  return {
    code: randomCode(existingCodes),
    title: randomItem(DUMMY_TITLES),
    category: randomItem(policyCategories),
    owner: randomItem(policyOwners).name,
    audienceRule: randomItem(audienceRules).id,
    nextReview: randomFutureDate(),
  };
}

// Accept the original "HR 3001" mock format and also real-world hospital
// codes like "PEP-12", "MMU-009", "IPSG-3", "MMU.05.00". Loose on the
// frontend; the backend only requires uniqueness, not a specific shape.
const CODE_PATTERN = /^[A-Z][A-Z0-9.\-\s]{1,29}$/;
const TITLE_MIN = 3;

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function emptyDraft() {
  return {
    code: "",
    title: "",
    category: policyCategories[0],
    owner: "",
    audienceRule: audienceRules[0].id,
    nextReview: "",
  };
}

function ownerByName(name) {
  return policyOwners.find((u) => u.name === name) ?? null;
}

function inferAudienceFromPolicy(policy) {
  if (!policy) return audienceRules[0].id;
  const dept = (policy.department ?? "").toLowerCase();
  const direct = audienceRules.find((rule) =>
    rule.label.toLowerCase().includes(dept),
  );
  return direct?.id ?? audienceRules[0].id;
}

function PolicyForm({ mode, policy, existingCodes, onClose, onSave }) {
  const isEdit = mode === "edit";
  const dispatch = useDispatch();
  const [draft, setDraft] = useState(() =>
    isEdit && policy
      ? {
          code: policy.code ?? "",
          title: policy.title ?? "",
          category: policy.category ?? policyCategories[0],
          owner: policy.owner ?? "",
          audienceRule: policy.audienceRule ?? inferAudienceFromPolicy(policy),
          nextReview: policy.nextReview ?? "",
        }
      : emptyDraft(),
  );
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const firstFieldRef = useRef(null);

  // Track the temp_file_id returned from POST /policies/upload so we can:
  //   (a) include it in the confirm payload on submit
  //   (b) cancel the staged upload if the user closes the form without saving
  // committedRef flips true once the confirm succeeds, so unmount cleanup
  // skips the cancel call.
  const [tempFileId, setTempFileId] = useState(null);
  const tempFileIdRef = useRef(null);
  const committedRef = useRef(false);

  useEffect(() => {
    return () => {
      if (tempFileIdRef.current && !committedRef.current) {
        dispatch(cancelStagedPolicyUpload(tempFileIdRef.current));
      }
    };
  }, [dispatch]);

  const [extractor, setExtractor] = useState({
    status: "idle",
    fileName: null,
    progress: 0,
    message: "",
    extractedFields: null,
    error: null,
  });

  useEffect(() => {
    firstFieldRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKey(event) {
      if (event.key === "Escape") onClose?.();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const errors = useMemo(() => {
    const e = {};
    const trimmedCode = draft.code.trim().toUpperCase();
    if (!trimmedCode) {
      e.code = "Code is required.";
    } else if (!CODE_PATTERN.test(trimmedCode)) {
      e.code =
        'Use letters and digits (e.g. "PEP-12", "MMU-009", "HR 3001").';
    } else if (existingCodes.includes(trimmedCode)) {
      e.code = "This code is already in use.";
    }

    if (!draft.title.trim()) {
      e.title = "Title is required.";
    } else if (draft.title.trim().length < TITLE_MIN) {
      e.title = `Title must be at least ${TITLE_MIN} characters.`;
    }

    if (!draft.category) e.category = "Pick a category.";

    if (!draft.owner.trim()) {
      e.owner = "Owner is required.";
    }

    if (!draft.audienceRule) e.audienceRule = "Pick an audience rule.";

    if (!draft.nextReview) {
      e.nextReview = "Next review date is required.";
    } else if (Number.isNaN(new Date(draft.nextReview).getTime())) {
      e.nextReview = "Use a valid date.";
    }
    return e;
  }, [draft, existingCodes]);

  const isValid = Object.keys(errors).length === 0;

  function update(field, value) {
    setDraft((prev) => ({ ...prev, [field]: value }));
  }

  function markTouched(field) {
    setTouched((prev) => (prev[field] ? prev : { ...prev, [field]: true }));
  }

  function showError(field) {
    return (touched[field] || submitted) && errors[field];
  }

  const handleFile = useCallback(
    async (file) => {
      if (!file) return;

      // If the user is replacing a previously-staged file, cancel the old
      // staging first so we don't leak a temp file.
      if (tempFileIdRef.current && !committedRef.current) {
        dispatch(cancelStagedPolicyUpload(tempFileIdRef.current));
        tempFileIdRef.current = null;
        setTempFileId(null);
      }

      setExtractor({
        status: "working",
        fileName: file.name,
        progress: 0.3,
        message: "Reading file & extracting metadata…",
        extractedFields: null,
        error: null,
      });

      try {
        const result = await dispatch(stagePolicyUpload(file)).unwrap();
        tempFileIdRef.current = result.temp_file_id;
        setTempFileId(result.temp_file_id);

        // Pre-fill from extracted metadata. Only overwrite fields the API
        // actually returned (any may be null if the LLM couldn't find them).
        const fields = {};
        if (result.code) fields.code = result.code;
        if (result.title) fields.title = result.title;
        if (result.category) fields.category = result.category;
        if (result.next_review_date) {
          fields.nextReview = String(result.next_review_date).slice(0, 10);
        }

        if (Object.keys(fields).length > 0) {
          setDraft((prev) => ({ ...prev, ...fields }));
          setTouched((prev) => ({
            ...prev,
            ...Object.fromEntries(Object.keys(fields).map((k) => [k, true])),
          }));
        }

        setExtractor({
          status: "done",
          fileName: file.name,
          progress: 1,
          message: `Auto-filled from ${result.page_count} page${
            result.page_count === 1 ? "" : "s"
          } (${result.extraction_method}). Review and save.`,
          extractedFields: fields,
          error: null,
        });
      } catch (err) {
        setExtractor({
          status: "error",
          fileName: file.name,
          progress: 0,
          message: "",
          extractedFields: null,
          error:
            err?.detail ?? err?.message ?? "Could not read the file.",
        });
      }
    },
    [dispatch],
  );

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitted(true);
    setSaveError(null);
    if (!isValid) return;

    if (!isEdit && !tempFileId) {
      setSaveError(
        "Drop a PDF first — we need to stage the upload before creating.",
      );
      return;
    }

    const ownerName = draft.owner.trim();
    const matchedOwner = ownerByName(ownerName);
    const values = {
      code: draft.code.trim().toUpperCase(),
      title: draft.title.trim(),
      category: draft.category,
      owner: ownerName,
      // Department is derived from a directory match if available; otherwise
      // keep the policy's existing department (edit) or default (create).
      department: matchedOwner?.role ?? policy?.department ?? "General",
      audienceRule: draft.audienceRule,
      nextReview: draft.nextReview,
    };
    if (!isEdit) values.tempFileId = tempFileId;

    setSaving(true);
    try {
      await onSave?.(values);
      // Confirm succeeded; don't cancel the staged upload on unmount.
      committedRef.current = true;
    } catch (err) {
      setSaveError(
        err?.detail ?? err?.message ?? "Save failed. Try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 px-4 py-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="policy-form-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="grid max-h-full w-full max-w-2xl gap-5 overflow-y-auto rounded-3xl border border-white/80 bg-white p-6 shadow-[0_30px_80px_rgba(15,23,42,0.25)] max-[520px]:rounded-2xl max-[520px]:p-4"
      >
        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-cyan-700">
              {isEdit ? "Edit policy" : "New policy"}
            </p>
            <h2
              id="policy-form-title"
              className="mt-1 text-lg font-semibold leading-tight text-slate-900"
            >
              {isEdit
                ? `Update ${policy?.code ?? "policy"}`
                : "Register a new policy"}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Fields marked with <span className="text-red-600">*</span> are
              required.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close form"
          >
            <FaXmark className="h-4 w-4" aria-hidden="true" />
          </button>
        </header>

        {!isEdit && (
          <PdfDropzone
            extractor={extractor}
            onFile={handleFile}
            onReset={() =>
              setExtractor({
                status: "idle",
                fileName: null,
                progress: 0,
                message: "",
                extractedFields: null,
                error: null,
              })
            }
          />
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Code"
            htmlFor="policy-code"
            hint="e.g. PEP-12, MMU-009, HR 3001"
            error={showError("code") ? errors.code : null}
          >
            <input
              ref={firstFieldRef}
              id="policy-code"
              type="text"
              value={draft.code}
              onChange={(e) => update("code", e.target.value.toUpperCase())}
              onBlur={() => markTouched("code")}
              placeholder="HR 3001"
              className={inputClass(showError("code"))}
              autoComplete="off"
            />
          </Field>

          <Field
            label="Category"
            htmlFor="policy-category"
            error={showError("category") ? errors.category : null}
          >
            <select
              id="policy-category"
              value={draft.category}
              onChange={(e) => update("category", e.target.value)}
              onBlur={() => markTouched("category")}
              className={inputClass(showError("category"))}
            >
              {policyCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </Field>

          <Field
            label="Title"
            htmlFor="policy-title"
            className="sm:col-span-2"
            error={showError("title") ? errors.title : null}
          >
            <input
              id="policy-title"
              type="text"
              value={draft.title}
              onChange={(e) => update("title", e.target.value)}
              onBlur={() => markTouched("title")}
              placeholder="Care of Emergency Patients"
              className={inputClass(showError("title"))}
            />
          </Field>

          <Field
            label="Owner"
            htmlFor="policy-owner"
            className="sm:col-span-2"
            hint="Pick from the directory or type a name / committee of your own."
            error={showError("owner") ? errors.owner : null}
          >
            <OwnerPicker
              value={draft.owner}
              onChange={(value) => update("owner", value)}
              onBlur={() => markTouched("owner")}
              hasError={Boolean(showError("owner"))}
            />
          </Field>

          <Field
            label="Audience rule"
            htmlFor="policy-audience"
            className="sm:col-span-2"
            hint="Who has to read and acknowledge this policy."
            error={showError("audienceRule") ? errors.audienceRule : null}
          >
            <AudiencePicker
              value={draft.audienceRule}
              onChange={(value) => {
                update("audienceRule", value);
                markTouched("audienceRule");
              }}
            />
          </Field>

          <Field
            label="Next review date"
            htmlFor="policy-next-review"
            className="sm:col-span-2"
            error={showError("nextReview") ? errors.nextReview : null}
          >
            <input
              id="policy-next-review"
              type="date"
              value={draft.nextReview}
              onChange={(e) => update("nextReview", e.target.value)}
              onBlur={() => markTouched("nextReview")}
              className={inputClass(showError("nextReview"))}
            />
          </Field>
        </div>

        {submitted && !isValid && (
          <p
            className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700 ring-1 ring-red-200"
            role="alert"
          >
            <FaCircleExclamation className="h-3 w-3" aria-hidden="true" />
            Fix the highlighted fields before saving.
          </p>
        )}

        {saveError && (
          <p
            className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700 ring-1 ring-red-200"
            role="alert"
          >
            <FaCircleExclamation className="h-3 w-3" aria-hidden="true" />
            {saveError}
          </p>
        )}

        <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="inline-flex h-9 items-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-slate-900 px-4 text-xs font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            disabled={(submitted && !isValid) || saving}
          >
            {saving ? (
              <>
                <FaSpinner className="h-3 w-3 animate-spin" aria-hidden="true" />
                {isEdit ? "Saving…" : "Creating…"}
              </>
            ) : (
              <>
                <FaCheck className="h-3 w-3" aria-hidden="true" />
                {isEdit ? "Save changes" : "Create policy"}
              </>
            )}
          </button>
        </footer>
      </form>
    </div>
  );
}

function inputClass(hasError) {
  return [
    "h-9 w-full rounded-lg border bg-white px-3 text-xs text-slate-900 outline-none transition placeholder:text-slate-400",
    hasError
      ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
      : "border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20",
  ].join(" ");
}

function Field({ label, htmlFor, hint, error, className = "", children }) {
  return (
    <div className={`grid min-w-0 gap-1.5 ${className}`}>
      <label
        htmlFor={htmlFor}
        className="text-[11px] font-semibold uppercase tracking-wide text-slate-600"
      >
        {label} <span className="text-red-600">*</span>
      </label>
      {children}
      {error ? (
        <p className="flex items-center gap-1 text-[11px] font-medium text-red-700">
          <FaCircleExclamation className="h-2.5 w-2.5" aria-hidden="true" />
          {error}
        </p>
      ) : hint ? (
        <p className="text-[11px] text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}

function OwnerPicker({ value, onChange, onBlur, hasError }) {
  const [open, setOpen] = useState(false);

  const matches = useMemo(() => {
    const term = value.trim().toLowerCase();
    if (!term) return policyOwners.slice(0, 6);
    return policyOwners
      .filter(
        (u) =>
          u.name.toLowerCase().includes(term) ||
          u.role.toLowerCase().includes(term),
      )
      .slice(0, 6);
  }, [value]);

  function pick(user) {
    onChange(user.name);
    setOpen(false);
  }

  return (
    <div className="relative">
      <FaMagnifyingGlass
        className="pointer-events-none absolute left-3 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400"
        aria-hidden="true"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          window.setTimeout(() => setOpen(false), 120);
          onBlur?.();
        }}
        placeholder="Search owners or committees"
        className={`${inputClass(hasError)} pl-8`}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
      />
      {open && matches.length > 0 && (
        <ul
          role="listbox"
          className="absolute left-0 right-0 top-full z-10 mt-1 max-h-56 overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
        >
          {matches.map((user) => (
            <li key={user.id}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(user)}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs transition hover:bg-cyan-50"
                role="option"
                aria-selected={value === user.name}
              >
                <span className="grid h-6 w-6 place-items-center rounded-md bg-slate-100 text-slate-500">
                  <FaUserTie className="h-3 w-3" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block font-medium text-slate-900">
                    {user.name}
                  </span>
                  <span className="block text-[10px] text-slate-500">
                    {user.role}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AudiencePicker({ value, onChange }) {
  return (
    <div
      className="grid gap-2 sm:grid-cols-2"
      role="radiogroup"
      aria-label="Audience rule"
    >
      {audienceRules.map((rule) => {
        const selected = rule.id === value;
        return (
          <button
            type="button"
            key={rule.id}
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(rule.id)}
            className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-left text-xs transition ${
              selected
                ? "border-cyan-500 bg-cyan-50 ring-2 ring-cyan-500/20"
                : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            <span
              className={`mt-0.5 grid h-5 w-5 place-items-center rounded-md ${
                selected
                  ? "bg-cyan-600 text-white"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              <FaUsers className="h-2.5 w-2.5" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block font-semibold text-slate-900">
                {rule.label}
              </span>
              <span className="mt-0.5 block text-[11px] text-slate-500">
                {rule.description}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function PdfDropzone({ extractor, onFile, onReset }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const working = extractor.status === "working";

  function handleDrop(event) {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) onFile(file);
  }

  function handlePick(event) {
    const file = event.target.files?.[0];
    if (file) onFile(file);
    event.target.value = "";
  }

  if (extractor.status === "done" || extractor.status === "error") {
    const success = extractor.status === "done";
    const filledCount = extractor.extractedFields
      ? Object.keys(extractor.extractedFields).length
      : 0;
    return (
      <div
        className={`flex flex-wrap items-center gap-3 rounded-2xl border px-4 py-3 text-xs ${
          success
            ? "border-cyan-200 bg-cyan-50 text-cyan-900"
            : "border-red-200 bg-red-50 text-red-800"
        }`}
        role="status"
      >
        <span
          className={`grid h-8 w-8 place-items-center rounded-lg ${
            success ? "bg-white text-cyan-700" : "bg-white text-red-700"
          }`}
        >
          {success ? (
            <FaWandMagicSparkles className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <FaCircleExclamation className="h-3.5 w-3.5" aria-hidden="true" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">
            {success
              ? `Filled ${filledCount} field${filledCount === 1 ? "" : "s"} from ${extractor.fileName}`
              : `Couldn't read ${extractor.fileName ?? "the PDF"}`}
          </p>
          <p className="mt-0.5 text-[11px] opacity-80">
            {success
              ? (extractor.message ?? "Review and tweak before saving.")
              : extractor.error}
          </p>
        </div>
        <button
          type="button"
          onClick={onReset}
          className={`inline-flex h-8 items-center rounded-lg border px-3 text-[11px] font-semibold transition ${
            success
              ? "border-cyan-300 bg-white text-cyan-700 hover:bg-cyan-100"
              : "border-red-300 bg-white text-red-700 hover:bg-red-100"
          }`}
        >
          {success ? "Replace PDF" : "Try another"}
        </button>
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!working) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`relative grid gap-2 rounded-2xl border-2 border-dashed px-4 py-5 text-center transition ${
        working
          ? "border-cyan-300 bg-cyan-50/60"
          : dragging
            ? "border-cyan-500 bg-cyan-50"
            : "border-slate-300 bg-slate-50/70 hover:border-slate-400 hover:bg-slate-50"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        onChange={handlePick}
        className="hidden"
        disabled={working}
      />

      {working ? (
        <>
          <span className="mx-auto grid h-9 w-9 place-items-center rounded-lg bg-white text-cyan-700 shadow-sm">
            <FaSpinner className="h-4 w-4 animate-spin" aria-hidden="true" />
          </span>
          <p className="text-xs font-semibold text-slate-800">
            {extractor.fileName ?? "Reading PDF…"}
          </p>
          <p className="text-[11px] text-slate-600">
            {extractor.message || "Processing…"}
          </p>
          <div className="mx-auto h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-white">
            <div
              className="h-full rounded-full bg-cyan-500 transition-[width]"
              style={{ width: `${Math.round(extractor.progress * 100)}%` }}
            />
          </div>
        </>
      ) : (
        <>
          <span className="mx-auto grid h-9 w-9 place-items-center rounded-lg bg-white text-slate-700 shadow-sm">
            <FaCloudArrowUp className="h-4 w-4" aria-hidden="true" />
          </span>
          <p className="text-xs font-semibold text-slate-800">
            Drop a file to auto-fill the form
          </p>

          <div className="mt-1 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-[11px] font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <FaFilePdf className="h-3 w-3" aria-hidden="true" />
              Choose file
            </button>
            <span className="text-[11px] text-slate-400">
              or fill the form manually below
            </span>
          </div>
        </>
      )}
    </div>
  );
}

export default PolicyForm;
