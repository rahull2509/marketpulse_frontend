import { EvaluationError } from "../errors";
import { Position } from "../types";
import { EvaluatorValue } from "./types";

/**
 * Metadata for a built-in evaluator function.
 * Enables strict argument validation and future extensibility for Phase 4.
 */
export interface FunctionDefinition {
  /** The expected number of arguments, or undefined if variable. */
  argsCount?: number;
  /** Whether the function expects at least one argument. */
  minArgs?: number;
  /** The return type of the function (for potential static analysis). */
  returnType: "number" | "boolean";
  /** The actual implementation */
  impl: (args: EvaluatorValue[], position: Position) => EvaluatorValue;
}

const ensureNumericArgs = (args: EvaluatorValue[], funcName: string, position: Position): number[] => {
  return args.map((arg, idx) => {
    if (typeof arg !== "number") {
      throw new EvaluationError(`Argument ${idx + 1} to ${funcName}() must be numeric`, position);
    }
    return arg;
  });
};

/**
 * The frozen registry of Phase 2 mathematical functions.
 */
export const BUILTIN_FUNCTIONS: Readonly<Record<string, FunctionDefinition>> = Object.freeze({
  ABS: {
    argsCount: 1,
    returnType: "number",
    impl: (args, pos) => {
      const [val] = ensureNumericArgs(args, "ABS", pos);
      return Math.abs(val);
    }
  },
  MIN: {
    minArgs: 1,
    returnType: "number",
    impl: (args, pos) => {
      const numArgs = ensureNumericArgs(args, "MIN", pos);
      return Math.min(...numArgs);
    }
  },
  MAX: {
    minArgs: 1,
    returnType: "number",
    impl: (args, pos) => {
      const numArgs = ensureNumericArgs(args, "MAX", pos);
      return Math.max(...numArgs);
    }
  },
  ROUND: {
    argsCount: 1,
    returnType: "number",
    impl: (args, pos) => {
      const [val] = ensureNumericArgs(args, "ROUND", pos);
      return Math.round(val);
    }
  },
  FLOOR: {
    argsCount: 1,
    returnType: "number",
    impl: (args, pos) => {
      const [val] = ensureNumericArgs(args, "FLOOR", pos);
      return Math.floor(val);
    }
  },
  CEIL: {
    argsCount: 1,
    returnType: "number",
    impl: (args, pos) => {
      const [val] = ensureNumericArgs(args, "CEIL", pos);
      return Math.ceil(val);
    }
  },
  SQRT: {
    argsCount: 1,
    returnType: "number",
    impl: (args, pos) => {
      const [val] = ensureNumericArgs(args, "SQRT", pos);
      if (val < 0) {
        throw new EvaluationError("Invalid input to SQRT(): cannot be negative", pos);
      }
      return Math.sqrt(val);
    }
  },
  LOG: {
    argsCount: 1,
    returnType: "number",
    impl: (args, pos) => {
      const [val] = ensureNumericArgs(args, "LOG", pos);
      if (val <= 0) {
        throw new EvaluationError("Invalid input to LOG(): must be greater than zero", pos);
      }
      return Math.log(val);
    }
  }
});
