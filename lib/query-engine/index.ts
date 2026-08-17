/**
 * Query Engine — Client-side scanner query processing.
 *
 * Pipeline: User Input → Tokenizer → Parser → AST → Evaluator → Results
 *
 * No eval(), no arbitrary code execution.
 * All evaluation happens against StockRecord objects from Zustand.
 */

export { tokenize, TokenType } from "./tokenizer";
export type { Token, TokenizeResult, TokenizeError } from "./tokenizer";

export { parse, astToConditions } from "./parser";
export type { ASTNode, ParseResult, ParseError } from "./parser";

// Evaluator removed - backend handles execution
export { validate, validateParentheses, getAutocompleteSuggestions } from "./validator";
export type { ValidationError, ValidationResult } from "./validator";
