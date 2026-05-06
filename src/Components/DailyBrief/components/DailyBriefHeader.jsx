import {
  FaArrowUpRightFromSquare,
  FaCalendarDay,
  FaCircleDot,
  FaFileCsv,
  FaPrint,
} from "react-icons/fa6";
import { ragStyles } from "./statusStyles";

function formatLongDate(dateValue) {
  return new Intl.DateTimeFormat("en", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(dateValue));
}

function formatTime(dateValue) {
  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(dateValue));
}

function DailyBriefHeader({ meta, status, alertCount, deadlineCount }) {
  const statusStyle = ragStyles[status.ragStatus] ?? ragStyles.Amber;

  const stats = [
    { label: "Weighted score", value: status.score, accent: "text-slate-900" },
    {
      label: "Critical alerts",
      value: alertCount,
      accent: "text-red-600",
    },
    {
      label: "Due today",
      value: deadlineCount,
      accent: "text-cyan-700",
    },
  ];

  return (
    <section className="relative min-w-0 overflow-hidden rounded-3xl border border-white/80 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.10)] max-[520px]:rounded-2xl">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,#cffafe_0%,transparent_55%),radial-gradient(circle_at_bottom_left,#e0f2fe_0%,transparent_50%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -right-16 h-64 w-64 rounded-full bg-cyan-200/40 blur-3xl"
      />

      <div className="relative grid gap-5 p-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-center max-[520px]:p-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-cyan-700 ring-1 ring-cyan-200">
              <FaCalendarDay className="h-3 w-3" aria-hidden="true" />
              {meta.period}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ${statusStyle.badge}`}
            >
              <FaCircleDot className="h-3 w-3" aria-hidden="true" />
              {status.ragStatus}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600 ring-1 ring-slate-200">
              For {meta.audience}
            </span>
          </div>

          <h1 className="mt-3 text-xl font-semibold leading-tight text-slate-900 max-[520px]:text-lg">
            {meta.organizationName}
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            {formatLongDate(meta.generatedAt)}
            <span className="mx-2 text-slate-300">•</span>
            Generated {formatTime(meta.generatedAt)}
            <span className="mx-2 text-slate-300">•</span>
            Owned by {meta.briefOwner}
          </p>

          <dl className="mt-4 grid grid-cols-3 gap-3 max-w-md">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-white/80 bg-white/80 p-3 shadow-sm backdrop-blur"
              >
                <dt className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                  {stat.label}
                </dt>
                <dd
                  className={`mt-1 text-xl font-semibold leading-none ${stat.accent}`}
                >
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="flex flex-wrap items-center gap-2 md:flex-col md:items-stretch">
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-md"
          >
            <FaArrowUpRightFromSquare className="h-3 w-3" aria-hidden="true" />
            Open full brief
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <FaFileCsv className="h-3 w-3" aria-hidden="true" />
              Export
            </button>
            <button
              type="button"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <FaPrint className="h-3 w-3" aria-hidden="true" />
              Print
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default DailyBriefHeader;
