export interface ExtractedToken {
  token: string | null;
  start: number;
  end: number;
}

/**
 * Robustly extracts the complete identifier surrounding the caret position.
 * It ignores spaces within the identifier (allowing multi-word identifiers like "Last Trade"),
 * and stops only at punctuation operators or SQL logical keywords (AND, OR, BETWEEN).
 */
export function extractActiveIdentifier(query: string, caretPos: number): ExtractedToken {
  // If the character immediately before the caret is whitespace, the user is not actively typing an identifier.
  // This naturally suppresses the popup immediately after accepting a suggestion (which inserts a trailing space),
  // while allowing it to gracefully reopen when they type the next character of a multi-word identifier.
  if (caretPos > 0 && /\s/.test(query[caretPos - 1])) {
    return { token: null, start: caretPos, end: caretPos };
  }

  const isPunctuation = (char: string) => /[\(\),><=!+\-*\/%^\:;&|]/.test(char);
  
  let start = caretPos - 1;
  while (start >= 0) {
    if (isPunctuation(query[start])) {
      break;
    }
    start--;
  }
  let tokenStart = start + 1;

  let end = caretPos;
  while (end < query.length) {
    if (isPunctuation(query[end])) {
      break;
    }
    end++;
  }
  let tokenEnd = end;

  let candidate = query.slice(tokenStart, tokenEnd);
  const KEYWORD_REGEX = /\b(AND|OR|BETWEEN)\b/gi;
  
  let chunkStart = 0;
  let chunkEnd = candidate.length;
  let match;
  
  const caretInCandidate = caretPos - tokenStart;
  
  while ((match = KEYWORD_REGEX.exec(candidate)) !== null) {
    const matchStart = match.index;
    const matchEnd = match.index + match[0].length;
    
    if (caretInCandidate <= matchStart) {
      chunkEnd = Math.min(chunkEnd, matchStart);
    } else if (caretInCandidate >= matchEnd) {
      chunkStart = Math.max(chunkStart, matchEnd);
    } else {
      return { token: null, start: caretPos, end: caretPos };
    }
  }

  let finalStart = tokenStart + chunkStart;
  let finalEnd = tokenStart + chunkEnd;
  
  let tokenStr = query.slice(finalStart, finalEnd);
  
  const leadingMatch = tokenStr.match(/^\s+/);
  if (leadingMatch) {
    finalStart += leadingMatch[0].length;
  }
  
  const trailingMatch = tokenStr.match(/\s+$/);
  if (trailingMatch) {
    finalEnd -= trailingMatch[0].length;
  }
  
  if (finalStart > finalEnd) finalStart = finalEnd;
  
  const token = query.slice(finalStart, finalEnd);
  
  return {
    token: token.length > 0 ? token : null,
    start: finalStart,
    end: finalEnd
  };
}
