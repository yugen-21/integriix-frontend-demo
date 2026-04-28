import { interpolate, useCurrentFrame, useVideoConfig, spring } from "remotion";

/* ── Animated Gauge ──────────────────────────────────────── */
export function AnimatedGauge({ value, size = 340 }) {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [0, 70], [0, value / 100], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const r = size * 0.36, circ = 2 * Math.PI * r, h = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={h} cy={h} r={r} fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.16)" strokeWidth={28} />
      <circle cx={h} cy={h} r={r} fill="transparent" stroke="#22d3ee"
        strokeDasharray={`${circ * progress} ${circ}`} strokeLinecap="round" strokeWidth={28}
        transform={`rotate(-90 ${h} ${h})`} />
      <circle cx={h} cy={h} r={r * 0.68} fill="rgba(7,27,51,0.82)" />
      <text x={h} y={h - 6} fill="#fff" fontSize={size * 0.19} fontWeight={900} textAnchor="middle" dominantBaseline="central">
        {Math.round(progress * 100)}
      </text>
      <text x={h} y={h + size * 0.11} fill="#a5f3fc" fontSize={size * 0.065} fontWeight={800} textAnchor="middle">SCORE</text>
    </svg>
  );
}

/* ── Radar Chart ─────────────────────────────────────────── */
export function RadarChart({ dimensions, size = 380 }) {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [10, 80], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const h = size / 2, r = size * 0.38, n = dimensions.length;
  const angle = (i) => (Math.PI * 2 * i) / n - Math.PI / 2;

  const gridLevels = [0.25, 0.5, 0.75, 1];
  const points = dimensions.map((d, i) => {
    const a = angle(i), val = (d.score / 100) * r * progress;
    return [h + Math.cos(a) * val, h + Math.sin(a) * val];
  });
  const poly = points.map((p) => p.join(",")).join(" ");

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {gridLevels.map((lv) => (
        <polygon key={lv} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={1}
          points={dimensions.map((_, i) => `${h + Math.cos(angle(i)) * r * lv},${h + Math.sin(angle(i)) * r * lv}`).join(" ")} />
      ))}
      {dimensions.map((_, i) => (
        <line key={i} x1={h} y1={h} x2={h + Math.cos(angle(i)) * r} y2={h + Math.sin(angle(i)) * r}
          stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
      ))}
      <polygon points={poly} fill="rgba(34,211,238,0.18)" stroke="#22d3ee" strokeWidth={3} />
      {dimensions.map((d, i) => {
        const a = angle(i), labelR = r + 28;
        const color = d.ragStatus === "Red" ? "#fca5a5" : d.ragStatus === "Amber" ? "#fcd34d" : "#67e8f9";
        return (
          <g key={d.id}>
            <circle cx={points[i][0]} cy={points[i][1]} r={6} fill="#22d3ee" opacity={progress} />
            <text x={h + Math.cos(a) * labelR} y={h + Math.sin(a) * labelR}
              fill={color} fontSize={14} fontWeight={800} textAnchor="middle" dominantBaseline="central">
              {d.label.split("/")[0].trim()}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ── Waterfall Chart ─────────────────────────────────────── */
export function WaterfallChart({ drivers, direction = "down", width = 700, height = 300 }) {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [8, 80], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const barW = Math.min(120, (width - 40) / drivers.length - 20);
  const maxImpact = Math.max(...drivers.map((d) => Math.abs(parseInt(d.impact))));
  const barColor = direction === "down"
    ? "linear-gradient(180deg,#fca5a5,#ef4444)"
    : "linear-gradient(0deg,#86efac,#22c55e)";

  return (
    <div style={{ width, height, position: "relative", display: "flex", alignItems: "flex-end", gap: 20, justifyContent: "center" }}>
      {/* baseline */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "rgba(255,255,255,0.1)" }} />
      {drivers.map((d, i) => {
        const reveal = interpolate(frame, [i * 18, i * 18 + 50], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const val = Math.abs(parseInt(d.impact));
        const barH = (val / maxImpact) * (height - 60) * reveal;
        return (
          <div key={d.title} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, opacity: reveal }}>
            <div style={{ color: direction === "down" ? "#fca5a5" : "#86efac", fontSize: 28, fontWeight: 900 }}>{d.impact}</div>
            <div style={{ width: barW, height: barH, background: barColor, borderRadius: "12px 12px 4px 4px", position: "relative" }}>
              <div style={{
                position: "absolute", inset: 0, borderRadius: "inherit",
                background: "linear-gradient(90deg,rgba(255,255,255,0.15),transparent)",
              }} />
            </div>
            <div style={{ color: "#94a3b8", fontSize: 16, fontWeight: 700, textAlign: "center", maxWidth: barW + 20 }}>
              {d.dimension.split("/")[0].trim()}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Severity Heat Grid ──────────────────────────────────── */
export function SeverityHeatGrid({ alerts }) {
  const frame = useCurrentFrame();
  const cols = { Critical: "#ef4444", High: "#f59e0b", Medium: "#3b82f6" };
  const cellSize = 90;

  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(alerts.length, 3)}, ${cellSize}px)`, gap: 12 }}>
      {alerts.map((a, i) => {
        const pulse = interpolate((frame + i * 10) % 60, [0, 30, 60], [0.6, 1, 0.6]);
        const bg = cols[a.severity] ?? "#64748b";
        return (
          <div key={a.id} style={{
            width: cellSize, height: cellSize, borderRadius: 18,
            background: `${bg}33`, border: `2px solid ${bg}`,
            display: "grid", placeItems: "center", opacity: pulse,
          }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: bg }}>
                {a.severity === "Critical" ? "!!" : a.severity === "High" ? "!" : "~"}
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#bae6fd", marginTop: 4 }}>
                {a.location}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Timeline Visual ─────────────────────────────────────── */
export function TimelineVisual({ deadlines, width = 700 }) {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [0, 90], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const h = 120, nodeR = 18;
  const gap = deadlines.length > 1 ? (width - 80) / (deadlines.length - 1) : 0;
  const readinessColor = { "At Risk": "#ef4444", Blocked: "#dc2626", Watch: "#f59e0b", "On Track": "#22c55e" };

  return (
    <svg width={width} height={h} viewBox={`0 0 ${width} ${h}`}>
      {/* track line */}
      <line x1={40} y1={h / 2} x2={40 + (width - 80) * progress} y2={h / 2}
        stroke="rgba(14,165,233,0.3)" strokeWidth={4} strokeLinecap="round" />
      <line x1={40} y1={h / 2} x2={40 + (width - 80) * progress} y2={h / 2}
        stroke="#0ea5e9" strokeWidth={4} strokeLinecap="round"
        strokeDasharray="12 8" />
      {deadlines.map((d, i) => {
        const x = 40 + gap * i;
        const reveal = interpolate(frame, [i * 16 + 10, i * 16 + 40], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const c = readinessColor[d.readinessStatus] ?? "#64748b";
        return (
          <g key={d.id} opacity={reveal}>
            <circle cx={x} cy={h / 2} r={nodeR + 6} fill={`${c}22`} />
            <circle cx={x} cy={h / 2} r={nodeR} fill={c} stroke="#fff" strokeWidth={3} />
            <text x={x} y={h / 2 + 1} fill="#fff" fontSize={14} fontWeight={900} textAnchor="middle" dominantBaseline="central">
              {d.time}
            </text>
            <text x={x} y={h / 2 - nodeR - 12} fill="#0e7490" fontSize={13} fontWeight={700} textAnchor="middle">
              {d.title.length > 22 ? d.title.slice(0, 20) + "…" : d.title}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ── Voiceover Caption ───────────────────────────────────── */
export function VoiceoverCaption({ text, variant = "dark", entranceBuffer = 60 }) {
  const frame = useCurrentFrame();
  const words = text.split(/\s+/).filter(Boolean);
  // Narration starts after entrance buffer, ends before exit buffer (30 frames)
  const totalNarrationFrames = words.length * 12; // ~138 WPM at 30fps ≈ 12 frames/word
  const wordsVisible = Math.floor(
    interpolate(frame, [entranceBuffer, entranceBuffer + totalNarrationFrames], [0, words.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );

  if (wordsVisible === 0) return null;

  // Show a sliding window of ~18 words for readability
  const windowSize = 18;
  const windowStart = Math.max(0, wordsVisible - windowSize);
  const visibleWords = words.slice(windowStart, wordsVisible);

  const isDark = variant === "dark";

  return (
    <div
      style={{
        position: "absolute",
        bottom: 56,
        left: 80,
        right: 80,
        background: isDark ? "rgba(7,27,51,0.88)" : "rgba(255,255,255,0.92)",
        backdropFilter: "blur(12px)",
        borderRadius: 20,
        padding: "20px 32px",
        border: `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "rgba(14,116,144,0.15)"}`,
        display: "flex",
        alignItems: "center",
        gap: 16,
      }}
    >
      {/* waveform icon */}
      <div style={{ display: "flex", gap: 3, alignItems: "center", flexShrink: 0 }}>
        {[14, 22, 18, 26, 16].map((h, i) => {
          const bounce = interpolate((frame + i * 6) % 30, [0, 15, 30], [0.4, 1, 0.4]);
          return (
            <div
              key={i}
              style={{
                width: 4,
                height: h * bounce,
                borderRadius: 2,
                background: isDark ? "#22d3ee" : "#0891b2",
              }}
            />
          );
        })}
      </div>
      <p
        style={{
          fontSize: 24,
          fontWeight: 600,
          lineHeight: 1.5,
          color: isDark ? "#e2e8f0" : "#1e293b",
          margin: 0,
        }}
      >
        {visibleWords.join(" ")}
        <span
          style={{
            display: "inline-block",
            width: 3,
            height: 22,
            background: isDark ? "#22d3ee" : "#0891b2",
            marginLeft: 4,
            verticalAlign: "middle",
            opacity: interpolate(frame % 30, [0, 15, 30], [0, 1, 0]),
          }}
        />
      </p>
      {/* progress */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, borderRadius: "0 0 20px 20px", overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            width: `${(wordsVisible / words.length) * 100}%`,
            background: isDark ? "linear-gradient(90deg,#22d3ee,#0891b2)" : "linear-gradient(90deg,#0891b2,#0e7490)",
            borderRadius: "0 0 20px 20px",
          }}
        />
      </div>
    </div>
  );
}

/* ── Hospital Flow Network ───────────────────────────────── */
export function HospitalFlowNetwork({ alerts }) {
  const frame = useCurrentFrame();
  const pulse = interpolate(frame % 60, [0, 30, 60], [0.4, 1, 0.4]);
  const nodes = alerts.slice(0, 4).map((a, i) => {
    const cols = ["#ef4444", "#f59e0b", "#06b6d4", "#22c55e"];
    const positions = [[120, 120], [340, 80], [560, 140], [400, 260]];
    return { label: a.location, x: positions[i][0], y: positions[i][1], color: cols[i] };
  });

  return (
    <svg width={680} height={340} viewBox="0 0 680 340">
      {nodes.slice(0, -1).map((n, i) => {
        const next = nodes[i + 1];
        return (
          <line key={i} x1={n.x} y1={n.y} x2={next.x} y2={next.y}
            stroke="rgba(255,255,255,0.15)" strokeWidth={4} strokeDasharray="8 6" />
        );
      })}
      {nodes.map((n) => (
        <g key={n.label}>
          <circle cx={n.x} cy={n.y} r={52} fill={n.color} opacity={pulse * 0.25} />
          <circle cx={n.x} cy={n.y} r={42} fill="rgba(15,23,42,0.88)" stroke={n.color} strokeWidth={4} />
          <text x={n.x} y={n.y + 5} fill="#fff" fontSize={16} fontWeight={900} textAnchor="middle">{n.label}</text>
        </g>
      ))}
    </svg>
  );
}
