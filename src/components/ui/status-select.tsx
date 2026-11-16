"use client";

import { ChevronDown } from "lucide-react";
import { useState, useTransition } from "react";

type Tone = "success" | "warning" | "danger" | "neutral";
type Option = { value: string; label: string; tone: Tone };

/**
 * A status you can change in place: it reads as the coloured status word, and
 * picking a new value saves straight away. Replaces the old "dropdown + Save"
 * pair on every row. `action` is the server action the surrounding form posts to;
 * `fields` are the hidden ids it needs.
 */
export function StatusSelect({
  action,
  fields,
  name = "status",
  value,
  options,
  label
}: {
  action: (formData: FormData) => void | Promise<void>;
  fields: Record<string, string>;
  name?: string;
  value: string;
  options: Option[];
  label: string;
}) {
  const [current, setCurrent] = useState(value);
  const [pending, startTransition] = useTransition();
  const tone = options.find((option) => option.value === current)?.tone ?? "neutral";

  return (
    // Saved by calling the action directly, not by submitting the form, so React's
    // post-action form reset cannot snap the select back to its old value.
    <form className={`status-select status-${tone}`} aria-busy={pending} onSubmit={(event) => event.preventDefault()}>
      {Object.entries(fields).map(([key, fieldValue]) => (
        <input key={key} type="hidden" name={key} value={fieldValue} />
      ))}
      <select
        aria-label={label}
        name={name}
        value={current}
        onChange={(event) => {
          const form = event.currentTarget.form;
          setCurrent(event.target.value);
          if (!form) return;
          const data = new FormData(form);
          data.set(name, event.target.value);
          startTransition(async () => {
            await action(data);
          });
        }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
      <ChevronDown size={14} aria-hidden="true" />
    </form>
  );
}
