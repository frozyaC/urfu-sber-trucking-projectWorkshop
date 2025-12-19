# Логика комментариев в системе

## Краткий ответ на ваш вопрос

**Ваше понимание частично верное, но есть важный нюанс:**

Комментарии в системе делятся на **два типа** с разной логикой хранения:

---

## 1. Встроенные комментарии (поле comment)

### Сущности с полем comment:

- **Driver** (водитель)
- **Truck** (тягач)
- **Trailer** (прицеп)

### Как работает:

```typescript
interface Driver {
  id: string;
  name: string;
  phone: string;
  licenseNumber: string;
  availability:
    | "Доступен"
    | "В рейсе"
    | "На ТО"
    | "Не работает";
  comment: string; // ← Поле комментария внутри объекта
}
```

### Пример данных:

```javascript
{
  id: 'ВОД-001',
  name: 'Иван Петров',
  phone: '+7 (495) 123-45-67',
  licenseNumber: 'ВУ-77-123456',
  availability: 'Доступен',
  comment: 'Опытный водитель, специализируется на металлопрокате' // ← Комментарий
}
```

### Хранение в БД:

```sql
CREATE TABLE drivers (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    license_number VARCHAR(50) UNIQUE NOT NULL,
    availability ENUM('Доступен', 'В рейсе', 'На ТО', 'Не работает') NOT NULL,
    comment TEXT  -- ← Поле в той же таблице
);
```

**Вывод:** Комментарий является атрибутом сущности и хранится в той же записи (кортеже).

---

## 2. Внешние комментарии (отдельная структура Comments)

### Сущности с внешними комментариями:

- **Company** (компания)
- **Manager** (менеджер)
- **Order** (заказ)

### Как работает:

```typescript
interface Comments {
  companies: { [companyName: string]: string };
  managers: { [managerName: string]: string };
  orders: { [orderId: string]: string };
}
```

### Пример данных:

```javascript
const comments = {
  companies: {
    'ООО "Металл-Строй"': 'Надежный партнер, всегда оплачивают вовремя',
    'ЗАО "Продукты Север"': 'Требуют строгого соблюдения температурного режима'
  },
  managers: {
    'Сергей Петров': 'Предпочитает связь по WhatsApp',
    'Анна Смирнова': 'Очень требовательна к срокам'
  },
  orders: {
    '1': 'Груз требует особой осторожности при погрузке',
    '2': 'Клиент просил позвонить за час до прибытия'
  }
};
```

### Хранение в БД (рекомендуемое):

```sql
-- Отдельная таблица для комментариев к компаниям
CREATE TABLE company_comments (
    company_name VARCHAR(255) PRIMARY KEY,
    comment TEXT NOT NULL
);

-- Отдельная таблица для комментариев к менеджерам
CREATE TABLE manager_comments (
    manager_name VARCHAR(255) PRIMARY KEY,
    comment TEXT NOT NULL
);

-- Отдельная таблица для комментариев к заказам
CREATE TABLE order_comments (
    order_id VARCHAR(50) PRIMARY KEY,
    comment TEXT NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);
```

**Вывод:** Комментарий НЕ является атрибутом заказа, а хранится в отдельной таблице с связью по ID.

---

## Ключевое отличие

| Аспект             | Встроенные комментарии    | Внешние комментарии                      |
| ------------------ | ------------------------- | ---------------------------------------- |
| **Хранение**       | В том же кортеже (записи) | В отдельной таблице                      |
| **Связь**          | Часть сущности            | Связь через PK/FK                        |
| **Обязательность** | Может быть пустым         | Создается только при наличии комментария |
| **Пример**         | Driver.comment            | comments.orders[orderId]                 |

---

## Почему такая разница?

### Встроенные комментарии (Driver, Truck, Trailer):

- Это **внутренние заметки** о сущностях автопарка
- Относятся к физическим объектам (люди, машины)
- Редко меняются
- Всегда относятся к одной конкретной сущности
- **Логика:** "Описание сущности"

### Внешние комментарии (Company, Manager, Order):

- Это **рабочие заметки логиста** о клиентах и заказах
- Относятся к бизнес-процессам
- Могут часто обновляться
- Опциональны (не у всех компаний/заказов есть комментарии)
- **Логика:** "Дополнительная информация для работы"

---

## Примеры использования в коде

### Встроенные комментарии:

```typescript
// Обновление комментария водителя
const updateDriverComment = (
  driverId: string,
  comment: string,
) => {
  setDrivers((prevDrivers) =>
    prevDrivers.map((driver) =>
      driver.id === driverId
        ? { ...driver, comment } // ← Обновляем поле comment в объекте
        : driver,
    ),
  );
};
```

### Внешние комментарии:

```typescript
// Обновление комментария заказа
const updateOrderComment = (
  orderId: string,
  comment: string,
) => {
  setComments((prevComments) => ({
    ...prevComments,
    orders: {
      ...prevComments.orders,
      [orderId]: comment, // ← Обновляем запись в словаре
    },
  }));
};
```

---

