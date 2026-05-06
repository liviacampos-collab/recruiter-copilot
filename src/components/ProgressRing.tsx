interface ProgressRingProps {
  value: number;
  size?: number;
  stroke?: number;
  label?: string;
  sublabel?: string;
}

export function ProgressRing({ value, size = 88, stroke = 6, label, sublabel }: ProgressRingProps) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  const large = size >= 112;

  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            className="stroke-slate-200"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            className="stroke-nerdy-purple transition-all duration-700 ease-out"
            strokeWidth={stroke}
            strokeDasharray={c}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`font-semibold tabular-nums text-nerdy-ink ${large ? "text-3xl" : "text-lg"}`}>
            {value}
            <span className={`font-normal text-nerdy-muted ${large ? "text-lg" : "text-xs"}`}>%</span>
          </span>
        </div>
      </div>
      {label || sublabel ? (
        <div>
          {label ? <p className="text-xs font-medium text-nerdy-ink">{label}</p> : null}
          {sublabel ? <p className="text-[11px] text-nerdy-muted">{sublabel}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
