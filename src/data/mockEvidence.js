// Mock evidence uploads + AI verdicts for the Operative Effectiveness module.
// Schema mirrors what the backend will eventually return per the plan doc:
//   Upload { id, fileName, uploadedBy, uploadedAt, period, department, status,
//            aiDescription, verdict }
//   Verdict { policyResults: PolicyResult[] }
//   PolicyResult { policyId, policyCode, policyTitle, compliancePercent,
//                  findings: Finding[] }
//   Finding { id, type, evidenceRef, policyClauseRef, reasoning, override }
//
// `status` is one of: "pending" | "accepted" | "overridden".
// `type` on a finding is: "compliant" | "warning" | "non_compliant" | "missing".

// Lightweight policy↔risk mapping used by the Operative Effectiveness module
// to drive the "Affected risks" panel. Distinct from `mockPolicies` (the full
// policy library) — this only carries what the effectiveness UI needs.
export const effectivenessPolicies = [
  {
    id: "POL-001",
    code: "BB-COLD-CHAIN-SOP",
    title: "Blood unit cold-chain storage SOP",
    department: "Blood Bank",
    controlsRiskIds: ["BB-P1"],
  },
  {
    id: "POL-002",
    code: "BB-VERIFY-SOP",
    title: "Pre-transfusion bedside verification SOP",
    department: "Blood Bank",
    controlsRiskIds: ["BB-01"],
  },
  {
    id: "POL-003",
    code: "PHA-NARCOTIC-001",
    title: "Controlled substance dispensing and reconciliation",
    department: "Pharmacy",
    controlsRiskIds: ["PHA-02"],
  },
  {
    id: "POL-004",
    code: "ED-TRIAGE-PROT",
    title: "Emergency department triage protocol",
    department: "Emergency",
    controlsRiskIds: ["ED-01"],
  },
  {
    id: "POL-005",
    code: "ICU-VAP-BUNDLE",
    title: "Ventilator-associated pneumonia prevention bundle",
    department: "Intensive Care Unit",
    controlsRiskIds: ["ICU-01"],
  },
  {
    id: "POL-006",
    code: "HK-TERM-CLEAN-SOP",
    title: "Terminal cleaning SOP for isolation rooms",
    department: "Housekeeping & Laundry",
    controlsRiskIds: ["HK-01", "IPC-01"],
  },
  {
    id: "POL-007",
    code: "LAB-LABEL-PROT",
    title: "Sample labelling and chain-of-custody protocol",
    department: "Laboratory & Pathology",
    controlsRiskIds: ["LAB-01"],
  },
  {
    id: "POL-008",
    code: "IT-PATCH-MGMT",
    title: "Vulnerability and patch management policy",
    department: "IT",
    controlsRiskIds: ["IT-P1"],
  },
];

function finding(id, type, evidenceRef, policyClauseRef, reasoning, override = null) {
  return { id, type, evidenceRef, policyClauseRef, reasoning, override };
}

