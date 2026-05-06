import type { ButtonHTMLAttributes, ReactNode } from "react";

interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "solid" | "ghost" | "outline";
  size?: "md" | "lg";
}

export function PrimaryButton({
  children,
  variant = "solid",
  size = "md",
  className = "",
  ...props
}: PrimaryButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none";
  const sizes = size === "lg" ? "px-6 py-3.5 text-base" : "px-4 py-2.5 text-sm";
  const variants = {
    solid:
      "bg-[linear-gradient(to_right,#F97316,#A855F7)] text-white shadow-sm hover:brightness-110 active:scale-[0.99]",
    ghost:
      "bg-slate-100 text-nerdy-ink ring-1 ring-slate-200/90 hover:bg-slate-200/80 hover:ring-accent/35",
    outline:
      "bg-white text-accent ring-1 ring-accent/40 hover:bg-accent-muted/60 hover:ring-accent/55",
  };

  return (
    <button type="button" className={[base, sizes, variants[variant], className].join(" ")} {...props}>
      {children}
    </button>
  );
}
