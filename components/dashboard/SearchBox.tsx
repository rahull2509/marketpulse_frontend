"use client";

import { Search, X } from "lucide-react";
import { useRef } from "react";

interface SearchBoxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchBox({ value, onChange, placeholder = "Search stocks..." }: SearchBoxProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      className="flex items-center gap-2 rounded-lg border px-3 py-1.5 transition-colors focus-within:border-[var(--border-accent)]"
      style={{
        borderColor: "var(--border-secondary)",
        backgroundColor: "var(--bg-secondary)",
      }}
    >
      <Search className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--text-tertiary)" }} />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full min-w-[200px] bg-transparent text-xs outline-none placeholder:text-[var(--text-muted)]"
        style={{ color: "var(--text-primary)" }}
      />
      {value && (
        <button
          onClick={() => {
            onChange("");
            inputRef.current?.focus();
          }}
          className="rounded p-0.5 transition-colors hover:bg-[var(--bg-hover)]"
          style={{ color: "var(--text-tertiary)" }}
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
