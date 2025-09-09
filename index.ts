#!/usr/bin/env node

import enquirer from "enquirer";
import { $ } from "execa";
import { compile } from "handlebars";
import fs from "node:fs";
import path from "node:path";

const cwd = process.cwd();
const target = process.argv[2];

type ProjectConfig = {
  projectName: string;
  formattedProjectName: string;
  dockerAuthor: string;
  projectDir: string;
  metricsPassword: string;
  legacyAuthKey: string;
};

const getProjectConfig = async (): Promise<ProjectConfig> => {
  const { projectName } = await enquirer.prompt<{ projectName: string }>({
    type: "input",
    name: "projectName",
    message: "Project name",
    initial: target === "." ? "my-app" : target,
  });

  const { dockerAuthor } = await enquirer.prompt<{ dockerAuthor: string }>({
    type: "input",
    name: "dockerAuthor",
    message: "Docker Author",
    initial: "John Doe <john.doe@example.com>",
  });

  const { legacyAuthKey } = await enquirer.prompt<{ legacyAuthKey: string }>({
    type: "password",
    name: "legacyAuthKey",
    message: "Legacy Auth Key",
  });

  const { metricsPassword } = await enquirer.prompt<{
    metricsPassword: string;
  }>({
    type: "password",
    name: "metricsPassword",
    message: "Metrics Password",
  });

  const formattedProjectName = projectName
    .toLowerCase()
    .replaceAll(" ", "-")
    .replaceAll(/[^\w-]+/g, "");

  return {
    projectName,
    dockerAuthor,
    metricsPassword,
    legacyAuthKey,
    formattedProjectName,
    projectDir: path.join(cwd, formattedProjectName),
  };
};

const createDirectories = (config: ProjectConfig) => {
  fs.mkdirSync(path.join(config.projectDir, "frontend"), { recursive: true });
  fs.mkdirSync(path.join(config.projectDir, "backend"), { recursive: true });
};

const initGit = async (config: ProjectConfig) => {
  await $({ cwd: config.projectDir })`git init`;
};

const initBackend = async (config: ProjectConfig) => {
  await $({
    cwd: path.join(config.projectDir, "backend"),
  })`uv init --name ${config.formattedProjectName} --description ${`OVE demo for the ${config.projectName} project.`}`;
  await $({
    cwd: path.join(config.projectDir, "backend"),
  })`uv add aiosqlite alembic ${"fastapi-cache2[redis]"} ${"fastapi[standard]"} greenlet numpy pandas prometheus-fastapi-instrumentator pydantic-settings pyinstaller python-socketio redis slowapi sqlalchemy`;
};

