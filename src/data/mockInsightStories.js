export const mockInsightStories = [
  {
    id: "insight-001",
    title: "Medication Safety Variance Is Becoming a Systemic Risk",
    sourceSystems: ["Incident Reporting", "Pharmacy Systems", "EMR/EHR"],
    whatChanged:
      "Medication incidents rose 31% week over week, with anticoagulant workflows overrepresented.",
    rootCause:
      "Late medication reconciliation and inconsistent double-check documentation across evening shifts.",
    impact:
      "Higher preventable harm risk and increased exposure during accreditation medication management review.",
    recommendedAction:
      "Launch same-day pharmacy-nursing review and track reconciliation compliance by ward and shift.",
    linkedMetric: "Patient Safety Risk",
    severity: "High",
  },
  {
    id: "insight-002",
    title: "Discharge Throughput Is Creating Downstream Access Pressure",
    sourceSystems: ["Bed Management", "ER Systems", "Patient Feedback"],
    whatChanged:
      "Order-to-bed-release time is 3.8 hours above target and patient complaints mention discharge confusion.",
    rootCause:
      "Pharmacy clearance, transport coordination, and discharge communication are not aligned before noon.",
    impact:
      "ER boarding risk, elective admission delays, and lower patient experience scores.",
    recommendedAction:
      "Run a daily discharge command review with pharmacy, transport, nursing, and bed management.",
    linkedMetric: "Operational Flow",
    severity: "High",
  },
  {
    id: "insight-003",
    title: "Revenue Leakage Is Linked to Documentation Governance",
    sourceSystems: ["Revenue Cycle", "EMR/EHR", "Clinical Notes"],
    whatChanged:
      "Cardiology procedure denials increased to 9.1%, led by authorization and documentation mismatches.",
    rootCause:
      "Pre-procedure authorization checks and clinical documentation templates are not consistently reconciled.",
    impact:
      "Revenue leakage and avoidable rework for finance, coding, and clinical teams.",
    recommendedAction:
      "Review denied claim samples and standardize pre-submission documentation checks.",
    linkedMetric: "Financial Risk",
    severity: "Medium",
  },
  {
    id: "insight-004",
    title: "Audit Readiness Depends on Evidence Closure Today",
    sourceSystems: ["Audit Tools", "Internal Audits", "Accreditation Documents"],
    whatChanged:
      "Twelve evidence items remain overdue across medication reconciliation and infection control.",
    rootCause:
      "Evidence ownership is fragmented and status updates are not being captured in the audit tool.",
    impact:
      "Reduced external audit readiness and higher remediation burden for quality leadership.",
    recommendedAction:
      "Assign evidence owners, lock due times, and verify uploads during the afternoon governance checkpoint.",
    linkedMetric: "Audit Readiness",
    severity: "High",
  },
];
