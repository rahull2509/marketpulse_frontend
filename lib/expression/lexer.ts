import { Token } from "./tokens";
import { TokenType, Operator, Position } from "./types";
import { SyntaxError } from "./errors";

export class Lexer {
  private input: string;
  private current: number = 0;
  private line: number = 1;
  private column: number = 1;

  constructor(input: string) {
    this.input = input;
  }

  public tokenize(): Token[] {
    const tokens: Token[] = [];
    while (!this.isAtEnd()) {
      const char = this.peek();
      
      if (this.isWhitespace(char)) {
        this.advance();
        continue;
      }

      if (this.isDigit(char) || (char === '.' && this.isDigit(this.peekNext()))) {
        tokens.push(this.number());
        continue;
      }

      if (this.isAlpha(char) || char === '_') {
        tokens.push(this.identifierOrKeyword());
        continue;
      }

      const startPos = this.getPosition();

      switch (char) {
        case '(':
          this.advance();
          tokens.push({ type: TokenType.LParen, value: "(", start: startPos, end: this.getPosition() });
          break;
        case ')':
          this.advance();
          tokens.push({ type: TokenType.RParen, value: ")", start: startPos, end: this.getPosition() });
          break;
        case ',':
          this.advance();
          tokens.push({ type: TokenType.Comma, value: ",", start: startPos, end: this.getPosition() });
          break;
        case '+':
          this.advance();
          tokens.push({ type: TokenType.Operator, operator: Operator.Plus, value: "+", start: startPos, end: this.getPosition() });
          break;
        case '-':
          this.advance();
          tokens.push({ type: TokenType.Operator, operator: Operator.Minus, value: "-", start: startPos, end: this.getPosition() });
          break;
        case '*':
          this.advance();
          tokens.push({ type: TokenType.Operator, operator: Operator.Multiply, value: "*", start: startPos, end: this.getPosition() });
          break;
        case '/':
          this.advance();
          tokens.push({ type: TokenType.Operator, operator: Operator.Divide, value: "/", start: startPos, end: this.getPosition() });
          break;
        case '%':
          this.advance();
          tokens.push({ type: TokenType.Operator, operator: Operator.Modulo, value: "%", start: startPos, end: this.getPosition() });
          break;
        case '=':
          this.advance();
          if (this.match('=')) {
            tokens.push({ type: TokenType.Operator, operator: Operator.Equal, value: "==", start: startPos, end: this.getPosition() });
          } else {
            throw new SyntaxError(`Unexpected character '='`, this.getPosition());
          }
          break;
        case '!':
          this.advance();
          if (this.match('=')) {
            tokens.push({ type: TokenType.Operator, operator: Operator.NotEqual, value: "!=", start: startPos, end: this.getPosition() });
          } else {
            throw new SyntaxError(`Unexpected character '!'`, this.getPosition());
          }
          break;
        case '>':
          this.advance();
          if (this.match('=')) {
            tokens.push({ type: TokenType.Operator, operator: Operator.GreaterThanOrEqual, value: ">=", start: startPos, end: this.getPosition() });
          } else {
            tokens.push({ type: TokenType.Operator, operator: Operator.GreaterThan, value: ">", start: startPos, end: this.getPosition() });
          }
          break;
        case '<':
          this.advance();
          if (this.match('=')) {
            tokens.push({ type: TokenType.Operator, operator: Operator.LessThanOrEqual, value: "<=", start: startPos, end: this.getPosition() });
          } else {
            tokens.push({ type: TokenType.Operator, operator: Operator.LessThan, value: "<", start: startPos, end: this.getPosition() });
          }
          break;
        default:
          this.advance();
          throw new SyntaxError(`Unknown character '${char}'`, this.getPosition());
      }
    }

    tokens.push({ type: TokenType.EOF, value: "", start: this.getPosition(), end: this.getPosition() });
    return tokens;
  }

  private advance(): string {
    const char = this.input[this.current];
    this.current++;
    if (char === '\n') {
      this.line++;
      this.column = 1;
    } else {
      this.column++;
    }
    return char;
  }

  private peek(): string {
    return this.current < this.input.length ? this.input[this.current] : '\0';
  }

  private peekNext(): string {
    return this.current + 1 < this.input.length ? this.input[this.current + 1] : '\0';
  }

  private isAtEnd(): boolean {
    return this.current >= this.input.length;
  }

  private match(expected: string): boolean {
    if (this.isAtEnd()) return false;
    if (this.input[this.current] !== expected) return false;
    this.advance();
    return true;
  }

  private getPosition(): Position {
    return {
      index: this.current,
      line: this.line,
      column: this.column,
    };
  }

  private isWhitespace(c: string): boolean {
    return c === ' ' || c === '\t' || c === '\n' || c === '\r';
  }

  private isDigit(c: string): boolean {
    return c >= '0' && c <= '9';
  }

  private isAlpha(c: string): boolean {
    return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z');
  }

  private isAlphaNumeric(c: string): boolean {
    return this.isAlpha(c) || this.isDigit(c);
  }

  private number(): Token {
    const startPos = this.getPosition();
    let valueStr = "";

    while (this.isDigit(this.peek())) {
      valueStr += this.advance();
    }

    if (this.peek() === '.' && this.isDigit(this.peekNext())) {
      valueStr += this.advance(); // Consume the '.'
      while (this.isDigit(this.peek())) {
        valueStr += this.advance();
      }
    }

    return {
      type: TokenType.Number,
      value: valueStr,
      start: startPos,
      end: this.getPosition(),
    };
  }

  private identifierOrKeyword(): Token {
    const startPos = this.getPosition();
    let valueStr = "";

    while (this.isAlphaNumeric(this.peek()) || this.peek() === '_') {
      valueStr += this.advance();
    }

    const upperVal = valueStr.toUpperCase();
    if (upperVal === "AND") {
      return { type: TokenType.Operator, operator: Operator.And, value: valueStr, start: startPos, end: this.getPosition() };
    } else if (upperVal === "OR") {
      return { type: TokenType.Operator, operator: Operator.Or, value: valueStr, start: startPos, end: this.getPosition() };
    } else if (upperVal === "NOT") {
      return { type: TokenType.Operator, operator: Operator.Not, value: valueStr, start: startPos, end: this.getPosition() };
    }

    return {
      type: TokenType.Identifier,
      value: valueStr,
      start: startPos,
      end: this.getPosition(),
    };
  }
}
