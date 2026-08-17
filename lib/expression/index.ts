import { Lexer } from "./lexer";
import { Parser } from "./parser";
import { ASTNode } from "./ast";

export function parseExpression(input: string): ASTNode {
  const lexer = new Lexer(input);
  const tokens = lexer.tokenize();
  const parser = new Parser(tokens);
  return parser.parse();
}

export * from "./types";
export * from "./ast";
export * from "./errors";
export * from "./tokens";
export { Lexer } from "./lexer";
export { Parser } from "./parser";

// Evaluator exports
export * from "./evaluator/types";
export { evaluateAST as evaluate } from "./evaluator/core";
export { executeExpression } from "./execute";
export { compileExpression, executeCompiledExpression, type CompiledExpression } from "./compile";
