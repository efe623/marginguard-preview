export function PageHeader({
  eyebrow,
  title,
  description,
  actions
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="flex items-end justify-between gap-8 border-b border-[var(--line)] pb-8">
      <div className="max-w-4xl">
        {eyebrow ? <p className="eyebrow mb-4">{eyebrow}</p> : null}
        <h1 className="page-title">{title}</h1>
        {description ? (
          <p className="quiet mt-5 max-w-2xl text-[1.05rem] leading-7">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 gap-3">{actions}</div> : null}
    </header>
  );
}
