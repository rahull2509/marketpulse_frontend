"use client";

import { useState } from "react";
import { usePresets, useMarkPresetUsed } from "@/hooks/usePresets";
import { ScannerPreset } from "@/types/scanner";
import { PresetCard } from "@/components/scanner/PresetCard";
import { EditPresetModal } from "@/components/scanner/EditPresetModal";
import { DeletePresetModal } from "@/components/scanner/DeletePresetModal";

interface MyPresetsListProps {
  scannerType?: "live" | "historical";
  onSelect: (preset: ScannerPreset) => void;
  onEditConditions?: (preset: ScannerPreset) => void;
}

export function MyPresetsList({ scannerType, onSelect, onEditConditions }: MyPresetsListProps) {
  const { data: presets, isLoading } = usePresets(scannerType);
  const markUsedMutation = useMarkPresetUsed();
  
  const [editingPreset, setEditingPreset] = useState<ScannerPreset | null>(null);
  const [deletingPreset, setDeletingPreset] = useState<ScannerPreset | null>(null);

  const handleSelect = (preset: ScannerPreset) => {
    markUsedMutation.mutate(preset.id);
    onSelect(preset);
  };

  if (isLoading) {
    return null; // Or a skeleton
  }

  if (!presets || presets.length === 0) {
    return null;
  }

  return (
    <>
      <div style={{ marginTop: "var(--sp-4)" }}>
        <h3
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "var(--text-tertiary)",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            marginBottom: "var(--sp-3)",
          }}
        >
          My Presets
        </h3>
        <div
          style={{
            display: "flex",
            gap: "var(--sp-3)",
            overflowX: "auto",
            paddingBottom: "var(--sp-1)",
          }}
        >
          {presets.map((preset) => (
            <PresetCard
              key={preset.id}
              preset={preset}
              onSelect={handleSelect}
              onEdit={(p) => setEditingPreset(p)}
              onEditConditions={onEditConditions}
              onDelete={(p) => setDeletingPreset(p)}
            />
          ))}
        </div>
      </div>

      <EditPresetModal
        isOpen={!!editingPreset}
        onClose={() => setEditingPreset(null)}
        preset={editingPreset}
      />

      <DeletePresetModal
        isOpen={!!deletingPreset}
        onClose={() => setDeletingPreset(null)}
        preset={deletingPreset}
      />
    </>
  );
}
