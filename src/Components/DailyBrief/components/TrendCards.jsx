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
    tone: "emerald",
    Icon: FaWaveSquare,
  },
  {
    name: "Patient Safety",
    trend: "-8%",
    description: "Patient safety incidents decreased.",
    tone: "cyan",
    Icon: FaShieldHeart,
  },
  {
    name: "Accreditation Readiness",
    trend: "+12%",
    description: "Accreditation readiness improved.",
    tone: "blue",
    Icon: FaFileShield,
  },
  {
    name: "Audit Response Time",
    trend: "-6 hrs",
    description: "Audit response time got faster.",
    tone: "violet",
    Icon: FaClockRotateLeft,
  },
  {
    name: "Financial Leakage",
    trend: "AED 154K",
    description: "Financial leakage detected for review.",
    tone: "amber",
    Icon: FaSackDollar,
  },
];

const trendToneStyles = {
  emerald: {
    accent: "bg-emerald-500",
    badge: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    icon: "bg-emerald-50 text-emerald-700",
  },
  cyan: {
    accent: "bg-cyan-500",
    badge: "bg-cyan-50 text-cyan-700 ring-cyan-200",
    icon: "bg-cyan-50 text-cyan-700",
  },
  blue: {
    accent: "bg-blue-500",
    badge: "bg-blue-50 text-blue-700 ring-blue-200",
    icon: "bg-blue-50 text-blue-700",
  },
  violet: {
    accent: "bg-violet-500",
    badge: "bg-violet-50 text-violet-700 ring-violet-200",
    icon: "bg-violet-50 text-violet-700",
  },
  amber: {
    accent: "bg-amber-500",
    badge: "bg-amber-50 text-amber-800 ring-amber-200",
    icon: "bg-amber-50 text-amber-700",
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
            <div className={`h-1.5 ${tone.accent}`} />
            <div className="p-5">
              <div className="flex items-start justify-between gap-3">
                <span
                  className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${tone.icon}`}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-black ring-1 ${tone.badge}`}
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
