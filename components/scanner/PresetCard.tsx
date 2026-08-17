import React, { useState, useRef, useEffect } from "react";
import { ScannerPreset } from "@/types/scanner";
import {
  Bookmark,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Zap,
  Activity,
  MoreVertical,
  Edit2,
  Trash2,
} from "lucide-react";

const PRESET_ICONS: Record<string, React.ComponentType<{ size?: number; style?: React.CSSProperties }>> = {
  default: Bookmark,
  bullish: TrendingUp,
  bearish: TrendingDown,
  volume: BarChart3,
  momentum: Zap,
  institutional: Activity,
};

export function PresetCard({
  preset,
  onSelect,
  onEdit,
  onEditConditions,
  onDelete,
}: {
  preset: ScannerPreset;
  onSelect: (preset: ScannerPreset) => void;
  onEdit?: (preset: ScannerPreset) => void;
  onEditConditions?: (preset: ScannerPreset) => void;
  onDelete?: (preset: ScannerPreset) => void;
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const nameLower = preset.name.toLowerCase();
  let Icon = PRESET_ICONS.default;
  if (nameLower.includes("bull")) Icon = PRESET_ICONS.bullish;
  else if (nameLower.includes("bear")) Icon = PRESET_ICONS.bearish;
  else if (nameLower.includes("volume")) Icon = PRESET_ICONS.volume;
  else if (nameLower.includes("momentum")) Icon = PRESET_ICONS.momentum;
  else if (nameLower.includes("institution")) Icon = PRESET_ICONS.institutional;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => {
        if (!isMenuOpen) onSelect(preset);
      }}
      className="card"
      style={{
        position: "relative",
        padding: "var(--sp-3) var(--sp-4)",
        textAlign: "left",
        cursor: "pointer",
        minWidth: 160,
        flex: "0 0 auto",
        border: "1px solid var(--border-primary)",
        transition: "all var(--transition-fast)",
        background: "none",
        fontFamily: "var(--font-sans)",
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(preset);
        }
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.borderColor = "var(--color-accent)";
        e.currentTarget.style.backgroundColor = "var(--color-accent-light)";
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.borderColor = "var(--border-primary)";
        e.currentTarget.style.backgroundColor = "transparent";
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 4,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)" }}>
          <Icon size={14} style={{ color: "var(--color-accent)", flexShrink: 0 }} />
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "var(--text-primary)",
            }}
          >
            {preset.name}
          </span>
        </div>

        {(onEdit || onDelete) && (
          <div ref={menuRef} style={{ position: "relative" }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen(!isMenuOpen);
              }}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: "2px",
                color: "var(--text-secondary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "var(--radius-sm)",
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)")}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              <MoreVertical size={14} />
            </button>

            {isMenuOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  right: 0,
                  marginTop: 4,
                  backgroundColor: "var(--bg-secondary)",
                  border: "1px solid var(--border-light)",
                  borderRadius: "var(--radius-md)",
                  boxShadow: "var(--shadow-md)",
                  minWidth: 120,
                  zIndex: 10,
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                }}
              >
                {onEdit && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMenuOpen(false);
                      onEdit(preset);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "var(--sp-2)",
                      padding: "var(--sp-2) var(--sp-3)",
                      background: "transparent",
                      border: "none",
                      borderBottom: "1px solid var(--border-light)",
                      color: "var(--text-primary)",
                      fontSize: 12,
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "var(--bg-hover)")}
                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <Edit2 size={12} />
                    Edit Details
                  </button>
                )}
                {onEditConditions && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMenuOpen(false);
                      onEditConditions(preset);
                    }}
                    style={{
                      background: "transparent",
                      border: "none",
                      padding: "var(--sp-2) var(--sp-3)",
                      textAlign: "left",
                      fontSize: 12,
                      color: "var(--text-primary)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "var(--sp-2)",
                      borderBottom: onDelete ? "1px solid var(--border-light)" : "none",
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "var(--bg-tertiary)")}
                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <Zap size={12} />
                    Edit Conditions
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMenuOpen(false);
                      onDelete(preset);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "var(--sp-2)",
                      padding: "var(--sp-2) var(--sp-3)",
                      background: "transparent",
                      border: "none",
                      color: "var(--color-danger)",
                      fontSize: 12,
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.1)")}
                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <Trash2 size={12} />
                    <span>Delete</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      <p
        style={{
          fontSize: 11,
          color: "var(--text-tertiary)",
          lineHeight: 1.4,
        }}
      >
        {preset.description}
      </p>
      <span
        style={{
          fontSize: 10,
          color: "var(--text-muted)",
          marginTop: 4,
          display: "block",
        }}
      >
        {preset.request?.conditions?.length 
          ? `${preset.request.conditions.length} condition${preset.request.conditions.length !== 1 ? "s" : ""}`
          : "Raw Query"}
      </span>
    </div>
  );
}
