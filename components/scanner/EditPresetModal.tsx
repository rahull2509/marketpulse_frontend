"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Edit2, AlertCircle } from "lucide-react";
import { useUpdatePreset } from "@/hooks/usePresets";
import { ScannerPreset } from "@/types/scanner";

interface EditPresetModalProps {
  isOpen: boolean;
  onClose: () => void;
  preset: ScannerPreset | null;
}

export function EditPresetModal({ isOpen, onClose, preset }: EditPresetModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const updateMutation = useUpdatePreset();

  useEffect(() => {
    if (preset && isOpen) {
      setName(preset.name);
      setDescription(preset.description || "");
      setErrorMsg("");
    }
  }, [preset, isOpen]);

  const handleClose = () => {
    setErrorMsg("");
    onClose();
  };

  const handleSave = async () => {
    if (!preset) return;
    if (!name.trim()) {
      setErrorMsg("Name is required");
      return;
    }

    try {
      setErrorMsg("");
      await updateMutation.mutateAsync({
        id: preset.id,
        payload: {
          name: name.trim(),
          description: description.trim(),
          // We must pass the request payload along to avoid erasing it,
          // but since this is just an edit to metadata, we use the existing request.
          request: preset.request,
        },
      });
      handleClose();
    } catch (error: any) {
      if (error?.status === 409) {
        setErrorMsg(error.data?.detail?.message || "A preset with this name already exists.");
      } else {
        setErrorMsg(error.message || "Failed to update preset");
      }
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
            maxWidth: "480px",
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
              <Edit2 size={18} style={{ color: "var(--color-accent)" }} />
              <h2 style={{ fontSize: 16, fontWeight: 600 }}>Edit Preset</h2>
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
            
            {errorMsg && (
              <div style={{
                padding: "var(--sp-3)",
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.2)",
                borderRadius: "var(--radius-md)",
                color: "var(--color-danger)",
                fontSize: 13,
                display: "flex",
                gap: "var(--sp-2)",
                alignItems: "center"
              }}>
                <AlertCircle size={16} />
                <span style={{ flex: 1 }}>{errorMsg}</span>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-1)" }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)" }}>Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. High Volume Bullish"
                autoFocus
                style={{
                  width: "100%",
                  padding: "var(--sp-3)",
                  background: "var(--bg-primary)",
                  border: "1px solid var(--border-light)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--text-primary)",
                  outline: "none",
                }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-1)" }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)" }}>Description (Optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this query does..."
                style={{
                  width: "100%",
                  padding: "var(--sp-3)",
                  background: "var(--bg-primary)",
                  border: "1px solid var(--border-light)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--text-primary)",
                  outline: "none",
                  minHeight: "80px",
                  resize: "vertical"
                }}
              />
            </div>

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
              disabled={updateMutation.isPending}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              style={{
                padding: "var(--sp-2) var(--sp-4)",
                background: "var(--color-accent)",
                border: "1px solid var(--color-accent)",
                borderRadius: "var(--radius-md)",
                color: "#fff",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "var(--sp-2)",
              }}
              disabled={updateMutation.isPending || !name.trim()}
            >
              {updateMutation.isPending ? "Saving..." : "Save"}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
