import { useMemo, useState } from "react";
import {
  FaArrowLeft,
  FaCheck,
  FaCircleCheck,
  FaWandMagicSparkles,
  FaXmark,
} from "react-icons/fa6";
import { departments, macroCategories } from "../../../data";

const ACCREDITATIONS = ["JCI", "NABL", "JCI", "ISO 9001", "General"];

const TIER_SCOPES = [
  { value: "operational", label: "Operational only" },
  { value: "operational+process", label: "Operational + Process-Level" },
  { value: "all", label: "All tiers (incl. Strategic)" },
];

// Risk seed templates — three per macro-category, each gets instantiated once
// per selected department.
const TEMPLATES = {
  "Clinical Departments": [
    {
      tier: "Operational",
      category: "Patient Safety",
      title: (d) =>
        `Patient misidentification during ${d.toLowerCase()} workflows`,
      description: (d) =>
        `Risk of misidentifying patients during ${d.toLowerCase()} interventions, potentially leading to wrong-patient procedures.`,
      context:
        "Identification protocols are manual and can lapse under workload pressure.",
      likelihood: 3,
      impact: 5,
      controlEffectiveness: 2,
      controlDescription:
        "Two-identifier verification at registration and at each intervention point.",
      controlAttributes: ["Preventive", "Manual", "Per-event"],
      mitigationPlan: "Roll out barcode/RFID wristband verification.",
      mitigationOwner: "Department head + IT",
      mitigationTimeline: "Q3 2027",
    },
    {
      tier: "Operational",
      category: "Quality",
      title: (d) => `Adverse outcome trend in ${d.toLowerCase()}`,
      description: (d) =>
        `Cluster of adverse outcomes in ${d.toLowerCase()} may indicate a systemic quality issue.`,
      context:
        "Outcome surveillance is monthly; trends may go undetected for weeks.",
      likelihood: 3,
      impact: 4,
      controlEffectiveness: 2,
      controlDescription:
        "Monthly outcome review committee; mortality & morbidity conference.",
      controlAttributes: ["Detective", "Manual", "Monthly"],
      mitigationPlan:
        "Implement weekly outcome dashboard with statistical process control.",
      mitigationOwner: "Quality Director",
      mitigationTimeline: "Q1 2027",
    },
    {
      tier: "Process-Level",
      category: "Process",
      title: (d) => `Handoff communication failure in ${d.toLowerCase()}`,
      description: (d) =>
        `Information loss during shift change or care transitions in ${d.toLowerCase()} can result in missed treatments.`,
      context: "Handoff is verbal-only; no structured handover tool in place.",
      likelihood: 4,
      impact: 3,
      controlEffectiveness: 2,
      controlDescription:
        "SBAR-style handoff protocol; supervisor spot-check on rounds.",
      controlAttributes: ["Preventive", "Manual", "Per-shift"],
      mitigationPlan:
        "Adopt structured electronic handover tool integrated with EMR.",
      mitigationOwner: "Department head + IT",
      mitigationTimeline: "Q4 2026",
    },
  ],
  "Clinical Support Services": [
    {
      tier: "Operational",
      category: "Patient Safety",
      title: (d) => `Specimen / sample integrity loss in ${d.toLowerCase()}`,
      description: (d) =>
        `Inadequate handling or storage in ${d.toLowerCase()} can compromise specimen integrity and downstream clinical decisions.`,
      context: "Validated SOPs exist but are inconsistently followed.",
      likelihood: 3,
      impact: 4,
      controlEffectiveness: 2,
      controlDescription:
        "Defined chain-of-custody; temperature logs for storage.",
      controlAttributes: ["Preventive", "Manual", "Per-event"],
      mitigationPlan:
        "Continuous temperature monitoring with automated alerts.",
      mitigationOwner: "Department head",
      mitigationTimeline: "Q2 2027",
    },
    {
      tier: "Operational",
      category: "Compliance",
      title: (d) => `Regulatory non-compliance in ${d.toLowerCase()} services`,
      description: (d) =>
        `Operations in ${d.toLowerCase()} may drift out of regulatory compliance between audits.`,
      context:
        "Compliance posture reviewed annually; gaps may accumulate between cycles.",
      likelihood: 2,
      impact: 4,
      controlEffectiveness: 2,
      controlDescription:
        "Annual self-assessment; standards drift report quarterly.",
      controlAttributes: ["Detective", "Manual", "Quarterly"],
      mitigationPlan:
        "Move to continuous compliance monitoring with risk indicators.",
      mitigationOwner: "Quality + Department head",
      mitigationTimeline: "Q1 2027",
    },
    {
      tier: "Process-Level",
      category: "Process",
      title: (d) => `Turnaround time breaches in ${d.toLowerCase()}`,
      description: (d) =>
        `Service turnaround time in ${d.toLowerCase()} may exceed clinical-need thresholds, delaying care.`,
      context: "TAT targets are defined but only retrospectively measured.",
      likelihood: 4,
      impact: 3,
      controlEffectiveness: 2,
      controlDescription:
        "Monthly TAT report; escalation procedure on outliers.",
      controlAttributes: ["Detective", "Manual", "Monthly"],
      mitigationPlan: "Real-time TAT dashboard with auto-escalation.",
      mitigationOwner: "Department head + IT",
      mitigationTimeline: "Q3 2026",
    },
  ],
  "Administration & Finance": [
    {
      tier: "Operational",
      category: "Compliance",
      title: (d) => `Regulatory or contractual non-compliance in ${d}`,
      description: (d) =>
        `${d} processes may fall out of compliance with regulatory or contractual obligations between reviews.`,
      context: "Manual tracking of compliance milestones.",
      likelihood: 2,
      impact: 4,
      controlEffectiveness: 2,
      controlDescription: "Quarterly compliance review; legal sign-off.",
      controlAttributes: ["Detective", "Manual", "Quarterly"],
      mitigationPlan: "Deploy compliance management software with alerts.",
      mitigationOwner: "Compliance officer",
      mitigationTimeline: "Q2 2027",
    },
    {
      tier: "Operational",
      category: "Financial",
      title: (d) => `Process error causing financial loss in ${d}`,
      description: (d) =>
        `Manual handling of transactions in ${d} may result in duplicate payments, mis-postings, or revenue leakage.`,
      context: "Three-way match exists but is paper-based.",
      likelihood: 3,
      impact: 4,
      controlEffectiveness: 2,
      controlDescription:
        "Three-way match (PO/GRN/invoice); supervisor approval threshold.",
      controlAttributes: ["Preventive", "Manual", "Per-event"],
      mitigationPlan: "Automate three-way match with ERP integration.",
      mitigationOwner: "Finance + IT",
      mitigationTimeline: "Q1 2027",
    },
    {
      tier: "Process-Level",
      category: "Process",
      title: (d) => `Approval / authorization control gap in ${d}`,
      description: (d) =>
        `Transactions or decisions in ${d} may bypass the required approval step due to workflow ambiguity.`,
      context: "DOA is documented but not enforced by system controls.",
      likelihood: 3,
      impact: 3,
      controlEffectiveness: 3,
      controlDescription:
        "Documented Delegation of Authority; quarterly audit.",
      controlAttributes: ["Preventive", "Manual", "Quarterly"],
      mitigationPlan:
        "Embed DOA limits in workflow tools with system enforcement.",
      mitigationOwner: "Department head + IT",
      mitigationTimeline: "Q2 2027",
    },
  ],
  "Support Services": [
    {
      tier: "Operational",
      category: "Operational",
      title: (d) => `Critical service disruption in ${d}`,
      description: (d) =>
        `Failure of a primary ${d.toLowerCase()} service could cascade into clinical operational impact.`,
      context: "Backup capacity exists but failover is manual.",
      likelihood: 2,
      impact: 5,
      controlEffectiveness: 2,
      controlDescription:
        "Documented business continuity plan; quarterly drills.",
      controlAttributes: ["Preventive", "Manual", "Quarterly"],
      mitigationPlan: "Automate failover with monitored SLAs.",
      mitigationOwner: "Department head + IT",
      mitigationTimeline: "Q4 2026",
    },
    {
      tier: "Operational",
      category: "Safety",
      title: (d) => `Workplace safety incident in ${d}`,
      description: (d) =>
        `Staff in ${d.toLowerCase()} may sustain injury due to inadequate PPE, training, or environmental controls.`,
      context: "Incident reporting is voluntary; under-reporting is likely.",
      likelihood: 3,
      impact: 3,
      controlEffectiveness: 2,
      controlDescription: "PPE policy; annual training; incident reporting.",
      controlAttributes: ["Preventive", "Manual", "Continuous"],
      mitigationPlan: "Adopt anonymous near-miss reporting platform.",
      mitigationOwner: "HSE officer",
      mitigationTimeline: "Q1 2027",
    },
    {
      tier: "Process-Level",
      category: "Process",
      title: (d) => `Maintenance schedule slippage in ${d}`,
      description: (d) =>
        `Preventive maintenance for ${d.toLowerCase()}-managed assets may slip beyond SLA, increasing failure probability.`,
      context: "CMMS tracking exists but is reactive.",
      likelihood: 3,
      impact: 3,
      controlEffectiveness: 3,
      controlDescription: "Monthly PM schedule; supervisor sign-off.",
      controlAttributes: ["Detective", "Manual", "Monthly"],
      mitigationPlan: "Move to predictive maintenance using sensor data.",
      mitigationOwner: "Biomedical / Facilities",
      mitigationTimeline: "Q3 2027",
    },
  ],
  "Governance, Risk & Compliance": [
    {
      tier: "Operational",
      category: "Compliance",
      title: (d) => `Regulatory change tracking gap in ${d}`,
      description: (d) =>
        `Failure to track applicable regulatory changes in ${d.toLowerCase()} may cause inadvertent non-compliance.`,
      context: "Regulatory updates monitored ad-hoc.",
      likelihood: 3,
      impact: 4,
      controlEffectiveness: 2,
      controlDescription:
        "Monthly regulatory bulletin review; legal sign-off on changes.",
      controlAttributes: ["Detective", "Manual", "Monthly"],
      mitigationPlan:
        "Subscribe to regulatory-change monitoring service with workflow integration.",
      mitigationOwner: "Compliance officer + Legal",
      mitigationTimeline: "Q1 2027",
    },
    {
      tier: "Operational",
      category: "Privacy",
      title: (d) => `Data subject rights handling delay in ${d}`,
      description: (d) =>
        `Requests for access, correction, or deletion of personal data handled by ${d.toLowerCase()} may exceed statutory response timelines.`,
      context: "Requests handled via email; no central tracker.",
      likelihood: 3,
      impact: 4,
      controlEffectiveness: 3,
      controlDescription: "DPO acknowledges within 48h; manual tracker.",
      controlAttributes: ["Detective", "Manual", "Per-event"],
      mitigationPlan:
        "Deploy DSR portal with SLA tracking and automated escalation.",
      mitigationOwner: "DPO + IT",
      mitigationTimeline: "Q2 2027",
    },
    {
      tier: "Strategic",
      category: "Strategic",
      title: (d) => `Erosion of ${d.toLowerCase()} program effectiveness`,
      description: (d) =>
        `Sustained under-investment in ${d.toLowerCase()} program may erode organisation-level governance effectiveness over time.`,
      context: "Escalated for board-level oversight.",
      likelihood: 2,
      impact: 5,
      controlEffectiveness: 2,
      controlDescription:
        "Annual board review of program effectiveness and budget.",
      controlAttributes: ["Strategic", "Manual", "Annual"],
      mitigationPlan: "Define multi-year roadmap with funded milestones.",
      mitigationOwner: "Board + executive sponsor",
      mitigationTimeline: "FY 2027",
    },
  ],
};

