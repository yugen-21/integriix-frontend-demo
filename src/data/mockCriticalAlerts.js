export const mockCriticalAlerts = [
  {
    id: "alert-001",
    title: "Medication Incident Spike",
    severity: "High",
    department: "Medical Wards",
    sourceSystem: "Incident Reporting",
    description:
      "Medication-related incidents increased 31% week over week, concentrated in anticoagulant administration and late reconciliation.",
    whyItMatters:
      "The trend increases preventable harm exposure and may affect accreditation medication management standards.",
    recommendedAction:
      "Run a pharmacy-nursing safety huddle, review anticoagulant orders, and validate reconciliation compliance by shift.",
    owner: "Chief Nursing Officer",
    due: "Today 12:00",
    status: "Open",
  },
  {
    id: "alert-002",
    title: "Audit Evidence Overdue",
    severity: "High",
    department: "Quality & Compliance",
    sourceSystem: "Audit Tools",
    description:
      "Twelve evidence items for medication reconciliation and infection control remain overdue for the upcoming accreditation file.",
    whyItMatters:
      "Delayed evidence reduces audit readiness and increases last-minute remediation risk.",
    recommendedAction:
      "Assign accountable owners and close evidence gaps before the daily compliance checkpoint.",
    owner: "Chief Quality Officer",
    due: "Today 16:00",
    status: "In Progress",
  },
  {
    id: "alert-003",
    title: "Infection Control Threshold Breach",
    severity: "Critical",
    department: "ICU",
    sourceSystem: "Infection Control",
    description:
      "CLABSI surveillance exceeded the internal threshold, with two cases linked to central line maintenance variance.",
    whyItMatters:
      "Immediate containment is required to protect patients and prevent reportable quality deterioration.",
    recommendedAction:
      "Start infection control review, validate line bundle compliance, and brief ICU leadership.",
    owner: "Infection Control Lead",
    due: "Today 10:30",
    status: "Open",
  },
  {
    id: "alert-004",
    title: "Claims Denial Increase",
    severity: "Medium",
    department: "Revenue Cycle",
    sourceSystem: "Revenue Cycle",
    description:
      "Cardiology procedure denials rose from 6.4% to 9.1%, primarily due to authorization and documentation mismatches.",
    whyItMatters:
      "The trend creates revenue leakage and signals documentation governance gaps.",
    recommendedAction:
      "Review denied claims sample, refresh authorization checks, and escalate documentation gaps to service leadership.",
    owner: "Chief Financial Officer",
    due: "Tomorrow 11:00",
    status: "Open",
  },
  {
    id: "alert-005",
    title: "Discharge Delay Bottleneck",
    severity: "High",
    department: "Bed Management",
    sourceSystem: "Bed Management",
    description:
      "Average discharge order-to-bed-release time is 3.8 hours above target, with pharmacy clearance and transport delays as leading contributors.",
    whyItMatters:
      "Delayed bed release increases ER boarding, elective procedure risk, and patient experience complaints.",
    recommendedAction:
      "Activate discharge command review for high-volume wards and prioritize pharmacy clearance before noon.",
    owner: "Chief Operating Officer",
    due: "Today 14:00",
    status: "Open",
  },
];
