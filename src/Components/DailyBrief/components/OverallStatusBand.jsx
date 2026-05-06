import { FaArrowDown, FaArrowUp, FaChartPie } from "react-icons/fa6";
import WeightedStatusDonut from "./WeightedStatusDonut";
import { ragStyles } from "./statusStyles";

function OverallStatusBand({ status }) {
  const statusStyle = ragStyles[status.ragStatus] ?? ragStyles.Amber;
  const pullingDown = status.driversPullingDown.slice(0, 2);
  const pushingUp = status.driversPushingUp.slice(0, 2);

  return (
    <section className="relative min-w-0 overflow-hidden rounded-3xl border border-white/80 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.10)] max-[520px]:rounded-2xl">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,#ffffff_0%,#eef9fc_54%,#f8fbfd_100%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-16 right-1/3 h-56 w-56 rounded-full bg-cyan-100/40 blur-3xl"
      />

      <div className="relative p-6 max-[520px]:p-4">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-cyan-700 ring-1 ring-cyan-200">
              <FaChartPie className="h-3 w-3" aria-hidden="true" />
              Overall organization status
            </span>
            <h2 className="mt-2 text-xl font-semibold leading-tight text-slate-900 max-[520px]:text-lg">
              Enterprise health roll-up
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Weighted across {status.dimensions.length} dimensions of governance, safety, and finance.
            </p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusStyle.badge}`}
          >
            {status.ragStatus}
          </span>
        </div>

        <div className="min-w-0 rounded-2xl border border-slate-100 bg-white/80 p-5 shadow-sm backdrop-blur max-[520px]:rounded-xl max-[520px]:p-4">
          <WeightedStatusDonut status={status} />
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="relative overflow-hidden rounded-2xl border border-red-200 bg-gradient-to-br from-red-50/80 to-white p-4">
            <div className="absolute left-0 top-0 h-full w-1.5 bg-red-500" />
            <div className="flex items-center justify-between gap-3">
              <p className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-red-700">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-red-100 text-red-700">
                  <FaArrowDown className="h-2.5 w-2.5" aria-hidden="true" />
                </span>
                Pulling it down
              </p>
              <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-red-700 ring-1 ring-red-200">
                {pullingDown.length}
              </span>
            </div>
            <div className="mt-3 grid gap-2.5">
              {pullingDown.map((driver) => (
                <div
                  key={driver.title}
                  className="rounded-xl border border-red-100 bg-white/80 p-3 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-slate-900">
                      {driver.title}
                    </p>
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700 ring-1 ring-red-200">
                      {driver.impact}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-slate-600">
                    {driver.reason}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/80 to-white p-4">
            <div className="absolute left-0 top-0 h-full w-1.5 bg-emerald-500" />
            <div className="flex items-center justify-between gap-3">
              <p className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                  <FaArrowUp className="h-2.5 w-2.5" aria-hidden="true" />
                </span>
                Pushing it up
              </p>
              <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
                {pushingUp.length}
              </span>
            </div>
            <div className="mt-3 grid gap-2.5">
              {pushingUp.map((driver) => (
                <div
                  key={driver.title}
                  className="rounded-xl border border-emerald-100 bg-white/80 p-3 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-slate-900">
                      {driver.title}
                    </p>
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
                      {driver.impact}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-slate-600">
                    {driver.reason}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default OverallStatusBand;
