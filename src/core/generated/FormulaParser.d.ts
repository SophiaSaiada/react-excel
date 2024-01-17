import type { CstNode, ICstVisitor, IToken } from "chevrotain";

export interface FormulaCstNode extends CstNode {
  name: "formula";
  children: FormulaCstChildren;
}

export type FormulaCstChildren = {
  Equal: IToken[];
  additionExpression: AdditionExpressionCstNode[];
};

export interface AdditionExpressionCstNode extends CstNode {
  name: "additionExpression";
  children: AdditionExpressionCstChildren;
}

export type AdditionExpressionCstChildren = {
  lhs: MultiplicationExpressionCstNode[];
  AdditionOperator?: IToken[];
  rhs?: MultiplicationExpressionCstNode[];
};

export interface MultiplicationExpressionCstNode extends CstNode {
  name: "multiplicationExpression";
  children: MultiplicationExpressionCstChildren;
}

export type MultiplicationExpressionCstChildren = {
  lhs: AtomicExpressionCstNode[];
  MultiplicationOperator?: IToken[];
  rhs?: AtomicExpressionCstNode[];
};

export interface NumberLiteralCstNode extends CstNode {
  name: "numberLiteral";
  children: NumberLiteralCstChildren;
}

export type NumberLiteralCstChildren = {
  Minus?: IToken[];
  NonNegativeNumberLiteral: IToken[];
};

export interface AtomicExpressionCstNode extends CstNode {
  name: "atomicExpression";
  children: AtomicExpressionCstChildren;
}

export type AtomicExpressionCstChildren = {
  parenthesisExpression?: ParenthesisExpressionCstNode[];
  numberLiteral?: NumberLiteralCstNode[];
  CellReferenceLiteral?: IToken[];
  StringLiteral?: IToken[];
  functionCall?: FunctionCallCstNode[];
};

export interface ParenthesisExpressionCstNode extends CstNode {
  name: "parenthesisExpression";
  children: ParenthesisExpressionCstChildren;
}

export type ParenthesisExpressionCstChildren = {
  LParen: IToken[];
  additionExpression: AdditionExpressionCstNode[];
  RParen: IToken[];
};

export interface FunctionCallCstNode extends CstNode {
  name: "functionCall";
  children: FunctionCallCstChildren;
}

export type FunctionCallCstChildren = {
  FunctionName: IToken[];
  LParen: IToken[];
  additionExpression?: AdditionExpressionCstNode[];
  Comma?: IToken[];
  RParen: IToken[];
};

export interface ICstNodeVisitor<IN, OUT> extends ICstVisitor<IN, OUT> {
  formula(children: FormulaCstChildren, param?: IN): OUT;
  additionExpression(children: AdditionExpressionCstChildren, param?: IN): OUT;
  multiplicationExpression(
    children: MultiplicationExpressionCstChildren,
    param?: IN
  ): OUT;
  numberLiteral(children: NumberLiteralCstChildren, param?: IN): OUT;
  atomicExpression(children: AtomicExpressionCstChildren, param?: IN): OUT;
  parenthesisExpression(
    children: ParenthesisExpressionCstChildren,
    param?: IN
  ): OUT;
  functionCall(children: FunctionCallCstChildren, param?: IN): OUT;
}
