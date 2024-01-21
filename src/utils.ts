import { CELL_KEY_REGEX } from "./constants";

export function numberToLetter(number: number): string {
  let result = "";
  while (number >= 0) {
    result = String.fromCharCode(65 + (number % 26)) + result;
    number = (number - (number % 26)) / 26 - 1;
  }
  return result;
}

export function letterToNumber(letter: string): number {
  let result = 0;
  for (let i = 0; i < letter.length; i++) {
    result *= 26;
    result += letter.charCodeAt(i) - 64;
  }
  return result - 1;
}

export function cellKeyToIndexes(key: string): { row: number; column: number } {
  const [, column, row] = key.match(CELL_KEY_REGEX)!;
  return { column: letterToNumber(column), row: parseInt(row) - 1 };
}

export function stringArrayToEnum<T extends string>(
  stringArray: readonly T[]
): { [K in T]: K } {
  return stringArray.reduce((res, key) => {
    res[key] = key;
    return res;
  }, Object.create(null));
}

export const formatNumber = (num: number) =>
  num.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 5,
  });

export const normalizeCellKey = (raw: string) =>
  raw.toUpperCase().replace(/(?<=[A-Z])0+/, ""); // uppercase then remove leading zeros in column number
