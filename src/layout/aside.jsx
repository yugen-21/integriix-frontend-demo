import { useState } from "react";
import * as FaIcons from "react-icons/fa6";
import { FaChevronDown, FaChevronUp, FaXmark } from "react-icons/fa6";
import menuItems from "../menu.json";

const dailyBriefSubItems = [
  { name: "Total score", url: "/#total-score" },
  { name: "Critical alerts", url: "/#critical-alerts" },
  { name: "Top risk and opportunities", url: "/#risks-opportunities" },
  { name: "Due today", url: "/#due-today" },
];

function MenuIcon({ name }) {
  const Icon = FaIcons[name] ?? FaIcons.FaCircle;

  return <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />;
}

function Aside({ isOpen = false, onClose }) {
  const currentPath = window.location.pathname;
  const [isDailyBriefOpen, setIsDailyBriefOpen] = useState(true);

  return (
    <>
      <button
        className={
          isOpen
            ? "fixed inset-0 z-40 hidden bg-slate-950/35 backdrop-blur-[2px] max-[900px]:block"
            : "hidden"
        }
        type="button"
        aria-label="Close navigation overlay"
        onClick={onClose}
      />

      <aside
        className={
          isOpen
            ? "fixed inset-y-0 left-0 z-50 w-1/2 min-w-[260px] overflow-hidden bg-[#08243d] px-5 py-6 text-blue-100 shadow-[18px_0_45px_rgba(8,36,61,0.24)] transition-transform duration-300 max-[900px]:translate-x-0 min-[901px]:sticky min-[901px]:top-0 min-[901px]:z-auto min-[901px]:h-svh min-[901px]:w-auto min-[901px]:min-w-0"
            : "sticky top-0 h-svh overflow-hidden bg-[#08243d] px-5 py-6 text-blue-100 shadow-[18px_0_45px_rgba(8,36,61,0.24)] transition-transform duration-300 max-[900px]:fixed max-[900px]:inset-y-0 max-[900px]:left-0 max-[900px]:z-50 max-[900px]:w-1/2 max-[900px]:min-w-[260px] max-[900px]:-translate-x-full"
        }
        aria-label="Dashboard navigation"
        aria-hidden={!isOpen ? undefined : false}
      >
      <div className="absolute inset-x-0 top-0 h-40 bg-[linear-gradient(180deg,rgba(34,211,238,0.18),rgba(8,36,61,0))]" />
      <div className="relative flex items-center gap-3 border-b border-blue-100/15 pb-6">
        <span className="grid h-12 w-12 place-items-center rounded-xl bg-cyan-500 font-black text-white shadow-lg shadow-cyan-950/25 ring-1 ring-white/20">
          Ix
        </span>
        <div>
          <p className="text-lg font-bold text-white">Integriix</p>
          <p className="text-sm text-cyan-100/75">Governance AI</p>
        </div>
        <button
          className="ml-auto hidden h-10 w-10 place-items-center rounded-xl bg-white/10 text-white transition hover:bg-white/15 max-[900px]:grid"
          type="button"
          aria-label="Close navigation"
          onClick={onClose}
        >
          <FaXmark className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <nav className="relative mt-7 grid gap-2">
        {menuItems.map((item) => {
          const isActive = currentPath === item.url;

          return (
            <div key={item.name}>
              <div className="flex items-center gap-2">
                <a
                  className={
                    isActive
                      ? "flex min-w-0 flex-1 items-center gap-3 rounded-xl bg-cyan-500/20 px-3 py-3 text-sm font-semibold text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.09)]"
                      : "flex min-w-0 flex-1 items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-blue-100/80 transition hover:bg-white/8 hover:text-white"
                  }
                  href={item.url}
                  aria-current={isActive ? "page" : undefined}
                  onClick={onClose}
                >
                  <span
                    className={
                      isActive
                        ? "grid h-8 w-8 place-items-center rounded-lg bg-cyan-400 text-slate-950"
                        : "grid h-8 w-8 place-items-center rounded-lg bg-white/8 text-cyan-100"
                    }
                  >
                    <MenuIcon name={item.icon} />
                  </span>
                  <span className="truncate">{item.name}</span>
                </a>

                {item.name === "Daily Brief" ? (
                  <button
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/8 text-cyan-100 transition hover:bg-white/12 hover:text-white"
                    type="button"
                    aria-expanded={isDailyBriefOpen}
                    aria-label={
                      isDailyBriefOpen
                        ? "Collapse Daily Brief menu"
                        : "Expand Daily Brief menu"
                    }
                    onClick={() => setIsDailyBriefOpen((value) => !value)}
                  >
                    {isDailyBriefOpen ? (
                      <FaChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
                    ) : (
                      <FaChevronDown
                        className="h-3.5 w-3.5"
                        aria-hidden="true"
                      />
                    )}
                  </button>
                ) : null}
              </div>

              {item.name === "Daily Brief" && isDailyBriefOpen ? (
                <div className="ml-11 mt-2 grid gap-1 border-l border-white/10 pl-3">
                  {dailyBriefSubItems.map((subItem) => (
                    <a
                      key={subItem.name}
                      className="rounded-lg px-3 py-2 text-xs font-semibold text-blue-100/70 transition hover:bg-white/8 hover:text-white"
                      href={subItem.url}
                      onClick={onClose}
                    >
                      {subItem.name}
                    </a>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </nav>
      </aside>
    </>
  );
}

export default Aside;