## Структура данных в памяти приложения

```javascript
// State приложения (App.tsx)
const [drivers, setDrivers] = useState([
  {
    id: 'ВОД-001',
    name: 'Иван Петров',
    comment: 'Опытный водитель'  // ← Встроенный комментарий
  }
]);

const [orders, setOrders] = useState([
  {
    id: '1',
    shipperName: 'ООО "Металл-Строй"',
    // НЕТ поля comment!
  }
]);

const [comments, setComments] = useState({
  companies: {
    'ООО "Металл-Строй"': 'Надежный партнер'  // ← Внешний комментарий
  },
  managers: {
    'Сергей Петров': 'Предпочитает WhatsApp'  // ← Внешний комментарий
  },
  orders: {
    '1': 'Груз требует осторожности'  // ← Внешний комментарий к заказу
  }
});
```

---

## Доступ к комментариям

### Встроенные (Driver, Truck, Trailer):

```typescript
// Прямой доступ через объект
const driver = drivers.find((d) => d.id === "ВОД-001");
console.log(driver.comment); // "Опытный водитель"
```

### Внешние (Company, Manager, Order):

```typescript
// Доступ через словарь
const orderComment = comments.orders["1"];
console.log(orderComment); // "Груз требует осторожности"

const companyComment = comments.companies['ООО "Металл-Строй"'];
console.log(companyComment); // "Надежный партнер"
```

---

## Компоненты для работы с комментариями

### CommentModal.tsx

Универсальный модальный компонент для добавления/редактирования комментариев:

```typescript
interface CommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string; // "Комментарий о компании", "Комментарий о заказе"
  currentComment: string; // Текущий текст комментария
  onSave: (comment: string) => void; // Callback для сохранения
}
```

**Используется для:**

- Комментариев к компаниям
- Комментариев к менеджерам
- Комментариев к заказам
- Комментариев к водителям
- Комментариев к тягачам
- Комментариев к прицепам

---

## Рекомендации для БД

### Вариант 1: Текущая структура (как в прототипе)

```sql
-- Встроенные комментарии (в основной таблице)
CREATE TABLE drivers (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255),
    comment TEXT
);

-- Внешние комментарии (отдельные таблицы)
CREATE TABLE order_comments (
    order_id VARCHAR(50) PRIMARY KEY,
    comment TEXT,
    FOREIGN KEY (order_id) REFERENCES orders(id)
);
```

### Вариант 2: Унифицированная система комментариев

```sql
-- Общая таблица комментариев для всех типов
CREATE TABLE comments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    entity_type ENUM('driver', 'truck', 'trailer', 'company', 'manager', 'order'),
    entity_id VARCHAR(255),
    comment TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_comment (entity_type, entity_id)
);
```

**Преимущества варианта 2:**

- Единая точка хранения всех комментариев
- Легко добавлять новые типы сущностей
- История изменений через timestamps
- Возможность расширения (автор комментария, версионность)

**Недостатки варианта 2:**

- Более сложные запросы
- Нужны индексы по (entity_type, entity_id)
- Потеря типизации на уровне БД

---

## Итоговая схема связей

```
┌─────────────────────────────────────────────────────────────────┐
│                    КОММЕНТАРИИ В СИСТЕМЕ                        │
└─────────────────────────────────────────────────────────────────┘

ВСТРОЕННЫЕ:                   ВНЕШНИЕ:
┌──────────┐                  ┌──────────┐
│  Driver  │                  │  Order   │
├──────────┤                  ├──────────┤
│ id       │                  │ id       │
│ name     │                  │ ...      │
│ comment  │◄─┐               └──────────┘
└──────────┘  │                     │
              │                     │ FK
┌──────────┐  │                     ▼
│  Truck   │  │               ┌──────────────┐
├──────────┤  │               │OrderComment  │
│ id       │  │               ├──────────────┤
│ make     │  │               │ orderId (PK) │
│ comment  │◄─┼─ Атрибут      │ comment      │
└──────────┘  │               └──────────────┘
              │
┌──────────┐  │               ┌────────────────┐
│ Trailer  │  │               │CompanyComment  │
├──────────┤  │               ├────────────────┤
│ id       │  │               │ companyName    │
│ type     │  │               │ comment        │
│ comment  │◄─┘               └────────────────┘
└──────────┘
                              ┌────────────────┐
                              │ManagerComment  │
                              ├────────────────┤
                              │ managerName    │
                              │ comment        │
                              └────────────────┘
```

---

## Выводы

1. **Driver, Truck, Trailer:** комментарий = атрибут сущности, хранится в той же записи
2. **Order, Company, Manager:** комментарий = отдельная сущность, связанная по ключу
3. Заказы **НЕ** имеют поля comment в своей структуре Order
4. Комментарии к заказам хранятся в `comments.orders[orderId]`
5. При проектировании БД рекомендуется создать отдельные таблицы для всех комментариев

**Важно для миграции:** При переносе в БД нужно правильно разделить встроенные и внешние комментарии на разные таблицы/колонки.