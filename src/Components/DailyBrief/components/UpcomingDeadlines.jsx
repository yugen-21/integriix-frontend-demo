const readinessStyles = {
  Blocked: "bg-red-100 text-red-800 ring-red-200",
  "At Risk": "bg-amber-100 text-amber-800 ring-amber-200",
  Watch: "bg-cyan-100 text-cyan-800 ring-cyan-200",
  "On Track": "bg-emerald-100 text-emerald-800 ring-emerald-200",
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
    <section className="rounded-3xl border border-white/80 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-normal text-cyan-700">
            Upcoming deadlines, audits, submissions
          </p>
          <h2 className="mt-2 text-3xl font-black leading-tight text-slate-950">
            Due today
          </h2>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-black text-slate-700 ring-1 ring-slate-200">
          {todaysDeadlines.length} items
        </span>
      </div>

      <div className="mt-6 grid gap-4">
        {todaysDeadlines.map((deadline) => (
          <article
            key={deadline.id}
            className="grid gap-4 rounded-3xl border border-slate-100 bg-slate-50/80 p-5 md:grid-cols-[110px_minmax(0,1fr)_260px]"
          >
            <div>
              <p className="text-xs font-black uppercase text-slate-500">
                Time
              </p>
              <p className="mt-2 text-2xl font-black text-slate-950">
                {formatTime(deadline.date)}
              </p>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-200">
                  {deadline.type}
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${
                    readinessStyles[deadline.readinessStatus] ??
                    readinessStyles.Watch
                  }`}
                >
                  {deadline.readinessStatus}
                </span>
              </div>
              <h3 className="mt-3 text-xl font-black leading-tight text-slate-950">
                {deadline.title}
              </h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                {deadline.consequenceOfDelay}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {deadline.blockers.map((blocker) => (
                  <span
                    key={blocker}
                    className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-200"
                  >
                    {blocker}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-white p-4 ring-1 ring-white">
              <p className="text-xs font-black uppercase text-slate-500">
                Owner
              </p>
              <p className="mt-2 text-sm font-black text-slate-950">
                {deadline.owner}
              </p>
              <p className="mt-4 text-xs font-black uppercase text-slate-500">
                Confidence
              </p>
              <span
                className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-black ring-1 ${
                  confidenceStyles[deadline.confidenceLevel] ??
                  confidenceStyles.Medium
                }`}
              >
                {deadline.confidenceLevel}
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default UpcomingDeadlines;
