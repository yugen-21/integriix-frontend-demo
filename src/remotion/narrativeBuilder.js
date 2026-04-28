import {
  mockCriticalAlerts,
  mockDashboardMeta,
  mockPriorityActions,
  mockVideoBrief,
} from "../data";

export const DAILY_BRIEF_FPS = 30;
export const DAILY_BRIEF_WIDTH = 1920;
export const DAILY_BRIEF_HEIGHT = 1080;

const sceneDurations = {
  title: 150,
  summary: 210,
  alerts: 240,
  actions: 210,
  closing: 120,
};

export function buildDailyBriefNarrative() {
  const priorityAlerts = mockCriticalAlerts.slice(0, 3);
  const priorityActions = mockPriorityActions.slice(0, 3);

  return [
    {
      id: "brief-title",
      type: "title",
      durationInFrames: sceneDurations.title,
      eyebrow: "C-Suite Daily Brief",
      title: `Daily Governance Brief`,
      subtitle: mockDashboardMeta.hospitalName,
      meta: `${mockDashboardMeta.date} · ${mockDashboardMeta.role}`,
      status: mockDashboardMeta.overallStatus,
      score: mockDashboardMeta.governanceScore,
      voiceover: `Good morning. This is the daily governance brief for ${mockDashboardMeta.hospitalName}. The current governance score is ${mockDashboardMeta.governanceScore}, with an overall status of ${mockDashboardMeta.overallStatus}.`,
    },
    {
      id: "brief-summary",
      type: "summary",
      durationInFrames: sceneDurations.summary,
      eyebrow: "Executive Summary",
      title: mockVideoBrief.title,
      body: mockVideoBrief.executiveSummary,
      bullets: mockVideoBrief.briefingChapters.map((chapter) => chapter.focus),
      voiceover: mockVideoBrief.executiveSummary,
    },
    {
      id: "brief-alerts",
      type: "alerts",
      durationInFrames: sceneDurations.alerts,
      eyebrow: "Top Risk Signals",
      title: "Critical alerts requiring attention",
      alerts: priorityAlerts.map((alert) => ({
        id: alert.id,
        title: alert.title,
        severity: alert.severity,
        department: alert.department,
        source: alert.sourceSystem,
        description: alert.description,
        due: alert.due,
      })),
      voiceover: `The top risk signals requiring attention are ${priorityAlerts
        .map((alert) => `${alert.title} in ${alert.department}`)
        .join(", ")}.`,
    },
    {
      id: "brief-actions",
      type: "actions",
      durationInFrames: sceneDurations.actions,
      eyebrow: "Leadership Actions",
      title: "Recommended actions for today",
      actions: priorityActions.map((action) => ({
        id: action.id,
        title: action.title,
        owner: action.owner,
        due: action.due,
        priority: action.priority,
        reason: action.reason,
      })),
      voiceover: `Recommended leadership actions for today are ${priorityActions
        .map((action) => action.title)
        .join(", ")}.`,
    },
    {
      id: "brief-closing",
      type: "closing",
      durationInFrames: sceneDurations.closing,
      eyebrow: "Close",
      title: "Focus the day on safety, readiness, and flow.",
      subtitle: `Generated at ${mockDashboardMeta.generatedBriefingTime}`,
      status: mockVideoBrief.status,
      voiceover:
        "This concludes the executive briefing. Focus today on safety escalation, audit readiness, operational flow, and revenue protection.",
    },
  ];
}

export const dailyBriefNarrative = buildDailyBriefNarrative();

export function getDailyBriefDurationInFrames(narrative = dailyBriefNarrative) {
  return narrative.reduce((total, scene) => total + scene.durationInFrames, 0);
}
