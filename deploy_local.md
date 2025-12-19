# Локальный запуск проекта (Windows)

Этот файл описывает быстрый и надёжный способ запустить весь проект локально на Windows с помощью Docker Compose.

## Предпосылки
- Docker Desktop (WSL2 backend включён).
- Рекомендуется: 16+ GB RAM, свободные порты 80, 5432, 3001, 8080–8084, 8089.
- (Опционально для разработки фронтенда) Node.js 18+.

## Быстрый старт (всё в Docker)
1. Откройте терминал PowerShell в папке `deploy`.
2. Постройте и запустите весь стек:

```powershell
# из папки deploy
docker compose up -d --build
```

3. Проверьте состояние контейнеров:

```powershell
docker compose ps
docker compose logs -f nginx-gateway
```

4. Откройте приложение: http://localhost

## Что поднимается
- Postgres: `localhost:5432`, БД `appdb`, пользователь `appuser`, пароль `apppassword`.
- WireMock: http://localhost/wiremock/ (через шлюз) и напрямую http://localhost:8089/.
- API Gateway: через шлюз по адресу http://localhost/api/ и напрямую http://localhost:8080/.
- Сервисы:
  - `auth-trucking-service` — http://localhost:8081/ (внутри 8080)
  - `daily-status-update-service` — http://localhost:8082/ (внутри 8080)
  - `match-service` — http://localhost:8083/ (внутри 8080)
  - `simple-auth-trucking-service` — http://localhost:8084/ (внутри 8080)
- Frontend (статический билд в контейнере): доступен через шлюз http://localhost и напрямую http://localhost:3001/.

Маршрутизация реализована Nginx-шлюзом из [nginx-gateway.conf](nginx-gateway.conf):
- `/` → `frontend-service`
- `/api/` → `api-gateway-service`
- `/wiremock/` → `wiremock`

## Инициализация данных (seed)
Если нужно загрузить начальные данные из [seed_data.sql](seed_data.sql):

```powershell
# скопировать файл внутрь контейнера Postgres
docker compose cp seed_data.sql postgres:/tmp/seed_data.sql

# применить скрипт
docker compose exec postgres psql -U appuser -d appdb -f /tmp/seed_data.sql
```

## Полезные команды
```powershell
# Пересобрать конкретный сервис
docker compose up -d --build frontend-service

# Смотреть логи сервиса
docker compose logs -f api-gateway-service

# Остановить всё
docker compose down

# Полностью очистить данные БД (внимание: удаление volume)
docker compose down -v
```

## Локальная разработка фронтенда (опционально)
Основной способ — работать через Docker. Для режима разработки Vite можно временно остановить контейнер фронтенда и запустить dev‑сервер локально:

```powershell
# остановить контейнер фронтенда, чтобы освободить порт 3001
docker compose stop frontend-service

# запустить dev‑сервер Vite
cd frontend-service
$env:VITE_API_BASE_URL = "http://localhost"  # использовать шлюз на 80
npm ci
npm run dev
```

- Откройте http://localhost:3001.
- Если браузер блокирует запросы к API из-за CORS, продолжайте использовать полный Docker‑стек (http://localhost) или добавьте proxy в `vite.config.ts` (настройка `server.proxy` к `http://localhost:8080`).

## Типичные проблемы и решения
- Порт 80 занят (IIS/другие службы):
  - Откройте приложение на другом порту, изменив в [docker-compose.yaml](docker-compose.yaml) маппинг для `nginx-gateway` на `"8080:80"`, и заходите на http://localhost:8080.
- Порт 3001 занят: остановите `frontend-service` или измените порт в [vite.config.ts](frontend-service/vite.config.ts#L33-L36).
- Службы долго становятся здоровыми: проверьте логи Postgres (`docker compose logs -f postgres`) и API (`docker compose logs -f api-gateway-service`).
- Очистка состояния БД: `docker compose down -v`, затем снова `up --build`.

## Дополнительно (Maven/Java)
Для локальной сборки из исходников вне Docker это не требуется, но возможно:

```powershell
# из корня deploy
# собрать артефакты всех модулей без тестов
./mvnw.cmd -q -DskipTests package
```

Версия Java: 17 (см. [pom.xml](pom.xml)).

---
Готово! Откройте http://localhost и проверьте разделы — UI должен работать, а API доступен по `/api/`.