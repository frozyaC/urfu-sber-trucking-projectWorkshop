# Схема базы данных - Система управления логистикой

## Логика комментариев в системе

**Ваше понимание частично верное, но есть нюансы:**

### Два типа комментариев:

1. **Встроенные комментарии** (поле `comment` в сущности):
   - Driver.comment
   - Truck.comment  
   - Trailer.comment
   - Хранятся непосредственно в записи сущности
   - Используются для служебных заметок о конкретном водителе/транспорте/прицепе

2. **Внешние комментарии** (отдельная структура Comments):
   - comments.companies[companyName] - комментарии о компаниях-грузоотправителях
   - comments.managers[managerName] - комментарии о менеджерах компаний
   - comments.orders[orderId] - комментарии о заказах
   - Хранятся в отдельной структуре с ключом = идентификатор сущности

**Важно:** Заказы НЕ имеют поля `comment` внутри Order. Комментарии к заказам хранятся в `comments.orders[orderId]`.

---

## Сущности системы

### 1. User (Пользователь)
**Назначение:** Учетные записи пользователей системы (грузоотправители и логисты)

| Поле | Тип | Обязательное | Уникальное | Описание |
|------|-----|--------------|------------|----------|
| inn | string | Да | Да (PK) | ИНН компании для идентификации |
| name | string | Да | Нет | ФИО пользователя |
| company | string | Да | Нет | Название компании |
| userType | enum | Да | Нет | Тип пользователя: 'shipper' \| 'logistician' |

**Примечания:**
- ИНН используется как первичный ключ и логин
- Пароль в прототипе не хранится, в реальной системе нужен hash пароля
- В прототипе было поле email, но оно заменено на inn

---

### 2. Order (Заказ)
**Назначение:** Заказы на перевозку грузов

| Поле | Тип | Обязательное | Уникальное | Описание |
|------|-----|--------------|------------|----------|
| id | string | Да | Да (PK) | Уникальный номер заказа (числовой в виде строки) |
| shipperName | string | Да | Нет | Название компании грузоотправителя |
| managerName | string | Нет | Нет | ФИО менеджера компании (опционально) |
| origin | string | Да | Нет | Адрес отправления (полный текстовый адрес) |
| destination | string | Да | Нет | Адрес назначения (полный текстовый адрес) |
| originLatitude | string | Нет | Нет | Широта точки отправления (опционально) |
| originLongitude | string | Нет | Нет | Долгота точки отправления (опционально) |
| destinationLatitude | string | Нет | Нет | Широта точки назначения (опционально) |
| destinationLongitude | string | Нет | Нет | Долгота точки назначения (опционально) |
| trailerType | string | Да | Нет | Тип прицепа (Бортовой, Рефрижератор, и т.д.) |
| volume | string | Да | Нет | Объем груза (формат: "96 м³") |
| weight | string | Да | Нет | Вес груза (формат: "20,000 кг") |
| pickupDate | string | Да | Нет | Дата погрузки (формат: YYYY-MM-DD) |
| pickupTime | string | Нет | Нет | Время погрузки (формат: HH:MM) |
| deliveryDate | string | Да | Нет | Дата доставки (формат: YYYY-MM-DD) |
| deliveryTime | string | Нет | Нет | Время доставки (формат: HH:MM) |
| transportationCost | number | Да | Нет | Стоимость перевозки (в рублях) |
| status | string | Да | Нет | Статус заказа (Ожидает, Назначен, В пути, и т.д.) |
| cargoType | string | Да | Нет | Тип груза (Металлопрокат, Металлолом, и т.д.) |
| specialRequirements | string | Нет | Нет | Особые требования к перевозке |
| length | string | Да | Нет | Длина груза в метрах |
| width | string | Да | Нет | Ширина груза в метрах |
| height | string | Да | Нет | Высота груза в метрах |
| assignedDriverId | string \| null | Нет | Нет | ID назначенного водителя (FK → Driver.id) |
| externalOrderNumber | string | Нет | Нет | Номер заказа на внешней площадке (ATI, CARGO и т.д.) |

**Связи:**
- `assignedDriverId` → Driver.id (Many-to-One, nullable)
- Комментарии хранятся в отдельной таблице Comments.orders

**Статусы заказа:**
- Ожидает - новый заказ без назначения
- Назначен - водитель назначен
- В пути - груз в процессе доставки
- Доставлен - груз доставлен
- Отменен - заказ отменен (черный цвет в UI)

