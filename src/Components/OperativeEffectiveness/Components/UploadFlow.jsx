import { useEffect, useRef, useState } from "react";
import {
  FaArrowLeft,
  FaCheck,
  FaCircleNotch,
  FaCloudArrowUp,
  FaFile,
  FaXmark,
} from "react-icons/fa6";
import { evidenceDepartments } from "../../../data";

// Verdict templates used by the simulated AI when the user runs analysis.
// Picked deterministically by file extension to make the demo feel less
// random — CSV → cold-chain log, PDF → audit form, XLSX → bundle audit.
const VERDICT_TEMPLATES = {
  csv: {
    aiDescription:
      "Daily log uploaded as CSV. 30 entries across the chosen period. AI identified the data shape as a cold-chain monitoring log: 27 readings within range, 2 readings near boundary, 1 day missing.",
    policyResults: [
      {
        policyId: "POL-001",
        policyCode: "BB-COLD-CHAIN-SOP",
        policyTitle: "Blood unit cold-chain storage SOP",
        compliancePercent: 90,
        findings: [
          {
            id: "F1",
            type: "compliant",
            evidenceRef: "Days 1–25",
            policyClauseRef: "§3.1 Daily logging required",
            reasoning: "All entries present and within range.",
            override: null,
          },
          {
            id: "F2",
            type: "warning",
            evidenceRef: "Days 12, 18",
            policyClauseRef: "§3.2 Acceptable range -25°C to -19°C",
            reasoning: "Two entries at -18°C — at the upper boundary.",
            override: null,
          },
          {
            id: "F3",
            type: "missing",
            evidenceRef: "Day 22",
            policyClauseRef: "§3.1 Daily logging required",
            reasoning: "No entry recorded for day 22.",
            override: null,
          },
        ],
      },
    ],
  },
  pdf: {
    aiDescription:
      "Scanned PDF audit form recognised via OCR. 84 reviewed events. Most fields completed; several missing signatures and timestamps detected.",
    policyResults: [
      {
        policyId: "POL-004",
        policyCode: "ED-TRIAGE-PROT",
        policyTitle: "Emergency department triage protocol",
        compliancePercent: 78,
        findings: [
          {
            id: "F1",
            type: "compliant",
            evidenceRef: "84 of 84 events",
            policyClauseRef: "§2.1 ESI level assignment",
            reasoning: "ESI score recorded on every event.",
            override: null,
          },
          {
            id: "F2",
            type: "non_compliant",
            evidenceRef: "12 of 84 events",
            policyClauseRef: "§2.3 Re-triage if wait >30 min",
            reasoning:
              "Re-triage check missing on 12 long-wait events. Quality officer review recommended.",
            override: null,
          },
        ],
      },
    ],
  },
  xlsx: {
    aiDescription:
      "Excel workbook with two sheets — a bundle audit checklist and a sign-off log. 60 patient-days reviewed. Bundle elements mostly documented; sedation interruption gaps identified.",
    policyResults: [
      {
        policyId: "POL-005",
        policyCode: "ICU-VAP-BUNDLE",
        policyTitle: "Ventilator-associated pneumonia prevention bundle",
        compliancePercent: 88,
        findings: [
          {
            id: "F1",
            type: "compliant",
            evidenceRef: "58 of 60 patient-days",
            policyClauseRef: "§2.1 Head-of-bed ≥30°",
            reasoning: "HoB elevation documented on 96% of patient-days.",
            override: null,
          },
          {
            id: "F2",
            type: "warning",
            evidenceRef: "7 of 60 patient-days",
            policyClauseRef: "§2.4 Daily sedation interruption",
            reasoning: "Sedation interruption not documented on 7 patient-days.",
            override: null,
          },
        ],
      },
    ],
  },
};

const FALLBACK_TEMPLATE = {
  aiDescription:
    "Evidence file received. AI extracted the key fields and compared them to the most-relevant policies in your library.",
  policyResults: [
    {
      policyId: "POL-002",
      policyCode: "BB-VERIFY-SOP",
      policyTitle: "Pre-transfusion bedside verification SOP",
      compliancePercent: 82,
      findings: [
        {
          id: "F1",
          type: "compliant",
          evidenceRef: "Most records",
          policyClauseRef: "§4.1 Two-identifier verification",
          reasoning: "Two identifiers captured on most records.",
          override: null,
        },
        {
          id: "F2",
          type: "warning",
          evidenceRef: "Several records",
          policyClauseRef: "§4.2 Dual signature",
          reasoning:
            "A handful of records show only one signature in the witness column.",
          override: null,
        },
      ],
    },
  ],
};

function extOf(fileName) {
  const m = (fileName ?? "").match(/\.([a-z0-9]+)$/i);
  return m ? m[1].toLowerCase() : "";
}

function pickTemplate(fileName) {
  const ext = extOf(fileName);
  return VERDICT_TEMPLATES[ext] ?? FALLBACK_TEMPLATE;
}

