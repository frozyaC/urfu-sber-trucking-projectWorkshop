# API для работы с автопарком (CRUD операции)

## Водители (Drivers)

### GET /api/drivers
Получить всех водителей
```typescript
const drivers = await fetchAllDrivers();
```

### GET /api/drivers/{id}
Получить водителя по ID
```typescript
const driver = await fetchDriverById('ВОД-001');
```

### POST /api/drivers
Создать нового водителя
```typescript
const newDriver = await createDriver({
  id: 'ВОД-001',
  name: 'Иванов Иван Иванович',
  phone: '+7 (999) 123-45-67',
  licenseNumber: '1234567890',
  availability: 'Доступен',
  comment: 'Опытный водитель'
});
```

### PUT /api/drivers/{id}
Обновить данные водителя
```typescript
const updated = await updateDriver('ВОД-001', {
  availability: 'В рейсе',
  comment: 'Обновленный комментарий'
});
```

### DELETE /api/drivers/{id}
Удалить водителя
```typescript
await deleteDriver('ВОД-001');
```

## Транспортные средства (Trucks)

### GET /api/trucks
Получить все транспортные средства
```typescript
const trucks = await fetchAllTrucks();
```

### GET /api/trucks/{id}
Получить транспортное средство по ID
```typescript
const truck = await fetchTruckById('АВТ-001');
```

### POST /api/trucks
Создать новое транспортное средство
```typescript
const newTruck = await createTruck({
  id: 'АВТ-001',
  make: 'МАЗ',
  model: '5440',
  year: 2020,
  licensePlate: 'А123БВ777',
  vinNumber: 'XTT544000A1234567',
  maintenanceStatus: 'Исправен',
  currentLocation: 'Москва, ул. Ленина, 1',
  comment: 'В хорошем состоянии'
});
```

### PUT /api/trucks/{id}
Обновить данные транспортного средства
```typescript
const updated = await updateTruck('АВТ-001', {
  maintenanceStatus: 'Требует ТО',
  currentLocation: 'Санкт-Петербург'
});
```

### DELETE /api/trucks/{id}
Удалить транспортное средство
```typescript
await deleteTruck('АВТ-001');
```

## Прицепы (Trailers)

### GET /api/trailers
Получить все прицепы
```typescript
const trailers = await fetchAllTrailers();
```

### GET /api/trailers/{id}
Получить прицеп по ID
```typescript
const trailer = await fetchTrailerById('ПРЦ-001');
```

### POST /api/trailers
Создать новый прицеп
```typescript
const newTrailer = await createTrailer({
  id: 'ПРЦ-001',
  licensePlate: 'Б456ГД777',
  trailerType: 'Бортовой',
  length: '13.6',
  width: '2.5',
  height: '2.7',
  volume: '91.8',
  comment: 'Новый прицеп'
});
```

### PUT /api/trailers/{id}
Обновить данные прицепа
```typescript
const updated = await updateTrailer('ПРЦ-001', {
  trailerType: 'Рефрижератор',
  comment: 'Обновленный комментарий'
});
```

### DELETE /api/trailers/{id}
Удалить прицеп
```typescript
await deleteTrailer('ПРЦ-001');
```

## Связки автопарка (Fleet Assignments)

### GET /api/fleet-assignments
Получить все связки
```typescript
const assignments = await fetchAllFleetAssignments();
```

### GET /api/fleet-assignments/{id}
Получить связку по ID
```typescript
const assignment = await fetchFleetAssignmentById('СВЗ-001');
```

### POST /api/fleet-assignments
Создать новую связку
```typescript
const newAssignment = await createFleetAssignment({
  id: 'СВЗ-001',
  driverId: 'ВОД-001',
  truckId: 'АВТ-001',
  trailerId: 'ПРЦ-001',
  assignedDate: '2025-12-04'
});
```

### PUT /api/fleet-assignments/{id}
Обновить связку
```typescript
const updated = await updateFleetAssignment('СВЗ-001', {
  assignedDate: '2025-12-05'
});
```

### DELETE /api/fleet-assignments/{id}
Удалить связку
```typescript
await deleteFleetAssignment('СВЗ-001');
```

## Использование в компонентах

Все функции доступны через импорт:
```typescript
import {
  fetchAllDrivers,
  createDriver,
  updateDriver,
  deleteDriver,
  fetchAllTrucks,
  createTruck,
  updateTruck,
  deleteTruck,
  fetchAllTrailers,
  createTrailer,
  updateTrailer,
  deleteTrailer,
  fetchAllFleetAssignments,
  createFleetAssignment,
  updateFleetAssignment,
  deleteFleetAssignment,
} from './services/fleetApi';
```


