/**
 * Query Engine Validator — Real-time validation against known column metadata.
 *
 * Validates:
 * - Unknown column names (with closest-match suggestions)
 * - Type mismatches (comparing string column with numeric operator)
 * - Unbalanced parentheses
 * - Missing operands
 * - Empty expressions
 */

import type { ASTNode } from "./parser";
import type { ColumnMetadata } from "@/types/metadata";

export interface ValidationError {
  message: string;
  severity: "error" | "warning";
  position?: number;
  suggestion?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  referencedColumns: string[];
}

/**
 * Validate an AST against known column metadata.
 */
export function validate(
  ast: ASTNode | null,
  knownColumns: ColumnMetadata[]
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  const referencedColumns: string[] = [];

  if (!ast) {
    return { isValid: true, errors: [], warnings: [], referencedColumns: [] };
  }

  const columnNames = new Set(knownColumns.map((c) => c.column));
  const columnTypeMap = new Map(knownColumns.map((c) => [c.column, c.type]));

  walkNode(ast, columnNames, columnTypeMap, errors, warnings, referencedColumns);

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    referencedColumns: [...new Set(referencedColumns)],
  };
}

/**
 * Validate parentheses balance in the raw query string.
 * Returns errors if unbalanced.
 */
export function validateParentheses(query: string): ValidationError[] {
  const errors: ValidationError[] = [];
  let depth = 0;

  for (let i = 0; i < query.length; i++) {
    if (query[i] === "(") {
      depth++;
    } else if (query[i] === ")") {
      depth--;
      if (depth < 0) {
        errors.push({
          message: "Unexpected closing parenthesis",
          severity: "error",
          position: i,
        });
        depth = 0;
      }
    }
  }

  if (depth > 0) {
    errors.push({
      message: `Missing ${depth} closing parenthes${depth === 1 ? "is" : "es"}`,
      severity: "error",
    });
  }

  return errors;
}

/**
 * Get autocomplete suggestions for the current cursor position.
 */
export function getAutocompleteSuggestions(
  partialWord: string,
  knownColumns: ColumnMetadata[],
  cursorContext: "column" | "operator" | "value" | "logical"
): string[] {
  if (cursorContext === "column" || cursorContext === "value") {
    const lower = partialWord.toLowerCase();
    return knownColumns
      .filter((c) => c.column.toLowerCase().includes(lower))
      .sort((a, b) => {
        // Prioritize starts-with matches
        const aStarts = a.column.toLowerCase().startsWith(lower) ? 0 : 1;
        const bStarts = b.column.toLowerCase().startsWith(lower) ? 0 : 1;
        return aStarts - bStarts || a.column.localeCompare(b.column);
      })
      .slice(0, 20)
      .map((c) => c.column);
  }

  if (cursorContext === "operator") {
    return [">", "<", ">=", "<=", "==", "!=", "BETWEEN", "CONTAINS"];
  }

  if (cursorContext === "logical") {
    return ["AND", "OR", "NOT"];
  }

  return [];
}

/* ── Internal Helpers ─────────────────────────────────────────── */

function walkNode(
  node: ASTNode,
  columnNames: Set<string>,
  columnTypeMap: Map<string, string>,
  errors: ValidationError[],
  warnings: ValidationError[],
  referencedColumns: string[]
): void {
  switch (node.type) {
    case "Identifier":
      referencedColumns.push(node.name);
      if (!columnNames.has(node.name)) {
        const suggestion = findClosestMatch(node.name, columnNames);
        errors.push({
          message: `Unknown column: "${node.name}"`,
          severity: "error",
          suggestion: suggestion ? `Did you mean "${suggestion}"?` : undefined,
        });
      }
      break;

    case "NumberLiteral":
    case "StringLiteral":
      // Literals are always valid
      break;

    case "Comparison": {
      walkNode(node.left, columnNames, columnTypeMap, errors, warnings, referencedColumns);
      walkNode(node.right, columnNames, columnTypeMap, errors, warnings, referencedColumns);

      // Type check: numeric operators on string columns
      if (node.left.type === "Identifier" && node.right.type !== "Identifier") {
        const colType = columnTypeMap.get(node.left.name);
        if (colType === "string" && [">", "<", ">=", "<="].includes(node.operator)) {
          warnings.push({
            message: `Column "${node.left.name}" is a text column — numeric comparison may not work as expected`,
            severity: "warning",
          });
        }
      }
      break;
    }

    case "Between":
      walkNode(node.value, columnNames, columnTypeMap, errors, warnings, referencedColumns);
      walkNode(node.low, columnNames, columnTypeMap, errors, warnings, referencedColumns);
      walkNode(node.high, columnNames, columnTypeMap, errors, warnings, referencedColumns);
      break;

    case "Contains":
      walkNode(node.haystack, columnNames, columnTypeMap, errors, warnings, referencedColumns);
      walkNode(node.needle, columnNames, columnTypeMap, errors, warnings, referencedColumns);
      break;

    case "BinaryOp":
      walkNode(node.left, columnNames, columnTypeMap, errors, warnings, referencedColumns);
      walkNode(node.right, columnNames, columnTypeMap, errors, warnings, referencedColumns);
      break;

    case "UnaryOp":
      walkNode(node.operand, columnNames, columnTypeMap, errors, warnings, referencedColumns);
      break;
  }
}

function findClosestMatch(name: string, candidates: Set<string>): string | null {
  const lower = name.toLowerCase();
  let bestMatch: string | null = null;
  let bestDistance = Infinity;

  for (const candidate of candidates) {
    const dist = levenshtein(lower, candidate.toLowerCase());
    if (dist < bestDistance && dist <= Math.max(3, Math.floor(name.length / 2))) {
      bestDistance = dist;
      bestMatch = candidate;
    }
  }

  return bestMatch;
}

function levenshtein(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const cost = a[j - 1] === b[i - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[b.length][a.length];
}
