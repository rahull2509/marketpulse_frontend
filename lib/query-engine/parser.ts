/**
 * Query Engine Parser — Recursive descent parser producing an AST.
 *
 * Grammar:
 *   Expression  := OrExpr
 *   OrExpr      := AndExpr ("OR" AndExpr)*
 *   AndExpr     := NotExpr ("AND" NotExpr)*
 *   NotExpr     := "NOT" NotExpr | Comparison
 *   Comparison  := ArithExpr (CompOp ArithExpr)?
 *                | ArithExpr "BETWEEN" ArithExpr "AND" ArithExpr
 *                | ArithExpr "CONTAINS" StringLiteral
 *   ArithExpr   := Term (("+"|"-") Term)*
 *   Term        := Factor (("*"|"/") Factor)*
 *   Factor      := "(" Expression ")" | NUMBER | STRING | IDENTIFIER
 */

import { TokenType, type Token, type TokenizeResult } from "./tokenizer";
import type { ScannerCondition } from "@/types/scanner";

/* ── AST Node Types ────────────────────────────────────────────────────────── */

export type ASTNode =
  | BinaryOpNode
  | UnaryOpNode
  | ComparisonNode
  | BetweenNode
  | ContainsNode
  | NumberLiteralNode
  | StringLiteralNode
  | IdentifierNode
  | FunctionCallNode;

export interface BinaryOpNode {
  type: "BinaryOp";
  operator: string; // AND, OR, +, -, *, /
  left: ASTNode;
  right: ASTNode;
}

export interface UnaryOpNode {
  type: "UnaryOp";
  operator: "NOT";
  operand: ASTNode;
}

export interface ComparisonNode {
  type: "Comparison";
  operator: string; // >, <, >=, <=, ==, !=
  left: ASTNode;
  right: ASTNode;
}

export interface BetweenNode {
  type: "Between";
  value: ASTNode;
  low: ASTNode;
  high: ASTNode;
}

export interface ContainsNode {
  type: "Contains";
  haystack: ASTNode;
  needle: ASTNode;
}

export interface NumberLiteralNode {
  type: "NumberLiteral";
  value: number;
}

export interface StringLiteralNode {
  type: "StringLiteral";
  value: string;
}

export interface IdentifierNode {
  type: "Identifier";
  name: string;
}

export interface FunctionCallNode {
  type: "FunctionCall";
  name: string;
  args: ASTNode[];
}

/* ── Parse Result ──────────────────────────────────────────────────────────── */

export interface ParseResult {
  ast: ASTNode | null;
  errors: ParseError[];
}

export interface ParseError {
  message: string;
  position: number;
  length: number;
}

/* ── Parser ────────────────────────────────────────────────────────────────── */

export function parse(tokenResult: TokenizeResult): ParseResult {
  const { tokens, errors: tokenErrors } = tokenResult;

  if (tokenErrors.length > 0) {
    return {
      ast: null,
      errors: tokenErrors.map((e) => ({
        message: e.message,
        position: e.position,
        length: e.length,
      })),
    };
  }

  // Skip if only EOF
  if (tokens.length <= 1 && tokens[0]?.type === TokenType.EOF) {
    return { ast: null, errors: [] };
  }

  const parser = new Parser(tokens);

  try {
    const ast = parser.parseExpression();

    if (!parser.isAtEnd()) {
      const current = parser.peek();
      parser.errors.push({
        message: `Unexpected token: "${current.value}"`,
        position: current.position,
        length: current.length,
      });
    }

    return {
      ast: parser.errors.length > 0 ? null : ast,
      errors: parser.errors,
    };
  } catch (e) {
    if (e instanceof ParserError) {
      return {
        ast: null,
        errors: [...parser.errors, { message: e.message, position: e.position, length: e.length }],
      };
    }
    return {
      ast: null,
      errors: [
        ...parser.errors,
        { message: `Parse error: ${(e as Error).message}`, position: 0, length: 0 },
      ],
    };
  }
}

/* ── Internal Parser Class ─────────────────────────────────────────────────── */

class ParserError extends Error {
  position: number;
  length: number;

  constructor(message: string, position: number, length: number) {
    super(message);
    this.position = position;
    this.length = length;
  }
}

class Parser {
  private tokens: Token[];
  private pos: number = 0;
  errors: ParseError[] = [];

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  peek(): Token {
    return this.tokens[this.pos] || { type: TokenType.EOF, value: "", position: 0, length: 0 };
  }

  advance(): Token {
    const token = this.peek();
    if (token.type !== TokenType.EOF) {
      this.pos++;
    }
    return token;
  }

  isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF;
  }

  expect(type: TokenType, value?: string): Token {
    const token = this.peek();
    if (token.type !== type || (value !== undefined && token.value !== value)) {
      throw new ParserError(
        `Expected ${value || type} but got "${token.value || "end of input"}"`,
        token.position,
        token.length || 1
      );
    }
    return this.advance();
  }

  /* ── Grammar Rules ───────────────────────────────────────────────────────── */

  parseExpression(): ASTNode {
    return this.parseOrExpr();
  }

  private parseOrExpr(): ASTNode {
    let left = this.parseAndExpr();

    while (this.peek().type === TokenType.LOGICAL && this.peek().value === "OR") {
      this.advance();
      const right = this.parseAndExpr();
      left = { type: "BinaryOp", operator: "OR", left, right };
    }

    return left;
  }

  private parseAndExpr(): ASTNode {
    let left = this.parseNotExpr();

    while (this.peek().type === TokenType.LOGICAL && this.peek().value === "AND") {
      // Lookahead: if the next AND is part of a BETWEEN...AND, don't consume it
      const savedPos = this.pos;
      this.advance();

      // Check if we're inside a BETWEEN context by looking back
      // This is handled naturally because BETWEEN consumes its own AND
      const right = this.parseNotExpr();
      left = { type: "BinaryOp", operator: "AND", left, right };
    }

    return left;
  }

  private parseNotExpr(): ASTNode {
    if (this.peek().type === TokenType.LOGICAL && this.peek().value === "NOT") {
      this.advance();
      const operand = this.parseNotExpr();
      return { type: "UnaryOp", operator: "NOT", operand };
    }
    return this.parseComparison();
  }

  private parseComparison(): ASTNode {
    const left = this.parseArithExpr();

    // Check for BETWEEN
    if (this.peek().type === TokenType.BETWEEN) {
      this.advance();
      const low = this.parseArithExpr();
      this.expect(TokenType.LOGICAL, "AND");
      const high = this.parseArithExpr();
      return { type: "Between", value: left, low, high };
    }

    // Check for CONTAINS
    if (this.peek().type === TokenType.CONTAINS) {
      this.advance();
      const needle = this.parseFactor();
      return { type: "Contains", haystack: left, needle };
    }

    // Check for comparison operator
    if (this.peek().type === TokenType.OPERATOR) {
      const op = this.advance();
      const right = this.parseArithExpr();
      return { type: "Comparison", operator: op.value, left, right };
    }

    return left;
  }

  private parseArithExpr(): ASTNode {
    let left = this.parseTerm();

    while (
      this.peek().type === TokenType.ARITHMETIC &&
      (this.peek().value === "+" || this.peek().value === "-")
    ) {
      const op = this.advance();
      const right = this.parseTerm();
      left = { type: "BinaryOp", operator: op.value, left, right };
    }

    return left;
  }

  private parseTerm(): ASTNode {
    let left = this.parseFactor();

    while (
      this.peek().type === TokenType.ARITHMETIC &&
      (this.peek().value === "*" || this.peek().value === "/")
    ) {
      const op = this.advance();
      const right = this.parseFactor();
      left = { type: "BinaryOp", operator: op.value, left, right };
    }

    return left;
  }

  parseFactor(): ASTNode {
    const token = this.peek();

    // Parenthesized expression
    if (token.type === TokenType.LPAREN) {
      this.advance();
      const expr = this.parseExpression();
      this.expect(TokenType.RPAREN);
      return expr;
    }

    // Number literal
    if (token.type === TokenType.NUMBER) {
      this.advance();
      return { type: "NumberLiteral", value: parseFloat(token.value) };
    }

    // String literal
    if (token.type === TokenType.STRING) {
      this.advance();
      return { type: "StringLiteral", value: token.value };
    }

    // Identifier (column name) or Function Call
    if (token.type === TokenType.IDENTIFIER) {
      this.advance();
      
      if (this.peek().type === TokenType.LPAREN) {
        this.advance();
        const args: ASTNode[] = [];
        if (this.peek().type !== TokenType.RPAREN) {
          do {
            args.push(this.parseExpression());
            if (this.peek().type === TokenType.COMMA) {
              this.advance();
            } else {
              break;
            }
          } while (true);
        }
        this.expect(TokenType.RPAREN);
        return { type: "FunctionCall", name: token.value, args };
      }
      
      return { type: "Identifier", name: token.value };
    }

    throw new ParserError(
      `Unexpected token: "${token.value || "end of input"}"`,
      token.position,
      token.length || 1
    );
  }
}

export function astToConditions(node: ASTNode | null, currentLogical: "AND" | "OR" = "AND"): ScannerCondition[] {
  if (!node) return [];

  const conditions: ScannerCondition[] = [];

  switch (node.type) {
    case "Comparison": {
      if (node.left.type === "Identifier") {
        let value: any = null;
        if (node.right.type === "NumberLiteral" || node.right.type === "StringLiteral") {
          value = node.right.value;
        }
        conditions.push({
          column: node.left.name,
          operator: node.operator,
          value: value,
          logical: currentLogical,
        });
      }
      break;
    }
    case "Between": {
      if (node.value.type === "Identifier" && node.low.type === "NumberLiteral" && node.high.type === "NumberLiteral") {
        conditions.push({
          column: node.value.name,
          operator: "between",
          value: [node.low.value, node.high.value],
          logical: currentLogical,
        });
      }
      break;
    }
    case "Contains": {
      if (node.haystack.type === "Identifier" && node.needle.type === "StringLiteral") {
        conditions.push({
          column: node.haystack.name,
          operator: "contains",
          value: node.needle.value,
          logical: currentLogical,
        });
      }
      break;
    }
    case "BinaryOp": {
      if (node.operator === "AND" || node.operator === "OR") {
        const left = astToConditions(node.left, currentLogical);
        const right = astToConditions(node.right, node.operator as "AND" | "OR");
        conditions.push(...left, ...right);
      }
      break;
    }
    case "UnaryOp": {
      // Unary NOT is harder to flatten into ScannerCondition unless we invert the operator
      // Since ScannerCondition array assumes simple AND/OR flattening, we will skip it for now.
      break;
    }
  }

  return conditions;
}
