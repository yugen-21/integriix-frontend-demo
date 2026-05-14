// Mock audits + audit findings for the Internal Audit module.
//
// Domain shape (per docs/risk-effectiveness-audit-frontend-plan.md):
//   Audit { id, title, departments[], scope, period, owner, status, createdAt,
//           updatedAt, checklist[], findings: Finding[] }
//   Finding { id, afNumber, title, severity, status, wpRef,
//             criteria: { background, standardReferences[] },
//             conditions, rootCauses[], riskIds[],
//             recommendations[], actionPlan, targetDate,
//             responsibleOwners[], managementResponse,
//             attachments[], aiAssisted, createdAt, updatedAt }
//
// `status` on an audit:   "planning" | "in_progress" | "issued" | "closed"
// `status` on a finding:  "draft"    | "issued"      | "responded" | "closed"
// `severity`:             "low"      | "medium"      | "significant" | "high"

export const auditDepartments = [
  "Pharmacy",
  "Emergency",
  "Intensive Care Unit",
  "Operation Theatre",
  "Blood Bank",
  "Laboratory & Pathology",
  "Housekeeping & Laundry",
  "IT",
  "Infection Prevention & Control",
  "Nursing",
  "Finance & Accounts",
  "Quality & Accreditation",
];

export const auditOwners = [
  "Internal Audit Lead",
  "Senior Auditor — Clinical",
  "Senior Auditor — Operations",
  "Compliance Officer",
];

export const responsibleOwners = [
  { name: "Dr. Sarah Mansour", position: "Chief Pharmacist" },
  { name: "Dr. James Patel", position: "Pharmacy Operations Manager" },
  { name: "Ahmed Al-Sayed", position: "Controlled Drugs Supervisor" },
  { name: "Dr. Nadia Rahman", position: "ED Director" },
  { name: "Lina Hassan", position: "ICU Charge Nurse" },
  { name: "Faisal Khan", position: "Blood Bank Manager" },
  { name: "Maria Okafor", position: "Lab Quality Lead" },
  { name: "David Chen", position: "Housekeeping Supervisor" },
  { name: "Priya Nair", position: "Chief Information Security Officer" },
  { name: "Dr. Omar Reza", position: "IPC Officer" },
];

// ---------------------------------------------------------------------------
// Findings — three drug-inventory findings modelled directly on the sample
// XYZ Drug Inventory Audit Report so the demo has plausible content.
// ---------------------------------------------------------------------------

