FROM node:20-slim

# Install Chromium for Puppeteer
RUN apt-get update && apt-get install -y \
  chromium \
  fonts-noto-cjk \
  python3 \
  make \
  g++ \
  --no-install-recommends && \
  rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm rebuild better-sqlite3
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
