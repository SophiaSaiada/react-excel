import { CstParser, CstNode } from "chevrotain";
import {
  AdditionOperator,
  CellReferenceLiteral,
  Comma,
  Equal,
  FormulaLexer,
  FunctionName,
  LParen,
  Minus,
  MultiplicationOperator,
  NonNegativeNumberLiteral,
  RParen,
  StringLiteral,
  allTokens,
} from "./lexer.ts"; // the .ts extension is needed to make this file executable with ts-node
import { FormulaCstNode } from "./generated/FormulaParser";

class FormulaParser extends CstParser {
  constructor() {
    super(allTokens);
    this.performSelfAnalysis();
  }

  public formula = this.RULE("formula", () => {
    this.CONSUME(Equal);
    this.SUBRULE(this.additionExpression);
  });

  // Lowest precedence thus it is first in the rule chain
  // The precedence of binary expressions is determined by how far down the Parse Tree
  // The binary expression appears.
  private additionExpression = this.RULE("additionExpression", () => {
    // using labels can make the CST processing easier
    this.SUBRULE(this.multiplicationExpression, { LABEL: "lhs" });
    this.MANY(() => {
      // consuming 'AdditionOperator' will consume either Plus or Minus as they are subclasses of AdditionOperator
      this.CONSUME(AdditionOperator);
      // the index "2" in SUBRULE2 is needed to identify the unique position in the grammar during runtime
      this.SUBRULE2(this.multiplicationExpression, { LABEL: "rhs" });
    });
  });

  private multiplicationExpression = this.RULE(
    "multiplicationExpression",
    () => {
      this.SUBRULE(this.atomicExpression, { LABEL: "lhs" });
      this.MANY(() => {
        this.CONSUME(MultiplicationOperator);
        // the index "2" in SUBRULE2 is needed to identify the unique position in the grammar during runtime
        this.SUBRULE2(this.atomicExpression, { LABEL: "rhs" });
      });
    }
  );

  private numberLiteral = this.RULE("numberLiteral", () => {
    this.OPTION(() => this.CONSUME(Minus));
    this.CONSUME(NonNegativeNumberLiteral);
  });

  private atomicExpression = this.RULE("atomicExpression", () => {
    this.OR([
      // parenthesisExpression has the highest precedence and thus it appears
      // in the "lowest" leaf in the expression ParseTree.
      { ALT: () => this.SUBRULE(this.parenthesisExpression) },
      { ALT: () => this.SUBRULE(this.numberLiteral) },
      // no way to confuse between CellReferenceLiteral and functionCall, as function name can't contain digits
      { ALT: () => this.CONSUME(CellReferenceLiteral) },
      { ALT: () => this.CONSUME(StringLiteral) },
      { ALT: () => this.SUBRULE(this.functionCall) },
    ]);
  });

  private parenthesisExpression = this.RULE("parenthesisExpression", () => {
    this.CONSUME(LParen);
    this.SUBRULE(this.additionExpression);
    this.CONSUME(RParen);
  });

  private functionCall = this.RULE("functionCall", () => {
    this.CONSUME(FunctionName);
    this.CONSUME(LParen);
    this.MANY_SEP({
      SEP: Comma,
      DEF: () => {
        // Note: We might want to collect blank operand (e.g. MIN(1,,2) => [1,"",2]) in the future
        this.OPTION(() => this.SUBRULE(this.additionExpression));
      },
    });
    this.CONSUME(RParen);
  });
}

export const parser = new FormulaParser();

export function parseInput(raw: string) {
  const lexingResult = FormulaLexer.tokenize(raw);
  if (lexingResult.errors.length > 0) {
    throw new Error("Lexing Error: " + parser.errors.join("\n"));
  }

  // "input" is a setter which will reset the parser's state.
  parser.input = lexingResult.tokens;
  const cst = parser.formula() as CstNode;
  if (parser.errors.length > 0) {
    throw new Error("Parsing Error: " + parser.errors.join("\n"));
  }
  if (cst.name !== "formula") {
    throw new Error(
      `Parsing Error: Main node is not 'formula' but ${cst.name}`
    );
  }
  return cst as FormulaCstNode;
}
