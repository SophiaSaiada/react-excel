import { expect, test, vi } from "vitest";
import { parseThenEvaluate, parseThenEvaluateShouldFail } from "./helpers";
import { unquoteString } from "../core/evaluator";
import { FUNCTIONS } from "../core/functions";

test.each([
  [String.raw`""`, String.raw``],
  [String.raw`""""`, String.raw`"`],
  [String.raw`""""""`, String.raw`""`],
  [String.raw`""""""""`, String.raw`"""`],
])("unquoteString %s", (quoted, expected) => {
  expect(unquoteString(quoted)).to.equal(expected);
});

test.each([
  ["=MaX(1)", 1],
  ["=MaX(1,2)", 2],
  ["=MaX(1,2,3)", 3],
  ["=MaX(1,2,3,4)", 4],
  ["=max(1,2,3,4)", 4],
  [`=conCatenate("a","b",1)`, "ab1"],
  [`=concatenate(-1.2)`, "-1.2"],
  [`=ConCatenate(-1.3+1, "hi")`, "-0.3hi"],
  [`=CONCATENATE(0.123450)`, "0.12345"],
  [`=conCatenatE(0.12345501)`, "0.12346"],
  [`=conCatenate(0.12345499)`, "0.12345"],
])("test single function call: %s", (formula, expected) => {
  expect(parseThenEvaluate(formula)).to.be.toEqual(expected);
});

test.each([
  ["=Z99", ""],
  ["=Z99+1", 1],
  ["=1+Z99", 1],
  ["=Z99-1", -1],
  ["=1-Z99", 1],
  ["=Z99*3", 0],
  ["=3*Z99", 0],
  ["=Z99/2", 0],
  ["=2/Z99", Infinity],
  ["=min(Z99,1)", 0],
  ["=min(Z99,-1)", -1],
  ["=min(-1, Z99)", -1],
])("blank cells: %s", (formula, expected) => {
  expect(parseThenEvaluate(formula)).to.be.toEqual(expected);
});

test("test nested expressions", () => {
  expect(parseThenEvaluate("=1+2-1")).to.be.toEqual(2);
  expect(parseThenEvaluate("=1+2-1+2")).to.be.toEqual(4);
  expect(parseThenEvaluate("=1+2-1+MAX(3,2)+MIN(1,2)")).to.be.toEqual(6);
  expect(parseThenEvaluate("=1+4-(MAX(3,2)-MIN(1,2))")).to.be.toEqual(3);
  expect(parseThenEvaluate("=1+ 4-( MAX(3,,2)- MIN (,1,2,,))")).to.be.toEqual(
    3
  );
});

test.each([
  ["=CONCATENATE(1,)", [1]],
  ["=CONCATENATE(1,,,2)", [1, 2]],
  ["=CONCATENATE(,,1,2)", [1, 2]],
  ["=CONCATENATE(,)", []],
  ["=CONCATENATE(,,)", []],
])("ignore blank function operands: %s", (formula, expected) => {
  const spy = vi.spyOn(FUNCTIONS, "CONCATENATE");
  parseThenEvaluate(formula);
  expect(spy).toHaveBeenCalledOnce();
  expect(spy).toHaveBeenCalledWith(expected);
});

test("test unknown function", () => {
  expect(parseThenEvaluateShouldFail("=AAA()")).to.be.equal(
    "Unknown function AAA"
  );
  expect(parseThenEvaluateShouldFail("=AAA(1)")).to.be.equal(
    "Unknown function AAA"
  );
});

test.each([
  ["=MIN()", "MIN: Got no operands"],
  ["=MAX()", "MAX: Got no operands"],
  [`=MAX("a")`, "MAX: Got non-numeric operands"],
  [`=MIN(1,"a")`, "MIN: Got non-numeric operands"],
  [`=1+"x"+2`, "Cannot add or subtract a string"],
  [`="x"+"a"`, "Cannot add or subtract a string"],
  [`="x"*2*2`, "Cannot multiply or divide a string"],
  [`="x"*"x"`, "Cannot multiply or divide a string"],
  [`="x"*2`, "Cannot multiply or divide a string"],
])("test function error: %s", (formula, expected) => {
  expect(parseThenEvaluateShouldFail(formula)).to.be.equal(expected);
});

test.each([
  ["=MIN(1,MAX())", "MAX: Got no operands"],
  ["=1+MAX()", "MAX: Got no operands"],
  ["=1*MAX()", "MAX: Got no operands"],
  [`=MAX(MIN("1",2,3),1)`, "MIN: Got non-numeric operands"],
  [`=2-MAX(MIN("1",2,3),1)*3`, "MIN: Got non-numeric operands"],
])("test error propagation: %s", (formula, expected) => {
  expect(parseThenEvaluateShouldFail(formula)).to.be.equal(expected);
});

test.each([
  ["=1+2*3", 7],
  ["=1-(1+2)/2-3*4", -12.5],
  ["=1/2-(1+2)/(2/3)-3*(6*4)", -76],
  ["=1/(2-1)+(2/2/3)-3*6*4", -70.66666666666667],
  ["=100000/(2/(2/4/6+2))", 104166.66666666667],
  ["=2/min(3,2)", 1],
  ["=-1", -1],
  ["=2/min(3,max(1,-1))", 2],
  ["=2/min(3,max(1,0.2))", 2],
])("%s => %s", (formula, expected) => {
  expect(parseThenEvaluate(formula)).to.be.equal(expected);
});
