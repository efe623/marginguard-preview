import type { SVGProps } from "react";

/**
 * UnitPulse icon set. Every icon sits on a 24px grid, uses a 1.75px round
 * stroke, and carries one soft-filled shape so it reads as a pair of tones:
 * outline in the current colour, body in the same colour at low opacity.
 */
type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Base({ size = 20, children, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  );
}

const tone = { fill: "currentColor", fillOpacity: 0.16, stroke: "none" } as const;

export function IconToday(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="9" {...tone} />
      <circle cx="12" cy="12" r="9" />
      <path d="M6.5 12.5h2.6l1.7-3.6 2.4 6.2 1.6-2.6h2.7" />
    </Base>
  );
}

export function IconProjects(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="3.5" y="13.5" width="17" height="6" rx="2" {...tone} />
      <rect x="3.5" y="13.5" width="17" height="6" rx="2" />
      <path d="M6.5 10h11" />
      <path d="M9 6.5h6" />
    </Base>
  );
}

export function IconClients(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="9" cy="8.5" r="3.4" {...tone} />
      <circle cx="9" cy="8.5" r="3.4" />
      <path d="M2.8 19.5c.4-3.3 3-5.2 6.2-5.2s5.8 1.9 6.2 5.2" />
      <path d="M15.6 5.4a3.2 3.2 0 0 1 0 6.2" />
      <path d="M18 14.7c1.7.7 2.9 2.2 3.2 4.3" />
    </Base>
  );
}

export function IconInvoices(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M6 3.5h12v17l-2.4-1.6-1.8 1.6-1.8-1.6-1.8 1.6-1.8-1.6L6 20.5z" {...tone} />
      <path d="M6 3.5h12v17l-2.4-1.6-1.8 1.6-1.8-1.6-1.8 1.6-1.8-1.6L6 20.5z" />
      <path d="M9.3 8.5h5.4M9.3 12h5.4" />
    </Base>
  );
}

export function IconReports(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="4" y="12" width="4" height="8" rx="1.2" {...tone} />
      <rect x="10" y="7" width="4" height="13" rx="1.2" {...tone} />
      <rect x="4" y="12" width="4" height="8" rx="1.2" />
      <rect x="10" y="7" width="4" height="13" rx="1.2" />
      <path d="M17 20V4.5" />
      <path d="M20 20v-8" />
    </Base>
  );
}

export function IconCalendar(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="3" {...tone} />
      <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
      <path d="M8 3v4M16 3v4M3.5 10h17" />
      <circle cx="15.5" cy="15" r="1.4" fill="currentColor" stroke="none" />
    </Base>
  );
}

export function IconBell(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.5h-15z" {...tone} />
      <path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.5h-15z" />
      <path d="M10 20.5a2.2 2.2 0 0 0 4 0" />
    </Base>
  );
}

export function IconSettings(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
      <circle cx="15" cy="7" r="2.4" {...tone} />
      <circle cx="15" cy="7" r="2.4" />
      <circle cx="9" cy="17" r="2.4" {...tone} />
      <circle cx="9" cy="17" r="2.4" />
    </Base>
  );
}

export function IconSearch(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="10.5" cy="10.5" r="6.5" {...tone} />
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m15.5 15.5 5 5" />
    </Base>
  );
}

export function IconPlus(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 5v14M5 12h14" />
    </Base>
  );
}

export function IconMenu(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4 7h16M4 12h10M4 17h16" />
    </Base>
  );
}

export function IconClose(props: IconProps) {
  return (
    <Base {...props}>
      <path d="m6 6 12 12M18 6 6 18" />
    </Base>
  );
}

export function IconSun(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="4" {...tone} />
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4" />
    </Base>
  );
}

export function IconMoon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z" {...tone} />
      <path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z" />
    </Base>
  );
}

export function IconLogout(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M9.5 4.5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h3.5" />
      <path d="M14 8.5 18 12l-4 3.5M18 12H9" />
    </Base>
  );
}

export function IconChevron(props: IconProps) {
  return (
    <Base {...props}>
      <path d="m9 6 6 6-6 6" />
    </Base>
  );
}

export function IconSparkle(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 3.5 13.9 9l5.6 1.9-5.6 1.9L12 18.3l-1.9-5.5L4.5 10.9 10.1 9z" {...tone} />
      <path d="M12 3.5 13.9 9l5.6 1.9-5.6 1.9L12 18.3l-1.9-5.5L4.5 10.9 10.1 9z" />
    </Base>
  );
}

export function IconBusiness(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4.5 9.5 6 4.5h12l1.5 5" />
      <path d="M4.5 9.5h15v10a1 1 0 0 1-1 1h-13a1 1 0 0 1-1-1z" {...tone} />
      <path d="M4.5 9.5h15v10a1 1 0 0 1-1 1h-13a1 1 0 0 1-1-1z" />
      <path d="M10 20.5v-5h4v5" />
    </Base>
  );
}

export function IconDocument(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M6.5 3.5h7l4 4v13h-11z" {...tone} />
      <path d="M6.5 3.5h7l4 4v13h-11z" />
      <path d="M13.5 3.5v4h4M9.5 12.5h5M9.5 16h5" />
    </Base>
  );
}

export function IconShield(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 3.5 19 6v5.6c0 4.2-2.8 7.4-7 8.9-4.2-1.5-7-4.7-7-8.9V6z" {...tone} />
      <path d="M12 3.5 19 6v5.6c0 4.2-2.8 7.4-7 8.9-4.2-1.5-7-4.7-7-8.9V6z" />
      <path d="m9 12 2.2 2.2L15.2 10" />
    </Base>
  );
}

export function IconLink(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="3" y="9" width="10" height="6" rx="3" {...tone} />
      <rect x="3" y="9" width="10" height="6" rx="3" />
      <rect x="11" y="9" width="10" height="6" rx="3" />
    </Base>
  );
}

export function IconPen(props: IconProps) {
  return (
    <Base {...props}>
      <path d="m4 20 1-4.5L16.5 4a2 2 0 0 1 2.8 0l.7.7a2 2 0 0 1 0 2.8L8.5 19z" {...tone} />
      <path d="m4 20 1-4.5L16.5 4a2 2 0 0 1 2.8 0l.7.7a2 2 0 0 1 0 2.8L8.5 19z" />
      <path d="m14.5 6 3.5 3.5" />
    </Base>
  );
}

export function IconSupport(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4.5 6.5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H11l-4 3.5v-3.5h-.5a2 2 0 0 1-2-2z" {...tone} />
      <path d="M4.5 6.5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H11l-4 3.5v-3.5h-.5a2 2 0 0 1-2-2z" />
      <path d="M8.5 10.5h7" />
    </Base>
  );
}

export function IconArchive(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="3.5" y="4.5" width="17" height="4.5" rx="1.5" {...tone} />
      <rect x="3.5" y="4.5" width="17" height="4.5" rx="1.5" />
      <path d="M5 9v9a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 18V9M10 13h4" />
    </Base>
  );
}

export function IconAppearance(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 3.5a8.5 8.5 0 0 1 0 17z" fill="currentColor" fillOpacity={0.3} stroke="none" />
      <path d="M12 3.5v17" />
    </Base>
  );
}

/** Brand mark: a rounded tile with a pulse line. */
export function BrandMark({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <rect width="32" height="32" rx="9" fill="var(--signal)" />
      <path d="M6.5 17h4.6l2.6-6.4 4.2 11 2.6-4.6h5" fill="none" stroke="var(--on-signal)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
