# ER-диаграмма - Система управления логистикой

## Диаграмма связей сущностей (Entity Relationship Diagram)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          СИСТЕМА УПРАВЛЕНИЯ ЛОГИСТИКОЙ                       │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────┐
│      USER        │
├──────────────────┤
│ inn (PK)         │◄─────────────────────────────────────┐
│ name             │                                      │
│ company          │                                      │
│ userType         │                                      │
└──────────────────┘                                      │
                                                          │
                                                          │ Создает заказы
┌──────────────────────────────────────────────┐          │ (логическая связь)
│                  ORDER                       │          │
├──────────────────────────────────────────────┤          │
│ id (PK)                                      │◄─────────┘
│ shipperName                                  │
│ managerName                                  │───┐
│ origin                                       │   │
│ destination                                  │   │ Связь по имени
│ originLatitude                               │   │
│ originLongitude                              │   ▼
│ destinationLatitude                          │ ┌─────────────────────┐
│ destinationLongitude                         │ │   MANAGER_INFO      │
│ trailerType                                  │ ├─────────────────────┤
│ volume                                       │ │ managerName (PK)    │
│ weight                                       │ │ phone               │
│ pickupDate                                   │ │ email (UQ)          │
│ pickupTime                                   │ └─────────────────────┘
│ deliveryDate                                 │
│ deliveryTime                                 │
│ transportationCost                           │
│ status                                       │
│ cargoType                                    │
│ specialRequirements                          │
│ length                                       │
│ width                                        │
│ height                                       │
│ assignedDriverId (FK) ────────┐              │
│ externalOrderNumber           │              │
└───────────────────────────────┼──────────────┘
                                │
                                │ Many-to-One
                                │ (Один водитель - много заказов)
                                ▼
              ┌────────────────────────────────┐
              │          DRIVER                │
              ├────────────────────────────────┤
              │ id (PK)                        │◄────────┐
              │ name                           │         │
              │ phone                          │         │
              │ licenseNumber (UQ)             │         │
              │ availability                   │         │
              │ comment                        │         │
              └────────────────────────────────┘         │
                                │                        │
                                │ One-to-Many            │
                                │                        │
                                ▼                        │
              ┌────────────────────────────────┐         │
              │      FLEET_ASSIGNMENT          │         │
              ├────────────────────────────────┤         │
              │ id (PK)                        │         │
              │ driverId (FK) ─────────────────┼─────────┘
              │ truckId (FK)  ─────────────────┼─────────┐
              │ trailerId (FK) ────────────────┼─────┐   │
              │ assignedDate                   │     │   │
              └────────────────────────────────┘     │   │
              │                                      │   │
              │ UNIQUE (driverId, truckId, trailerId)│   │
              │                                      │   │
                                                     │   │
                                                     │   │
              ┌────────────────────────────────┐     │   │
              │          TRAILER               │     │   │
              ├────────────────────────────────┤     │   │
              │ id (PK)                        │◄────┘   │
              │ licensePlate (UQ)              │         │
              │ trailerType                    │         │
              │ length                         │         │
              │ width                          │         │
              │ height                         │         │
              │ volume                         │         │
              │ comment                        │         │
              └────────────────────────────────┘         │
                                                         │
                                                         │
              ┌────────────────────────────────┐         │
              │          TRUCK                 │         │
              ├────────────────────────────────┤         │
              │ id (PK)                        │◄────────┘
              │ make                           │
              │ model                          │
              │ year                           │
              │ licensePlate (UQ)              │
              │ vinNumber (UQ)                 │
              │ maintenanceStatus              │
              │ currentLocation                │
              │ comment                        │
              └────────────────────────────────┘


┌──────────────────────────────────────────────────────────────────────────────┐
│                      СИСТЕМА КОММЕНТАРИЕВ (ОТДЕЛЬНАЯ)                        │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────┐
│      COMPANY_COMMENT         │
├──────────────────────────────┤
│ companyName (PK)             │
│ comment                      │
└──────────────────────────────┘

┌──────────────────────────────┐
│      MANAGER_COMMENT         │
├──────────────────────────────┤
│ managerName (PK)             │
│ comment                      │
└──────────────────────────────┘

