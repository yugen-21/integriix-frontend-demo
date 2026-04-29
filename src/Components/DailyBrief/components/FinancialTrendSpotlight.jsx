import {
  FaArrowTrendUp,
  FaClipboardCheck,
  FaSackDollar,
} from "react-icons/fa6";

function FinancialTrendSpotlight({ trend }) {
  const maxPoint = Math.max(...trend.points);
  const minPoint = Math.min(...trend.points);
  const pointRange = Math.max(maxPoint - minPoint, 1);

  return (
    <section className="overflow-hidden rounded-3xl border border-white/80 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
      <div className="p-6">
        <div>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-normal text-cyan-700">
                Key financial trend
              </p>
              <h2 className="mt-2 text-3xl font-black leading-tight text-slate-950">
                {trend.title}
              </h2>
            </div>
            <span className="rounded-full bg-red-50 px-3 py-1 text-sm font-black text-red-700 ring-1 ring-red-200">
              {trend.status}
            </span>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
              <p className="text-xs font-black uppercase text-slate-500">
                {trend.metricLabel}
              </p>
              <p className="mt-2 text-4xl font-black text-slate-950">
                {trend.currentValue}
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-sm font-black text-red-700">
                <FaArrowTrendUp className="h-3.5 w-3.5" aria-hidden="true" />
                {trend.movement} vs prior day
              </p>
            </div>
            <div className="rounded-2xl bg-red-50 p-4 ring-1 ring-red-100">
              <p className="text-xs font-black uppercase text-red-700">
                Revenue at risk
              </p>
              <p className="mt-2 text-4xl font-black text-red-700">
                {trend.revenueAtRisk}
              </p>
              <p className="mt-1 text-sm font-bold text-red-700">
                {trend.highValueDenials} high-value denial yesterday
              </p>
            </div>
            <div className="rounded-2xl bg-cyan-50 p-4 ring-1 ring-cyan-100">
              <p className="text-xs font-black uppercase text-cyan-700">
                Owner
              </p>
              <p className="mt-2 text-base font-black leading-6 text-slate-950">
                {trend.owner}
              </p>
              <p className="mt-1 text-sm font-bold text-slate-500">
                Due {trend.due}
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
              <p className="text-xs font-black uppercase text-slate-500">
                What changed
              </p>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                {trend.whatChanged} {trend.impact}
              </p>
            </div>
            <div className="rounded-2xl border border-cyan-100 bg-white p-4">
              <p className="flex items-center gap-2 text-xs font-black uppercase text-cyan-700">
                <FaClipboardCheck className="h-3.5 w-3.5" aria-hidden="true" />
                Recommended action
              </p>
              <p className="mt-2 text-sm font-black leading-6 text-slate-900">
                {trend.recommendedAction}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default FinancialTrendSpotlight;
