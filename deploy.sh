#!/bin/bash
# Script de déploiement sur VPS
# Usage : ./deploy.sh [user@vps-ip] [/chemin/sur/vps]
#
# Exemple : ./deploy.sh ubuntu@123.456.789.0 /opt/surf-app
#
# Prérequis VPS :
#   - Python 3.11+, Node 20+, nginx, postgresql
#   - sudo apt install python3.11-venv python3-pip nodejs npm nginx postgresql

set -e

VPS="${1:-user@your-vps-ip}"
REMOTE_DIR="${2:-/opt/surf-app}"
FRONTEND_DIST="/var/www/surf-app"

echo "=== Build frontend ==="
cd frontend
npm ci
npm run build
cd ..

echo "=== Upload backend ==="
rsync -avz --exclude='venv' --exclude='__pycache__' --exclude='.env' \
  backend/ "$VPS:$REMOTE_DIR/backend/"

echo "=== Upload frontend build ==="
ssh "$VPS" "sudo mkdir -p $FRONTEND_DIST && sudo chown \$USER:www-data $FRONTEND_DIST"
rsync -avz frontend/dist/ "$VPS:$FRONTEND_DIST/"
ssh "$VPS" "sudo chmod -R 755 $FRONTEND_DIST"

echo "=== Mise à jour dépendances Python ==="
ssh "$VPS" "
  cd $REMOTE_DIR/backend
  python3 -m venv venv || true
  ./venv/bin/pip install --quiet -r requirements.txt
"

echo "=== Redémarrage du service ==="
ssh "$VPS" "sudo systemctl restart surf-app && sudo systemctl status surf-app --no-pager"

echo "=== Rechargement nginx ==="
ssh "$VPS" "sudo nginx -t && sudo systemctl reload nginx"

echo ""
echo "=== Déploiement terminé ! ==="
echo "Vérifier : https://votre-domaine.com"
