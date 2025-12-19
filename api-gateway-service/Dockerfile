# ====== STAGE 1: Build ======
FROM maven:3.8-openjdk-17 AS builder

WORKDIR /app

# Сначала только pom.xml для кеша зависимостей
COPY pom.xml .
RUN mvn -B -q dependency:go-offline

# Затем весь исходный код
COPY src ./src

RUN mvn -B -DskipTests clean package

# ====== STAGE 2: Runtime ======
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Добавим curl для healthcheck (опционально)
RUN apk add --no-cache curl

# Копируем готовый jar (предполагается один fat-jar в target)
COPY --from=builder /app/target/*.jar /app/app.jar

ENV JAVA_OPTS=""
# Настройки базы и wiremock — можно переопределить через docker-compose
ENV SPRING_DATASOURCE_URL="jdbc:postgresql://postgres:5432/appdb"
ENV SPRING_DATASOURCE_USERNAME="appuser"
ENV SPRING_DATASOURCE_PASSWORD="apppassword"
ENV WIREMOCK_BASE_URL="http://wiremock:8080"

EXPOSE 8080

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/app.jar"]
