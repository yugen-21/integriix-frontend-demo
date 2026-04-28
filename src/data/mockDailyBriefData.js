const statusThresholds = {
  green: 80,
  amber: 60,
};

function getRagStatus(score) {
  if (score >= statusThresholds.green) {
    return "Green";
  }

  if (score >= statusThresholds.amber) {
    return "Amber";
  }

  return "Red";
}

function calculateWeightedScore(dimensions) {
  const weightedTotal = dimensions.reduce(
    (total, dimension) => total + dimension.score * dimension.weight,
    0,
  );
  const weightTotal = dimensions.reduce(
    (total, dimension) => total + dimension.weight,
    0,
  );

  return Math.round(weightedTotal / weightTotal);
}

const enterpriseDimensions = [
  {
    id: "patient-safety",
    label: "Patient Safety",
    weight: 25,
    score: 62,
    trend: "Worsening",
    reason:
      "Medication incident volume rose and ICU infection surveillance crossed internal threshold.",
  },
  {
    id: "compliance-accreditation",
    label: "Compliance / Accreditation",
    weight: 20,
    score: 71,
    trend: "Stable",
    reason:
      "Core standards remain on track, but overdue evidence and CAPAs are constraining readiness.",
  },
  {
    id: "financial-controls",
    label: "Financial Controls",
    weight: 15,
    score: 76,
    trend: "Worsening",
    reason:
      "Cardiology denial rate increased due to authorization and documentation mismatches.",
  },
  {
    id: "workforce-stability",
    label: "Workforce Stability",
    weight: 15,
    score: 68,
    trend: "Stable",
    reason:
      "Critical unit staffing is covered today, but ICU float-pool dependency remains elevated.",
  },
  {
    id: "operational-continuity",
    label: "Operational Continuity",
    weight: 15,
    score: 70,
    trend: "Worsening",
    reason:
      "Discharge delays are increasing bed pressure and downstream emergency department boarding.",
  },
  {
    id: "major-unresolved-risks",
    label: "Major Unresolved Risks",
    weight: 10,
    score: 58,
    trend: "Worsening",
    reason:
      "Board-level medication safety and accreditation evidence actions remain open past internal SLA.",
  },
];

const organizationScore = calculateWeightedScore(enterpriseDimensions);

