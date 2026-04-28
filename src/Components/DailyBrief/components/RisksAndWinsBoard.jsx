import { useState } from "react";

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
          <p className="text-xs font-bold uppercase tracking-normal text-red-700">
            Top 5 risks
          </p>
          <h2 className="mt-2 text-2xl font-black leading-tight text-slate-950">
            Risk ladder
          </h2>
        </div>
        <span className="rounded-full bg-red-50 px-3 py-1 text-sm font-black text-red-700 ring-1 ring-red-200">
          Ranked
        </span>
      </div>

      <div className="mt-5 grid gap-3">
        {risks.map((risk, index) => {
          const isSelected = selectedId === risk.id;

          return (
            <button
              key={risk.id}
              className={`grid grid-cols-[32px_minmax(0,1fr)_56px] items-center gap-3 rounded-2xl border p-3 text-left transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md ${
                isSelected
                  ? "border-red-200 bg-red-50 shadow-sm"
                  : "border-slate-100 bg-slate-50/80"
              }`}
              type="button"
              onClick={() => onSelect({ type: "risk", id: risk.id })}
            >
              <span className="text-sm font-black text-slate-400">
                {index + 1}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-black text-slate-950">
                  {risk.name}
                </span>
                <span className="mt-2 block h-2 overflow-hidden rounded-full bg-white ring-1 ring-slate-200">
                  <span
                    className="block h-full rounded-full bg-red-500"
                    style={{
                      width: `${(risk.inherentRiskScore / maxScore) * 100}%`,
                    }}
                  />
                </span>
              </span>
              <span className="text-right text-xl font-black text-red-700">
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
          <p className="text-xs font-bold uppercase tracking-normal text-emerald-700">
            Top 5 opportunities / wins
          </p>
          <h2 className="mt-2 text-2xl font-black leading-tight text-slate-950">
            Momentum tiles
          </h2>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-black text-emerald-700 ring-1 ring-emerald-200">
          {wins.filter((win) => win.canReplicateElsewhere).length} repeatable
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {wins.map((win) => {
          const isSelected = selectedId === win.id;

          return (
            <button
              key={win.id}
              className={`min-h-28 rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md ${
                isSelected
                  ? "border-emerald-200 bg-emerald-50 shadow-sm"
                  : "border-slate-100 bg-slate-50/80"
              }`}
              type="button"
              onClick={() => onSelect({ type: "win", id: win.id })}
            >
              <p className="text-xl font-black leading-none text-emerald-700">
                {win.measurableImprovement}
              </p>
              <p className="mt-3 text-sm font-black leading-tight text-slate-950">
                {win.title}
              </p>
              <p className="mt-2 text-xs font-semibold text-slate-500">
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
      <div className="rounded-3xl border border-emerald-100 bg-emerald-50/70 p-5">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_220px]">
          <div>
            <p className="text-xs font-black uppercase text-emerald-700">
              Selected win
            </p>
            <h3 className="mt-2 text-2xl font-black leading-tight text-slate-950">
              {win.title}
            </h3>
            <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
              {win.whyItMatters}
            </p>
          </div>
          <div className="rounded-2xl bg-white p-4 ring-1 ring-white">
            <p className="text-xs font-black uppercase text-slate-500">
              Improvement
            </p>
            <p className="mt-2 text-2xl font-black text-slate-950">
              {win.measurableImprovement}
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              {win.department}
            </p>
          </div>
        </div>
        <div className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-white">
          <p className="text-xs font-black uppercase text-slate-500">
            Replication
          </p>
          <p className="mt-2 text-sm font-bold leading-6 text-slate-700">
            {win.canReplicateElsewhere
              ? "Can be replicated elsewhere. "
              : "Monitor before wider replication. "}
            {win.replicationNote}
          </p>
        </div>
      </div>
    );
  }

  const risk = risks.find((item) => item.id === selection.id) ?? risks[0];

  return (
    <div className="rounded-3xl border border-red-100 bg-red-50/70 p-5">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div>
          <p className="text-xs font-black uppercase text-red-700">
            Selected risk
          </p>
          <h3 className="mt-2 text-2xl font-black leading-tight text-slate-950">
            {risk.name}
          </h3>
          <div className="mt-4 flex flex-wrap gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${
                trendStyles[risk.trend] ?? trendStyles.Stable
              }`}
            >
              {risk.trend}
            </span>
            <span
              className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${
                mitigationStyles[risk.mitigationStatus] ??
                mitigationStyles.Open
              }`}
            >
              {risk.mitigationStatus}
            </span>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-700 ring-1 ring-slate-200">
              Owner: {risk.owner}
            </span>
          </div>
        </div>
        <div className="rounded-2xl bg-white p-4 ring-1 ring-white">
          <p className="text-xs font-black uppercase text-slate-500">
            Inherent risk
          </p>
          <p className="mt-2 text-4xl font-black text-red-700">
            {risk.inherentRiskScore}
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            {risk.category}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-4">
        {[
          ["Severity", risk.scoring.severity],
          ["Likelihood", risk.scoring.likelihood],
          ["Urgency", risk.scoring.urgency],
          ["Exposure", risk.scoring.exposure],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl bg-white p-3 ring-1 ring-white">
            <p className="text-[11px] font-black uppercase text-slate-500">
              {label}
            </p>
            <p className="mt-1 text-xl font-black text-slate-950">{value}/5</p>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-white">
        <p className="text-xs font-black uppercase text-cyan-700">
          Next milestone
        </p>
        <p className="mt-2 text-sm font-black leading-6 text-slate-900">
          {risk.nextMilestone}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {risk.linkedItems.map((item) => (
            <span
              key={item}
              className="rounded-full bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-200"
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
    <section className="rounded-3xl border border-white/80 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
      <div className="grid gap-6 xl:grid-cols-2">
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

      <div className="mt-6">
        <SelectionDetail selection={selection} risks={risks} wins={wins} />
      </div>
    </section>
  );
}

export default RisksAndWinsBoard;
