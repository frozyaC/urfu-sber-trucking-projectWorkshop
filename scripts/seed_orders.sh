#!/usr/bin/env bash
set -euo pipefail

# Скрипт создаёт 10 заказов по Свердловской области через публичный API фронта
# и частично проставляет статус "Назначен водитель" для выбранных заказов.
# Требования: bash, curl, jq.

BASE_URL=${BASE_URL:-"http://193.108.114.95"}
CREATE_ENDPOINT="$BASE_URL/api/orders/create"
STATUS_ENDPOINT="$BASE_URL/api/orders"

# Данные заказов. Поля соответствуют форме фронта (/api/orders/create).
read -r -d '' ORDERS_JSON <<'EOF'
[
  {
    "shipperName": "ООО УралЛогистика",
    "managerName": "Анна Смирнова",
    "origin": "Екатеринбург, ул. Малышева, 51",
    "destination": "Первоуральск, ул. Ватутина, 10",
    "pickupDate": "2025-12-18",
    "deliveryDate": "2025-12-19",
    "pickupTime": "09:00",
    "deliveryTime": "14:00",
    "transportationCost": 54000,
    "vehicleCount": 1,
    "trailerType": "Тент",
    "cargoType": "Промтовары",
    "specialRequirements": "Боковая погрузка",
    "volume": 12,
    "weight": 6,
    "driver": "Иванов А.А."
  },
  {
    "shipperName": "АО СвердТранс",
    "managerName": "Николай Орлов",
    "origin": "Екатеринбург, Химмаш",
    "destination": "Берёзовский, ул. Советская, 25",
    "pickupDate": "2025-12-18",
    "deliveryDate": "2025-12-19",
    "pickupTime": "11:00",
    "deliveryTime": "16:00",
    "transportationCost": 42000,
    "vehicleCount": 1,
    "trailerType": "Изотерм",
    "cargoType": "Продукты",
    "specialRequirements": "Температура +4C",
    "volume": 8,
    "weight": 4,
    "driver": "Петров В.В."
  },
  {
    "shipperName": "ООО УралСтрой",
    "managerName": "Сергей Ковалёв",
    "origin": "Екатеринбург, Уктус",
    "destination": "Верхняя Пышма, Заводская 3",
    "pickupDate": "2025-12-19",
    "deliveryDate": "2025-12-19",
    "pickupTime": "08:30",
    "deliveryTime": "12:00",
    "transportationCost": 38000,
    "vehicleCount": 1,
    "trailerType": "Борт",
    "cargoType": "Металлопрокат",
    "specialRequirements": "Краны нет",
    "volume": 10,
    "weight": 7
  },
  {
    "shipperName": "ООО Северный Лес",
    "managerName": "Елена Романова",
    "origin": "Новоуральск",
    "destination": "Екатеринбург, Сортировка",
    "pickupDate": "2025-12-19",
    "deliveryDate": "2025-12-20",
    "pickupTime": "10:00",
    "deliveryTime": "15:00",
    "transportationCost": 51000,
    "vehicleCount": 1,
    "trailerType": "Тент",
    "cargoType": "Пиломатериалы",
    "specialRequirements": "Стяжные ремни",
    "volume": 20,
    "weight": 15,
    "driver": "Сидоров Д.Д."
  },
  {
    "shipperName": "ПАО УралЭнерго",
    "managerName": "Инна Белова",
    "origin": "Екатеринбург, Академический",
    "destination": "Ревда",
    "pickupDate": "2025-12-20",
    "deliveryDate": "2025-12-21",
    "pickupTime": "12:00",
    "deliveryTime": "18:00",
    "transportationCost": 46000,
    "vehicleCount": 1,
    "trailerType": "Тент",
    "cargoType": "Электрооборудование",
    "specialRequirements": "Без ударов",
    "volume": 9,
    "weight": 3.5
  },
  {
    "shipperName": "ООО СтройГруз",
    "managerName": "Павел Миронов",
    "origin": "Екатеринбург, Широкая Речка",
    "destination": "Арамиль",
    "pickupDate": "2025-12-20",
    "deliveryDate": "2025-12-20",
    "pickupTime": "13:00",
    "deliveryTime": "17:00",
    "transportationCost": 27000,
    "vehicleCount": 1,
    "trailerType": "Борт",
    "cargoType": "Сыпучие",
    "specialRequirements": "Под тентом",
    "volume": 15,
    "weight": 10
  },
  {
    "shipperName": "АО УралМед",
    "managerName": "Мария Крылова",
    "origin": "Екатеринбург, Центр",
    "destination": "Сысерть",
    "pickupDate": "2025-12-21",
    "deliveryDate": "2025-12-21",
    "pickupTime": "09:30",
    "deliveryTime": "12:30",
    "transportationCost": 30000,
    "vehicleCount": 1,
    "trailerType": "Изотерм",
    "cargoType": "Мед оборудование",
    "specialRequirements": "Без встрясок",
    "volume": 6,
    "weight": 2.2,
    "driver": "Кузнецов Е.Е."
  },
  {
    "shipperName": "ООО Логистик Плюс",
    "managerName": "Дмитрий Егоров",
    "origin": "Екатеринбург, Эльмаш",
    "destination": "Красноуральск",
    "pickupDate": "2025-12-21",
    "deliveryDate": "2025-12-22",
    "pickupTime": "07:00",
    "deliveryTime": "16:00",
    "transportationCost": 82000,
    "vehicleCount": 1,
    "trailerType": "Реф",
    "cargoType": "Продукты",
    "specialRequirements": "+2C",
    "volume": 18,
    "weight": 12
  },
  {
    "shipperName": "ООО УралФарм",
    "managerName": "Татьяна Сафронова",
    "origin": "Екатеринбург, Ботаника",
    "destination": "Каменск-Уральский",
    "pickupDate": "2025-12-22",
    "deliveryDate": "2025-12-22",
    "pickupTime": "10:30",
    "deliveryTime": "15:30",
    "transportationCost": 39000,
    "vehicleCount": 1,
    "trailerType": "Изотерм",
    "cargoType": "Фарма",
    "specialRequirements": "+8C",
    "volume": 7,
    "weight": 3
  },
  {
    "shipperName": "АО УралСнаб",
    "managerName": "Владислав Нестеров",
    "origin": "Екатеринбург, ВИЗ",
    "destination": "Полевской",
    "pickupDate": "2025-12-22",
    "deliveryDate": "2025-12-23",
    "pickupTime": "14:00",
    "deliveryTime": "19:00",
    "transportationCost": 41000,
    "vehicleCount": 1,
    "trailerType": "Тент",
    "cargoType": "Комплектующие",
    "specialRequirements": "Гидроборт",
    "volume": 11,
    "weight": 5.5,
    "driver": "Лебедев Р.Р."
  }
]
EOF

