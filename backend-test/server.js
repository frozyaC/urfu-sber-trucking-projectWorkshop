const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

let users = [
  { inn: '7701234567', password: 'shipper123', company: 'ООО "МеталлСтрой"', userType: 'shipper' },
  { inn: '7709876543', password: 'logist123', company: 'ООО "ЛогистикПро"', userType: 'logistician' },
  { inn: 'demo', password: 'demo', company: 'Демо компания', userType: 'shipper' }
];

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
app.post('/api/auth/login', (req, res) => {
  console.log(`\n[AUTH LOGIN] Попытка авторизации:`, req.body);

  const err = validateFields(req.body, true);
  if (err) {
    console.log(`[AUTH LOGIN] Ошибка валидации: ${err}`);
    return res.status(400).json({message: err});
  }

  const user = users.find(u => u.inn === req.body.inn && u.password === req.body.password);
  if (!user) {
    console.log(`[AUTH LOGIN] Неуспешная попытка (неверный ИНН/пароль) для ИНН: ${req.body.inn}`);
    return res.status(401).json({message: 'Неверный ИНН или пароль'});
  }
  console.log(`[AUTH LOGIN] Успешная авторизация для ИНН: ${user.inn}`);
  res.json({user});
});

// POST /api/auth/register
app.post('/api/auth/register', (req, res) => {
  console.log(`\n[AUTH REGISTER] Попытка регистрации:`, req.body);

  const err = validateFields(req.body, false);
  if (err) {
    console.log(`[AUTH REGISTER] Ошибка валидации: ${err}`);
    return res.status(400).json({message: err});
  }

  const exists = users.some(u => u.inn === req.body.inn);
  if (exists) {
    console.log(`[AUTH REGISTER] Отказ - пользователь c ИНН ${req.body.inn} уже существует`);
    return res.status(409).json({message: 'Пользователь с этим ИНН уже существует'});
  }
  const newUser = {
    inn: req.body.inn,
    password: req.body.password,
    company: req.body.company,
    userType: req.body.userType
  };
  users.push(newUser);
  console.log(`[AUTH REGISTER] Успешная регистрация ИНН: ${newUser.inn}`);
  res.json(newUser);
});

// POST /api/orders/create
app.post('/api/orders/create', (req, res) => {
  console.log(`\n[ORDER CREATE] Попытка создания заказа:`, req.body);

  // Валидация обязательных полей
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

  // Создание объекта заказа
  const order = {
    id: Date.now().toString(), // Простой ID на основе времени
    shipperName: req.body.shipperName,
    managerName: req.body.managerName,
    origin: req.body.origin,
    destination: req.body.destination,
    originLatitude: req.body.originLatitude || null,
    originLongitude: req.body.originLongitude || null,
    destinationLatitude: req.body.destinationLatitude || null,
    destinationLongitude: req.body.destinationLongitude || null,
    trailerType: req.body.trailerType || 'Самосвал',
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
    vehicleCount: vehicleCount,
    externalOrderNumber: req.body.externalOrderNumber || null,
    createdAt: new Date().toISOString(),
    status: 'pending' // Статус заказа по умолчанию
  };

  console.log(`[ORDER CREATE] Успешное создание заказа ID: ${order.id}`);
  res.status(201).json({ order });
});

app.listen(3001, () => console.log('\nMock backend listening on port 3001\n'));
