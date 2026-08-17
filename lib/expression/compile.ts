import { parseExpression } from "./index";
import { ASTNode } from "./ast";
import { evaluateAST } from "./evaluator/core";
import { RowContext } from "./evaluator/types";
import { EvaluationError } from "./errors";

/**
 * An immutable compiled expression object that caches the AST.
 */
export interface CompiledExpression {
  readonly ast: ASTNode;
}

/**
 * Parses an expression string and freezes the resulting CompiledExpression.
 * Should be called once per query execution to prevent redundant parsing overhead.
 * 
 * @throws SyntaxError if the expression is invalid.
 */
export function compileExpression(expression: string): CompiledExpression {
  const ast = parseExpression(expression);
  return Object.freeze({ ast });
}

/**
 * Executes a CompiledExpression against a market data row.
 * Acts as a thin boolean-validation wrapper over evaluate().
 * 
 * @throws EvaluationError if the expression evaluates to a non-boolean value.
 */
export function executeCompiledExpression(compiled: CompiledExpression, row: RowContext): boolean {
  const result = evaluateAST(compiled.ast, { row });
  
  if (typeof result !== "boolean") {
    throw new EvaluationError(
      `Expression must resolve to a boolean, but resolved to a ${typeof result}`,
      compiled.ast.start
    );
  }
  
  return result;
}
