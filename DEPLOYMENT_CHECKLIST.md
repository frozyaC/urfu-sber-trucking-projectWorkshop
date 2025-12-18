# Deployment Checklist

Use this checklist to ensure your deployment is properly configured and secure.

## Pre-Deployment Verification

### 1. Docker Configuration ✅
- [x] All Dockerfiles use multi-stage builds
- [x] Nginx containers configured to run as non-root user
- [x] All services have health checks defined
- [x] All services have `restart: unless-stopped` policy
- [x] `.dockerignore` files present for all services
- [x] Temporary files configured to use `/tmp` in nginx containers

### 2. Network & Ports
- [ ] Review exposed ports in `docker-compose.yaml`
- [ ] Plan firewall rules (only 80/443 public, rest internal)
- [ ] DNS A record configured (if using domain)
- [ ] SSL certificate strategy decided (Let's Encrypt via Caddy recommended)

### 3. Security Configuration
- [ ] Change default PostgreSQL credentials in `docker-compose.yaml`:
  ```yaml
  POSTGRES_DB: <your-db-name>
  POSTGRES_USER: <your-db-user>
  POSTGRES_PASSWORD: <strong-password>
  ```
- [ ] Update DB credentials in all service environment variables
- [ ] Review WireMock necessity for production (consider disabling)
- [ ] Ensure sensitive files not committed to git (.env, secrets)

### 4. Server Preparation
- [ ] Ubuntu 24.04 LTS VPS provisioned
- [ ] SSH access configured
- [ ] Sudo privileges verified
- [ ] Public IP address noted
- [ ] Firewall (UFW) ready to configure

## Deployment Steps

### Step 1: System Setup
```bash
# Update system
sudo apt update && sudo apt -y upgrade
sudo apt -y install curl ca-certificates gnupg git ufw

# Configure firewall
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp  # if using HTTPS
sudo ufw enable
sudo ufw status
```
- [ ] System updated
- [ ] Firewall configured
- [ ] Required packages installed

### Step 2: Docker Installation
```bash
# Install Docker
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
newgrp docker

# Verify installation
docker --version
docker compose version
```
- [ ] Docker installed
- [ ] Docker Compose available
- [ ] Current user added to docker group

### Step 3: Application Deployment
```bash
# Clone repository
sudo mkdir -p /opt/app && sudo chown -R $USER:$USER /opt/app
cd /opt/app
git clone -b deploy https://github.com/frozyaC/urfu-sber-trucking-projectWorkshop.git trucking-app
cd trucking-app

# Build and start services
docker compose up -d --build

# Verify all services are running
docker compose ps
```
- [ ] Repository cloned
- [ ] All images built successfully
- [ ] All containers started
- [ ] All containers healthy (check with `docker compose ps`)

### Step 4: Verification
```bash
# Test HTTP access
curl -I http://<your-server-ip>/
curl -I http://<your-server-ip>/api/

# Check logs for errors
docker compose logs -f nginx-gateway
docker compose logs -f api-gateway-service
docker compose logs -f frontend-service
```
- [ ] HTTP endpoint responds (200 OK)
- [ ] API endpoint accessible
- [ ] No errors in logs
- [ ] Frontend loads in browser

### Step 5: HTTPS Setup (Optional but Recommended)
```bash
# Create docker-compose.override.yaml and Caddyfile
# (see deploy.md Step 6 for details)

# Restart with HTTPS
docker compose up -d --build

# Verify HTTPS
curl -I https://<your-domain>/
```
- [ ] Caddy configured
- [ ] HTTPS certificate obtained
- [ ] HTTPS endpoint responds
- [ ] HTTP redirects to HTTPS

## Post-Deployment

### 1. Monitoring
- [ ] Set up log monitoring strategy
- [ ] Configure alerts for container failures
- [ ] Document how to check service health

### 2. Backup Strategy
```bash
# Database backup
docker exec -t postgres pg_dump -U appuser -d appdb > backup_$(date +%F).sql
```
- [ ] Automated backup script created
- [ ] Backup schedule defined
- [ ] Backup restoration tested
- [ ] Backup storage location secured

### 3. Maintenance Procedures
- [ ] Document update procedure:
  ```bash
  cd /opt/app/trucking-app
  git pull origin deploy
  docker compose up -d --build
  ```
- [ ] Schedule regular security updates
- [ ] Plan for database migrations

### 4. Documentation
- [ ] Server access details documented (securely)
- [ ] DB credentials stored securely (password manager)
- [ ] Architecture diagram created
- [ ] Incident response plan documented

## Production Hardening

### Security
- [ ] Change all default passwords
- [ ] Restrict DB port access (only internal network)
- [ ] Disable WireMock or restrict access
- [ ] Configure rate limiting in nginx (if needed)
- [ ] Set up fail2ban for SSH protection
- [ ] Enable automatic security updates
- [ ] Review and minimize exposed ports

### Performance
- [ ] Review resource limits for containers
- [ ] Configure log rotation
- [ ] Set up CDN for static assets (if needed)
- [ ] Enable gzip compression in nginx (already enabled in Caddy)

### Reliability
- [ ] Test restart policies (`docker compose restart <service>`)
- [ ] Verify auto-start after reboot
- [ ] Test recovery from failures
- [ ] Document rollback procedure

## Troubleshooting Common Issues

### Container Won't Start
```bash
# Check logs
docker compose logs <service-name>

# Check resource usage
docker stats

# Verify configuration
docker compose config
```

### Permission Errors
```bash
# Verify nginx temp directories
docker exec frontend-service ls -la /tmp/

# Check file ownership
docker exec frontend-service whoami
```

### Network Issues
```bash
# Test internal connectivity
docker exec nginx-gateway wget -qO- http://frontend-service/
docker exec nginx-gateway wget -qO- http://api-gateway-service:8080/actuator/health

# Check network configuration
docker network inspect trucking-app_app-network
```

### Database Connection Issues
```bash
# Test DB connection
docker exec -it postgres psql -U appuser -d appdb -c '\conninfo'

# Check if backend can reach DB
docker exec api-gateway-service ping postgres
```

## Emergency Procedures

### Complete Restart
```bash
cd /opt/app/trucking-app
docker compose down
docker compose up -d
```

### Rollback to Previous Version
```bash
cd /opt/app/trucking-app
git log --oneline  # find previous commit hash
git checkout <commit-hash>
docker compose up -d --build
```

### Database Recovery
```bash
# Stop all services
docker compose down

# Start only DB
docker compose up -d postgres

# Restore backup
cat backup_YYYY-MM-DD.sql | docker exec -i postgres psql -U appuser -d appdb

# Start all services
docker compose up -d
```

## Success Criteria

Your deployment is successful when:
- ✅ All containers show "healthy" status in `docker compose ps`
- ✅ Application accessible via browser
- ✅ API endpoints responding correctly
- ✅ No errors in container logs
- ✅ Services auto-restart after failures
- ✅ HTTPS working (if configured)
- ✅ Database persists data after container restart
- ✅ Backups working and tested

## Additional Resources

- Main deployment guide: [deploy.md](deploy.md)
- Docker fixes documentation: [DOCKER_FIXES.md](DOCKER_FIXES.md)
- Project repository: https://github.com/frozyaC/urfu-sber-trucking-projectWorkshop
