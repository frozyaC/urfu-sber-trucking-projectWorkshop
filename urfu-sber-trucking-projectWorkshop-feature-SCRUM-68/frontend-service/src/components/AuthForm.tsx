// /**
//  * Компонент формы авторизации и регистрации
//  *
//  * Предоставляет интерфейс для входа в систему и регистрации новых пользователей.
//  * Поддерживает два типа пользователей:
//  * - Грузоотправители (создают и отслеживают заказы)
//  * - Логисты (управляют заказами и автопарком)
//  *
//  * Особенности:
//  * - Идентификация по ИНН вместо email
//  * - Переключение между формами входа и регистрации
//  * - Выбор типа пользователя при регистрации
//  * - Валидация обязательных полей
//  */

import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Truck, Package, Hash, Lock, Building } from 'lucide-react';

// /**
//  * Интерфейс пользователя системы
//  */
// interface User {
//   inn: string;          // ИНН для идентификации
//   name: string;         // ФИО пользователя
//   company: string;      // Название компании
//   userType: 'shipper' | 'logistician';  // Тип пользователя
// }

// /**
//  * Свойства компонента авторизации
//  */
// interface AuthFormProps {
//   onLogin: (user: User) => void;  // Функция вызываемая при успешном входе
// }

// export function AuthForm({ onLogin }: AuthFormProps) {
//   const [isLogin, setIsLogin] = useState(true);  // Флаг режима входа (true) или регистрации (false)
//   const [loginError, setLoginError] = useState(''); // Сообщение об ошибке входа

//   // Состояние формы
//   const [formData, setFormData] = useState({
//     inn: '',          // ИНН компании/пользователя
//     password: '',     // Пароль
//     name: '',         // ФИО (только для регистрации)
//     company: '',      // Название компании (только для регистрации)
//     userType: 'shipper' as 'shipper' | 'logistician'  // Тип пользователя
//   });

//   // Тестовые учетные записи для демонстрации
//   const testAccounts = [
//     { inn: '7701234567', password: 'shipper123', name: 'Иван Иванов', company: 'ООО "МеталлСтрой"', userType: 'shipper' as const },
//     { inn: '7709876543', password: 'logist123', name: 'Петр Петров', company: 'ООО "ЛогистикПро"', userType: 'logistician' as const },
//     { inn: 'demo', password: 'demo', name: 'Демо пользователь', company: 'Демо компания', userType: 'shipper' as const }
//   ];

//   /**
//    * Обработчик отправки формы
//    * Выполняет базовую валидацию и авторизует пользователя
//    */
//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     setLoginError(''); // Очистка предыдущих ошибок

//     if (!formData.inn || !formData.password) {
//       setLoginError('Пожалуйста, заполните все обязательные поля');
//       return;
//     }

//     if (!isLogin && !formData.company) {
//       setLoginError('Пожалуйста, заполните все поля для регистрации');
//       return;
//     }

//     // Создание объекта пользователя и авторизация
//     if (isLogin) {
//       // Проверка учетных данных для входа
//       const account = testAccounts.find(
//         acc => acc.inn === formData.inn && acc.password === formData.password
//       );

//       if (!account) {
//         setLoginError('Неверный ИНН или пароль. Попробуйте: ИНН "demo", пароль "demo"');
//         return;
//       }

//       const user: User = {
//         inn: account.inn,
//         name: account.name,
//         company: account.company,
//         userType: formData.userType
//       };

//       onLogin(user);
//     } else {
//       // Регистрация нового пользователя
//       const user: User = {
//         inn: formData.inn,
//         name: formData.name || 'Пользователь',
//         company: formData.company,
//         userType: formData.userType
//       };

//       onLogin(user);
//     }
//   };

//   /**
//    * Сброс формы при переключении между входом и регистрацией
//    */
//   const resetForm = () => {
//     setFormData({
//       inn: '',
//       password: '',
//       name: '',
//       company: '',
//       userType: 'shipper'
//     });
//     setLoginError(''); // Очистка ошибок
//   };

interface User {
  inn: string;
  name: string;
  company: string;
  userType: 'shipper' | 'logistician';
}

interface AuthFormProps {
  onLogin: (user: User) => void;
}

