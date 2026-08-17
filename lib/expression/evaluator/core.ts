import { EvaluationError } from "../errors";
import { ASTNode, ASTNodeType, BinaryExpressionNode, ComparisonExpressionNode, LogicalExpressionNode, UnaryExpressionNode, CallExpressionNode } from "../ast";
import { Operator } from "../types";
import { EvaluationContext, EvaluatorValue } from "./types";
import { BUILTIN_FUNCTIONS } from "./functions";
import { resolveIdentifier } from "./resolver";

/**
 * Pure, stateless evaluator for the Expression AST.
 * 
 * @param ast The root AST node to evaluate.
 * @param context The evaluation context wrapping the row data.
 * @returns The strict EvaluatorValue (boolean or number).
 */
export function evaluateAST(ast: ASTNode, context: EvaluationContext): EvaluatorValue {
  switch (ast.type) {
    case ASTNodeType.Literal:
      return ast.value;
      
    case ASTNodeType.Identifier:
      return resolveIdentifier(ast, context);

    case ASTNodeType.UnaryExpression:
      return evaluateUnary(ast, context);

    case ASTNodeType.BinaryExpression:
      return evaluateBinary(ast, context);

    case ASTNodeType.ComparisonExpression:
      return evaluateComparison(ast, context);

    case ASTNodeType.LogicalExpression:
      return evaluateLogical(ast, context);

    case ASTNodeType.CallExpression:
      return evaluateCall(ast, context);

    default:
      // @ts-ignore
      throw new EvaluationError(`Unknown AST node type: ${ast.type}`, ast.start);
  }
}

function evaluateUnary(node: UnaryExpressionNode, context: EvaluationContext): EvaluatorValue {
  const arg = evaluateAST(node.argument, context);

  switch (node.operator) {
    case Operator.Plus:
    case Operator.Minus:
      if (typeof arg !== "number") {
        throw new EvaluationError(`Unary operator '${node.operator}' expects a numeric operand`, node.start);
      }
      return node.operator === Operator.Minus ? -arg : arg;

    case Operator.Not:
      if (typeof arg !== "boolean") {
        throw new EvaluationError(`Unary operator 'NOT' expects a boolean operand`, node.start);
      }
      return !arg;

    default:
      throw new EvaluationError(`Unsupported unary operator '${node.operator}'`, node.start);
  }
}

function evaluateBinary(node: BinaryExpressionNode, context: EvaluationContext): number {
  const left = evaluateAST(node.left, context);
  const right = evaluateAST(node.right, context);

  if (typeof left !== "number" || typeof right !== "number") {
    throw new EvaluationError(`Binary operator '${node.operator}' requires numeric operands`, node.start);
  }

  switch (node.operator) {
    case Operator.Plus: return left + right;
    case Operator.Minus: return left - right;
    case Operator.Multiply: return left * right;
    case Operator.Divide:
      if (right === 0) throw new EvaluationError(`Division by zero`, node.right.start);
      return left / right;
    case Operator.Modulo:
      if (right === 0) throw new EvaluationError(`Modulo by zero`, node.right.start);
      return left % right;
    default:
      throw new EvaluationError(`Unsupported binary operator '${node.operator}'`, node.start);
  }
}

function evaluateComparison(node: ComparisonExpressionNode, context: EvaluationContext): boolean {
  const left = evaluateAST(node.left, context);
  const right = evaluateAST(node.right, context);

  if (typeof left !== "number" || typeof right !== "number") {
    throw new EvaluationError(`Comparison operator '${node.operator}' requires numeric operands`, node.start);
  }

  switch (node.operator) {
    case Operator.GreaterThan: return left > right;
    case Operator.GreaterThanOrEqual: return left >= right;
    case Operator.LessThan: return left < right;
    case Operator.LessThanOrEqual: return left <= right;
    case Operator.Equal: return left === right;
    case Operator.NotEqual: return left !== right;
    default:
      throw new EvaluationError(`Unsupported comparison operator '${node.operator}'`, node.start);
  }
}

function evaluateLogical(node: LogicalExpressionNode, context: EvaluationContext): boolean {
  const left = evaluateAST(node.left, context);

  if (typeof left !== "boolean") {
    throw new EvaluationError(`Logical operator '${node.operator}' requires boolean operands`, node.left.start);
  }

  // Short-circuit evaluation
  if (node.operator === Operator.And && !left) return false;
  if (node.operator === Operator.Or && left) return true;

  const right = evaluateAST(node.right, context);

  if (typeof right !== "boolean") {
    throw new EvaluationError(`Logical operator '${node.operator}' requires boolean operands`, node.right.start);
  }

  switch (node.operator) {
    case Operator.And: return left && right;
    case Operator.Or: return left || right;
    default:
      throw new EvaluationError(`Unsupported logical operator '${node.operator}'`, node.start);
  }
}

function evaluateCall(node: CallExpressionNode, context: EvaluationContext): EvaluatorValue {
  const funcName = node.callee.name.toUpperCase();
  const funcDef = BUILTIN_FUNCTIONS[funcName];

  if (!funcDef) {
    throw new EvaluationError(`Unknown function '${funcName}()'`, node.callee.start);
  }

  if (funcDef.argsCount !== undefined && node.arguments.length !== funcDef.argsCount) {
    throw new EvaluationError(`Function '${funcName}()' expects exactly ${funcDef.argsCount} arguments, got ${node.arguments.length}`, node.start);
  }

  if (funcDef.minArgs !== undefined && node.arguments.length < funcDef.minArgs) {
    throw new EvaluationError(`Function '${funcName}()' expects at least ${funcDef.minArgs} arguments, got ${node.arguments.length}`, node.start);
  }

  const evaluatedArgs = node.arguments.map(arg => evaluateAST(arg, context));
  
  return funcDef.impl(evaluatedArgs, node.start);
}
