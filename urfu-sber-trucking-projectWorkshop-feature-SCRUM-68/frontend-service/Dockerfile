# ====== STAGE 1: Build (Node) ======
FROM node:18-alpine AS build

WORKDIR /app

# Ускоряем установку зависимостей за счёт кеша
COPY package*.json ./
RUN npm ci

# Копируем исходники
COPY . .

# Билдим Vite-приложение (по умолчанию в папку dist)
RUN npm run build

# ====== STAGE 2: Runtime (nginx) ======
FROM nginx:alpine

# Удаляем дефолтный конфиг и добавляем свой
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Копируем статический билд
# В Vite outDir сконфигурирован как "build" (vite.config.ts), поэтому копируем из /app/build
COPY --from=build /app/build /usr/share/nginx/html

# ====== ВАЖНО: Настраиваем права ======
# Создаем необходимые директории для nginx с правильными правами
RUN mkdir -p /var/cache/nginx/client_temp \
    /var/cache/nginx/proxy_temp \
    /var/cache/nginx/fastcgi_temp \
    /var/cache/nginx/uwsgi_temp \
    /var/cache/nginx/scgi_temp \
    /var/run

# Устанавливаем правильные права на все директории nginx
RUN chown -R nginx:nginx /var/cache/nginx \
    && chown -R nginx:nginx /var/run \
    && chown -R nginx:nginx /usr/share/nginx/html \
    && chmod -R 755 /var/cache/nginx \
    && chmod -R 755 /var/run \
    && chmod -R 755 /usr/share/nginx/html

# Переключаемся на пользователя nginx (UID 101 в alpine)
USER nginx

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
