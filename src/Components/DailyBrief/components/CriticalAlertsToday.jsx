import { useState } from "react";

const severityStyles = {
  Critical: {
    badge: "bg-red-100 text-red-800 ring-red-200",
    dot: "bg-red-500",
    border: "border-red-200",
    panel: "bg-red-50/70",
  },
  High: {
    badge: "bg-amber-100 text-amber-800 ring-amber-200",
    dot: "bg-amber-500",
    border: "border-amber-200",
    panel: "bg-amber-50/70",
  },
  Medium: {
    badge: "bg-cyan-100 text-cyan-800 ring-cyan-200",
    dot: "bg-cyan-500",
    border: "border-cyan-200",
    panel: "bg-cyan-50/70",
  },
};

function CriticalAlertsToday({ alerts }) {
  const [selectedAlertId, setSelectedAlertId] = useState(alerts[0]?.id);
  const primaryAlert =
    alerts.find((alert) => alert.id === selectedAlertId) ?? alerts[0];
  const primaryStyle =
    severityStyles[primaryAlert.severity] ?? severityStyles.Medium;

  return (
    <section className="overflow-hidden rounded-3xl border border-white/80 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
      <div className="grid gap-5 p-6 xl:grid-cols-[minmax(320px,0.8fr)_minmax(0,1.2fr)]">
        <div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-normal text-red-700">
                Critical alerts
              </p>
              <h2 className="mt-2 text-3xl font-black leading-tight text-slate-950">
                Action queue for today
              </h2>
            </div>
            <span className="rounded-full bg-red-50 px-3 py-1 text-sm font-black text-red-700 ring-1 ring-red-200">
              {alerts.length}
            </span>
          </div>

          <div className="mt-5 grid gap-2">
            {alerts.map((alert) => {
              const style = severityStyles[alert.severity] ?? severityStyles.Medium;

              return (
                <button
                  key={alert.id}
                  className={`w-full rounded-2xl border bg-slate-50/80 p-3 text-left transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md ${
                    primaryAlert.id === alert.id
                      ? `${style.border} shadow-sm`
                      : "border-slate-100"
                  }`}
                  type="button"
                  onClick={() => setSelectedAlertId(alert.id)}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`h-3 w-3 shrink-0 rounded-full ${style.dot}`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black text-slate-950">
                        {alert.title}
                      </p>
                      <p className="mt-1 truncate text-xs font-semibold text-slate-500">
                        {alert.location} · Owner: {alert.owner}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2 py-1 text-[11px] font-black ring-1 ${style.badge}`}
                    >
                      {alert.severity}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div
          className={`rounded-3xl border ${primaryStyle.border} ${primaryStyle.panel} p-5`}
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase text-slate-500">
                Selected priority alert
              </p>
              <h3 className="mt-2 text-2xl font-black leading-tight text-slate-950">
                {primaryAlert.title}
              </h3>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${primaryStyle.badge}`}
            >
              {primaryAlert.severity}
            </span>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-white/80 p-4 ring-1 ring-white">
              <p className="text-xs font-bold uppercase text-slate-500">
                Unit / area
              </p>
              <p className="mt-1 text-sm font-black text-slate-950">
                {primaryAlert.location}
              </p>
            </div>
            <div className="rounded-2xl bg-white/80 p-4 ring-1 ring-white">
              <p className="text-xs font-bold uppercase text-slate-500">
                Owner
              </p>
              <p className="mt-1 text-sm font-black text-slate-950">
                {primaryAlert.owner}
              </p>
            </div>
            <div className="rounded-2xl bg-white/80 p-4 ring-1 ring-white">
              <p className="text-xs font-bold uppercase text-slate-500">Due</p>
              <p className="mt-1 text-sm font-black text-slate-950">
                {primaryAlert.due}
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl bg-white/80 p-4 ring-1 ring-white">
            <p className="text-xs font-black uppercase text-slate-500">
              Why it qualifies
            </p>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
              {primaryAlert.qualifiesAs}. {primaryAlert.summary}
            </p>
          </div>

          <div className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-white">
            <p className="text-xs font-black uppercase text-cyan-700">
              Required action
            </p>
            <p className="mt-2 text-base font-black leading-6 text-slate-900">
              {primaryAlert.requiredAction}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default CriticalAlertsToday;