export const mockDailyBriefData = {
  meta: {
    organizationName: "Riverside Metropolitan Hospital",
    generatedAt: "2026-04-27T07:15:00+05:30",
    audience: "C-suite leadership",
    briefOwner: "Chief Quality Officer",
    period: "Daily executive brief",
  },

  layers: [
    {
      id: "at-a-glance",
      title: "At a glance",
      description: "Overall health, alerts, and top priorities.",
    },
    {
      id: "why-this-matters",
      title: "Why this matters",
      description: "Trends, root causes, and linked modules.",
    },
    {
      id: "what-to-do-next",
      title: "What to do next",
      description: "Owners, actions, deadlines, and escalation.",
    },
  ],

  organizationStatus: {
    score: organizationScore,
    ragStatus: getRagStatus(organizationScore),
    executiveSummary:
      "The organization is in amber status today. Safety, accreditation evidence, and operational flow need leadership attention, while training completion and CAPA closure are improving the overall position.",
    dimensions: enterpriseDimensions.map((dimension) => ({
      ...dimension,
      ragStatus: getRagStatus(dimension.score),
    })),
    driversPullingDown: [
      {
        title: "Medication safety escalation",
        dimension: "Patient Safety",
        impact: "-7 pts",
        reason:
          "High-severity medication incident has not entered RCA workflow within SLA.",
      },
      {
        title: "Accreditation evidence delay",
        dimension: "Compliance / Accreditation",
        impact: "-5 pts",
        reason:
          "Twelve evidence items are overdue across medication reconciliation and infection control.",
      },
      {
        title: "Discharge throughput pressure",
        dimension: "Operational Continuity",
        impact: "-4 pts",
        reason:
          "Order-to-bed-release time is 3.8 hours above target, increasing ER boarding risk.",
      },
    ],
    driversPushingUp: [
      {
        title: "Training completion improved",
        dimension: "Workforce Stability",
        impact: "+3 pts",
        reason:
          "Mandatory medication safety refresher completion improved by 14 percentage points.",
      },
      {
        title: "CAPA closure velocity increased",
        dimension: "Compliance / Accreditation",
        impact: "+2 pts",
        reason:
          "Quality team closed 18 lower-risk CAPAs over the last seven days.",
      },
    ],
  },

  criticalAlertsToday: [
    {
      id: "critical-alert-001",
      qualifiesAs: "serious patient safety incident",
      title: "High-severity medication incident",
      location: "ICU",
      severity: "Critical",
      owner: "Chief Medical Officer",
      sourceModule: "Incident Reporting",
      summary:
        "RCA not initiated within SLA after anticoagulant administration variance.",
      requiredAction:
        "Open RCA, assign clinical lead, and complete executive review today.",
      due: "Today 11:30",
      escalation: "CEO and Medical Executive Committee if RCA is not opened.",
    },
    {
      id: "critical-alert-002",
      qualifiesAs: "infection outbreak signal",
      title: "CLABSI surveillance threshold crossed",
      location: "ICU",
      severity: "Critical",
      owner: "Infection Control Lead",
      sourceModule: "Infection Control",
      summary:
        "Two central-line cases are linked to maintenance bundle variance.",
      requiredAction:
        "Start containment review, validate line bundle compliance, and brief ICU leadership.",
      due: "Today 10:30",
      escalation: "COO and CMO review if bundle audit is incomplete by noon.",
    },
    {
      id: "critical-alert-003",
      qualifiesAs: "missed regulatory deadline",
      title: "Accreditation evidence overdue",
      location: "Quality & Compliance",
      severity: "High",
      owner: "Chief Quality Officer",
      sourceModule: "Audit Tools",
      summary:
        "Medication reconciliation and infection control evidence remains incomplete.",
      requiredAction:
        "Assign owners, upload missing evidence, and lock status before governance checkpoint.",
      due: "Today 16:00",
      escalation: "Escalate to accreditation steering committee if unresolved.",
    },
    {
      id: "critical-alert-004",
      qualifiesAs: "major internal control breach",
      title: "Cardiology authorization control gap",
      location: "Revenue Cycle",
      severity: "High",
      owner: "Chief Financial Officer",
      sourceModule: "Revenue Cycle",
      summary:
        "Denials increased to 9.1% after authorization and documentation mismatch spike.",
      requiredAction:
        "Sample denied claims, confirm authorization control failure, and brief service leadership.",
      due: "Tomorrow 11:00",
      escalation: "Finance risk committee if denial recovery plan is not assigned.",
    },
    {
      id: "critical-alert-005",
      qualifiesAs: "overdue action on a board-level risk",
      title: "Discharge bottleneck action overdue",
      location: "Bed Management",
      severity: "High",
      owner: "Chief Operating Officer",
      sourceModule: "Bed Management",
      summary:
        "Board-level patient flow action remains open while bed-release delays worsen.",
      requiredAction:
        "Activate discharge command review and confirm pharmacy, transport, and ward owners.",
      due: "Today 14:00",
      escalation: "Executive operations huddle if throughput target is missed.",
    },
  ],

  topRisks: [
    {
      id: "risk-001",
      name: "Medication safety variance in high-acuity units",
      category: "Patient Safety",
      inherentRiskScore: 94,
      scoring: {
        severity: 5,
        likelihood: 4,
        urgency: 5,
        exposure: 5,
        worsening: true,
        mitigationDelayed: true,
      },
      trend: "Worsening",
      mitigationStatus: "Delayed",
      owner: "Chief Medical Officer",
      nextMilestone: "RCA opened and clinical lead assigned by 11:30",
      linkedItems: ["ICU", "Incident Reporting", "Medication Management"],
    },
    {
      id: "risk-002",
      name: "Accreditation evidence gap before survey review",
      category: "Compliance / Accreditation",
      inherentRiskScore: 88,
      scoring: {
        severity: 4,
        likelihood: 4,
        urgency: 5,
        exposure: 5,
        worsening: false,
        mitigationDelayed: true,
      },
      trend: "Stable",
      mitigationStatus: "In Progress",
      owner: "Chief Quality Officer",
      nextMilestone: "All overdue evidence uploaded by 16:00",
      linkedItems: ["Audit Tools", "Infection Control", "Medication Reconciliation"],
    },
    {
      id: "risk-003",
      name: "Discharge throughput pressure affecting access",
      category: "Operational Continuity",
      inherentRiskScore: 84,
      scoring: {
        severity: 4,
        likelihood: 5,
        urgency: 4,
        exposure: 4,
        worsening: true,
        mitigationDelayed: false,
      },
      trend: "Worsening",
      mitigationStatus: "Open",
      owner: "Chief Operating Officer",
      nextMilestone: "Discharge command review completed by 14:00",
      linkedItems: ["Bed Management", "Emergency", "Patient Feedback"],
    },
    {
      id: "risk-004",
      name: "Claims denial leakage from documentation gaps",
      category: "Financial Controls",
      inherentRiskScore: 76,
      scoring: {
        severity: 3,
        likelihood: 4,
        urgency: 3,
        exposure: 5,
        worsening: true,
        mitigationDelayed: false,
      },
      trend: "Worsening",
      mitigationStatus: "Open",
      owner: "Chief Financial Officer",
      nextMilestone: "Denied claim sample reviewed by tomorrow 11:00",
      linkedItems: ["Revenue Cycle", "Cardiology", "Clinical Notes"],
    },
    {
      id: "risk-005",
      name: "Critical unit staffing resilience",
      category: "Workforce Stability",
      inherentRiskScore: 72,
      scoring: {
        severity: 4,
        likelihood: 3,
        urgency: 3,
        exposure: 4,
        worsening: false,
        mitigationDelayed: false,
      },
      trend: "Stable",
      mitigationStatus: "Monitored",
      owner: "Chief Nursing Officer",
      nextMilestone: "ICU float-pool coverage confirmed for evening shift",
      linkedItems: ["ICU", "Workforce Scheduling", "Nursing Office"],
    },
  ],

  opportunitiesAndWins: [
    {
      id: "win-001",
      title: "Medication safety training completion rose sharply",
      whyItMatters:
        "Improved completion reduces recurrence risk in high-acuity medication workflows.",
      measurableImprovement: "+14 pts week over week",
      department: "Nursing / Pharmacy",
      canReplicateElsewhere: true,
      replicationNote: "Extend the same completion tracking to Emergency and Cardiology.",
    },
    {
      id: "win-002",
      title: "CAPA closure rate improved",
      whyItMatters:
        "Faster closure improves accreditation readiness and reduces open governance burden.",
      measurableImprovement: "18 CAPAs closed in seven days",
      department: "Quality & Compliance",
      canReplicateElsewhere: true,
      replicationNote: "Use the same owner-due-time model for audit evidence closure.",
    },
    {
      id: "win-003",
      title: "Patient complaints reduced in outpatient pharmacy",
      whyItMatters:
        "Lower wait-time complaints indicate the queue redesign is working.",
      measurableImprovement: "-22% complaints vs prior week",
      department: "Outpatient Pharmacy",
      canReplicateElsewhere: true,
      replicationNote: "Replicate queue visibility in Radiology registration.",
    },
    {
      id: "win-004",
      title: "Predictive warning caught a discharge delay cluster",
      whyItMatters:
        "Early warning allowed operations to intervene before afternoon bed pressure peaked.",
      measurableImprovement: "2 wards flagged before SLA breach",
      department: "Bed Management",
      canReplicateElsewhere: false,
      replicationNote: "Continue monitoring before expanding the model scope.",
    },
    {
      id: "win-005",
      title: "Financial control exception rate dropped",
      whyItMatters:
        "Fewer control exceptions reduce rework and revenue leakage exposure.",
      measurableImprovement: "-11% exceptions month to date",
      department: "Revenue Cycle",
      canReplicateElsewhere: true,
      replicationNote: "Apply the checklist to high-volume surgical specialties.",
    },
  ],

  accreditationReadiness: {
    overallScore: 76,
    changeVsPreviousMonth: "+3 pts",
    byChapter: [
      { label: "Medication Management", score: 68, blockers: 4 },
      { label: "Infection Prevention", score: 72, blockers: 3 },
      { label: "Governance & Leadership", score: 84, blockers: 1 },
      { label: "Quality Improvement", score: 79, blockers: 2 },
      { label: "Patient Rights", score: 88, blockers: 0 },
    ],
    byDepartment: [
      { label: "ICU", score: 69, readiness: "At Risk" },
      { label: "Medical Wards", score: 73, readiness: "Watch" },
      { label: "Pharmacy", score: 81, readiness: "Ready with minor gaps" },
      { label: "Emergency", score: 75, readiness: "Watch" },
      { label: "Quality Office", score: 86, readiness: "Ready" },
    ],
    blockers: [
      "Twelve evidence items remain overdue.",
      "Medication reconciliation audit trail is incomplete.",
      "Two infection control CAPAs are past due.",
      "Staff awareness validation is pending in ICU and Emergency.",
    ],
    measures: {
      evidenceCompleteness: 74,
      checklistCompletion: 82,
      openFindings: 17,
      overdueCapas: 6,
      policyCurrency: 91,
      mockSurveyScore: 78,
      staffAwareness: 73,
    },
  },

  last30DayTrends: [
    {
      id: "trend-001",
      label: "Safety incidents",
      direction: "Up",
      currentValue: 41,
      previousValue: 32,
      unit: "incidents",
      status: "Worsening",
      points: [29, 31, 28, 34, 36, 38, 41],
    },
    {
      id: "trend-002",
      label: "Complaints",
      direction: "Down",
      currentValue: 24,
      previousValue: 31,
      unit: "complaints",
      status: "Improving",
      points: [34, 32, 30, 29, 27, 25, 24],
    },
    {
      id: "trend-003",
      label: "Compliance score",
      direction: "Up",
      currentValue: 76,
      previousValue: 73,
      unit: "%",
      status: "Improving",
      points: [70, 72, 73, 74, 74, 75, 76],
    },
    {
      id: "trend-004",
      label: "Overdue actions",
      direction: "Up",
      currentValue: 19,
      previousValue: 14,
      unit: "actions",
      status: "Worsening",
      points: [12, 13, 15, 14, 16, 18, 19],
    },
    {
      id: "trend-005",
      label: "Staffing variance",
      direction: "Flat",
      currentValue: 7,
      previousValue: 7,
      unit: "shifts",
      status: "Stable",
      points: [6, 7, 8, 7, 6, 7, 7],
    },
    {
      id: "trend-006",
      label: "Financial exceptions",
      direction: "Down",
      currentValue: 13,
      previousValue: 16,
      unit: "exceptions",
      status: "Improving",
      points: [19, 18, 17, 16, 15, 14, 13],
    },
    {
      id: "trend-007",
      label: "Audit findings",
      direction: "Flat",
      currentValue: 17,
      previousValue: 17,
      unit: "findings",
      status: "Stable",
      points: [18, 18, 17, 17, 18, 17, 17],
    },
    {
      id: "trend-008",
      label: "Patient experience",
      direction: "Up",
      currentValue: 84,
      previousValue: 81,
      unit: "%",
      status: "Improving",
      points: [78, 79, 80, 81, 82, 83, 84],
    },
  ],

  upcomingDeadlines: [
    {
      id: "deadline-001",
      title: "Medication reconciliation evidence submission",
      type: "Accreditation evidence",
      date: "2026-04-27T16:00:00+05:30",
      owner: "Chief Quality Officer",
      readinessStatus: "At Risk",
      blockers: ["Missing audit trail", "Two ward owner attestations pending"],
      consequenceOfDelay:
        "Reduces medication management readiness before survey review.",
      confidenceLevel: "Medium",
    },
    {
      id: "deadline-002",
      title: "ICU infection control review",
      type: "Leadership review milestone",
      date: "2026-04-27T12:00:00+05:30",
      owner: "Infection Control Lead",
      readinessStatus: "Blocked",
      blockers: ["Line bundle audit not complete"],
      consequenceOfDelay:
        "Delays containment decision and executive quality notification.",
      confidenceLevel: "Low",
    },
    {
      id: "deadline-003",
      title: "Board risk action update",
      type: "Committee papers",
      date: "2026-04-28T09:00:00+05:30",
      owner: "Chief Risk Officer",
      readinessStatus: "Watch",
      blockers: ["Medication RCA owner not confirmed"],
      consequenceOfDelay:
        "Board-level risk remains without updated mitigation evidence.",
      confidenceLevel: "Medium",
    },
    {
      id: "deadline-004",
      title: "Cardiology denial control review",
      type: "Financial control review",
      date: "2026-04-28T11:00:00+05:30",
      owner: "Chief Financial Officer",
      readinessStatus: "On Track",
      blockers: ["Denied claim sample extraction pending"],
      consequenceOfDelay:
        "Revenue leakage remediation may miss weekly finance checkpoint.",
      confidenceLevel: "High",
    },
    {
      id: "deadline-005",
      title: "Mandatory safety refresher completion",
      type: "Training deadline",
      date: "2026-04-30T17:00:00+05:30",
      owner: "Chief Nursing Officer",
      readinessStatus: "On Track",
      blockers: ["Evening shift completion remains below target"],
      consequenceOfDelay:
        "Medication safety CAPA closure evidence remains incomplete.",
      confidenceLevel: "High",
    },
  ],
};
