import { ButtonLink } from "@/components/ui/button";
import { FocusFormButton } from "@/components/ui/focus-form-button";

type Art = "projects" | "clients" | "money" | "files" | "messages" | "tasks" | "calendar" | "clear";

/**
 * An empty state is an invitation, not a status line. The title names the
 * thing to do, the text says why it is worth doing and how long it takes, and
 * there is one obvious button. Use `focus` when the form is further down the
 * same page, and `action` when the next step is another page.
 */
export function EmptyState({
  art,
  title,
  text,
  action,
  secondary,
  focus,
  small
}: {
  art?: Art;
  title: string;
  text: string;
  action?: { href: string; label: string };
  secondary?: { href: string; label: string };
  focus?: string;
  small?: boolean;
}) {
  return (
    <div className={`empty${small ? " empty-sm" : ""}`} data-art={art}>
      <p className="empty-title">{title}</p>
      <p className="empty-text">{text}</p>
      {action || focus || secondary ? (
        <div className="empty-actions">
          {action ? <ButtonLink href={action.href}>{action.label}</ButtonLink> : null}
          {focus ? <FocusFormButton label={focus} /> : null}
          {secondary ? <ButtonLink href={secondary.href} variant="outline">{secondary.label}</ButtonLink> : null}
        </div>
      ) : null}
    </div>
  );
}
