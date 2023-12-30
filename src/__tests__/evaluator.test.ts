import { expect, test } from "vitest";
import { parseCellRawValue } from "../core/parser";
import { evaluateCellExpression } from "../core/evaluator";

function parseThenEvaluate(rawValue: string) {
  const result = evaluateCellExpression(parseCellRawValue(rawValue));
  expect(result).to.not.toBeFalsy();
  expect(result).to.have.property("status", "SUCCESS");
  expect(result).to.have.property("value");
  return (result as { value: string }).value;
}

function parseThenEvaluateShouldFail(rawValue: string) {
  const result = evaluateCellExpression(parseCellRawValue(rawValue));
  expect(result).to.not.toBeFalsy();
  expect(result).to.have.property("status", "ERROR");
  expect(result).to.have.property("message");
  return (result as { message: string }).message;
}

test("test single function call", () => {
  expect(parseThenEvaluate("=SUM()")).to.be.toEqual("0");
  expect(parseThenEvaluate("=SUM(1)")).to.be.toEqual("1");
  expect(parseThenEvaluate("=SUM(1,2)")).to.be.toEqual("3");
  expect(parseThenEvaluate("=SUM(1,2,3)")).to.be.toEqual("6");
  expect(parseThenEvaluate("=SUM(1,2,3,4)")).to.be.toEqual("10");
});

test("test nested function call", () => {
  expect(parseThenEvaluate("=SUM(1,SUBTRACT(2,1))")).to.be.toEqual("2");
  expect(parseThenEvaluate("=SUM(1,SUBTRACT(2,1),2)")).to.be.toEqual("4");
  expect(
    parseThenEvaluate("=SUM(1,SUBTRACT(2,1),MAX(3,2),MIN(1,2))")
  ).to.be.toEqual("6");
  expect(
    parseThenEvaluate("=SUBTRACT(SUM(1,4),SUBTRACT(MAX(3,2),MIN(1,2)))")
  ).to.be.toEqual("3");
  expect(
    parseThenEvaluate("=SUBTRACT(SUM(1,4,),SUBTRACT(MAX(3,2),,MIN(1,,2)),)")
  ).to.be.toEqual("3");
});

test("test unknown function", () => {
  expect(parseThenEvaluateShouldFail("=AAA()")).to.be.equal(
    "Unknown function AAA"
  );
  expect(parseThenEvaluateShouldFail("=AAA(1)")).to.be.equal(
    "Unknown function AAA"
  );
});

test("test function error", () => {
  expect(parseThenEvaluateShouldFail("=SUBTRACT(1)")).to.be.equal(
    "SUBTRACT: Expected 2 operands got 1"
  );
  expect(parseThenEvaluateShouldFail("=SUBTRACT(1,2,3)")).to.be.equal(
    "SUBTRACT: Expected 2 operands got 3"
  );
  expect(parseThenEvaluateShouldFail("=MIN()")).to.be.equal("MIN: Got no operands");
  expect(parseThenEvaluateShouldFail("=MAX()")).to.be.equal("MAX: Got no operands");
});

test("test error propagation", () => {
  expect(parseThenEvaluateShouldFail("=SUM(1,SUBTRACT(1))")).to.be.equal(
    "SUBTRACT: Expected 2 operands got 1"
  );
  expect(parseThenEvaluateShouldFail("=SUM(SUBTRACT(1,2,3),1)")).to.be.equal(
    "SUBTRACT: Expected 2 operands got 3"
  );
});

test("test invalid argument to evaluateCellExpression", () => {
  expect(() => evaluateCellExpression({ foo: 1 })).to.throw(
    "Expected a FunctionCellExpression or a LiteralCellExpression"
  );
});
