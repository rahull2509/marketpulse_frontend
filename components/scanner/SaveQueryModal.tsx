"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save, AlertCircle } from "lucide-react";
import { useCreatePreset, useUpdatePreset } from "@/hooks/usePresets";
import { useScannerStore } from "@/stores/scanner";

import type { UnifiedQueryRequest } from "@/types/scanner";

interface SaveQueryModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: UnifiedQueryRequest | null;
  scannerType: "live" | "historical";
  sorting?: any[];
  pageSize?: number;
  selectedColumns?: string[];
  loadedPresetId?: string | null;
  loadedPresetName?: string | null;
  isModified?: boolean;
  onUpdateSuccess?: () => void;
}

export function SaveQueryModal({ 
  isOpen, 
  onClose, 
  request, 
  scannerType, 
  sorting, 
  pageSize, 
  selectedColumns,
  loadedPresetId,
  loadedPresetName,
  isModified,
  onUpdateSuccess,
}: SaveQueryModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [conflictData, setConflictData] = useState<{ id: string; reason: string } | null>(null);
  const [saveMode, setSaveMode] = useState<"new" | "update">("new");

  const createMutation = useCreatePreset();
  const updateMutation = useUpdatePreset();

  const handleClose = () => {
    setName("");
    setDescription("");
    setIsPublic(false);
    setErrorMsg("");
    setConflictData(null);
    setSaveMode("new");
    onClose();
  };

  // Pre-fill name and choose default mode when opened
  useEffect(() => {
    if (isOpen) {
      if (loadedPresetName && !name) {
        setName(loadedPresetName);
      }
      if (loadedPresetId) {
        setSaveMode("update");
      } else {
        setSaveMode("new");
      }
    }
  }, [isOpen, loadedPresetId, loadedPresetName]);

  const handleSave = async () => {
    if (!name.trim()) {
      setErrorMsg("Name is required");
      return;
    }
    if (!request || (!request.conditions?.length && !request.query_text)) {
      setErrorMsg("Cannot save an empty query");
      return;
    }

    try {
      setErrorMsg("");
      
      if (saveMode === "update" && loadedPresetId) {
        await updateMutation.mutateAsync({
          id: loadedPresetId,
          payload: {
            name: name.trim(),
            description: description.trim(),
            request: request || undefined,
            is_public: isPublic,
            sorting: sorting,
            page_size: pageSize,
            selected_columns: selectedColumns,
          },
        });
        if (onUpdateSuccess) onUpdateSuccess();
      } else {
        await createMutation.mutateAsync({
          name: name.trim(),
          description: description.trim(),
          scanner_type: scannerType, // "live" or "historical"
          request: request!,
          is_public: isPublic,
          sorting: sorting,
          page_size: pageSize,
          selected_columns: selectedColumns,
        });
      }
      handleClose();
    } catch (error: any) {
      if (error?.status === 409) {
        setConflictData({
          id: error.data.detail.existing_preset_id,
          reason: error.data.detail.reason, // 'name_match' or 'payload_match'
        });
        setErrorMsg(error.data.detail.message);
      } else {
        setErrorMsg(error.message || "Failed to save preset");
      }
    }
  };

  const handleOverwrite = async () => {
    if (!conflictData) return;
    try {
      await updateMutation.mutateAsync({
        id: conflictData.id,
        payload: {
          name: name.trim(),
          description: description.trim(),
          request: request || undefined,
          is_public: isPublic,
          sorting: sorting,
          page_size: pageSize,
          selected_columns: selectedColumns,
        },
      });
      handleClose();
    } catch (error: any) {
      setErrorMsg(error.message || "Failed to overwrite preset");
    }
  };

  if (!isOpen) return null;

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
              <Save size={18} style={{ color: "var(--color-accent)" }} />
              <h2 style={{ fontSize: 16, fontWeight: 600 }}>Save Query</h2>
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

            <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)" }}>
              <input 
                type="checkbox" 
                id="preset-public"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                style={{ cursor: "pointer" }}
              />
              <label htmlFor="preset-public" style={{ fontSize: 13, cursor: "pointer" }}>Make public (Shared Gallery)</label>
            </div>

          </div>

          {/* Footer */}
          <div
            style={{
              padding: "var(--sp-4) var(--sp-5)",
              borderTop: "1px solid var(--border-light)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "var(--bg-primary)",
            }}
          >
            <div style={{ display: "flex", gap: "var(--sp-2)" }}>
              {loadedPresetId && (
                <>
                  <button
                    onClick={() => setSaveMode("update")}
                    style={{
                      padding: "var(--sp-2) var(--sp-3)",
                      background: saveMode === "update" ? "rgba(16, 185, 129, 0.1)" : "transparent",
                      border: `1px solid ${saveMode === "update" ? "var(--color-success)" : "var(--border-light)"}`,
                      borderRadius: "var(--radius-md)",
                      color: saveMode === "update" ? "var(--color-success)" : "var(--text-secondary)",
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: isModified ? "pointer" : "not-allowed",
                      opacity: isModified ? 1 : 0.5,
                    }}
                    disabled={!isModified}
                    title={!isModified ? "No modifications to save" : "Overwrite the currently loaded preset"}
                  >
                    Update Existing
                  </button>
                  <button
                    onClick={() => setSaveMode("new")}
                    style={{
                      padding: "var(--sp-2) var(--sp-3)",
                      background: saveMode === "new" ? "rgba(59, 130, 246, 0.1)" : "transparent",
                      border: `1px solid ${saveMode === "new" ? "var(--color-accent)" : "var(--border-light)"}`,
                      borderRadius: "var(--radius-md)",
                      color: saveMode === "new" ? "var(--color-accent)" : "var(--text-secondary)",
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: "pointer",
                    }}
                    title="Save as a completely new preset"
                  >
                    Save As New
                  </button>
                </>
              )}
            </div>

            <div style={{ display: "flex", gap: "var(--sp-3)" }}>
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
                disabled={createMutation.isPending || updateMutation.isPending}
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
                disabled={createMutation.isPending || updateMutation.isPending || !name.trim() || (saveMode === "update" && !isModified)}
              >
                {createMutation.isPending || updateMutation.isPending ? "Saving..." : (saveMode === "update" ? "Update Preset" : "Save Preset")}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