const initFrontend = async (config: ProjectConfig) => {
  await $({ cwd: path.join(config.projectDir, "frontend") })`pnpm init`;
  await $({
    cwd: path.join(config.projectDir, "frontend"),
  })`pnpm pkg set ${`name=${config.formattedProjectName}`}`;
  await $({
    cwd: path.join(config.projectDir, "frontend"),
  })`pnpm pkg set ${`description=OVE demo for the ${config.projectName} project.`}`;
  await $({
    cwd: path.join(config.projectDir, "frontend"),
  })`pnpm pkg set version=0.0.1`;
  await $({
    cwd: path.join(config.projectDir, "frontend"),
  })`pnpm pkg set type=module`;
  await $({
    cwd: path.join(config.projectDir, "frontend"),
  })`pnpm pkg delete main`;
  await $({
    cwd: path.join(config.projectDir, "frontend"),
  })`pnpm pkg set private=true --json`;
  await $({
    cwd: path.join(config.projectDir, "frontend"),
  })`pnpm pkg set ${`scripts.build=tsc -b && vite build`}`;
  await $({
    cwd: path.join(config.projectDir, "frontend"),
  })`pnpm pkg set ${`scripts.check=prettier --write . && eslint --fix`}`;
  await $({
    cwd: path.join(config.projectDir, "frontend"),
  })`pnpm pkg set ${`scripts.clean=rm -rf dist`}`;
  await $({
    cwd: path.join(config.projectDir, "frontend"),
  })`pnpm pkg set scripts.dev=vite`;
  await $({
    cwd: path.join(config.projectDir, "frontend"),
  })`pnpm pkg set scripts.format=prettier`;
  await $({
    cwd: path.join(config.projectDir, "frontend"),
  })`pnpm pkg set scripts.lint=eslint`;
  await $({
    cwd: path.join(config.projectDir, "frontend"),
  })`pnpm pkg set ${`scripts.serve=vite preview`}`;
  await $({
    cwd: path.join(config.projectDir, "frontend"),
  })`pnpm pkg set ${`scripts.sync=pnpx tsx cli/codegen/schemas.ts && pnpx tsx cli/codegen/api.ts && pnpx tsx cli/codegen/sockets.ts`}`;
  await $({
    cwd: path.join(config.projectDir, "frontend"),
  })`pnpm pkg set ${`scripts.test=vitest run`}`;
  await $({
    cwd: path.join(config.projectDir, "frontend"),
  })`pnpm add -D @asyncapi/parser @eslint/js @tailwindcss/vite @testing-library/dom @testing-library/react @types/node @types/react @types/react-dom @vitejs/plugin-react-swc eslint eslint-config-prettier eslint-plugin-prettier eslint-plugin-react-hooks eslint-plugin-react-refresh globals jsdom json-schema-to-zod openapi3-ts prettier prettier-plugin-organize-imports prettier-plugin-tailwindcss tsx typescript typescript-eslint vite vitest`;
  await $({
    cwd: path.join(config.projectDir, "frontend"),
  })`pnpm add @t3-oss/env-core @tanstack/react-query @tanstack/react-query-devtools @tanstack/react-router @tanstack/react-router-devtools axios chalk class-variance-authority clsx date-fns lucide-react react react-dom socket.io-client tailwind-merge tailwindcss tailwindcss-animate web-vitals zod zustand`;
};

