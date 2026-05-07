// Curated semantic-search mock for the Integriix demo.
//
// `paragraphLibrary` holds short text chunks per policy that the engine scores
// against. `curatedQueries` is a small set of demo prompts that surface
// specific results — these are the "wow" examples the engine cannot reach
// from raw token overlap (e.g. "patient consent" surfacing DNAR even when the
// word "consent" does not appear verbatim).

export const paragraphLibrary = {
  "pol-001": [
    {
      id: "pol-001-p1",
      heading: "Section 2 · Scope",
      text: "Applies to every employee, contractor, and volunteer working under hospital authority, including return-to-duty and pre-employment scenarios for safety-sensitive roles.",
      concepts: ["substance abuse", "fitness for duty", "occupational health"],
    },
    {
      id: "pol-001-p2",
      heading: "Section 4.3 · Confidential self-referral",
      text: "Staff members may self-refer to the Employee Assistance Programme without disciplinary consequence; records are protected and may not be disclosed without written authorisation.",
      concepts: ["confidentiality", "EAP", "self-referral"],
    },
  ],
  "pol-003": [
    {
      id: "pol-003-p1",
      heading: "Section 1 · Purpose",
      text: "Defines the primary source verification standards for licensure, training, and competency for every clinician granted privileges to practice.",
      concepts: ["credentialing", "primary source verification", "licensure"],
    },
    {
      id: "pol-003-p2",
      heading: "Section 6 · Re-credentialing cycle",
      text: "All credentialed practitioners are re-evaluated every 24 months including peer references, current registration, and ongoing competency evidence.",
      concepts: ["recredentialing", "competency", "peer review"],
    },
  ],
  "pol-006": [
    {
      id: "pol-006-p1",
      heading: "Section 3 · Triage standards",
      text: "Every arriving patient is triaged within ten minutes using a five-level acuity scale; reassessment intervals scale with acuity.",
      concepts: ["triage", "ESI", "acuity assessment"],
    },
    {
      id: "pol-006-p2",
      heading: "Section 5 · Informed agreement before urgent care",
      text: "Wherever capacity permits, the treating clinician must explain proposed interventions to the patient or their legally authorised representative before non-emergent procedures, and document agreement in the chart.",
      concepts: [
        "informed consent",
        "patient autonomy",
        "shared decision making",
      ],
    },
    {
      id: "pol-006-p3",
      heading: "Section 8 · Handover",
      text: "All admissions and inter-unit transfers must use the SBAR format with closed-loop confirmation between sender and receiver.",
      concepts: ["handover", "SBAR", "transfer of care"],
    },
  ],
  "pol-007": [
    {
      id: "pol-007-p1",
      heading: "Section 2 · Patient and family discussion",
      text: "Decisions to limit resuscitation must follow a documented conversation with the patient (where capacity allows) or surrogate, covering goals of care, prognosis, and the option to revoke at any time.",
      concepts: [
        "patient consent",
        "advance directive",
        "shared decision making",
      ],
    },
    {
      id: "pol-007-p2",
      heading: "Section 4 · DNAR order activation",
      text: "Orders take effect only after countersignature by an attending physician and acknowledgement by the on-shift charge nurse; a coloured wristband is applied for visibility across the care team.",
      concepts: ["DNAR", "advance care", "code status"],
    },
  ],
  "pol-008": [
    {
      id: "pol-008-p1",
      heading: "Section 3 · Pre-transfusion checks",
      text: "Two qualified clinicians must independently verify patient identity, blood product label, and prescription before administration begins; both clinicians sign the bedside checklist.",
      concepts: [
        "two-person check",
        "high-alert medication",
        "patient safety",
      ],
    },
    {
      id: "pol-008-p2",
      heading: "Section 5 · Reactions and reporting",
      text: "Any acute transfusion reaction triggers immediate cessation, IV access maintenance, and notification to the transfusion committee within four hours.",
      concepts: ["adverse event", "transfusion reaction", "incident reporting"],
    },
  ],
  "pol-009": [
    {
      id: "pol-009-p1",
      heading: "Section 2 · Ventilator-associated event prevention",
      text: "Daily sedation interruption, head-of-bed elevation 30–45°, oral care with chlorhexidine, and weaning trials are mandated for every ventilated patient.",
      concepts: [
        "VAE",
        "ventilator bundle",
        "ICU bundle",
        "infection prevention",
      ],
    },
    {
      id: "pol-009-p2",
      heading: "Section 4 · Family-led decisions",
      text: "When a patient cannot communicate, the next of kin or proxy is engaged in goals-of-care discussions before initiating, escalating, or withdrawing ventilatory support.",
      concepts: ["surrogate decision", "patient consent", "end of life"],
    },
  ],
  "pol-010": [
    {
      id: "pol-010-p1",
      heading: "Section 3 · Isolation precautions",
      text: "Standard, contact, droplet, and airborne precautions are applied based on the suspected pathogen, with PPE pre-staged at the door of every isolation room.",
      concepts: [
        "isolation",
        "infection control",
        "PPE",
        "transmission precaution",
      ],
    },
    {
      id: "pol-010-p2",
      heading: "Section 5 · Notifiable disease reporting",
      text: "Any laboratory-confirmed notifiable disease is reported to the public health authority within twenty-four hours of identification.",
      concepts: ["public health", "notifiable disease", "reporting"],
    },
  ],
  "pol-011": [
    {
      id: "pol-011-p1",
      heading: "Section 4 · High-alert medications",
      text: "High-alert medications require independent two-person verification, segregated storage, and standardised concentrations to reduce administration error.",
      concepts: [
        "high-alert medication",
        "two-person check",
        "medication safety",
      ],
    },
    {
      id: "pol-011-p2",
      heading: "Section 7 · Reconciliation",
      text: "Medication reconciliation is completed at admission, every transfer of care, and discharge, and signed by the responsible clinician.",
      concepts: ["medication reconciliation", "transitions of care"],
    },
  ],
  "pol-012": [
    {
      id: "pol-012-p1",
      heading: "Section 2 · Controlled substance custody",
      text: "Narcotics are stored in dual-lock cabinets with paired witness sign-out; counts are reconciled at every shift handover.",
      concepts: [
        "narcotics",
        "controlled substance",
        "diversion prevention",
      ],
    },
    {
      id: "pol-012-p2",
      heading: "Section 5 · Discrepancy investigation",
      text: "Any unexplained discrepancy triggers a formal diversion investigation led by pharmacy leadership and the chief nursing officer within twenty-four hours.",
      concepts: ["diversion", "investigation", "controlled substance"],
    },
  ],
};