// Six mock uploads with varied statuses, departments and compliance scores so
// the dashboard, filters and review flow all have something to chew on.
export const mockEvidenceUploads = [
  {
    id: "UP-2026-001",
    fileName: "BB-temp-log-Apr2026.csv",
    fileType: "csv",
    uploadedBy: "M. Iyer (Blood Bank Officer)",
    uploadedAt: "2026-05-12T08:30:00Z",
    period: "April 2026",
    department: "Blood Bank",
    status: "pending",
    aiDescription:
      "Daily freezer temperature log for the Blood Bank, April 2026. 30 entries, values ranging -25°C to -18°C. 3 entries on Apr 12 / 15 / 22 read -18°C, at the upper end of the acceptable range. 2 days (Apr 8, Apr 21) appear to have no entry.",
    verdict: {
      policyResults: [
        {
          policyId: "POL-001",
          policyCode: "BB-COLD-CHAIN-SOP",
          policyTitle: "Blood unit cold-chain storage SOP",
          compliancePercent: 83,
          findings: [
            finding("F1", "compliant", "Apr 1–7", "§3.1 Daily logging required",
              "Daily entries present, all within range -25°C to -19°C."),
            finding("F2", "missing", "Apr 8", "§3.1 Daily logging required",
              "No temperature entry recorded for Apr 8."),
            finding("F3", "warning", "Apr 12, Apr 15, Apr 22", "§3.2 Acceptable range -25°C to -19°C",
              "Three entries at -18°C — within tolerance but at the upper boundary."),
            finding("F4", "missing", "Apr 21", "§3.1 Daily logging required",
              "No temperature entry recorded for Apr 21."),
            finding("F5", "compliant", "Apr 9–11, 13–14, 16–20, 23–30", "§3.1 Daily logging required",
              "All remaining entries present and within range."),
          ],
        },
      ],
    },
  },
  {
    id: "UP-2026-002",
    fileName: "PHA-narcotic-recon-Q1-2026.pdf",
    fileType: "pdf",
    uploadedBy: "K. Rao (Chief Pharmacist)",
    uploadedAt: "2026-05-09T14:15:00Z",
    period: "Q1 2026",
    department: "Pharmacy",
    status: "pending",
    aiDescription:
      "Controlled substance reconciliation register, Q1 2026. 89 dispense events across morphine, fentanyl and pethidine. Dual sign-off is present on 76 events; 13 events show only a single signature. 4 daily reconciliations are missing.",
    verdict: {
      policyResults: [
        {
          policyId: "POL-003",
          policyCode: "PHA-NARCOTIC-001",
          policyTitle: "Controlled substance dispensing and reconciliation",
          compliancePercent: 68,
          findings: [
            finding("F1", "compliant", "76 of 89 dispense events", "§4.2 Dual sign-off",
              "Both pharmacist and witness signatures present and legible."),
            finding("F2", "non_compliant", "13 of 89 dispense events", "§4.2 Dual sign-off",
              "Only one signature present — witness column blank on event IDs N-014, N-022, N-031, N-038, N-044, N-051, N-058, N-063, N-070, N-074, N-079, N-083, N-087."),
            finding("F3", "missing", "Jan 14, Feb 3, Feb 22, Mar 19", "§5.1 Daily reconciliation",
              "End-of-day reconciliation log entry missing for four days."),
          ],
        },
      ],
    },
  },
  {
    id: "UP-2026-003",
    fileName: "ICU-VAP-bundle-Mar2026.xlsx",
    fileType: "xlsx",
    uploadedBy: "S. Anjum (ICU Charge Nurse)",
    uploadedAt: "2026-05-02T10:00:00Z",
    period: "March 2026",
    department: "Intensive Care Unit",
    status: "accepted",
    aiDescription:
      "VAP prevention bundle compliance audit, March 2026. 124 ventilated patient-days. Head-of-bed elevation documented in 119 cases, oral care q4h in 114 cases, sedation interruption in 110 cases.",
    verdict: {
      policyResults: [
        {
          policyId: "POL-005",
          policyCode: "ICU-VAP-BUNDLE",
          policyTitle: "Ventilator-associated pneumonia prevention bundle",
          compliancePercent: 91,
          findings: [
            finding("F1", "compliant", "119 of 124 patient-days", "§2.1 Head-of-bed ≥30°",
              "HoB elevation documented in 96% of patient-days."),
            finding("F2", "warning", "10 of 124 patient-days", "§2.3 Oral care q4h with chlorhexidine",
              "Oral care log gaps on 10 patient-days (often around shift handover)."),
            finding("F3", "warning", "14 of 124 patient-days", "§2.4 Daily sedation interruption",
              "Sedation interruption not documented on 14 patient-days; clinical exclusion noted on 9 of them."),
          ],
        },
      ],
    },
  },
  {
    id: "UP-2026-004",
    fileName: "ED-triage-audit-Q1-2026.pdf",
    fileType: "pdf",
    uploadedBy: "A. Singh (ED Charge Nurse)",
    uploadedAt: "2026-04-28T16:45:00Z",
    period: "Q1 2026",
    department: "Emergency",
    status: "overridden",
    aiDescription:
      "ED triage protocol compliance audit, Q1 2026. 412 reviewed triage events. ESI level assigned on all events. Re-triage at 30 minutes documented on 298 of 412 cases where waiting time exceeded 30 minutes.",
    verdict: {
      policyResults: [
        {
          policyId: "POL-004",
          policyCode: "ED-TRIAGE-PROT",
          policyTitle: "Emergency department triage protocol",
          compliancePercent: 72,
          findings: [
            finding("F1", "compliant", "412 of 412 events", "§2.1 ESI level assignment",
              "Five-level ESI score recorded on every triage event."),
            finding("F2", "non_compliant", "114 of 412 events", "§2.3 Re-triage if wait >30 min",
              "Re-triage check missing for 114 long-wait events.",
              { type: "compliant", note: "Reviewed sampling — most missed re-triages were ESI 4/5 with documented physician reassessment instead. Accept as compliant within spirit of policy.", by: "K. Iyer (Quality Officer)", at: "2026-04-29T11:00:00Z" }),
          ],
        },
      ],
    },
  },
  {
    id: "UP-2026-005",
    fileName: "HK-terminal-clean-Apr2026.csv",
    fileType: "csv",
    uploadedBy: "R. Krishnan (Housekeeping Supervisor)",
    uploadedAt: "2026-05-10T07:20:00Z",
    period: "April 2026",
    department: "Housekeeping & Laundry",
    status: "pending",
    aiDescription:
      "Terminal cleaning verification log, April 2026. 47 isolation-room turnovers. ATP swab results captured on 40 of 47 turnovers. 3 readings exceeded the 250 RLU threshold; 7 turnovers have no ATP result recorded.",
    verdict: {
      policyResults: [
        {
          policyId: "POL-006",
          policyCode: "HK-TERM-CLEAN-SOP",
          policyTitle: "Terminal cleaning SOP for isolation rooms",
          compliancePercent: 79,
          findings: [
            finding("F1", "compliant", "37 of 47 turnovers", "§4.1 ATP swab ≤250 RLU",
              "ATP reading present and within threshold."),
            finding("F2", "non_compliant", "Apr 6, Apr 17, Apr 28", "§4.1 ATP swab ≤250 RLU",
              "Readings of 312, 287 and 264 RLU exceed the 250 RLU threshold; re-clean not documented."),
            finding("F3", "missing", "7 of 47 turnovers", "§4.2 ATP result must be logged",
              "ATP swab result absent on 7 turnovers — supervisor sign-off only."),
          ],
        },
      ],
    },
  },
  {
    id: "UP-2026-006",
    fileName: "IT-patch-SLA-Q1-2026.csv",
    fileType: "csv",
    uploadedBy: "Infrastructure Lead",
    uploadedAt: "2026-05-06T19:00:00Z",
    period: "Q1 2026",
    department: "IT",
    status: "pending",
    aiDescription:
      "Vulnerability patching SLA report, Q1 2026. 84 critical CVEs raised. 52 patched within the 14-day SLA. 24 patched beyond SLA (15–45 days). 8 still open at quarter end.",
    verdict: {
      policyResults: [
        {
          policyId: "POL-008",
          policyCode: "IT-PATCH-MGMT",
          policyTitle: "Vulnerability and patch management policy",
          compliancePercent: 62,
          findings: [
            finding("F1", "compliant", "52 of 84 critical CVEs", "§3.1 Patch SLA 14 days (critical)",
              "Patched within SLA."),
            finding("F2", "non_compliant", "24 of 84 critical CVEs", "§3.1 Patch SLA 14 days (critical)",
              "Patched 15–45 days after CVE publication — outside the 14-day SLA."),
            finding("F3", "non_compliant", "8 of 84 critical CVEs", "§3.2 Open CVE escalation",
              "Critical CVE remained open at quarter end; no documented escalation to the CIO."),
          ],
        },
      ],
    },
  },
];

// Department list derived from the existing risk register departments, used for
// the upload form's department dropdown.
export const evidenceDepartments = [
  "Blood Bank",
  "Pharmacy",
  "Intensive Care Unit",
  "Emergency",
  "Housekeeping & Laundry",
  "Laboratory & Pathology",
  "IT",
  "Operation Theatre",
  "Inpatient Wards",
  "Outpatient Department",
  "Maternity & Obstetrics",
  "Pediatrics & Neonatology",
  "Radiology & Imaging",
  "Infection Prevention & Control",
  "Nursing",
  "Quality & Accreditation",
];
