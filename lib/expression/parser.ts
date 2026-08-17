import { Token } from "./tokens";
import { TokenType, Operator, Position } from "./types";
import {
  ASTNode,
  ASTNodeType,
  IdentifierNode,
  LiteralNode,
} from "./ast";
import { SyntaxError } from "./errors";

export class Parser {
  private tokens: Token[];
  private current: number = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  public parse(): ASTNode {
    if (this.isAtEnd()) {
      throw new SyntaxError("Unexpected end of input", this.getPosition());
    }
    const expr = this.expression();
    if (!this.isAtEnd()) {
      throw new SyntaxError(`Unexpected token '${this.peek().value}'`, this.peek().start);
    }
    return expr;
  }

  private expression(): ASTNode {
    return this.logicalOr();
  }

  private logicalOr(): ASTNode {
    let expr = this.logicalAnd();

    while (this.matchOperator(Operator.Or)) {
      const operator = this.previous().operator!;
      const right = this.logicalAnd();
      expr = {
        type: ASTNodeType.LogicalExpression,
        operator,
        left: expr,
        right,
        start: expr.start,
        end: right.end,
      };
    }

    return expr;
  }

  private logicalAnd(): ASTNode {
    let expr = this.equality();

    while (this.matchOperator(Operator.And)) {
      const operator = this.previous().operator!;
      const right = this.equality();
      expr = {
        type: ASTNodeType.LogicalExpression,
        operator,
        left: expr,
        right,
        start: expr.start,
        end: right.end,
      };
    }

    return expr;
  }

  private equality(): ASTNode {
    let expr = this.comparison();

    while (this.matchOperator(Operator.Equal, Operator.NotEqual)) {
      const operator = this.previous().operator!;
      const right = this.comparison();
      expr = {
        type: ASTNodeType.ComparisonExpression,
        operator,
        left: expr,
        right,
        start: expr.start,
        end: right.end,
      };
    }

    return expr;
  }

  private comparison(): ASTNode {
    let expr = this.term();

    while (this.matchOperator(Operator.GreaterThan, Operator.GreaterThanOrEqual, Operator.LessThan, Operator.LessThanOrEqual)) {
      const operator = this.previous().operator!;
      const right = this.term();
      expr = {
        type: ASTNodeType.ComparisonExpression,
        operator,
        left: expr,
        right,
        start: expr.start,
        end: right.end,
      };
    }

    return expr;
  }

  private term(): ASTNode {
    let expr = this.factor();

    while (this.matchOperator(Operator.Plus, Operator.Minus)) {
      const operator = this.previous().operator!;
      const right = this.factor();
      expr = {
        type: ASTNodeType.BinaryExpression,
        operator,
        left: expr,
        right,
        start: expr.start,
        end: right.end,
      };
    }

    return expr;
  }

  private factor(): ASTNode {
    let expr = this.unary();

    while (this.matchOperator(Operator.Multiply, Operator.Divide, Operator.Modulo)) {
      const operator = this.previous().operator!;
      const right = this.unary();
      expr = {
        type: ASTNodeType.BinaryExpression,
        operator,
        left: expr,
        right,
        start: expr.start,
        end: right.end,
      };
    }

    return expr;
  }

  private unary(): ASTNode {
    if (this.matchOperator(Operator.Plus, Operator.Minus, Operator.Not)) {
      const operator = this.previous().operator!;
      const start = this.previous().start;
      const argument = this.unary();
      return {
        type: ASTNodeType.UnaryExpression,
        operator,
        argument,
        start,
        end: argument.end,
      };
    }

    return this.primary();
  }

  private primary(): ASTNode {
    if (this.isAtEnd()) {
      throw new SyntaxError("Unexpected end of input", this.getPosition());
    }

    if (this.match(TokenType.Number)) {
      const token = this.previous();
      return {
        type: ASTNodeType.Literal,
        value: parseFloat(token.value),
        start: token.start,
        end: token.end,
      };
    }

    if (this.match(TokenType.Identifier)) {
      const token = this.previous();
      const identifierNode: IdentifierNode = {
        type: ASTNodeType.Identifier,
        name: token.value,
        start: token.start,
        end: token.end,
      };

      // Check for function call
      if (this.match(TokenType.LParen)) {
        const args: ASTNode[] = [];
        if (!this.check(TokenType.RParen)) {
          do {
            args.push(this.expression());
          } while (this.match(TokenType.Comma));
        }
        
        const rparen = this.consume(TokenType.RParen, "Expected ')' after arguments");
        return {
          type: ASTNodeType.CallExpression,
          callee: identifierNode,
          arguments: args,
          start: identifierNode.start,
          end: rparen.end,
        };
      }

      return identifierNode;
    }

    if (this.match(TokenType.LParen)) {
      const expr = this.expression();
      this.consume(TokenType.RParen, "Expected ')' after expression");
      return expr;
    }

    throw new SyntaxError(`Unexpected token '${this.peek().value}'`, this.peek().start);
  }

  // --- Helpers ---

  private matchOperator(...ops: Operator[]): boolean {
    if (this.check(TokenType.Operator)) {
      const token = this.peek();
      if (token.operator && ops.includes(token.operator)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF;
  }

  private peek(): Token {
    return this.tokens[this.current];
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }

  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) return this.advance();
    throw new SyntaxError(message, this.peek().start);
  }

  private getPosition(): Position {
    if (this.current < this.tokens.length) {
      return this.tokens[this.current].start;
    }
    return this.tokens[this.tokens.length - 1].end;
  }
}
