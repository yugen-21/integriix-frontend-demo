import { useMemo, useState } from "react";
import {
  FaBookOpen,
  FaFilter,
  FaMagnifyingGlass,
  FaPlus,
  FaSort,
  FaSortDown,
  FaSortUp,
  FaTableCellsLarge,
  FaTableList,
  FaTrash,
  // FaWandMagicSparkles, // Generate button disabled — no backend endpoint
} from "react-icons/fa6";
import { departments, macroCategories, tiers } from "../../../data";
import Heatmap from "./Heatmap";

const PAGE_SIZE = 10;

const RESIDUAL_BANDS = [
  { value: "All", label: "All residual bands" },
  { value: "low", label: "Low · ≤ 8" },
  { value: "medium", label: "Medium · 9–24" },
  { value: "high", label: "High · ≥ 25" },
];

function matchesResidualBand(residual, band) {
  if (band === "low") return residual <= 8;
  if (band === "medium") return residual >= 9 && residual <= 24;
  if (band === "high") return residual >= 25;
  return true;
}

// Residual rating bands (range 1-75; lower is better).
function residualBandClass(residual) {
  if (residual <= 8) return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  if (residual <= 24) return "bg-amber-50 text-amber-700 ring-amber-200";
  return "bg-rose-50 text-rose-700 ring-rose-200";
}

// Inherent rating bands (range 1-25; lower is better).
function inherentBandClass(inherent) {
  if (inherent <= 6) return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  if (inherent <= 12) return "bg-amber-50 text-amber-700 ring-amber-200";
  return "bg-rose-50 text-rose-700 ring-rose-200";
}

const tierStyles = {
  Operational: "bg-slate-100 text-slate-700 ring-slate-200",
  "Process-Level": "bg-indigo-50 text-indigo-700 ring-indigo-200",
  Strategic: "bg-orange-50 text-orange-700 ring-orange-200",
};

