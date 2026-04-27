export const mockDataSources = [
  {
    id: "source-001",
    category: "Clinical Systems",
    systems: ["EMR/EHR", "ICU Systems", "Laboratory Systems", "Radiology Systems"],
    status: "Connected",
    lastSync: "2026-04-27T07:05:00+05:30",
    keyOutputs: [
      "Risk signals",
      "LOS indicators",
      "Readmission indicators",
      "Clinical pathway deviations",
    ],
    sampleSignals: [
      "ICU sepsis pathway variance increased in 2 units",
      "Critical potassium result acknowledgement exceeded SLA for 4 cases",
    ],
  },
  {
    id: "source-002",
    category: "Operational Systems",
    systems: ["Scheduling Systems", "Bed Management", "OT Systems", "ER Systems"],
    status: "Connected",
    lastSync: "2026-04-27T07:02:00+05:30",
    keyOutputs: ["Flow optimization", "Throughput", "Utilization metrics"],
    sampleSignals: [
      "Medical ward occupancy reached 94%",
      "Discharge order-to-bed-release cycle is 3.8 hours above target",
    ],
  },
  {
    id: "source-003",
    category: "Quality & Safety Systems",
    systems: ["Incident Reporting", "Infection Control", "Risk Registers", "Audit Tools"],
    status: "Connected",
    lastSync: "2026-04-27T06:58:00+05:30",
    keyOutputs: ["Risk hotspots", "Safety trends", "Predictive alerts"],
    sampleSignals: [
      "Medication incident reports rose 31% week over week",
      "CLABSI surveillance crossed internal review threshold",
    ],
  },
  {
    id: "source-004",
    category: "Financial & Supply Chain Systems",
    systems: ["Revenue Cycle", "ERP Systems", "Pharmacy Systems"],
    status: "Connected",
    lastSync: "2026-04-27T06:55:00+05:30",
    keyOutputs: ["Fraud detection", "Revenue leakage", "Cost optimization"],
    sampleSignals: [
      "Claims denial rate increased in cardiology procedures",
      "High-cost antibiotic utilization exceeded formulary benchmark",
    ],
  },
  {
    id: "source-005",
    category: "External & Unstructured Data",
    systems: ["Patient Feedback", "Online Reviews", "Clinical Notes", "Accreditation Documents"],
    status: "Partial Sync",
    lastSync: "2026-04-27T06:40:00+05:30",
    keyOutputs: ["Experience analytics", "Compliance gaps"],
    sampleSignals: [
      "Patient comments cite repeated discharge communication delays",
      "Accreditation policy evidence pending for medication reconciliation",
    ],
  },
  {
    id: "source-006",
    category: "Audit & Compliance Data",
    systems: ["Internal Audits", "External Audits", "Compliance Reviews", "Fraud Investigations"],
    status: "Connected",
    lastSync: "2026-04-27T06:50:00+05:30",
    keyOutputs: ["Audit readiness score", "Governance insights", "Risk prediction"],
    sampleSignals: [
      "12 internal audit evidence items overdue",
      "Procurement control testing remains open for pharmacy purchases",
    ],
  },
];
