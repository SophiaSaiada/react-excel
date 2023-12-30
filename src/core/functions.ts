import FunctionName from "./FunctionName";

export const FUNCTIONS: {
  [K in FunctionName]: (evaluatedOperands: string[]) => string;
} = {
  SUM: (evaluatedOperands) =>
    evaluatedOperands
      .map(parseFloat)
      .reduce((a, b) => a + b, 0)
      .toString(),
  SUBTRACT: (evaluatedOperands) => {
    if (evaluatedOperands.length !== 2)
      throw new Error(`Expected 2 operands got ${evaluatedOperands.length}`);
    return (
      parseFloat(evaluatedOperands[0]) - parseFloat(evaluatedOperands[1])
    ).toString();
  },
  MAX: (evaluatedOperands) => {
    if (evaluatedOperands.length === 0) throw new Error("Got no operands");
    return Math.max(...evaluatedOperands.map(parseFloat)).toString();
  },
  MIN: (evaluatedOperands) => {
    if (evaluatedOperands.length === 0) throw new Error("Got no operands");
    return Math.min(...evaluatedOperands.map(parseFloat)).toString();
  },
};
