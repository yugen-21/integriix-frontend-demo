import { AbsoluteFill, Audio, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { AnimatedGauge, RadarChart, WaterfallChart, SeverityHeatGrid, TimelineVisual, HospitalFlowNetwork } from "./Visuals";
import { DAILY_BRIEF_VOICEOVER_START_FRAME } from "./narrativeBuilder";

/* ── Scene Frame ─────────────────────────────────────────── */

function SceneFrame({ eyebrow, title, children, variant = "dark" }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const entrance = spring({ frame, fps, config: { damping: 18, stiffness: 95 } });
  const opacity = interpolate(frame, [0, 24], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const isLight = variant === "light";

  return (
    <AbsoluteFill style={{
      background: isLight
        ? "linear-gradient(135deg,#eff6ff 0%,#ffffff 52%,#ecfeff 100%)"
        : "linear-gradient(135deg,#071b33 0%,#0f3558 54%,#0f766e 100%)",
      color: isLight ? "#0f172a" : "#ffffff",
      fontFamily: "Inter,ui-sans-serif,system-ui,sans-serif",
      padding: 80,
    }}>
      <div style={{ border: "1px solid rgba(14,116,144,0.16)", borderRadius: "50%", height: 520, opacity: 0.18, position: "absolute", right: -120, top: -120, width: 520 }} />
      <div style={{ background: isLight ? "rgba(14,165,233,0.08)" : "rgba(125,211,252,0.08)", borderRadius: "50%", bottom: -220, height: 620, left: -180, position: "absolute", width: 620 }} />
      <div style={{ opacity, transform: `translateY(${(1 - entrance) * 26}px)`, position: "relative" }}>
        <div style={{
          display: "inline-flex", borderRadius: 999,
          border: `1px solid ${isLight ? "rgba(14,116,144,0.2)" : "rgba(255,255,255,0.24)"}`,
          background: isLight ? "rgba(14,116,144,0.1)" : "rgba(255,255,255,0.12)",
          color: isLight ? "#0e7490" : "#a5f3fc",
          fontSize: 24, fontWeight: 800, letterSpacing: 1, padding: "12px 22px", textTransform: "uppercase",
        }}>{eyebrow}</div>
        <h1 style={{ fontSize: 68, lineHeight: 1.05, margin: "28px 0 0", maxWidth: 1300 }}>{title}</h1>
        {children}
      </div>
    </AbsoluteFill>
  );
}

/* ── 1. Title Scene ──────────────────────────────────────── */

function TitleScene({ scene }) {
  const ragBg = scene.ragStatus === "Red" ? "#ef4444" : scene.ragStatus === "Green" ? "#22c55e" : "#fbbf24";
  const ragFg = scene.ragStatus === "Amber" ? "#422006" : "#fff";

  return (
    <SceneFrame eyebrow={scene.eyebrow} title={scene.title} voiceover={scene.voiceover}>
      <p style={{ color: "#bae6fd", fontSize: 30, margin: "6px 0 0" }}>{scene.subtitle}</p>
      <p style={{ color: "#94a3b8", fontSize: 22, margin: "4px 0 0" }}>{scene.date} · {scene.briefOwner}</p>
      <div style={{ display: "grid", gridTemplateColumns: "340px 380px 1fr", gap: 40, marginTop: 32, alignItems: "center" }}>
        <div style={{ textAlign: "center" }}>
          <AnimatedGauge value={scene.score} />
          <div style={{ background: ragBg, borderRadius: 999, color: ragFg, display: "inline-flex", fontSize: 22, fontWeight: 900, marginTop: 12, padding: "10px 24px" }}>
            {scene.ragStatus} Status
          </div>
        </div>
        <RadarChart dimensions={scene.dimensions} />
        <div style={{ display: "grid", gap: 10 }}>
          {scene.dimensions.map((d) => {
            const c = d.ragStatus === "Red" ? "#fca5a5" : d.ragStatus === "Amber" ? "#fcd34d" : "#67e8f9";
            return (
              <div key={d.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 20, fontWeight: 700 }}>
                <span>{d.label}</span>
                <span style={{ color: c }}>{d.score}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </SceneFrame>
  );
}

/* ── 2. Drivers Down Scene ───────────────────────────────── */

function DriversDownScene({ scene }) {
  const frame = useCurrentFrame();
  return (
    <SceneFrame eyebrow={scene.eyebrow} title={scene.title} voiceover={scene.voiceover}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 700px", gap: 48, marginTop: 40, alignItems: "center" }}>
        <div style={{ display: "grid", gap: 28 }}>
          {scene.drivers.map((d, i) => {
            const reveal = interpolate(frame, [i * 18, i * 18 + 40], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            return (
              <div key={d.title} style={{
                opacity: reveal, transform: `translateX(${(1 - reveal) * 40}px)`,
                background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
                borderRadius: 20, padding: "24px 28px",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 28, fontWeight: 900 }}>{d.title}</span>
                  <span style={{ fontSize: 36, fontWeight: 900, color: "#fca5a5" }}>{d.impact}</span>
                </div>
                <p style={{ fontSize: 20, color: "#cbd5e1", lineHeight: 1.35, marginTop: 8 }}>{d.reason}</p>
                <span style={{ fontSize: 16, fontWeight: 700, color: "#f87171", marginTop: 6, display: "inline-block" }}>{d.dimension}</span>
              </div>
            );
          })}
        </div>
        <WaterfallChart drivers={scene.drivers} direction="down" />
      </div>
    </SceneFrame>
  );
}

/* ── 3. Drivers Up Scene ─────────────────────────────────── */

function DriversUpScene({ scene }) {
  const frame = useCurrentFrame();
  return (
    <SceneFrame eyebrow={scene.eyebrow} title={scene.title} voiceover={scene.voiceover}>
      <div style={{ display: "grid", gridTemplateColumns: "700px 1fr", gap: 48, marginTop: 40, alignItems: "center" }}>
        <WaterfallChart drivers={scene.drivers} direction="up" />
        <div style={{ display: "grid", gap: 28 }}>
          {scene.drivers.map((d, i) => {
            const reveal = interpolate(frame, [i * 18, i * 18 + 40], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            return (
              <div key={d.title} style={{
                opacity: reveal, transform: `translateX(${(reveal - 1) * -40}px)`,
                background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)",
                borderRadius: 20, padding: "24px 28px",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 28, fontWeight: 900 }}>{d.title}</span>
                  <span style={{ fontSize: 36, fontWeight: 900, color: "#86efac" }}>{d.impact}</span>
                </div>
                <p style={{ fontSize: 20, color: "#cbd5e1", lineHeight: 1.35, marginTop: 8 }}>{d.reason}</p>
                <span style={{ fontSize: 16, fontWeight: 700, color: "#4ade80", marginTop: 6, display: "inline-block" }}>{d.dimension}</span>
              </div>
            );
          })}
        </div>
      </div>
    </SceneFrame>
  );
}

/* ── 4. Alerts Scene ─────────────────────────────────────── */

function AlertsScene({ scene }) {
  const frame = useCurrentFrame();
  const sevColor = { Critical: "#ef4444", High: "#f59e0b", Medium: "#3b82f6" };

  return (
    <SceneFrame eyebrow={scene.eyebrow} title={scene.title} voiceover={scene.voiceover}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 40, marginTop: 36, alignItems: "start" }}>
        <div style={{ display: "grid", gap: 16 }}>
          {scene.alerts.map((a, i) => {
            const reveal = interpolate(frame, [i * 12, i * 12 + 32], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            const bg = sevColor[a.severity] ?? "#64748b";
            return (
              <div key={a.id} style={{
                opacity: reveal, transform: `translateY(${(1 - reveal) * 18}px)`,
                display: "grid", gridTemplateColumns: "6px 1fr auto", gap: 18,
                background: "rgba(255,255,255,0.06)", borderRadius: 18, padding: "18px 24px",
                border: "1px solid rgba(255,255,255,0.1)",
              }}>
                <div style={{ background: bg, borderRadius: 999 }} />
                <div>
                  <div style={{ fontSize: 24, fontWeight: 900 }}>{a.title}</div>
                  <p style={{ fontSize: 18, color: "#94a3b8", margin: "4px 0 0", lineHeight: 1.3 }}>{a.summary}</p>
                </div>
                <div style={{ textAlign: "right", minWidth: 150 }}>
                  <span style={{ background: `${bg}22`, border: `1px solid ${bg}66`, borderRadius: 999, color: bg, fontSize: 17, fontWeight: 900, padding: "5px 14px" }}>
                    {a.severity}
                  </span>
                  <div style={{ color: "#bae6fd", fontSize: 17, fontWeight: 700, marginTop: 8 }}>{a.location} · {a.due}</div>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ display: "grid", gap: 24 }}>
          <SeverityHeatGrid alerts={scene.alerts} />
          <HospitalFlowNetwork alerts={scene.alerts} />
        </div>
      </div>
    </SceneFrame>
  );
}

/* ── 5. Financial Trend Scene ────────────────────────────── */

function FinancialTrendScene({ scene }) {
  const frame = useCurrentFrame();
  const trend = scene.trend;
  const maxPoint = Math.max(...trend.points);
  const minPoint = Math.min(...trend.points);
  const pointRange = Math.max(maxPoint - minPoint, 1);

  return (
    <SceneFrame eyebrow={scene.eyebrow} title={scene.title} variant="light" voiceover={scene.voiceover}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 620px", gap: 44, marginTop: 38, alignItems: "stretch" }}>
        <div style={{ display: "grid", gap: 22 }}>
          {[
            { label: trend.metricLabel, value: trend.currentValue, detail: `${trend.movement} vs prior day`, tone: "#dc2626" },
            { label: "Revenue at risk", value: trend.revenueAtRisk, detail: `${trend.highValueDenials} high-value denial yesterday`, tone: "#0e7490" },
            { label: "Owner", value: trend.owner, detail: `Due ${trend.due}`, tone: "#0f172a" },
          ].map((item, i) => {
            const reveal = interpolate(frame, [i * 16, i * 16 + 36], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

            return (
              <div key={item.label} style={{
                opacity: reveal, transform: `translateX(${(1 - reveal) * 30}px)`,
                background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 22,
                padding: "26px 30px", boxShadow: "0 6px 24px rgba(15,23,42,0.05)",
              }}>
                <div style={{ color: "#64748b", fontSize: 18, fontWeight: 900, textTransform: "uppercase" }}>{item.label}</div>
                <div style={{ color: item.tone, fontSize: 54, fontWeight: 950, lineHeight: 1, marginTop: 10 }}>{item.value}</div>
                <div style={{ color: "#475569", fontSize: 22, fontWeight: 800, marginTop: 10 }}>{item.detail}</div>
              </div>
            );
          })}
        </div>

        <div style={{ background: "#0f172a", borderRadius: 28, color: "#fff", padding: 34 }}>
          <div style={{ color: "#67e8f9", fontSize: 18, fontWeight: 900, textTransform: "uppercase" }}>{trend.department} · {trend.sourceModule}</div>
          <div style={{ color: "#fff", fontSize: 30, fontWeight: 950, lineHeight: 1.15, marginTop: 10 }}>{trend.whatChanged}</div>
          <div style={{ display: "flex", alignItems: "end", gap: 12, height: 260, marginTop: 34 }}>
            {trend.points.map((point, i) => {
              const reveal = interpolate(frame, [30 + i * 10, 58 + i * 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
              const height = 70 + ((point - minPoint) / pointRange) * 180;

              return (
                <div key={`${point}-${i}`} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10, alignItems: "center", justifyContent: "end" }}>
                  <div style={{
                    background: i === trend.points.length - 1 ? "#f87171" : "#22d3ee",
                    borderRadius: "14px 14px 4px 4px", height: height * reveal, width: "100%",
                  }} />
                  <div style={{ color: "#94a3b8", fontSize: 15, fontWeight: 900 }}>D-{trend.points.length - i - 1}</div>
                </div>
              );
            })}
          </div>
          <div style={{
            background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 20, color: "#e2e8f0", fontSize: 22, fontWeight: 800,
            lineHeight: 1.35, marginTop: 28, padding: "22px 24px",
          }}>
            {trend.recommendedAction}
          </div>
        </div>
      </div>
    </SceneFrame>
  );
}

/* ── 5. Due Today Scene ──────────────────────────────────── */

function DueTodayScene({ scene }) {
  const frame = useCurrentFrame();
  const rc = { "At Risk": "#ef4444", Blocked: "#dc2626", Watch: "#f59e0b", "On Track": "#22c55e" };

  return (
    <SceneFrame eyebrow={scene.eyebrow} title={scene.title} variant="light" voiceover={scene.voiceover}>
      <div style={{ marginTop: 32 }}>
        <TimelineVisual deadlines={scene.deadlines} width={1700} />
      </div>
      <div style={{ display: "grid", gap: 20, marginTop: 28 }}>
        {scene.deadlines.map((d, i) => {
          const reveal = interpolate(frame, [i * 14 + 20, i * 14 + 54], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const c = rc[d.readinessStatus] ?? "#64748b";
          return (
            <div key={d.id} style={{
              opacity: reveal, transform: `translateX(${(1 - reveal) * 28}px)`,
              display: "grid", gridTemplateColumns: "90px 1fr auto", gap: 24,
              background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 20,
              padding: "22px 26px", boxShadow: "0 6px 24px rgba(15,23,42,0.05)",
            }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 34, fontWeight: 900, color: "#0f172a" }}>{d.time}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#64748b", marginTop: 2 }}>{d.type}</div>
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 900, color: "#0f172a" }}>{d.title}</div>
                <p style={{ fontSize: 18, color: "#64748b", margin: "4px 0 0", lineHeight: 1.3 }}>{d.consequenceOfDelay}</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                <span style={{ background: `${c}18`, border: `1px solid ${c}55`, borderRadius: 999, color: c, fontSize: 16, fontWeight: 900, padding: "5px 14px" }}>
                  {d.readinessStatus}
                </span>
                <span style={{ color: "#0e7490", fontSize: 18, fontWeight: 700 }}>{d.owner}</span>
              </div>
            </div>
          );
        })}
      </div>
    </SceneFrame>
  );
}

/* ── 6. Actions Scene ────────────────────────────────────── */

function ActionsScene({ scene }) {
  const frame = useCurrentFrame();
  const sc = { Critical: "#ef4444", High: "#f59e0b", Medium: "#3b82f6" };

  return (
    <SceneFrame eyebrow={scene.eyebrow} title={scene.title} variant="light" voiceover={scene.voiceover}>
      <div style={{ display: "grid", gap: 22, marginTop: 40 }}>
        {scene.actions.map((a, i) => {
          const reveal = interpolate(frame, [i * 18, i * 18 + 44], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <div key={a.id} style={{
              opacity: reveal, transform: `translateY(${(1 - reveal) * 22}px)`,
              display: "grid", gridTemplateColumns: "56px 1fr", gap: 22,
              background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 20,
              padding: "22px 28px", boxShadow: "0 6px 24px rgba(15,23,42,0.05)",
            }}>
              <div style={{
                background: "#0891b2", borderRadius: "50%", color: "#fff",
                display: "grid", fontSize: 26, fontWeight: 900, height: 56, placeItems: "center", width: 56,
              }}>{i + 1}</div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 900, color: "#0f172a", lineHeight: 1.2 }}>{a.title}</div>
                <div style={{ display: "flex", gap: 14, marginTop: 10, alignItems: "center", flexWrap: "wrap" }}>
                  <span style={{ color: "#0e7490", fontSize: 18, fontWeight: 800 }}>{a.owner}</span>
                  <span style={{ color: "#94a3b8" }}>·</span>
                  <span style={{ color: "#64748b", fontSize: 18, fontWeight: 700 }}>Due {a.due}</span>
                  <span style={{
                    background: `${sc[a.severity] ?? "#64748b"}18`, border: `1px solid ${sc[a.severity] ?? "#64748b"}55`,
                    borderRadius: 999, color: sc[a.severity] ?? "#64748b", fontSize: 15, fontWeight: 900, padding: "3px 12px",
                  }}>{a.severity}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </SceneFrame>
  );
}

/* ── 7. Closing Scene ────────────────────────────────────── */

function ClosingScene({ scene }) {
  const ragBg = scene.ragStatus === "Red" ? "#ef4444" : scene.ragStatus === "Green" ? "#22c55e" : "#fbbf24";

  return (
    <SceneFrame eyebrow={scene.eyebrow} title={scene.title} voiceover={scene.voiceover}>
      <p style={{ color: "#bae6fd", fontSize: 30, marginTop: 28 }}>{scene.subtitle}</p>
      <div style={{ display: "flex", gap: 28, marginTop: 44, alignItems: "center" }}>
        <AnimatedGauge value={scene.score} size={220} />
        <div>
          <div style={{ background: ragBg, borderRadius: 999, color: scene.ragStatus === "Amber" ? "#422006" : "#fff", display: "inline-flex", fontSize: 22, fontWeight: 900, padding: "10px 24px" }}>
            {scene.ragStatus} Status
          </div>
          <p style={{ color: "#cbd5e1", fontSize: 24, marginTop: 14 }}>Prepared for {scene.briefOwner}</p>
        </div>
      </div>
      <div style={{ background: "#dcfce7", borderRadius: 999, color: "#166534", display: "inline-flex", fontSize: 22, fontWeight: 900, marginTop: 44, padding: "12px 24px" }}>
        Briefing complete
      </div>
    </SceneFrame>
  );
}

/* ── Scene Router ────────────────────────────────────────── */

const sceneMap = { title: TitleScene, driversDown: DriversDownScene, driversUp: DriversUpScene, alerts: AlertsScene, financialTrend: FinancialTrendScene, dueToday: DueTodayScene, actions: ActionsScene, closing: ClosingScene };

function RenderScene({ scene }) {
  const C = sceneMap[scene.type] ?? ClosingScene;
  return <C scene={scene} />;
}

/* ── Main Composition ────────────────────────────────────── */

export function DailyBriefVideo({ narrative, audioBySceneId = {} }) {
  const sequenced = narrative.reduce((items, scene) => {
    const prev = items.at(-1);
    const from = prev ? prev.from + prev.durationInFrames : 0;
    return [...items, { ...scene, audioSrc: audioBySceneId[scene.id], from }];
  }, []);

  return (
    <AbsoluteFill>
      {sequenced.map((scene) => (
        <Sequence key={scene.id} from={scene.from} durationInFrames={scene.durationInFrames}>
          <RenderScene scene={scene} />
          {scene.audioSrc && (
            <Sequence from={DAILY_BRIEF_VOICEOVER_START_FRAME}>
              <Audio src={scene.audioSrc} />
            </Sequence>
          )}
        </Sequence>
      ))}
    </AbsoluteFill>
  );
}