**Бизнес-логика:**
- ID автоинкрементный (максимальный ID + 1)
- При создании vehicleCount > 1 создается несколько копий заказа
- Координаты опциональны, используются для подбора транспорта
- Объем рассчитывается как length × width × height

---

### 3. Driver (Водитель)
**Назначение:** Водители транспортных средств

| Поле | Тип | Обязательное | Уникальное | Описание |
|------|-----|--------------|------------|----------|
| id | string | Да | Да (PK) | Уникальный идентификатор (формат: ВОД-XXX) |
| name | string | Да | Нет | ФИО водителя |
| phone | string | Да | Нет | Телефон для связи (формат: +7 (XXX) XXX-XX-XX) |
| licenseNumber | string | Да | Да | Номер водительского удостоверения (формат: ВУ-XX-XXXXXX) |
| availability | enum | Да | Нет | Статус доступности |
| comment | string | Нет | Нет | Служебные комментарии о водителе |

**Статусы доступности (availability):**
- Доступен - готов к новым заказам
- В рейсе - выполняет заказ
- На ТО - на техническом обслуживании
- Не работает - временно недоступен

**Связи:**
- Используется в FleetAssignment (связка водитель-тягач-прицеп)
- Может быть назначен на Order через assignedDriverId

**Примечания:**
- Поле rating было удалено в процессе рефакторинга
- ID генерируется с префиксом ВОД-

---

### 4. Truck (Тягач/Грузовик)
**Назначение:** Тягачи (головные транспортные средства)

| Поле | Тип | Обязательное | Уникальное | Описание |
|------|-----|--------------|------------|----------|
| id | string | Да | Да (PK) | Уникальный идентификатор (формат: АВТ-XXX) |
| make | string | Да | Нет | Марка (КАМАЗ, МАЗ, и т.д.) |
| model | string | Да | Нет | Модель тягача |
| year | number | Да | Нет | Год выпуска (целое число) |
| licensePlate | string | Да | Да | Государственный регистрационный номер |
| vinNumber | string | Да | Да | VIN номер (Vehicle Identification Number) |
| maintenanceStatus | enum | Да | Нет | Статус технического обслуживания |
| currentLocation | string | Да | Нет | Текущее местоположение (город, страна) |
| comment | string | Нет | Нет | Служебные комментарии о тягаче |

**Статусы ТО (maintenanceStatus):**
- Исправен - готов к эксплуатации
- Требует ТО - скоро требуется обслуживание
- На ТО - в процессе обслуживания

**Связи:**
- Используется в FleetAssignment

**Примечания:**
- currentLocation используется в алгоритме подбора транспорта
- licensePlate и vinNumber должны быть уникальными в базе
- ID генерируется с префиксом АВТ-

---

### 5. Trailer (Прицеп)
**Назначение:** Прицепы для перевозки грузов

| Поле | Тип | Обязательное | Уникальное | Описание |
|------|-----|--------------|------------|----------|
| id | string | Да | Да (PK) | Уникальный идентификатор (формат: ПРЦ-XXX) |
| licensePlate | string | Да | Да | Государственный регистрационный номер |
| trailerType | string | Да | Нет | Тип прицепа (Бортовой, Рефрижератор, и т.д.) |
| length | string | Да | Нет | Длина в метрах |
| width | string | Да | Нет | Ширина в метрах |
| height | string | Да | Нет | Высота в метрах |
| volume | string | Да | Нет | Объем в м³ (рассчитывается автоматически) |
| comment | string | Нет | Нет | Служебные комментарии о прицепе |

**Типы прицепов (trailerType):**
- Бортовой
- Рефрижератор
- Контейнеровоз
- Тентованный
- Цистерна
- Самосвал
- Низкорамник

**Связи:**
- Используется в FleetAssignment

**Бизнес-логика:**
- volume = length × width × height (автоматический расчет)
- ID генерируется с префиксом ПРЦ-

---

### 6. FleetAssignment (Связка автопарка)
**Назначение:** Связывает водителя, тягач и прицеп в единую рабочую группу

| Поле | Тип | Обязательное | Уникальное | Описание |
|------|-----|--------------|------------|----------|
| id | string | Да | Да (PK) | Уникальный идентификатор связки (формат: СВЗ-XXX) |
| driverId | string | Да | Нет | ID водителя (FK → Driver.id) |
| truckId | string | Да | Нет | ID тягача (FK → Truck.id) |
| trailerId | string | Да | Нет | ID прицепа (FK → Trailer.id) |
| assignedDate | string | Да | Нет | Дата создания связки (формат: YYYY-MM-DD) |

