import { useMemo, useState } from "react";
import { FaXmark } from "react-icons/fa6";

const LIKELIHOOD_LABELS = [
  "Rare",
  "Unlikely",
  "Possible",
  "Likely",
  "Almost Certain",
];
const IMPACT_LABELS = [
  "Insignificant",
  "Minor",
  "Moderate",
  "Major",
  "Catastrophic",
];

// Light cell tint based on the cell's L * I (always inherent — sets the
// background "risk landscape" baseline regardless of mode).
function cellBgClass(L, I) {
  const inherent = L * I;
  if (inherent <= 6) return "bg-emerald-50 ring-emerald-100";
  if (inherent <= 12) return "bg-amber-50 ring-amber-100";
  return "bg-rose-50 ring-rose-100";
}

// Saturated bubble color band — different scales for the two modes.
function bubbleBandClass(value, isResidual) {
  if (isResidual) {
    if (value <= 8) return "bg-emerald-500 text-white ring-emerald-600";
    if (value <= 24) return "bg-amber-500 text-white ring-amber-600";
    return "bg-rose-500 text-white ring-rose-600";
  }
  if (value <= 6) return "bg-emerald-500 text-white ring-emerald-600";
  if (value <= 12) return "bg-amber-500 text-white ring-amber-600";
  return "bg-rose-500 text-white ring-rose-600";
}

function bubbleSize(count, maxCount) {
  if (count === 0) return 0;
  if (maxCount === 1) return 36;
  const min = 30;
  const max = 60;
  return Math.round(min + (count / maxCount) * (max - min));
}

function Heatmap({ risks, mode, onModeChange, onSelectRisk }) {
  const [selectedCell, setSelectedCell] = useState(null);

  const nonStrategic = useMemo(
    () => risks.filter((r) => r.tier !== "Strategic"),
    [risks],
  );

  const cellMap = useMemo(() => {
    const map = {};
    for (const r of nonStrategic) {
      const key = `${r.likelihood}-${r.impact}`;
      if (!map[key]) map[key] = [];
      map[key].push(r);
    }
    return map;
  }, [nonStrategic]);

  const maxCount = useMemo(
    () => Math.max(1, ...Object.values(cellMap).map((arr) => arr.length)),
    [cellMap],
  );

  const strategicCount = risks.length - nonStrategic.length;

  function handleCellClick(L, I) {
    const key = `${L}-${I}`;
    const cellRisks = cellMap[key];
    if (!cellRisks || cellRisks.length === 0) return;
    setSelectedCell((prev) =>
      prev && prev.L === L && prev.I === I ? null : { L, I },
    );
  }

  const selectedRisks = selectedCell
    ? (cellMap[`${selectedCell.L}-${selectedCell.I}`] ?? [])
    : null;

  // Build cells in document order: for each row (L=5 at top down to L=1), a row
  // label then 5 cells, then a bottom-row of column labels under L=1.
  const gridChildren = [];
  for (const L of [5, 4, 3, 2, 1]) {
    gridChildren.push(
      <div
        key={`row-label-${L}`}
        className="flex items-center justify-end pr-3 text-right"
      >
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            L = {L}
          </p>
          <p className="text-[10px] text-slate-400">
            {LIKELIHOOD_LABELS[L - 1]}
          </p>
        </div>
      </div>,
    );
    for (const I of [1, 2, 3, 4, 5]) {
      const cellRisks = cellMap[`${L}-${I}`] ?? [];
      gridChildren.push(
        <Cell
          key={`cell-${L}-${I}`}
          L={L}
          I={I}
          risks={cellRisks}
          mode={mode}
          maxCount={maxCount}
          isSelected={selectedCell?.L === L && selectedCell?.I === I}
          onClick={() => handleCellClick(L, I)}
        />,
      );
    }
  }
  // Empty corner under the row labels.
  gridChildren.push(<div key="corner" />);
  for (const I of [1, 2, 3, 4, 5]) {
    gridChildren.push(
      <div
        key={`col-label-${I}`}
        className="flex flex-col items-center justify-center pt-2"
      >
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
          I = {I}
        </p>
        <p className="text-[10px] text-slate-400">{IMPACT_LABELS[I - 1]}</p>
      </div>,
    );
  }

  return (
    <div className="grid gap-5 p-5 max-[520px]:p-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Mode
          </span>
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
            <button
              type="button"
              onClick={() => onModeChange("inherent")}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                mode === "inherent"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              Inherent (pre-controls)
            </button>
            <button
              type="button"
              onClick={() => onModeChange("residual")}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                mode === "residual"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              Residual (post-controls)
            </button>
          </div>
        </div>
        <p className="text-[11px] text-slate-500">
          {nonStrategic.length} plotted ·{" "}
          {strategicCount > 0
            ? `${strategicCount} strategic excluded`
            : "no strategic risks excluded"}
        </p>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-block min-w-[640px]">
          <div className="grid grid-cols-[120px_repeat(5,minmax(96px,1fr))] gap-1">
            {gridChildren}
          </div>
        </div>
      </div>

      <Legend mode={mode} />

      <DrillPanel
        selectedCell={selectedCell}
        risks={selectedRisks}
        mode={mode}
        onClose={() => setSelectedCell(null)}
        onSelectRisk={onSelectRisk}
      />
    </div>
  );
}

