import fs from "fs";
import path from "path";
import prettier from "prettier";

export type Processor = {
  regex: RegExp;
  replacement: (matches: RegExpMatchArray) => string;
};

const __dirname = import.meta.dirname;

export const OUT_DIR = path.resolve(__dirname, "..", "src", "api");
export const SCHEMA_DIR = path.resolve(
  __dirname,
  "..",
  "..",
  "backend",
  "schemas"
);
const PRETTIER_CONFIG = path.resolve(__dirname, "..", ".prettierrc");

export const toCamel = (str: string) =>
  str.replace(/[-_](\w)/g, (_, c) => c.toUpperCase());

export const toPascal = (str: string) => {
  const c = toCamel(str);
  return c.charAt(0).toUpperCase() + c.slice(1);
};

export const postProcess = (data: string, processors: Processor[]) => {
  for (const processor of processors) {
    const matches = data.match(processor.regex);
    if (matches) {
      data = data.replace(processor.regex, processor.replacement(matches));
    }
  }

  return data;
};

export const writeToFile = async (out: string[], filename: string, formatter?: (data: string) => string) => {
  fs.mkdirSync(path.dirname(filename), { recursive: true });
  const config = JSON.parse(fs.readFileSync(PRETTIER_CONFIG, "utf8"));
  let pretty = await prettier.format(out.join("\n"), {
    ...config,
    parser: "typescript",
  });
  if (formatter) {
    pretty = formatter(pretty);
  }
  fs.writeFileSync(filename, pretty, "utf8");
};
