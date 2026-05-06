interface SegmentedBarProps {
  value: number;
  label: string;
  showValue?: boolean;
}

export function SegmentedBar({ value, label, showValue = true }: SegmentedBarProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-nerdy-muted">{label}</span>
        {showValue ? (
          <span className="font-mono text-[11px] tabular-nums text-nerdy-muted">{value}%</span>
        ) : null}
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-200/90">
        <div
          className="h-full rounded-full bg-nerdy-purple transition-all duration-700 ease-out"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