**Связи:**
- `driverId` → Driver.id (Many-to-One)
- `truckId` → Truck.id (Many-to-One)
- `trailerId` → Trailer.id (Many-to-One)

**Уникальные ограничения:**
- Комбинация (driverId, truckId, trailerId) должна быть уникальной
- Один водитель может иметь только одну активную связку

**Бизнес-логика:**
- Используется для подбора транспорта к заказам
- При назначении водителя на заказ используется его FleetAssignment для определения транспорта
- ID генерируется с префиксом СВЗ-

---

### 7. Comments (Комментарии)
**Назначение:** Хранение комментариев к различным сущностям

#### 7.1 CompanyComment (Комментарии к компаниям)
| Поле | Тип | Обязательное | Уникальное | Описание |
|------|-----|--------------|------------|----------|
| companyName | string | Да | Да (PK) | Название компании |
| comment | string | Да | Нет | Текст комментария о компании |

#### 7.2 ManagerComment (Комментарии к менеджерам)
| Поле | Тип | Обязательное | Уникальное | Описание |
|------|-----|--------------|------------|----------|
| managerName | string | Да | Да (PK) | ФИО менеджера |
| comment | string | Да | Нет | Текст комментария о менеджере |

#### 7.3 OrderComment (Комментарии к заказам)
| Поле | Тип | Обязательное | Уникальное | Описание |
|------|-----|--------------|------------|----------|
| orderId | string | Да | Да (PK/FK) | ID заказа (FK → Order.id) |
| comment | string | Да | Нет | Текст комментария о заказе |

**Примечания:**
- В прототипе хранится как один объект Comments с тремя словарями
- В реальной БД рекомендуется создать три отдельные таблицы

---

### 8. ManagerInfo (Контактная информация менеджеров)
**Назначение:** Дополнительная контактная информация менеджеров

| Поле | Тип | Обязательное | Уникальное | Описание |
|------|-----|--------------|------------|----------|
| managerName | string | Да | Да (PK) | ФИО менеджера |
| phone | string | Да | Нет | Телефон менеджера |
| email | string | Да | Да | Email менеджера |

**Связи:**
- Связан с Order.managerName (по имени менеджера)

**Примечания:**
- В прототипе хранится как объект с ключом = managerName
- В реальной БД лучше создать отдельную таблицу Manager

---

## Дополнительные структуры данных (не хранятся в БД)

### TransportSuggestion (Рекомендация транспорта)
**Назначение:** Временная структура для отображения подходящих связок транспорта

| Поле | Тип | Описание |
|------|-----|----------|
| id | string | ID связки FleetAssignment |
| driverId | string | ID водителя |
| driverName | string | ФИО водителя |
| driverRating | number | Рейтинг водителя (не используется, устаревшее) |
| driverPhone | string | Телефон водителя |
| truckModel | string | Марка/модель тягача |
| truckYear | number | Год выпуска тягача |
| trailerType | string | Тип прицепа |
| capacity | string | Вместимость прицепа |
| location | string | Текущее местоположение |
| estimatedArrival | string | Оценка времени прибытия |
| completedTrips | number | Количество поездок (не используется) |
| matchScore | number | Оценка соответствия заказу (0-100) |
| specialEquipment | string[] | Спецоборудование (не используется) |

**Примечания:**
- Генерируется динамически на основе FleetAssignment
- Не хранится в БД
- matchScore рассчитывается на основе совпадения типа прицепа и близости местоположения

---

## Индексы и оптимизация

### Рекомендуемые индексы:

**Order:**
- PRIMARY KEY: id
- INDEX: status
- INDEX: assignedDriverId
- INDEX: shipperName
- INDEX: (pickupDate, deliveryDate)
- INDEX: (originLatitude, originLongitude) - для геопоиска
- INDEX: (destinationLatitude, destinationLongitude) - для геопоиска

**Driver:**
- PRIMARY KEY: id
- UNIQUE INDEX: licenseNumber
- INDEX: availability
- INDEX: name

**Truck:**
- PRIMARY KEY: id
- UNIQUE INDEX: licensePlate
- UNIQUE INDEX: vinNumber
- INDEX: maintenanceStatus
- INDEX: currentLocation

