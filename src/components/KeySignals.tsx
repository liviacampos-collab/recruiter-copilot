interface KeySignalsProps {
  technicalDepth: number;
  leadershipMentorship: number;
  roleCalibrationFit: number;
  /** When set (Staff role), shows an extra card with this API score */
  staffLeadershipMentorship?: number;
  /** Optional labels (e.g. model-derived signals) */
  labels?: {
    technical?: string;
    leadership?: string;
    calibration?: string;
  };
}

function SignalCell({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200/90 border-t-[3px] border-t-nerdy-teal bg-white px-4 py-3 shadow-sm">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-nerdy-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-nerdy-ink">{value}%</p>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200/90">
        <div
          className="h-full rounded-full bg-nerdy-purple transition-all duration-500"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

export function KeySignals({
  technicalDepth,
  leadershipMentorship,
  roleCalibrationFit,
  staffLeadershipMentorship,
  labels,
}: KeySignalsProps) {
  const showStaffLeadership = staffLeadershipMentorship !== undefined;
  return (
    <div
      className={
        showStaffLeadership
          ? "grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4"
          : "grid grid-cols-3 gap-3 sm:gap-4"
      }
    >
      <SignalCell label={labels?.technical ?? "Technical depth"} value={technicalDepth} />
      <SignalCell label={labels?.leadership ?? "Leadership & mentorship"} value={leadershipMentorship} />
      <SignalCell label={labels?.calibration ?? "Role calibration fit"} value={roleCalibrationFit} />
      {showStaffLeadership ? (
        <SignalCell label="Leadership & mentorship" value={staffLeadershipMentorship} />
      ) : null}
    </div>
  );
}
