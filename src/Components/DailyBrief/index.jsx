import {
  FaArrowTrendDown,
  FaArrowTrendUp,
  FaBolt,
  FaCirclePlay,
  FaClipboardCheck,
  FaRegClock,
  FaShieldHeart,
  FaTriangleExclamation,
  FaVideo,
  FaWaveSquare,
} from "react-icons/fa6";
import {
  mockCriticalAlerts,
  mockDashboardMeta,
  mockExecutiveKpis,
  mockInsightStories,
  mockPriorityActions,
  mockVideoBrief,
} from "../../data";

const priorityAlerts = mockCriticalAlerts.slice(0, 3);
const priorityActions = mockPriorityActions.slice(0, 3);
const keyKpis = mockExecutiveKpis.slice(0, 4);

const severityStyles = {
  Critical: "bg-red-50 text-red-700 ring-red-200",
  High: "bg-amber-50 text-amber-700 ring-amber-200",
  Medium: "bg-cyan-50 text-cyan-700 ring-cyan-200",
};

function DailyBrief() {
  return (
    <div className="grid gap-6">
      <section className="overflow-hidden rounded-3xl border border-white/80 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.10)]">
        <div className="grid gap-6 bg-[linear-gradient(135deg,#ffffff_0%,#eef9fc_52%,#f8fbfd_100%)] p-7 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-cyan-50 px-3 py-1 text-xs font-bold uppercase tracking-normal text-cyan-700 ring-1 ring-cyan-100">
              <FaShieldHeart className="h-3.5 w-3.5" aria-hidden="true" />
              Daily Brief
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <h2 className="text-4xl font-black leading-tight text-slate-950 max-[700px]:text-3xl">
                {mockDashboardMeta.hospitalName}
              </h2>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-amber-800 ring-1 ring-amber-200">
                {mockDashboardMeta.overallStatus}
              </span>
            </div>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
              {mockVideoBrief.executiveSummary}
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Open alerts
                </p>
                <p className="mt-1 text-2xl font-black text-slate-950">
                  {mockCriticalAlerts.length}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Priority actions
                </p>
                <p className="mt-1 text-2xl font-black text-slate-950">
                  {mockPriorityActions.length}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Briefing
                </p>
                <p className="mt-1 text-2xl font-black text-slate-950">
                  {mockVideoBrief.duration}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-cyan-100 bg-white p-5 shadow-[0_20px_50px_rgba(8,145,178,0.14)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Governance Score
                </p>
                <p className="mt-2 text-6xl font-black tracking-tight text-slate-950">
                  {mockDashboardMeta.governanceScore}
                </p>
              </div>
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-cyan-500 text-white shadow-lg shadow-cyan-500/25">
                <FaWaveSquare className="h-5 w-5" aria-hidden="true" />
              </span>
            </div>
            <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full w-[82%] rounded-full bg-[linear-gradient(90deg,#0891b2,#22c55e)]" />
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="text-slate-500">Date</p>
                <p className="font-bold text-slate-900">
                  {mockDashboardMeta.date}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="text-slate-500">Generated</p>
                <p className="font-bold text-slate-900">
                  {mockDashboardMeta.generatedBriefingTime}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.55fr)]">
        <article className="overflow-hidden rounded-3xl border border-white/80 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <div className="flex flex-wrap items-start justify-between gap-4 p-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-cyan-50 px-3 py-1 text-xs font-bold uppercase tracking-normal text-cyan-700">
                <FaVideo className="h-3.5 w-3.5" aria-hidden="true" />
                Video Briefing
              </div>
              <h3 className="mt-3 text-2xl font-black text-slate-950">
                {mockVideoBrief.title}
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Status: {mockVideoBrief.status} · Duration:{" "}
                {mockVideoBrief.duration}
              </p>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-700 ring-1 ring-emerald-200">
              Ready for review
            </span>
          </div>

          <div className="mx-6 mb-6 grid min-h-72 place-items-center overflow-hidden rounded-3xl border border-slate-200 bg-[linear-gradient(135deg,#0f2742_0%,#123b5b_48%,#0f766e_100%)] p-8 text-center shadow-inner">
            <div className="max-w-md">
              <button
                className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-white text-cyan-700 shadow-2xl shadow-slate-950/30 transition hover:scale-105"
                type="button"
                aria-label="Play briefing placeholder"
              >
                <FaCirclePlay className="h-9 w-9" aria-hidden="true" />
              </button>
              <p className="mt-6 text-2xl font-black text-white">
                Executive video briefing area
              </p>
              <p className="mt-2 text-sm leading-6 text-cyan-50/80">
                Video player, Remotion scenes, and playback actions will be
                added in the video briefing step.
              </p>
            </div>
          </div>
        </article>

        <aside className="grid gap-4">
          <article className="rounded-3xl border border-white/80 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-bold uppercase tracking-normal text-cyan-700">
                Priority Actions
              </p>
              <FaBolt className="h-4 w-4 text-amber-500" aria-hidden="true" />
            </div>
            <div className="mt-4 grid gap-3">
              {priorityActions.map((action) => (
                <div
                  key={action.id}
                  className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-bold text-slate-900">
                      {action.title}
                    </p>
                    <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-200">
                      {action.priority}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    {action.owner} · {action.due}
                  </p>
                </div>
              ))}
            </div>
          </article>
        </aside>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {keyKpis.map((kpi) => {
          const TrendIcon =
            kpi.trendDirection === "up" ? FaArrowTrendUp : FaArrowTrendDown;

          return (
            <article
              key={kpi.id}
              className="group rounded-3xl border border-white/80 bg-white p-5 shadow-[0_16px_45px_rgba(15,23,42,0.07)] transition hover:-translate-y-1 hover:shadow-[0_24px_65px_rgba(15,23,42,0.11)]"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold text-slate-500">
                  {kpi.label}
                </p>
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-cyan-50 text-cyan-700">
                  <TrendIcon className="h-4 w-4" aria-hidden="true" />
                </span>
              </div>
              <div className="mt-4 flex items-end justify-between gap-3">
                <p className="text-3xl font-black text-slate-950">
                  {kpi.value}
                </p>
                <span
                  className={
                    kpi.trendDirection === "up"
                      ? "text-sm font-bold text-red-600"
                      : "text-sm font-bold text-amber-600"
                  }
                >
                  {kpi.trend}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                {kpi.description}
              </p>
            </article>
          );
        })}
      </section>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.7fr)]">
        <article className="rounded-3xl border border-white/80 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-xs font-bold uppercase tracking-normal text-red-700">
                <FaTriangleExclamation
                  className="h-3.5 w-3.5"
                  aria-hidden="true"
                />
                Critical Alerts
              </div>
              <h3 className="mt-3 text-2xl font-black text-slate-950">
                Items requiring leadership attention
              </h3>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-700">
              {mockCriticalAlerts.length} open
            </span>
          </div>

          <div className="mt-5 grid gap-3">
            {priorityAlerts.map((alert) => (
              <div
                key={alert.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-cyan-200 hover:shadow-md"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-bold text-slate-950">{alert.title}</p>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${
                      severityStyles[alert.severity] ?? severityStyles.Medium
                    }`}
                  >
                    {alert.severity}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {alert.description}
                </p>
                <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500">
                  <FaRegClock className="h-3 w-3" aria-hidden="true" />
                  {alert.department} · {alert.owner} · Due {alert.due}
                </p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-3xl border border-white/80 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <div className="inline-flex items-center gap-2 rounded-full bg-cyan-50 px-3 py-1 text-xs font-bold uppercase tracking-normal text-cyan-700">
            <FaClipboardCheck className="h-3.5 w-3.5" aria-hidden="true" />
            Insight Stories
          </div>
          <h3 className="mt-3 text-2xl font-black text-slate-950">
            Narrative signals
          </h3>
          <div className="mt-5 grid gap-4">
            {mockInsightStories.slice(0, 2).map((insight) => (
              <div
                key={insight.id}
                className="rounded-2xl border border-slate-100 bg-slate-50/90 p-4 shadow-sm"
              >
                <p className="font-bold text-slate-950">{insight.title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {insight.whatChanged}
                </p>
                <p className="mt-3 text-xs font-bold text-cyan-700">
                  Linked metric: {insight.linkedMetric}
                </p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}

export default DailyBrief;