function deptCode(name) {
  const acronym = name
    .split(/[\s&/]+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 4);
  return acronym || "GEN";
}

function buildProposals({ selectedDepartments, tierScope, accreditation }) {
  const allowedTiers = new Set(
    tierScope === "operational"
      ? ["Operational"]
      : tierScope === "operational+process"
        ? ["Operational", "Process-Level"]
        : ["Operational", "Process-Level", "Strategic"],
  );

  const proposals = [];
  const stamp = Date.now().toString(36).slice(-4);

  for (const deptName of selectedDepartments) {
    const dept = departments.find((d) => d.name === deptName);
    if (!dept) continue;
    const templates = TEMPLATES[dept.macroCategory] ?? [];
    let seq = 1;
    for (const t of templates) {
      if (!allowedTiers.has(t.tier)) continue;
      const code = deptCode(dept.name);
      const id = `GEN-${code}-${stamp}-${seq.toString().padStart(2, "0")}`;
      const inherent = t.likelihood * t.impact;
      proposals.push({
        id,
        riskNumber: id,
        department: dept.name,
        macroCategory: dept.macroCategory,
        category: t.category,
        title: t.title(dept.name),
        description: t.description(dept.name),
        context: `${t.context} Accreditation context: ${accreditation}.`,
        owner: `${dept.name} lead`,
        tier: t.tier,
        likelihood: t.likelihood,
        impact: t.impact,
        inherentRating: inherent,
        controlDescription: t.controlDescription,
        controlAttributes: t.controlAttributes,
        controlEffectiveness: t.controlEffectiveness,
        residualRating: inherent * t.controlEffectiveness,
        mitigationPlan: t.mitigationPlan,
        mitigationOwner: t.mitigationOwner,
        mitigationTimeline: t.mitigationTimeline,
      });
      seq += 1;
    }
  }
  return proposals;
}

