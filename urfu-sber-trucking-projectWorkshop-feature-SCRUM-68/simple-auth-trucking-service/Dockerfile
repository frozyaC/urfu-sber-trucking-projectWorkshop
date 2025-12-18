# ====== STAGE 1: Build ======
FROM maven:3.8-openjdk-17 AS builder

WORKDIR /app

COPY pom.xml .
RUN mvn -B -q dependency:go-offline

COPY src ./src

RUN mvn -B -DskipTests clean package

# ====== STAGE 2: Runtime ======
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

RUN apk add --no-cache curl

COPY --from=builder /app/target/*.jar /app/app.jar

ENV JAVA_OPTS=""
ENV SPRING_DATASOURCE_URL="jdbc:postgresql://postgres:5432/appdb"
ENV SPRING_DATASOURCE_USERNAME="appuser"
ENV SPRING_DATASOURCE_PASSWORD="apppassword"
ENV WIREMOCK_BASE_URL="http://wiremock:8080"

EXPOSE 8080

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/app.jar"]
