import { EvaluationError } from "../errors";
import { IdentifierNode } from "../ast";
import { EvaluationContext } from "./types";

/**
 * Resolves an identifier node to a concrete numeric value from the row context.
 * 
 * FUTURE OPTIMIZATION (Phase 3/4):
 * This resolver can be extended to use a mapped index or flat array lookup 
 * instead of object property string lookup for tight-loop performance optimization
 * over millions of rows.
 * 
 * @param node The AST identifier node to resolve.
 * @param context The evaluation context holding the row data.
 * @returns The resolved numeric value.
 * @throws EvaluationError if the field is missing, null, undefined, or NaN.
 */
export function resolveIdentifier(node: IdentifierNode, context: EvaluationContext): number {
  const value = context.row[node.name];

  if (value === null || value === undefined) {
    throw new EvaluationError(`Unknown or missing field '${node.name}'`, node.start);
  }

  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new EvaluationError(`Field '${node.name}' must be a valid number, got ${typeof value}`, node.start);
  }

  return value;
}
