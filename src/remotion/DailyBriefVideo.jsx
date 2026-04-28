import {
  AbsoluteFill,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { DAILY_BRIEF_FPS } from "./narrativeBuilder";

function SceneFrame({ eyebrow, title, children, variant = "default" }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const entrance = spring({
    frame,
    fps,
    config: { damping: 18, stiffness: 95 },
  });
  const opacity = interpolate(frame, [0, 24], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background:
          variant === "light"
            ? "linear-gradient(135deg, #eff6ff 0%, #ffffff 52%, #ecfeff 100%)"
            : "linear-gradient(135deg, #071b33 0%, #0f3558 54%, #0f766e 100%)",
        color: variant === "light" ? "#0f172a" : "#ffffff",
        fontFamily:
          "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
        padding: 92,
      }}
    >
      <div
        style={{
          border: "1px solid rgba(14, 116, 144, 0.16)",
          borderRadius: "50%",
          height: 520,
          opacity: variant === "light" ? 0.28 : 0.18,
          position: "absolute",
          right: -120,
          top: -120,
          width: 520,
        }}
      />
      <div
        style={{
          background:
            variant === "light"
              ? "rgba(14, 165, 233, 0.08)"
              : "rgba(125, 211, 252, 0.08)",
          borderRadius: "50%",
          bottom: -220,
          height: 620,
          left: -180,
          position: "absolute",
          width: 620,
        }}
      />
      <div
        style={{
          opacity,
          transform: `translateY(${(1 - entrance) * 26}px)`,
          position: "relative",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            borderRadius: 999,
            border: "1px solid rgba(255,255,255,0.24)",
            background:
              variant === "light"
                ? "rgba(14, 116, 144, 0.1)"
                : "rgba(255,255,255,0.12)",
            color: variant === "light" ? "#0e7490" : "#a5f3fc",
            fontSize: 28,
            fontWeight: 800,
            letterSpacing: 0,
            padding: "14px 24px",
            textTransform: "uppercase",
          }}
        >
          {eyebrow}
        </div>
        <h1
          style={{
            fontSize: 82,
            lineHeight: 1,
            letterSpacing: 0,
            margin: "38px 0 0",
            maxWidth: 1260,
          }}
        >
          {title}
        </h1>
        {children}
      </div>
    </AbsoluteFill>
  );
}

