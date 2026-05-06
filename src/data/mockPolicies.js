const fixedDetailById = {
  "pol-001": {
    summary:
      "Establishes prevention, screening, treatment, and return-to-duty procedures for staff dealing with alcohol or drug abuse, with confidentiality and EAP referral pathways.",
    appliesTo: ["All HMC staff", "Contractors", "Volunteers"],
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
  const policy = mockPolicies.find((p) => p.id === id);
  if (!policy) return null;

  const fixed = fixedDetailById[id] ?? {
    summary: `${policy.title} sets the standard for ${policy.department.toLowerCase()} operations and aligns the organisation with ${policy.accreditationTags.join(", ") || "internal governance"} expectations.`,
    appliesTo: [policy.department, "Departmental leads", "All affected staff"],
    keyClauses: [
      `Defines roles and responsibilities for ${policy.department}.`,
      `Outlines the workflow, escalation triggers, and exception handling.`,
      `Mandates documentation and review cadence in line with policy ${policy.code}.`,
    ],
  };

  const versionNumber = parseFloat(policy.version.replace("v", "")) || 1;
  const versionsCount = Math.min(4, Math.max(2, Math.floor(versionNumber)));
  const versions = Array.from({ length: versionsCount }, (_, idx) => {
    const versionLabel = `v${(versionNumber - idx).toFixed(1)}`;
    const uploadedDate = shiftDate(policy.lastUpdated, -idx * 220);
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
      isCurrent: idx === 0,
    };
  });

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
    },
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
