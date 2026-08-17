"use client";

/**
 * QueryBuilder — Full modal for writing advanced scanner queries.
 *
 * Features:
 * - Textarea editor with monospace font
 * - Real-time validation display (errors/warnings)
 * - Operator toolbar (clickable buttons)
 * - RatioGallery sidebar (column picker)
 * - Execution target selector (Live vs History)
 * - Example queries
 */

import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RatioGallery } from "./RatioGallery";
import { AutocompletePopup } from "./AutocompletePopup";
import { tokenize, parse, validate, validateParentheses, astToConditions } from "@/lib/query-engine";
import { extractActiveIdentifier } from "@/lib/tokenExtractor";
import { useColumnStore } from "@/stores/columns";
import { useAutocomplete } from "@/hooks/useAutocomplete";
import type { ScannerCondition } from "@/types/scanner";
import {
  X,
  Play,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Eraser,
  Sparkles,
} from "lucide-react";

interface QueryBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  onExecute: (query: string, target: "live" | "history", date?: string, conditions?: ScannerCondition[]) => void;
  hideTargetSelector?: boolean;
  storeHook?: typeof useColumnStore;
  initialQuery?: string;
  showPresetControls?: boolean;
  onUpdatePreset?: (query: string, conditions: ScannerCondition[]) => void;
  onSaveAsNew?: (query: string, conditions: ScannerCondition[]) => void;
}

const EXAMPLE_QUERIES = [
  { label: "High Volume Gainers", query: "Volume > 500000 AND day_change_pct > 2" },
  { label: "Price Range", query: "last_price BETWEEN 100 AND 500" },
  { label: "Momentum Filter", query: "MoM_Gain_Pct > 5 AND Volume > 100000" },
  { label: "Bearish + Volume", query: "day_change_pct < -2 AND Volume > 200000" },
  { label: "Near 52W High", query: "Movement_From_52W_High > -5" },
];

const OPERATOR_BUTTONS = [
  { label: ">", insert: " > " },
  { label: "<", insert: " < " },
  { label: ">=", insert: " >= " },
  { label: "<=", insert: " <= " },
  { label: "==", insert: " == " },
  { label: "!=", insert: " != " },
  { label: "AND", insert: " AND " },
  { label: "OR", insert: " OR " },
  { label: "NOT", insert: "NOT " },
  { label: "BETWEEN", insert: " BETWEEN " },
  { label: "CONTAINS", insert: " CONTAINS " },
  { label: "(  )", insert: "(" },
];

