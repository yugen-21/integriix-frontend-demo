import WeightedStatusDonut from "./WeightedStatusDonut";
import { ragStyles } from "./statusStyles";

function OverallStatusBand({ status }) {
  const statusStyle = ragStyles[status.ragStatus] ?? ragStyles.Amber;
  const pullingDown = status.driversPullingDown.slice(0, 2);
  const pushingUp = status.driversPushingUp.slice(0, 2);

  return (
    <section className="min-w-0 overflow-hidden rounded-3xl border border-white/80 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.10)] max-[520px]:rounded-2xl">
      <div className="bg-[linear-gradient(135deg,#ffffff_0%,#eef9fc_54%,#f8fbfd_100%)] p-6 max-[520px]:p-4">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-normal text-cyan-700">
              Overall organization status
            </p>
            <h2 className="mt-2 text-3xl font-black leading-tight text-slate-950 max-[520px]:text-2xl">
              Enterprise health roll-up
            </h2>
          </div>
          <span
            className={`rounded-full px-4 py-2 text-sm font-black ring-1 ${statusStyle.badge}`}
          >
            {status.ragStatus}
          </span>
        </div>

        <div className="mt-5 min-w-0 rounded-3xl border border-slate-100 bg-white/80 p-5 shadow-sm max-[520px]:rounded-2xl max-[520px]:p-4">
          <WeightedStatusDonut status={status} />
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="rounded-3xl border border-red-100 bg-red-50/70 p-4">
            <p className="text-xs font-black uppercase text-red-700">
              Pulling it down
            </p>
            <div className="mt-3 grid gap-3">
              {pullingDown.map((driver) => (
                <div key={driver.title}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-black text-slate-950">
                      {driver.title}
                    </p>
                    <span className="text-xs font-black text-red-700">
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

          <div className="rounded-3xl border border-emerald-100 bg-emerald-50/70 p-4">
            <p className="text-xs font-black uppercase text-emerald-700">
              Pushing it up
            </p>
            <div className="mt-3 grid gap-3">
              {pushingUp.map((driver) => (
                <div key={driver.title}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-black text-slate-950">
                      {driver.title}
                    </p>
                    <span className="text-xs font-black text-emerald-700">
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
