"use strict";
/**
 * Query Engine Parser — Recursive descent parser producing an AST.
 *
 * Grammar:
 *   Expression  := OrExpr
 *   OrExpr      := AndExpr ("OR" AndExpr)*
 *   AndExpr     := NotExpr ("AND" NotExpr)*
 *   NotExpr     := "NOT" NotExpr | Comparison
 *   Comparison  := ArithExpr (CompOp ArithExpr)?
 *                | ArithExpr "BETWEEN" ArithExpr "AND" ArithExpr
 *                | ArithExpr "CONTAINS" StringLiteral
 *   ArithExpr   := Term (("+"|"-") Term)*
 *   Term        := Factor (("*"|"/") Factor)*
 *   Factor      := "(" Expression ")" | NUMBER | STRING | IDENTIFIER
 */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parse = parse;
exports.astToConditions = astToConditions;
var tokenizer_1 = require("./tokenizer");
/* ── Parser ────────────────────────────────────────────────────────────────── */
function parse(tokenResult) {
    var _a;
    var tokens = tokenResult.tokens, tokenErrors = tokenResult.errors;
    if (tokenErrors.length > 0) {
        return {
            ast: null,
            errors: tokenErrors.map(function (e) { return ({
                message: e.message,
                position: e.position,
                length: e.length,
            }); }),
        };
    }
    // Skip if only EOF
    if (tokens.length <= 1 && ((_a = tokens[0]) === null || _a === void 0 ? void 0 : _a.type) === tokenizer_1.TokenType.EOF) {
        return { ast: null, errors: [] };
    }
    var parser = new Parser(tokens);
    try {
        var ast = parser.parseExpression();
        if (!parser.isAtEnd()) {
            var current = parser.peek();
            parser.errors.push({
                message: "Unexpected token: \"".concat(current.value, "\""),
                position: current.position,
                length: current.length,
            });
        }
        return {
            ast: parser.errors.length > 0 ? null : ast,
            errors: parser.errors,
        };
    }
    catch (e) {
        if (e instanceof ParserError) {
            return {
                ast: null,
                errors: __spreadArray(__spreadArray([], parser.errors, true), [{ message: e.message, position: e.position, length: e.length }], false),
            };
        }
        return {
            ast: null,
            errors: __spreadArray(__spreadArray([], parser.errors, true), [
                { message: "Parse error: ".concat(e.message), position: 0, length: 0 },
            ], false),
        };
    }
}
/* ── Internal Parser Class ─────────────────────────────────────────────────── */
var ParserError = /** @class */ (function (_super) {
    __extends(ParserError, _super);
    function ParserError(message, position, length) {
        var _this = _super.call(this, message) || this;
        _this.position = position;
        _this.length = length;
        return _this;
    }
    return ParserError;
}(Error));
var Parser = /** @class */ (function () {
    function Parser(tokens) {
        this.pos = 0;
        this.errors = [];
        this.tokens = tokens;
    }
    Parser.prototype.peek = function () {
        return this.tokens[this.pos] || { type: tokenizer_1.TokenType.EOF, value: "", position: 0, length: 0 };
    };
    Parser.prototype.advance = function () {
        var token = this.peek();
        if (token.type !== tokenizer_1.TokenType.EOF) {
            this.pos++;
        }
        return token;
    };
    Parser.prototype.isAtEnd = function () {
        return this.peek().type === tokenizer_1.TokenType.EOF;
    };
    Parser.prototype.expect = function (type, value) {
        var token = this.peek();
        if (token.type !== type || (value !== undefined && token.value !== value)) {
            throw new ParserError("Expected ".concat(value || type, " but got \"").concat(token.value || "end of input", "\""), token.position, token.length || 1);
        }
        return this.advance();
    };
    /* ── Grammar Rules ───────────────────────────────────────────────────────── */
    Parser.prototype.parseExpression = function () {
        return this.parseOrExpr();
    };
    Parser.prototype.parseOrExpr = function () {
        var left = this.parseAndExpr();
        while (this.peek().type === tokenizer_1.TokenType.LOGICAL && this.peek().value === "OR") {
            this.advance();
            var right = this.parseAndExpr();
            left = { type: "BinaryOp", operator: "OR", left: left, right: right };
        }
        return left;
    };
    Parser.prototype.parseAndExpr = function () {
        var left = this.parseNotExpr();
        while (this.peek().type === tokenizer_1.TokenType.LOGICAL && this.peek().value === "AND") {
            // Lookahead: if the next AND is part of a BETWEEN...AND, don't consume it
            var savedPos = this.pos;
            this.advance();
            // Check if we're inside a BETWEEN context by looking back
            // This is handled naturally because BETWEEN consumes its own AND
            var right = this.parseNotExpr();
            left = { type: "BinaryOp", operator: "AND", left: left, right: right };
        }
        return left;
    };
    Parser.prototype.parseNotExpr = function () {
        if (this.peek().type === tokenizer_1.TokenType.LOGICAL && this.peek().value === "NOT") {
            this.advance();
            var operand = this.parseNotExpr();
            return { type: "UnaryOp", operator: "NOT", operand: operand };
        }
        return this.parseComparison();
    };
    Parser.prototype.parseComparison = function () {
        var left = this.parseArithExpr();
        // Check for BETWEEN
        if (this.peek().type === tokenizer_1.TokenType.BETWEEN) {
            this.advance();
            var low = this.parseArithExpr();
            this.expect(tokenizer_1.TokenType.LOGICAL, "AND");
            var high = this.parseArithExpr();
            return { type: "Between", value: left, low: low, high: high };
        }
        // Check for CONTAINS
        if (this.peek().type === tokenizer_1.TokenType.CONTAINS) {
            this.advance();
            var needle = this.parseFactor();
            return { type: "Contains", haystack: left, needle: needle };
        }
        // Check for comparison operator
        if (this.peek().type === tokenizer_1.TokenType.OPERATOR) {
            var op = this.advance();
            var right = this.parseArithExpr();
            return { type: "Comparison", operator: op.value, left: left, right: right };
        }
        return left;
    };
    Parser.prototype.parseArithExpr = function () {
        var left = this.parseTerm();
        while (this.peek().type === tokenizer_1.TokenType.ARITHMETIC &&
            (this.peek().value === "+" || this.peek().value === "-")) {
            var op = this.advance();
            var right = this.parseTerm();
            left = { type: "BinaryOp", operator: op.value, left: left, right: right };
        }
        return left;
    };
    Parser.prototype.parseTerm = function () {
        var left = this.parseFactor();
        while (this.peek().type === tokenizer_1.TokenType.ARITHMETIC &&
            (this.peek().value === "*" || this.peek().value === "/")) {
            var op = this.advance();
            var right = this.parseFactor();
            left = { type: "BinaryOp", operator: op.value, left: left, right: right };
        }
        return left;
    };
    Parser.prototype.parseFactor = function () {
        var token = this.peek();
        // Parenthesized expression
        if (token.type === tokenizer_1.TokenType.LPAREN) {
            this.advance();
            var expr = this.parseExpression();
            this.expect(tokenizer_1.TokenType.RPAREN);
            return expr;
        }
        // Number literal
        if (token.type === tokenizer_1.TokenType.NUMBER) {
            this.advance();
            return { type: "NumberLiteral", value: parseFloat(token.value) };
        }
        // String literal
        if (token.type === tokenizer_1.TokenType.STRING) {
            this.advance();
            return { type: "StringLiteral", value: token.value };
        }
        // Identifier (column name) or Function Call
        if (token.type === tokenizer_1.TokenType.IDENTIFIER) {
            this.advance();
            if (this.peek().type === tokenizer_1.TokenType.LPAREN) {
                this.advance();
                var args = [];
                if (this.peek().type !== tokenizer_1.TokenType.RPAREN) {
                    do {
                        args.push(this.parseExpression());
                        if (this.peek().type === tokenizer_1.TokenType.COMMA) {
                            this.advance();
                        }
                        else {
                            break;
                        }
                    } while (true);
                }
                this.expect(tokenizer_1.TokenType.RPAREN);
                return { type: "FunctionCall", name: token.value, args: args };
            }
            return { type: "Identifier", name: token.value };
        }
        throw new ParserError("Unexpected token: \"".concat(token.value || "end of input", "\""), token.position, token.length || 1);
    };
    return Parser;
}());
function astToConditions(node, currentLogical) {
    if (currentLogical === void 0) { currentLogical = "AND"; }
    if (!node)
        return [];
    var conditions = [];
    switch (node.type) {
        case "Comparison": {
            if (node.left.type === "Identifier") {
                var value = null;
                if (node.right.type === "NumberLiteral" || node.right.type === "StringLiteral") {
                    value = node.right.value;
                }
                conditions.push({
                    column: node.left.name,
                    operator: node.operator,
                    value: value,
                    logical: currentLogical,
                });
            }
            break;
        }
        case "Between": {
            if (node.value.type === "Identifier" && node.low.type === "NumberLiteral" && node.high.type === "NumberLiteral") {
                conditions.push({
                    column: node.value.name,
                    operator: "between",
                    value: [node.low.value, node.high.value],
                    logical: currentLogical,
                });
            }
            break;
        }
        case "Contains": {
            if (node.haystack.type === "Identifier" && node.needle.type === "StringLiteral") {
                conditions.push({
                    column: node.haystack.name,
                    operator: "contains",
                    value: node.needle.value,
                    logical: currentLogical,
                });
            }
            break;
        }
        case "BinaryOp": {
            if (node.operator === "AND" || node.operator === "OR") {
                var left = astToConditions(node.left, currentLogical);
                var right = astToConditions(node.right, node.operator);
                conditions.push.apply(conditions, __spreadArray(__spreadArray([], left, false), right, false));
            }
            break;
        }
        case "UnaryOp": {
            // Unary NOT is harder to flatten into ScannerCondition unless we invert the operator
            // Since ScannerCondition array assumes simple AND/OR flattening, we will skip it for now.
            break;
        }
    }
    return conditions;
}