┌──────────────────────────────┐
│      ORDER_COMMENT           │
├──────────────────────────────┤
│ orderId (PK/FK) ──────┐      │
│ comment               │      │
└───────────────────────┼──────┘
                        │
                        ▼
                    [ORDER.id]
```

---

## Ключевые связи

### 1. Order → Driver (Many-to-One)
- **Описание:** Заказ может быть назначен одному водителю, один водитель может иметь много заказов
- **Связь:** Order.assignedDriverId → Driver.id
- **Тип:** Optional (nullable)
- **Каскад:** ON DELETE SET NULL

### 2. FleetAssignment → Driver (Many-to-One)
- **Описание:** Связка привязана к одному водителю, один водитель может иметь несколько связок (но обычно одну активную)
- **Связь:** FleetAssignment.driverId → Driver.id
- **Тип:** Required (NOT NULL)
- **Каскад:** ON DELETE CASCADE

### 3. FleetAssignment → Truck (Many-to-One)
- **Описание:** Связка привязана к одному тягачу, один тягач может быть в нескольких связках (но обычно в одной активной)
- **Связь:** FleetAssignment.truckId → Truck.id
- **Тип:** Required (NOT NULL)
- **Каскад:** ON DELETE CASCADE

### 4. FleetAssignment → Trailer (Many-to-One)
- **Описание:** Связка привязана к одному прицепу, один прицеп может быть в нескольких связках (но обычно в одной активной)
- **Связь:** FleetAssignment.trailerId → Trailer.id
- **Тип:** Required (NOT NULL)
- **Каскад:** ON DELETE CASCADE

### 5. OrderComment → Order (One-to-One)
- **Описание:** Комментарий привязан к конкретному заказу
- **Связь:** OrderComment.orderId → Order.id
- **Тип:** Required (NOT NULL)
- **Каскад:** ON DELETE CASCADE

### 6. Order → ManagerInfo (Many-to-One логическая)
- **Описание:** Заказ содержит имя менеджера, которое связано с контактной информацией
- **Связь:** Order.managerName = ManagerInfo.managerName
- **Тип:** Логическая связь (не FK в прототипе)
- **Примечание:** В реальной БД лучше использовать ID менеджера

---

## Кардинальность связей

```
User ──────┬──────< Order
           │
           └──────< (логическая связь через shipperName/company)

Driver ────┬──────< Order (через assignedDriverId)
           │
           └──────< FleetAssignment

Truck ─────────────< FleetAssignment

Trailer ───────────< FleetAssignment

Order ─────────────○ OrderComment (One-to-Zero-or-One)

ManagerInfo ───────< Order (через managerName, логическая)
```

**Легенда:**
- `────<` : One-to-Many
- `────○` : One-to-Zero-or-One
- `────` : One-to-One

---

## Бизнес-правила связей

### Правило 1: Уникальность связки автопарка
```sql
UNIQUE (driverId, truckId, trailerId)
```
Одна и та же комбинация водитель+тягач+прицеп не может быть создана дважды.

### Правило 2: Один активный водитель - одна связка
В прототипе водитель может иметь только одну активную связку. При создании новой связки старая должна быть помечена как неактивная или удалена.

### Правило 3: Назначение водителя на заказ
Водитель может быть назначен на заказ только если:
- availability = 'Доступен'
- Имеет активную FleetAssignment
- Тип прицепа в FleetAssignment соответствует Order.trailerType

### Правило 4: Изменение статуса заказа
- Ожидает → Назначен: требуется assignedDriverId
- Назначен → В пути: водитель подтверждает начало перевозки
- В пути → Доставлен: водитель подтверждает завершение
- Любой → Отменен: возможно в любой момент

---

## Индексы для производительности

### Основные индексы:

**Order:**
```sql
INDEX idx_order_status (status)
INDEX idx_order_shipper (shipperName)
INDEX idx_order_driver (assignedDriverId)
INDEX idx_order_dates (pickupDate, deliveryDate)
INDEX idx_order_geo_origin (originLatitude, originLongitude)
INDEX idx_order_geo_dest (destinationLatitude, destinationLongitude)
```

**Driver:**
```sql
INDEX idx_driver_availability (availability)
INDEX idx_driver_name (name)
```

**Truck:**
```sql
INDEX idx_truck_status (maintenanceStatus)
INDEX idx_truck_location (currentLocation)
```

**FleetAssignment:**
```sql
INDEX idx_fleet_driver (driverId)
INDEX idx_fleet_truck (truckId)
INDEX idx_fleet_trailer (trailerId)
```

---

## Транзакционная целостность

### Сценарий 1: Создание заказа с несколькими транспортами
```
BEGIN TRANSACTION;
  FOR i = 1 TO vehicleCount DO
    INSERT INTO orders (...);
  END FOR;
