import { expect, test } from "vitest";
import { numberToLetter } from "../utils";

test("numberToLetter base conversion", () => {
  expect(numberToLetter(0)).toBe("A");
  expect(numberToLetter(2)).toBe("C");
  expect(numberToLetter(9)).toBe("J");
  expect(numberToLetter(10)).toBe("K");
  expect(numberToLetter(25)).toBe("Z");
  expect(numberToLetter(26)).toBe("AA");
  expect(numberToLetter(51)).toBe("AZ");
  expect(numberToLetter(52)).toBe("BA");
  expect(numberToLetter(52)).toBe("BA");
  expect(numberToLetter(676 + 26)).toBe("AAA");
  expect(numberToLetter(17576 + 702)).toBe("AAAA");
});