**Trailer:**
- PRIMARY KEY: id
- UNIQUE INDEX: licensePlate
- INDEX: trailerType

**FleetAssignment:**
- PRIMARY KEY: id
- UNIQUE INDEX: (driverId, truckId, trailerId)
- INDEX: driverId
- INDEX: truckId
- INDEX: trailerId

**Comments:**
- PRIMARY KEY: companyName / managerName / orderId

**ManagerInfo:**
- PRIMARY KEY: managerName
- UNIQUE INDEX: email

---

## Бизнес-правила и ограничения

### Order:
1. pickupDate должна быть раньше или равна deliveryDate
2. status по умолчанию = "Ожидает"
3. assignedDriverId = null для новых заказов
4. transportationCost должна быть > 0
5. length, width, height должны быть > 0
6. При создании нескольких заказов (vehicleCount > 1) каждый получает уникальный ID

### Driver:
1. При изменении availability на "В рейсе" должен быть назначен хотя бы на один Order
2. При изменении availability на "Доступен" все назначенные Orders должны быть завершены
3. phone должен соответствовать формату: +7 (XXX) XXX-XX-XX

### Truck:
1. year должен быть между 1990 и текущим годом
2. При maintenanceStatus = "На ТО" тягач не может быть назначен на заказы
3. licensePlate должен соответствовать российскому формату

### Trailer:
1. volume = length × width × height
2. length, width, height должны быть положительными числами

### FleetAssignment:
1. Один водитель может иметь только одну активную связку
2. Один тягач может быть только в одной связке
3. Один прицеп может быть только в одной связке
4. При создании связки все три сущности должны существовать
5. При удалении связки проверить, что водитель не назначен на активные заказы

---

## Форматы данных

### Даты:
- Формат хранения: YYYY-MM-DD (ISO 8601)
- Пример: "2024-12-15"

### Время:
- Формат: HH:MM (24-часовой формат)
- Пример: "09:00", "15:30"

### Телефоны:
- Формат: +7 (XXX) XXX-XX-XX
- Пример: "+7 (495) 123-45-67"

### Email:
- Стандартный email формат
- Пример: "sergey.petrov@metallstroy.ru"

### Числовые значения с единицами:
- Вес: "20,000 кг" (с запятой как разделитель тысяч)
- Объем: "96 м³"
- Габариты: "12.4" (точка как десятичный разделитель, без единиц)

### ID форматы:
- Заказы: числовая строка ("1", "2", "3", ...)
- Водители: "ВОД-XXX"
- Тягачи: "АВТ-XXX"
- Прицепы: "ПРЦ-XXX"
- Связки: "СВЗ-XXX"

---

## Миграция и начальные данные

### Тестовые пользователи:
```
ИНН: demo, Пароль: demo
ИНН: 7701234567, Пароль: shipper123 (Грузоотправитель)
ИНН: 7709876543, Пароль: logist123 (Логист)
```

### Начальные заказы: 3 заказа (см. initialOrders в App.tsx)
### Начальные водители: 2 водителя (см. initialDrivers в App.tsx)
### Начальные тягачи: 2 тягача (см. initialTrucks в App.tsx)
### Начальные прицепы: 2 прицепа (см. initialTrailers в App.tsx)
### Начальные связки: 2 связки (см. initialFleetAssignments в App.tsx)

---

## Рекомендации для реальной БД

### 1. Нормализация:
- Выделить Company как отдельную сущность
- Выделить Manager как отдельную сущность
- Создать справочник CargoTypes
- Создать справочник TrailerTypes

### 2. Аудит:
- Добавить поля createdAt, updatedAt для всех таблиц
- Добавить поле createdBy, updatedBy для отслеживания изменений
- Создать таблицу OrderHistory для отслеживания изменений статуса

### 3. Безопасность:
- Хранить hash паролей (bcrypt, argon2)
- Добавить поле role для детализации прав доступа
- Создать таблицу Sessions для управления сеансами

### 4. Производительность:
- Использовать числовые ID вместо строковых где возможно
- Добавить партиционирование для таблицы Order по датам
- Создать материализованные представления для статистики

### 5. Геолокация:
- Использовать типы POINT/GEOGRAPHY для координат
- Создать пространственные индексы для быстрого поиска
- Хранить координаты как числа (DECIMAL) вместо строк

### 6. Дополнительные таблицы:
- OrderStatusHistory (история изменений статуса)
- OrderDocuments (документы к заказу)
- TruckMaintenanceHistory (история ТО)
- DriverTrips (история поездок водителя)
- PaymentTransactions (платежи)
- Notifications (уведомления)

