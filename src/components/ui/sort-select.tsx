"use client";

import { ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";

/** One compact "Sort: …" control instead of a row of sort chips. */
export function SortSelect({
  value,
  options
}: {
  value: string;
  options: Array<{ key: string; label: string; href: string }>;
}) {
  const router = useRouter();
  return (
    <label className="sort-select">
      <span>Sort:</span>
      <select
        key={value}
        defaultValue={value}
        onChange={(event) => {
          const next = options.find((option) => option.key === event.target.value);
          if (next) router.push(next.href, { scroll: false });
        }}
      >
        {options.map((option) => (
          <option key={option.key} value={option.key}>{option.label}</option>
        ))}
      </select>
      <ChevronDown size={14} aria-hidden="true" />
    </label>
  );
}
