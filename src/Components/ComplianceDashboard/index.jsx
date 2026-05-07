import { useMemo } from "react";
import {
  FaArrowRight,
  FaArrowTrendUp,
  FaCalendarCheck,
  FaChartColumn,
  FaCircleCheck,
  FaClockRotateLeft,
  FaTriangleExclamation,
} from "react-icons/fa6";
import { mockPolicies, policyCategories, policyStatuses } from "../../data";

const TODAY = new Date("2026-05-06T00:00:00+05:30");

function navigateTo(href) {
  window.location.assign(href);
}

function isOverdue(dateValue) {
  return new Date(dateValue) < TODAY;
}

function daysBetween(target) {
  const t = new Date(target);
  const diffMs = t - TODAY;
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

function pct(num, denom) {
  if (denom === 0) return 0;
  return Math.round((num / denom) * 100);
}

function ComplianceDashboard() {
  const stats = useMemo(() => {
    const total = mockPolicies.length;
    const active = mockPolicies.filter((p) => p.status === "Active").length;
    const inReview = mockPolicies.filter(
      (p) => p.status === "In Review",
    ).length;
    const draft = mockPolicies.filter((p) => p.status === "Draft").length;
    const overdue = mockPolicies.filter((p) =>
      isOverdue(p.nextReview),
    ).length;
    const dueSoon = mockPolicies.filter((p) => {
      const days = daysBetween(p.nextReview);
      return days >= 0 && days <= 30;
    }).length;
    const approved = mockPolicies.filter((p) => p.status === "Approved").length;

    return {
      total,
      active,
      inReview,
      draft,
      overdue,
      dueSoon,
      approved,
      backlog: inReview + draft,
    };
  }, []);

  const categoryBuckets = useMemo(() => {
    return policyCategories
      .map((cat) => {
        const items = mockPolicies.filter((p) => p.category === cat);
        const overdueIn = items.filter((p) => isOverdue(p.nextReview)).length;
        return {
          category: cat,
          count: items.length,
          overdue: overdueIn,
        };
      })
      .sort((a, b) => b.count - a.count);
  }, []);

  const statusBuckets = useMemo(() => {
    return policyStatuses.map((status) => ({
      status,
      count: mockPolicies.filter((p) => p.status === status).length,
    }));
  }, []);

  const cadenceTrend = useMemo(() => {
    return buildCadenceTrend(mockPolicies);
  }, []);

  const topOverdue = useMemo(() => {
    return mockPolicies
      .filter((p) => isOverdue(p.nextReview))
      .map((p) => ({ ...p, days: Math.abs(daysBetween(p.nextReview)) }))
      .sort((a, b) => b.days - a.days)
      .slice(0, 5);
  }, []);

  const ownerLoad = useMemo(() => {
    const map = new Map();
    mockPolicies.forEach((p) => {
      const entry = map.get(p.owner) ?? {
        owner: p.owner,
        total: 0,
        overdue: 0,
      };
      entry.total += 1;
      if (isOverdue(p.nextReview)) entry.overdue += 1;
      map.set(p.owner, entry);
    });
    return [...map.values()]
      .sort((a, b) => b.overdue - a.overdue || b.total - a.total)
      .slice(0, 5);
  }, []);

  return (
    <div className="grid min-w-0 gap-5 max-[900px]:gap-4">
      <Header total={stats.total} />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Active policies"
          value={stats.active}
          accent="text-emerald-700"
          icon={FaCircleCheck}
          ringClass="ring-emerald-200"
          bgClass="bg-emerald-50"
          hint={`${pct(stats.active, stats.total)}% of register`}
        />
        <KpiCard
          label="Overdue review"
          value={stats.overdue}
          accent="text-red-700"
          icon={FaTriangleExclamation}
          ringClass="ring-red-200"
          bgClass="bg-red-50"
          hint={`${pct(stats.overdue, stats.total)}% of register`}
          onClick={() => navigateTo("/overdue")}
        />
        <KpiCard
          label="Review backlog"
          value={stats.backlog}
          accent="text-amber-700"
          icon={FaClockRotateLeft}
          ringClass="ring-amber-200"
          bgClass="bg-amber-50"
          hint={`${stats.inReview} in review · ${stats.draft} draft`}
          onClick={() => navigateTo("/reviewer-queue")}
        />
        <KpiCard
          label="Due in 30 days"
          value={stats.dueSoon}
          accent="text-cyan-700"
          icon={FaCalendarCheck}
          ringClass="ring-cyan-200"
          bgClass="bg-cyan-50"
          hint="Heads-up for owners"
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid min-w-0 content-start gap-5">
          <CategoryChart buckets={categoryBuckets} total={stats.total} />
          <CadenceChart points={cadenceTrend} />
        </div>

        <div className="grid min-w-0 content-start gap-5">
          <StatusBreakdown buckets={statusBuckets} total={stats.total} />
          <OverdueLeaderboard rows={topOverdue} />
          <OwnerLoad rows={ownerLoad} />
        </div>
      </section>
    </div>
  );
}

function Header({ total }) {
  return (
    <section className="relative min-w-0 overflow-hidden rounded-3xl border border-white/80 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.10)] max-[520px]:rounded-2xl">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,#cffafe_0%,transparent_55%),radial-gradient(circle_at_bottom_left,#dbeafe_0%,transparent_50%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -right-16 h-64 w-64 rounded-full bg-cyan-200/40 blur-3xl"
      />

      <div className="relative grid gap-2 p-6 max-[520px]:p-4">
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-cyan-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-cyan-700 ring-1 ring-cyan-200">
          <FaChartColumn className="h-3 w-3" aria-hidden="true" />
          Compliance dashboard
        </span>
        <h1 className="text-xl font-semibold leading-tight text-slate-900 max-[520px]:text-lg">
          Policy register health
        </h1>
        <p className="text-xs text-slate-500">
          Snapshot of {total} policies across status, review cadence, and
          ownership.
        </p>
      </div>
    </section>
  );
}

function KpiCard({
  label,
  value,
  accent,
  icon: Icon,
  ringClass,
  bgClass,
  hint,
  onClick,
}) {
  const interactive = typeof onClick === "function";
  const Tag = interactive ? "button" : "div";

  return (
    <Tag
      type={interactive ? "button" : undefined}
      onClick={onClick}
      className={`group relative grid min-w-0 gap-3 rounded-2xl border border-white/80 bg-white p-5 text-left shadow-[0_18px_45px_rgba(15,23,42,0.06)] transition ${
        interactive
          ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_22px_55px_rgba(15,23,42,0.10)]"
          : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={`grid h-10 w-10 place-items-center rounded-xl ${bgClass} ${accent} ring-1 ${ringClass}`}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        {interactive && (
          <span className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 transition group-hover:bg-slate-100 group-hover:text-slate-700">
            <FaArrowRight className="h-3 w-3" aria-hidden="true" />
          </span>
        )}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
          {label}
        </p>
        <p
          className={`mt-1 text-2xl font-semibold leading-none ${accent}`}
        >
          {value}
        </p>
        {hint && (
          <p className="mt-1 text-[11px] text-slate-500">{hint}</p>
        )}
      </div>
    </Tag>
  );
}

function CategoryChart({ buckets, total }) {
  const max = Math.max(1, ...buckets.map((b) => b.count));

  return (
    <section className="rounded-3xl border border-white/80 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)] max-[520px]:rounded-2xl max-[520px]:p-4">
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-cyan-700">
            By category
          </p>
          <h2 className="mt-1 text-base font-semibold text-slate-900">
            Policies per category
          </h2>
          <p className="mt-0.5 text-[11px] text-slate-500">
            Red segment shows the share that is overdue for review.
          </p>
        </div>
        <span className="text-[11px] text-slate-500">{total} total</span>
      </div>

      <div className="mt-4 grid gap-3">
        {buckets.map((bucket) => {
          const widthPct = Math.round((bucket.count / max) * 100);
          const overduePct =
            bucket.count === 0
              ? 0
              : Math.round((bucket.overdue / bucket.count) * 100);
          return (
            <div key={bucket.category} className="grid gap-1">
              <div className="flex items-center justify-between text-[11px] text-slate-700">
                <span className="font-medium">{bucket.category}</span>
                <span className="text-slate-500">
                  {bucket.count}
                  {bucket.overdue > 0 && (
                    <span className="ml-1 text-red-700">
                      ({bucket.overdue} overdue)
                    </span>
                  )}
                </span>
              </div>
              <div
                className="relative h-3 overflow-hidden rounded-full bg-slate-100"
                role="img"
                aria-label={`${bucket.category}: ${bucket.count} policies, ${bucket.overdue} overdue`}
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-cyan-400"
                  style={{ width: `${widthPct}%` }}
                />
                {bucket.overdue > 0 && (
                  <div
                    className="absolute inset-y-0 left-0 h-full rounded-full bg-red-500/80"
                    style={{
                      width: `${Math.round((bucket.overdue / max) * 100)}%`,
                    }}
                  />
                )}
              </div>
              <div className="text-[10px] text-slate-400">
                {overduePct}% of category overdue
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function CadenceChart({ points }) {
  const width = 560;
  const height = 180;
  const padding = { top: 16, right: 16, bottom: 30, left: 32 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const xStep = points.length > 1 ? innerW / (points.length - 1) : innerW;

  function pointAt(i, value) {
    const x = padding.left + i * xStep;
    const y = padding.top + (1 - value / 100) * innerH;
    return [x, y];
  }

  const linePath = points
    .map((p, i) => {
      const [x, y] = pointAt(i, p.onTimeRate);
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");

  const areaPath = `${linePath} L ${(padding.left + (points.length - 1) * xStep).toFixed(
    1,
  )} ${(padding.top + innerH).toFixed(1)} L ${padding.left.toFixed(1)} ${(
    padding.top + innerH
  ).toFixed(1)} Z`;

  const latest = points[points.length - 1];
  const earliest = points[0];
  const delta =
    latest && earliest ? latest.onTimeRate - earliest.onTimeRate : 0;

  return (
    <section className="rounded-3xl border border-white/80 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)] max-[520px]:rounded-2xl max-[520px]:p-4">
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-cyan-700">
            Review cadence
          </p>
          <h2 className="mt-1 text-base font-semibold text-slate-900">
            On-time review rate
          </h2>
          <p className="mt-0.5 text-[11px] text-slate-500">
            % of reviews completed before their due date, last 12 months.
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-semibold leading-none text-slate-900">
            {latest?.onTimeRate ?? 0}%
          </p>
          <p
            className={`mt-1 inline-flex items-center gap-1 text-[11px] font-semibold ${
              delta >= 0 ? "text-emerald-700" : "text-red-700"
            }`}
          >
            <FaArrowTrendUp
              className={`h-2.5 w-2.5 ${delta < 0 ? "-rotate-90" : ""}`}
              aria-hidden="true"
            />
            {delta >= 0 ? "+" : ""}
            {delta} pts vs 12mo ago
          </p>
        </div>
      </div>

      <div className="mt-4 -mx-1 overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="block w-full min-w-[360px]"
          role="img"
          aria-label="On-time review rate by month"
        >
          <defs>
            <linearGradient id="cadence-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
            </linearGradient>
          </defs>

          {[0, 25, 50, 75, 100].map((tick) => {
            const y = padding.top + (1 - tick / 100) * innerH;
            return (
              <g key={tick}>
                <line
                  x1={padding.left}
                  x2={padding.left + innerW}
                  y1={y}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeDasharray="4 4"
                />
                <text
                  x={padding.left - 6}
                  y={y + 3}
                  textAnchor="end"
                  className="fill-slate-400 text-[9px]"
                >
                  {tick}
                </text>
              </g>
            );
          })}

          <path d={areaPath} fill="url(#cadence-fill)" />
          <path
            d={linePath}
            fill="none"
            stroke="#0891b2"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {points.map((p, i) => {
            const [x, y] = pointAt(i, p.onTimeRate);
            return (
              <g key={p.label}>
                <circle cx={x} cy={y} r={3} fill="#0891b2" />
                <text
                  x={x}
                  y={padding.top + innerH + 14}
                  textAnchor="middle"
                  className="fill-slate-400 text-[9px]"
                >
                  {p.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </section>
  );
}

const statusStyles = {
  Draft: { bg: "bg-slate-200", text: "text-slate-700" },
  "In Review": { bg: "bg-amber-300", text: "text-amber-800" },
  Approved: { bg: "bg-cyan-400", text: "text-cyan-800" },
  Active: { bg: "bg-emerald-500", text: "text-emerald-800" },
  Archived: { bg: "bg-slate-400", text: "text-slate-700" },
};

function StatusBreakdown({ buckets, total }) {
  return (
    <section className="rounded-3xl border border-white/80 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)] max-[520px]:rounded-2xl max-[520px]:p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-cyan-700">
        By status
      </p>
      <h2 className="mt-1 text-base font-semibold text-slate-900">
        Lifecycle distribution
      </h2>

      <div className="mt-4 flex h-2.5 overflow-hidden rounded-full bg-slate-100">
        {buckets.map((bucket) => {
          const width = total > 0 ? (bucket.count / total) * 100 : 0;
          if (width === 0) return null;
          return (
            <div
              key={bucket.status}
              className={`h-full ${statusStyles[bucket.status]?.bg ?? "bg-slate-300"}`}
              style={{ width: `${width}%` }}
              title={`${bucket.status}: ${bucket.count}`}
            />
          );
        })}
      </div>

      <ul className="mt-4 grid gap-2">
        {buckets.map((bucket) => {
          const widthPct = pct(bucket.count, total);
          const styles = statusStyles[bucket.status] ?? statusStyles.Draft;
          return (
            <li
              key={bucket.status}
              className="flex items-center justify-between gap-3 text-[11px]"
            >
              <span className="inline-flex items-center gap-2">
                <span
                  className={`h-2.5 w-2.5 rounded-sm ${styles.bg}`}
                  aria-hidden="true"
                />
                <span className={`font-medium ${styles.text}`}>
                  {bucket.status}
                </span>
              </span>
              <span className="text-slate-500">
                {bucket.count}{" "}
                <span className="text-slate-400">({widthPct}%)</span>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function OverdueLeaderboard({ rows }) {
  if (rows.length === 0) {
    return (
      <section className="rounded-3xl border border-white/80 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)] max-[520px]:rounded-2xl max-[520px]:p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-cyan-700">
          Worst overdue
        </p>
        <p className="mt-2 text-xs text-slate-500">
          No policies are past due — review cycles are on track.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-white/80 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)] max-[520px]:rounded-2xl max-[520px]:p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-cyan-700">
          Worst overdue
        </p>
        <button
          type="button"
          onClick={() => navigateTo("/overdue")}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-700 transition hover:underline"
        >
          See all
          <FaArrowRight className="h-2.5 w-2.5" aria-hidden="true" />
        </button>
      </div>

      <ol className="mt-3 grid gap-2">
        {rows.map((row) => (
          <li
            key={row.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2"
          >
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-[11px] font-semibold text-slate-900">
                <span className="rounded bg-slate-900 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  {row.code}
                </span>
                <span className="truncate">{row.title}</span>
              </p>
              <p className="mt-0.5 truncate text-[10px] text-slate-500">
                {row.owner}
              </p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700 ring-1 ring-red-200">
              <FaTriangleExclamation
                className="h-2.5 w-2.5"
                aria-hidden="true"
              />
              {row.days}d
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

function OwnerLoad({ rows }) {
  if (rows.length === 0) return null;
  const max = Math.max(1, ...rows.map((r) => r.total));

  return (
    <section className="rounded-3xl border border-white/80 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)] max-[520px]:rounded-2xl max-[520px]:p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-cyan-700">
        Owner load
      </p>
      <h2 className="mt-1 text-base font-semibold text-slate-900">
        Top owners by policies under management
      </h2>

      <ul className="mt-3 grid gap-2.5">
        {rows.map((row) => {
          const widthPct = Math.round((row.total / max) * 100);
          const overdueShare =
            row.total > 0 ? Math.round((row.overdue / row.total) * 100) : 0;
          return (
            <li key={row.owner} className="grid gap-1">
              <div className="flex items-center justify-between gap-3 text-[11px]">
                <span className="truncate font-medium text-slate-700">
                  {row.owner}
                </span>
                <span className="text-slate-500">
                  {row.total}
                  {row.overdue > 0 && (
                    <span className="ml-1 text-red-700">
                      ({row.overdue} late)
                    </span>
                  )}
                </span>
              </div>
              <div className="relative h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-cyan-400"
                  style={{ width: `${widthPct}%` }}
                />
                {row.overdue > 0 && (
                  <div
                    className="absolute inset-y-0 left-0 h-full rounded-full bg-red-400/80"
                    style={{
                      width: `${Math.round(
                        ((row.overdue / max) * 100 * overdueShare) /
                          Math.max(overdueShare, 1),
                      )}%`,
                    }}
                  />
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function buildCadenceTrend(policies) {
  const months = [];
  for (let i = 11; i >= 0; i -= 1) {
    const d = new Date(TODAY);
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    months.push(d);
  }

  const monthLabels = months.map((d) =>
    new Intl.DateTimeFormat("en", { month: "short" }).format(d),
  );

  const baseRate = clamp(
    78 +
      (policies.filter((p) => p.status === "Active").length -
        policies.filter((p) => isOverdue(p.nextReview)).length) /
        Math.max(policies.length, 1) *
        12,
    55,
    96,
  );

  return months.map((d, idx) => {
    const month = d.getMonth();
    const wave = Math.sin((idx / 11) * Math.PI * 2) * 4;
    const drift = ((idx - 5.5) / 11) * 6;
    const noise = ((month * 13 + idx * 7) % 5) - 2;
    const onTimeRate = clamp(Math.round(baseRate + drift + wave + noise), 40, 99);
    return {
      label: monthLabels[idx],
      onTimeRate,
    };
  });
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export default ComplianceDashboard;