COMMIT;
```

### Сценарий 2: Назначение водителя на заказ
```
BEGIN TRANSACTION;
  UPDATE orders 
  SET assignedDriverId = ?, status = 'Назначен'
  WHERE id = ?;
  
  UPDATE drivers
  SET availability = 'В рейсе'
  WHERE id = ?;
COMMIT;
```

### Сценарий 3: Создание связки автопарка
```
BEGIN TRANSACTION;
  -- Проверка существования
  SELECT id FROM drivers WHERE id = ?;
  SELECT id FROM trucks WHERE id = ?;
  SELECT id FROM trailers WHERE id = ?;
  
  -- Проверка уникальности
  SELECT id FROM fleet_assignments 
  WHERE driverId = ? OR truckId = ? OR trailerId = ?;
  
  -- Создание
  INSERT INTO fleet_assignments (...);
COMMIT;
```

### Сценарий 4: Удаление связки
```
BEGIN TRANSACTION;
  -- Проверка активных заказов
  SELECT COUNT(*) FROM orders 
  WHERE assignedDriverId = ? 
  AND status IN ('Назначен', 'В пути');
  
  IF count = 0 THEN
    DELETE FROM fleet_assignments WHERE id = ?;
  ELSE
    ROLLBACK;
  END IF;
COMMIT;
```

---

## Миграция данных из прототипа

### Этап 1: Экспорт из localStorage/state
```javascript
// Экспорт заказов
const ordersJSON = JSON.stringify(orders);

// Экспорт водителей
const driversJSON = JSON.stringify(drivers);

// ... и т.д.
```

### Этап 2: Трансформация данных
```javascript
// Пример трансформации Order
const transformOrder = (order) => ({
  ...order,
  originLatitude: order.originLatitude ? parseFloat(order.originLatitude) : null,
  originLongitude: order.originLongitude ? parseFloat(order.originLongitude) : null,
  // ... преобразование других полей
});
```

### Этап 3: Загрузка в БД
```sql
-- Загрузка пользователей
INSERT INTO users (inn, name, company, user_type, password_hash)
VALUES (?, ?, ?, ?, ?);

-- Загрузка заказов
INSERT INTO orders (id, shipper_name, ...)
VALUES (?, ?, ...);

-- ... и т.д.
```

---

## Рекомендации по нормализации

### Текущая форма: 2NF-3NF
Прототип находится в основном во второй нормальной форме с элементами третьей.

### Рекомендуемые улучшения для 3NF:

**1. Выделить Company:**
```sql
CREATE TABLE companies (
    id INT PRIMARY KEY AUTO_INCREMENT,
    inn VARCHAR(12) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(20)
);

-- Изменить Order
ALTER TABLE orders 
ADD COLUMN company_id INT,
ADD FOREIGN KEY (company_id) REFERENCES companies(id);
```

**2. Выделить Manager:**
```sql
CREATE TABLE managers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    company_id INT,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255) UNIQUE,
    FOREIGN KEY (company_id) REFERENCES companies(id)
);

-- Изменить Order
ALTER TABLE orders 
ADD COLUMN manager_id INT,
ADD FOREIGN KEY (manager_id) REFERENCES managers(id);
```

**3. Справочник типов груза:**
```sql
CREATE TABLE cargo_types (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    special_handling BOOLEAN DEFAULT FALSE
);

