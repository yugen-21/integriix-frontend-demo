import { FaBars, FaBell, FaMagnifyingGlass } from "react-icons/fa6";

function Header({ onOpenSidebar }) {
  return (
    <header className="sticky top-0 z-30 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 border-b border-white/70 bg-white/85 px-8 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur-xl min-[901px]:flex min-[901px]:items-center min-[901px]:justify-between min-[901px]:gap-6 max-[900px]:px-4 max-[900px]:py-3 max-[520px]:px-3">
      <div className="flex min-w-0 items-start gap-3">
        <button
          className="hidden h-11 w-11 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 max-[900px]:grid"
          type="button"
          aria-label="Open navigation"
          onClick={onOpenSidebar}
        >
          <FaBars className="h-4 w-4" aria-hidden="true" />
        </button>

        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-normal text-cyan-700 max-[900px]:hidden">
            Healthcare Governance Platform
          </p>
          <h1 className="text-2xl font-black leading-tight text-slate-950 max-[520px]:text-lg">
            Integriix Command Center
          </h1>
        </div>
      </div>

      <div className="contents min-[901px]:flex min-[901px]:flex-1 min-[901px]:items-center min-[901px]:justify-end min-[901px]:gap-4">
        <label className="relative col-span-2 row-start-2 w-full min-[901px]:col-auto min-[901px]:row-auto min-[901px]:max-w-md">
          <span className="sr-only">Search Integriix</span>
          <FaMagnifyingGlass
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            className="h-10 w-full rounded-xl border border-slate-200/80 bg-slate-50/90 pl-10 pr-3 text-sm text-slate-900 shadow-inner outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-500/10 min-[901px]:h-11"
            type="search"
            placeholder="Search dashboards, risks, audits..."
          />
        </label>

        <button
          className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md min-[901px]:h-11 min-[901px]:w-11"
          type="button"
          aria-label="Notifications"
        >
          <FaBell className="h-4 w-4" aria-hidden="true" />
          <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-amber-400 ring-2 ring-white" />
        </button>

        <div className="hidden shrink-0 text-right lg:block">
          <p className="text-sm font-bold text-slate-900">
            Chief Quality Officer
          </p>
          <p className="text-xs text-slate-500">
            Riverside metropolitan hospital
          </p>
        </div>
      </div>
    </header>
  );
}

export default Header;