# Создание заказов и частичное назначение водителей.
echo "Создаём заказы через $CREATE_ENDPOINT"
echo "$ORDERS_JSON" | jq -c '.[]' | while read -r order; do
  driver=$(echo "$order" | jq -r 'select(.driver!=null) | .driver')
  body=$(echo "$order" | jq 'del(.driver)')

  resp=$(curl -s -X POST "$CREATE_ENDPOINT" \
    -H "Content-Type: application/json" \
    -d "$body")

  ok=$(echo "$resp" | jq -r '.order.id // .order?.id // empty')
  if [[ -z "$ok" ]]; then
    echo "[FAIL] $(echo "$order" | jq -r '.shipperName') -> $(echo "$resp" | jq -r '.message // .error // .')"
    continue
  fi

  orderId=$ok
  echo "[OK] id=$orderId shipper=$(echo "$order" | jq -r '.shipperName')"

  if [[ -n "$driver" ]]; then
    statusPayload=$(jq -n --arg s "Назначен водитель: $driver" '{status:$s}')
    curl -s -X PATCH "$STATUS_ENDPOINT/$orderId/status" \
      -H "Content-Type: application/json" \
      -d "$statusPayload" >/dev/null && \
      echo "  -> статус обновлён: $driver"
  fi

done

echo "Готово."
