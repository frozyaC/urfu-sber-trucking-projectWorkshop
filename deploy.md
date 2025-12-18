# Deploy guide (Ubuntu 24.04 LTS)

Goal: run the whole stack on a fresh VPS and make it reachable from the internet. This is written for beginners and uses only Docker Compose.

## What you get
- HTTP setup on port 80 via the existing Nginx gateway.
- Optional HTTPS with automatic Let’s Encrypt certificates using a small Caddy reverse proxy in front of the existing Nginx gateway.
- One-command updates: pull code, rebuild, restart.

## Prerequisites
- VPS: Ubuntu 24.04 LTS (ENG), public IPv4: **193.108.114.95**, recommended 2 vCPU / 4 GB RAM.
- User: you can SSH as a sudo-capable user.
- Domain (recommended for HTTPS): e.g., `app.example.com` pointing to **193.108.114.95** via an A record.
- Firewall: plan to open inbound TCP 80 (HTTP) and 443 (HTTPS if used). Do **not** expose DB or internal service ports.

## Step 1 — Update the system
```bash
sudo apt update && sudo apt -y upgrade
sudo apt -y install curl ca-certificates gnupg git ufw
```

## Step 2 — Configure firewall (UFW)
```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
# add 443/tcp now if you intend to enable HTTPS
sudo ufw enable
sudo ufw status
```

## Step 3 — Install Docker and Compose plugin
```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
newgrp docker  # re-evaluate group membership in current shell
docker --version
docker compose version
```

## Step 4 — Clone the project
Choose a working directory, e.g. `/opt/app`:
```bash
sudo mkdir -p /opt/app && sudo chown -R $USER:$USER /opt/app
cd /opt/app
git clone -b deploy https://github.com/frozyaC/urfu-sber-trucking-projectWorkshop.git trucking-app
cd trucking-app
```

Project entrypoints:
- Root compose: `docker-compose.yaml` (runs DB, backends, frontend, nginx-gateway, wiremock)
- Gateway config: `nginx-gateway.conf` (routes `/` to frontend, `/api/` to API gateway, `/wiremock/` for mocks)

## Step 5 — Run in HTTP mode (quick start)
Build images (first run) and start everything detached:
```bash
docker compose up -d --build
```

**Note:** Do NOT run `docker compose pull` before building custom images. This command is only for pre-built images from registries. Since all services are built locally, proceed directly with `docker compose up -d --build`.

What starts and how it is exposed by default (from docker-compose.yaml):
- Port 80 → nginx-gateway (public entry; proxies to frontend and API gateway)
- Port 3001 → frontend-service (for internal/dev use; prefer port 80)
- Ports 8080–8084 → backend services (dev convenience; keep firewalled externally)
- Port 8089 → wiremock (dev)
- Port 5432 → postgres (dev; keep closed externally)

Verify:
```bash
docker compose ps
curl -I http://193.108.114.95/
curl -I http://193.108.114.95/api/  # or a known health/actuator path
```

Browser access: `http://193.108.114.95/` (or your domain if DNS is set).

## Step 6 — Optional HTTPS (recommended for production)
We will place Caddy in front of the existing nginx-gateway. Caddy handles TLS certificates automatically.

1) Create `docker-compose.override.yaml` in the project root:
```bash
cat > docker-compose.override.yaml << 'EOF'
services:
  caddy:
    image: caddy:2-alpine
    container_name: caddy-proxy
    restart: unless-stopped
    depends_on:
      - nginx-gateway
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
      - caddy_config:/config
    networks:
      - app-network

volumes:
  caddy_data:
  caddy_config:
EOF
```

2) Create `Caddyfile` in the project root (replace `app.example.com` with your domain):
```bash
cat > Caddyfile << 'EOF'
app.example.com {
  encode gzip
  log {
    output stdout
  }
  reverse_proxy nginx-gateway:80
}

http://:80 {
  @notDomain host != app.example.com
  redir https://app.example.com{uri}
}
EOF
```

3) Open HTTPS in the firewall (if not already):
```bash
sudo ufw allow 443/tcp
```

4) Restart the stack (Compose auto-loads overrides):
```bash
docker compose up -d --build
```

5) Validate:
```bash
curl -I https://app.example.com/
curl -I https://app.example.com/api/
```

## Step 7 — Operations
- Check status: `docker compose ps`
- Tail logs (examples):
  - `docker compose logs -f nginx-gateway`
  - `docker compose logs -f api-gateway-service`
- Update code and rebuild:
  - `git pull origin deploy`
  - `docker compose up -d --build`
- Stop stack: `docker compose down`

## Step 8 — Backups (PostgreSQL)
- Backup:
```bash
docker exec -t postgres pg_dump -U appuser -d appdb > backup_$(date +%F).sql
```
- Restore:
```bash
cat backup_YYYY-MM-DD.sql | docker exec -i postgres psql -U appuser -d appdb
```

## Step 9 — Hardening basics
- Change default DB credentials in `docker-compose.yaml` or a private override before production.
- All services use `restart: unless-stopped` policy - they will automatically restart on failure or after system reboot.
- Keep ports 5432, 8080–8084, 8089 closed on the firewall/security group; access them only from inside the VPS or via SSH tunnel/VPN.
- Disable or restrict WireMock in production if not needed.
- All Nginx containers run as non-root user (`nginx`) for security, with proper permissions configured.

## Step 10 — Docker configuration details
The project has been configured with the following security and reliability features:
- **Nginx containers**: Run as non-privileged `nginx` user, with PID and temporary files in `/tmp` to avoid permission issues.
- **Restart policies**: All services automatically restart unless explicitly stopped.
- **Health checks**: All services have health checks to ensure they're running correctly.
- **Multi-stage builds**: Frontend and backend services use optimized multi-stage Docker builds.
- **Network isolation**: All services communicate through a dedicated Docker network (`app-network`).

## Step 11 — Troubleshooting
- Unhealthy service: `docker compose ps` then `docker compose logs -f <service>`.
- Port already in use: `sudo lsof -iTCP -sTCP:LISTEN -P | grep :80` and stop/adjust the conflicting service.
- TLS not issued: ensure the domain points to the server IP, ports 80/443 are open, and no other service binds those ports.
- 502/504: verify upstream services are healthy and reachable by name inside the network (e.g., `nginx-gateway` → `api-gateway-service:8080`).
- **Nginx permission errors**: If you see errors about `/run/nginx.pid` or `/var/cache/nginx`, this has been fixed by running Nginx as non-root user with temp files in `/tmp`.
- **Container won't start after reboot**: All services have `restart: unless-stopped`, so they should auto-start. Check `docker compose ps` and logs.

Done. Your app should now be reachable via HTTP or HTTPS depending on the chosen setup.