const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { initializeDatabase, UserDB, OrderDB, DriverDB, TruckDB, TrailerDB, FleetAssignmentDB } = require('./database');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Инициализация базы данных при запуске сервера
initializeDatabase()
  .then(() => {
    console.log('База данных инициализирована');
  })
  .catch((err) => {
    console.error('Ошибка инициализации БД:', err);
  });

// Валидация только нужных полей
function validateFields(data, isLogin) {
  if (!data.inn || !data.password) {
    return 'ИНН и пароль обязательны';
  }
  // company требуется ТОЛЬКО при регистрации
  if (!isLogin && !data.company) {
    return 'Заполните все поля для регистрации';
  }
  return null;
}

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  console.log(`\n[AUTH LOGIN] Попытка авторизации:`, req.body);

  const err = validateFields(req.body, true);
  if (err) {
    console.log(`[AUTH LOGIN] Ошибка валидации: ${err}`);
    return res.status(400).json({message: err});
  }

  try {
    const user = await UserDB.findByInnAndPassword(req.body.inn, req.body.password);
    if (!user) {
      console.log(`[AUTH LOGIN] Неуспешная попытка (неверный ИНН/пароль) для ИНН: ${req.body.inn}`);
      return res.status(401).json({message: 'Неверный ИНН или пароль'});
    }
    console.log(`[AUTH LOGIN] Успешная авторизация для ИНН: ${user.inn}`);
    res.json({user});
  } catch (error) {
    console.error(`[AUTH LOGIN] Ошибка БД:`, error);
    res.status(500).json({message: 'Ошибка сервера при авторизации'});
  }
});

// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
  console.log(`\n[AUTH REGISTER] Попытка регистрации:`, req.body);

  const err = validateFields(req.body, false);
  if (err) {
    console.log(`[AUTH REGISTER] Ошибка валидации: ${err}`);
    return res.status(400).json({message: err});
  }

  try {
    // Проверяем, существует ли пользователь с таким ИНН
    const existingUser = await UserDB.findByInn(req.body.inn);
    if (existingUser) {
      console.log(`[AUTH REGISTER] Отказ - пользователь c ИНН ${req.body.inn} уже существует`);
      return res.status(409).json({message: 'Пользователь с этим ИНН уже существует'});
    }

    // Создаем нового пользователя
    const newUser = await UserDB.create({
      inn: req.body.inn,
      password: req.body.password,
      company: req.body.company,
      userType: req.body.userType,
      name: req.body.name || ''
    });

    console.log(`[AUTH REGISTER] Успешная регистрация ИНН: ${newUser.inn}`);
    res.json(newUser);
  } catch (error) {
    console.error(`[AUTH REGISTER] Ошибка БД:`, error);
    res.status(500).json({message: 'Ошибка сервера при регистрации'});
  }
});

// POST /api/orders/create
app.post('/api/orders/create', async (req, res) => {
  console.log(`\n[ORDER CREATE] Попытка создания заказа:`, req.body);

  // Валидация обязательных полей
  // cargoType и trailerType теперь опциональные, не требуются
  const requiredFields = [
    'shipperName',
    'managerName',
    'origin',
    'destination',
    'pickupDate',
    'deliveryDate',
    'transportationCost',
    'vehicleCount'
  ];

  const missingFields = requiredFields.filter(field => !req.body[field]);
  if (missingFields.length > 0) {
    console.log(`[ORDER CREATE] Ошибка валидации: отсутствуют поля ${missingFields.join(', ')}`);
    return res.status(400).json({ 
      message: `Заполните все обязательные поля: ${missingFields.join(', ')}` 
    });
  }

  // Валидация типов данных
  const cost = parseFloat(req.body.transportationCost);
  const vehicleCount = parseInt(req.body.vehicleCount);

  if (isNaN(cost) || cost <= 0) {
    console.log(`[ORDER CREATE] Ошибка валидации: некорректная стоимость`);
    return res.status(400).json({ message: 'Стоимость должна быть положительным числом' });
  }

  if (isNaN(vehicleCount) || vehicleCount < 1 || vehicleCount > 5) {
    console.log(`[ORDER CREATE] Ошибка валидации: некорректное количество транспорта`);
    return res.status(400).json({ message: 'Количество транспорта должно быть от 1 до 5' });
  }

  // Валидация дат
  if (new Date(req.body.pickupDate) > new Date(req.body.deliveryDate)) {
    console.log(`[ORDER CREATE] Ошибка валидации: дата погрузки позже даты доставки`);
    return res.status(400).json({ message: 'Дата погрузки не может быть позже даты доставки' });
  }

  try {
    // Если vehicleCount > 1, создаем несколько заказов
    // ID будут сгенерированы автоматически в OrderDB.create()
    const orders = [];
    
    // Получаем текущий максимальный ID для определения диапазона
    const currentMaxId = await OrderDB.getMaxOrderId();

    for (let i = 0; i < vehicleCount; i++) {
      const orderData = {
        // ID не указываем - будет сгенерирован автоматически по порядку
        shipperName: req.body.shipperName,
        managerName: req.body.managerName,
        origin: req.body.origin,
        destination: req.body.destination,
        originLatitude: req.body.originLatitude || null,
        originLongitude: req.body.originLongitude || null,
        destinationLatitude: req.body.destinationLatitude || null,
        destinationLongitude: req.body.destinationLongitude || null,
        trailerType: req.body.trailerType || null,
        volume: req.body.volume || null,
        weight: req.body.weight || null,
        pickupDate: req.body.pickupDate,
        pickupTime: req.body.pickupTime || null,
        deliveryDate: req.body.deliveryDate,
        deliveryTime: req.body.deliveryTime || null,
        cargoType: req.body.cargoType || null,
        specialRequirements: req.body.specialRequirements || '',
        transportationCost: cost,
        length: req.body.length || null,
        width: req.body.width || null,
        height: req.body.height || null,
        vehicleCount: 1, // Каждый заказ имеет vehicleCount = 1
        externalOrderNumber: req.body.externalOrderNumber || null,
        status: 'Ожидает', // Статус заказа по умолчанию согласно схеме
        assignedDriverId: null
      };

      const createdOrder = await OrderDB.create(orderData);
      orders.push(createdOrder);
    }

    console.log(`[ORDER CREATE] Успешно создано ${orders.length} заказ(ов)`);
    
    // Возвращаем первый заказ (для обратной совместимости с фронтендом)
    res.status(201).json({ 
      order: orders[0],
      createdCount: orders.length 
    });
  } catch (error) {
    console.error(`[ORDER CREATE] Ошибка БД:`, error);
    res.status(500).json({ message: 'Ошибка сервера при создании заказа' });
  }
});

