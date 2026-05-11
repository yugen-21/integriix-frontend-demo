import {
  FaArrowLeft,
  FaClock,
  FaHelmetSafety,
  FaLayerGroup,
} from "react-icons/fa6";

function UnderConstruction({ sectionName }) {
  return (
    <section className="grid min-w-0 gap-6 rounded-3xl border border-white/80 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)] max-[520px]:rounded-2xl max-[520px]:p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-normal text-cyan-700">
            Module preview
          </p>
          <h2 className="mt-3 break-words text-3xl font-black leading-tight text-slate-950 max-[520px]:text-2xl">
            {sectionName} is under construction
          </h2>
          <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
            This workspace is planned for the MedullaAI C-suite command center.
            The Daily Brief dashboard is available now while this module is
            being prepared.
          </p>
        </div>

        <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-4 py-2 text-sm font-black text-amber-800 ring-1 ring-amber-200">
          <FaClock className="h-3.5 w-3.5" aria-hidden="true" />
          Coming soon
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-5">
          <FaLayerGroup className="h-5 w-5 text-cyan-700" aria-hidden="true" />
          <h3 className="mt-4 text-base font-black text-slate-950">
            Planned workspace
          </h3>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
            This section will use the same executive briefing language,
            governance signals, and action-oriented layout.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-5">
          <FaHelmetSafety className="h-5 w-5 text-cyan-700" aria-hidden="true" />
          <h3 className="mt-4 text-base font-black text-slate-950">
            Build in progress
          </h3>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
            Mock data, responsive layouts, and reviewable sections will be added
            step by step.
          </p>
        </div>

        <a
          className="rounded-2xl border border-cyan-100 bg-cyan-50/80 p-5 text-slate-950 transition hover:-translate-y-0.5 hover:bg-cyan-50 hover:shadow-md"
          href="/"
        >
          <FaArrowLeft className="h-5 w-5 text-cyan-700" aria-hidden="true" />
          <h3 className="mt-4 text-base font-black">Return to Daily Brief</h3>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
            Go back to the available executive command brief dashboard.
          </p>
        </a>
      </div>
    </section>
  );
}

export default UnderConstruction;
