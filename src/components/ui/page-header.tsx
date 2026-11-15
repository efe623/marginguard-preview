import Link from "next/link";

export type Crumb = { label: string; href?: string };

export function PageHeader({
  title,
  description,
  actions,
  crumbs,
  eyebrow
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  crumbs?: Crumb[];
  /** Deprecated: shown as a plain crumb line. Prefer `crumbs`. */
  eyebrow?: string;
}) {
  return (
    <header className="page-head">
      <div className="min-w-0">
        {crumbs?.length ? (
          <nav className="crumbs" aria-label="Breadcrumb">
            {crumbs.map((crumb, index) => (
              <span key={`${crumb.label}-${index}`} className="inline-flex items-center gap-1.5">
                {index > 0 ? <span aria-hidden>/</span> : null}
                {crumb.href ? <Link href={crumb.href}>{crumb.label}</Link> : <span>{crumb.label}</span>}
              </span>
            ))}
          </nav>
        ) : eyebrow ? (
          <p className="crumbs">{eyebrow}</p>
        ) : null}
        <h1 className="page-title">{title}</h1>
        {description ? <p className="page-sub">{description}</p> : null}
      </div>
      {actions ? <div className="page-actions">{actions}</div> : null}
    </header>
  );
}