export function AuthForm({ onLogin }: AuthFormProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [loginError, setLoginError] = useState('');
  const [formData, setFormData] = useState({
    inn: '',
    password: '',
    company: '',
    userType: 'shipper' as 'shipper' | 'logistician'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!formData.inn || !formData.password) {
      setLoginError('Пожалуйста, заполните все обязательные поля');
      return;
    }
    if (!isLogin && !formData.company) {
      setLoginError('Пожалуйста, заполните все поля для регистрации');
      return;
    }

    const url = isLogin
      ? 'http://localhost:8080/api/auth/login'
      : 'http://localhost:8080/api/auth/register';

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(formData)
      });
      const result = await response.json();

      if (!response.ok) {
        setLoginError(result.message || 'Ошибка авторизации / регистрации');
        return;
      }

      // Возвращаем только нужные поля с безопасным значением имени
      const { inn, company, userType, name } = result.user || result;
      onLogin({ inn, company, userType, name: name || 'Пользователь' });
    } catch (err) {
      setLoginError('Ошибка соединения с сервером');
    }
  };

  const resetForm = () => {
    setFormData({
      inn: '',
      password: '',
      company: '',
      userType: 'shipper'
    });
    setLoginError('');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Truck className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-semibold">Система управления логистикой</h1>
          </div>
          <p className="text-muted-foreground">
            Войдите в систему или создайте новый аккаунт
          </p>
        </div>

        <Tabs value={isLogin ? 'login' : 'register'} onValueChange={(value: string) => {
          setIsLogin(value === 'login');
          resetForm();
        }}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Вход</TabsTrigger>
            <TabsTrigger value="register">Регистрация</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>Вход в систему</CardTitle>
                <CardDescription>
                  Введите ваши учетные данные для входа
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {loginError && (
                    <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm border border-destructive/20">
                      {loginError}
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="login-inn">ИНН</Label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-inn"
                        type="text"
                        placeholder="1234567890"
                        className="pl-10"
                        value={formData.inn}
                        onChange={(e) => setFormData(prev => ({ ...prev, inn: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password">Пароль</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10"
                        value={formData.password}
                        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                 {/* <div className="space-y-2">
                    <Label htmlFor="login-usertype">Тип аккаунта</Label>
                    <Select value={formData.userType} onValueChange={(value: 'shipper' | 'logistician') =>
                      setFormData(prev => ({ ...prev, userType: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="shipper">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            Грузоотправитель
                          </div>
                        </SelectItem>
                        <SelectItem value="logistician">
                          <div className="flex items-center gap-2">
                            <Truck className="h-4 w-4" />
                            Грузоперевозчик
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div> */}

                  <Button type="submit" className="w-full">
                    Войти
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="register">
            <Card>
              <CardHeader>
                <CardTitle>Регистрация</CardTitle>
                <CardDescription>
                  Создайте новый аккаунт для работы с системой
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {loginError && (
                    <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm border border-destructive/20">
                      {loginError}
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="register-inn">ИНН</Label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="register-inn"
                        type="text"
                        placeholder="1234567890"
                        className="pl-10"
                        value={formData.inn}
                        onChange={(e) => setFormData(prev => ({ ...prev, inn: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-company">Название компании</Label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="register-company"
                        placeholder="ООО 'Ваша компания'"
                        className="pl-10"
                        value={formData.company}
                        onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-password">Пароль</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="register-password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10"
                        value={formData.password}
                        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-usertype">Тип аккаунта</Label>
                    <Select value={formData.userType} onValueChange={(value: 'shipper' | 'logistician') =>
                      setFormData(prev => ({ ...prev, userType: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="shipper">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            Грузоотправитель
                          </div>
                        </SelectItem>
                        <SelectItem value="logistician">
                          <div className="flex items-center gap-2">
                            <Truck className="h-4 w-4" />
                            Грузоперевозчик
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button type="submit" className="w-full">
                    Зарегистрироваться
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="text-center text-sm text-muted-foreground space-y-2">
          <p>Демо-версия системы управления логистикой</p>
          <div className="space-y-1">
            <p className="font-medium">Тестовые аккаунты:</p>
            <p>ИНН: <span className="font-mono">demo</span> / Пароль: <span className="font-mono">demo</span></p>
            <p>ИНН: <span className="font-mono">7701234567</span> / Пароль: <span className="font-mono">shipper123</span> (Грузоотправитель)</p>
            <p>ИНН: <span className="font-mono">7709876543</span> / Пароль: <span className="font-mono">logist123</span> (Логист)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
