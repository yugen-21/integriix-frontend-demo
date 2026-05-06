import { useState } from "react";
import {
  FaArrowTrendUp,
  FaCircleExclamation,
  FaTrophy,
} from "react-icons/fa6";

const trendStyles = {
  Worsening: "bg-red-100 text-red-800 ring-red-200",
  Stable: "bg-cyan-100 text-cyan-800 ring-cyan-200",
  Improving: "bg-emerald-100 text-emerald-800 ring-emerald-200",
};

const mitigationStyles = {
  Delayed: "bg-red-100 text-red-800 ring-red-200",
  Open: "bg-amber-100 text-amber-800 ring-amber-200",
  "In Progress": "bg-cyan-100 text-cyan-800 ring-cyan-200",
  Monitored: "bg-slate-100 text-slate-700 ring-slate-200",
};

function RiskLadder({ risks, selectedId, onSelect }) {
  const maxScore = Math.max(...risks.map((risk) => risk.inherentRiskScore));

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-700 ring-1 ring-red-200">
            <FaCircleExclamation className="h-3 w-3" aria-hidden="true" />
            Top 5 risks
          </span>
          <h2 className="mt-2 text-lg font-semibold leading-tight text-slate-900">
            Risk ladder
          </h2>
        </div>
        <span className="rounded-full bg-red-600 px-2.5 py-0.5 text-[11px] font-semibold text-white shadow-sm">
          Ranked
        </span>
      </div>

      <div className="mt-4 grid gap-2">
        {risks.map((risk, index) => {
          const isSelected = selectedId === risk.id;
          const widthPct = (risk.inherentRiskScore / maxScore) * 100;

          return (
            <button
              key={risk.id}
              className={`group relative grid grid-cols-[24px_minmax(0,1fr)_44px] items-center gap-3 overflow-hidden rounded-xl border bg-white p-2.5 text-left transition hover:-translate-y-0.5 hover:shadow-md min-[521px]:grid-cols-[30px_minmax(0,1fr)_52px] ${
                isSelected
                  ? "border-red-300 shadow-md"
                  : "border-slate-100"
              }`}
              type="button"
              onClick={() => onSelect({ type: "risk", id: risk.id })}
            >
              <span
                className={`absolute left-0 top-0 h-full w-1 transition-all ${
                  isSelected ? "bg-red-500" : "bg-transparent group-hover:bg-red-200"
                }`}
              />
              <span
                className={`grid h-6 w-6 place-items-center rounded-full text-[11px] font-semibold ${
                  isSelected
                    ? "bg-red-600 text-white"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {index + 1}
              </span>
              <span className="min-w-0">
                <span className="block break-words text-sm font-medium text-slate-900">
                  {risk.name}
                </span>
                <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <span
                    className="block h-full rounded-full bg-gradient-to-r from-red-500 to-red-400"
                    style={{ width: `${widthPct}%` }}
                  />
                </span>
              </span>
              <span className="text-right text-base font-semibold text-red-700">
                {risk.inherentRiskScore}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function WinTiles({ wins, selectedId, onSelect }) {
  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 ring-1 ring-emerald-200">
            <FaTrophy className="h-3 w-3" aria-hidden="true" />
            Top 5 wins
          </span>
          <h2 className="mt-2 text-lg font-semibold leading-tight text-slate-900">
            Momentum tiles
          </h2>
        </div>
        <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-[11px] font-semibold text-white shadow-sm">
          {wins.filter((win) => win.canReplicateElsewhere).length} repeatable
        </span>
      </div>

      <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
        {wins.map((win) => {
          const isSelected = selectedId === win.id;

          return (
            <button
              key={win.id}
              className={`group relative min-h-24 overflow-hidden rounded-xl border bg-white p-3 text-left transition hover:-translate-y-0.5 hover:shadow-md ${
                isSelected
                  ? "border-emerald-300 shadow-md"
                  : "border-slate-100"
              }`}
              type="button"
              onClick={() => onSelect({ type: "win", id: win.id })}
            >
              <span
                className={`absolute left-0 top-0 h-full w-1 transition-all ${
                  isSelected ? "bg-emerald-500" : "bg-transparent group-hover:bg-emerald-200"
                }`}
              />
              <div className="flex items-center gap-2">
                <FaArrowTrendUp
                  className="h-3 w-3 text-emerald-600"
                  aria-hidden="true"
                />
                <p className="text-base font-semibold leading-none text-emerald-700">
                  {win.measurableImprovement}
                </p>
              </div>
              <p className="mt-2 text-xs font-medium text-slate-900">
                {win.title}
              </p>
              <p className="mt-1.5 inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 ring-1 ring-emerald-200">
                {win.department}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SelectionDetail({ selection, risks, wins }) {
  if (selection.type === "win") {
    const win = wins.find((item) => item.id === selection.id) ?? wins[0];

    return (
      <div className="relative overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/80 to-white p-4">
        <div className="absolute left-0 top-0 h-full w-1.5 bg-emerald-500" />
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
          <div>
            <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
              <FaTrophy className="h-3 w-3" aria-hidden="true" />
              Selected win
            </p>
            <h3 className="mt-1.5 text-lg font-semibold leading-tight text-slate-900">
              {win.title}
            </h3>
            <p className="mt-2 text-xs leading-5 text-slate-600">
              {win.whyItMatters}
            </p>
          </div>
          <div className="rounded-xl border border-white bg-white p-3 shadow-sm">
            <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
              Improvement
            </p>
            <p className="mt-1.5 text-2xl font-semibold tracking-tight text-emerald-700">
              {win.measurableImprovement}
            </p>
            <p className="mt-1 text-[11px] text-slate-500">{win.department}</p>
          </div>
        </div>
        <div className="mt-3 rounded-xl border border-slate-100 bg-white/80 p-3 shadow-sm">
          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
            Replication
          </p>
          <p className="mt-1.5 text-xs leading-5 text-slate-700">
            <span
              className={`mr-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${
                win.canReplicateElsewhere
                  ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                  : "bg-amber-50 text-amber-700 ring-amber-200"
              }`}
            >
              {win.canReplicateElsewhere ? "Repeatable" : "Monitor first"}
            </span>
            {win.replicationNote}
          </p>
        </div>
      </div>
    );
  }

  const risk = risks.find((item) => item.id === selection.id) ?? risks[0];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-red-200 bg-gradient-to-br from-red-50/80 to-white p-4">
      <div className="absolute left-0 top-0 h-full w-1.5 bg-red-500" />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div>
          <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-red-700">
            <FaCircleExclamation className="h-3 w-3" aria-hidden="true" />
            Selected risk
          </p>
          <h3 className="mt-1.5 text-lg font-semibold leading-tight text-slate-900">
            {risk.name}
          </h3>
          <div className="mt-3 flex flex-wrap gap-2">
            <span
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${
                trendStyles[risk.trend] ?? trendStyles.Stable
              }`}
            >
              {risk.trend}
            </span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${
                mitigationStyles[risk.mitigationStatus] ?? mitigationStyles.Open
              }`}
            >
              {risk.mitigationStatus}
            </span>
            <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-medium text-slate-700 ring-1 ring-slate-200">
              Owner: {risk.owner}
            </span>
          </div>
        </div>
        <div className="rounded-xl border border-white bg-white p-3 shadow-sm">
          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
            Inherent risk
          </p>
          <p className="mt-1.5 text-2xl font-semibold tracking-tight text-red-700">
            {risk.inherentRiskScore}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">{risk.category}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-2 grid-cols-2 md:grid-cols-4">
        {[
          ["Severity", risk.scoring.severity],
          ["Likelihood", risk.scoring.likelihood],
          ["Urgency", risk.scoring.urgency],
          ["Exposure", risk.scoring.exposure],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-xl border border-slate-100 bg-white p-2.5 shadow-sm"
          >
            <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
              {label}
            </p>
            <div className="mt-1 flex items-baseline gap-1">
              <p className="text-base font-semibold text-slate-900">{value}</p>
              <span className="text-[11px] text-slate-400">/5</span>
            </div>
            <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-slate-100">
              <span
                className="block h-full rounded-full bg-red-500"
                style={{ width: `${(value / 5) * 100}%` }}
              />
            </span>
          </div>
        ))}
      </div>

      <div className="mt-3 rounded-xl border border-cyan-200 bg-gradient-to-br from-white to-cyan-50/40 p-3.5">
        <p className="text-[10px] font-medium uppercase tracking-wide text-cyan-700">
          Next milestone
        </p>
        <p className="mt-1.5 text-xs font-medium leading-5 text-slate-800">
          {risk.nextMilestone}
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {risk.linkedItems.map((item) => (
            <span
              key={item}
              className="rounded-full bg-white px-2.5 py-0.5 text-[10px] font-medium text-slate-600 ring-1 ring-slate-200"
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function RisksAndWinsBoard({ risks, wins }) {
  const [selection, setSelection] = useState({
    type: "risk",
    id: risks[0]?.id,
  });

  return (
    <section className="relative min-w-0 overflow-hidden rounded-3xl border border-white/80 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] max-[520px]:rounded-2xl max-[520px]:p-4">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-12 left-1/3 h-44 w-44 rounded-full bg-cyan-100/30 blur-3xl"
      />

      <div className="relative grid min-w-0 gap-6 xl:grid-cols-2">
        <RiskLadder
          risks={risks}
          selectedId={selection.type === "risk" ? selection.id : null}
          onSelect={setSelection}
        />
        <WinTiles
          wins={wins}
          selectedId={selection.type === "win" ? selection.id : null}
          onSelect={setSelection}
        />
      </div>

      <div className="relative mt-6">
        <SelectionDetail selection={selection} risks={risks} wins={wins} />
      </div>
    </section>
  );
}

export default RisksAndWinsBoard;
