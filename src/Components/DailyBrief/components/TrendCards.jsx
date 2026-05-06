import {
  FaArrowTrendDown,
  FaArrowTrendUp,
  FaBuildingColumns,
  FaHeartPulse,
  FaSackDollar,
  FaShieldHalved,
  FaSitemap,
  FaUsersLine,
} from "react-icons/fa6";

const trendCards = [
  {
    name: "Quality, Safety & Accreditation",
    value: "64",
    delta: "-3 pts",
    direction: "down",
    sentiment: "negative",
    description: "Medication safety incident and CLABSI breach pulled the score down.",
    Icon: FaShieldHalved,
  },
  {
    name: "Risk, Audit & Governance",
    value: "66",
    delta: "-2 pts",
    direction: "down",
    sentiment: "negative",
    description: "Two board-level risks have overdue mitigation actions.",
    Icon: FaBuildingColumns,
  },
  {
    name: "Clinical Intelligence",
    value: "71",
    delta: "+1 pt",
    direction: "up",
    sentiment: "positive",
    description: "Sepsis bundle compliance steady; protocol adherence below target.",
    Icon: FaHeartPulse,
  },
  {
    name: "Financial Intelligence",
    value: "70",
    delta: "-4 pts",
    direction: "down",
    sentiment: "negative",
    description: "Cardiology denial rate rose to 9.1%; $42K revenue at risk.",
    Icon: FaSackDollar,
  },
  {
    name: "Operational Intelligence",
    value: "68",
    delta: "-3 pts",
    direction: "down",
    sentiment: "negative",
    description: "Bed crunch fired on two wards; discharge-before-noon below target.",
    Icon: FaSitemap,
  },
  {
    name: "Patient Experience & Access",
    value: "78",
    delta: "+5 pts",
    direction: "up",
    sentiment: "positive",
    description: "Outpatient pharmacy complaints down 22% after queue redesign.",
    Icon: FaUsersLine,
  },
];

const sentimentStyles = {
  positive: {
    accent: "bg-emerald-500",
    glow: "from-emerald-50/80",
    iconBg: "bg-emerald-50 text-emerald-700",
    badgeBg: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    valueText: "text-emerald-700",
  },
  negative: {
    accent: "bg-red-500",
    glow: "from-red-50/80",
    iconBg: "bg-red-50 text-red-700",
    badgeBg: "bg-red-50 text-red-700 ring-red-200",
    valueText: "text-red-700",
  },
  neutral: {
    accent: "bg-cyan-500",
    glow: "from-cyan-50/80",
    iconBg: "bg-cyan-50 text-cyan-700",
    badgeBg: "bg-cyan-50 text-cyan-700 ring-cyan-200",
    valueText: "text-cyan-700",
  },
};

function TrendCards() {
  return (
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {trendCards.map((card) => {
        const tone = sentimentStyles[card.sentiment] ?? sentimentStyles.neutral;
        const Icon = card.Icon;
        const TrendIcon = card.direction === "down"
          ? FaArrowTrendDown
          : FaArrowTrendUp;

        return (
          <article
            key={card.name}
            className="group relative overflow-hidden rounded-2xl border border-white/80 bg-white shadow-[0_16px_45px_rgba(15,23,42,0.07)] transition hover:-translate-y-1 hover:shadow-[0_24px_65px_rgba(15,23,42,0.11)]"
          >
            <div className={`h-1 w-full ${tone.accent}`} />
            <div
              aria-hidden="true"
              className={`pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${tone.glow} to-transparent opacity-70`}
            />
            <div className="relative p-3.5">
              <div className="flex items-start justify-between gap-2">
                <span
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${tone.iconBg}`}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
                <span
                  className={`inline-flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ring-1 ${tone.badgeBg}`}
                >
                  <TrendIcon className="h-2.5 w-2.5" aria-hidden="true" />
                  {card.delta}
                </span>
              </div>

              <div className="mt-3">
                <p className="line-clamp-2 min-h-8 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                  {card.name}
                </p>
                <p
                  className={`mt-1 text-xl font-semibold leading-none tracking-tight ${tone.valueText}`}
                >
                  {card.value}
                </p>
              </div>

              <p className="mt-3 min-h-12 text-[11px] leading-4 text-slate-500">
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
