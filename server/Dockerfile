FROM node:22-slim

# 編譯 better-sqlite3 需要
RUN apt-get update && apt-get install -y python3 make g++ curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 非 root 使用者
RUN groupadd -g 1001 dataapi && useradd -u 1001 -g dataapi -m dataapi

COPY package*.json ./
RUN npm ci --omit=dev || npm install --omit=dev

COPY src ./src
COPY tsconfig.json ./
RUN npx tsc

RUN mkdir -p /app/data && chown -R dataapi:dataapi /app
USER dataapi

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:4000/api/health || exit 1

CMD ["node", "dist/index.js"]
