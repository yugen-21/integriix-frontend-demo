import { mockDailyBriefData } from "../data";

export const DAILY_BRIEF_FPS = 30;
export const DAILY_BRIEF_WIDTH = 1920;
export const DAILY_BRIEF_HEIGHT = 1080;

const WORDS_PER_MINUTE = 138;
const ENTRANCE_BUFFER_FRAMES = 60; // 2s for animations before narration starts
const EXIT_BUFFER_FRAMES = 30;     // 1s pause after narration ends

function voiceoverDuration(text, fps = DAILY_BRIEF_FPS) {
  const words = text.split(/\s+/).filter(Boolean).length;
  const speakingFrames = Math.ceil((words / WORDS_PER_MINUTE) * 60 * fps);
  return speakingFrames + ENTRANCE_BUFFER_FRAMES + EXIT_BUFFER_FRAMES;
}

export function buildDailyBriefNarrative() {
  const { meta, organizationStatus, criticalAlertsToday, upcomingDeadlines } = mockDailyBriefData;

  const todayDeadlines = upcomingDeadlines.filter((d) => {
    const dl = new Date(d.date);
    const br = new Date(meta.generatedAt);
    return dl.toDateString() === br.toDateString();
  });

  const topAlerts = criticalAlertsToday.slice(0, 5);

  const actionsFromAlerts = topAlerts
    .filter((a) => a.requiredAction)
    .slice(0, 4)
    .map((a, i) => ({
      id: `action-${i}`,
      title: a.requiredAction,
      owner: a.owner,
      due: a.due,
      severity: a.severity,
      linkedAlert: a.title,
    }));

  const dateStr = new Date(meta.generatedAt).toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  const scenes = [
    {
      id: "scene-title",
      type: "title",
      eyebrow: "C-Suite Daily Brief",
      title: meta.organizationName,
      subtitle: meta.period,
      date: dateStr,
      audience: meta.audience,
      briefOwner: meta.briefOwner,
      score: organizationStatus.score,
      ragStatus: organizationStatus.ragStatus,
      executiveSummary: organizationStatus.executiveSummary,
      dimensions: organizationStatus.dimensions,
      voiceover: `Good morning. This is the daily governance brief for ${meta.organizationName}. Today is ${dateStr}. The current governance score is ${organizationStatus.score} out of 100, placing the organization at ${organizationStatus.ragStatus} status. ${organizationStatus.executiveSummary}`,
    },
    {
      id: "scene-drivers-down",
      type: "driversDown",
      eyebrow: "Pulling the Score Down",
      title: "What needs attention",
      drivers: organizationStatus.driversPullingDown,
      voiceover: `The score is being pulled down by the following factors. ${organizationStatus.driversPullingDown.map((d) => `${d.title}, impacting the ${d.dimension} dimension by ${d.impact}. ${d.reason}`).join(" ")}`,
    },
    {
      id: "scene-drivers-up",
      type: "driversUp",
      eyebrow: "Pushing the Score Up",
      title: "What is improving",
      drivers: organizationStatus.driversPushingUp,
      voiceover: `On the positive side, there are improvements to highlight. ${organizationStatus.driversPushingUp.map((d) => `${d.title}, contributing ${d.impact} to ${d.dimension}. ${d.reason}`).join(" ")}`,
    },
    {
      id: "scene-alerts",
      type: "alerts",
      eyebrow: "Critical Alerts",
      title: "Requiring leadership attention today",
      alerts: topAlerts.map((a) => ({
        id: a.id, title: a.title, severity: a.severity, location: a.location,
        owner: a.owner, summary: a.summary, due: a.due, sourceModule: a.sourceModule,
      })),
      voiceover: `There are ${topAlerts.length} critical alerts requiring leadership attention. ${topAlerts.slice(0, 3).map((a) => `${a.title} in ${a.location}, severity ${a.severity}. ${a.summary}`).join(" ")}`,
    },
    {
      id: "scene-due-today",
      type: "dueToday",
      eyebrow: "Due Today",
      title: "Deadlines requiring completion",
      deadlines: todayDeadlines.map((d) => ({
        id: d.id, title: d.title, type: d.type, owner: d.owner,
        readinessStatus: d.readinessStatus, blockers: d.blockers,
        consequenceOfDelay: d.consequenceOfDelay,
        time: new Date(d.date).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
      })),
      voiceover: `${todayDeadlines.length} deadlines require completion today. ${todayDeadlines.map((d) => `${d.title}, due at ${new Date(d.date).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}. Current readiness is ${d.readinessStatus}. ${d.consequenceOfDelay}`).join(" ")}`,
    },
    {
      id: "scene-actions",
      type: "actions",
      eyebrow: "Leadership Actions",
      title: "What to do next",
      actions: actionsFromAlerts,
      voiceover: `The following leadership actions are recommended. ${actionsFromAlerts.map((a, i) => `Action ${i + 1}: ${a.title}. Owner: ${a.owner}. Due: ${a.due}.`).join(" ")}`,
    },
    {
      id: "scene-closing",
      type: "closing",
      eyebrow: "End of Brief",
      title: "Focus the day on safety, readiness, and flow.",
      subtitle: `Briefing generated at ${new Date(meta.generatedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`,
      score: organizationStatus.score,
      ragStatus: organizationStatus.ragStatus,
      briefOwner: meta.briefOwner,
      voiceover: "This concludes the executive briefing. Focus today on medication safety escalation, accreditation evidence closure, operational throughput, and revenue protection. Thank you.",
    },
  ];

  // Calculate each scene's duration from its voiceover length
  return scenes.map((scene) => ({
    ...scene,
    durationInFrames: voiceoverDuration(scene.voiceover),
  }));
}

export const dailyBriefNarrative = buildDailyBriefNarrative();

export function getDailyBriefDurationInFrames(narrative = dailyBriefNarrative) {
  return narrative.reduce((total, s) => total + s.durationInFrames, 0);
}