// Curated demo queries — each surfaces a specific ranked list, with the
// matched paragraph and an optional "why this matched" rationale shown to the
// user. These power the wow-moment of the demo where the search finds the
// right policy without lexical overlap.
export const curatedQueries = [
  {
    label: "patient consent",
    aliases: ["informed consent", "consent before procedure"],
    rationale:
      "Found via concept matches on patient autonomy, shared decision-making, and surrogate decision tags.",
    results: [
      {
        policyId: "pol-007",
        paragraphId: "pol-007-p1",
        score: 0.94,
        why: "Matches on “shared decision making” and “advance directive” concepts.",
      },
      {
        policyId: "pol-006",
        paragraphId: "pol-006-p2",
        score: 0.88,
        why: "“Informed agreement” paragraph maps to the consent concept.",
      },
      {
        policyId: "pol-009",
        paragraphId: "pol-009-p2",
        score: 0.82,
        why: "Surrogate decision-making tag for ventilated patients.",
      },
    ],
  },
  {
    label: "high alert medication safety",
    aliases: ["high-alert medications", "medication safety controls"],
    rationale: "Matched on two-person verification and segregated storage themes.",
    results: [
      {
        policyId: "pol-011",
        paragraphId: "pol-011-p1",
        score: 0.96,
        why: "Direct concept match: high-alert medication, two-person check.",
      },
      {
        policyId: "pol-008",
        paragraphId: "pol-008-p1",
        score: 0.79,
        why: "Two-clinician verification before transfusion.",
      },
      {
        policyId: "pol-012",
        paragraphId: "pol-012-p1",
        score: 0.74,
        why: "Controlled-substance custody with witness sign-out.",
      },
    ],
  },
  {
    label: "credentialing renewal",
    aliases: ["recredentialing", "verifying clinician licensure"],
    rationale: "Concept matches on primary source verification and competency cycles.",
    results: [
      {
        policyId: "pol-003",
        paragraphId: "pol-003-p2",
        score: 0.93,
        why: "Re-credentialing cycle and competency evidence.",
      },
      {
        policyId: "pol-003",
        paragraphId: "pol-003-p1",
        score: 0.81,
        why: "Primary source verification standards.",
      },
    ],
  },
  {
    label: "infection prevention bundle",
    aliases: ["isolation precautions", "ventilator bundle"],
    rationale: "Surfaces both ICU bundle elements and isolation policy controls.",
    results: [
      {
        policyId: "pol-009",
        paragraphId: "pol-009-p1",
        score: 0.91,
        why: "Ventilator-associated event bundle elements.",
      },
      {
        policyId: "pol-010",
        paragraphId: "pol-010-p1",
        score: 0.86,
        why: "PPE and transmission-based precautions.",
      },
      {
        policyId: "pol-010",
        paragraphId: "pol-010-p2",
        score: 0.71,
        why: "Notifiable disease reporting workflow.",
      },
    ],
  },
  {
    label: "diversion of controlled substances",
    aliases: ["narcotic discrepancy", "drug diversion"],
    rationale: "Hit on controlled-substance custody and discrepancy investigation.",
    results: [
      {
        policyId: "pol-012",
        paragraphId: "pol-012-p2",
        score: 0.95,
        why: "Discrepancy investigation paragraph.",
      },
      {
        policyId: "pol-012",
        paragraphId: "pol-012-p1",
        score: 0.84,
        why: "Dual-lock custody and witness sign-out.",
      },
    ],
  },
  {
    label: "employee substance abuse",
    aliases: ["staff drug use", "fitness for duty"],
    rationale: "Mapped to occupational-health and EAP concepts.",
    results: [
      {
        policyId: "pol-001",
        paragraphId: "pol-001-p2",
        score: 0.92,
        why: "Confidential self-referral via the EAP.",
      },
      {
        policyId: "pol-001",
        paragraphId: "pol-001-p1",
        score: 0.78,
        why: "Scope covers safety-sensitive roles and return-to-duty.",
      },
    ],
  },
];

export const suggestedQueries = curatedQueries.map((q) => q.label);
