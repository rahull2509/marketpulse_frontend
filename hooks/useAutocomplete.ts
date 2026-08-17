import { useState, useEffect, useCallback, useRef, type RefObject } from 'react';
import { matchColumns } from '@/lib/autocomplete';
import { getCaretCoordinates } from '@/lib/caretPosition';
import type { ColumnMetadata } from '@/types/metadata';

export interface AutocompleteState {
  activeToken: string | null;
  suggestions: ColumnMetadata[];
  selectionStart: number;
  selectionEnd: number;
  tokenStart: number | null;
  tokenEnd: number | null;
  isActive: boolean;
  position: { top: number; left: number } | null;
  /**
   * Reserved API for future phases (e.g. Phase 1C). 
   * Exists as an extension point if external triggers (like a manual Ctrl+Space shortcut) 
   * need to forcefully re-evaluate state outside the native event flow.
   */
  refresh: () => void;
  selectedIndex: number;
  setSelectedIndex: (index: number) => void;
  closePopup: () => void;
}

import { extractActiveIdentifier } from "@/lib/tokenExtractor";

export function useAutocomplete(
  textareaRef: RefObject<HTMLTextAreaElement | null>,
  query: string,
  metadata: ColumnMetadata[],
  isOpen: boolean = true
): AutocompleteState {
  const [isActive, setIsActive] = useState(false);
  const [selectionStart, setSelectionStart] = useState(0);
  const [selectionEnd, setSelectionEnd] = useState(0);
  const [activeToken, setActiveToken] = useState<string | null>(null);
  const [tokenStart, setTokenStart] = useState<number | null>(null);
  const [tokenEnd, setTokenEnd] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState<ColumnMetadata[]>([]);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  // Track IME composition to avoid thrashing during multi-keystroke inputs
  const isComposingRef = useRef(false);

  // Memoize token strictly to prevent unnecessary matchColumns calls
  const lastTokenRef = useRef<string | null>(null);
  
  // Manage rAF to prevent layout thrashing
  const rafRef = useRef<number | null>(null);

  const updateState = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }

    rafRef.current = requestAnimationFrame(() => {
      // Suspend updates while IME composition is ongoing
      if (isComposingRef.current) return;

      try {
        const el = textareaRef.current;
      if (!el) return;

      const selStart = el.selectionStart;
      const selEnd = el.selectionEnd;
      
      setSelectionStart(selStart);
      setSelectionEnd(selEnd);

      // If a text range is selected (e.g., user is dragging to highlight text),
      // autocomplete remains inactive until the selection collapses to a caret.
      if (selStart !== selEnd) {
        setSuggestions([]);
        setActiveToken(null);
        setTokenStart(null);
        setTokenEnd(null);
        lastTokenRef.current = null;
        return;
      }

      // Read directly from the DOM node to break the React dependency on `query`
      // This prevents the useEffect from tearing down and rebuilding native listeners on every keystroke
      const currentQuery = el.value;

      const { token, start, end } = extractActiveIdentifier(currentQuery, selStart);

      setActiveToken(token);
      setTokenStart(token ? start : null);
      setTokenEnd(token ? end : null);

      let currentSuggestions = suggestions;
      if (token !== lastTokenRef.current) {
        lastTokenRef.current = token;
        currentSuggestions = token ? matchColumns(token, metadata, 10) : [];
        setSuggestions(currentSuggestions);
        setSelectedIndex(0); // Reset selection on new matches
      }

      if (token && currentSuggestions.length > 0) {
        const coords = getCaretCoordinates(el, start);
        if (coords) {
          let popupHeight = Math.min(currentSuggestions.length * 28 + 16, 296);
          let popupWidth = 240;
          
          // Use exact runtime measurements if popup is already in the DOM
          const popupEl = el.parentElement?.querySelector('[role="listbox"]') as HTMLElement;
          if (popupEl) {
            popupHeight = popupEl.offsetHeight || popupHeight;
            popupWidth = popupEl.offsetWidth || popupWidth;
          }
          
          const rect = el.getBoundingClientRect();
          let finalTop = coords.top;
          let finalLeft = coords.left;
          
          if (rect.top + finalTop + popupHeight > window.innerHeight) {
            finalTop = coords.top - popupHeight - coords.lineHeight;
          }
          
          if (rect.left + finalLeft + popupWidth > window.innerWidth) {
            finalLeft = window.innerWidth - rect.left - popupWidth - 16;
          }
          
          if (finalLeft < 0) finalLeft = 0;
          
          setPosition({ top: finalTop, left: finalLeft });
        }
      } else {
        setPosition(null);
      }
    } catch (err) {
      // Per-event recovery: silently fail this iteration, but allow the next event to try again
      setSuggestions([]);
      setPosition(null);
      setActiveToken(null);
      setTokenStart(null);
      setTokenEnd(null);
    }
    });
  }, [metadata, textareaRef, suggestions]); // Removed `query` dependency

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const el = textareaRef.current;
    if (!el) return;

    const handleFocus = () => setIsActive(true);
    const handleBlur = () => {
      // Delay blur to accommodate potential popup clicks in future phases
      setTimeout(() => setIsActive(false), 150);
    };

    const handleCompositionStart = () => { isComposingRef.current = true; };
    const handleCompositionEnd = () => { 
      isComposingRef.current = false; 
      updateState(); 
    };

    const events = ['input', 'keyup', 'mouseup', 'paste', 'cut'];
    events.forEach(e => el.addEventListener(e, updateState));
    
    el.addEventListener('compositionstart', handleCompositionStart);
    el.addEventListener('compositionupdate', handleCompositionStart);
    el.addEventListener('compositionend', handleCompositionEnd);
    
    el.addEventListener('focus', handleFocus);
    el.addEventListener('blur', handleBlur);
    el.addEventListener('scroll', updateState, { passive: true });
    window.addEventListener('resize', updateState, { passive: true });
    
    const resizeObserver = new ResizeObserver(() => {
      if (document.activeElement === el) updateState();
    });
    resizeObserver.observe(el);

    // Initial state setup if autoFocus triggered before mount
    if (document.activeElement === el) {
      setIsActive(true);
    }
    updateState();

    return () => {
      events.forEach(e => el.removeEventListener(e, updateState));
      el.removeEventListener('compositionstart', handleCompositionStart);
      el.removeEventListener('compositionupdate', handleCompositionStart);
      el.removeEventListener('compositionend', handleCompositionEnd);
      el.removeEventListener('focus', handleFocus);
      el.removeEventListener('blur', handleBlur);
      el.removeEventListener('scroll', updateState);
      window.removeEventListener('resize', updateState);
      resizeObserver.disconnect();
    };
  }, [updateState, isOpen]);

  const closePopup = useCallback(() => {
    setIsActive(false);
    setActiveToken(null);
    setTokenStart(null);
    setTokenEnd(null);
    setSuggestions([]);
    setPosition(null);
    setSelectedIndex(0);
  }, []);

  return {
    activeToken,
    suggestions,
    selectionStart,
    selectionEnd,
    tokenStart,
    tokenEnd,
    isActive,
    position,
    refresh: updateState,
    selectedIndex,
    setSelectedIndex,
    closePopup
  };
}
