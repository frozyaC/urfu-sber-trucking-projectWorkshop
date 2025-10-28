# Примеры API для работы с базой данных

## REST API эндпоинты для системы управления логистикой

---

## 1. Аутентификация

### POST /api/auth/login
**Вход в систему**

**Request:**
```json
{
  "inn": "7701234567",
  "password": "shipper123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "user": {
    "inn": "7701234567",
    "name": "Сергей Петров",
    "company": "ООО \"Металл-Строй\"",
    "userType": "shipper"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (401 Unauthorized):**
```json
{
  "success": false,
  "error": "Неверный логин или пароль"
}
```

---

### POST /api/auth/register
**Регистрация нового пользователя**

**Request:**
```json
{
  "inn": "7701234567",
  "password": "shipper123",
  "name": "Сергей Петров",
  "company": "ООО \"Металл-Строй\"",
  "userType": "shipper"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Пользователь успешно зарегистрирован",
  "user": {
    "inn": "7701234567",
    "name": "Сергей Петров",
    "company": "ООО \"Металл-Строй\"",
    "userType": "shipper"
  }
}
```

---

### POST /api/auth/logout
**Выход из системы**

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Успешный выход"
}
```

---

## 2. Заказы (Orders)

### GET /api/orders
**Получить список всех заказов**

**Query Parameters:**
- `status` - фильтр по статусу (optional)
- `shipperName` - фильтр по компании (optional)
- `page` - номер страницы (default: 1)
- `limit` - количество на странице (default: 50)

**Request:**
```
GET /api/orders?status=Ожидает&page=1&limit=10
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "shipperName": "ООО \"Металл-Строй\"",
      "managerName": "Сергей Петров",
      "origin": "Москва, Россия",
      "destination": "Санкт-Петербург, Россия",
      "originLatitude": "55.7558",
      "originLongitude": "37.6173",
      "destinationLatitude": "59.9343",
      "destinationLongitude": "30.3351",
      "trailerType": "Бортовой",
      "volume": "96 м³",
      "weight": "20,000 кг",
      "pickupDate": "2024-12-15",
      "pickupTime": "09:00",
      "deliveryDate": "2024-12-18",
      "deliveryTime": "15:00",
      "transportationCost": 45000,
      "status": "Ожидает",
      "cargoType": "Металлопрокат",
      "specialRequirements": "Требуется кран для погрузки",
      "length": "12",
      "width": "2.4",
      "height": "3.2",
      "assignedDriverId": null,
      "externalOrderNumber": "ATI-2024-001",
      "createdAt": "2024-12-10T10:00:00Z",
      "updatedAt": "2024-12-10T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "pages": 5
  }
}
```

---

### GET /api/orders/:id
**Получить детали заказа**

**Request:**
```
GET /api/orders/1
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "1",
    "shipperName": "ООО \"Металл-Строй\"",
    // ... все поля заказа
  }
}
```

**Response (404 Not Found):**
```json
{
  "success": false,
  "error": "Заказ не найден"
}
```

---

### POST /api/orders
**Создать новый заказ**

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request:**
```json
{
  "shipperName": "ООО \"Металл-Строй\"",
  "managerName": "Сергей Петров",
  "origin": "Москва, Россия",
  "destination": "Санкт-Петербург, Россия",
  "originLatitude": "55.7558",
  "originLongitude": "37.6173",
  "destinationLatitude": "59.9343",
  "destinationLongitude": "30.3351",
  "trailerType": "Бортовой",
  "volume": "96 м³",
  "weight": "20,000 кг",
  "pickupDate": "2024-12-15",
  "pickupTime": "09:00",
  "deliveryDate": "2024-12-18",
  "deliveryTime": "15:00",
  "transportationCost": 45000,
  "cargoType": "Металлопрокат",
  "specialRequirements": "Требуется кран для погрузки",
  "length": "12",
  "width": "2.4",
  "height": "3.2",
  "vehicleCount": 2
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Создано заказов: 2",
  "data": [
    {
      "id": "150",
      "status": "Ожидает",
      "assignedDriverId": null,
      // ... остальные поля
    },
    {
      "id": "151",
      "status": "Ожидает",
      "assignedDriverId": null,
      // ... остальные поля
    }
  ]
}
```

---

### PUT /api/orders/:id
**Обновить заказ**

**Request:**
```json
{
  "status": "Назначен",
  "assignedDriverId": "ВОД-001"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Заказ обновлен",
  "data": {
    "id": "1",
    "status": "Назначен",
    "assignedDriverId": "ВОД-001",
    // ... остальные поля
  }
}
```

---

### PATCH /api/orders/:id/address
**Обновить адрес в заказе**

**Request:**
```json
{
  "field": "origin",
  "address": "Москва, ул. Ленина, 10",
  "latitude": "55.7558",
  "longitude": "37.6173"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Адрес обновлен"
}
```

---

### PATCH /api/orders/:id/date
**Обновить дату в заказе**

**Request:**
```json
{
  "field": "pickup",
  "date": "2024-12-20",
  "time": "10:00"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Дата обновлена"
}
```

---

