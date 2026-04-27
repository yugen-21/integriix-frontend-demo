import * as FaIcons from "react-icons/fa6";
import menuItems from "../menu.json";

function MenuIcon({ name }) {
  const Icon = FaIcons[name] ?? FaIcons.FaCircle;

  return <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />;
}

function Aside() {
  const currentPath = window.location.pathname;

  return (
    <aside
      className="sticky top-0 h-svh overflow-hidden bg-[#08243d] px-5 py-6 text-blue-100 shadow-[18px_0_45px_rgba(8,36,61,0.24)] max-[900px]:static max-[900px]:h-auto"
      aria-label="Dashboard navigation"
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
      </div>

      <nav className="relative mt-7 grid gap-2 max-[900px]:grid-cols-2">
        {menuItems.map((item) => {
          const isActive = currentPath === item.url;

          return (
            <a
              key={item.name}
              className={
                isActive
                  ? "flex items-center gap-3 rounded-xl bg-cyan-500/20 px-3 py-3 text-sm font-semibold text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.09)]"
                  : "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-blue-100/80 transition hover:bg-white/8 hover:text-white"
              }
              href={item.url}
              aria-current={isActive ? "page" : undefined}
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
              <span>{item.name}</span>
            </a>
          );
        })}
      </nav>
    </aside>
  );
}

export default Aside;