const templates = [
  {
    name: ".gitignore",
    source: "assets/.gitignore.template",
    target: ".gitignore",
  },
  {
    name: "Dockerfile",
    source: "assets/Dockerfile.template",
    target: "Dockerfile",
  },
  {
    name: "docker-compose.yml",
    source: "assets/docker-compose.yml.template",
    target: "docker-compose.yml",
  },
  {
    name: ".dockerignore",
    source: "assets/.dockerignore.template",
    target: ".dockerignore",
  },
  {
    name: "README.md",
    source: "assets/README.md.template",
    target: "README.md",
  },
  {
    name: "backend/main.py",
    source: "assets/backend/main.py.template",
    target: "backend/main.py",
  },
  {
    name: "backend/schemas.py",
    source: "assets/backend/schemas.py.template",
    target: "backend/schemas.py",
  },
  {
    name: "backend/schemas/.gitkeep",
    source: "assets/backend/schemas/.gitkeep.template",
    target: "backend/schemas/.gitkeep",
  },
  {
    name: "backend/schemas/asyncapi/.gitkeep",
    source: "assets/backend/schemas/asyncapi/.gitkeep.template",
    target: "backend/schemas/asyncapi/.gitkeep",
  },
  {
    name: "backend/schemas/entities/.gitkeep",
    source: "assets/backend/schemas/entities/.gitkeep.template",
    target: "backend/schemas/entities/.gitkeep",
  },
  {
    name: "backend/alembic.ini",
    source: "assets/backend/alembic.ini.template",
    target: "backend/alembic.ini",
  },
  {
    name: "backend/public/asyncapi.html",
    source: "assets/backend/public/asyncapi.html.template",
    target: "backend/public/asyncapi.html",
  },
  {
    name: "backend/public/docs.html",
    source: "assets/backend/public/docs.html.template",
    target: "backend/public/docs.html",
  },
  {
    name: "backend/public/favicon.svg",
    source: "assets/backend/public/favicon.svg.template",
    target: "backend/public/favicon.svg",
  },
  {
    name: "backend/data/.gitkeep",
    source: "assets/backend/data/.gitkeep.template",
    target: "backend/data/.gitkeep",
  },
  {
    name: "backend/config/redis.conf",
    source: "assets/backend/config/redis.conf.template",
    target: "backend/config/redis.conf",
  },
  {
    name: "backend/alembic/script.py.mako",
    source: "assets/backend/alembic/script.py.mako.template",
    target: "backend/alembic/script.py.mako",
  },
  {
    name: "backend/alembic/env.py",
    source: "assets/backend/alembic/env.py.template",
    target: "backend/alembic/env.py",
  },
  {
    name: "backend/alembic/__init__.py",
    source: "assets/backend/alembic/__init__.py.template",
    target: "backend/alembic/__init__.py",
  },
  {
    name: "backend/alembic/versions/.gitkeep",
    source: "assets/backend/alembic/versions/.gitkeep.template",
    target: "backend/alembic/versions/.gitkeep",
  },
  {
    name: "backend/app/__init__.py",
    source: "assets/backend/app/__init__.py.template",
    target: "backend/app/__init__.py",
  },
  {
    name: "backend/app/app.py",
    source: "assets/backend/app/app.py.template",
    target: "backend/app/app.py",
  },
  {
    name: "backend/app/main.py",
    source: "assets/backend/app/main.py.template",
    target: "backend/app/main.py",
  },
  {
    name: "backend/app/db/__init__.py",
    source: "assets/backend/app/db/__init__.py.template",
    target: "backend/app/db/__init__.py",
  },
  {
    name: "backend/app/db/models.py",
    source: "assets/backend/app/db/models.py.template",
    target: "backend/app/db/models.py",
  },
  {
    name: "backend/app/db/session.py",
    source: "assets/backend/app/db/session.py.template",
    target: "backend/app/db/session.py",
  },
  {
    name: "backend/app/core/__init__.py",
    source: "assets/backend/app/core/__init__.py.template",
    target: "backend/app/core/__init__.py",
  },
  {
    name: "backend/app/core/auth.py",
    source: "assets/backend/app/core/auth.py.template",
    target: "backend/app/core/auth.py",
  },
  {
    name: "backend/app/core/cache.py",
    source: "assets/backend/app/core/cache.py.template",
    target: "backend/app/core/cache.py",
  },
  {
    name: "backend/app/core/config.py",
    source: "assets/backend/app/core/config.py.template",
    target: "backend/app/core/config.py",
  },
  {
    name: "backend/app/core/cors.py",
    source: "assets/backend/app/core/cors.py.template",
    target: "backend/app/core/cors.py",
  },
  {
    name: "backend/app/core/logger.py",
    source: "assets/backend/app/core/logger.py.template",
    target: "backend/app/core/logger.py",
  },
  {
    name: "backend/app/core/metrics.py",
    source: "assets/backend/app/core/metrics.py.template",
    target: "backend/app/core/metrics.py",
  },
  {
    name: "backend/app/core/rate_limiter.py",
    source: "assets/backend/app/core/rate_limiter.py.template",
    target: "backend/app/core/rate_limiter.py",
  },
  {
    name: "backend/app/core/schemas.py",
    source: "assets/backend/app/core/schemas.py.template",
    target: "backend/app/core/schemas.py",
  },
  {
    name: "backend/app/core/sockets.py",
    source: "assets/backend/app/core/sockets.py.template",
    target: "backend/app/core/sockets.py",
  },
  {
    name: "backend/app/core/state.py",
    source: "assets/backend/app/core/state.py.template",
    target: "backend/app/core/state.py",
  },
  {
    name: "backend/app/api/__init__.py",
    source: "assets/backend/app/api/__init__.py.template",
    target: "backend/app/api/__init__.py",
  },
  {
    name: "backend/app/api/v1/__init__.py",
    source: "assets/backend/app/api/v1/__init__.py.template",
    target: "backend/app/api/v1/__init__.py",
  },
  {
    name: "backend/app/api/v1/sockets.py",
    source: "assets/backend/app/api/v1/sockets.py.template",
    target: "backend/app/api/v1/sockets.py",
  },
  {
    name: "backend/app/api/v1/state.py",
    source: "assets/backend/app/api/v1/state.py.template",
    target: "backend/app/api/v1/state.py",
  },
  {
    name: "backend/app/api/v1/endpoints/__init__.py",
    source: "assets/backend/app/api/v1/endpoints/__init__.py.template",
    target: "backend/app/api/v1/endpoints/__init__.py",
  },
  {
    name: "backend/app/api/v1/endpoints/example.py",
    source: "assets/backend/app/api/v1/endpoints/example.py.template",
    target: "backend/app/api/v1/endpoints/example.py",
  },
  {
    name: "backend/.env",
    source: "assets/backend/.env.template",
    target: "backend/.env",
  },
  {
    name: "frontend/vite.config.ts",
    source: "assets/frontend/vite.config.ts.template",
    target: "frontend/vite.config.ts",
  },
  {
    name: "frontend/tsconfig.node.json",
    source: "assets/frontend/tsconfig.node.json.template",
    target: "frontend/tsconfig.node.json",
  },
  {
    name: "frontend/tsconfig.json",
    source: "assets/frontend/tsconfig.json.template",
    target: "frontend/tsconfig.json",
  },
  {
    name: "frontend/tsconfig.app.json",
    source: "assets/frontend/tsconfig.app.json.template",
    target: "frontend/tsconfig.app.json",
  },
  {
    name: "frontend/index.html",
    source: "assets/frontend/index.html.template",
    target: "frontend/index.html",
  },
  {
    name: "frontend/eslint.config.ts",
    source: "assets/frontend/eslint.config.ts.template",
    target: "frontend/eslint.config.ts",
  },
  {
    name: "frontend/components.json",
    source: "assets/frontend/components.json.template",
    target: "frontend/components.json",
  },
  {
    name: "frontend/.prettierrc",
    source: "assets/frontend/.prettierrc.template",
    target: "frontend/.prettierrc",
  },
  {
    name: "frontend/.prettierignore",
    source: "assets/frontend/.prettierignore.template",
    target: "frontend/.prettierignore",
  },
  {
    name: "frontend/cli/utils.ts.template",
    source: "assets/frontend/cli/utils.ts.template",
    target: "frontend/cli/utils.ts",
  },
  {
    name: "frontend/cli/codegen/api.ts",
    source: "assets/frontend/cli/codegen/api.ts.template",
    target: "frontend/cli/codegen/api.ts",
  },
  {
    name: "frontend/cli/codegen/schemas.ts",
    source: "assets/frontend/cli/codegen/schemas.ts.template",
    target: "frontend/cli/codegen/schemas.ts",
  },
  {
    name: "frontend/cli/codegen/sockets.ts",
    source: "assets/frontend/cli/codegen/sockets.ts.template",
    target: "frontend/cli/codegen/sockets.ts",
  },
  {
    name: "frontend/public/favicon.svg",
    source: "assets/frontend/public/favicon.svg.template",
    target: "frontend/public/favicon.svg",
  },
  {
    name: "frontend/public/robots.txt",
    source: "assets/frontend/public/robots.txt.template",
    target: "frontend/public/robots.txt",
  },
  {
    name: "frontend/src/styles.css",
    source: "assets/frontend/src/styles.css.template",
    target: "frontend/src/styles.css",
  },
  {
    name: "frontend/src/reportWebVitals.ts",
    source: "assets/frontend/src/reportWebVitals.ts.template",
    target: "frontend/src/reportWebVitals.ts",
  },
  {
    name: "frontend/src/main.tsx",
    source: "assets/frontend/src/main.tsx.template",
    target: "frontend/src/main.tsx",
  },
  {
    name: "frontend/src/env.ts",
    source: "assets/frontend/src/env.ts.template",
    target: "frontend/src/env.ts",
  },
  {
    name: "frontend/src/routes/index.tsx",
    source: "assets/frontend/src/routes/index.tsx.template",
    target: "frontend/src/routes/index.tsx",
  },
  {
    name: "frontend/src/routes/index.test.tsx",
    source: "assets/frontend/src/routes/index.test.tsx.template",
    target: "frontend/src/routes/index.test.tsx",
  },
  {
    name: "frontend/src/lib/logger.ts",
    source: "assets/frontend/src/lib/logger.ts.template",
    target: "frontend/src/lib/logger.ts",
  },
  {
    name: "frontend/src/lib/query-client.ts",
    source: "assets/frontend/src/lib/query-client.ts.template",
    target: "frontend/src/lib/query-client.ts",
  },
  {
    name: "frontend/src/lib/store.ts",
    source: "assets/frontend/src/lib/store.ts.template",
    target: "frontend/src/lib/store.ts",
  },
  {
    name: "frontend/src/lib/types.ts",
    source: "assets/frontend/src/lib/types.ts.template",
    target: "frontend/src/lib/types.ts",
  },
  {
    name: "frontend/src/lib/utils.ts",
    source: "assets/frontend/src/lib/utils.ts.template",
    target: "frontend/src/lib/utils.ts",
  },
  {
    name: "frontend/src/hooks/use-grid.ts",
    source: "assets/frontend/src/hooks/use-grid.ts.template",
    target: "frontend/src/hooks/use-grid.ts",
  },
  {
    name: "frontend/src/hooks/use-is-view.ts",
    source: "assets/frontend/src/hooks/use-is-view.ts.template",
    target: "frontend/src/hooks/use-is-view.ts",
  },
  {
    name: "frontend/src/hooks/use-theme.ts",
    source: "assets/frontend/src/hooks/use-theme.ts.template",
    target: "frontend/src/hooks/use-theme.ts",
  },
  {
    name: "frontend/src/components/example.tsx",
    source: "assets/frontend/src/components/example.tsx.template",
    target: "frontend/src/components/example.tsx",
  },
  {
    name: "frontend/src/components/query-client-devtools.tsx",
    source: "assets/frontend/src/components/query-client-devtools.tsx.template",
    target: "frontend/src/components/query-client-devtools.tsx",
  },
];