### DELETE /api/orders/:id
**Удалить заказ**

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Заказ удален"
}
```

---

## 3. Водители (Drivers)

### GET /api/drivers
**Получить список водителей**

**Query Parameters:**
- `availability` - фильтр по доступности (optional)

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "ВОД-001",
      "name": "Иван Петров",
      "phone": "+7 (495) 123-45-67",
      "licenseNumber": "ВУ-77-123456",
      "availability": "Доступен",
      "comment": "Опытный водитель, специализируется на металлопрокате",
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-12-10T10:00:00Z"
    }
  ]
}
```

---

### POST /api/drivers
**Добавить нового водителя**

**Request:**
```json
{
  "name": "Алексей Сидоров",
  "phone": "+7 (812) 987-65-43",
  "licenseNumber": "ВУ-78-789012",
  "availability": "Доступен",
  "comment": ""
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Водитель добавлен",
  "data": {
    "id": "ВОД-003",
    "name": "Алексей Сидоров",
    // ... остальные поля
  }
}
```

---

### PUT /api/drivers/:id
**Обновить данные водителя**

**Request:**
```json
{
  "availability": "В рейсе",
  "comment": "Выполняет заказ №150"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Данные водителя обновлены"
}
```

---

## 4. Тягачи (Trucks)

### GET /api/trucks
**Получить список тягачей**

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "АВТ-001",
      "make": "КАМАЗ",
      "model": "5490",
      "year": 2022,
      "licensePlate": "М123АВ77",
      "vinNumber": "XTC5490NEO123456",
      "maintenanceStatus": "Исправен",
      "currentLocation": "Москва, Россия",
      "comment": "",
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-12-10T10:00:00Z"
    }
  ]
}
```

---

### POST /api/trucks
**Добавить новый тягач**

**Request:**
```json
{
  "make": "МАЗ",
  "model": "6312",
  "year": 2021,
  "licensePlate": "В456СД78",
  "vinNumber": "Y3MAZ6312CJ789012",
  "maintenanceStatus": "Исправен",
  "currentLocation": "Санкт-Петербург, Россия",
  "comment": ""
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Тягач добавлен",
  "data": {
    "id": "АВТ-003",
    // ... все поля
  }
}
```

---

## 5. Прицепы (Trailers)

### GET /api/trailers
**Получить список прицепов**

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "ПРЦ-001",
      "licensePlate": "АМ123477",
      "trailerType": "Бортовой",
      "length": "13.6",
      "width": "2.45",
      "height": "2.9",
      "volume": "96.7 м³",
      "comment": "",
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-12-10T10:00:00Z"
    }
  ]
}
```

---

### POST /api/trailers
**Добавить новый прицеп**

**Request:**
```json
{
  "licensePlate": "СК456778",
  "trailerType": "Контейнеровоз",
  "length": "12.2",
  "width": "2.45",
  "height": "2.7",
  "comment": ""
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Прицеп добавлен",
  "data": {
    "id": "ПРЦ-003",
    "volume": "80.7 м³",  // Рассчитывается автоматически
    // ... остальные поля
  }
}
```

---

## 6. Связки автопарка (Fleet Assignments)

### GET /api/fleet-assignments
**Получить список связок**

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "СВЗ-001",
      "driverId": "ВОД-001",
      "truckId": "АВТ-001",
      "trailerId": "ПРЦ-001",
      "assignedDate": "2024-01-15",
      "driver": {
        "name": "Иван Петров",
        "phone": "+7 (495) 123-45-67"
      },
      "truck": {
        "make": "КАМАЗ",
        "model": "5490",
        "licensePlate": "М123АВ77"
      },
      "trailer": {
        "trailerType": "Бортовой",
        "volume": "96.7 м³"
      }
    }
  ]
}
```

---

### POST /api/fleet-assignments
**Создать связку**

**Request:**
```json
{
  "driverId": "ВОД-001",
  "truckId": "АВТ-001",
  "trailerId": "ПРЦ-001",
  "assignedDate": "2024-12-10"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Связка создана",
  "data": {
    "id": "СВЗ-003",
    // ... все поля
  }
}
```

**Response (409 Conflict):**
```json
{
  "success": false,
  "error": "Водитель уже имеет активную связку"
}
```

---

### DELETE /api/fleet-assignments/:id
**Удалить связку**

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Связка удалена"
}
```

**Response (409 Conflict):**
```json
{
  "success": false,
  "error": "Невозможно удалить связку - водитель назначен на активные заказы"
}
```

---

## 7. Комментарии (Comments)

