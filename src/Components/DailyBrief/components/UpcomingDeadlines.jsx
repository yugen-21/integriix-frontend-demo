import {
  FaCalendarDay,
  FaClock,
  FaUserTie,
  FaTriangleExclamation,
} from "react-icons/fa6";

const readinessStyles = {
  Blocked: {
    badge: "bg-red-100 text-red-800 ring-red-200",
    accent: "bg-red-500",
    panelBorder: "border-red-200",
  },
  "At Risk": {
    badge: "bg-amber-100 text-amber-800 ring-amber-200",
    accent: "bg-amber-500",
    panelBorder: "border-amber-200",
  },
  Watch: {
    badge: "bg-cyan-100 text-cyan-800 ring-cyan-200",
    accent: "bg-cyan-500",
    panelBorder: "border-cyan-200",
  },
  "On Track": {
    badge: "bg-emerald-100 text-emerald-800 ring-emerald-200",
    accent: "bg-emerald-500",
    panelBorder: "border-emerald-200",
  },
};

const confidenceStyles = {
  Low: "bg-red-50 text-red-700 ring-red-200",
  Medium: "bg-amber-50 text-amber-700 ring-amber-200",
  High: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

function getDateKey(dateValue) {
  return new Date(dateValue).toISOString().slice(0, 10);
}

function formatTime(dateValue) {
  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(dateValue));
}

function UpcomingDeadlines({ deadlines, day }) {
  const dayKey = getDateKey(day);
  const todaysDeadlines = deadlines
    .filter((deadline) => getDateKey(deadline.date) === dayKey)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <section className="relative min-w-0 overflow-hidden rounded-3xl border border-white/80 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] max-[520px]:rounded-2xl max-[520px]:p-4">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-12 right-10 h-44 w-44 rounded-full bg-cyan-100/40 blur-3xl"
      />

      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-cyan-700 ring-1 ring-cyan-200">
            <FaCalendarDay className="h-3 w-3" aria-hidden="true" />
            Deadlines, audits, submissions
          </span>
          <h2 className="mt-2 text-xl font-semibold leading-tight text-slate-900 max-[520px]:text-lg">
            Due today
          </h2>
        </div>
        <span className="rounded-full bg-slate-900 px-2.5 py-0.5 text-xs font-semibold text-white shadow-sm">
          {todaysDeadlines.length} items
        </span>
      </div>

      <div className="relative mt-5 grid gap-3">
        {todaysDeadlines.map((deadline) => {
          const style =
            readinessStyles[deadline.readinessStatus] ?? readinessStyles.Watch;

          return (
            <article
              key={deadline.id}
              className={`relative grid min-w-0 gap-4 overflow-hidden rounded-2xl border bg-white p-4 shadow-sm transition hover:shadow-md md:grid-cols-[110px_minmax(0,1fr)_220px] max-[520px]:rounded-xl ${style.panelBorder}`}
            >
              <div
                className={`absolute left-0 top-0 h-full w-1.5 ${style.accent}`}
              />

              <div className="flex flex-col items-start gap-1 md:items-center md:justify-center md:text-center">
                <span className="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                  <FaClock className="h-3 w-3" aria-hidden="true" />
                  Time
                </span>
                <p className="text-xl font-semibold tracking-tight text-slate-900 md:text-2xl">
                  {formatTime(deadline.date)}
                </p>
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-700 ring-1 ring-slate-200">
                    {deadline.type}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ring-1 ${style.badge}`}
                  >
                    {deadline.readinessStatus}
                  </span>
                </div>
                <h3 className="mt-2 text-base font-semibold leading-tight text-slate-900">
                  {deadline.title}
                </h3>
                <p className="mt-1.5 inline-flex items-start gap-1.5 text-xs leading-5 text-slate-600">
                  <FaTriangleExclamation
                    className="mt-0.5 h-3 w-3 shrink-0 text-amber-500"
                    aria-hidden="true"
                  />
                  {deadline.consequenceOfDelay}
                </p>
                {deadline.blockers.length > 0 && (
                  <div className="mt-2.5">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                      Blockers
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {deadline.blockers.map((blocker) => (
                        <span
                          key={blocker}
                          className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-700 ring-1 ring-red-200"
                        >
                          {blocker}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                <p className="inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                  <FaUserTie
                    className="h-3 w-3 text-slate-400"
                    aria-hidden="true"
                  />
                  Owner
                </p>
                <p className="mt-1 text-xs font-medium text-slate-900">
                  {deadline.owner}
                </p>
                <p className="mt-2.5 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                  Confidence
                </p>
                <span
                  className={`mt-1 inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold ring-1 ${
                    confidenceStyles[deadline.confidenceLevel] ??
                    confidenceStyles.Medium
                  }`}
                >
                  {deadline.confidenceLevel}
                </span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default UpcomingDeadlines;
