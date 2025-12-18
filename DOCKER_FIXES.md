# Docker Configuration Fixes

This document describes the security and reliability improvements made to the Docker setup.

## ✅ Fixed Issues

### 1. Nginx Permission Problems (CRITICAL)
**Problem:** Nginx containers couldn't write to `/run/nginx.pid` and `/var/cache/nginx` when running as non-root user.

**Solution:**
- Modified `frontend-service/Dockerfile` to:
  - Create custom `/etc/nginx/nginx.conf` with proper settings for non-root execution
  - Set PID file location to `/tmp/nginx.pid` (writable by nginx user)
  - Set all temp paths to `/tmp/*` directories
  - Create and configure permissions for all temporary directories
  - Run container as `nginx` user (non-root)
  
- Modified `nginx-gateway` configuration:
  - Uses default nginx:alpine image which runs as root by default
  - Custom server block mounted to `/etc/nginx/conf.d/default.conf`
  - Inherits base nginx configuration that handles permissions correctly

**Files modified:**
- `frontend-service/Dockerfile`
- `frontend-service/nginx.conf`
- `nginx-gateway.conf`

### 2. Missing Restart Policies
**Problem:** Services wouldn't automatically restart after failures or system reboots.

**Solution:** Added `restart: unless-stopped` to all services in `docker-compose.yaml`:
- postgres
- wiremock
- api-gateway-service
- auth-trucking-service
- daily-status-update-service
- match-service
- simple-auth-trucking-service
- frontend-service
- nginx-gateway

### 3. Incorrect Deploy Instructions
**Problem:** Deploy guide suggested running `docker compose pull` for locally-built images.

**Solution:** Removed `docker compose pull` from step 5, as this command only works for pre-built registry images. All services are built locally with `docker compose up -d --build`.

## 🔒 Security Improvements

1. **Non-root execution**: Frontend nginx container runs as unprivileged `nginx` user
2. **Minimal permissions**: Only necessary directories have write access
3. **Isolated network**: All services communicate through dedicated `app-network`
4. **Health checks**: All services have proper health check configurations

## 📋 Configuration Details

### Frontend Nginx Configuration Structure

The frontend service now uses a two-layer nginx configuration:

1. **Main config** (`/etc/nginx/nginx.conf`): Created during Docker build
   - Defines global settings (user, worker_processes, events)
   - Sets PID file to `/tmp/nginx.pid`
   - Configures temp paths in `/tmp`
   - Includes all files from `/etc/nginx/conf.d/*.conf`

2. **Server block** (`/etc/nginx/conf.d/default.conf`): From `frontend-service/nginx.conf`
   - Contains only the server {} block
   - Defines routes and static file serving

### Nginx Gateway Configuration

The nginx-gateway uses the standard nginx:alpine image:
- Runs as root (safe for gateway proxy use case)
- Custom server block in `/etc/nginx/conf.d/default.conf`
- Proxies traffic to frontend-service and api-gateway-service

## 🐳 Docker Compose Best Practices Applied

1. ✅ Health checks for all services
2. ✅ Restart policies for production reliability
3. ✅ Explicit service dependencies with conditions
4. ✅ Named volumes for data persistence
5. ✅ Custom bridge network for isolation
6. ✅ Multi-stage builds for smaller images
7. ✅ Non-root users where possible
8. ✅ Read-only volume mounts for configs

## 🧪 Testing

To verify the fixes work correctly:

```bash
# Build and start all services
docker compose up -d --build

# Check all containers are running
docker compose ps

# Check nginx is running as correct user
docker exec frontend-service whoami
# Should output: nginx

# Verify nginx can write PID file
docker exec frontend-service ls -la /tmp/nginx.pid
# Should exist with nginx:nginx ownership

# Check all services restart automatically
docker compose restart frontend-service
docker compose ps
# Should show "Up" status after a few seconds

# View logs for any issues
docker compose logs -f frontend-service
docker compose logs -f nginx-gateway
```

## 📝 Migration Notes

If updating an existing deployment:

1. Pull latest code with fixes
2. Rebuild all images: `docker compose up -d --build`
3. Verify all services are healthy: `docker compose ps`
4. Check logs for any warnings: `docker compose logs`

No data migration needed - only configuration changes.

## 🔍 Troubleshooting

### Nginx won't start
```bash
# Check nginx configuration syntax
docker compose exec frontend-service nginx -t

# View detailed logs
docker compose logs frontend-service
```

### Permission denied errors
```bash
# Verify temp directories exist with correct ownership
docker compose exec frontend-service ls -la /tmp/

# Should see:
# drwxr-xr-x nginx nginx client_temp
# drwxr-xr-x nginx nginx proxy_temp
# etc.
```

### Services won't auto-restart
```bash
# Verify restart policy
docker inspect frontend-service | grep -i restart

# Should show: "RestartPolicy": {"Name": "unless-stopped"}
```

## 📚 References

- [Nginx Docker Official Docs](https://hub.docker.com/_/nginx)
- [Docker Compose File Reference](https://docs.docker.com/compose/compose-file/)
- [Running Nginx as Non-Root](https://docs.nginx.com/nginx/admin-guide/security-controls/securing-http-traffic-upstream/)