function GenerateWizard({ onCancel, onAccept, existingRiskCount }) {
  const [step, setStep] = useState("configure");
  const [macroCategory, setMacroCategory] = useState("");
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [accreditation, setAccreditation] = useState("JCI");
  const [tierScope, setTierScope] = useState("operational+process");
  const [proposals, setProposals] = useState([]);
  const [includedIds, setIncludedIds] = useState(() => new Set());

  const availableDepartments = useMemo(
    () =>
      macroCategory
        ? departments.filter((d) => d.macroCategory === macroCategory)
        : [],
    [macroCategory],
  );

  function toggleDepartment(name) {
    setSelectedDepartments((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name],
    );
  }

  function selectAllDepartments() {
    setSelectedDepartments(availableDepartments.map((d) => d.name));
  }

  function clearDepartments() {
    setSelectedDepartments([]);
  }

  function handleGenerate() {
    setStep("generating");
    // Simulated AI delay so the loading state is observable. Replace with a
    // real call once a /risks/generate endpoint exists.
    window.setTimeout(() => {
      const generated = buildProposals({
        selectedDepartments,
        tierScope,
        accreditation,
      });
      setProposals(generated);
      setIncludedIds(new Set(generated.map((r) => r.id)));
      setStep("review");
    }, 1200);
  }

  function toggleInclude(id) {
    setIncludedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleAccept() {
    const accepted = proposals.filter((r) => includedIds.has(r.id));
    onAccept(accepted);
  }

  const canGenerate = selectedDepartments.length > 0;
  const acceptCount = includedIds.size;

  return (
    <div className="grid min-w-0 gap-5 max-[900px]:gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
        >
          <FaArrowLeft className="h-3 w-3" aria-hidden="true" />
          Back to register
        </button>
        <StepIndicator step={step} />
      </div>

      <Hero existingRiskCount={existingRiskCount} />

      {step === "configure" && (
        <ConfigureCard
          macroCategory={macroCategory}
          setMacroCategory={(v) => {
            setMacroCategory(v);
            setSelectedDepartments([]);
          }}
          availableDepartments={availableDepartments}
          selectedDepartments={selectedDepartments}
          toggleDepartment={toggleDepartment}
          selectAllDepartments={selectAllDepartments}
          clearDepartments={clearDepartments}
          accreditation={accreditation}
          setAccreditation={setAccreditation}
          tierScope={tierScope}
          setTierScope={setTierScope}
          canGenerate={canGenerate}
          onGenerate={handleGenerate}
        />
      )}

      {step === "generating" && <GeneratingCard />}

      {step === "review" && (
        <ReviewCard
          proposals={proposals}
          includedIds={includedIds}
          toggleInclude={toggleInclude}
          onBack={() => setStep("configure")}
          onAccept={handleAccept}
          acceptCount={acceptCount}
        />
      )}
    </div>
  );
}

function StepIndicator({ step }) {
  const steps = [
    { id: "configure", label: "Scope" },
    { id: "generating", label: "Generating" },
    { id: "review", label: "Review" },
  ];
  const activeIdx = steps.findIndex((s) => s.id === step);
  return (
    <div className="flex items-center gap-1.5 text-[11px]">
      {steps.map((s, i) => (
        <span key={s.id} className="inline-flex items-center gap-1.5">
          <span
            className={`grid h-5 w-5 place-items-center rounded-full text-[10px] font-semibold ring-1 transition ${
              i < activeIdx
                ? "bg-emerald-500 text-white ring-emerald-600"
                : i === activeIdx
                  ? "bg-slate-900 text-white ring-slate-900"
                  : "bg-white text-slate-400 ring-slate-200"
            }`}
          >
            {i < activeIdx ? <FaCheck className="h-2.5 w-2.5" /> : i + 1}
          </span>
          <span
            className={`font-medium ${
              i === activeIdx ? "text-slate-900" : "text-slate-500"
            }`}
          >
            {s.label}
          </span>
          {i < steps.length - 1 && (
            <span className="mx-1 text-slate-300">›</span>
          )}
        </span>
      ))}
    </div>
  );
}

function Hero({ existingRiskCount }) {
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
      <div className="relative grid gap-2 p-6 max-[520px]:p-4">
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-cyan-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-cyan-700 ring-1 ring-cyan-200">
          <FaWandMagicSparkles className="h-3 w-3" aria-hidden="true" />
          Generate register
        </span>
        <h1 className="text-xl font-semibold leading-tight text-slate-900 max-[520px]:text-lg">
          AI-assisted risk register seeding
        </h1>
        <p className="text-xs text-slate-500">
          Pick a macro-category and the departments to seed, choose an
          accreditation context, then review proposed risks before adding them
          to the register. {existingRiskCount} risks already in the register.
        </p>
      </div>
    </section>
  );
}

