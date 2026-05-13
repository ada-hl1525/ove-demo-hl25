FROM node:jod-alpine AS frontend
LABEL org.opencontainers.image.authors="Hongyi Luo <hongyi.luo25@imperial.ac.uk>"

WORKDIR /app/frontend

RUN npm install -g pnpm

COPY frontend/package.json frontend/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY frontend/ .
RUN SKIP_ENV_VALIDATION=1 pnpm run build --base=/ove-demo-hl25/

FROM python:3.12-slim-bookworm AS backend
LABEL org.opencontainers.image.authors="Hongyi Luo <hongyi.luo25@imperial.ac.uk>"

WORKDIR /app/backend

RUN apt update \
    && apt install -y --no-install-recommends build-essential \
      zlib1g-dev \
      libssl-dev \
      libffi-dev \
      libsqlite3-dev \
      patchelf \
    && rm -rf /var/lib/apt/lists/*

# Enable bytecode compilation
ENV UV_COMPILE_BYTECODE=1

# Copy from the cache instead of linking since it's a mounted volume
ENV UV_LINK_MODE=copy

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Install the project's dependencies using the lockfile and settings
RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=backend/uv.lock,target=uv.lock \
    --mount=type=bind,source=backend/pyproject.toml,target=pyproject.toml \
    uv sync --locked --no-install-project --no-dev

# Then, add the rest of the project source code and install it
# Installing separately from its dependencies allows optimal layer caching
COPY backend/ ./
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --locked --no-dev

# Place executables in the environment at the front of the path
ENV PATH="/app/backend/.venv/bin:$PATH"

RUN uv run pyinstaller --clean ove-demo-hl25.spec

FROM gcr.io/distroless/cc:debug AS runtime
LABEL org.opencontainers.image.authors="Hongyi Luo <hongyi.luo25@imperial.ac.uk>"

USER nonroot:nonroot

COPY --from=backend \
     /usr/lib/x86_64-linux-gnu/libsqlite3.so.* \
     /usr/lib/x86_64-linux-gnu/

COPY --from=backend \
     /lib/x86_64-linux-gnu/libz.so.* \
     /lib/x86_64-linux-gnu/

COPY --from=backend /app/backend/dist/ove-demo-hl25 .
COPY --from=backend /app/backend/public/. ./public/.
COPY --from=backend /app/backend/schemas/. ./schemas/.
COPY --from=frontend /app/frontend/dist/. ./public/.

# expose and run
EXPOSE 80
ENTRYPOINT ["./ove-demo-hl25", "80"]
