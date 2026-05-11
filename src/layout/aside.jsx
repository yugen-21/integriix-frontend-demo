import { useState } from "react";
import * as FaIcons from "react-icons/fa6";
import { FaChevronDown, FaXmark } from "react-icons/fa6";
import menuItems from "../menu.json";
import medullaIcon from "../assets/MedullaAI-icon.png";

function MenuIcon({ name }) {
  const Icon = FaIcons[name] ?? FaIcons.FaCircle;

  return <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />;
}

function SubMenuIcon({ name }) {
  const Icon = FaIcons[name] ?? FaIcons.FaCircle;

  return <Icon className="h-3 w-3 shrink-0" aria-hidden="true" />;
}

function Aside({ isOpen = false, onClose }) {
  const currentPath = window.location.pathname;

  const initialOpenIds = new Set();
  menuItems.forEach((item) => {
    if (
      item.submenu?.some((sub) => sub.url === currentPath) ||
      item.url === currentPath
    ) {
      initialOpenIds.add(item.name);
    }
  });
  const [openSections, setOpenSections] = useState(initialOpenIds);

  function toggleSection(name) {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

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
            ? "fixed inset-y-0 left-0 z-50 w-1/2 min-w-[260px] overflow-x-hidden overflow-y-auto bg-[#08243d] px-5 py-6 text-blue-100 shadow-[18px_0_45px_rgba(8,36,61,0.24)] transition-transform duration-300 max-[900px]:translate-x-0 min-[901px]:sticky min-[901px]:top-0 min-[901px]:z-auto min-[901px]:h-svh min-[901px]:w-auto min-[901px]:min-w-0"
            : "sticky top-0 h-svh overflow-x-hidden overflow-y-auto bg-[#08243d] px-5 py-6 text-blue-100 shadow-[18px_0_45px_rgba(8,36,61,0.24)] transition-transform duration-300 max-[900px]:fixed max-[900px]:inset-y-0 max-[900px]:left-0 max-[900px]:z-50 max-[900px]:w-1/2 max-[900px]:min-w-[260px] max-[900px]:-translate-x-full"
        }
        aria-label="Dashboard navigation"
        aria-hidden={!isOpen ? undefined : false}
      >
        <div className="absolute inset-x-0 top-0 h-40 bg-[linear-gradient(180deg,rgba(34,211,238,0.18),rgba(8,36,61,0))]" />
        <div className="relative flex items-center gap-3 border-b border-blue-100/15 pb-6">
          <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-white shadow-lg shadow-cyan-950/25 ring-1 ring-white/20">
            <img
              src={medullaIcon}
              alt="MedullaAI"
              className="h-10 w-10 object-contain"
            />
          </span>
          <div>
            <p className="text-lg font-bold text-white">MedullaAI</p>
            <p className="text-sm text-cyan-100/75">A Hospital's Synapse</p>
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
            const submenu = item.submenu ?? [];
            const hasSubmenu = submenu.length > 0;
            const isExpanded = openSections.has(item.name);
            const childActive = item.submenu?.some(
              (sub) => sub.url === currentPath,
            );

            return (
              <div key={item.name}>
                <div className="flex items-center gap-2">
                  <a
                    className={
                      isActive || childActive
                        ? "flex min-w-0 flex-1 items-center gap-3 rounded-xl bg-cyan-500/20 px-3 py-3 text-sm font-semibold text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.09)]"
                        : "flex min-w-0 flex-1 items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-blue-100/80 transition hover:bg-white/8 hover:text-white"
                    }
                    href={item.url}
                    aria-current={isActive ? "page" : undefined}
                    onClick={onClose}
                  >
                    <span
                      className={
                        isActive || childActive
                          ? "grid h-8 w-8 place-items-center rounded-lg bg-cyan-400 text-slate-950"
                          : "grid h-8 w-8 place-items-center rounded-lg bg-white/8 text-cyan-100"
                      }
                    >
                      <MenuIcon name={item.icon} />
                    </span>
                    <span className="break-words">{item.name}</span>
                  </a>

                  {hasSubmenu ? (
                    <button
                      className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-blue-100/50 transition hover:bg-white/5 hover:text-white"
                      type="button"
                      aria-expanded={isExpanded}
                      aria-label={
                        isExpanded
                          ? `Collapse ${item.name} menu`
                          : `Expand ${item.name} menu`
                      }
                      onClick={() => toggleSection(item.name)}
                    >
                      <FaChevronDown
                        className={`h-2.5 w-2.5 transition-transform duration-200 ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                        aria-hidden="true"
                      />
                    </button>
                  ) : null}
                </div>

                {hasSubmenu && isExpanded ? (
                  <div className="ml-11 mt-2 grid gap-1 border-l border-white/10 pl-3">
                    {submenu.map((subItem) => {
                      const subActive = currentPath === subItem.url;
                      return (
                        <a
                          key={subItem.name}
                          className={
                            subActive
                              ? "flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold text-white"
                              : "flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-blue-100/70 transition hover:bg-white/8 hover:text-white"
                          }
                          href={subItem.url}
                          aria-current={subActive ? "page" : undefined}
                          onClick={onClose}
                        >
                          {subItem.icon ? (
                            <span
                              className={
                                subActive
                                  ? "grid h-5 w-5 place-items-center rounded-md bg-cyan-400 text-slate-950"
                                  : "grid h-5 w-5 place-items-center rounded-md bg-white/8 text-cyan-100"
                              }
                            >
                              <SubMenuIcon name={subItem.icon} />
                            </span>
                          ) : null}
                          <span className="break-words">{subItem.name}</span>
                        </a>
                      );
                    })}
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