function Cell({ L, I, risks, mode, maxCount, isSelected, onClick }) {
  const count = risks.length;
  const inherent = L * I;
  const cellBg = cellBgClass(L, I);

  // Bubble band: in inherent mode, it's the cell's L*I; in residual mode,
  // it's the worst (max) residual rating among risks in this cell.
  let bubbleValue = inherent;
  if (mode === "residual" && count > 0) {
    bubbleValue = Math.max(...risks.map((r) => r.residualRating));
  }
  const size = bubbleSize(count, maxCount);

  return (
    <div
      className={`relative grid h-20 place-items-center rounded-lg ring-1 transition ${cellBg} ${
        isSelected ? "ring-2 ring-slate-900/40" : ""
      }`}
    >
      <span className="absolute left-1.5 top-1 text-[9px] font-medium text-slate-400">
        {inherent}
      </span>
      {count === 0 ? (
        <span className="text-[10px] text-slate-300">—</span>
      ) : (
        <button
          type="button"
          onClick={onClick}
          aria-label={`${count} risks at Likelihood ${L}, Impact ${I}`}
          className={`grid place-items-center rounded-full text-xs font-bold shadow-sm ring-2 transition hover:-translate-y-0.5 hover:shadow-md ${bubbleBandClass(
            bubbleValue,
            mode === "residual",
          )} ${isSelected ? "ring-4 ring-slate-900/70" : ""}`}
          style={{ width: size, height: size }}
        >
          {count}
        </button>
      )}
    </div>
  );
}

function Legend({ mode }) {
  const items =
    mode === "residual"
      ? [
          { swatch: "bg-emerald-500 ring-emerald-600", label: "≤ 8" },
          { swatch: "bg-amber-500 ring-amber-600", label: "9 – 24" },
          { swatch: "bg-rose-500 ring-rose-600", label: "≥ 25" },
        ]
      : [
          { swatch: "bg-emerald-500 ring-emerald-600", label: "≤ 6" },
          { swatch: "bg-amber-500 ring-amber-600", label: "7 – 12" },
          { swatch: "bg-rose-500 ring-rose-600", label: "≥ 13" },
        ];

  return (
    <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-500">
      <span className="font-medium uppercase tracking-wide text-slate-400">
        {mode === "residual" ? "Residual band" : "Inherent band"}
      </span>
      {items.map((item) => (
        <span key={item.label} className="inline-flex items-center gap-1.5">
          <span
            className={`inline-block h-3 w-3 rounded-full ring-2 ${item.swatch}`}
          />
          {item.label}
        </span>
      ))}
      <span className="text-slate-400">· bubble size = risk count</span>
    </div>
  );
}

function DrillPanel({ selectedCell, risks, mode, onClose, onSelectRisk }) {
  if (!selectedCell) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/40 p-4 text-center text-xs text-slate-500">
        Click any bubble to see the risks at that Likelihood × Impact cell.
      </div>
    );
  }

  const scoreLabel = mode === "residual" ? "Residual" : "Inherent";

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-900">
          L = {selectedCell.L} · I = {selectedCell.I} · {risks.length} risk
          {risks.length === 1 ? "" : "s"}
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 transition hover:text-slate-700"
        >
          <FaXmark className="h-2.5 w-2.5" aria-hidden="true" />
          Close
        </button>
      </div>
      <ul className="mt-3 divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200 bg-white">
        {risks.map((r) => (
          <li key={r.id}>
            <button
              type="button"
              onClick={() => onSelectRisk?.(r.id)}
              className="grid w-full grid-cols-[100px_1fr_auto] items-center gap-3 px-3 py-2 text-left text-xs transition hover:bg-slate-50"
            >
              <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-700">
                {r.riskNumber}
              </span>
              <span className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-900">
                  {r.title}
                </p>
                <p className="truncate text-[11px] text-slate-500">
                  {r.department} · {r.owner}
                </p>
              </span>
              <span className="flex items-center gap-2 text-[11px] text-slate-500">
                <span className="uppercase tracking-wide">{scoreLabel}</span>
                <span
                  className={`inline-flex h-6 min-w-[2.25rem] items-center justify-center rounded-md px-2 text-[11px] font-bold ring-1 ${bubbleBandClass(
                    mode === "residual" ? r.residualRating : r.inherentRating,
                    mode === "residual",
                  )}`}
                >
                  {mode === "residual" ? r.residualRating : r.inherentRating}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Heatmap;
