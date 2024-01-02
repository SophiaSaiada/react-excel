import { expect, test } from "vitest";
import { letterToNumber, numberToLetter, stringArrayToEnum } from "../utils";

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

test.each(numberLettersCases)("letterToNumber: %i <- %s", (number, letter) => {
  expect(letterToNumber(letter)).toBe(number);
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
