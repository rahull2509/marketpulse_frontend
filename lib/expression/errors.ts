import { Position } from "./types";

export class SyntaxError extends Error {
  constructor(
    public message: string,
    public position: Position
  ) {
    super(`${message} at line ${position.line}, column ${position.column}`);
    this.name = "SyntaxError";
  }
}

export class EvaluationError extends Error {
  constructor(
    public message: string,
    public position: Position
  ) {
    super(`Evaluation Error: ${message} at line ${position.line}, column ${position.column}`);
    this.name = "EvaluationError";
  }
}