export function QueryBuilder({
  isOpen,
  onClose,
  onExecute,
  hideTargetSelector,
  storeHook,
  initialQuery,
  showPresetControls,
  onUpdatePreset,
  onSaveAsNew
}: QueryBuilderProps) {
  const [query, setQuery] = useState(initialQuery || "");
  const [target, setTarget] = useState<"live" | "history">(hideTargetSelector ? "history" : "live");
  const [historyDate, setHistoryDate] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const useStore = storeHook || useColumnStore;
  const { metadata } = useStore();
  
  // Phase 1B: Initialize editor state tracking
  const autocompleteState = useAutocomplete(textareaRef, query, metadata, isOpen);

  useEffect(() => {
    if (initialQuery !== undefined) {
      setQuery(initialQuery);
    }
  }, [initialQuery]);

  // Parse and validate in real-time
  const analysis = useMemo(() => {
    if (!query.trim()) {
      return { ast: null, errors: [], warnings: [], isValid: false, isEmpty: true };
    }

    const parenErrors = validateParentheses(query);
    const tokenResult = tokenize(query);
    const parseResult = parse(tokenResult);
    const validation = validate(parseResult.ast, metadata);

    const allErrors = [
      ...parenErrors.map((e) => e.message),
      ...parseResult.errors.map((e) => e.message),
      ...validation.errors.map((e) => `${e.message}${e.suggestion ? ` ${e.suggestion}` : ""}`),
    ];
    const allWarnings = validation.warnings.map((w) => w.message);

    return {
      ast: parseResult.ast,
      errors: allErrors,
      warnings: allWarnings,
      isValid: allErrors.length === 0 && parseResult.ast !== null,
      isEmpty: false,
    };
  }, [query, metadata]);

  const insertAtCursor = useCallback((text: string) => {
    const ta = textareaRef.current;
    if (!ta) return;

    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const before = query.slice(0, start);
    const after = query.slice(end);

    const newQuery = before + text + after;
    setQuery(newQuery);

    // Restore cursor position after the inserted text
    requestAnimationFrame(() => {
      ta.focus();
      const newPos = start + text.length;
      ta.setSelectionRange(newPos, newPos);
    });
  }, [query]);

  const handleColumnSelect = useCallback((columnName: string) => {
    // If column name has spaces or special chars, wrap in backticks
    const needsQuote = /[^a-zA-Z0-9_]/.test(columnName);
    const insert = needsQuote ? `\`${columnName}\`` : columnName;
    insertAtCursor(insert);
  }, [insertAtCursor]);

  const acceptSuggestion = useCallback((index: number) => {

    if (!autocompleteState.isActive || autocompleteState.suggestions.length === 0) return;
    
    const column = autocompleteState.suggestions[index];
    if (!column) return;

    const ta = textareaRef.current;
    if (!ta) return;

    const currentQuery = ta.value;
    const caretPos = ta.selectionStart;
    
    const { start: fullTokenStart, end: fullTokenEnd } = extractActiveIdentifier(currentQuery, caretPos);

    const columnName = column.column;
    const needsQuote = /[^a-zA-Z0-9_]/.test(columnName);
    const insert = (needsQuote ? `\`${columnName}\`` : columnName) + " ";

    if (typeof ta.setRangeText === "function") {
      ta.setRangeText(insert, fullTokenStart, fullTokenEnd, "end");
    } else {
      // Safe fallback
      ta.focus();
      ta.setSelectionRange(fullTokenStart, fullTokenEnd);
      const newQuery = currentQuery.slice(0, fullTokenStart) + insert + currentQuery.slice(fullTokenEnd);
      setQuery(newQuery);
      requestAnimationFrame(() => {
        const newPos = fullTokenStart + insert.length;
        ta.setSelectionRange(newPos, newPos);
      });
    }

    // Dispatch native input event to synchronize React state
    ta.dispatchEvent(new Event("input", { bubbles: true }));

    // Close popup and reset state
    autocompleteState.closePopup();
  }, [autocompleteState]);

  const handleExecute = useCallback(() => {
    if (!analysis.isValid) return;

    // Generate the structured conditions array for local live execution
    const conditions = astToConditions(analysis.ast);

    // In history mode, ensure we have a date if required by your backend
    onExecute(query, target, target === "history" ? historyDate : undefined, conditions);
    onClose();
  }, [analysis.isValid, analysis.ast, query, target, historyDate, onExecute, onClose]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Ignore keydown events during active IME composition
    if (e.nativeEvent.isComposing) return;

    // IntelliSense Interactive Navigation
    if (autocompleteState.isActive && autocompleteState.suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        e.stopPropagation();
        autocompleteState.setSelectedIndex((autocompleteState.selectedIndex + 1) % autocompleteState.suggestions.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        e.stopPropagation();
        autocompleteState.setSelectedIndex((autocompleteState.selectedIndex - 1 + autocompleteState.suggestions.length) % autocompleteState.suggestions.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        e.stopPropagation();
        acceptSuggestion(autocompleteState.selectedIndex);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        autocompleteState.closePopup();
        return; // Return early, do not trigger modal close
      }
    }

    // Ctrl/Cmd + Enter to execute
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      handleExecute();
    }
    // Escape to close
    if (e.key === "Escape") {
      e.stopPropagation();
      onClose();
    }
  }, [handleExecute, onClose, autocompleteState, acceptSuggestion]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(4px)",
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.2 }}
          className="card"
          style={{
            width: "min(1100px, 92vw)",
            height: "min(680px, 85vh)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
          onKeyDown={handleKeyDown}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "var(--sp-4) var(--sp-5)",
              borderBottom: "1px solid var(--border-primary)",
              flexShrink: 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)" }}>
              <Sparkles size={16} style={{ color: "var(--color-accent)" }} />
              <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>
                Create Screener
              </h2>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-4)" }}>

              {/* Execution Target Selector */}
              {!hideTargetSelector && (
                <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)" }}>
                  <label style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                    <input
                      type="radio"
                      name="target"
                      value="live"
                      checked={target === "live"}
                      onChange={() => setTarget("live")}
                    /> Live
                  </label>
                  <label style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                    <input
                      type="radio"
                      name="target"
                      value="history"
                      checked={target === "history"}
                      onChange={() => setTarget("history")}
                    /> History
                  </label>

                  {target === "history" && (
                    <input
                      type="date"
                      className="input"
                      style={{ height: 26, fontSize: 12, padding: "0 8px" }}
                      value={historyDate}
                      onChange={(e) => setHistoryDate(e.target.value)}
                    />
                  )}
                </div>
              )}

              {!hideTargetSelector && <div style={{ width: 1, height: 16, backgroundColor: "var(--border-primary)" }} />}

              <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)" }}>
                <button className="btn btn-ghost" onClick={() => setQuery("")} title="Clear query">
                  <Eraser size={13} />
                  Clear
                </button>
                {showPresetControls ? (
                  <>
                    <button
                      className="btn btn-secondary"
                      onClick={() => {
                        if (!analysis.isValid) return;
                        const conditions = astToConditions(analysis.ast);
                        onUpdatePreset?.(query, conditions);
                      }}
                      disabled={!analysis.isValid}
                    >
                      Update Preset
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={() => {
                        if (!analysis.isValid) return;
                        const conditions = astToConditions(analysis.ast);
                        onSaveAsNew?.(query, conditions);
                      }}
                      disabled={!analysis.isValid}
                    >
                      Save as New
                    </button>
                  </>
                ) : null}
                <button
                  className="btn btn-primary"
                  onClick={handleExecute}
                  disabled={!analysis.isValid}
                >
                  <Play size={13} />
                  Run Query
                  <span style={{ fontSize: 10, opacity: 0.7, marginLeft: 4 }}>⌘↵</span>
                </button>
                <button className="btn btn-ghost btn-icon" onClick={onClose}>
                  <X size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Body */}
          <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
            {/* Left: Editor + Toolbar */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
              {/* Operator toolbar */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 4,
                  padding: "var(--sp-3) var(--sp-4)",
                  borderBottom: "1px solid var(--border-primary)",
                  flexShrink: 0,
                }}
              >
                {OPERATOR_BUTTONS.map((btn) => (
                  <button
                    key={btn.label}
                    className="btn btn-ghost"
                    onClick={() => insertAtCursor(btn.insert)}
                    style={{
                      height: 26,
                      padding: "0 8px",
                      fontSize: 11,
                      fontFamily: "var(--font-mono)",
                      fontWeight: 500,
                    }}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>

              {/* Editor */}
              <div style={{ flex: 1, padding: "var(--sp-4)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                <div style={{ flex: 1, position: "relative", display: "flex", flexDirection: "column" }}>
                  {autocompleteState.isActive && autocompleteState.activeToken && autocompleteState.suggestions.length > 0 && autocompleteState.position && (
                    <div 
                      style={{ 
                        position: "absolute", 
                        top: autocompleteState.position.top, 
                        left: autocompleteState.position.left,
                        zIndex: 1000,
                        pointerEvents: "none" // Allow clicking through the wrapper
                      }}
                    >
                      <div style={{ pointerEvents: "auto" }}>
                        <AutocompletePopup 
                          suggestions={autocompleteState.suggestions} 
                          selectedIndex={autocompleteState.selectedIndex}
                          onHover={autocompleteState.setSelectedIndex}
                          onClick={acceptSuggestion}
                        />
                      </div>
                    </div>
                  )}
                  <textarea
                  ref={textareaRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Write your query here...&#10;&#10;Example: Volume > 500000 AND day_change_pct > 2"
                  spellCheck={false}
                  autoFocus
                  onKeyDown={handleKeyDown}
                  aria-expanded={autocompleteState.isActive}
                  aria-autocomplete="list"
                  aria-controls="autocomplete-list"
                  aria-activedescendant={autocompleteState.isActive && autocompleteState.suggestions.length > 0 ? `suggestion-${autocompleteState.selectedIndex}` : undefined}
                  style={{
                    flex: 1,
                    width: "100%",
                    resize: "none",
                    border: `1px solid ${analysis.errors.length > 0 && !analysis.isEmpty ? "var(--color-negative)" : "var(--border-primary)"}`,
                    borderRadius: "var(--radius-md)",
                    padding: "var(--sp-3)",
                    fontFamily: "var(--font-mono)",
                    fontSize: 13,
                    lineHeight: 1.6,
                    color: "var(--text-primary)",
                    backgroundColor: "var(--bg-primary)",
                    outline: "none",
                    transition: "border-color var(--transition-fast)",
                  }}
                  onFocus={(e) => {
                    if (!analysis.errors.length) {
                      e.currentTarget.style.borderColor = "var(--color-accent)";
                    }
                  }}
                  onBlur={(e) => {
                    if (!analysis.errors.length) {
                      e.currentTarget.style.borderColor = "var(--border-primary)";
                    }
                  }}
                />
                </div>

                {/* Validation feedback */}
                <div style={{ marginTop: "var(--sp-2)", minHeight: 48, flexShrink: 0 }}>
                  {analysis.errors.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      {analysis.errors.map((err, i) => (
                        <div
                          key={i}
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 6,
                            fontSize: 11,
                            color: "var(--color-negative)",
                          }}
                        >
                          <AlertCircle size={12} style={{ flexShrink: 0, marginTop: 1 }} />
                          {err}
                        </div>
                      ))}
                    </div>
                  )}

                  {analysis.warnings.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: analysis.errors.length ? 4 : 0 }}>
                      {analysis.warnings.map((warn, i) => (
                        <div
                          key={i}
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 6,
                            fontSize: 11,
                            color: "var(--color-warning, #f59e0b)",
                          }}
                        >
                          <AlertTriangle size={12} style={{ flexShrink: 0, marginTop: 1 }} />
                          {warn}
                        </div>
                      ))}
                    </div>
                  )}

                  {analysis.isValid && !analysis.isEmpty && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "var(--sp-3)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--color-positive)" }}>
                        <CheckCircle size={12} />
                        Valid query
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Example queries */}
              <div
                style={{
                  padding: "var(--sp-3) var(--sp-4)",
                  borderTop: "1px solid var(--border-primary)",
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 500,
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    marginBottom: 6,
                  }}
                >
                  Examples
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {EXAMPLE_QUERIES.map((ex) => (
                    <button
                      key={ex.label}
                      className="btn btn-ghost"
                      onClick={() => setQuery(ex.query)}
                      style={{ height: 24, padding: "0 8px", fontSize: 10 }}
                      title={ex.query}
                    >
                      {ex.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: RatioGallery */}
            <div style={{ width: 240, flexShrink: 0 }}>
              <RatioGallery onSelect={handleColumnSelect} storeHook={storeHook} />
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