// GET /api/orders - Получить все заказы
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await OrderDB.findAll();
    res.json({ orders });
  } catch (error) {
    console.error(`[GET ORDERS] Ошибка БД:`, error);
    res.status(500).json({ message: 'Ошибка сервера при получении заказов' });
  }
});

// DELETE /api/orders/:id - Удалить заказ
app.delete('/api/orders/:id', async (req, res) => {
  try {
    const result = await OrderDB.delete(req.params.id);
    if (result.deleted > 0) {
      res.json({ message: 'Заказ удален' });
    } else {
      res.status(404).json({ message: 'Заказ не найден' });
    }
  } catch (error) {
    console.error(`[DELETE ORDER] Ошибка БД:`, error);
    res.status(500).json({ message: 'Ошибка сервера при удалении заказа' });
  }
});

// GET /api/users - Получить всех пользователей (для отладки)
app.get('/api/users', async (req, res) => {
  try {
    const db = require('./database').getDatabase();
    const users = await new Promise((resolve, reject) => {
      db.all('SELECT inn, name, company, user_type as userType FROM users', [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
    res.json({ users });
  } catch (error) {
    console.error(`[GET USERS] Ошибка БД:`, error);
    res.status(500).json({ message: 'Ошибка сервера при получении пользователей' });
  }
});

// ========================================
// CRUD операции для водителей
// ========================================

// GET /api/drivers - Получить всех водителей
app.get('/api/drivers', async (req, res) => {
  try {
    const drivers = await DriverDB.findAll();
    res.json({ drivers });
  } catch (error) {
    console.error(`[GET DRIVERS] Ошибка БД:`, error);
    res.status(500).json({ message: 'Ошибка сервера при получении водителей' });
  }
});

// POST /api/drivers - Создать нового водителя
app.post('/api/drivers', async (req, res) => {
  try {
    const driver = await DriverDB.create(req.body);
    res.status(201).json({ driver });
  } catch (error) {
    console.error(`[CREATE DRIVER] Ошибка БД:`, error);
    res.status(500).json({ message: 'Ошибка сервера при создании водителя' });
  }
});

// PUT /api/drivers/:id - Обновить водителя
app.put('/api/drivers/:id', async (req, res) => {
  try {
    const driver = await DriverDB.update(req.params.id, req.body);
    if (driver) {
      res.json({ driver });
    } else {
      res.status(404).json({ message: 'Водитель не найден' });
    }
  } catch (error) {
    console.error(`[UPDATE DRIVER] Ошибка БД:`, error);
    res.status(500).json({ message: 'Ошибка сервера при обновлении водителя' });
  }
});

// DELETE /api/drivers/:id - Удалить водителя
app.delete('/api/drivers/:id', async (req, res) => {
  try {
    const result = await DriverDB.delete(req.params.id);
    if (result.deleted > 0) {
      res.json({ message: 'Водитель удален' });
    } else {
      res.status(404).json({ message: 'Водитель не найден' });
    }
  } catch (error) {
    console.error(`[DELETE DRIVER] Ошибка БД:`, error);
    res.status(500).json({ message: 'Ошибка сервера при удалении водителя' });
  }
});

// ========================================
// CRUD операции для тягачей
// ========================================

// GET /api/trucks - Получить все тягачи
app.get('/api/trucks', async (req, res) => {
  try {
    const trucks = await TruckDB.findAll();
    res.json({ trucks });
  } catch (error) {
    console.error(`[GET TRUCKS] Ошибка БД:`, error);
    res.status(500).json({ message: 'Ошибка сервера при получении тягачей' });
  }
});

// POST /api/trucks - Создать новый тягач
app.post('/api/trucks', async (req, res) => {
  try {
    const truck = await TruckDB.create(req.body);
    res.status(201).json({ truck });
  } catch (error) {
    console.error(`[CREATE TRUCK] Ошибка БД:`, error);
    res.status(500).json({ message: 'Ошибка сервера при создании тягача' });
  }
});

// PUT /api/trucks/:id - Обновить тягач
app.put('/api/trucks/:id', async (req, res) => {
  try {
    const truck = await TruckDB.update(req.params.id, req.body);
    if (truck) {
      res.json({ truck });
    } else {
      res.status(404).json({ message: 'Тягач не найден' });
    }
  } catch (error) {
    console.error(`[UPDATE TRUCK] Ошибка БД:`, error);
    res.status(500).json({ message: 'Ошибка сервера при обновлении тягача' });
  }
});

// DELETE /api/trucks/:id - Удалить тягач
app.delete('/api/trucks/:id', async (req, res) => {
  try {
    const result = await TruckDB.delete(req.params.id);
    if (result.deleted > 0) {
      res.json({ message: 'Тягач удален' });
    } else {
      res.status(404).json({ message: 'Тягач не найден' });
    }
  } catch (error) {
    console.error(`[DELETE TRUCK] Ошибка БД:`, error);
    res.status(500).json({ message: 'Ошибка сервера при удалении тягача' });
  }
});

// ========================================
// CRUD операции для прицепов
// ========================================

// GET /api/trailers - Получить все прицепы
app.get('/api/trailers', async (req, res) => {
  try {
    const trailers = await TrailerDB.findAll();
    res.json({ trailers });
  } catch (error) {
    console.error(`[GET TRAILERS] Ошибка БД:`, error);
    res.status(500).json({ message: 'Ошибка сервера при получении прицепов' });
  }
});

// POST /api/trailers - Создать новый прицеп
app.post('/api/trailers', async (req, res) => {
  try {
    const trailer = await TrailerDB.create(req.body);
    res.status(201).json({ trailer });
  } catch (error) {
    console.error(`[CREATE TRAILER] Ошибка БД:`, error);
    res.status(500).json({ message: 'Ошибка сервера при создании прицепа' });
  }
});

// PUT /api/trailers/:id - Обновить прицеп
app.put('/api/trailers/:id', async (req, res) => {
  try {
    const trailer = await TrailerDB.update(req.params.id, req.body);
    if (trailer) {
      res.json({ trailer });
    } else {
      res.status(404).json({ message: 'Прицеп не найден' });
    }
  } catch (error) {
    console.error(`[UPDATE TRAILER] Ошибка БД:`, error);
    res.status(500).json({ message: 'Ошибка сервера при обновлении прицепа' });
  }
});

// DELETE /api/trailers/:id - Удалить прицеп
app.delete('/api/trailers/:id', async (req, res) => {
  try {
    const result = await TrailerDB.delete(req.params.id);
    if (result.deleted > 0) {
      res.json({ message: 'Прицеп удален' });
    } else {
      res.status(404).json({ message: 'Прицеп не найден' });
    }
  } catch (error) {
    console.error(`[DELETE TRAILER] Ошибка БД:`, error);
    res.status(500).json({ message: 'Ошибка сервера при удалении прицепа' });
  }
});

// ========================================
// CRUD операции для связок автопарка
// ========================================

// GET /api/fleet-assignments - Получить все связки
app.get('/api/fleet-assignments', async (req, res) => {
  try {
    const assignments = await FleetAssignmentDB.findAll();
    res.json({ assignments });
  } catch (error) {
    console.error(`[GET FLEET ASSIGNMENTS] Ошибка БД:`, error);
    res.status(500).json({ message: 'Ошибка сервера при получении связок' });
  }
});

// POST /api/fleet-assignments - Создать новую связку
app.post('/api/fleet-assignments', async (req, res) => {
  try {
    const assignment = await FleetAssignmentDB.create(req.body);
    res.status(201).json({ assignment });
  } catch (error) {
    console.error(`[CREATE FLEET ASSIGNMENT] Ошибка БД:`, error);
    res.status(500).json({ message: 'Ошибка сервера при создании связки' });
  }
});

// DELETE /api/fleet-assignments/:id - Удалить связку
app.delete('/api/fleet-assignments/:id', async (req, res) => {
  try {
    const result = await FleetAssignmentDB.delete(req.params.id);
    if (result.deleted > 0) {
      res.json({ message: 'Связка удалена' });
    } else {
      res.status(404).json({ message: 'Связка не найдена' });
    }
  } catch (error) {
    console.error(`[DELETE FLEET ASSIGNMENT] Ошибка БД:`, error);
    res.status(500).json({ message: 'Ошибка сервера при удалении связки' });
  }
});

app.listen(3001, () => console.log('\nMock backend listening on port 3001\n'));
