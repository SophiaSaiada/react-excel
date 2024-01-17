// Based on https://raw.githubusercontent.com/Chevrotain/chevrotain/9edeb4b6ac690d41f18564217a5b87569a437bb4/examples/implementation_languages/typescript/scripts/gen_dts_signatures.js
/**
 * This is a minimal script that generates TypeScript definitions
 * from a Chevrotain parser.
 */
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import * as prettier from "prettier";
import { writeFile } from "fs/promises";
import { generateCstDts } from "chevrotain";
import { parser } from "../src/core/parser.ts";

const dtsString = generateCstDts(parser.getGAstProductions());
const dtsPath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "src",
  "core",
  "generated",
  "FormulaParser.d.ts"
);
const prettierOptions = await prettier.resolveConfig(
  resolve(dirname(fileURLToPath(import.meta.url)), "..", ".prettierrc")
);
const formattedDtsString = await prettier.format(dtsString, {
  parser: "typescript",
  ...(prettierOptions ?? {}),
});
await writeFile(dtsPath, formattedDtsString);
