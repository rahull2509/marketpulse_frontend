import type { StockRecord } from "@/types/stock";
import type { ScannerCondition, UnifiedQueryRequest, QueryResultMeta } from "@/types/scanner";
import { compileExpression, executeCompiledExpression, CompiledExpression } from "../lib/expression";

export type ExecutionStep = 
  | { type: "legacy"; condition: ScannerCondition }
  | { type: "expression"; compiled: CompiledExpression };

export class ExecutionPlan {
  constructor(public readonly steps: ExecutionStep[]) {}
}

/**
 * UnifiedQueryEngine — Replicates the backend Pandas translator.py logic in JavaScript.
 * 
 * Features:
 * - O(N) evaluation with early short-circuiting where possible.
 * - Graceful degradation on type errors (returns true).
 * - Exact type coercion matching Pandas `to_numeric(errors='coerce')`.
 */
export class UnifiedQueryEngine {
  static compilePlan(request: UnifiedQueryRequest): ExecutionPlan {
    const steps: ExecutionStep[] = [];
    
    if (request.conditions) {
      for (const cond of request.conditions) {
        steps.push({ type: "legacy", condition: cond });
      }
    }

    if (request.expression_conditions) {
      for (const expr of request.expression_conditions) {
        steps.push({ type: "expression", compiled: compileExpression(expr.expression) });
      }
    }

    return new ExecutionPlan(steps);
  }

  static execute(
    stocks: StockRecord[],
    request: UnifiedQueryRequest
  ): { results: StockRecord[]; meta: QueryResultMeta } {
    const startTime = performance.now();
    
    // Compile plan once before iteration. Syntax errors will intentionally abort here.
    const plan = this.compilePlan(request);

    // 1. Filter
    let filtered = stocks;
    const conditionsApplied = plan.steps.length;

    if (conditionsApplied > 0) {
      filtered = stocks.filter((stock) =>
        this.evaluatePlan(stock, plan)
      );
    }

    const matchedCount = filtered.length;

    // 2. Sort
    if (request.sort_by) {
      const sortKey = request.sort_by;
      const desc = request.sort_order === "desc";
      filtered.sort((a, b) => {
        const valA = a[sortKey as keyof StockRecord];
        const valB = b[sortKey as keyof StockRecord];

        // Handle null/undefined (push to bottom)
        if (valA == null && valB == null) return 0;
        if (valA == null) return 1;
        if (valB == null) return -1;

        if (typeof valA === "number" && typeof valB === "number") {
          return desc ? valB - valA : valA - valB;
        }

        const strA = String(valA).toLowerCase();
        const strB = String(valB).toLowerCase();
        if (strA < strB) return desc ? 1 : -1;
        if (strA > strB) return desc ? -1 : 1;
        return 0;
      });
    }

    // 3. Paginate
    const page = Math.max(1, request.page || 1);
    const pageSize = Math.max(1, request.page_size || 500);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    
    const paginated = filtered.slice(startIndex, endIndex);

    const endTime = performance.now();

    return {
      results: paginated,
      meta: {
        total: matchedCount, // Keep 'total' mapping to matchedCount for legacy compatibility
        total_scanned: stocks.length,
        matched_count: matchedCount,
        returned_count: paginated.length,
        truncated: matchedCount > pageSize,
        page,
        page_size: pageSize,
        total_pages: Math.ceil(matchedCount / pageSize),
        conditions_applied: conditionsApplied,
        execution_time_ms: Math.round(endTime - startTime),
        execution_target: "live",
        validation_errors: [],
      },
    };
  }

  private static evaluatePlan(
    stock: StockRecord,
    plan: ExecutionPlan
  ): boolean {
    let andMask = true;
    const orMasks: boolean[] = [];

    for (const step of plan.steps) {
      if (step.type === "legacy") {
        const condition = step.condition;
        const column = condition.column;
        const operator = condition.operator?.toLowerCase().trim() || "=";
        const value = condition.value;
        const logical = (condition.logical || "AND").toUpperCase();

        if (!(column in stock)) {
          continue;
        }

        const match = this.evaluateSingle(stock, column, operator, value);

        if (logical === "OR") {
          orMasks.push(match);
        } else {
          andMask = andMask && match;
        }
      } else {
        // Expression conditions are implicitly ANDed.
        // The RowContext is safely compatible with StockRecord.
        const match = executeCompiledExpression(step.compiled, stock as any);
        andMask = andMask && match;
      }
    }

    if (orMasks.length > 0) {
      return andMask && orMasks.some((m) => m === true);
    }

    return andMask;
  }

  private static evaluateSingle(
    stock: StockRecord,
    column: string,
    operator: string,
    value: any
  ): boolean {
    const rawVal = stock[column as keyof StockRecord];

    // Null checks
    if (operator === "is_null") {
      return rawVal == null;
    }
    if (operator === "is_not_null") {
      return rawVal != null;
    }

    if (rawVal == null) return false;

    // Numeric operators
    if (
      operator === ">" ||
      operator === "<" ||
      operator === ">=" ||
      operator === "<=" ||
      operator === "between"
    ) {
      const numericRaw = Number(rawVal);
      if (isNaN(numericRaw)) return false;

      if (operator === ">") return numericRaw > Number(value);
      if (operator === "<") return numericRaw < Number(value);
      if (operator === ">=") return numericRaw >= Number(value);
      if (operator === "<=") return numericRaw <= Number(value);
      if (operator === "between") {
        if (Array.isArray(value) && value.length === 2) {
          return numericRaw >= Number(value[0]) && numericRaw <= Number(value[1]);
        }
        return true; // Graceful degradation
      }
    }

    // Equality (auto-detect numeric vs string)
    if (operator === "=" || operator === "==") {
      const numRaw = Number(rawVal);
      const numVal = Number(value);
      if (!isNaN(numRaw) && !isNaN(numVal) && value !== "") {
        return numRaw === numVal;
      }
      return String(rawVal).toLowerCase() === String(value).toLowerCase();
    }

    if (operator === "!=") {
      const numRaw = Number(rawVal);
      const numVal = Number(value);
      if (!isNaN(numRaw) && !isNaN(numVal) && value !== "") {
        return numRaw !== numVal;
      }
      return String(rawVal).toLowerCase() !== String(value).toLowerCase();
    }

    // String operators
    if (operator === "contains") {
      return String(rawVal).toLowerCase().includes(String(value).toLowerCase());
    }
    if (operator === "starts_with") {
      return String(rawVal).toLowerCase().startsWith(String(value).toLowerCase());
    }
    if (operator === "ends_with") {
      return String(rawVal).toLowerCase().endsWith(String(value).toLowerCase());
    }

    // Set operators
    if (operator === "in") {
      if (Array.isArray(value)) {
        return value.some(
          (v) => String(rawVal).toLowerCase() === String(v).toLowerCase()
        );
      }
      return true;
    }

    if (operator === "not_in") {
      if (Array.isArray(value)) {
        return !value.some(
          (v) => String(rawVal).toLowerCase() === String(v).toLowerCase()
        );
      }
      return true;
    }

    // Default graceful degradation
    return true;
  }
}