const initDB = async (config: ProjectConfig) => {
  await $({
    cwd: config.projectDir,
  })`mkdir -p ${path.join(config.projectDir, "backend", "data")}`;
  await $({
    cwd: path.join(config.projectDir, "backend", "data"),
  })`sqlite3 main.db ${"VACUUM;"}`;
};

const migrateDB = async (config: ProjectConfig) => {
  await $({
    cwd: path.join(config.projectDir, "backend"),
  })`uv run alembic revision --autogenerate -m ${"Initial migration"}`;
  await $({
    cwd: path.join(config.projectDir, "backend"),
  })`uv run alembic upgrade head`;
};

const postInitBackend = async (config: ProjectConfig) => {
  await $({ cwd: path.join(config.projectDir, "backend") })`uv run schemas.py`;
};

const postInitFrontend = async (config: ProjectConfig) => {
  await $({ cwd: path.join(config.projectDir, "frontend") })`pnpm run sync`;
  await $({ cwd: path.join(config.projectDir, "frontend") })`pnpm run check`;
};

const copyTemplates = async (config: ProjectConfig) => {
  for (const template of templates) {
    console.log("Processing template: ", template.name);
    const source = fs
      .readFileSync(path.join(__dirname, template.source))
      .toString();
    const compiled = compile(source);
    const output = compiled(config);
    await $({
      cwd: config.projectDir,
    })`mkdir -p ${path.dirname(template.target)}`;
    fs.writeFileSync(path.join(config.projectDir, template.target), output);
  }
};

const commit = async (config: ProjectConfig) => {
  await $({ cwd: config.projectDir })`git add .`;
  await $({ cwd: config.projectDir })`git commit -m ${`Initial commit`}`;
};

const main = async () => {
  const config = await getProjectConfig();
  createDirectories(config);
  await initGit(config);
  await initBackend(config);
  await initDB(config);
  await initFrontend(config);
  await copyTemplates(config);
  await postInitBackend(config);
  await postInitFrontend(config);
  await migrateDB(config);
  await commit(config);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