-- Изменить Order
ALTER TABLE orders 
ADD COLUMN cargo_type_id INT,
ADD FOREIGN KEY (cargo_type_id) REFERENCES cargo_types(id);
```

**4. Справочник типов прицепов:**
```sql
CREATE TABLE trailer_types (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT
);

-- Изменить Order и Trailer
ALTER TABLE orders 
ADD COLUMN trailer_type_id INT,
ADD FOREIGN KEY (trailer_type_id) REFERENCES trailer_types(id);

ALTER TABLE trailers 
ADD COLUMN trailer_type_id INT,
ADD FOREIGN KEY (trailer_type_id) REFERENCES trailer_types(id);
```

---

**Дата создания диаграммы:** 21 октября 2025  
**Версия:** 1.0  
**Статус:** Основано на прототипе после рефакторинга

---

## SQL Типы данных (varchar, int, datetime)

### 1. USER
```sql
inn                VARCHAR(12)    PRIMARY KEY
name               VARCHAR(255)   NOT NULL
company            VARCHAR(255)   NOT NULL
userType           VARCHAR(20)    NOT NULL -- 'shipper' или 'logistician'
```

### 2. ORDER
```sql
id                      VARCHAR(50)     PRIMARY KEY
shipperName             VARCHAR(255)    NOT NULL
managerName             VARCHAR(255)    NOT NULL
origin                  VARCHAR(500)    NOT NULL
destination             VARCHAR(500)    NOT NULL
originLatitude          VARCHAR(50)     NULL
originLongitude         VARCHAR(50)     NULL
destinationLatitude     VARCHAR(50)     NULL
destinationLongitude    VARCHAR(50)     NULL
trailerType             VARCHAR(100)    NOT NULL
volume                  VARCHAR(50)     NOT NULL
weight                  VARCHAR(50)     NOT NULL
pickupDate              VARCHAR(10)     NOT NULL -- YYYY-MM-DD
pickupTime              VARCHAR(5)      NULL     -- HH:mm
deliveryDate            VARCHAR(10)     NOT NULL -- YYYY-MM-DD
deliveryTime            VARCHAR(5)      NULL     -- HH:mm
transportationCost      INT             NOT NULL
status                  VARCHAR(50)     NOT NULL DEFAULT 'Ожидает'
cargoType               VARCHAR(255)    NOT NULL
specialRequirements     VARCHAR(1000)   NULL
length                  VARCHAR(20)     NOT NULL
width                   VARCHAR(20)     NOT NULL
height                  VARCHAR(20)     NOT NULL
assignedDriverId        VARCHAR(50)     NULL     -- FK → Driver.id
externalOrderNumber     VARCHAR(100)    NULL
```

### 3. DRIVER
```sql
id                 VARCHAR(50)     PRIMARY KEY
name               VARCHAR(255)    NOT NULL
phone              VARCHAR(20)     NOT NULL
licenseNumber      VARCHAR(50)     NOT NULL UNIQUE
availability       VARCHAR(50)     NOT NULL DEFAULT 'Доступен'
comment            VARCHAR(1000)   NULL
```

### 4. TRUCK
```sql
id                  VARCHAR(50)     PRIMARY KEY
make                VARCHAR(100)    NOT NULL
model               VARCHAR(100)    NOT NULL
year                INT             NOT NULL
licensePlate        VARCHAR(20)     NOT NULL UNIQUE
vinNumber           VARCHAR(50)     NOT NULL UNIQUE
maintenanceStatus   VARCHAR(50)     NOT NULL DEFAULT 'Исправен'
currentLocation     VARCHAR(500)    NOT NULL
comment             VARCHAR(1000)   NULL
```

### 5. TRAILER
```sql
id              VARCHAR(50)     PRIMARY KEY
licensePlate    VARCHAR(20)     NOT NULL UNIQUE
trailerType     VARCHAR(100)    NOT NULL
length          VARCHAR(20)     NOT NULL
width           VARCHAR(20)     NOT NULL
height          VARCHAR(20)     NOT NULL
volume          VARCHAR(50)     NOT NULL
comment         VARCHAR(1000)   NULL
```

### 6. FLEET_ASSIGNMENT
```sql
id              VARCHAR(50)     PRIMARY KEY
driverId        VARCHAR(50)     NOT NULL -- FK → Driver.id
truckId         VARCHAR(50)     NOT NULL -- FK → Truck.id
trailerId       VARCHAR(50)     NOT NULL -- FK → Trailer.id
assignedDate    VARCHAR(10)     NOT NULL -- YYYY-MM-DD

