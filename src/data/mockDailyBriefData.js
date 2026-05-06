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
    id: "quality-safety-accreditation",
    label: "Quality, Safety & Accreditation",
    weight: 25,
    score: 64,
    trend: "Worsening",
    reason:
      "Medication incident escalation, CLABSI surveillance breach, and twelve overdue accreditation evidence items are pulling the module down.",
  },
  {
    id: "risk-audit-governance",
    label: "Risk, Audit & Governance",
    weight: 20,
    score: 66,
    trend: "Worsening",
    reason:
      "Two board-level risks have overdue mitigation actions and seventeen audit findings remain open past internal SLA.",
  },
  {
    id: "clinical-intelligence",
    label: "Clinical Intelligence",
    weight: 15,
    score: 71,
    trend: "Stable",
    reason:
      "Sepsis bundle compliance is steady, but ICU protocol adherence and antimicrobial DOT are trending below target.",
  },
  {
    id: "financial-intelligence",
    label: "Financial Intelligence",
    weight: 15,
    score: 70,
    trend: "Worsening",
    reason:
      "Cardiology denial rate rose to 9.1% and one high-value denial is holding $42K of revenue at risk.",
  },
  {
    id: "operational-intelligence",
    label: "Operational Intelligence",
    weight: 15,
    score: 68,
    trend: "Worsening",
    reason:
      "Bed crunch early warnings fired on two wards and discharge-before-noon rate is 14 points below target.",
  },
  {
    id: "patient-experience-access",
    label: "Patient Experience & Access",
    weight: 10,
    score: 78,
    trend: "Improving",
    reason:
      "NPS held steady and outpatient pharmacy complaints fell 22% after the queue redesign.",
  },
];

const organizationScore = calculateWeightedScore(enterpriseDimensions);

