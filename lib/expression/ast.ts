import { Operator, Position } from "./types";

export enum ASTNodeType {
  Literal = "Literal",
  Identifier = "Identifier",
  UnaryExpression = "UnaryExpression",
  BinaryExpression = "BinaryExpression",
  LogicalExpression = "LogicalExpression",
  ComparisonExpression = "ComparisonExpression",
  CallExpression = "CallExpression", // Included for future extensibility
}

export interface ASTNodeBase {
  type: ASTNodeType;
  start: Position;
  end: Position;
}

export interface LiteralNode extends ASTNodeBase {
  type: ASTNodeType.Literal;
  value: number;
}

export interface IdentifierNode extends ASTNodeBase {
  type: ASTNodeType.Identifier;
  name: string;
}

export interface UnaryExpressionNode extends ASTNodeBase {
  type: ASTNodeType.UnaryExpression;
  operator: Operator;
  argument: ASTNode;
}

export interface BinaryExpressionNode extends ASTNodeBase {
  type: ASTNodeType.BinaryExpression;
  left: ASTNode;
  operator: Operator;
  right: ASTNode;
}

export interface LogicalExpressionNode extends ASTNodeBase {
  type: ASTNodeType.LogicalExpression;
  left: ASTNode;
  operator: Operator;
  right: ASTNode;
}

export interface ComparisonExpressionNode extends ASTNodeBase {
  type: ASTNodeType.ComparisonExpression;
  left: ASTNode;
  operator: Operator;
  right: ASTNode;
}

// Future extensibility for functions like ABS, EMA, RSI
export interface CallExpressionNode extends ASTNodeBase {
  type: ASTNodeType.CallExpression;
  callee: IdentifierNode;
  arguments: ASTNode[];
}

export type ASTNode =
  | LiteralNode
  | IdentifierNode
  | UnaryExpressionNode
  | BinaryExpressionNode
  | LogicalExpressionNode
  | ComparisonExpressionNode
  | CallExpressionNode;
