const dimensionColors = [
  "#0891b2",
  "#2563eb",
  "#f59e0b",
  "#8b5cf6",
  "#14b8a6",
  "#ef4444",
];

function polarToCartesian(cx, cy, radius, angleInDegrees) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;

  return {
    x: cx + radius * Math.cos(angleInRadians),
    y: cy + radius * Math.sin(angleInRadians),
  };
}

function describeArc(cx, cy, radius, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, radius, endAngle);
  const end = polarToCartesian(cx, cy, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  return [
    "M",
    start.x,
    start.y,
    "A",
    radius,
    radius,
    0,
    largeArcFlag,
    0,
    end.x,
    end.y,
  ].join(" ");
}

function WeightedStatusDonut({ status }) {
  const segments = status.dimensions.reduce((items, dimension, index) => {
    const previous = items.at(-1);
    const startAngle = previous?.endAngle ?? 0;
    const endAngle = startAngle + dimension.weight * 3.6;

    return [
      ...items,
      {
        ...dimension,
        color: dimensionColors[index % dimensionColors.length],
        endAngle,
        startAngle,
      },
    ];
  }, []);

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
      <div className="relative grid place-items-center">
        <svg
          className="h-56 w-56"
          viewBox="0 0 260 260"
          role="img"
          aria-label="Weighted enterprise status donut chart"
        >
          <circle
            cx="130"
            cy="130"
            fill="none"
            r="88"
            stroke="#e2e8f0"
            strokeWidth="30"
          />
          {segments.map((segment) => (
            <path
              key={segment.id}
              d={describeArc(
                130,
                130,
                88,
                segment.startAngle,
                segment.endAngle,
              )}
              fill="none"
              stroke={segment.color}
              strokeLinecap="round"
              strokeWidth="30"
            />
          ))}
        </svg>
        <div className="absolute text-center">
          <p className="text-xs font-bold uppercase text-slate-500">Score</p>
          <p className="text-5xl font-black leading-none text-slate-950">
            {status.score}
          </p>
          <p className="mt-1 text-sm font-black text-amber-700">
            {status.ragStatus}
          </p>
        </div>
      </div>

      <div className="grid content-center gap-3 md:grid-cols-2">
        {segments.map((segment) => (
          <div
            key={segment.id}
            className="rounded-2xl border border-slate-100 bg-white/90 p-3 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className="mt-1 h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: segment.color }}
                />
                <div className="min-w-0">
                  <p className="text-sm font-black leading-tight text-slate-950">
                    {segment.label}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    Weight {segment.weight}% · {segment.trend}
                  </p>
                </div>
              </div>
              <p className="shrink-0 text-sm font-black text-slate-950">
                {segment.score}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default WeightedStatusDonut;