const finding1 = {
  id: "AF-001",
  afNumber: 1,
  title: "Gaps in the Controlled Drugs Inventory Recording and Monitoring Process",
  severity: "significant",
  status: "responded",
  wpRef: "R15C15AF1, R53C53AF1",
  criteria: {
    background:
      "A controlled drug is a drug or other substance tightly controlled by the regulator (Ministry of Public Health) under Qatar Narcotic and Controlled Substances laws and regulations, because it may be abused or cause addiction. Control restrictions define the controls around producing, using, handling, storing, and distributing such drugs (which include opioids, stimulants, depressants, hallucinogens, and anabolic steroids).",
    standardReferences: [
      {
        kind: "jci",
        code: "MMU 3",
        text: "Joint Commission International (JCI) Standards MMU 3 states, \"Controlled substances are accurately accounted for according to applicable laws and regulations.\"",
      },
      {
        kind: "policy",
        code: "CL 6053 § 3.1",
        policyId: "POL-003",
        text: "All narcotic and controlled drugs shall be procured, stocked, prescribed, dispensed, transported, administered and accounted for in by Qatar Narcotic and Controlled Substances Laws and Regulations (Law No 19/1993 and 9/1987).",
      },
      {
        kind: "policy",
        code: "CL 6053 § 3.10.1",
        policyId: "POL-003",
        text: "The entire amount of narcotics and controlled drugs obtained or dispensed should be accounted for.",
      },
      {
        kind: "policy",
        code: "CL 6053 § 3.14",
        policyId: "POL-003",
        text: "Any physical count discrepancies of narcotics and controlled drugs or disposition of the narcotic keys should be resolved by the end of the shift. Any discrepancies which cannot be resolved should be reported to the regulator immediately.",
      },
    ],
  },
  conditions:
    "There were gaps noted in the controlled drug inventory recording and monitoring process followed at various facilities.\n\n1. There was a variance of 24 units in controlled drug Gabapentin 300mg between Cerner (1,916 units) and physical inventory (1,940 units) at Fahad Bin Jassim Facility.\n\n2. There was a significant variance of 18,550ml noted in the quantity of controlled drug — Morphine 2mg/ml solution (Item# 8900006021) between Cerner and the physical amount at the NCCCR facility. Cerner reported 40.612 units i.e. 20,306ml (500 × 40.612), actual physical quantity was 1,756 ml — a difference of 18,550 ml.\n\n3. During our review of controlled drugs at Al-Khor facility, we noted 10 units of Remifentanil 2MG item # 8900006011 were neither recorded in the Ministry of Public Health (MOPH) logbook or in the Oracle system. We were informed that these units related to returns from the wards.",
  rootCauses: [
    "Inadequate inventory monitoring process (cycle count) does not include verifying Oracle quantities at the controlled drugs pharmacy with the actual physical quantities of controlled drugs.",
    "Non-compliance to defined inventory recording and accounting process during receipts and issuance, such as inaccuracies in batch number and lot numbers of inventory recorded and delays in recording receipts.",
    "There is no reconciliation of Oracle, Cerner, and Ministry of Public Health (MOPH) logbook with physical quantities periodically.",
    "Inaccurate stock-keeping unit (SKU) definitions in Cerner.",
    "Non-compliance to the defined process due to absence of system capabilities in Oracle to document the returns with batch number and quantities.",
    "Inadequate staff training and internal controls to review the recording of returned inventory in the Ministry of Public Health (MOPH) logbook.",
  ],
  riskIds: ["PHA-02"],
  recommendations: [
    "Enhance the cycle counting process coverage for controlled drugs to include inventory quantities between Oracle, Cerner, Ministry of Public Health (MOPH) logbook, and physical stock.",
    "Provide staff training and implement an internal review process in the Pharmacy department on accounting processes to be followed and regulatory restrictions applicable.",
    "Implement a process to ensure timely recording of receipts, issuance, and returns of controlled drugs from various locations, in Oracle, Cerner, and Ministry of Public Health (MOPH) logbook.",
    "Periodic reconciliation of quantities of controlled drugs as per Oracle, Cerner, Ministry of Public Health (MOPH) logbook and physical quantities.",
    "Review the process of transfer of controlled drugs and implement controls in tracking and recording of controlled drugs.",
    "Review stock-keeping unit definitions for controlled drugs and make necessary modifications and standardize them across items.",
    "Perform adjustments to inventory planning, procurement, and storage based on the updated quantities.",
  ],
  actionPlan:
    "We agree with the recommendations. Pharmacy will roll out a monthly tri-system reconciliation (Oracle / Cerner / MOPH logbook / physical) starting next quarter, retrain pharmacy staff on the returns workflow, and engage IT to add batch-level fields to the Oracle returns module.",
  targetDate: "2026-09-30",
  responsibleOwners: [
    { name: "Dr. Sarah Mansour", position: "Chief Pharmacist" },
    { name: "Ahmed Al-Sayed", position: "Controlled Drugs Supervisor" },
  ],
  managementResponse:
    "We acknowledge the variances identified during the audit. The root causes resonate with internal findings from our last MOPH inspection. Corrective actions are being prioritised under the Pharmacy Quality Plan 2026.",
  attachments: [
    {
      name: "Annexure 1 — Detailed variance log.csv",
      kind: "csv",
      size: "12 KB",
    },
  ],
  aiAssisted: true,
  createdAt: "2026-04-12T09:30:00Z",
  updatedAt: "2026-05-02T14:20:00Z",
};

