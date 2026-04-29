import { useState } from "react";
import Aside from "./aside";
import Header from "./header";

function Base({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="grid min-h-svh min-w-0 grid-cols-[292px_minmax(0,1fr)] overflow-x-clip bg-[#eef5f8] text-slate-900 max-[900px]:grid-cols-1">
      <Aside
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="min-w-0 overflow-x-clip bg-[linear-gradient(180deg,#f8fbfd_0%,#eef5f8_48%,#f7fafc_100%)]">
        <Header onOpenSidebar={() => setIsSidebarOpen(true)} />

        <main
          id="daily-brief"
          className="mx-auto grid w-full min-w-0 max-w-[1500px] gap-6 px-8 py-7 max-[900px]:gap-4 max-[900px]:px-4 max-[900px]:py-5 max-[520px]:px-3"
        >
          {children}
        </main>
      </div>
    </div>
  );
}

export default Base;
