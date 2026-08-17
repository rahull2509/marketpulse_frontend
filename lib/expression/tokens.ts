import { TokenType, Operator, Position } from "./types";

export interface Token {
  type: TokenType;
  value: string;
  operator?: Operator;
  start: Position;
  end: Position;
}
