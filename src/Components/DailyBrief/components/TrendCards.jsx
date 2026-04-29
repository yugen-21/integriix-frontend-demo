import {
  FaArrowTrendDown,
  FaArrowTrendUp,
  FaClockRotateLeft,
  FaFileShield,
  FaSackDollar,
  FaShieldHeart,
  FaWaveSquare,
} from "react-icons/fa6";

const trendCards = [
  {
    name: "Governance Health",
    trend: "+5 pts",
    description: "Governance health improved this week.",
    tone: "navy",
    Icon: FaWaveSquare,
  },
  {
    name: "Patient Safety",
    trend: "-8%",
    description: "Patient safety incidents decreased.",
    tone: "royal",
    Icon: FaShieldHeart,
  },
  {
    name: "Accreditation Readiness",
    trend: "+12%",
    description: "Accreditation readiness improved.",
    tone: "bright",
    Icon: FaFileShield,
  },
  {
    name: "Audit Response Time",
    trend: "-6 hrs",
    description: "Audit response time got faster.",
    tone: "sky",
    Icon: FaClockRotateLeft,
  },
  {
    name: "Denial Leakage",
    trend: "$42,000",
    description: "High-value denial from yesterday needs CFO review.",
    tone: "pale",
    Icon: FaSackDollar,
  },
];

const trendToneStyles = {
  navy: {
    accent: "#00357a",
    badgeBg: "#e8f1ff",
    iconBg: "#e8f1ff",
    text: "#00357a",
    ring: "#c2dcff",
  },
  royal: {
    accent: "#006dc2",
    badgeBg: "#e8f4ff",
    iconBg: "#e8f4ff",
    text: "#006dc2",
    ring: "#c2dcff",
  },
  bright: {
    accent: "#1f80ff",
    badgeBg: "#edf5ff",
    iconBg: "#edf5ff",
    text: "#1f80ff",
    ring: "#c2dcff",
  },
  sky: {
    accent: "#5ca3ff",
    badgeBg: "#f0f7ff",
    iconBg: "#f0f7ff",
    text: "#0057a3",
    ring: "#c2dcff",
  },
  pale: {
    accent: "#c2dcff",
    badgeBg: "#f5f9ff",
    iconBg: "#f5f9ff",
    text: "#00357a",
    ring: "#c2dcff",
  },
};

function TrendCards() {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      {trendCards.map((card) => {
        const tone = trendToneStyles[card.tone];
        const Icon = card.Icon;
        const TrendIcon = card.trend.startsWith("-")
          ? FaArrowTrendDown
          : FaArrowTrendUp;

        return (
          <article
            key={card.name}
            className="group overflow-hidden rounded-3xl border border-white/80 bg-white shadow-[0_16px_45px_rgba(15,23,42,0.07)] transition hover:-translate-y-1 hover:shadow-[0_24px_65px_rgba(15,23,42,0.11)]"
          >
            <div className="h-1.5" style={{ backgroundColor: tone.accent }} />
            <div className="p-5">
              <div className="flex items-start justify-between gap-3">
                <span
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl"
                  style={{ backgroundColor: tone.iconBg, color: tone.text }}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-black ring-1"
                  style={{
                    backgroundColor: tone.badgeBg,
                    color: tone.text,
                    "--tw-ring-color": tone.ring,
                  }}
                >
                  <TrendIcon className="h-3 w-3" aria-hidden="true" />
                  {card.trend}
                </span>
              </div>

              <div className="mt-5">
                <p className="text-sm font-bold text-slate-500">{card.name}</p>
                <p className="mt-2 text-3xl font-black leading-none tracking-tight text-slate-950">
                  {card.trend}
                </p>
              </div>

              <p className="mt-4 min-h-10 text-sm leading-5 text-slate-500">
                {card.description}
              </p>
            </div>
          </article>
        );
      })}
    </section>
  );
}

export default TrendCards;
