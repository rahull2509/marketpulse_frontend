import { parseExpression } from "./index";
import { RowContext } from "./evaluator/types";
import { evaluateAST } from "./evaluator/core";
import { EvaluationError } from "./errors";

/**
 * Executes a raw expression string against a given market row, 
 * strictly enforcing that the final result is a boolean.
 * 
 * This pipeline is pure, stateless, and thread-safe.
 * Exceptions (SyntaxError, EvaluationError) are intentionally propagated.
 * 
 * @param expression The raw expression string (e.g. "High > 100")
 * @param row The market data row context
 * @returns boolean outcome of the expression
 * @throws SyntaxError if the expression cannot be parsed
 * @throws EvaluationError if evaluation fails or resolves to a non-boolean
 */
export function executeExpression(expression: string, row: RowContext): boolean {
  // 1. Parse Expression into an AST
  const ast = parseExpression(expression);

  // 2. Evaluate AST against the RowContext
  const result = evaluateAST(ast, { row });

  // 3. Strictly Validate Result Type
  if (typeof result !== "boolean") {
    // If the expression resolves to a number (e.g. "100+20"), we throw.
    // The Scanner strictly requires logical resolution (true/false).
    throw new EvaluationError(
      `Expression must resolve to a boolean, but resolved to a ${typeof result}`, 
      ast.start
    );
  }

  return result;
}
