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
      title: "Financial and Compliance Exposure",
      startTime: "02:58",
      duration: "01:20",
      focus: "Claims denials, overdue audit evidence, and procurement controls.",
    },
  ],
  scriptPreview:
    "Good morning. Riverside's governance score is 82, placing the hospital at moderate risk. The most time-sensitive risks are medication safety escalation in medical wards, infection control review in ICU, and delayed audit evidence for accreditation readiness.",
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
      type: "action-summary",
      durationInFrames: 180,
      voiceover:
        "Leadership attention should focus on immediate safety huddles, audit evidence closure, and revenue cycle denial review.",
      visual: {
        actionIds: ["action-001", "action-002", "action-004"],
        closingLabel: "Priority actions due today",
      },
    },
  ],
};
