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

# Создаем кастомный nginx.conf для работы от непривилегированного пользователя
RUN printf 'worker_processes auto;\n\
pid /tmp/nginx.pid;\n\
error_log /var/log/nginx/error.log warn;\n\
\n\
events {\n\
    worker_connections 1024;\n\
}\n\
\n\
http {\n\
    client_body_temp_path /tmp/client_temp;\n\
    proxy_temp_path /tmp/proxy_temp;\n\
    fastcgi_temp_path /tmp/fastcgi_temp;\n\
    uwsgi_temp_path /tmp/uwsgi_temp;\n\
    scgi_temp_path /tmp/scgi_temp;\n\
\n\
    include /etc/nginx/mime.types;\n\
    default_type application/octet-stream;\n\
\n\
    sendfile on;\n\
    keepalive_timeout 65;\n\
\n\
    include /etc/nginx/conf.d/*.conf;\n\
}' > /etc/nginx/nginx.conf

# Удаляем дефолтный конфиг и добавляем свой server block
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Копируем статический билд
# В Vite outDir сконфигурирован как "build" (vite.config.ts), поэтому копируем из /app/build
COPY --from=build /app/build /usr/share/nginx/html

# ====== ВАЖНО: Настраиваем права ======
# Создаем директории для временных файлов nginx в /tmp
RUN mkdir -p /tmp/client_temp /tmp/proxy_temp /tmp/fastcgi_temp /tmp/uwsgi_temp /tmp/scgi_temp \
    && chown -R nginx:nginx /tmp/client_temp /tmp/proxy_temp /tmp/fastcgi_temp /tmp/uwsgi_temp /tmp/scgi_temp \
    && chown -R nginx:nginx /var/cache/nginx \
    && chown -R nginx:nginx /usr/share/nginx/html \
    && chmod -R 755 /tmp/client_temp /tmp/proxy_temp /tmp/fastcgi_temp /tmp/uwsgi_temp /tmp/scgi_temp

# Запускаем от непривилегированного пользователя nginx для безопасности
USER nginx

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