### GET /api/comments/company/:companyName
**Получить комментарий о компании**

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "companyName": "ООО \"Металл-Строй\"",
    "comment": "Надежный партнер, всегда оплачивают вовремя"
  }
}
```

---

### PUT /api/comments/company/:companyName
**Обновить комментарий о компании**

**Request:**
```json
{
  "comment": "Надежный партнер, всегда оплачивают вовремя. Предпочитают работать с проверенными водителями."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Комментарий обновлен"
}
```

---

### PUT /api/comments/manager/:managerName
**Обновить комментарий о менеджере**

**Request:**
```json
{
  "comment": "Предпочитает связь по WhatsApp, не звонить после 18:00"
}
```

---

### PUT /api/comments/order/:orderId
**Обновить комментарий о заказе**

**Request:**
```json
{
  "comment": "Груз требует особой осторожности при погрузке. Клиент просил позвонить за час до прибытия."
}
```

---

## 8. Информация о менеджерах (Manager Info)

### GET /api/managers/:managerName
**Получить информацию о менеджере**

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "managerName": "Сергей Петров",
    "phone": "+7 (495) 123-45-67",
    "email": "sergey.petrov@metallstroy.ru"
  }
}
```

---

## 9. Подбор транспорта (Transport Suggestions)

### GET /api/orders/:orderId/transport-suggestions
**Получить рекомендации транспорта для заказа**

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "СВЗ-001",
      "driverId": "ВОД-001",
      "driverName": "Иван Петров",
      "driverPhone": "+7 (495) 123-45-67",
      "truckModel": "КАМАЗ 5490",
      "truckYear": 2022,
      "trailerType": "Бортовой",
      "capacity": "96.7 м³",
      "location": "Москва, Россия",
      "estimatedArrival": "В городе",
      "matchScore": 95
    },
    {
      "id": "СВЗ-002",
      "driverName": "Алексей Сидоров",
      "trailerType": "Бортовой",
      "matchScore": 70,
      // ... остальные поля
    }
  ]
}
```

---

## 10. Статистика

### GET /api/statistics/orders
**Получить статистику по заказам**

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "total": 150,
    "byStatus": {
      "Ожидает": 45,
      "Назначен": 30,
      "В пути": 25,
      "Доставлен": 50
    },
    "revenue": {
      "total": 6750000,
      "thisMonth": 450000
    }
  }
}
```

---

## Коды ошибок

| Код | Описание |
|-----|----------|
| 200 | OK - успешный запрос |
| 201 | Created - ресурс создан |
| 400 | Bad Request - неверные данные |
| 401 | Unauthorized - не авторизован |
| 403 | Forbidden - доступ запрещен |
| 404 | Not Found - ресурс не найден |
| 409 | Conflict - конфликт данных |
| 500 | Internal Server Error - ошибка сервера |

---

## Примеры запросов на разных языках

### JavaScript (Fetch API)

```javascript
// Вход в систему
const login = async (inn, password) => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ inn, password }),
  });
  
  const data = await response.json();
  
  if (data.success) {
    localStorage.setItem('token', data.token);
    return data.user;
  } else {
    throw new Error(data.error);
  }
};

// Получить заказы
const getOrders = async (filters = {}) => {
  const token = localStorage.getItem('token');
  const queryString = new URLSearchParams(filters).toString();
  
  const response = await fetch(`/api/orders?${queryString}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  return await response.json();
};

// Создать заказ
const createOrder = async (orderData) => {
  const token = localStorage.getItem('token');
  
  const response = await fetch('/api/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(orderData),
  });
  
  return await response.json();
};
```

---

### Python (requests)

```python
import requests

BASE_URL = 'https://api.logistics.example.com'

# Вход в систему
def login(inn, password):
    response = requests.post(
        f'{BASE_URL}/api/auth/login',
        json={'inn': inn, 'password': password}
    )
    data = response.json()
    
    if data['success']:
        return data['token'], data['user']
    else:
        raise Exception(data['error'])

# Получить заказы
def get_orders(token, filters=None):
    headers = {'Authorization': f'Bearer {token}'}
    response = requests.get(
        f'{BASE_URL}/api/orders',
        headers=headers,
        params=filters
    )
    return response.json()

# Создать заказ
def create_order(token, order_data):
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    response = requests.post(
        f'{BASE_URL}/api/orders',
        headers=headers,
        json=order_data
    )
    return response.json()
```

---

### cURL

```bash
# Вход в систему
curl -X POST https://api.logistics.example.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"inn":"7701234567","password":"shipper123"}'

# Получить заказы
curl https://api.logistics.example.com/api/orders \
  -H "Authorization: Bearer {token}"

# Создать заказ
curl -X POST https://api.logistics.example.com/api/orders \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d @order.json
```

---

## WebSocket для real-time обновлений

### Подключение

```javascript
const ws = new WebSocket('wss://api.logistics.example.com/ws');

ws.onopen = () => {
  // Аутентификация
  ws.send(JSON.stringify({
    type: 'auth',
    token: localStorage.getItem('token')
  }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  
  switch (message.type) {
    case 'order.created':
      console.log('Новый заказ:', message.data);
      break;
    case 'order.updated':
      console.log('Заказ обновлен:', message.data);
      break;
    case 'driver.assigned':
      console.log('Водитель назначен:', message.data);
      break;
  }
};
```

### События

- `order.created` - создан новый заказ
- `order.updated` - обновлен заказ
- `order.deleted` - удален заказ
- `driver.assigned` - назначен водитель
- `status.changed` - изменен статус заказа

---

**Примечание:** Все примеры API являются рекомендациями на основе прототипа. Конкретная реализация может отличаться в зависимости от требований проекта.
