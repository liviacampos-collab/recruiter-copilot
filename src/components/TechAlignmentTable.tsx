import type { StrengthLabel } from "@/data/mockAnalysis";

const labelStyles: Record<StrengthLabel, string> = {
  Strong: "bg-nerdy-teal/15 text-nerdy-teal ring-nerdy-teal/35",
  Moderate: "bg-amber-50 text-amber-900 ring-amber-200/80",
  Weak: "bg-red-50 text-red-800 ring-red-200/80",
};

export function TechAlignmentTable({
  rows,
}: {
  rows: { name: string; level: StrengthLabel; note: string }[];
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200/90 ring-1 ring-slate-100">
      <table className="w-full min-w-[520px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/80">
            <th className="px-4 py-3 font-medium text-nerdy-muted">Technology</th>
            <th className="px-4 py-3 font-medium text-nerdy-muted">Alignment</th>
            <th className="px-4 py-3 font-medium text-nerdy-muted">Note</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {rows.map((row) => (
            <tr key={row.name} className="transition-colors hover:bg-slate-50/80">
              <td className="px-4 py-3 font-medium text-nerdy-ink">{row.name}</td>
              <td className="px-4 py-3">
                <span
                  className={[
                    "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1",
                    labelStyles[row.level],
                  ].join(" ")}
                >
                  {row.level}
                </span>
              </td>
              <td className="px-4 py-3 text-nerdy-muted">{row.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
