import {
  FaArrowTrendUp,
  FaClipboardCheck,
  FaCircleExclamation,
  FaSackDollar,
  FaUserTie,
} from "react-icons/fa6";

function FinancialTrendSpotlight({ trend }) {
  return (
    <section className="relative min-w-0 overflow-hidden rounded-3xl border border-white/80 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)] max-[520px]:rounded-2xl">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-red-50/60 to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-16 -right-12 h-48 w-48 rounded-full bg-red-100/40 blur-3xl"
      />

      <div className="relative p-6 max-[520px]:p-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-700 ring-1 ring-red-200">
              <FaCircleExclamation className="h-3 w-3" aria-hidden="true" />
              Key financial trend
            </span>
            <h2 className="mt-2 text-xl font-semibold leading-tight text-slate-900 max-[520px]:text-lg">
              {trend.title}
            </h2>
          </div>
          <span className="rounded-full bg-red-600 px-2.5 py-0.5 text-xs font-semibold text-white shadow-sm">
            {trend.status}
          </span>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="absolute left-0 top-0 h-full w-1 bg-slate-300" />
            <div className="flex items-center gap-2">
              <FaSackDollar
                className="h-3 w-3 text-slate-400"
                aria-hidden="true"
              />
              <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                {trend.metricLabel}
              </p>
            </div>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
              {trend.currentValue}
            </p>
            <p className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700 ring-1 ring-red-200">
              <FaArrowTrendUp className="h-2.5 w-2.5" aria-hidden="true" />
              {trend.movement} vs prior day
            </p>
          </div>

          <div className="relative overflow-hidden rounded-xl border border-red-200 bg-gradient-to-br from-red-50 to-red-100/60 p-4 shadow-sm">
            <div className="absolute left-0 top-0 h-full w-1 bg-red-500" />
            <p className="text-[10px] font-medium uppercase tracking-wide text-red-700">
              Revenue at risk
            </p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-red-700">
              {trend.revenueAtRisk}
            </p>
            <p className="mt-1.5 text-[11px] text-red-700/80">
              {trend.highValueDenials} high-value denial yesterday
            </p>
          </div>

          <div className="relative overflow-hidden rounded-xl border border-cyan-200 bg-gradient-to-br from-cyan-50 to-white p-4 shadow-sm">
            <div className="absolute left-0 top-0 h-full w-1 bg-cyan-500" />
            <div className="flex items-center gap-2">
              <FaUserTie
                className="h-3 w-3 text-cyan-600"
                aria-hidden="true"
              />
              <p className="text-[10px] font-medium uppercase tracking-wide text-cyan-700">
                Owner
              </p>
            </div>
            <p className="mt-2 text-sm font-semibold leading-5 text-slate-900">
              {trend.owner}
            </p>
            <p className="mt-1.5 inline-flex rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-cyan-700 ring-1 ring-cyan-200">
              Due {trend.due}
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
            <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
              What changed
            </p>
            <p className="mt-1.5 text-xs leading-5 text-slate-600">
              {trend.whatChanged} {trend.impact}
            </p>
          </div>
          <div className="relative overflow-hidden rounded-xl border border-cyan-200 bg-gradient-to-br from-white to-cyan-50/40 p-4">
            <p className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-wide text-cyan-700">
              <FaClipboardCheck className="h-3 w-3" aria-hidden="true" />
              Recommended action
            </p>
            <p className="mt-1.5 text-xs font-medium leading-5 text-slate-800">
              {trend.recommendedAction}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default FinancialTrendSpotlight;
