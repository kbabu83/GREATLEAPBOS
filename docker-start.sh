#!/bin/bash
# Great Leap App — Docker Quick Start
set -e

GREEN='\033[0;32m'; BLUE='\033[0;34m'; YELLOW='\033[1;33m'; NC='\033[0m'

echo -e "${BLUE}🚀 Great Leap App — Docker Setup${NC}\n"

# ── 1. Copy .env ──────────────────────────────────────
if [ ! -f .env ]; then
  cp .env.docker .env
  echo -e "${GREEN}✓${NC} Created .env"
fi

# ── 2. Create required directories ───────────────────
mkdir -p storage/framework/{sessions,views,cache}
mkdir -p storage/logs
mkdir -p bootstrap/cache
chmod -R 775 storage bootstrap/cache

# ── 3. Start DB + Nginx first (no --build on app yet) ─
echo -e "\n${BLUE}Starting containers...${NC}"
docker compose up -d --build

# ── 4. Wait for DB to be healthy ──────────────────────
echo -ne "\n${BLUE}Waiting for MySQL${NC}"
until docker compose exec -T db mysqladmin ping -h localhost -u root -psecret --silent 2>/dev/null; do
  printf '.'
  sleep 2
done
echo -e " ${GREEN}ready!${NC}"

# ── 5. Install Composer dependencies ─────────────────
echo -e "\n${BLUE}Installing PHP dependencies (Composer)...${NC}"
docker compose exec app composer install --no-interaction --prefer-dist --optimize-autoloader

# ── 6. Generate app key ───────────────────────────────
echo -e "\n${BLUE}Generating app key...${NC}"
docker compose exec app php artisan key:generate

# ── 7. Migrate ────────────────────────────────────────
echo -e "\n${BLUE}Running migrations...${NC}"
docker compose exec app php artisan migrate --force

# ── 8. Seed ───────────────────────────────────────────
echo -e "\n${BLUE}Seeding demo data...${NC}"
docker compose exec app php artisan db:seed --force

# ── 9. Cache ──────────────────────────────────────────
docker compose exec app php artisan config:cache 2>/dev/null || true
docker compose exec app php artisan route:cache  2>/dev/null || true

echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅  App is ready!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e ""
echo -e "  ${BLUE}Open in browser:${NC}  http://localhost:8000"
echo -e ""
echo -e "  ${BLUE}Super Admin:${NC}   admin@greatleap.app / password"
echo -e "  ${BLUE}Tenant Admin:${NC}  admin@acme.com / password"
echo -e ""
echo -e "  ${YELLOW}Tip:${NC} Frontend live-reload → http://localhost:5173"
echo -e "  ${YELLOW}Tip:${NC} Stop everything  → docker compose down"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
