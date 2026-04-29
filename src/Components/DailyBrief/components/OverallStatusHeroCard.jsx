import { ragStyles } from "./statusStyles";

function OverallStatusHeroCard({ status }) {
  const statusStyle = ragStyles[status.ragStatus] ?? ragStyles.Amber;

  return (
    <section className="min-w-0 rounded-3xl border border-white/80 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] max-[520px]:rounded-2xl max-[520px]:p-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-normal text-cyan-700">
            Overall status
          </p>
          <h2 className="mt-2 text-2xl font-black leading-tight text-slate-950">
            Organization health
          </h2>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-sm font-black ring-1 ${statusStyle.badge}`}
        >
          {status.ragStatus}
        </span>
      </div>

      <div className={`mt-5 rounded-3xl ${statusStyle.panel} p-5 max-[520px]:rounded-2xl max-[520px]:p-4`}>
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-xs font-bold uppercase text-slate-500">
              Weighted score
            </p>
            <p className="mt-1 text-6xl font-black leading-none text-slate-950 max-[520px]:text-5xl">
              {status.score}
            </p>
          </div>
          <div className="min-w-28 flex-1">
            <div className="h-3 overflow-hidden rounded-full bg-white/80 ring-1 ring-slate-200">
              <div
                className={`h-full rounded-full ${statusStyle.fill}`}
                style={{ width: `${status.score}%` }}
              />
            </div>
            <div className="mt-2 flex justify-between text-[10px] font-bold uppercase text-slate-500">
              <span>Red</span>
              <span>Amber</span>
              <span>Green</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
        <p className="text-xs font-black uppercase text-cyan-700">
          Executive summary
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {status.executiveSummary}
        </p>
      </div>
    </section>
  );
}

export default OverallStatusHeroCard;