---

## SQL Пример создания основных таблиц

```sql
-- Пользователи
CREATE TABLE users (
    inn VARCHAR(12) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    company VARCHAR(255) NOT NULL,
    user_type ENUM('shipper', 'logistician') NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Заказы
CREATE TABLE orders (
    id VARCHAR(50) PRIMARY KEY,
    shipper_name VARCHAR(255) NOT NULL,
    manager_name VARCHAR(255) NOT NULL,
    origin TEXT NOT NULL,
    destination TEXT NOT NULL,
    origin_latitude DECIMAL(10, 8),
    origin_longitude DECIMAL(11, 8),
    destination_latitude DECIMAL(10, 8),
    destination_longitude DECIMAL(11, 8),
    trailer_type VARCHAR(100) NOT NULL,
    volume VARCHAR(50) NOT NULL,
    weight VARCHAR(50) NOT NULL,
    pickup_date DATE NOT NULL,
    pickup_time TIME,
    delivery_date DATE NOT NULL,
    delivery_time TIME,
    transportation_cost DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Ожидает',
    cargo_type VARCHAR(100) NOT NULL,
    special_requirements TEXT,
    length DECIMAL(5, 2) NOT NULL,
    width DECIMAL(5, 2) NOT NULL,
    height DECIMAL(5, 2) NOT NULL,
    assigned_driver_id VARCHAR(50),
    external_order_number VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (assigned_driver_id) REFERENCES drivers(id),
    INDEX idx_status (status),
    INDEX idx_shipper (shipper_name),
    INDEX idx_dates (pickup_date, delivery_date)
);

-- Водители
CREATE TABLE drivers (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    license_number VARCHAR(50) UNIQUE NOT NULL,
    availability ENUM('Доступен', 'В рейсе', 'На ТО', 'Не работает') NOT NULL,
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_availability (availability)
);

-- Тягачи
CREATE TABLE trucks (
    id VARCHAR(50) PRIMARY KEY,
    make VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    year INT NOT NULL,
    license_plate VARCHAR(20) UNIQUE NOT NULL,
    vin_number VARCHAR(50) UNIQUE NOT NULL,
    maintenance_status ENUM('Исправен', 'Требует ТО', 'На ТО') NOT NULL,
    current_location VARCHAR(255) NOT NULL,
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (maintenance_status),
    INDEX idx_location (current_location)
);

-- Прицепы
CREATE TABLE trailers (
    id VARCHAR(50) PRIMARY KEY,
    license_plate VARCHAR(20) UNIQUE NOT NULL,
    trailer_type VARCHAR(100) NOT NULL,
    length DECIMAL(5, 2) NOT NULL,
    width DECIMAL(5, 2) NOT NULL,
    height DECIMAL(5, 2) NOT NULL,
    volume VARCHAR(50) NOT NULL,
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_type (trailer_type)
);

-- Связки автопарка
CREATE TABLE fleet_assignments (
    id VARCHAR(50) PRIMARY KEY,
    driver_id VARCHAR(50) NOT NULL,
    truck_id VARCHAR(50) NOT NULL,
    trailer_id VARCHAR(50) NOT NULL,
    assigned_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (driver_id) REFERENCES drivers(id),
    FOREIGN KEY (truck_id) REFERENCES trucks(id),
    FOREIGN KEY (trailer_id) REFERENCES trailers(id),
    UNIQUE KEY unique_assignment (driver_id, truck_id, trailer_id),
    INDEX idx_driver (driver_id)
);

-- Комментарии к компаниям
CREATE TABLE company_comments (
    company_name VARCHAR(255) PRIMARY KEY,
    comment TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Комментарии к менеджерам
CREATE TABLE manager_comments (
    manager_name VARCHAR(255) PRIMARY KEY,
    comment TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Комментарии к заказам
CREATE TABLE order_comments (
    order_id VARCHAR(50) PRIMARY KEY,
    comment TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- Информация о менеджерах
CREATE TABLE manager_info (
    manager_name VARCHAR(255) PRIMARY KEY,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

---

**Дата создания схемы:** 21 октября 2025  
**Версия прототипа:** После рефакторинга с добавлением vehicleCount и переходом на ИНН  
**Примечание:** Схема основана на текущем прототипе. При разработке реальной БД рекомендуется дополнительная нормализация и оптимизация.
