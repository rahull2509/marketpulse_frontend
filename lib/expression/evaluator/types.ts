/**
 * Strictly typed definitions for Expression Evaluation.
 */

/**
 * A market data row containing field values.
 * Represents raw tick data or cached market snapshots.
 */
export type RowContext = Record<string, number | null | undefined>;

/**
 * The evaluation context that will be passed down the AST.
 * Currently just wraps a RowContext but provides an extensibility 
 * point for future Phase 4 indicators, state, or caching mechanisms.
 */
export interface EvaluationContext {
  row: RowContext;
  // Future extensions (e.g. historical window, indicator cache) can be added here
}

/**
 * Allowed strict return types from AST evaluation.
 */
export type EvaluatorValue = number | boolean;
