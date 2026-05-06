import { ragStyles } from "./statusStyles";

const ragRingColors = {
  Red: "#ef4444",
  Amber: "#f59e0b",
  Green: "#10b981",
};

function StatusGauge({ score, ragStatus }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, score));
  const dashOffset = circumference - (clamped / 100) * circumference;
  const stroke = ragRingColors[ragStatus] ?? ragRingColors.Amber;

  return (
    <div className="relative grid h-28 w-28 shrink-0 place-items-center">
      <svg
        className="h-28 w-28 -rotate-90"
        viewBox="0 0 120 120"
        role="img"
        aria-label={`Weighted score ${score} out of 100`}
      >
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="9"
        />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke={stroke}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: "stroke-dashoffset 600ms ease-out" }}
        />
      </svg>
      <div className="absolute text-center">
        <p className="text-2xl font-semibold leading-none text-slate-900">
          {score}
        </p>
        <p
          className="mt-1 text-[10px] font-medium uppercase tracking-wide"
          style={{ color: stroke }}
        >
          {ragStatus}
        </p>
      </div>
    </div>
  );
}

function OverallStatusHeroCard({ status }) {
  const statusStyle = ragStyles[status.ragStatus] ?? ragStyles.Amber;

  return (
    <section className="relative min-w-0 overflow-hidden rounded-3xl border border-white/80 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] max-[520px]:rounded-2xl max-[520px]:p-4">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-12 -right-10 h-40 w-40 rounded-full bg-cyan-100/50 blur-3xl"
      />

      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-wide text-cyan-700">
            Overall status
          </p>
          <h2 className="mt-1.5 text-lg font-semibold leading-tight text-slate-900">
            Organization health
          </h2>
        </div>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${statusStyle.badge}`}
        >
          {status.ragStatus}
        </span>
      </div>

      <div
        className={`relative mt-5 rounded-2xl ${statusStyle.panel} p-4 max-[520px]:rounded-xl max-[520px]:p-3`}
      >
        <div className="flex flex-wrap items-center gap-4">
          <StatusGauge score={status.score} ragStatus={status.ragStatus} />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
              Weighted score
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-600">
              Roll-up across {status.dimensions.length} enterprise dimensions.
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-white/70 px-2 py-1.5 ring-1 ring-white">
                <p className="text-[10px] font-semibold uppercase text-red-600">
                  Red
                </p>
                <p className="mt-0.5 text-[10px] text-slate-500">&lt; 60</p>
              </div>
              <div className="rounded-lg bg-white/70 px-2 py-1.5 ring-1 ring-white">
                <p className="text-[10px] font-semibold uppercase text-amber-600">
                  Amber
                </p>
                <p className="mt-0.5 text-[10px] text-slate-500">60–79</p>
              </div>
              <div className="rounded-lg bg-white/70 px-2 py-1.5 ring-1 ring-white">
                <p className="text-[10px] font-semibold uppercase text-emerald-600">
                  Green
                </p>
                <p className="mt-0.5 text-[10px] text-slate-500">≥ 80</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative mt-4 rounded-xl border border-slate-100 bg-slate-50/80 p-3.5">
        <p className="text-[10px] font-medium uppercase tracking-wide text-cyan-700">
          Executive summary
        </p>
        <p className="mt-1.5 text-xs leading-5 text-slate-600">
          {status.executiveSummary}
        </p>
      </div>
    </section>
  );
}

export default OverallStatusHeroCard;