UNIQUE (driverId, truckId, trailerId)
```

### 7. MANAGER_INFO
```sql
managerName     VARCHAR(255)    PRIMARY KEY
phone           VARCHAR(20)     NOT NULL
email           VARCHAR(255)    NOT NULL UNIQUE
```

### 8. COMPANY_COMMENT
```sql
companyName     VARCHAR(255)    PRIMARY KEY
comment         VARCHAR(2000)   NOT NULL
```

### 9. MANAGER_COMMENT
```sql
managerName     VARCHAR(255)    PRIMARY KEY
comment         VARCHAR(2000)   NOT NULL
```

### 10. ORDER_COMMENT
```sql
orderId         VARCHAR(50)     PRIMARY KEY -- FK → Order.id
comment         VARCHAR(2000)   NOT NULL
```

---

## Код для dbdiagram.io

```dbdiagram
// Система управления логистикой - Database Schema
// Created: 2025-10-21
// Version: 1.0

Table users {
  inn varchar(12) [pk, note: 'ИНН пользователя для идентификации']
  name varchar(255) [not null, note: 'ФИО пользователя']
  company varchar(255) [not null, note: 'Название компании']
  userType varchar(20) [not null, note: 'Тип: shipper или logistician']
}

Table orders {
  id varchar(50) [pk, note: 'Уникальный ID заказа']
  shipperName varchar(255) [not null, note: 'Название компании грузоотправителя']
  managerName varchar(255) [not null, note: 'ФИО менеджера']
  origin varchar(500) [not null, note: 'Адрес отправления']
  destination varchar(500) [not null, note: 'Адрес назначения']
  originLatitude varchar(50) [null, note: 'Широта точки отправления']
  originLongitude varchar(50) [null, note: 'Долгота точки отправления']
  destinationLatitude varchar(50) [null, note: 'Широта точки назначения']
  destinationLongitude varchar(50) [null, note: 'Долгота точки назначения']
  trailerType varchar(100) [not null, note: 'Тип прицепа']
  volume varchar(50) [not null, note: 'Объем груза']
  weight varchar(50) [not null, note: 'Вес груза']
  pickupDate varchar(10) [not null, note: 'Дата забора (YYYY-MM-DD)']
  pickupTime varchar(5) [null, note: 'Время забора (HH:mm)']
  deliveryDate varchar(10) [not null, note: 'Дата доставки (YYYY-MM-DD)']
  deliveryTime varchar(5) [null, note: 'Время доставки (HH:mm)']
  transportationCost int [not null, note: 'Стоимость перевозки в рублях']
  status varchar(50) [not null, default: 'Ожидает', note: 'Статус заказа']
  cargoType varchar(255) [not null, note: 'Тип груза']
  specialRequirements varchar(1000) [null, note: 'Особые требования']
  length varchar(20) [not null, note: 'Длина груза']
  width varchar(20) [not null, note: 'Ширина груза']
  height varchar(20) [not null, note: 'Высота груза']
  assignedDriverId varchar(50) [null, note: 'ID назначенного водителя']
  externalOrderNumber varchar(100) [null, note: 'Внешний номер заказа']
  
  indexes {
    status [name: 'idx_order_status']
    shipperName [name: 'idx_order_shipper']
    assignedDriverId [name: 'idx_order_driver']
    (pickupDate, deliveryDate) [name: 'idx_order_dates']
  }
}

Table drivers {
  id varchar(50) [pk, note: 'Уникальный ID водителя']
  name varchar(255) [not null, note: 'ФИО водителя']
  phone varchar(20) [not null, note: 'Номер телефона']
  licenseNumber varchar(50) [not null, unique, note: 'Номер водительского удостоверения']
  availability varchar(50) [not null, default: 'Доступен', note: 'Статус доступности']
  comment varchar(1000) [null, note: 'Комментарий']
  
  indexes {
    availability [name: 'idx_driver_availability']
    name [name: 'idx_driver_name']
  }
}

