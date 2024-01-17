import { expect, test } from "vitest";
import { normalizeCellKey, numberToLetter, stringArrayToEnum } from "../utils";

const numberLettersCases: [number, string][] = [
  [0, "A"],
  [2, "C"],
  [9, "J"],
  [10, "K"],
  [25, "Z"],
  [26, "AA"],
  [51, "AZ"],
  [52, "BA"],
  [52, "BA"],
  [676 + 26, "AAA"],
  [17576 + 702, "AAAA"],
];

test.each(numberLettersCases)("numberToLetter: %i -> %s", (number, letter) => {
  expect(numberToLetter(number)).toBe(letter);
});

test("stringArrayToEnum", () => {
  enum Expected {
    A = "A",
    B = "B",
    C = "C",
  }
  const keys = ["A", "B", "C"] as const;
  expect(stringArrayToEnum(keys)).toEqual(Expected);
});

test.each([
  ["a1", "A1"],
  ["a01", "A1"],
  ["A01", "A1"],
  ["a0001", "A1"],
  ["Z02", "Z2"],
  ["Z2", "Z2"],
  ["z2", "Z2"],
  ["zZz022", "ZZZ22"],
  ["zZz002020", "ZZZ2020"],
  ["zZza002020", "ZZZA2020"],
])("normalizeCellKey: %s => %s", (raw, expected) => {
  expect(normalizeCellKey(raw)).toBe(expected);
});