const finding2 = {
  id: "AF-002",
  afNumber: 2,
  title: "Expired Batches of Controlled Drugs Replaced for Active Batch at Al Khor Facility",
  severity: "high",
  status: "issued",
  wpRef: "R34C34AF2, R48C48AF2, R54C54AF2",
  criteria: {
    background:
      "Expired drugs are those stocks of drugs, whose shelf life has passed. Expired drugs should be removed from all storage locations and quarantined safely until condemnation. When active controlled drugs are replaced with expired drugs, it increases the risk of theft/pilferage of controlled drugs.",
    standardReferences: [
      {
        kind: "jci",
        code: "MMU 3",
        text: "Joint Commission International (JCI) Standards MMU 3 states, \"Controlled substances are accurately accounted for according to applicable laws and regulations.\"",
      },
      {
        kind: "policy",
        code: "CL 6053 § 3.1",
        policyId: "POL-003",
        text: "All narcotic and controlled drugs shall be procured, stocked, prescribed, dispensed, transported, administered and accounted for by Qatar Narcotic and Controlled Substances Laws and Regulations (Law No 19/1993 and 9/1987).",
      },
      {
        kind: "policy",
        code: "CL 6053 § 3.10.1",
        policyId: "POL-003",
        text: "The entire amount of narcotics and controlled drugs obtained or dispensed should be accounted for.",
      },
      {
        kind: "policy",
        code: "CL 6062 § 3.5.1",
        policyId: "POL-003",
        text: "Condemnation of invalid and/or expired medication — invalid and expired drugs and pharmaceutical chemicals should be collected at their location sites by the assigned staff and documented with quantity, batch number, expiry date, and item number.",
      },
    ],
  },
  conditions:
    "There were instances where physical quantities of active drug batches were replaced with expired drug batches. We noted that in Al-Khor facility pharmacy, 10 units of Fentanyl Transdermal 12 MCG/HR, 2.1 MG, UoM-PAT (LOT#JCBA00.B) with expiry date 28th February 2021, were replaced with 10 units of (LOT#IHB2S00) which had expired on 31 July 2020.",
  rootCauses: [
    "Inadequate inventory recording process as batch numbers and lot numbers are not captured in Ministry of Public Health (MOPH) logbook for returned drugs.",
    "Inadequate process to remove expired controlled drugs from controlled drug pharmacy.",
    "No process to reconcile returned drug quantities as per Ministry of Public Health (MOPH) logbook with the physical quantities of returned drugs.",
    "Ministry of Public Health (MOPH) audits of controlled drugs do not include review of the batch numbers of controlled drugs. Currently, only the quantities are reviewed.",
  ],
  riskIds: ["PHA-02"],
  recommendations: [
    "Implement a process to ensure recording of returned drugs in the Ministry of Public Health (MOPH) logbook and in Oracle and Cerner systems.",
    "Implement a periodic reconciliation process between physical quantities of returned drugs and quantities of returned drugs as per Ministry of Public Health (MOPH) logbook.",
    "Implement a process to remove all expired controlled drugs from the controlled drug pharmacy.",
  ],
  actionPlan: "",
  targetDate: null,
  responsibleOwners: [
    { name: "Ahmed Al-Sayed", position: "Controlled Drugs Supervisor" },
  ],
  managementResponse: "",
  attachments: [],
  aiAssisted: true,
  createdAt: "2026-04-12T11:15:00Z",
  updatedAt: "2026-04-29T16:05:00Z",
};

const finding3 = {
  id: "AF-003",
  afNumber: 3,
  title: "Expired Controlled Drugs Stored in Controlled Drug Safe",
  severity: "high",
  status: "draft",
  wpRef: "R11C11AF3, R29C29AF3, R33C33AF3, R34C34AF3, R35C35AF3",
  criteria: {
    background:
      "Expired medical products can be less effective or risky due to a change in chemical composition or decreased strength. Certain expired medications are at risk of bacterial growth, and sub-potent antibiotics can fail to treat infections, leading to more severe illnesses and antibiotic resistance. Expired drugs should be removed from storage locations and quarantined safely until condemnation.",
    standardReferences: [
      {
        kind: "policy",
        code: "CL 6053 § 3.6.7",
        policyId: "POL-003",
        text: "The expiry of floor-stock Narcotic and Controlled drugs should be checked monthly by In-Charge Nurses and replaced two (2) months before expiry (if applicable).",
      },
      {
        kind: "policy",
        code: "CL 6062 § 3.7",
        policyId: "POL-003",
        text: "The Condemnation Committee should initiate the condemnation process in accordance with their procedures in coordination with the Pharmacy and Controlled Drug Department and the Ministry of Public Health.",
      },
      {
        kind: "policy",
        code: "CL 6053 § 3.16",
        policyId: "POL-003",
        text: "Condemnation of the Narcotic and Controlled Drug Waste: all remaining or wasted narcotic and controlled drugs should be collected and stored in the Narcotic and Controlled drug room and random samples to be sent to the pharmacy and drug control department at the Ministry of Public Health (MOPH) for verification.",
      },
    ],
  },
  conditions:
    "1. There is no process for timely removal of expired drugs from controlled drug pharmacy and storage in quarantine until condemnation.\n\n2. Further, there are long expired controlled drugs that are not condemned in violation of the defined narcotic drug condemnation procedure.\n\nPlease refer to Annexure 2 for instances of violations noted at different facilities.",
  rootCauses: [
    "The narcotics condemnation process is performed only once a year as per current practice and has not been performed in the current year.",
    "There is no defined process to remove expired controlled drugs from controlled drug pharmacies periodically and quarantine them until condemnation.",
  ],
  riskIds: ["PHA-02"],
  recommendations: [
    "Implement a process to remove all expired drugs to a centralized storage location for quarantine on a periodic basis.",
    "Implement a condemnation process on monthly basis, or whenever needed, in coordination with Ministry of Public Health (MOPH).",
  ],
  actionPlan: "",
  targetDate: null,
  responsibleOwners: [],
  managementResponse: "",
  attachments: [
    {
      name: "Annexure 2 — Expired stock instances.pdf",
      kind: "pdf",
      size: "240 KB",
    },
  ],
  aiAssisted: true,
  createdAt: "2026-04-13T08:50:00Z",
  updatedAt: "2026-04-13T08:50:00Z",
};

