# syntax=docker/dockerfile:1
# Platform: linux/amd64
FROM --platform=linux/amd64 node:22-slim AS deps

WORKDIR /app

# Install build deps for native modules (better-sqlite3)
RUN apt-get update && apt-get install -y \
  python3 \
  make \
  g++ \
  --no-install-recommends && \
  rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

# -------------------------------------------------------------------
FROM --platform=linux/amd64 node:22-slim AS builder

WORKDIR /app

# Need build tools for native rebuild
RUN apt-get update && apt-get install -y \
  python3 \
  make \
  g++ \
  --no-install-recommends && \
  rm -rf /var/lib/apt/lists/*

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm rebuild better-sqlite3
RUN npm run build

# -------------------------------------------------------------------
FROM --platform=linux/amd64 node:22-slim AS runner

WORKDIR /app

# Install Chromium, Chinese fonts, and Node.js global tooling prerequisites
RUN apt-get update && apt-get install -y \
  chromium \
  fonts-noto-cjk \
  ca-certificates \
  --no-install-recommends && \
  rm -rf /var/lib/apt/lists/*

# Install Codex CLI globally inside the container
RUN npm install -g @openai/codex

# Verify Codex CLI is executable (build-time smoke test)
RUN codex --version

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Copy built artifacts from builder
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy node_modules for native modules (better-sqlite3 needs the .node binary)
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

CMD ["node", "server.js"]
