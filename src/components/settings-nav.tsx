import Link from "next/link";

export function SettingsNav({ active }: { active: string }) {
  const items = [
    ["members", "Members", "/settings/members"],
    ["security", "Security", "/settings/security"],
    ["stripe", "Stripe", "/settings/stripe"],
    ["support", "Support access", "/settings/support"],
    ["deletion", "Deletion", "/settings/deletion"]
  ];

  return (
    <nav className="flex border-b border-[var(--line)]">
      {items.map(([key, label, href]) => (
        <Link
          key={key}
          href={href}
          className={`relative px-5 py-4 text-sm font-semibold ${active === key ? "" : "quiet"}`}
        >
          {label}
          {active === key ? <span className="absolute inset-x-0 bottom-[-1px] h-[3px] bg-[var(--signal)]" /> : null}
        </Link>
      ))}
    </nav>
  );
}
