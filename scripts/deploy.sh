#!/usr/bin/env bash
# SnapTik Admin API — One-shot deploy to EC2
# Usage: bash scripts/deploy.sh [image-tag]
# Run from repo root. Requires: docker, ssh, scp

set -euo pipefail

EC2_IP="16.16.251.27"
EC2_USER="ubuntu"
SSH_KEY="F:/Tiktokclone/snaptik-backend/snaptik-prod-ssh-key2.pem"
TAG="${1:-latest}"
IMAGE="snaptik-admin-api:${TAG}"
TARBALL="/tmp/snaptik-admin-api.tar.gz"

echo "=== SnapTik Admin API Deploy ==="
echo "  Target:  ${EC2_USER}@${EC2_IP}"
echo "  Image:   ${IMAGE}"
echo ""

echo "[1/4] Building Docker image..."
docker build -t "${IMAGE}" -f apps/api/Dockerfile .

echo "[2/4] Saving image to tarball..."
docker save "${IMAGE}" | gzip > "${TARBALL}"

echo "[3/4] Copying image to EC2..."
chmod 400 "${SSH_KEY}"
scp -i "${SSH_KEY}" -o StrictHostKeyChecking=no "${TARBALL}" "${EC2_USER}@${EC2_IP}:/tmp/"

echo "[4/4] Deploying on EC2..."
ssh -i "${SSH_KEY}" -o StrictHostKeyChecking=no "${EC2_USER}@${EC2_IP}" << 'REMOTE'
set -e
echo "Loading Docker image..."
docker load < /tmp/snaptik-admin-api.tar.gz

echo "Stopping old container..."
docker stop snaptik-admin-api 2>/dev/null || true
docker rm   snaptik-admin-api 2>/dev/null || true

echo "Starting new container..."
docker compose -f /home/ubuntu/snaptik-admin/docker-compose.production.yml up -d

echo "Waiting for health check..."
sleep 8
curl -sf http://localhost:5001/health && echo "✅ API healthy!" || (docker logs snaptik-admin-api --tail 50 && exit 1)

echo "Cleanup..."
docker image prune -f
rm -f /tmp/snaptik-admin-api.tar.gz
REMOTE

echo ""
echo "✅ Deploy complete!"
echo "   API: http://${EC2_IP}/api/v1/health"
