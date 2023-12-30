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
  return result;
}

export function stringArrayToEnum<T extends string>(
  stringArray: readonly T[]
): { [K in T]: K } {
  return stringArray.reduce((res, key) => {
    res[key] = key;
    return res;
  }, Object.create(null));
}
