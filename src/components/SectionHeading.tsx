interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
}

export function SectionHeading({ eyebrow, title, description }: SectionHeadingProps) {
  return (
    <div className="mb-4">
      {eyebrow ? (
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-nerdy-purple">{eyebrow}</p>
      ) : null}
      <h2 className="mt-0.5 text-lg font-semibold tracking-tight text-nerdy-ink sm:text-xl">{title}</h2>
      {description ? (
        <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-nerdy-muted">{description}</p>
      ) : null}
    </div>
  );
}
