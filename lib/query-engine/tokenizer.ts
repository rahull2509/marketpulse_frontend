/**
 * Query Engine Tokenizer — Lexes user-written scanner queries into tokens.
 *
 * Supports:
 * - Column names (possibly multi-word like "Last Price", wrapped in backticks or quoted)
 * - Numeric literals (integers, decimals, negative)
 * - Comparison operators (>, <, >=, <=, ==, !=)
 * - Logical operators (AND, OR, NOT)
 * - Arithmetic operators (+, -, *, /)
 * - Parentheses for grouping
 * - String literals in single or double quotes
 *
 * Example: `Volume > 100000 AND day_change_pct > 2`
 */

export enum TokenType {
  IDENTIFIER = "IDENTIFIER",
  NUMBER = "NUMBER",
  STRING = "STRING",
  OPERATOR = "OPERATOR",       // >, <, >=, <=, ==, !=
  LOGICAL = "LOGICAL",         // AND, OR, NOT
  ARITHMETIC = "ARITHMETIC",   // +, -, *, /
  LPAREN = "LPAREN",           // (
  RPAREN = "RPAREN",           // )
  COMMA = "COMMA",             // ,
  BETWEEN = "BETWEEN",         // BETWEEN keyword
  CONTAINS = "CONTAINS",       // CONTAINS keyword
  EOF = "EOF",
}

export interface Token {
  type: TokenType;
  value: string;
  position: number;  // Character offset in the original query string
  length: number;    // Length of the token in source
}

export interface TokenizeResult {
  tokens: Token[];
  errors: TokenizeError[];
}

export interface TokenizeError {
  message: string;
  position: number;
  length: number;
}

const KEYWORDS: Record<string, TokenType> = {
  AND: TokenType.LOGICAL,
  OR: TokenType.LOGICAL,
  NOT: TokenType.LOGICAL,
  BETWEEN: TokenType.BETWEEN,
  CONTAINS: TokenType.CONTAINS,
};

const COMPARISON_OPS = new Set([">=", "<=", "==", "!=", ">", "<"]);
const ARITHMETIC_OPS = new Set(["+", "-", "*", "/"]);

export function tokenize(input: string): TokenizeResult {
  const tokens: Token[] = [];
  const errors: TokenizeError[] = [];
  let pos = 0;

  while (pos < input.length) {
    // Skip whitespace
    if (/\s/.test(input[pos])) {
      pos++;
      continue;
    }

    const startPos = pos;

    // Two-character operators: >=, <=, ==, !=
    if (pos + 1 < input.length) {
      const twoChar = input.slice(pos, pos + 2);
      if (COMPARISON_OPS.has(twoChar)) {
        tokens.push({ type: TokenType.OPERATOR, value: twoChar, position: startPos, length: 2 });
        pos += 2;
        continue;
      }
    }

    // Single character operators: >, <
    if (input[pos] === ">" || input[pos] === "<") {
      tokens.push({ type: TokenType.OPERATOR, value: input[pos], position: startPos, length: 1 });
      pos++;
      continue;
    }

    // Parentheses
    if (input[pos] === "(") {
      tokens.push({ type: TokenType.LPAREN, value: "(", position: startPos, length: 1 });
      pos++;
      continue;
    }
    if (input[pos] === ")") {
      tokens.push({ type: TokenType.RPAREN, value: ")", position: startPos, length: 1 });
      pos++;
      continue;
    }

    // Comma
    if (input[pos] === ",") {
      tokens.push({ type: TokenType.COMMA, value: ",", position: startPos, length: 1 });
      pos++;
      continue;
    }

    // Arithmetic operators
    if (ARITHMETIC_OPS.has(input[pos])) {
      // Distinguish negative sign from subtraction:
      // If '-' follows an operator, LPAREN, comma, or is at start, it's part of a number
      if (
        input[pos] === "-" &&
        pos + 1 < input.length &&
        /[0-9.]/.test(input[pos + 1]) &&
        (tokens.length === 0 ||
          tokens[tokens.length - 1].type === TokenType.OPERATOR ||
          tokens[tokens.length - 1].type === TokenType.LOGICAL ||
          tokens[tokens.length - 1].type === TokenType.LPAREN ||
          tokens[tokens.length - 1].type === TokenType.COMMA ||
          tokens[tokens.length - 1].type === TokenType.ARITHMETIC)
      ) {
        // Parse as negative number
        const numResult = readNumber(input, pos);
        tokens.push({ type: TokenType.NUMBER, value: numResult.value, position: startPos, length: numResult.value.length });
        pos = numResult.end;
        continue;
      }

      tokens.push({ type: TokenType.ARITHMETIC, value: input[pos], position: startPos, length: 1 });
      pos++;
      continue;
    }

    // Numbers
    if (/[0-9.]/.test(input[pos])) {
      const numResult = readNumber(input, pos);
      tokens.push({ type: TokenType.NUMBER, value: numResult.value, position: startPos, length: numResult.value.length });
      pos = numResult.end;
      continue;
    }

    // String literals (single or double quote)
    if (input[pos] === '"' || input[pos] === "'") {
      const quote = input[pos];
      let end = pos + 1;
      while (end < input.length && input[end] !== quote) {
        if (input[end] === "\\") end++; // skip escaped chars
        end++;
      }
      if (end >= input.length) {
        errors.push({ message: `Unterminated string literal`, position: startPos, length: end - startPos });
        pos = end;
        continue;
      }
      const value = input.slice(pos + 1, end);
      tokens.push({ type: TokenType.STRING, value, position: startPos, length: end - startPos + 1 });
      pos = end + 1;
      continue;
    }

    // Backtick-quoted identifiers (for column names with spaces)
    if (input[pos] === "`") {
      let end = pos + 1;
      while (end < input.length && input[end] !== "`") {
        end++;
      }
      if (end >= input.length) {
        errors.push({ message: `Unterminated backtick identifier`, position: startPos, length: end - startPos });
        pos = end;
        continue;
      }
      const value = input.slice(pos + 1, end);
      tokens.push({ type: TokenType.IDENTIFIER, value, position: startPos, length: end - startPos + 1 });
      pos = end + 1;
      continue;
    }

    // Identifiers and keywords (alphabetic start, may contain letters, digits, underscores)
    if (/[a-zA-Z_]/.test(input[pos])) {
      let end = pos;
      while (end < input.length && /[a-zA-Z0-9_]/.test(input[end])) {
        end++;
      }
      const word = input.slice(pos, end);
      const upperWord = word.toUpperCase();

      if (KEYWORDS[upperWord]) {
        tokens.push({ type: KEYWORDS[upperWord], value: upperWord, position: startPos, length: end - pos });
      } else {
        tokens.push({ type: TokenType.IDENTIFIER, value: word, position: startPos, length: end - pos });
      }
      pos = end;
      continue;
    }

    // Unknown character
    errors.push({ message: `Unexpected character: '${input[pos]}'`, position: startPos, length: 1 });
    pos++;
  }

  tokens.push({ type: TokenType.EOF, value: "", position: pos, length: 0 });
  return { tokens, errors };
}

function readNumber(input: string, start: number): { value: string; end: number } {
  let end = start;
  if (input[end] === "-") end++;
  let hasDecimal = false;

  while (end < input.length) {
    if (input[end] === ".") {
      if (hasDecimal) break;
      hasDecimal = true;
      end++;
    } else if (/[0-9]/.test(input[end])) {
      end++;
    } else {
      break;
    }
  }

  return { value: input.slice(start, end), end };
}
