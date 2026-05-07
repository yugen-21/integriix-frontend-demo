const fixedDetailById = {
  "pol-001": {
    summary:
      "Establishes prevention, screening, treatment, and return-to-duty procedures for staff dealing with alcohol or drug abuse, with confidentiality and EAP referral pathways.",
    appliesTo: ["All staff", "Contractors", "Volunteers"],
    keyClauses: [
      "Mandatory pre-employment and random testing for safety-sensitive roles.",
      "Confidential self-referral pathway via Employee Assistance Programme.",
      "Disciplinary framework aligned with UAE labour law and DoH guidance.",
    ],
  },
  "pol-006": {
    summary:
      "Defines triage, stabilisation, escalation, and handover standards for emergency department patients across acuity levels.",
    appliesTo: ["Emergency Department", "Trauma Bay", "Paediatric Emergency"],
    keyClauses: [
      "Triage within 10 minutes of arrival using ESI 5-level scale.",
      "Door-to-physician under 30 minutes for ESI 1-3.",
      "Standardised handover using SBAR for all admissions and transfers.",
    ],
  },
  "pol-011": {
    summary:
      "Governs the prescribing, dispensing, administration, and reconciliation of medications across the hospital, including high-alert drug controls.",
    appliesTo: ["All clinical staff", "Pharmacy", "Nursing"],
    keyClauses: [
      "Two-person verification for all high-alert medications.",
      "Medication reconciliation at admission, transfer, and discharge.",
      "Look-alike/sound-alike storage separation across all units.",
    ],
  },
};

const acknowledgementBaseDepartments = [
  "Nursing",
  "Medical Affairs",
  "Pharmacy",
  "Allied Health",
  "Administration",
  "Operations",
];

const activityActorPool = [
  "Sarah Khoury",
  "Aisha Al Mansouri",
  "Daniel Park",
  "Priya Iyer",
  "Marcus Holloway",
  "Fatima Hassan",
];

function deterministicNumber(seedString, max) {
  let hash = 0;
  for (let i = 0; i < seedString.length; i += 1) {
    hash = (hash * 31 + seedString.charCodeAt(i)) >>> 0;
  }
  return hash % max;
}