export const mockDailyBriefData = {
  meta: {
    organizationName: "Riverside Metropolitan Hospital",
    generatedAt: "2026-05-06T20:37:44+05:30",
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
      "The organization is in amber status today. Quality, Safety & Accreditation, Risk, Audit & Governance, Operational Intelligence, and Financial Intelligence all need leadership attention, while Patient Experience & Access continues to improve on the back of the outpatient pharmacy queue redesign.",
    dimensions: enterpriseDimensions.map((dimension) => ({
      ...dimension,
      ragStatus: getRagStatus(dimension.score),
    })),
    driversPullingDown: [
      {
        title: "Medication safety escalation",
        dimension: "Quality, Safety & Accreditation",
        impact: "-7 pts",
        reason:
          "High-severity medication incident has not entered RCA workflow within SLA.",
      },
      {
        title: "Accreditation evidence delay",
        dimension: "Quality, Safety & Accreditation",
        impact: "-5 pts",
        reason:
          "Twelve evidence items are overdue across medication reconciliation and infection control.",
      },
      {
        title: "Discharge throughput pressure",
        dimension: "Operational Intelligence",
        impact: "-4 pts",
        reason:
          "Order-to-bed-release time is 3.8 hours above target, increasing ER boarding risk.",
      },
      {
        title: "High-value denials yesterday",
        dimension: "Financial Intelligence",
        impact: "-3 pts",
        reason:
          "Denial rate rose to 9.1%, with one high-value denial carrying $42,000 revenue at risk pending review.",
      },
    ],
    driversPushingUp: [
      {
        title: "Outpatient pharmacy complaints fell",
        dimension: "Patient Experience & Access",
        impact: "+4 pts",
        reason:
          "Queue redesign cut wait-time complaints 22% week over week.",
      },
      {
        title: "CAPA closure velocity increased",
        dimension: "Quality, Safety & Accreditation",
        impact: "+2 pts",
        reason:
          "Quality team closed 18 lower-risk CAPAs over the last seven days.",
      },
    ],
  },

  financialTrend: {
    title: "Revenue leakage from claims denials",
    metricLabel: "Denial rate",
    currentValue: "9.1%",
    previousValue: "6.4%",
    movement: "+2.7 pts",
    status: "Worsening",
    revenueAtRisk: "$42,000",
    timeWindow: "Yesterday",
    highValueDenials: 1,
    department: "Cardiology",
    sourceModule: "Revenue Cycle",
    whatChanged:
      "Cardiology denial rate increased from 6.4% to 9.1% yesterday.",
    impact:
      "One high-value denial is holding $42,000 of recoverable revenue and may indicate a repeat authorization control gap.",
    recommendedAction:
      "Revisit the denied claim, confirm the authorization/documentation mismatch, and assign recovery ownership before the finance checkpoint.",
    owner: "Chief Financial Officer",
    due: "Tomorrow 11:00",
    points: [6.1, 6.4, 6.8, 7.2, 7.9, 8.5, 9.1],
  },

  criticalAlertsToday: [
    {
      id: "critical-alert-001",
      qualifiesAs: "serious patient safety incident",
      title: "High-severity medication incident",
      location: "ICU",
      severity: "Critical",
      owner: "Chief Medical Officer",
      sourceModule: "Quality, Safety & Accreditation · Incident Management",
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
      sourceModule: "Quality, Safety & Accreditation · Infection Control Surveillance",
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
      sourceModule: "Quality, Safety & Accreditation · Accreditation Readiness",
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
      sourceModule: "Financial Intelligence · Revenue Cycle Management",
      summary:
        "Denials increased to 9.1% after authorization and documentation mismatch spike, including one high-value denial with $42,000 revenue at risk.",
      requiredAction:
        "Revisit the high-value denial, confirm authorization control failure, and brief service leadership.",
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
      sourceModule: "Operational Intelligence · Bed & Capacity Management",
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
      category: "Quality, Safety & Accreditation",
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
      linkedItems: ["ICU", "Incident Management", "CAPA Management"],
    },
    {
      id: "risk-002",
      name: "Accreditation evidence gap before survey review",
      category: "Quality, Safety & Accreditation",
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
      linkedItems: ["Accreditation Readiness", "Infection Control", "Policy & Document Management"],
    },
    {
      id: "risk-003",
      name: "Discharge throughput pressure affecting access",
      category: "Operational Intelligence",
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
      linkedItems: ["Bed & Capacity", "Workforce Management", "Patient Flow"],
    },
    {
      id: "risk-004",
      name: "Claims denial leakage from documentation gaps",
      category: "Financial Intelligence",
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
      linkedItems: ["Revenue Cycle", "Cost Analytics", "Cardiology"],
    },
    {
      id: "risk-005",
      name: "Open audit findings ageing past 90 days",
      category: "Risk, Audit & Governance",
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
      owner: "Chief Risk Officer",
      nextMilestone: "Aged-finding triage closed for 6 of 17 by Friday",
      linkedItems: ["Internal Audit", "Risk Register", "Compliance Monitoring"],
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
      module: "Quality, Safety & Accreditation",
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
      module: "Quality, Safety & Accreditation",
      canReplicateElsewhere: true,
      replicationNote: "Use the same owner-due-time model for audit evidence closure.",
    },
    {
      id: "win-003",
      title: "Outpatient pharmacy complaints down",
      whyItMatters:
        "Lower wait-time complaints indicate the queue redesign is working.",
      measurableImprovement: "-22% complaints vs prior week",
      department: "Outpatient Pharmacy",
      module: "Patient Experience & Access",
      canReplicateElsewhere: true,
      replicationNote: "Replicate queue visibility in Radiology registration.",
    },
    {
      id: "win-004",
      title: "Sepsis bundle compliance improved",
      whyItMatters:
        "Higher protocol adherence correlates with lower 30-day mortality and shorter LOS.",
      measurableImprovement: "+9 pts bundle compliance",
      department: "Emergency / ICU",
      module: "Clinical Intelligence",
      canReplicateElsewhere: true,
      replicationNote: "Roll the same alert threshold into VTE and falls bundles.",
    },
    {
      id: "win-005",
      title: "Fraud anomaly detection caught duplicate billing",
      whyItMatters:
        "Stops repeat leakage and reduces forensic audit triggers downstream.",
      measurableImprovement: "$28K recovered, 6 duplicates flagged",
      department: "Revenue Cycle",
      module: "Financial Intelligence",
      canReplicateElsewhere: true,
      replicationNote: "Apply the same anomaly model to outlier claims by payer.",
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
      date: "2026-05-06T16:00:00+05:30",
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
      date: "2026-05-06T12:00:00+05:30",
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
      date: "2026-05-07T09:00:00+05:30",
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
      date: "2026-05-07T11:00:00+05:30",
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
      date: "2026-05-09T17:00:00+05:30",
      owner: "Chief Nursing Officer",
      readinessStatus: "On Track",
      blockers: ["Evening shift completion remains below target"],
      consequenceOfDelay:
        "Medication safety CAPA closure evidence remains incomplete.",
      confidenceLevel: "High",
    },
  ],
};