function ConfigureCard({
  macroCategory,
  setMacroCategory,
  availableDepartments,
  selectedDepartments,
  toggleDepartment,
  selectAllDepartments,
  clearDepartments,
  accreditation,
  setAccreditation,
  tierScope,
  setTierScope,
  canGenerate,
  onGenerate,
}) {
  return (
    <section className="relative min-w-0 overflow-hidden rounded-3xl border border-white/80 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)] max-[520px]:rounded-2xl">
      <header className="border-b border-slate-100 px-5 py-3">
        <h2 className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
          Scope of generation
        </h2>
      </header>
      <div className="grid gap-5 p-5 max-[520px]:p-4">
        <div className="grid gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Macro-category
          </span>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {macroCategories.map((mc) => (
              <button
                key={mc}
                type="button"
                onClick={() => setMacroCategory(mc)}
                className={`rounded-xl border px-3 py-2 text-left text-xs font-medium transition ${
                  macroCategory === mc
                    ? "border-cyan-300 bg-cyan-50 text-cyan-900 ring-2 ring-cyan-500/30"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {mc}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-1.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Departments to seed{" "}
              {selectedDepartments.length > 0 &&
                `· ${selectedDepartments.length} selected`}
            </span>
            {availableDepartments.length > 0 && (
              <div className="flex gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={selectAllDepartments}
                  className="font-medium text-cyan-700 hover:underline"
                >
                  Select all
                </button>
                <span className="text-slate-300">·</span>
                <button
                  type="button"
                  onClick={clearDepartments}
                  className="font-medium text-slate-500 hover:text-slate-700"
                >
                  Clear
                </button>
              </div>
            )}
          </div>
          {macroCategory === "" ? (
            <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/40 p-4 text-center text-xs text-slate-500">
              Pick a macro-category to see its departments.
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {availableDepartments.map((d) => {
                const checked = selectedDepartments.includes(d.name);
                return (
                  <label
                    key={d.name}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs transition ${
                      checked
                        ? "border-cyan-300 bg-cyan-50 text-cyan-900"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleDepartment(d.name)}
                      className="h-3.5 w-3.5 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                    />
                    {d.name}
                  </label>
                );
              })}
            </div>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Accreditation context
            </span>
            <select
              value={accreditation}
              onChange={(e) => setAccreditation(e.target.value)}
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
            >
              {ACCREDITATIONS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Tier scope
            </span>
            <select
              value={tierScope}
              onChange={(e) => setTierScope(e.target.value)}
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
            >
              {TIER_SCOPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 pt-4">
          <button
            type="button"
            disabled={!canGenerate}
            onClick={onGenerate}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-slate-900 px-4 text-xs font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
          >
            <FaWandMagicSparkles className="h-3 w-3" aria-hidden="true" />
            Generate proposal
          </button>
        </div>
      </div>
    </section>
  );
}

function GeneratingCard() {
  return (
    <section className="relative min-w-0 overflow-hidden rounded-3xl border border-white/80 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)] max-[520px]:rounded-2xl">
      <div className="grid place-items-center gap-3 p-12">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200">
          <FaWandMagicSparkles
            className="h-5 w-5 animate-pulse"
            aria-hidden="true"
          />
        </span>
        <p className="text-sm font-semibold text-slate-900">
          Drafting your risk register…
        </p>
        <p className="text-xs text-slate-500">
          Mapping accreditation requirements, departmental risk patterns and
          standard control attributes.
        </p>
        <div className="mt-2 grid w-full max-w-md gap-1.5">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-full w-2/3 animate-pulse rounded-full bg-cyan-400" />
          </div>
        </div>
      </div>
    </section>
  );
}

function ReviewCard({
  proposals,
  includedIds,
  toggleInclude,
  onBack,
  onAccept,
  acceptCount,
}) {
  if (proposals.length === 0) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
        <p className="font-medium text-slate-700">
          No risks were generated for the chosen scope.
        </p>
        <button
          type="button"
          onClick={onBack}
          className="mt-3 text-xs font-medium text-cyan-700 hover:underline"
        >
          Adjust scope and try again
        </button>
      </section>
    );
  }

  return (
    <section className="relative min-w-0 overflow-hidden rounded-3xl border border-white/80 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)] max-[520px]:rounded-2xl">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">
            Review proposed risks
          </h2>
          <p className="text-[11px] text-slate-500">
            {proposals.length} proposed · {acceptCount} selected for inclusion.
            Untick any you don't want to add.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
          >
            <FaXmark className="h-3 w-3" aria-hidden="true" />
            Discard & reconfigure
          </button>
          <button
            type="button"
            onClick={onAccept}
            disabled={acceptCount === 0}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-slate-900 px-3 text-xs font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
          >
            <FaCircleCheck className="h-3 w-3" aria-hidden="true" />
            Add {acceptCount} risk{acceptCount === 1 ? "" : "s"} to register
          </button>
        </div>
      </header>
      <div className="min-w-0 overflow-x-auto">
        <table className="w-full min-w-[960px] border-collapse text-left text-xs">
          <thead className="bg-slate-50/70 text-[10px] font-medium uppercase tracking-wide text-slate-500">
            <tr>
              <th className="w-10 px-4 py-2.5"></th>
              <th className="px-4 py-2.5">Risk #</th>
              <th className="px-4 py-2.5">Tier</th>
              <th className="px-4 py-2.5">Department</th>
              <th className="px-4 py-2.5">Title</th>
              <th className="px-4 py-2.5 text-center">L</th>
              <th className="px-4 py-2.5 text-center">I</th>
              <th className="px-4 py-2.5 text-center">Inherent</th>
              <th className="px-4 py-2.5 text-center">Residual</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {proposals.map((r) => {
              const included = includedIds.has(r.id);
              return (
                <tr
                  key={r.id}
                  onClick={() => toggleInclude(r.id)}
                  className={`cursor-pointer transition ${
                    included
                      ? "hover:bg-slate-50/60"
                      : "opacity-50 hover:opacity-75"
                  }`}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={included}
                      onChange={() => toggleInclude(r.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="h-3.5 w-3.5 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-700">
                      {r.riskNumber}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 ring-1 ring-indigo-200">
                      {r.tier}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{r.department}</td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-slate-900">
                      {r.title}
                    </p>
                    <p className="mt-0.5 line-clamp-2 max-w-[520px] text-[11px] text-slate-500">
                      {r.description}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-center">{r.likelihood}</td>
                  <td className="px-4 py-3 text-center">{r.impact}</td>
                  <td className="px-4 py-3 text-center font-semibold text-slate-800">
                    {r.inherentRating}
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-slate-900">
                    {r.residualRating}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default GenerateWizard;
