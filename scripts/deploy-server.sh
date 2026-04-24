#!/usr/bin/env bash
# 部署 jianan-data-api 到任意 Linux + Docker + SSH 環境
# 預設目標：Hetzner CX32（架構雲端中性，腳本通用）
#
# 用法：./scripts/deploy-server.sh <host-ip> [ssh-key-path]

set -euo pipefail

HOST="${1:-}"
SSH_KEY="${2:-$HOME/.ssh/id_ed25519}"
REMOTE_DIR="/opt/jianan-data"

if [[ -z "$HOST" ]]; then
  echo "Usage: $0 <host-ip> [ssh-key-path]"
  exit 1
fi

echo "Deploying to $HOST (SSH key: $SSH_KEY)"

ssh -i "$SSH_KEY" -o StrictHostKeyChecking=accept-new "root@$HOST" "mkdir -p $REMOTE_DIR"

scp -i "$SSH_KEY" \
  server/docker-compose.yaml \
  server/Caddyfile \
  "root@$HOST:$REMOTE_DIR/"

ssh -i "$SSH_KEY" "root@$HOST" "cd $REMOTE_DIR && docker compose pull && docker compose up -d"

echo ""
echo "Deployment complete."
echo "Health check: curl http://$HOST/api/health"
