import { useState } from "react";
import {
  FaCalendarDay,
  FaCircleExclamation,
  FaLocationDot,
  FaUserTie,
} from "react-icons/fa6";

const severityStyles = {
  Critical: {
    badge: "bg-red-100 text-red-800 ring-red-200",
    dot: "bg-red-500",
    border: "border-red-200",
    panel: "bg-gradient-to-br from-red-50/80 to-white",
    accent: "bg-red-500",
    headlineBg: "bg-red-600",
  },
  High: {
    badge: "bg-amber-100 text-amber-800 ring-amber-200",
    dot: "bg-amber-500",
    border: "border-amber-200",
    panel: "bg-gradient-to-br from-amber-50/80 to-white",
    accent: "bg-amber-500",
    headlineBg: "bg-amber-600",
  },
  Medium: {
    badge: "bg-cyan-100 text-cyan-800 ring-cyan-200",
    dot: "bg-cyan-500",
    border: "border-cyan-200",
    panel: "bg-gradient-to-br from-cyan-50/80 to-white",
    accent: "bg-cyan-500",
    headlineBg: "bg-cyan-600",
  },
};

function CriticalAlertsToday({ alerts }) {
  const [selectedAlertId, setSelectedAlertId] = useState(alerts[0]?.id);
  const primaryAlert =
    alerts.find((alert) => alert.id === selectedAlertId) ?? alerts[0];
  const primaryStyle =
    severityStyles[primaryAlert.severity] ?? severityStyles.Medium;

  return (
    <section className="relative min-w-0 overflow-hidden rounded-3xl border border-white/80 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)] max-[520px]:rounded-2xl">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-12 -left-10 h-44 w-44 rounded-full bg-red-100/40 blur-3xl"
      />

      <div className="relative grid min-w-0 gap-5 p-6 xl:grid-cols-[minmax(320px,0.85fr)_minmax(0,1.15fr)] max-[520px]:p-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-700 ring-1 ring-red-200">
                <FaCircleExclamation className="h-3 w-3" aria-hidden="true" />
                Critical alerts
              </span>
              <h2 className="mt-2 text-xl font-semibold leading-tight text-slate-900 max-[520px]:text-lg">
                Action queue for today
              </h2>
            </div>
            <span className="rounded-full bg-red-600 px-2.5 py-0.5 text-xs font-semibold text-white shadow-sm">
              {alerts.length}
            </span>
          </div>

          <div className="mt-4 grid gap-2">
            {alerts.map((alert) => {
              const style = severityStyles[alert.severity] ?? severityStyles.Medium;
              const isActive = primaryAlert.id === alert.id;

              return (
                <button
                  key={alert.id}
                  className={`group relative w-full overflow-hidden rounded-xl border bg-white p-3 text-left transition hover:-translate-y-0.5 hover:shadow-md ${
                    isActive
                      ? `${style.border} shadow-md`
                      : "border-slate-100"
                  }`}
                  type="button"
                  onClick={() => setSelectedAlertId(alert.id)}
                >
                  <span
                    className={`absolute left-0 top-0 h-full w-1 transition-all ${
                      isActive ? style.accent : "bg-transparent group-hover:bg-slate-200"
                    }`}
                  />
                  <div className="flex items-center gap-3 pl-1">
                    <span
                      className={`relative grid h-7 w-7 shrink-0 place-items-center rounded-full ${style.dot}/10`}
                    >
                      <span
                        className={`h-2 w-2 rounded-full ${style.dot}`}
                      />
                      {isActive && (
                        <span
                          className={`absolute inset-0 animate-ping rounded-full ${style.dot} opacity-30`}
                        />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="break-words text-sm font-medium text-slate-900">
                        {alert.title}
                      </p>
                      <p className="mt-0.5 break-words text-[11px] leading-4 text-slate-500">
                        {alert.location} · {alert.owner}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${style.badge}`}
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
          className={`relative min-w-0 overflow-hidden rounded-2xl border ${primaryStyle.border} ${primaryStyle.panel} p-4 max-[520px]:rounded-xl`}
        >
          <div
            className={`absolute left-0 top-0 h-full w-1.5 ${primaryStyle.accent}`}
          />
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                Selected priority alert
              </p>
              <h3 className="mt-1.5 text-lg font-semibold leading-tight text-slate-900">
                {primaryAlert.title}
              </h3>
            </div>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-white shadow-sm ${primaryStyle.headlineBg}`}
            >
              {primaryAlert.severity}
            </span>
          </div>

          <div className="mt-4 grid min-w-0 gap-2.5 sm:grid-cols-3">
            <div className="min-w-0 rounded-xl border border-white bg-white p-3 shadow-sm">
              <p className="inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                <FaLocationDot
                  className="h-3 w-3 text-slate-400"
                  aria-hidden="true"
                />
                Unit / area
              </p>
              <p className="mt-1 break-words text-xs font-medium text-slate-900">
                {primaryAlert.location}
              </p>
            </div>
            <div className="min-w-0 rounded-xl border border-white bg-white p-3 shadow-sm">
              <p className="inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                <FaUserTie
                  className="h-3 w-3 text-slate-400"
                  aria-hidden="true"
                />
                Owner
              </p>
              <p className="mt-1 break-words text-xs font-medium text-slate-900">
                {primaryAlert.owner}
              </p>
            </div>
            <div className="min-w-0 rounded-xl border border-white bg-white p-3 shadow-sm">
              <p className="inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                <FaCalendarDay
                  className="h-3 w-3 text-slate-400"
                  aria-hidden="true"
                />
                Due
              </p>
              <p className="mt-1 break-words text-xs font-medium text-slate-900">
                {primaryAlert.due}
              </p>
            </div>
          </div>

          <div className="mt-3 min-w-0 rounded-xl border border-slate-100 bg-white/80 p-3.5 shadow-sm">
            <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
              Why it qualifies
            </p>
            <p className="mt-1.5 break-words text-xs leading-5 text-slate-600">
              {primaryAlert.qualifiesAs}. {primaryAlert.summary}
            </p>
          </div>

          <div className="mt-3 min-w-0 rounded-xl border border-cyan-200 bg-gradient-to-br from-white to-cyan-50/40 p-3.5">
            <p className="text-[10px] font-medium uppercase tracking-wide text-cyan-700">
              Required action
            </p>
            <p className="mt-1.5 break-words text-sm font-medium leading-5 text-slate-800">
              {primaryAlert.requiredAction}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default CriticalAlertsToday;
