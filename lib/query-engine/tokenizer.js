"use strict";
/**
 * Query Engine Tokenizer — Lexes user-written scanner queries into tokens.
 *
 * Supports:
 * - Column names (possibly multi-word like "Last Price", wrapped in backticks or quoted)
 * - Numeric literals (integers, decimals, negative)
 * - Comparison operators (>, <, >=, <=, ==, !=)
 * - Logical operators (AND, OR, NOT)
 * - Arithmetic operators (+, -, *, /)
 * - Parentheses for grouping
 * - String literals in single or double quotes
 *
 * Example: `Volume > 100000 AND day_change_pct > 2`
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenType = void 0;
exports.tokenize = tokenize;
var TokenType;
(function (TokenType) {
    TokenType["IDENTIFIER"] = "IDENTIFIER";
    TokenType["NUMBER"] = "NUMBER";
    TokenType["STRING"] = "STRING";
    TokenType["OPERATOR"] = "OPERATOR";
    TokenType["LOGICAL"] = "LOGICAL";
    TokenType["ARITHMETIC"] = "ARITHMETIC";
    TokenType["LPAREN"] = "LPAREN";
    TokenType["RPAREN"] = "RPAREN";
    TokenType["COMMA"] = "COMMA";
    TokenType["BETWEEN"] = "BETWEEN";
    TokenType["CONTAINS"] = "CONTAINS";
    TokenType["EOF"] = "EOF";
})(TokenType || (exports.TokenType = TokenType = {}));
var KEYWORDS = {
    AND: TokenType.LOGICAL,
    OR: TokenType.LOGICAL,
    NOT: TokenType.LOGICAL,
    BETWEEN: TokenType.BETWEEN,
    CONTAINS: TokenType.CONTAINS,
};
var COMPARISON_OPS = new Set([">=", "<=", "==", "!=", ">", "<"]);
var ARITHMETIC_OPS = new Set(["+", "-", "*", "/"]);
function tokenize(input) {
    var tokens = [];
    var errors = [];
    var pos = 0;
    while (pos < input.length) {
        // Skip whitespace
        if (/\s/.test(input[pos])) {
            pos++;
            continue;
        }
        var startPos = pos;
        // Two-character operators: >=, <=, ==, !=
        if (pos + 1 < input.length) {
            var twoChar = input.slice(pos, pos + 2);
            if (COMPARISON_OPS.has(twoChar)) {
                tokens.push({ type: TokenType.OPERATOR, value: twoChar, position: startPos, length: 2 });
                pos += 2;
                continue;
            }
        }
        // Single character operators: >, <
        if (input[pos] === ">" || input[pos] === "<") {
            tokens.push({ type: TokenType.OPERATOR, value: input[pos], position: startPos, length: 1 });
            pos++;
            continue;
        }
        // Parentheses
        if (input[pos] === "(") {
            tokens.push({ type: TokenType.LPAREN, value: "(", position: startPos, length: 1 });
            pos++;
            continue;
        }
        if (input[pos] === ")") {
            tokens.push({ type: TokenType.RPAREN, value: ")", position: startPos, length: 1 });
            pos++;
            continue;
        }
        // Comma
        if (input[pos] === ",") {
            tokens.push({ type: TokenType.COMMA, value: ",", position: startPos, length: 1 });
            pos++;
            continue;
        }
        // Arithmetic operators
        if (ARITHMETIC_OPS.has(input[pos])) {
            // Distinguish negative sign from subtraction:
            // If '-' follows an operator, LPAREN, comma, or is at start, it's part of a number
            if (input[pos] === "-" &&
                pos + 1 < input.length &&
                /[0-9.]/.test(input[pos + 1]) &&
                (tokens.length === 0 ||
                    tokens[tokens.length - 1].type === TokenType.OPERATOR ||
                    tokens[tokens.length - 1].type === TokenType.LOGICAL ||
                    tokens[tokens.length - 1].type === TokenType.LPAREN ||
                    tokens[tokens.length - 1].type === TokenType.COMMA ||
                    tokens[tokens.length - 1].type === TokenType.ARITHMETIC)) {
                // Parse as negative number
                var numResult = readNumber(input, pos);
                tokens.push({ type: TokenType.NUMBER, value: numResult.value, position: startPos, length: numResult.value.length });
                pos = numResult.end;
                continue;
            }
            tokens.push({ type: TokenType.ARITHMETIC, value: input[pos], position: startPos, length: 1 });
            pos++;
            continue;
        }
        // Numbers
        if (/[0-9.]/.test(input[pos])) {
            var numResult = readNumber(input, pos);
            tokens.push({ type: TokenType.NUMBER, value: numResult.value, position: startPos, length: numResult.value.length });
            pos = numResult.end;
            continue;
        }
        // String literals (single or double quote)
        if (input[pos] === '"' || input[pos] === "'") {
            var quote = input[pos];
            var end = pos + 1;
            while (end < input.length && input[end] !== quote) {
                if (input[end] === "\\")
                    end++; // skip escaped chars
                end++;
            }
            if (end >= input.length) {
                errors.push({ message: "Unterminated string literal", position: startPos, length: end - startPos });
                pos = end;
                continue;
            }
            var value = input.slice(pos + 1, end);
            tokens.push({ type: TokenType.STRING, value: value, position: startPos, length: end - startPos + 1 });
            pos = end + 1;
            continue;
        }
        // Backtick-quoted identifiers (for column names with spaces)
        if (input[pos] === "`") {
            var end = pos + 1;
            while (end < input.length && input[end] !== "`") {
                end++;
            }
            if (end >= input.length) {
                errors.push({ message: "Unterminated backtick identifier", position: startPos, length: end - startPos });
                pos = end;
                continue;
            }
            var value = input.slice(pos + 1, end);
            tokens.push({ type: TokenType.IDENTIFIER, value: value, position: startPos, length: end - startPos + 1 });
            pos = end + 1;
            continue;
        }
        // Identifiers and keywords (alphabetic start, may contain letters, digits, underscores)
        if (/[a-zA-Z_]/.test(input[pos])) {
            var end = pos;
            while (end < input.length && /[a-zA-Z0-9_]/.test(input[end])) {
                end++;
            }
            var word = input.slice(pos, end);
            var upperWord = word.toUpperCase();
            if (KEYWORDS[upperWord]) {
                tokens.push({ type: KEYWORDS[upperWord], value: upperWord, position: startPos, length: end - pos });
            }
            else {
                tokens.push({ type: TokenType.IDENTIFIER, value: word, position: startPos, length: end - pos });
            }
            pos = end;
            continue;
        }
        // Unknown character
        errors.push({ message: "Unexpected character: '".concat(input[pos], "'"), position: startPos, length: 1 });
        pos++;
    }
    tokens.push({ type: TokenType.EOF, value: "", position: pos, length: 0 });
    return { tokens: tokens, errors: errors };
}
function readNumber(input, start) {
    var end = start;
    if (input[end] === "-")
        end++;
    var hasDecimal = false;
    while (end < input.length) {
        if (input[end] === ".") {
            if (hasDecimal)
                break;
            hasDecimal = true;
            end++;
        }
        else if (/[0-9]/.test(input[end])) {
            end++;
        }
        else {
            break;
        }
    }
    return { value: input.slice(start, end), end: end };
}