const controlEffectiveness = {
  1: { label: "Strong", cls: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  2: { label: "Moderate", cls: "bg-amber-50 text-amber-700 ring-amber-200" },
  3: { label: "Weak", cls: "bg-rose-50 text-rose-700 ring-rose-200" },
};

const COLUMNS = [
  { key: "riskNumber", label: "Risk #", align: "left" },
  { key: "tier", label: "Tier", align: "left" },
  { key: "category", label: "Category", align: "left" },
  { key: "title", label: "Title", align: "left" },
  { key: "department", label: "Department", align: "left" },
  { key: "owner", label: "Owner", align: "left" },
  { key: "likelihood", label: "L", align: "center" },
  { key: "impact", label: "I", align: "center" },
  { key: "inherentRating", label: "Inherent", align: "center" },
  { key: "controlEffectiveness", label: "Control Eff.", align: "center" },
  { key: "residualRating", label: "Residual", align: "center" },
  { key: "mitigationOwner", label: "Mitigation Owner", align: "left" },
  { key: "_actions", label: "", align: "center", sortable: false },
];

function compare(a, b, key) {
  const av = a[key];
  const bv = b[key];
  if (typeof av === "number" && typeof bv === "number") return av - bv;
  return String(av ?? "").localeCompare(String(bv ?? ""));
}

function SortIcon({ active, dir }) {
  if (!active) return <FaSort className="h-2.5 w-2.5 text-slate-300" />;
  return dir === "asc" ? (
    <FaSortUp className="h-2.5 w-2.5 text-slate-700" />
  ) : (
    <FaSortDown className="h-2.5 w-2.5 text-slate-700" />
  );
}

function RiskList({ risks, loading, error, onSelect, onCreate, onDelete }) {
  const [sort, setSort] = useState({ key: "residualRating", dir: "desc" });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [macroCategoryFilter, setMacroCategoryFilter] = useState("All");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [tierFilter, setTierFilter] = useState("All");
  const [residualBandFilter, setResidualBandFilter] = useState("All");
  const [ownerFilter, setOwnerFilter] = useState("All");
  const [view, setView] = useState("table");
  const [heatmapMode, setHeatmapMode] = useState("residual");

  const ownerOptions = useMemo(
    () => Array.from(new Set(risks.map((r) => r.owner))).sort(),
    [risks],
  );

  const departmentOptions = useMemo(() => {
    const scoped =
      macroCategoryFilter === "All"
        ? departments
        : departments.filter((d) => d.macroCategory === macroCategoryFilter);
    return scoped.map((d) => d.name);
  }, [macroCategoryFilter]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return risks.filter((risk) => {
      if (macroCategoryFilter !== "All" && risk.macroCategory !== macroCategoryFilter)
        return false;
      if (departmentFilter !== "All" && risk.department !== departmentFilter)
        return false;
      if (tierFilter !== "All" && risk.tier !== tierFilter) return false;
      if (ownerFilter !== "All" && risk.owner !== ownerFilter) return false;
      if (
        residualBandFilter !== "All" &&
        !matchesResidualBand(risk.residualRating, residualBandFilter)
      )
        return false;
      if (term) {
        const haystack = [
          risk.riskNumber,
          risk.title,
          risk.description,
          risk.owner,
          risk.department,
          risk.category,
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  }, [
    risks,
    search,
    macroCategoryFilter,
    departmentFilter,
    tierFilter,
    residualBandFilter,
    ownerFilter,
  ]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      const cmp = compare(a, b, sort.key);
      return sort.dir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [filtered, sort]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = sorted.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const operationalCount = risks.filter((r) => r.tier === "Operational").length;
  const processCount = risks.filter((r) => r.tier === "Process-Level").length;
  const strategicCount = risks.filter((r) => r.tier === "Strategic").length;
  const departmentsCovered = new Set(risks.map((r) => r.department)).size;

  const hasActiveFilters =
    Boolean(search) ||
    macroCategoryFilter !== "All" ||
    departmentFilter !== "All" ||
    tierFilter !== "All" ||
    residualBandFilter !== "All" ||
    ownerFilter !== "All";

  function toggleSort(key) {
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" },
    );
    setPage(1);
  }

  function update(setter) {
    return (value) => {
      setter(value);
      setPage(1);
    };
  }

  function handleMacroCategoryChange(value) {
    setMacroCategoryFilter(value);
    // If the currently selected department is not in the new macro-category, clear it.
    if (
      value !== "All" &&
      departmentFilter !== "All" &&
      !departments.find(
        (d) => d.name === departmentFilter && d.macroCategory === value,
      )
    ) {
      setDepartmentFilter("All");
    }
    setPage(1);
  }

  function resetFilters() {
    setSearch("");
    setMacroCategoryFilter("All");
    setDepartmentFilter("All");
    setTierFilter("All");
    setResidualBandFilter("All");
    setOwnerFilter("All");
    setPage(1);
  }

  return (
    <div className="grid min-w-0 gap-5 max-[900px]:gap-4">
      <RiskHeader
        total={risks.length}
        operational={operationalCount}
        processLevel={processCount}
        strategic={strategicCount}
        departments={departmentsCovered}
      />

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
          {String(error)}
        </div>
      )}
      {loading && (
        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500">
          Loading risks…
        </div>
      )}

      <section className="relative min-w-0 overflow-hidden rounded-3xl border border-white/80 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)] max-[520px]:rounded-2xl">
        <div className="border-b border-slate-100 p-4 max-[520px]:p-3">
          <div className="flex flex-wrap items-center gap-2">
            <label className="relative min-w-[220px] flex-1">
              <span className="sr-only">Search risks</span>
              <FaMagnifyingGlass
                className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                type="search"
                value={search}
                onChange={(e) => update(setSearch)(e.target.value)}
                placeholder="Search by risk #, title, description, owner, department"
                className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/80 pl-9 pr-3 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-500/20"
              />
            </label>

            <select
              value={macroCategoryFilter}
              onChange={(e) => handleMacroCategoryChange(e.target.value)}
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
            >
              <option value="All">All categories</option>
              {macroCategories.map((mc) => (
                <option key={mc} value={mc}>
                  {mc}
                </option>
              ))}
            </select>

            <select
              value={departmentFilter}
              onChange={(e) => update(setDepartmentFilter)(e.target.value)}
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
            >
              <option value="All">All departments</option>
              {departmentOptions.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>

            <select
              value={tierFilter}
              onChange={(e) => update(setTierFilter)(e.target.value)}
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
            >
              <option value="All">All tiers</option>
              {tiers.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            <select
              value={residualBandFilter}
              onChange={(e) => update(setResidualBandFilter)(e.target.value)}
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
            >
              {RESIDUAL_BANDS.map((band) => (
                <option key={band.value} value={band.value}>
                  {band.label}
                </option>
              ))}
            </select>

            <select
              value={ownerFilter}
              onChange={(e) => update(setOwnerFilter)(e.target.value)}
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
            >
              <option value="All">All owners</option>
              {ownerOptions.map((owner) => (
                <option key={owner} value={owner}>
                  {owner}
                </option>
              ))}
            </select>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-slate-500 transition hover:text-slate-700"
              >
                Clear
              </button>
            )}

            <span className="ml-auto text-[11px] text-slate-500">
              {sorted.length} of {risks.length} risk
              {risks.length === 1 ? "" : "s"}
            </span>

            <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
              <button
                type="button"
                onClick={() => setView("table")}
                aria-pressed={view === "table"}
                className={`inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition ${
                  view === "table"
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <FaTableList className="h-3 w-3" aria-hidden="true" />
                Table
              </button>
              <button
                type="button"
                onClick={() => setView("heatmap")}
                aria-pressed={view === "heatmap"}
                className={`inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition ${
                  view === "heatmap"
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <FaTableCellsLarge className="h-3 w-3" aria-hidden="true" />
                Heatmap
              </button>
            </div>

            {onCreate && (
              <button
                type="button"
                onClick={onCreate}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-cyan-600 px-3 text-xs font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-cyan-700"
              >
                <FaPlus className="h-3 w-3" aria-hidden="true" />
                Create risk
              </button>
            )}

            {/* AI "Generate" button removed — no backend endpoint for AI risk
                generation. Re-enable once POST /v1/risks/generate exists. */}
            {/*
            {onGenerate && (
              <button
                type="button"
                onClick={onGenerate}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-slate-900 px-3 text-xs font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800"
              >
                <FaWandMagicSparkles className="h-3 w-3" aria-hidden="true" />
                Generate
              </button>
            )}
            */}
          </div>
        </div>

        {view === "heatmap" ? (
          <Heatmap
            risks={sorted}
            mode={heatmapMode}
            onModeChange={setHeatmapMode}
            onSelectRisk={onSelect}
          />
        ) : (
          <>
        <div className="min-w-0 overflow-x-auto">
          <table className="w-full min-w-[1180px] border-collapse text-left text-xs">
            <thead className="bg-slate-50/70 text-[10px] font-medium uppercase tracking-wide text-slate-500">
              <tr>
                {COLUMNS.map((col) =>
                  col.sortable === false ? (
                    <th
                      key={col.key}
                      className={`px-4 py-2.5 ${
                        col.align === "center" ? "text-center" : "text-left"
                      }`}
                    >
                      {col.label}
                    </th>
                  ) : (
                    <th
                      key={col.key}
                      className={`px-4 py-2.5 ${
                        col.align === "center" ? "text-center" : "text-left"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => toggleSort(col.key)}
                        className={`inline-flex items-center gap-1 transition hover:text-slate-700 ${
                          col.align === "center" ? "mx-auto" : ""
                        }`}
                      >
                        {col.label}
                        <SortIcon active={sort.key === col.key} dir={sort.dir} />
                      </button>
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pageItems.length === 0 ? (
                <tr>
                  <td colSpan={COLUMNS.length} className="px-4 py-12 text-center">
                    <div className="grid place-items-center gap-2 text-slate-400">
                      <FaFilter className="h-5 w-5" aria-hidden="true" />
                      <p className="text-sm font-medium text-slate-600">
                        {hasActiveFilters
                          ? "No risks match your filters"
                          : "No risks to display"}
                      </p>
                      {hasActiveFilters && (
                        <button
                          type="button"
                          onClick={resetFilters}
                          className="text-xs font-medium text-cyan-700 hover:underline"
                        >
                          Clear filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                pageItems.map((risk) => (
                  <RiskRow
                    key={risk.id}
                    risk={risk}
                    onSelect={onSelect}
                    onDelete={onDelete}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
          <p>
            Showing{" "}
            <span className="font-medium text-slate-700">
              {pageItems.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1}–
              {(safePage - 1) * PAGE_SIZE + pageItems.length}
            </span>{" "}
            of{" "}
            <span className="font-medium text-slate-700">{sorted.length}</span>
          </p>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="inline-flex h-8 items-center rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPage(p)}
                className={`inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-xs font-medium transition ${
                  p === safePage
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {p}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="inline-flex h-8 items-center rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
          </>
        )}
      </section>
    </div>
  );
}

function RiskHeader({ total, operational, processLevel, strategic, departments }) {
  const stats = [
    { label: "Total risks", value: total, accent: "text-slate-900" },
    { label: "Operational", value: operational, accent: "text-slate-900" },
    { label: "Process-Level", value: processLevel, accent: "text-indigo-700" },
    { label: "Departments", value: departments, accent: "text-cyan-700" },
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

      <div className="relative grid gap-5 p-6 max-[520px]:p-4">
        <div className="min-w-0">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-cyan-700 ring-1 ring-cyan-200">
            <FaBookOpen className="h-3 w-3" aria-hidden="true" />
            Risk, Audit & Governance
          </span>
          <h1 className="mt-2 text-xl font-semibold leading-tight text-slate-900 max-[520px]:text-lg">
            Risk register
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Enterprise-wide register of operational, process-level and
            strategic risks — including {strategic} escalated to corporate.
          </p>

          <dl className="mt-4 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
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
      </div>
    </section>
  );
}

function RiskRow({ risk, onSelect, onDelete }) {
  const isStrategic = risk.tier === "Strategic";
  const ctrl = controlEffectiveness[risk.controlEffectiveness];

  function handleRowClick() {
    onSelect?.(risk.id);
  }

  function handleRowKeyDown(event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect?.(risk.id);
    }
  }

  function handleDeleteClick(event) {
    event.stopPropagation();
    onDelete?.(risk.id);
  }

  return (
    <tr
      className={`group cursor-pointer transition hover:bg-slate-50/60 focus-within:bg-slate-50/60 ${
        isStrategic ? "opacity-60" : ""
      }`}
      onClick={handleRowClick}
      onKeyDown={handleRowKeyDown}
      tabIndex={0}
      role="link"
      aria-label={`Open ${risk.riskNumber} ${risk.title}`}
    >
      <td className="px-4 py-3">
        <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
          {risk.riskNumber}
        </span>
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${
            tierStyles[risk.tier] ?? tierStyles.Operational
          }`}
        >
          {risk.tier}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className="text-xs text-slate-700">{risk.category}</span>
      </td>
      <td className="px-4 py-3">
        <p className="line-clamp-2 max-w-[420px] text-sm font-medium text-slate-900 group-hover:text-cyan-700">
          {risk.title}
        </p>
      </td>
      <td className="px-4 py-3">
        <p className="text-xs text-slate-700">{risk.department}</p>
      </td>
      <td className="px-4 py-3">
        <p className="text-xs text-slate-700">{risk.owner}</p>
      </td>
      <td className="px-4 py-3 text-center">
        <span className="text-xs font-medium text-slate-700">
          {risk.likelihood}
        </span>
      </td>
      <td className="px-4 py-3 text-center">
        <span className="text-xs font-medium text-slate-700">
          {risk.impact}
        </span>
      </td>
      <td className="px-4 py-3 text-center">
        <span
          className={`inline-flex h-6 min-w-[2rem] items-center justify-center rounded-md px-2 text-[11px] font-semibold ring-1 ${inherentBandClass(
            risk.inherentRating,
          )}`}
        >
          {risk.inherentRating}
        </span>
      </td>
      <td className="px-4 py-3 text-center">
        {ctrl ? (
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${ctrl.cls}`}
          >
            {ctrl.label}
          </span>
        ) : (
          <span className="text-xs text-slate-400">—</span>
        )}
      </td>
      <td className="px-4 py-3 text-center">
        <span
          className={`inline-flex h-6 min-w-[2.25rem] items-center justify-center rounded-md px-2 text-[11px] font-bold ring-1 ${residualBandClass(
            risk.residualRating,
          )}`}
        >
          {risk.residualRating}
        </span>
      </td>
      <td className="px-4 py-3">
        <p className="text-xs text-slate-700">{risk.mitigationOwner}</p>
      </td>
      <td className="px-4 py-3 text-center">
        {onDelete && (
          <button
            type="button"
            onClick={handleDeleteClick}
            title="Delete risk"
            aria-label={`Delete ${risk.riskNumber}`}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
          >
            <FaTrash className="h-3 w-3" aria-hidden="true" />
          </button>
        )}
      </td>
    </tr>
  );
}

export default RiskList;
