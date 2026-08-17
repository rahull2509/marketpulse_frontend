"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle } from "lucide-react";
import { useDeletePreset } from "@/hooks/usePresets";
import { ScannerPreset } from "@/types/scanner";

interface DeletePresetModalProps {
  isOpen: boolean;
  onClose: () => void;
  preset: ScannerPreset | null;
}

export function DeletePresetModal({ isOpen, onClose, preset }: DeletePresetModalProps) {
  const deleteMutation = useDeletePreset();

  const handleClose = () => {
    onClose();
  };

  const handleDelete = async () => {
    if (!preset) return;
    try {
      await deleteMutation.mutateAsync(preset.id);
      handleClose();
    } catch (error) {
      console.error("Failed to delete preset:", error);
      // We could add error state here, but standard error handling is usually sufficient for deletes
    }
  };

  if (!isOpen || !preset) return null;

  return (
    <AnimatePresence>
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "rgba(0, 0, 0, 0.4)",
          backdropFilter: "blur(4px)",
        }}
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          style={{
            background: "var(--bg-secondary)",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--border-light)",
            width: "90%",
            maxWidth: "400px",
            boxShadow: "var(--shadow-xl)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            style={{
              padding: "var(--sp-4) var(--sp-5)",
              borderBottom: "1px solid var(--border-light)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "var(--bg-primary)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)" }}>
              <AlertTriangle size={18} style={{ color: "var(--color-danger)" }} />
              <h2 style={{ fontSize: 16, fontWeight: 600 }}>Delete Preset</h2>
            </div>
            <button
              onClick={handleClose}
              className="btn-icon"
              style={{ padding: "var(--sp-2)" }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div style={{ padding: "var(--sp-5)", display: "flex", flexDirection: "column", gap: "var(--sp-4)" }}>
            <p style={{ fontSize: 14, color: "var(--text-primary)", lineHeight: 1.5 }}>
              Delete "{preset.name}"?
            </p>
            <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
              This action cannot be undone.
            </p>
          </div>

          {/* Footer */}
          <div
            style={{
              padding: "var(--sp-4) var(--sp-5)",
              borderTop: "1px solid var(--border-light)",
              display: "flex",
              justifyContent: "flex-end",
              gap: "var(--sp-3)",
              background: "var(--bg-primary)",
            }}
          >
            <button
              onClick={handleClose}
              style={{
                padding: "var(--sp-2) var(--sp-4)",
                background: "transparent",
                border: "1px solid var(--border-light)",
                borderRadius: "var(--radius-md)",
                color: "var(--text-secondary)",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
              }}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              style={{
                padding: "var(--sp-2) var(--sp-4)",
                background: "var(--color-danger)",
                border: "1px solid var(--color-danger)",
                borderRadius: "var(--radius-md)",
                color: "#fff",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "var(--sp-2)",
              }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