function AnimatedGauge({ value }) {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [0, 70], [0, value / 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const radius = 150;
  const circumference = 2 * Math.PI * radius;

  return (
    <svg width="420" height="420" viewBox="0 0 420 420">
      <circle
        cx="210"
        cy="210"
        r={radius}
        fill="rgba(255,255,255,0.08)"
        stroke="rgba(255,255,255,0.16)"
        strokeWidth="36"
      />
      <circle
        cx="210"
        cy="210"
        r={radius}
        fill="transparent"
        stroke="#22d3ee"
        strokeDasharray={`${circumference * progress} ${circumference}`}
        strokeLinecap="round"
        strokeWidth="36"
        transform="rotate(-90 210 210)"
      />
      <circle cx="210" cy="210" r="104" fill="rgba(7,27,51,0.82)" />
      <text
        x="210"
        y="198"
        fill="#ffffff"
        fontSize="84"
        fontWeight="900"
        textAnchor="middle"
      >
        {Math.round(progress * 100)}
      </text>
      <text
        x="210"
        y="246"
        fill="#a5f3fc"
        fontSize="28"
        fontWeight="800"
        textAnchor="middle"
      >
        SCORE
      </text>
    </svg>
  );
}

function SignalLineChart({ tone = "dark" }) {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [20, 110], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const points = [
    [0, 210],
    [160, 178],
    [320, 190],
    [480, 122],
    [640, 144],
    [800, 74],
  ];
  const path = points
    .map(([x, y], index) => `${index === 0 ? "M" : "L"} ${x} ${y}`)
    .join(" ");

  return (
    <svg width="900" height="310" viewBox="0 0 900 310">
      {[60, 130, 200, 270].map((y) => (
        <line
          key={y}
          x1="0"
          x2="860"
          y1={y}
          y2={y}
          stroke={tone === "dark" ? "rgba(255,255,255,0.12)" : "#dbeafe"}
          strokeWidth="2"
        />
      ))}
      <path
        d={path}
        fill="none"
        stroke="#06b6d4"
        strokeDasharray="980"
        strokeDashoffset={980 * (1 - progress)}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="12"
      />
      {points.map(([x, y], index) => (
        <circle
          key={`${x}-${y}`}
          cx={x}
          cy={y}
          fill={index > 2 ? "#f59e0b" : "#22d3ee"}
          opacity={progress > index / points.length ? 1 : 0}
          r="13"
        />
      ))}
      <text
        x="0"
        y="302"
        fill={tone === "dark" ? "#bae6fd" : "#0e7490"}
        fontSize="24"
        fontWeight="800"
      >
        Daily governance signal trend
      </text>
    </svg>
  );
}

function RiskBars({ alerts }) {
  const frame = useCurrentFrame();
  const severityValues = { Critical: 96, High: 82, Medium: 58 };

  return (
    <div style={{ display: "grid", gap: 26, width: 760 }}>
      {alerts.map((alert, index) => {
        const width = interpolate(
          frame,
          [index * 12, 70 + index * 12],
          [0, severityValues[alert.severity] ?? 52],
          {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          },
        );

        return (
          <div key={alert.id}>
            <div
              style={{
                alignItems: "center",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span style={{ color: "#ffffff", fontSize: 28, fontWeight: 900 }}>
                {alert.department}
              </span>
              <span style={{ color: "#bae6fd", fontSize: 22, fontWeight: 800 }}>
                {alert.severity}
              </span>
            </div>
            <div
              style={{
                background: "rgba(255,255,255,0.12)",
                borderRadius: 999,
                height: 34,
                marginTop: 12,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  background:
                    alert.severity === "Critical"
                      ? "linear-gradient(90deg,#fb7185,#ef4444)"
                      : "linear-gradient(90deg,#22d3ee,#f59e0b)",
                  borderRadius: 999,
                  height: "100%",
                  width: `${width}%`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function HospitalFlowVisual() {
  const frame = useCurrentFrame();
  const pulse = interpolate(frame % 60, [0, 30, 60], [0.35, 1, 0.35]);
  const nodes = [
    ["ICU", 160, 170, "#ef4444"],
    ["Medical Wards", 410, 110, "#f59e0b"],
    ["Bed Mgmt", 680, 190, "#06b6d4"],
    ["Revenue", 500, 360, "#22c55e"],
  ];

  return (
    <svg width="860" height="500" viewBox="0 0 860 500">
      <path
        d="M190 170 C280 120, 320 120, 380 120"
        fill="none"
        stroke="rgba(255,255,255,0.18)"
        strokeWidth="8"
      />
      <path
        d="M455 135 C540 150, 590 175, 650 190"
        fill="none"
        stroke="rgba(255,255,255,0.18)"
        strokeWidth="8"
      />
      <path
        d="M665 225 C615 300, 560 340, 520 355"
        fill="none"
        stroke="rgba(255,255,255,0.18)"
        strokeWidth="8"
      />
      {nodes.map(([label, x, y, color]) => (
        <g key={label}>
          <circle cx={x} cy={y} fill={color} opacity={pulse} r="72" />
          <circle
            cx={x}
            cy={y}
            fill="rgba(15,23,42,0.88)"
            stroke={color}
            strokeWidth="6"
            r="58"
          />
          <text
            x={x}
            y={y + 8}
            fill="#ffffff"
            fontSize="24"
            fontWeight="900"
            textAnchor="middle"
          >
            {label}
          </text>
        </g>
      ))}
    </svg>
  );
}

function ActionTimeline({ actions }) {
  const frame = useCurrentFrame();

  return (
    <div
      style={{
        display: "grid",
        gap: 34,
        gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
        position: "relative",
      }}
    >
      <div
        style={{
          background: "#bae6fd",
          height: 8,
          left: 120,
          position: "absolute",
          right: 120,
          top: 80,
        }}
      />
      {actions.map((action, index) => {
        const reveal = interpolate(frame, [index * 20, index * 20 + 40], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

        return (
          <div
            key={action.id}
            style={{
              opacity: reveal,
              position: "relative",
              transform: `translateY(${(1 - reveal) * 22}px)`,
            }}
          >
            <div
              style={{
                background: "#0891b2",
                border: "8px solid #e0f2fe",
                borderRadius: "50%",
                color: "#ffffff",
                display: "grid",
                fontSize: 38,
                fontWeight: 900,
                height: 112,
                margin: "24px auto 28px",
                placeItems: "center",
                position: "relative",
                width: 112,
                zIndex: 2,
              }}
            >
              {index + 1}
            </div>
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #dbeafe",
                borderRadius: 30,
                boxShadow: "0 18px 42px rgba(15, 23, 42, 0.08)",
                minHeight: 250,
                padding: "32px 28px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  color: "#0f172a",
                  fontSize: 31,
                  fontWeight: 900,
                  lineHeight: 1.12,
                }}
              >
                {action.title}
              </div>
              <div
                style={{
                  color: "#0f766e",
                  fontSize: 24,
                  fontWeight: 900,
                  lineHeight: 1.22,
                  marginTop: 26,
                }}
              >
                {action.owner}
              </div>
              <div
                style={{
                  color: "#64748b",
                  fontSize: 24,
                  fontWeight: 800,
                  marginTop: 10,
                }}
              >
                {action.due}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TitleScene({ scene }) {
  return (
    <SceneFrame eyebrow={scene.eyebrow} title={scene.title}>
      <p style={{ color: "#bae6fd", fontSize: 42, marginTop: 34 }}>
        {scene.subtitle}
      </p>
      <div
        style={{
          alignItems: "center",
          display: "flex",
          gap: 72,
          marginTop: 54,
        }}
      >
        <AnimatedGauge value={scene.score} />
        <div>
          <div
            style={{
              background: "#fbbf24",
              borderRadius: 999,
              color: "#422006",
              display: "inline-flex",
              fontSize: 34,
              fontWeight: 900,
              padding: "24px 34px",
            }}
          >
            {scene.status}
          </div>
          <div style={{ marginTop: 34 }}>
            <SignalLineChart />
          </div>
        </div>
      </div>
      <p style={{ color: "#cbd5e1", fontSize: 30, marginTop: 64 }}>
        {scene.meta}
      </p>
    </SceneFrame>
  );
}

function SummaryScene({ scene }) {
  return (
    <SceneFrame eyebrow={scene.eyebrow} title={scene.title} variant="light">
      <div
        style={{
          display: "grid",
          gap: 52,
          gridTemplateColumns: "860px 1fr",
          marginTop: 44,
          alignItems: "center",
        }}
      >
        <SignalLineChart tone="light" />
        <div>
          <p
            style={{
              color: "#475569",
              fontSize: 34,
              lineHeight: 1.45,
              margin: 0,
            }}
          >
            {scene.body}
          </p>
          <div style={{ display: "grid", gap: 18, marginTop: 36 }}>
            {scene.bullets.slice(0, 3).map((bullet, index) => (
              <div
                key={bullet}
                style={{
                  alignItems: "center",
                  display: "grid",
                  gap: 18,
                  gridTemplateColumns: "42px 1fr",
                }}
              >
                <span
                  style={{
                    background: "#0891b2",
                    borderRadius: "50%",
                    color: "#ffffff",
                    display: "grid",
                    fontSize: 22,
                    fontWeight: 900,
                    height: 42,
                    placeItems: "center",
                    width: 42,
                  }}
                >
                  {index + 1}
                </span>
                <span
                  style={{
                    color: "#0f172a",
                    fontSize: 28,
                    fontWeight: 800,
                    lineHeight: 1.28,
                  }}
                >
                  {bullet}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SceneFrame>
  );
}

function AlertsScene({ scene }) {
  return (
    <SceneFrame eyebrow={scene.eyebrow} title={scene.title}>
      <div
        style={{
          alignItems: "center",
          display: "grid",
          gap: 64,
          gridTemplateColumns: "760px 1fr",
          marginTop: 48,
        }}
      >
        <RiskBars alerts={scene.alerts} />
        <HospitalFlowVisual />
      </div>
      <div
        style={{
          display: "grid",
          gap: 18,
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          marginTop: 38,
        }}
      >
        {scene.alerts.map((alert) => (
          <div key={alert.id}>
            <div style={{ fontSize: 28, fontWeight: 900 }}>{alert.title}</div>
            <p
              style={{
                color: "#dbeafe",
                fontSize: 22,
                lineHeight: 1.3,
                marginTop: 10,
              }}
            >
              {alert.source} · Due {alert.due}
            </p>
          </div>
        ))}
      </div>
    </SceneFrame>
  );
}

function ActionsScene({ scene }) {
  return (
    <SceneFrame eyebrow={scene.eyebrow} title={scene.title} variant="light">
      <div style={{ marginTop: 70 }}>
        <ActionTimeline actions={scene.actions} />
      </div>
      <div
        style={{
          display: "grid",
          gap: 22,
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          marginTop: 10,
        }}
      >
        {scene.actions.map((action) => (
          <div key={action.id}>
            <div
              style={{
                alignItems: "center",
                display: "flex",
                gap: 14,
              }}
            >
              <span
                style={{
                  background:
                    action.priority === "Critical" ? "#fecaca" : "#fef3c7",
                  borderRadius: 999,
                  color: "#0f172a",
                  fontSize: 22,
                  fontWeight: 900,
                  padding: "9px 15px",
                }}
              >
                {action.priority}
              </span>
              <span style={{ color: "#0f172a", fontSize: 25, fontWeight: 900 }}>
                {action.title}
              </span>
            </div>
            <p
              style={{
                color: "#475569",
                fontSize: 22,
                lineHeight: 1.35,
                marginTop: 12,
              }}
            >
              {action.reason}
            </p>
          </div>
        ))}
      </div>
    </SceneFrame>
  );
}

function ClosingScene({ scene }) {
  return (
    <SceneFrame eyebrow={scene.eyebrow} title={scene.title}>
      <p style={{ color: "#bae6fd", fontSize: 38, marginTop: 42 }}>
        {scene.subtitle}
      </p>
      <div
        style={{
          background: "#dcfce7",
          borderRadius: 999,
          color: "#166534",
          display: "inline-flex",
          fontSize: 28,
          fontWeight: 900,
          marginTop: 54,
          padding: "16px 26px",
        }}
      >
        Briefing status: {scene.status}
      </div>
    </SceneFrame>
  );
}

function RenderScene({ scene }) {
  if (scene.type === "title") {
    return <TitleScene scene={scene} />;
  }

  if (scene.type === "summary") {
    return <SummaryScene scene={scene} />;
  }

  if (scene.type === "alerts") {
    return <AlertsScene scene={scene} />;
  }

  if (scene.type === "actions") {
    return <ActionsScene scene={scene} />;
  }

  return <ClosingScene scene={scene} />;
}

export function DailyBriefVideo({ narrative }) {
  const sequencedScenes = narrative.reduce(
    (items, scene) => {
      const previous = items.at(-1);
      const from = previous ? previous.from + previous.durationInFrames : 0;

      return [...items, { ...scene, from }];
    },
    [],
  );

  return (
    <AbsoluteFill>
      {sequencedScenes.map((scene) => (
        <Sequence
          key={scene.id}
          from={scene.from}
          durationInFrames={scene.durationInFrames}
        >
          <RenderScene scene={scene} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
}

DailyBriefVideo.defaultProps = {
  fps: DAILY_BRIEF_FPS,
};