Table trucks {
  id varchar(50) [pk, note: 'Уникальный ID тягача']
  make varchar(100) [not null, note: 'Марка']
  model varchar(100) [not null, note: 'Модель']
  year int [not null, note: 'Год выпуска']
  licensePlate varchar(20) [not null, unique, note: 'Номерной знак']
  vinNumber varchar(50) [not null, unique, note: 'VIN номер']
  maintenanceStatus varchar(50) [not null, default: 'Исправен', note: 'Статус обслуживания']
  currentLocation varchar(500) [not null, note: 'Текущее местоположение']
  comment varchar(1000) [null, note: 'Комментарий']
  
  indexes {
    maintenanceStatus [name: 'idx_truck_status']
    currentLocation [name: 'idx_truck_location']
  }
}

Table trailers {
  id varchar(50) [pk, note: 'Уникальный ID прицепа']
  licensePlate varchar(20) [not null, unique, note: 'Номерной знак']
  trailerType varchar(100) [not null, note: 'Тип прицепа']
  length varchar(20) [not null, note: 'Длина']
  width varchar(20) [not null, note: 'Ширина']
  height varchar(20) [not null, note: 'Высота']
  volume varchar(50) [not null, note: 'Объем']
  comment varchar(1000) [null, note: 'Комментарий']
}

Table fleet_assignments {
  id varchar(50) [pk, note: 'Уникальный ID связки']
  driverId varchar(50) [not null, note: 'ID водителя']
  truckId varchar(50) [not null, note: 'ID тягача']
  trailerId varchar(50) [not null, note: 'ID прицепа']
  assignedDate varchar(10) [not null, note: 'Дата назначения (YYYY-MM-DD)']
  
  indexes {
    driverId [name: 'idx_fleet_driver']
    truckId [name: 'idx_fleet_truck']
    trailerId [name: 'idx_fleet_trailer']
    (driverId, truckId, trailerId) [unique, name: 'unique_fleet_combo']
  }
}

Table manager_info {
  managerName varchar(255) [pk, note: 'ФИО менеджера']
  phone varchar(20) [not null, note: 'Номер телефона']
  email varchar(255) [not null, unique, note: 'Email адрес']
}

Table company_comments {
  companyName varchar(255) [pk, note: 'Название компании']
  comment varchar(2000) [not null, note: 'Комментарий о компании']
}

Table manager_comments {
  managerName varchar(255) [pk, note: 'ФИО менеджера']
  comment varchar(2000) [not null, note: 'Комментарий о менеджере']
}

Table order_comments {
  orderId varchar(50) [pk, note: 'ID заказа']
  comment varchar(2000) [not null, note: 'Комментарий к заказу']
}

// Relationships
Ref: orders.assignedDriverId > drivers.id [note: 'Заказ назначен водителю']
Ref: fleet_assignments.driverId > drivers.id [note: 'Связка водителя']
Ref: fleet_assignments.truckId > trucks.id [note: 'Связка тягача']
Ref: fleet_assignments.trailerId > trailers.id [note: 'Связка прицепа']
Ref: order_comments.orderId - orders.id [note: 'Комментарий к заказу']
Ref: orders.managerName > manager_info.managerName [note: 'Менеджер заказа (логическая связь)']

// Notes
Note orders_note {
  '''
  Таблица заказов - центральная таблица системы.
  Содержит всю информацию о перевозке:
  - Маршрут (адреса и координаты)
  - Параметры груза (размеры, вес, объем)
  - Даты и время
  - Стоимость
  - Назначенный водитель
  '''
}

Note fleet_assignments_note {
  '''
  Связка водитель-тягач-прицеп.
  Определяет, какой водитель на каком транспорте работает.
  Уникальная комбинация предотвращает дублирование.
  '''
}

Note comments_note {
  '''
  Система комментариев разделена на три сущности:
  - Комментарии о компаниях
  - Комментарии о менеджерах
  - Комментарии к заказам
  Позволяет логисту вести историю взаимодействий.
  '''
}
```