const STEPS = [
  { key: "interpret", label: "Interpreting evidence" },
  { key: "match", label: "Matching policies" },
  { key: "check", label: "Checking compliance" },
];

function UploadFlow({ onCancel, onComplete }) {
  const [stage, setStage] = useState("drop"); // "drop" | "processing"
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [file, setFile] = useState(null);
  const [department, setDepartment] = useState(evidenceDepartments[0]);
  const [period, setPeriod] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const dropRef = useRef(null);
  const inputRef = useRef(null);

  // Walk through the three processing steps with ~700ms each, then finish.
  // activeStepIndex is reset to 0 inside startProcessing() so the effect can
  // stay pure — no leading setState here.
  useEffect(() => {
    if (stage !== "processing") return undefined;
    const t1 = setTimeout(() => setActiveStepIndex(1), 700);
    const t2 = setTimeout(() => setActiveStepIndex(2), 1500);
    const t3 = setTimeout(() => {
      const template = pickTemplate(file?.name);
      const ext = extOf(file?.name);
      const uploadedAt = new Date().toISOString();
      const id = `UP-${uploadedAt.replace(/[-:.TZ]/g, "").slice(0, 14)}`;
      const newUpload = {
        id,
        fileName: file?.name ?? "evidence",
        fileType: ext,
        uploadedBy: "K. Iyer (Quality Officer)",
        uploadedAt,
        period: period || "—",
        department: department || "—",
        status: "pending",
        aiDescription: template.aiDescription,
        verdict: {
          policyResults: template.policyResults.map((r) => ({
            ...r,
            findings: r.findings.map((f) => ({ ...f })),
          })),
        },
      };
      onComplete?.(newUpload);
    }, 2400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [stage, file, department, period, onComplete]);

  function handleSelectFile(e) {
    const picked = e.target.files?.[0];
    if (picked) setFile(picked);
  }

  function handleDrop(e) {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) setFile(dropped);
  }

  function handleDragOver(e) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave() {
    setIsDragging(false);
  }

  function clearFile() {
    setFile(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function startProcessing() {
    if (!file) return;
    setActiveStepIndex(0);
    setStage("processing");
  }

  return (
    <div className="grid min-w-0 gap-5 max-[900px]:gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={stage === "processing"}
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FaArrowLeft className="h-3 w-3" aria-hidden="true" />
          Back to dashboard
        </button>
        <StepperBadge stage={stage} />
      </div>

      <Hero />

      {stage === "drop" && (
        <DropStage
          file={file}
          department={department}
          period={period}
          isDragging={isDragging}
          dropRef={dropRef}
          inputRef={inputRef}
          onDepartmentChange={setDepartment}
          onPeriodChange={setPeriod}
          onSelectFile={handleSelectFile}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClearFile={clearFile}
          onStart={startProcessing}
          onCancel={onCancel}
        />
      )}

      {stage === "processing" && (
        <ProcessingStage activeStepIndex={activeStepIndex} fileName={file?.name} />
      )}
    </div>
  );
}

function StepperBadge({ stage }) {
  const items = [
    { key: "drop", label: "Drop file" },
    { key: "processing", label: "Analyse" },
  ];
  const activeIndex = items.findIndex((s) => s.key === stage);
  return (
    <ol className="flex items-center gap-2 text-[11px] font-medium text-slate-500">
      {items.map((item, idx) => {
        const isActive = idx === activeIndex;
        const isDone = idx < activeIndex;
        return (
          <li key={item.key} className="flex items-center gap-2">
            <span
              className={`grid h-6 w-6 place-items-center rounded-full text-[11px] font-semibold ring-1 ${
                isActive
                  ? "bg-slate-900 text-white ring-slate-900"
                  : isDone
                    ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                    : "bg-white text-slate-500 ring-slate-200"
              }`}
            >
              {isDone ? <FaCheck className="h-2.5 w-2.5" /> : idx + 1}
            </span>
            <span
              className={isActive ? "text-slate-900" : isDone ? "text-emerald-700" : ""}
            >
              {item.label}
            </span>
            {idx < items.length - 1 && (
              <span className="mx-1 h-px w-6 bg-slate-200" />
            )}
          </li>
        );
      })}
    </ol>
  );
}

function Hero() {
  return (
    <section className="relative min-w-0 overflow-hidden rounded-3xl border border-white/80 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.10)] max-[520px]:rounded-2xl">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,#cffafe_0%,transparent_55%),radial-gradient(circle_at_bottom_left,#e0f2fe_0%,transparent_50%)]"
      />
      <div className="relative grid gap-2 p-6 max-[520px]:p-4">
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-cyan-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-cyan-700 ring-1 ring-cyan-200">
          <FaCloudArrowUp className="h-3 w-3" aria-hidden="true" />
          Upload evidence
        </span>
        <h1 className="text-xl font-semibold leading-tight text-slate-900 max-[520px]:text-lg">
          Drop a log, checklist or audit form
        </h1>
        <p className="text-xs text-slate-500">
          AI will read the file, find the policies it relates to, and produce
          an advisory compliance verdict you can review.
        </p>
      </div>
    </section>
  );
}

function DropStage({
  file,
  department,
  period,
  isDragging,
  dropRef,
  inputRef,
  onDepartmentChange,
  onPeriodChange,
  onSelectFile,
  onDrop,
  onDragOver,
  onDragLeave,
  onClearFile,
  onStart,
  onCancel,
}) {
  return (
    <section className="relative min-w-0 overflow-hidden rounded-3xl border border-white/80 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)] max-[520px]:rounded-2xl">
      <header className="border-b border-slate-100 px-5 py-3">
        <h2 className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
          File + context
        </h2>
      </header>
      <div className="grid gap-5 p-5 max-[520px]:p-4">
        <div
          ref={dropRef}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          className={`grid place-items-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition ${
            isDragging
              ? "border-cyan-500 bg-cyan-50/60"
              : "border-slate-200 bg-slate-50/40"
          }`}
        >
          {file ? (
            <div className="grid place-items-center gap-2">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
                <FaFile className="h-5 w-5" aria-hidden="true" />
              </span>
              <p className="text-sm font-medium text-slate-900">{file.name}</p>
              <p className="text-[11px] text-slate-500">
                {(file.size / 1024).toFixed(1)} KB
              </p>
              <button
                type="button"
                onClick={onClearFile}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-600 transition hover:text-rose-700"
              >
                <FaXmark className="h-2.5 w-2.5" aria-hidden="true" />
                Remove
              </button>
            </div>
          ) : (
            <>
              <span className="grid h-12 w-12 place-items-center rounded-full bg-cyan-50 text-cyan-700">
                <FaCloudArrowUp className="h-5 w-5" aria-hidden="true" />
              </span>
              <p className="text-sm font-medium text-slate-800">
                Drag a CSV, PDF, image or Excel file here
              </p>
              <p className="text-[11px] text-slate-500">or</p>
              <label className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 transition hover:bg-slate-50">
                <FaCloudArrowUp className="h-3 w-3" aria-hidden="true" />
                Browse files
                <input
                  ref={inputRef}
                  type="file"
                  accept=".csv,.pdf,.xlsx,.xls,.png,.jpg,.jpeg"
                  onChange={onSelectFile}
                  className="hidden"
                />
              </label>
              <p className="mt-2 text-[10px] text-slate-400">
                CSV · PDF · XLSX · PNG · JPG accepted.
              </p>
            </>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Department (optional)
            </span>
            <select
              value={department}
              onChange={(e) => onDepartmentChange(e.target.value)}
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
            >
              {evidenceDepartments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Period covered (optional)
            </span>
            <input
              type="text"
              value={period}
              onChange={(e) => onPeriodChange(e.target.value)}
              placeholder="e.g. April 2026, Q1 2026"
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
          >
            <FaXmark className="h-3 w-3" aria-hidden="true" />
            Cancel
          </button>
          <button
            type="button"
            onClick={onStart}
            disabled={!file}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-slate-900 px-3 text-xs font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FaCloudArrowUp className="h-3 w-3" aria-hidden="true" />
            Run analysis
          </button>
        </div>
      </div>
    </section>
  );
}

function ProcessingStage({ activeStepIndex, fileName }) {
  return (
    <section className="relative min-w-0 overflow-hidden rounded-3xl border border-white/80 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)] max-[520px]:rounded-2xl">
      <div className="grid place-items-center gap-5 px-6 py-12 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200">
          <FaCircleNotch className="h-5 w-5 animate-spin" aria-hidden="true" />
        </span>
        <div>
          <p className="text-sm font-semibold text-slate-900">
            Running analysis on{" "}
            <span className="font-mono text-slate-700">{fileName ?? "evidence"}</span>
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Three short stages — should finish in a couple of seconds.
          </p>
        </div>

        <ol className="grid gap-2">
          {STEPS.map((step, idx) => {
            const isActive = idx === activeStepIndex;
            const isDone = idx < activeStepIndex;
            return (
              <li
                key={step.key}
                className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-left text-xs transition ${
                  isActive
                    ? "border-cyan-200 bg-cyan-50/60 text-slate-900"
                    : isDone
                      ? "border-emerald-200 bg-emerald-50/60 text-emerald-800"
                      : "border-slate-200 bg-white text-slate-500"
                }`}
              >
                <span
                  className={`grid h-5 w-5 place-items-center rounded-full text-[10px] font-bold ring-1 ${
                    isActive
                      ? "bg-cyan-500 text-white ring-cyan-600"
                      : isDone
                        ? "bg-emerald-500 text-white ring-emerald-600"
                        : "bg-white text-slate-500 ring-slate-300"
                  }`}
                >
                  {isDone ? <FaCheck className="h-2 w-2" /> : idx + 1}
                </span>
                <span className="font-medium">{step.label}</span>
                {isActive && (
                  <FaCircleNotch className="ml-auto h-3 w-3 animate-spin text-cyan-600" aria-hidden="true" />
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

export default UploadFlow;
