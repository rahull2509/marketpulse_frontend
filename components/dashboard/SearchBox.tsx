"use client";

import { Search, X } from "lucide-react";
import { useRef } from "react";

interface SearchBoxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchBox({
  value,
  onChange,
  placeholder = "Search by symbol, name...",
}: SearchBoxProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        width: 260,
      }}
    >
      <Search
        size={16}
        style={{
          position: "absolute",
          left: 12,
          color: "var(--text-muted)",
          pointerEvents: "none",
        }}
      />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input"
        style={{
          width: "100%",
          paddingLeft: 36,
          paddingRight: value ? 36 : 12,
        }}
      />
      {value && (
        <button
          onClick={() => {
            onChange("");
            inputRef.current?.focus();
          }}
          style={{
            position: "absolute",
            right: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 20,
            height: 20,
            borderRadius: "var(--radius-xs)",
            border: "none",
            background: "transparent",
            cursor: "pointer",
            color: "var(--text-tertiary)",
          }}
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
