#!/usr/bin/env node
/**
 * cli/codegen/sockets.ts
 *
 * 1) Parses backend/schemas/asyncapi.yaml
 * 2) Finds all channels (namespace/event)
 * 3) Emits:
 *    - frontend/src/api/client-{namespace}.ts
 */
import fs from "node:fs";
import path from "node:path";
import type {
  OpenAPIObject,
  OperationObject,
  ParameterObject,
  ReferenceObject,
  RequestBodyObject,
  SchemaObject,
} from "openapi3-ts/oas31";
import {
  OUT_DIR,
  SCHEMA_DIR,
  postProcess,
  type Processor,
  toCamel,
  toPascal,
  writeToFile,
} from "../utils.ts";

const processors: Processor[] = [];

type Operation = {
  tag: string;
  op: OperationObject;
  path: string;
  method: string;
};

type HttpVerb = "get" | "post" | "put" | "patch" | "delete";

const OPENAPI_PATH = path.join(SCHEMA_DIR, "openapi.json");

// Helpers
const isRef = (x: unknown): x is ReferenceObject =>
  x !== null && typeof x === "object" && "$ref" in x && !!x.$ref;

const refType = (r: ReferenceObject) => {
  // Assumes "#/components/schemas/X"
  const m = r.$ref.match(/#\/components\/schemas\/(.+)$/);
  if (!m) throw new Error("Unsupported $ref: " + r.$ref);
  return m[1];
};

const generateZod = (schema: SchemaObject): string => {
  // Very minimal: handles object, array, primitives
  if ("anyOf" in schema) {
    const entries = schema.anyOf!.map((s) =>
      isRef(s) ? refType(s) : generateZod(s)
    );
    return `z.union([${entries.join(", ")}])`;
  }
  if (schema.type === "object" || schema.properties) {
    const req = schema.required || [];
    const props = schema.properties || {};
    const entries = Object.entries(props).map(([k, v]) => {
      const sch = isRef(v) ? refType(v) : generateZod(v as SchemaObject);
      const opt = req.includes(k) ? "" : ".optional()";
      return `  ${JSON.stringify(k)}: ${sch}${opt}`;
    });
    if (entries.length === 0) return "z.record(z.string(), z.unknown())";
    return `z.object({\n${entries.join(",\n")}\n})`;
  }
  if (schema.type === "array" && schema.items) {
    const inner = isRef(schema.items)
      ? refType(schema.items)
      : generateZod(schema.items as SchemaObject);
    return `z.array(${inner})`;
  }
  switch (schema.type) {
    case "string":
      return "z.string()";
    case "number":
    case "integer":
      return "z.number()";
    case "boolean":
      return "z.boolean()";
    case undefined:
      return "z.void()";
    case "null":
      return "z.null()";
    default:
      return "z.any()";
  }
};

const buildQueries = (
  chunks: Record<string, { _: string[]; [key: string]: string[] }>
) => {
  const res: string[] = [];

  Object.keys(chunks).forEach((tag) => {
    res.push(`\n  ${toCamel(tag.replaceAll(/[^\w-]+/g, "_"))}: {`);
    res.push(chunks[tag]._?.join("\n"));
    Object.keys(chunks[tag])
      .filter((k) => k !== "_")
      .forEach((version) => {
        res.push(`\n    v${toCamel(version)}: {`);
        res.push(chunks[tag][version].join("\n"));
        res.push(`\n    },`);
      });
    res.push(`\n  },`);
  });

  return res;
};

function paramSchema(params: (ParameterObject | ReferenceObject)[]) {
  const objs = params.filter((p) => !isRef(p)).map((p) => p as ParameterObject);
  if (objs.length === 0) return null;
  const entries = objs.map((p) => {
    const sch = p.schema
      ? isRef(p.schema)
        ? refType(p.schema)
        : generateZod(p.schema as SchemaObject)
      : "z.any()";
    const opt = p.required ? "" : ".optional()";
    return `  ${JSON.stringify(p.name)}: ${sch}${opt}`;
  });
  return `z.object({\n${entries.join(",\n")}\n})`;
}

const loadDocument = (): OpenAPIObject =>
  JSON.parse(fs.readFileSync(OPENAPI_PATH, "utf8"));

const getSchemas = () =>
  fs
    .readdirSync(path.join(SCHEMA_DIR, "entities"))
    .filter((f) => f.endsWith(".schema.json"))
    .map((f) => toPascal(path.basename(f, ".schema.json")));

const getOperations = (openapi: OpenAPIObject) => {
  const ops: Operation[] = [];
  for (const [p, mObj] of Object.entries(openapi.paths || {})) {
    for (const method of Object.keys(mObj) as HttpVerb[]) {
      const op = (mObj as Record<string, unknown>)[method] as OperationObject;
      const firstSeg = p.split("/").filter(Boolean)[0] || "root";
      const tag = (op.tags && op.tags[0]) || firstSeg;
      ops.push({ tag, op, path: p, method });
    }
  }
  return ops;
};

const getBase = () => {
  const schemas = getSchemas();
  const imports = schemas.join(", ");
  return `
/**
 * THIS FILE IS AUTO‐GENERATED. DO NOT EDIT.
 */
import { z } from "zod";
import { useQuery, useMutation, UseQueryOptions, UseMutationOptions } from "@tanstack/react-query";
import axios from "axios";
import { env } from "@/env";
${imports === "" ? "" : `import { ${imports} } from "@/api/schemas";`}

export const caller = axios.create({
  baseURL: env.VITE_BACKEND,
  withCredentials: true,
});

`;
};

const groupByTag = (operations: Operation[]) => {
  const grouped = new Map<string, Operation[]>();
  for (const o of operations) {
    if (!grouped.has(o.tag)) {
      grouped.set(o.tag, []);
    }
    grouped.get(o.tag)!.push(o);
  }

  return grouped;
};

const transformName = (op: OperationObject, method: string, p: string) => {
  let name =
    op.operationId ??
    `${method}${toPascal(
      p
        .split("/")
        .filter(Boolean)
        .slice(1)
        .map((s) => s.replace(/[{}]/g, "By"))
        .join(" ")
    ).replace(/\s+/g, "")}`;
  const regex = /.*_v(\d+)/.exec(name);
  const version = regex !== null ? regex[1] : null;
  name = name.replace(/_v\d+/, "");
  const nameWithVersion =
    version !== null ? `${toPascal(name)}${toPascal(version)}` : toPascal(name);

  return { name, version, nameWithVersion };
};

const buildParams = (
  parameters: (ParameterObject | ReferenceObject)[],
  nameWithVersion: string
) => {
  const schema = paramSchema(parameters.filter((p) => !isRef(p)));
  const declaration = schema
    ? `const ${nameWithVersion}Params = ${schema};\ntype ${nameWithVersion}Params = z.infer<typeof ${nameWithVersion}Params>;`
    : "";

  return { schema, declaration };
};

const buildBody = (
  body: ReferenceObject | RequestBodyObject | undefined,
  nameWithVersion: string
) => {
  let type = "void";
  let declaration = "";

  if (!(body && !isRef(body))) {
    return { type, declaration };
  }

  const content = (body.content || {})["application/json"];
  if (content && content.schema) {
    if (isRef(content.schema)) {
      type = refType(content.schema);
    } else {
      const sch = generateZod(content.schema as SchemaObject);
      declaration = `const ${nameWithVersion}Body = ${sch};\ntype ${nameWithVersion}Body = z.infer<typeof ${nameWithVersion}Body>;`;
      type = `${nameWithVersion}Body`;
    }
  }

  return { type, declaration };
};

const buildResponse = (
  responses: OperationObject["responses"],
  nameWithVersion: string
) => {
  let type = "void";
  let parseFn = "";
  let declaration = "";

  if (
    responses === undefined ||
    responses["200"] === undefined ||
    isRef(responses["200"]) ||
    responses["200"].content === undefined ||
    responses["200"].content["application/json"] === undefined ||
    responses["200"].content["application/json"].schema === undefined
  ) {
    return { type, parseFn, declaration };
  }

  const schema = responses["200"].content["application/json"].schema;

  if (isRef(schema)) {
    type = refType(schema);
    parseFn = `${type}.parse`;
  } else {
    const sch = generateZod(schema as SchemaObject);
    parseFn = `${nameWithVersion}Resp.parse`;
    declaration += `\nconst ${nameWithVersion}Resp = ${sch};\ntype ${nameWithVersion}Resp = z.infer<typeof ${nameWithVersion}Resp>;`;
    type = `${nameWithVersion}Resp`;
  }

  return { type, parseFn, declaration };
};

const getHookKey = (name: string) => {
  return `use${toPascal(name)}`;
};

const buildQuery = <T>(
  name: string,
  nameWithVersion: string,
  parameters: string[],
  path: string,
  _method: string,
  paramSchema: string | null,
  _bodyType: string,
  responseType: string,
  parseFn: T
) => {
  const hookKey = getHookKey(name);
  const params = [
    paramSchema ? "params: " + nameWithVersion + "Params" : "",
    `options?: Partial<UseQueryOptions<${responseType}>>`,
  ].filter(Boolean);
  const queryKey = `["${hookKey}",${paramSchema ? "params" : ""}]`;
  const seen: string[] = [];
  const url = path.replace(/\{([^}]+)}/g, (_, k) => {
    seen.push(k.toString());
    return `\${(queryKey[1] as ${nameWithVersion}Params).${k}}`;
  });
  const queryParams = parameters
    .filter((param) => !seen.includes(param))
    .map((k) => `${k}=\${(queryKey[1] as ${nameWithVersion}Params).${k}}`)
    .join("&");
  const queryKeyArgs = parameters.length > 0 ? `, queryKey` : "";

  return `
    ${hookKey}: (${params.join(", ")}) => useQuery<${responseType}>({
      ...(options ?? {}),
      queryKey: ${queryKey},
      queryFn: ({ signal${queryKeyArgs} }) =>
        caller.get<${responseType}>(\`${url}${queryParams.length > 0 ? "?" + queryParams : ""}\`, { signal })
          .then(({ data }) => ${parseFn}(data))}),`;
};