// ---------------------------------------------------------------------------
// Audits
// ---------------------------------------------------------------------------

export const mockAudits = [
  {
    id: "AUD-001",
    title: "Drug Inventory Audit — Q1 2026",
    departments: ["Pharmacy"],
    scope:
      "Review controlled drug inventory recording, reconciliation, storage and condemnation processes across Fahad Bin Jassim, NCCCR and Al-Khor facility pharmacies.",
    period: "Q1 2026",
    owner: "Senior Auditor — Clinical",
    status: "in_progress",
    createdAt: "2026-03-15T09:00:00Z",
    updatedAt: "2026-05-02T14:20:00Z",
    checklist: [
      { id: "c1", text: "Walkthrough controlled drug pharmacy at each facility", done: true },
      { id: "c2", text: "Reconcile Oracle vs Cerner vs MOPH logbook vs physical", done: true },
      { id: "c3", text: "Sample batch / expiry inspection in controlled drug safe", done: true },
      { id: "c4", text: "Interview pharmacy staff on returns workflow", done: true },
      { id: "c5", text: "Issue findings and obtain management response", done: false },
    ],
    findings: [finding1, finding2, finding3],
  },
  {
    id: "AUD-002",
    title: "Blood Bank Cold-Chain Audit",
    departments: ["Blood Bank"],
    scope:
      "Verify cold-chain compliance for the central blood bank refrigeration units, including continuous temperature logging, alarm response, and pre-transfusion bedside verification.",
    period: "Q2 2026",
    owner: "Senior Auditor — Clinical",
    status: "planning",
    createdAt: "2026-04-22T10:30:00Z",
    updatedAt: "2026-04-22T10:30:00Z",
    checklist: [
      { id: "c1", text: "Pull 30 days of temperature logs", done: false },
      { id: "c2", text: "Witness 2 transfusions end-to-end", done: false },
      { id: "c3", text: "Review last 6 months of cold-chain incidents", done: false },
    ],
    findings: [],
  },
  {
    id: "AUD-003",
    title: "IT Vulnerability Management Audit — 2025",
    departments: ["IT"],
    scope:
      "Assess vulnerability and patch management on hospital systems and medical devices against the IT patch management policy.",
    period: "FY 2025",
    owner: "Senior Auditor — Operations",
    status: "closed",
    createdAt: "2025-11-04T13:00:00Z",
    updatedAt: "2026-02-19T17:10:00Z",
    checklist: [
      { id: "c1", text: "Inventory of unpatched assets older than 30 days", done: true },
      { id: "c2", text: "Sampling of medical-device patch logs", done: true },
      { id: "c3", text: "Walkthrough of incident response runbook", done: true },
    ],
    findings: [
      {
        id: "AF-IT-001",
        afNumber: 1,
        title: "Critical vulnerabilities unpatched beyond 30-day SLA on imaging workstations",
        severity: "high",
        status: "closed",
        wpRef: "R72C72AF1",
        criteria: {
          background:
            "The hospital's patch management policy requires critical CVEs to be remediated within 30 days. Imaging workstations carry PHI and connect to PACS, making them high-value targets.",
          standardReferences: [
            {
              kind: "policy",
              code: "IT-PATCH-MGMT § 4.2",
              policyId: "POL-008",
              text: "Critical-severity vulnerabilities (CVSS ≥ 9.0) must be patched on production systems within 30 calendar days of vendor release.",
            },
          ],
        },
        conditions:
          "Of 42 imaging workstations sampled, 11 (26%) had at least one critical-severity vulnerability that remained unpatched between 45 and 120 days past vendor release.",
        rootCauses: [
          "Patch deployment windows are limited to Sundays 02:00–06:00 to avoid clinical impact, but the queue regularly exceeds the available window.",
          "Vendor-locked workstations require manual approval before patching, and there is no SLA on that approval step.",
        ],
        riskIds: ["IT-P1"],
        recommendations: [
          "Add a second weekday patch window for non-radiology hours.",
          "Define an SLA for vendor-lock approval on imaging workstations.",
        ],
        actionPlan:
          "Agreed. IT added a Wednesday 14:00–16:00 patch window for non-imaging workstations and negotiated a 5-business-day SLA with the imaging vendor.",
        targetDate: "2026-02-01",
        responsibleOwners: [
          { name: "Priya Nair", position: "Chief Information Security Officer" },
        ],
        managementResponse:
          "Concur with the finding. Action plan executed Q1 2026; verification audit confirmed remediation.",
        attachments: [],
        aiAssisted: false,
        createdAt: "2025-12-01T10:00:00Z",
        updatedAt: "2026-02-19T17:10:00Z",
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Trigger feed — incidents, complaints, and Operative Effectiveness verdicts
// that should probably become audits.
// ---------------------------------------------------------------------------

export const mockAuditTriggers = [
  {
    id: "TRG-001",
    source: "verdict",
    sourceId: "UP-003",
    sourceLabel: "Operative Effectiveness · Non-compliant verdict",
    title: "Controlled drug log shows repeated discrepancies",
    department: "Pharmacy",
    detectedAt: "2026-05-08T12:00:00Z",
    severity: "high",
    summary:
      "Latest accepted verdict on the November controlled-drug log flagged 4 non-compliant rows against CL 6053 § 3.14 (discrepancy resolution by end of shift).",
    suggestedRiskIds: ["PHA-02"],
    suggestedPolicyIds: ["POL-003"],
  },
  {
    id: "TRG-002",
    source: "incident",
    sourceId: "INC-1842",
    sourceLabel: "Quality, Safety & Accreditation · Incident",
    title: "3 needlestick incidents in 14 days on Ward 4B",
    department: "Nursing",
    detectedAt: "2026-05-06T08:20:00Z",
    severity: "medium",
    summary:
      "Cluster of 3 reported needlestick incidents on a single ward within a 14-day window — exceeds the 12-month trailing rate by 4×.",
    suggestedRiskIds: [],
    suggestedPolicyIds: [],
  },
  {
    id: "TRG-003",
    source: "complaint",
    sourceId: "CMP-0732",
    sourceLabel: "Patient Experience & Access · Complaint",
    title: "Multiple complaints about ED triage wait times",
    department: "Emergency",
    detectedAt: "2026-05-04T15:45:00Z",
    severity: "medium",
    summary:
      "11 complaints in the last 30 days citing ED waits >4h before initial triage. Last ED audit was 19 months ago.",
    suggestedRiskIds: ["ED-01", "ED-02"],
    suggestedPolicyIds: ["POL-004"],
  },
  {
    id: "TRG-004",
    source: "verdict",
    sourceId: "UP-005",
    sourceLabel: "Operative Effectiveness · Non-compliant verdict",
    title: "Terminal cleaning log shows skipped isolation rooms",
    department: "Housekeeping & Laundry",
    detectedAt: "2026-04-30T09:10:00Z",
    severity: "medium",
    summary:
      "Verdict on the April terminal-cleaning roster shows 2 isolation rooms with no documented terminal clean post-discharge.",
    suggestedRiskIds: ["HK-01", "IPC-01"],
    suggestedPolicyIds: ["POL-006"],
  },
  {
    id: "TRG-005",
    source: "incident",
    sourceId: "INC-1856",
    sourceLabel: "Quality, Safety & Accreditation · Incident",
    title: "Sample mislabelling reported by chemistry lab",
    department: "Laboratory & Pathology",
    detectedAt: "2026-04-28T13:00:00Z",
    severity: "high",
    summary:
      "Two consecutive mislabelled-specimen incidents in 5 days from inpatient phlebotomy — both required redraws on critical patients.",
    suggestedRiskIds: ["LAB-01"],
    suggestedPolicyIds: ["POL-007"],
  },
];

// Severity ordering helper (low < medium < significant < high).
export const SEVERITY_ORDER = { low: 1, medium: 2, significant: 3, high: 4 };

export const SEVERITY_LABEL = {
  low: "Low",
  medium: "Medium",
  significant: "Significant",
  high: "High",
};

export const AUDIT_STATUS_LABEL = {
  planning: "Planning",
  in_progress: "In Progress",
  issued: "Issued",
  closed: "Closed",
};

export const FINDING_STATUS_LABEL = {
  draft: "Draft",
  issued: "Issued",
  responded: "Responded",
  closed: "Closed",
};
