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

app.listen(3001, () => console.log('\nMock backend listening on port 3001\n'));