const buildMutation = <T>(
  name: string,
  nameWithVersion: string,
  _parameters: string[],
  path: string,
  method: string,
  paramSchema: string | null,
  bodyType: string,
  responseType: string,
  parseFn: T
) => {
  const hookKey = getHookKey(name);
  const variableType = `${bodyType === "void" ? "" : bodyType}${!paramSchema ? "" : ` & ${nameWithVersion}Params`}`;
  const types = [responseType, "Error", variableType]
    .filter(Boolean)
    .join(", ");
  const params = [
    paramSchema ? "params: " + nameWithVersion + "Params" : "",
    bodyType !== "void" ? `body: ${bodyType}` : "",
    `options?: Partial<UseMutationOptions<${types}>>`,
  ]
    .filter(Boolean)
    .join(", ");
  const url = path.replace(/\{([^}]+)}/g, (_, k) => `\${body.${k}}`);
  const callerArgs = [`\`${url}\``, bodyType !== "void" ? "body" : ""]
    .filter(Boolean)
    .join(", ");
  const mutationKey = `["${hookKey}"]`;

  return `
    ${hookKey}: (${params}) => useMutation<${types}>({
      ...(options ?? {}),
      mutationKey: ${mutationKey},
      mutationFn: (${bodyType === "void" ? "" : "body"}) =>
        caller.${method}<${responseType}>(${callerArgs})
          .then(({ data }) => ${parseFn}(data))}),`;
};