function shiftDate(isoDate, days) {
  const d = new Date(isoDate);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function getPolicyDetail(id) {
  return buildPolicyDetail(mockPolicies.find((p) => p.id === id));
}

export function buildPolicyDetail(policy) {
  if (!policy) return null;

  const id = policy.id;
  const fixed = fixedDetailById[id] ?? {
    summary: `${policy.title} sets the standard for ${policy.department.toLowerCase()} operations and aligns the organisation with ${policy.accreditationTags.join(", ") || "internal governance"} expectations.`,
    appliesTo: [policy.department, "Departmental leads", "All affected staff"],
    keyClauses: [
      `Defines roles and responsibilities for ${policy.department}.`,
      `Outlines the workflow, escalation triggers, and exception handling.`,
      `Mandates documentation and review cadence in line with policy ${policy.code}.`,
    ],
  };

  const uploadedExtras = Array.isArray(policy.uploadedVersions)
    ? policy.uploadedVersions
    : [];
  const uploadedLabels = new Set(uploadedExtras.map((v) => v.version));

  const baseVersionNumber =
    parseFloat(policy.version.replace("v", "")) || 1;
  const baseVersionLabel = `v${baseVersionNumber.toFixed(1)}`;
  const generatedAnchor = uploadedExtras.length
    ? Math.max(
        1,
        Math.floor(
          parseFloat(
            (uploadedExtras[uploadedExtras.length - 1].version ?? baseVersionLabel)
              .replace(/^v/i, ""),
          ),
        ),
      )
    : Math.floor(baseVersionNumber);
  const versionsCount = Math.min(4, Math.max(2, generatedAnchor));
  const generatedVersions = Array.from({ length: versionsCount }, (_, idx) => {
    let versionLabel = `v${(generatedAnchor - idx).toFixed(1)}`;
    let bump = 1;
    while (uploadedLabels.has(versionLabel)) {
      versionLabel = `v${(generatedAnchor - idx - bump * 0.1).toFixed(1)}`;
      bump += 1;
      if (bump > 50) break;
    }
    const uploadedDate = shiftDate(policy.lastUpdated, -(idx + 1) * 220);
    const actor =
      activityActorPool[
        deterministicNumber(`${id}-version-${idx}`, activityActorPool.length)
      ];
    return {
      id: `${id}-${versionLabel}`,
      version: versionLabel,
      uploadedAt: uploadedDate,
      uploadedBy: actor,
      changeNote:
        idx === 0
          ? "Annual review with minor formatting and reference updates."
          : idx === 1
            ? "Added accreditation crosswalk and clarified escalation timing."
            : idx === 2
              ? "Aligned roles with new HR structure; expanded definitions."
              : "Initial controlled release approved by governance committee.",
      isCurrent: false,
    };
  });

  const merged = [
    ...uploadedExtras.map((v) => ({ ...v, isCurrent: false })),
    ...generatedVersions,
  ];
  const versions = merged.map((v, idx) => ({ ...v, isCurrent: idx === 0 }));

  const ackPercent = 55 + deterministicNumber(`${id}-ack`, 41);
  const acknowledgements = {
    overallPercent: ackPercent,
    targetPercent: 95,
    deadline: shiftDate(policy.nextReview, -30),
    totalRequired: 480 + deterministicNumber(`${id}-total`, 320),
    byDepartment: acknowledgementBaseDepartments.map((department, idx) => {
      const base = ackPercent + (idx % 2 === 0 ? -1 : 1) * (idx * 4);
      const percent = Math.max(35, Math.min(100, base + deterministicNumber(`${id}-${department}`, 8)));
      const required = 40 + deterministicNumber(`${id}-${department}-r`, 90);
      return {
        department,
        percent,
        completed: Math.round((required * percent) / 100),
        required,
      };
    }),
  };

  const jciTagPool = [
    {
      code: "MMU.4",
      label: "Medication Use — prescribing & ordering",
      confidence: 0.92,
      rationale:
        "Policy explicitly references prescriber accountability and order set governance.",
    },
    {
      code: "IPSG.3",
      label: "International Patient Safety Goal — high-alert medications",
      confidence: 0.88,
      rationale:
        "Two-person verification and storage segregation requirements are present.",
    },
    {
      code: "GLD.6",
      label: "Governance, Leadership & Direction",
      confidence: 0.81,
      rationale:
        "Policy approval, ownership, and review cadence map directly to GLD requirements.",
    },
    {
      code: "QPS.5",
      label: "Quality & Patient Safety improvement",
      confidence: 0.76,
      rationale:
        "Linked to incident review and CAPA closure obligations referenced in body.",
    },
    {
      code: "SQE.8",
      label: "Staff Qualifications & Education",
      confidence: 0.71,
      rationale:
        "Acknowledgement and ongoing education requirements for affected staff.",
    },
    {
      code: "PCC.2",
      label: "Patient-Centred Care",
      confidence: 0.64,
      rationale:
        "References patient communication and dignity expectations.",
    },
  ];

  const tagSeedCount = 3 + deterministicNumber(`${id}-tags`, 3);
  const jciTags = jciTagPool.slice(0, tagSeedCount).map((tag, idx) => ({
    ...tag,
    accepted: idx < 2,
  }));

  const activityTemplates = [
    (actor) => `${actor} uploaded a new version`,
    (actor) => `${actor} acknowledged the policy`,
    (actor) => `${actor} requested a review extension`,
    (actor) => `${actor} approved a status transition`,
    (actor) => `${actor} added an accreditation tag`,
    (actor) => `${actor} commented on the draft`,
    (actor) => `${actor} attached evidence for survey readiness`,
  ];

  const activity = Array.from({ length: 6 }, (_, idx) => {
    const actor =
      activityActorPool[
        deterministicNumber(`${id}-act-${idx}`, activityActorPool.length)
      ];
    const template =
      activityTemplates[
        deterministicNumber(`${id}-tpl-${idx}`, activityTemplates.length)
      ];
    return {
      id: `${id}-activity-${idx}`,
      at: shiftDate(policy.lastUpdated, -idx * 9 - deterministicNumber(`${id}-day-${idx}`, 7)),
      actor,
      action: template(actor),
    };
  });

  return {
    ...policy,
    detail: {
      ...fixed,
      versions,
      acknowledgements,
      jciTags,
      activity,
      aiInsights: buildAiInsights(policy, fixed),
    },
  };
}

const accreditationBodies = ["JCI", "CBAHI", "DoH", "JAWDA"];

// Maps each accreditation element code to the closest XYZ Hospital starter
// template that addresses it. Used to surface a "Download template" / "AI-fill"
// recommendation under every failed gap row in the audit checklist.
const templateRecommendationByCode = {
  "MMU.4": {
    code: "MMU-014",
    title: "Prescription Medication Order Writing Policy",
    filename: "MMU-014_Prescription_Medication_Order_Writing_Policy.docx",
  },
  "MMU.5": {
    code: "MMU-018",
    title: "Dispensing of Medications Policy",
    filename: "MMU-018_Dispensing_of_Medications_Policy.docx",
  },
  "MMU.6": {
    code: "MMU-022",
    title: "Medication Administration Five/Eight Rights Policy",
    filename: "MMU-022_Medication_Administration_Five_Eight_Rights_Policy.docx",
  },
  "IPSG.3": {
    code: "MMU-009",
    title: "High-Alert High-Risk Medication Policy",
    filename: "MMU-009_High-Alert_High-Risk_Medication_Policy.docx",
  },
  "GLD.6": {
    code: "GLO-005",
    title: "Organizational Structure and Reporting Hierarchy Policy",
    filename: "GLO-005_Organizational_Structure_and_Reporting_Hierarchy_Policy.docx",
  },
  "QPS.5": {
    code: "QPS-002",
    title: "Continuous Quality Improvement (CQI/PDCA) Policy",
    filename: "QPS-002_Continuous_Quality_Improvement_CQI_PDCA_Policy.docx",
  },
  "SQE.8": {
    code: "ETR-001",
    title: "Hospital Education and Training Policy",
    filename: "ETR-001_Hospital_Education_and_Training_Policy.docx",
  },
  "PCC.2": {
    code: "PRE-001",
    title: "Patient Rights and Responsibilities Charter Policy",
    filename: "PRE-001_Patient_Rights_and_Responsibilities_Charter_Policy.docx",
  },
  "LD.10": {
    code: "GLO-005",
    title: "Organizational Structure and Reporting Hierarchy Policy",
    filename: "GLO-005_Organizational_Structure_and_Reporting_Hierarchy_Policy.docx",
  },
  "MM.05": {
    code: "MMU-009",
    title: "High-Alert High-Risk Medication Policy",
    filename: "MMU-009_High-Alert_High-Risk_Medication_Policy.docx",
  },
  "PR.04": {
    code: "PRE-003",
    title: "Informed Consent Policy (General)",
    filename: "PRE-003_Informed_Consent_Policy_General.docx",
  },
  "DoH-PS-04": {
    code: "MMU-025",
    title: "Medication Error Identification and Reporting Policy",
    filename: "MMU-025_Medication_Error_Identification_and_Reporting_Policy.docx",
  },
  "DoH-PRG-12": {
    code: "GLO-005",
    title: "Organizational Structure and Reporting Hierarchy Policy",
    filename: "GLO-005_Organizational_Structure_and_Reporting_Hierarchy_Policy.docx",
  },
  "DoH-WF-07": {
    code: "CRP-001",
    title: "Medical Staff Credentialing and Privileging Policy",
    filename: "CRP-001_Medical_Staff_Credentialing_and_Privileging_Policy.docx",
  },
  "JAWDA-Q1": {
    code: "QPS-003",
    title: "Quality Indicator and KPI Monitoring Policy",
    filename: "QPS-003_Quality_Indicator_and_KPI_Monitoring_Policy.docx",
  },
  "JAWDA-PE-2": {
    code: "QPS-008",
    title: "Patient Satisfaction Survey Policy",
    filename: "QPS-008_Patient_Satisfaction_Survey_Policy.docx",
  },
};

const gapElementLibrary = {
  JCI: [
    {
      code: "MMU.4",
      label: "Medication Use — prescribing & ordering",
      text: "The hospital uses safe processes for prescribing, ordering, and transcribing medications, with qualifications of those who may prescribe defined in policy.",
    },
    {
      code: "MMU.5",
      label: "Medication Use — preparation & dispensing",
      text: "Medications are prepared and dispensed in a safe and clean environment by trained personnel using verified controls.",
    },
    {
      code: "MMU.6",
      label: "Medication Use — administration",
      text: "Medications are administered safely by qualified individuals, with patient identity verification and second-person checks for high-alert drugs.",
    },
    {
      code: "IPSG.3",
      label: "Patient Safety Goal — high-alert medications",
      text: "The organisation develops an approach to improve the safety of high-alert medications, including storage, labelling, and administration controls.",
    },
    {
      code: "GLD.6",
      label: "Governance, Leadership & Direction",
      text: "Leaders ensure compliance with laws and regulations, and approve, communicate, and review the organisation's policies.",
    },
    {
      code: "QPS.5",
      label: "Quality & Patient Safety improvement",
      text: "Validated data is used for prioritising improvement activities and is communicated to staff to support patient safety.",
    },
    {
      code: "SQE.8",
      label: "Staff Qualifications & Education",
      text: "Continuing education and training are provided to maintain or advance staff skills and knowledge.",
    },
    {
      code: "PCC.2",
      label: "Patient-Centred Care",
      text: "Care is delivered in a manner respectful of patient values, preferences, and the dignity of every individual.",
    },
  ],
  CBAHI: [
    {
      code: "LD.10",
      label: "Leadership — policy approval & dissemination",
      text: "Leaders ensure approved policies are communicated to all affected staff with documented evidence of acknowledgement.",
    },
    {
      code: "MM.05",
      label: "Medication Management — high-alert drugs",
      text: "Hospital establishes a list of high-alert medications and controls including limited access and double-checks.",
    },
    {
      code: "PR.04",
      label: "Patient Rights — informed decision-making",
      text: "Patients receive information necessary to make informed decisions about their care.",
    },
  ],
  DoH: [
    {
      code: "DoH-PS-04",
      label: "Patient Safety — incident reporting",
      text: "Healthcare providers must report serious adverse events through the DoH Adverse Event Notification System within defined timeframes.",
    },
    {
      code: "DoH-PRG-12",
      label: "Programme Governance",
      text: "Each clinical programme requires documented governance, ownership, and annual review by the responsible committee.",
    },
    {
      code: "DoH-WF-07",
      label: "Workforce Credentialing",
      text: "All licensed practitioners must hold valid DoH licences and undergo periodic credentialing review.",
    },
  ],
  JAWDA: [
    {
      code: "JAWDA-Q1",
      label: "Quality KPI Reporting",
      text: "Facilities submit quarterly quality KPIs covering safety, mortality, and patient experience to JAWDA in defined data fields.",
    },
    {
      code: "JAWDA-PE-2",
      label: "Patient Experience standard",
      text: "Patient experience surveys must be conducted using approved instruments with results reported to leadership.",
    },
  ],
};

function buildAiInsights(policy, fixed) {
  const seed = policy.id;
  const summary = {
    sentences: [
      fixed.summary,
      `It applies to ${fixed.appliesTo.slice(0, 2).join(" and ")} and is owned by the ${policy.owner}.`,
      `The policy was last updated on ${policy.lastUpdated} and is due for review on ${policy.nextReview}.`,
    ],
    citations: [
      {
        id: `${seed}-cite-1`,
        label: "Para 1.2",
        title: "Purpose & Scope",
        excerpt: fixed.summary,
      },
      {
        id: `${seed}-cite-2`,
        label: "Para 3.2",
        title: "Roles & Responsibilities",
        excerpt: `The ${policy.owner} is accountable for implementation, with the ${policy.department} responsible for day-to-day adherence and exception handling.`,
      },
      {
        id: `${seed}-cite-3`,
        label: "Para 5.1",
        title: "Review Cycle",
        excerpt: `This policy is reviewed at least annually and on any change in regulation, with the next scheduled review on ${policy.nextReview}.`,
      },
    ],
  };

  const gapAnalysis = accreditationBodies.reduce((map, body) => {
    const library = gapElementLibrary[body] ?? [];
    const offset = deterministicNumber(`${seed}-${body}`, Math.max(1, library.length));
    const coveredCount = Math.min(library.length, 2 + (offset % 2));
    const covered = library.slice(0, coveredCount).map((element, idx) => ({
      ...element,
      citation: {
        label: `Para ${3 + idx}.${1 + (idx % 3)}`,
        excerpt: `The policy references ${element.label.toLowerCase()} in section ${3 + idx} via the ${policy.department} workflow.`,
      },
    }));
    const gaps = library.slice(coveredCount).slice(0, 2).map((element) => ({
      ...element,
      severity:
        element.code.includes("IPSG") || element.code.startsWith("DoH-PS")
          ? "Critical"
          : "Moderate",
      remediation: `Add a clause covering ${element.label.toLowerCase()} with explicit owner and timing.`,
      recommendedTemplate: templateRecommendationByCode[element.code] ?? null,
    }));
    map[body] = { covered, gaps };
    return map;
  }, {});

  const tagSuggestionPool = [
    {
      code: "MMU.4",
      label: "Medication Use — prescribing & ordering",
      confidence: 0.92,
      rationale: "Strong textual match on prescriber accountability clauses.",
    },
    {
      code: "IPSG.3",
      label: "Patient Safety Goal — high-alert medications",
      confidence: 0.88,
      rationale: "Two-person verification language detected in section 4.",
    },
    {
      code: "GLD.6",
      label: "Governance, Leadership & Direction",
      confidence: 0.83,
      rationale: "Approval and review cadence references map to GLD.6.",
    },
    {
      code: "QPS.5",
      label: "Quality & Patient Safety improvement",
      confidence: 0.74,
      rationale: "Linked to incident review and CAPA closure obligations.",
    },
    {
      code: "SQE.8",
      label: "Staff Qualifications & Education",
      confidence: 0.69,
      rationale: "Acknowledgement and education clauses present.",
    },
    {
      code: "PCC.2",
      label: "Patient-Centred Care",
      confidence: 0.61,
      rationale: "Patient communication language detected — confidence moderate.",
    },
  ];

  const tagOffset = deterministicNumber(`${seed}-tag-suggestions`, 3);
  const suggestions = tagSuggestionPool
    .slice(tagOffset, tagOffset + 5)
    .concat(tagSuggestionPool.slice(0, Math.max(0, tagOffset + 5 - tagSuggestionPool.length)))
    .slice(0, 5)
    .map((tag, idx) => ({
      ...tag,
      id: `${seed}-tag-${idx}`,
      source: "ai",
    }));

  const manualTag = {
    id: `${seed}-tag-manual`,
    code: "MOI.4",
    label: "Management of Information — record retention",
    rationale: "Manually added by Privacy Officer during last review.",
    confidence: null,
    source: "manual",
  };

  return {
    summary,
    gapAnalysis,
    tagSuggestions: suggestions,
    confirmedTags: [manualTag],
  };
}

export const policyCategories = [
  "HR",
  "Clinical",
  "Operational",
  "Safety",
  "Nursing",
  "Pharmacy",
];

export const policyStatuses = [
  "Draft",
  "In Review",
  "Approved",
  "Active",
  "Archived",
];

export const mockPolicies = [
  {
    id: "pol-001",
    code: "HR 3001",
    title: "Alcohol & Drug Abuse",
    category: "HR",
    status: "Active",
    owner: "Director of Human Resources",
    department: "Human Resources",
    version: "v3.2",
    lastUpdated: "2025-08-14",
    nextReview: "2026-04-30",
    accreditationTags: ["JCI", "DoH"],
  },
  {
    id: "pol-002",
    code: "HR 3008",
    title: "Dress Code",
    category: "HR",
    status: "Active",
    owner: "Director of Human Resources",
    department: "Human Resources",
    version: "v2.1",
    lastUpdated: "2025-11-02",
    nextReview: "2026-11-02",
    accreditationTags: ["JCI"],
  },
  {
    id: "pol-003",
    code: "HR 3011",
    title: "Verification of Credentials",
    category: "HR",
    status: "In Review",
    owner: "Credentialing Committee",
    department: "Medical Affairs",
    version: "v4.0",
    lastUpdated: "2026-03-21",
    nextReview: "2026-05-10",
    accreditationTags: ["JCI", "CBAHI"],
  },
  {
    id: "pol-004",
    code: "HR 3016",
    title: "Grievance Policy",
    category: "HR",
    status: "Approved",
    owner: "Director of Human Resources",
    department: "Human Resources",
    version: "v2.4",
    lastUpdated: "2026-02-11",
    nextReview: "2027-02-11",
    accreditationTags: ["JCI"],
  },
  {
    id: "pol-005",
    code: "HR 3022",
    title: "Staff Stress Management",
    category: "HR",
    status: "Active",
    owner: "Occupational Health Lead",
    department: "Occupational Health",
    version: "v1.3",
    lastUpdated: "2025-06-30",
    nextReview: "2026-04-15",
    accreditationTags: ["JCI"],
  },
  {
    id: "pol-006",
    code: "CL 6003",
    title: "Care of Emergency Patients",
    category: "Clinical",
    status: "Active",
    owner: "Chief Medical Officer",
    department: "Emergency Department",
    version: "v5.1",
    lastUpdated: "2025-12-09",
    nextReview: "2026-06-09",
    accreditationTags: ["JCI", "CBAHI", "DoH"],
  },
  {
    id: "pol-007",
    code: "CL 6009",
    title: "Do Not Attempt Resuscitation (DNAR)",
    category: "Clinical",
    status: "Active",
    owner: "Chief Medical Officer",
    department: "Critical Care",
    version: "v3.0",
    lastUpdated: "2025-09-04",
    nextReview: "2026-03-04",
    accreditationTags: ["JCI"],
  },
  {
    id: "pol-008",
    code: "CL 6010",
    title: "Blood Administration",
    category: "Clinical",
    status: "Active",
    owner: "Transfusion Committee",
    department: "Laboratory",
    version: "v4.2",
    lastUpdated: "2025-10-18",
    nextReview: "2026-10-18",
    accreditationTags: ["JCI", "CBAHI"],
  },
  {
    id: "pol-009",
    code: "CL 6011",
    title: "Care of Ventilated Patients",
    category: "Clinical",
    status: "In Review",
    owner: "ICU Medical Director",
    department: "Intensive Care",
    version: "v3.5",
    lastUpdated: "2026-04-02",
    nextReview: "2026-05-15",
    accreditationTags: ["JCI"],
  },
  {
    id: "pol-010",
    code: "CL 6013",
    title: "Care of Communicable Disease",
    category: "Clinical",
    status: "Approved",
    owner: "Infection Control Lead",
    department: "Infection Prevention",
    version: "v2.7",
    lastUpdated: "2026-01-29",
    nextReview: "2027-01-29",
    accreditationTags: ["JCI", "DoH"],
  },
  {
    id: "pol-011",
    code: "AS 9002",
    title: "Medication Management",
    category: "Pharmacy",
    status: "Active",
    owner: "Director of Pharmacy",
    department: "Pharmacy",
    version: "v6.0",
    lastUpdated: "2025-07-22",
    nextReview: "2026-04-22",
    accreditationTags: ["JCI", "CBAHI", "DoH"],
  },
  {
    id: "pol-012",
    code: "AS 9004",
    title: "Use of Narcotics",
    category: "Pharmacy",
    status: "Active",
    owner: "Director of Pharmacy",
    department: "Pharmacy",
    version: "v4.3",
    lastUpdated: "2025-08-30",
    nextReview: "2026-02-28",
    accreditationTags: ["JCI", "DoH"],
  },
  {
    id: "pol-013",
    code: "OP 4011",
    title: "Conflict of Interest",
    category: "Operational",
    status: "Active",
    owner: "Chief Compliance Officer",
    department: "Compliance",
    version: "v2.0",
    lastUpdated: "2025-05-12",
    nextReview: "2026-05-12",
    accreditationTags: ["JCI"],
  },
  {
    id: "pol-014",
    code: "OP 4036",
    title: "Code of Conduct",
    category: "Operational",
    status: "Active",
    owner: "Chief Compliance Officer",
    department: "Compliance",
    version: "v3.1",
    lastUpdated: "2025-11-18",
    nextReview: "2026-11-18",
    accreditationTags: ["JCI", "DoH"],
  },
  {
    id: "pol-015",
    code: "OP 4042",
    title: "Privacy, Confidentiality & Access",
    category: "Operational",
    status: "In Review",
    owner: "Privacy Officer",
    department: "Information Governance",
    version: "v4.0",
    lastUpdated: "2026-04-08",
    nextReview: "2026-05-20",
    accreditationTags: ["JCI", "CBAHI"],
  },
  {
    id: "pol-016",
    code: "SA 1004",
    title: "Security in Emergency Department",
    category: "Safety",
    status: "Active",
    owner: "Head of Security",
    department: "Security",
    version: "v2.6",
    lastUpdated: "2025-10-04",
    nextReview: "2026-04-04",
    accreditationTags: ["JCI"],
  },
  {
    id: "pol-017",
    code: "SA 1006",
    title: "Bomb Threat Response",
    category: "Safety",
    status: "Approved",
    owner: "Head of Security",
    department: "Emergency Management",
    version: "v3.0",
    lastUpdated: "2026-03-15",
    nextReview: "2027-03-15",
    accreditationTags: ["JCI", "DoH"],
  },
  {
    id: "pol-018",
    code: "SA 1009",
    title: "Manual Handling",
    category: "Safety",
    status: "Draft",
    owner: "Occupational Health Lead",
    department: "Occupational Health",
    version: "v1.0",
    lastUpdated: "2026-04-29",
    nextReview: "2026-07-29",
    accreditationTags: [],
  },
  {
    id: "pol-019",
    code: "NAP 07",
    title: "Nursing & Midwifery Practice",
    category: "Nursing",
    status: "Active",
    owner: "Chief Nursing Officer",
    department: "Nursing",
    version: "v2.2",
    lastUpdated: "2025-12-22",
    nextReview: "2026-06-22",
    accreditationTags: ["JCI", "CBAHI"],
  },
  {
    id: "pol-020",
    code: "NAP 13",
    title: "Pregnant Nurses Assignment",
    category: "Nursing",
    status: "Archived",
    owner: "Chief Nursing Officer",
    department: "Nursing",
    version: "v1.5",
    lastUpdated: "2024-11-04",
    nextReview: "2025-11-04",
    accreditationTags: [],
  },
  {
    id: "pol-021",
    code: "CP 100",
    title: "Candida Auris Surveillance",
    category: "Nursing",
    status: "Active",
    owner: "Infection Control Lead",
    department: "Infection Prevention",
    version: "v1.2",
    lastUpdated: "2026-01-17",
    nextReview: "2026-07-17",
    accreditationTags: ["JCI", "DoH"],
  },
  {
    id: "pol-022",
    code: "CP 102",
    title: "Anemia Protocol",
    category: "Clinical",
    status: "Active",
    owner: "Department of Hematology",
    department: "Hematology",
    version: "v2.4",
    lastUpdated: "2025-09-19",
    nextReview: "2026-09-19",
    accreditationTags: ["JCI"],
  },
];

export const policyOwners = [
  { id: "u-001", name: "Director of Human Resources", role: "HR Leadership" },
  { id: "u-002", name: "Chief Medical Officer", role: "Medical Affairs" },
  { id: "u-003", name: "Chief Nursing Officer", role: "Nursing" },
  { id: "u-004", name: "Director of Pharmacy", role: "Pharmacy" },
  { id: "u-005", name: "Chief Compliance Officer", role: "Compliance" },
  { id: "u-006", name: "Privacy Officer", role: "Information Governance" },
  { id: "u-007", name: "Head of Security", role: "Security" },
  { id: "u-008", name: "Occupational Health Lead", role: "Occupational Health" },
  { id: "u-009", name: "Infection Control Lead", role: "Infection Prevention" },
  { id: "u-010", name: "ICU Medical Director", role: "Intensive Care" },
  { id: "u-011", name: "Credentialing Committee", role: "Medical Affairs" },
  { id: "u-012", name: "Transfusion Committee", role: "Laboratory" },
  { id: "u-013", name: "Department of Hematology", role: "Hematology" },
];

export const audienceRules = [
  {
    id: "all-staff",
    label: "All staff",
    description: "Every employee, contractor, and volunteer.",
  },
  {
    id: "clinical-departments",
    label: "Clinical departments",
    description: "All clinical-facing teams across the hospital.",
  },
  {
    id: "nursing",
    label: "Nursing — all units",
    description: "Every nursing team, including bedside and float pools.",
  },
  {
    id: "icu-nurses",
    label: "ICU nurses only",
    description: "Critical care and step-down nursing staff.",
  },
  {
    id: "ed-clinicians",
    label: "Emergency Department clinicians",
    description: "ED physicians, nurses, and triage staff.",
  },
  {
    id: "pharmacy",
    label: "Pharmacy team",
    description: "Inpatient and outpatient pharmacy personnel.",
  },
  {
    id: "physicians",
    label: "All physicians",
    description: "Attending, fellow, resident, and visiting physicians.",
  },
  {
    id: "leadership",
    label: "Department leadership",
    description: "Heads of department and senior leaders only.",
  },
];
