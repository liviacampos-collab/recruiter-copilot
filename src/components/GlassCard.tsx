import type { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  delay?: number;
}

export function GlassCard({ children, className = "", hover = true, delay = 0 }: GlassCardProps) {
  const delayStyle = delay ? { animationDelay: `${delay}ms` } : undefined;
  return (
    <div
      style={delayStyle}
      className={[
        "rounded-2xl border border-slate-200/90 bg-white shadow-card",
        "animate-slide-up opacity-0 [animation-fill-mode:forwards]",
        hover ? "transition-shadow duration-200 hover:border-accent/35 hover:shadow-card-hover" : "",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}
