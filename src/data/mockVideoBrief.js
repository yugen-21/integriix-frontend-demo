export const mockVideoBrief = {
  title: "Daily Governance Brief: Riverside Metropolitan Hospital",
  duration: "04:18",
  generatedAt: "2026-04-27T07:15:00+05:30",
  status: "Ready",
  executiveSummary:
    "Riverside begins the day with stable core operations but moderate governance risk across medication safety, infection control, claims denials, and discharge throughput.",
  briefingChapters: [
    {
      id: "chapter-001",
      title: "Enterprise Status",
      startTime: "00:00",
      duration: "00:42",
      focus: "Overall governance score, overnight movement, and board-level priorities.",
    },
    {
      id: "chapter-002",
      title: "Safety and Quality Watchpoints",
      startTime: "00:42",
      duration: "01:18",
      focus: "Medication incidents, CLABSI threshold, and pathway deviations.",
    },
    {
      id: "chapter-003",
      title: "Operational Flow",
      startTime: "02:00",
      duration: "00:58",
      focus: "Bed occupancy, discharge delays, ER boarding, and OT utilization.",
    },
    {
      id: "chapter-004",
      title: "Financial Trend Spotlight",
      startTime: "02:58",
      duration: "00:48",
      focus: "Claims denial movement, revenue at risk, accountable owner, and recovery action.",
    },
    {
      id: "chapter-005",
      title: "Compliance Exposure",
      startTime: "03:46",
      duration: "01:20",
      focus: "Overdue audit evidence, accreditation readiness, and procurement controls.",
    },
  ],
  scriptPreview:
    "Good morning. Riverside's governance score is 82, placing the hospital at moderate risk. The most time-sensitive risks are medication safety escalation in medical wards, infection control review in ICU, claims denial leakage in Cardiology, and delayed audit evidence for accreditation readiness.",
  narrativeScenes: [
    {
      id: "scene-001",
      type: "scorecard",
      durationInFrames: 150,
      voiceover:
        "Riverside's daily governance score is 82, with moderate risk driven by safety, compliance, and flow signals.",
      visual: {
        headline: "Governance Score 82",
        metric: "Moderate Risk",
        accent: "amber",
      },
    },
    {
      id: "scene-002",
      type: "alert-stack",
      durationInFrames: 210,
      voiceover:
        "Medication incidents increased by 31 percent and infection control surveillance crossed the internal review threshold.",
      visual: {
        alertIds: ["alert-001", "alert-003"],
        layout: "priority-stack",
      },
    },
    {
      id: "scene-003",
      type: "flow-map",
      durationInFrames: 180,
      voiceover:
        "Discharge delays are constraining beds, contributing to ER boarding and delayed elective admissions.",
      visual: {
        departments: ["Medical Ward", "Bed Management", "Emergency"],
        linkedAlertId: "alert-005",
      },
    },
    {
      id: "scene-004",
      type: "financial-trend",
      durationInFrames: 180,
      voiceover:
        "The financial trend spotlight is claims denial leakage. Cardiology denial rate increased from 6.4 percent to 9.1 percent yesterday, with one high-value denial carrying 42,000 dollars of recoverable revenue at risk. The finance action is to confirm the authorization and documentation mismatch and assign recovery ownership before tomorrow's checkpoint.",
      visual: {
        trendId: "financial-trend",
        metric: "Denial rate 9.1%",
        revenueAtRisk: "$42,000",
        owner: "Chief Financial Officer",
      },
    },
    {
      id: "scene-005",
      type: "action-summary",
      durationInFrames: 180,
      voiceover:
        "Leadership attention should focus on immediate safety huddles, revenue cycle denial recovery, and audit evidence closure.",
      visual: {
        actionIds: ["action-001", "action-002", "action-004"],
        closingLabel: "Priority actions due today",
      },
    },
  ],
};