const main = async () => {
  const openapi = loadDocument();
  const operations = getOperations(openapi);
  const queries: Record<string, { _: string[]; [key: string]: string[] }> = {};

  const declarations = [];
  const grouped = groupByTag(operations);

  for (const [tag, list] of grouped.entries()) {
    queries[tag] = queries[tag] ?? { _: [] };

    for (const { op: operation, path: p, method } of list) {
      const { name, version, nameWithVersion } = transformName(
        operation,
        method,
        p
      );
      if (version !== null) {
        queries[tag][version] = queries[tag][version] ?? [];
      }

      const { schema: paramSchema, declaration: paramDeclaration } =
        buildParams(operation.parameters ?? [], nameWithVersion);
      const { type: bodyType, declaration: bodyDeclaration } = buildBody(
        operation.requestBody,
        nameWithVersion
      );
      const {
        type: responseType,
        parseFn,
        declaration: responseDeclaration,
      } = buildResponse(operation.responses, nameWithVersion);

      declarations.push(paramDeclaration ?? "");
      declarations.push(bodyDeclaration ?? "");
      declarations.push(responseDeclaration ?? "");

      const query = (method === "get" ? buildQuery : buildMutation)(
        name,
        nameWithVersion,
        (operation.parameters ?? [])
          .filter((param) => !isRef(param))
          .map((param) => (param as ParameterObject).name),
        p,
        method,
        paramSchema,
        bodyType,
        responseType,
        parseFn
      );
      queries[tag][version ?? "_"].push(query);
    }
  }

  await writeToFile(
    [
      getBase(),
      ...declarations,
      "export const api = {",
      ...buildQueries(queries),
      `\n};\n`,
    ],
    path.join(OUT_DIR, "api.ts"),
    (data) => postProcess(data, processors),
  );
  console.log(`✨  Generated api.ts in ${OUT_DIR}`);
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});