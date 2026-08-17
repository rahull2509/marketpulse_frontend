export enum TokenType {
  Number = "Number",
  Identifier = "Identifier",
  Operator = "Operator",
  LParen = "LParen",
  RParen = "RParen",
  Comma = "Comma", // For future function calls
  EOF = "EOF",
}

export enum Operator {
  Plus = "+",
  Minus = "-",
  Multiply = "*",
  Divide = "/",
  Modulo = "%",
  GreaterThan = ">",
  LessThan = "<",
  GreaterThanOrEqual = ">=",
  LessThanOrEqual = "<=",
  Equal = "==",
  NotEqual = "!=",
  And = "AND",
  Or = "OR",
  Not = "NOT",
}

export interface Position {
  index: number;
  line: number;
  column: number;
}
