import { expect, test } from "vitest";
import { Cell, EvaluationResult } from "../core/types";
import { getEvaluationResultToDisplay } from "../getEvaluationResultToDisplay";

test.each([
  [{ status: "PENDING" }, { valueToDisplay: "⏳", isError: true }],
  [
    { status: "SUCCESS", value: "hi" },
    { valueToDisplay: "hi", isError: false },
  ],
  [
    { status: "SUCCESS", value: 1123456 },
    { valueToDisplay: "1,123,456", isError: false },
  ],
  [
    { status: "SUCCESS", value: "1123456" },
    { valueToDisplay: "1123456", isError: false },
  ],
  [
    { status: "SUCCESS", value: "=1+1" },
    { valueToDisplay: "=1+1", isError: false },
  ],
  [
    { status: "SUCCESS", value: `x"x` },
    { valueToDisplay: `x"x`, isError: false },
  ],
  [
    { status: "ERROR", message: "hello" },
    { valueToDisplay: "hello", isError: true },
  ],
  [
    { status: "ERROR", message: "Cannot add or subtract a string" },
    { valueToDisplay: "Cannot add or subtract a string", isError: true },
  ],
] as [EvaluationResult, { valueToDisplay: string; isError: boolean }][])(
  "getEvaluationResultToDisplay: %o -> %o",
  (evaluationResult, expected) => {
    expect(
      getEvaluationResultToDisplay({
        evaluationResult,
      } as unknown as Cell)
    ).to.deep.equal(expected);
  }
);

test("getEvaluationResultToDisplay undefined cell", () => {
  expect(getEvaluationResultToDisplay(undefined)).to.deep.equal({
    valueToDisplay: "",
    isError: false,
  });
});
