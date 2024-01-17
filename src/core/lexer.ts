import { Lexer, createToken } from "chevrotain";
import { POSITIVE_FLOAT_REGEX } from "../constants.ts";

export const Equal = createToken({
  name: "Equal",
  pattern: /=/,
});

// using the NA pattern marks this Token class as 'irrelevant' for the Lexer.
// AdditionOperator defines a Tokens hierarchy but only the leafs in this hierarchy define
// actual Tokens that can appear in the text
export const AdditionOperator = createToken({
  name: "AdditionOperator",
  pattern: Lexer.NA,
});
export const Plus = createToken({
  name: "Plus",
  pattern: /\+/,
  categories: AdditionOperator,
});
export const Minus = createToken({
  name: "Minus",
  pattern: /-/,
  categories: AdditionOperator,
});

export const MultiplicationOperator = createToken({
  name: "MultiplicationOperator",
  pattern: Lexer.NA,
});
export const Multi = createToken({
  name: "Multi",
  pattern: /\*/,
  categories: MultiplicationOperator,
});
export const Div = createToken({
  name: "Div",
  pattern: /\//,
  categories: MultiplicationOperator,
});

export const LParen = createToken({ name: "LParen", pattern: /\(/ });
export const RParen = createToken({ name: "RParen", pattern: /\)/ });
export const NonNegativeNumberLiteral = createToken({
  name: "NonNegativeNumberLiteral",
  pattern: POSITIVE_FLOAT_REGEX,
});
export const CellReferenceLiteral = createToken({
  name: "CellReferenceLiteral",
  pattern: /[a-zA-Z]+\d+/,
});
export const StringLiteral = createToken({
  name: "StringLiteral",
  pattern: /"([^"]|"")*"/, // additional double quotes are used for escaped quotes
});

export const FunctionName = createToken({
  name: "FunctionName",
  pattern: /[a-zA-Z_]+/,
});
export const Comma = createToken({ name: "Comma", pattern: /,/ });

// marking WhiteSpace as 'SKIPPED' makes the lexer skip it.
export const WhiteSpace = createToken({
  name: "WhiteSpace",
  pattern: /\s+/,
  group: Lexer.SKIPPED,
});

export const allTokens = [
  WhiteSpace, // whitespace is normally very common so it should be placed first to speed up the lexer's performance
  Equal,
  Plus,
  Minus,
  Multi,
  Div,
  LParen,
  RParen,
  CellReferenceLiteral,
  NonNegativeNumberLiteral,
  StringLiteral,
  AdditionOperator,
  MultiplicationOperator,
  FunctionName,
  Comma,
];

export const FormulaLexer = new Lexer(allTokens);
