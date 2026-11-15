"use client";

import { useId, useRef } from "react";
import { useFormStatus } from "react-dom";

function ConfirmButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="button button-danger-solid" disabled={pending}>
      {pending ? "Deleting" : label}
    </button>
  );
}

/**
 * Deleting is a two-step action. The first button only opens a dialog that
 * says what will go; nothing is deleted until the second, differently worded
 * button is pressed. "Keep it" has focus first, so Enter on a stray press
 * is the safe choice.
 */
export function ConfirmDelete({
  action,
  fields,
  trigger,
  title,
  confirm,
  children
}: {
  action: (formData: FormData) => void | Promise<void>;
  fields: Record<string, string>;
  trigger: string;
  title: string;
  confirm: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  return (
    <>
      <button type="button" className="button button-danger" onClick={() => ref.current?.showModal()}>
        {trigger}
      </button>
      <dialog
        ref={ref}
        className="confirm"
        aria-labelledby={titleId}
        onClick={(event) => {
          if (event.target === ref.current) ref.current?.close();
        }}
      >
        <form action={action}>
          {Object.entries(fields).map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} />
          ))}
          <h2 className="confirm-title" id={titleId}>{title}</h2>
          <div className="confirm-text">{children}</div>
          <div className="confirm-actions">
            <button type="button" className="button button-outline" autoFocus onClick={() => ref.current?.close()}>
              Keep it
            </button>
            <ConfirmButton label={confirm} />
          </div>
        </form>
      </dialog>
    </>
  );
}
