/**
 * Главный компонент приложения - Система управления логистикой
 * 
 * Приложение предоставляет два интерфейса:
 * - Для грузоотправителей: создание и отслеживание заказов
 * - Для логистов: управление заказами, подбор транспорта, управление автопарком
 * 
 * Особенности:
 * - Идентификация пользователей по ИНН
 * - Управление заказами с полной информацией о маршруте и транспорте
 * - Система комментариев для компаний, менеджеров и заказов
 * - Интеллектуальный подбор транспорта на основе требований
 * - Полностью на русском языке с российскими стандартами
 */

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { ShipperDashboard } from './components/ShipperDashboard';
import { LogisticianDashboard } from './components/LogisticianDashboard';
import { AuthForm } from './components/AuthForm';
import { Button } from './components/ui/button';
import { Truck, Package, LogOut, User } from 'lucide-react';
import { Toaster } from './components/ui/sonner';

/**
 * Интерфейс пользователя системы
 */
interface User {
  inn: string;          // ИНН для идентификации
  name: string;         // ФИО пользователя
  company: string;      // Название компании
  userType: 'shipper' | 'logistician';  // Тип пользователя
}

// ========================================
// ТЕСТОВЫЕ ДАННЫЕ
// ========================================
const initialOrders = [
  {
    id: '1',
    shipperName: 'ООО "Металл-Строй"',
    managerName: 'Сергей Петров',
    origin: 'ул. Тверская, 25, Москва',
    originLatitude: '55.7640', 
    originLongitude: '37.6050',
    destination: 'ул. Марата, 14, Санкт-Петербург',
    destinationLatitude: '59.9310', 
    destinationLongitude: '30.3610',
    trailerType: 'Бортовой',
    volume: '96 м³',
    weight: '20,000 кг',
    pickupDate: '2025-10-25',
    pickupTime: '09:00',
    deliveryDate: '2025-10-25',
    deliveryTime: '21:00',
    transportationCost: 45000,
    status: 'Ожидает',
    cargoType: 'Металлопрокат',
    specialRequirements: 'Требуется кран для погрузки',
    length: '12',
    width: '2.4',
    height: '3.2',
    assignedDriverId: null,
    externalOrderNumber: 'ATI-2024-001'
  },
  {
    id: '2',
    shipperName: 'ЗАО "Продукты Север"',
    managerName: 'Анна Смирнова',
    origin: 'ул. Красный проспект, 101, Новосибирск',
    originLatitude: '55.0415', 
    originLongitude: '82.9346',
    destination: 'пер. Базовый, 3, Екатеринбург',
    destinationLatitude: '56.8389', 
    destinationLongitude: '60.6057',
    trailerType: 'Рефрижератор',
    volume: '82 м³',
    weight: '18,000 кг',
    pickupDate: '2025-10-18',
    pickupTime: '10:00',
    deliveryDate: '2025-10-24',
    deliveryTime: '18:00',
    transportationCost: 42000,
    status: 'Назначен',
    cargoType: 'Скоропортящиеся продукты',
    specialRequirements: 'Температурный режим: +2 до +4°C',
    length: '13.6',
    width: '2.5',
    height: '2.4',
    assignedDriverId: 'ВОД-001',
    externalOrderNumber: 'CARGO-2024-789'
  },
  {
    id: '3',
    shipperName: 'ИП "Металлолом-Сбыт"',
    managerName: 'Михаил Козлов',
    origin: 'ул. Труда, 7, Челябинск',
    originLatitude: '55.1600', 
    originLongitude: '61.4000',
    destination: 'ул. Баумана, 10, Казань',
    destinationLatitude: '55.7900', 
    destinationLongitude: '49.1210',
    trailerType: 'Контейнеровоз',
    volume: '76 м³',
    weight: '22,000 кг',
    pickupDate: '2025-10-30',
    pickupTime: '06:00',
    deliveryDate: '2025-11-01',
    deliveryTime: '10:00',
    transportationCost: 38000,
    status: 'Ожидает',
    cargoType: 'Металлолом',
    specialRequirements: 'Необходима документация по ГОСТ',
    length: '12',
    width: '2.4',
    height: '2.65',
    assignedDriverId: null
  },
  {
    id: '4', 
    shipperName: 'ТранспортСервис', 
    managerName: 'Иван Петров', 
    origin: 'ул. Ленина, 10, Челябинск', 
    destination: 'ул. Озёрная, 7, Миасское', 
    originLatitude: '55.1600', 
    originLongitude: '61.4030', 
    destinationLatitude: '55.0450', 
    destinationLongitude: '60.9700', 
    trailerType: 'Тент', 
    volume: '85 м³', 
    weight: '9,000 кг', 
    pickupDate: '2025-10-25', 
    pickupTime: '06:00', 
    deliveryDate: '2025-10-25', 
    deliveryTime: '17:00', 
    transportationCost: 48000, 
    status: 'Ожидает', 
    cargoType: 'Мебель', 
    specialRequirements: '', 
    length: '13.6', 
    width: '2.45', 
    height: '2.7', 
    assignedDriverId: null, 
    externalOrderNumber: null}, 
  {
    id: '5', 
    shipperName: 'ЛогистикПро', 
    managerName: 'Ольга Смирнова', 
    origin: 'ул. Кирова, 15, Челябинск', 
    destination: 'ул. Советская, 18, Чебаркуль', 
    originLatitude: '55.1640', 
    originLongitude: '61.3950', 
    destinationLatitude: '55.0560', 
    destinationLongitude: '61.0600', 
    trailerType: 'Рефрижератор', 
    volume: '80 м³', 
    weight: '10,000 кг', 
    pickupDate: '2025-10-26', 
    pickupTime: '18:00', 
    deliveryDate: '2025-10-27', 
    deliveryTime: '10:00', 
    transportationCost: 50000, 
    status: 'Ожидает', 
    cargoType: 'Продукты питания', 
    specialRequirements: 'Температурный режим: -22 до -18°C', 
    length: '13.6', 
    width: '2.45', 
    height: '2.7', 
    assignedDriverId: null, 
    externalOrderNumber: null
  },  
  {
    id: '6', 
    shipperName: 'ФастКарго', 
    managerName: 'Алексей Кузнецов', 
    origin: 'просп. Ленина, 50, Челябинск', 
    destination: 'ул. Центральная, 5, Красногорский', 
    originLatitude: '55.1610', 
    originLongitude: '61.4100', 
    destinationLatitude: '55.1460', 
    destinationLongitude: '60.9960', 
    trailerType: 'Платформа', 
    volume: '90 м³', 
    weight: '11,000 кг', 
    pickupDate: '2025-10-30', 
    pickupTime: '07:00', 
    deliveryDate: '2025-10-30', 
    deliveryTime: '21:00', 
    transportationCost: 55000, 
    status: 'Ожидает', 
    cargoType: 'Строительный материал', 
    specialRequirements: '', 
    length: '13.6', 
    width: '2.45', 
    height: '2.7', 
    assignedDriverId: null, 
    externalOrderNumber: null}, 
  {
    id: '7', 
    shipperName: 'ЭкспрессТранс', 
    managerName: 'Екатерина Волкова', 
    origin: 'ул. Мира, 21, Челябинск', 
    destination: 'ул. Свободы, 10, Челябинск', 
    originLatitude: '55.1625', 
    originLongitude: '61.4121', 
    destinationLatitude: '55.1480', 
    destinationLongitude: '61.4000', 
    trailerType: 'Рефрижератор', 
    volume: '80 м³', 
    weight: '10,000 кг', 
    pickupDate: '2025-10-26', 
    pickupTime: '19:00', 
    deliveryDate: '2025-10-26', 
    deliveryTime: '22:00', 
    transportationCost: 10000, 
    status: 'Ожидает', 
    cargoType: 'Продукты питания', 
    specialRequirements: '', 
    length: '13.6', 
    width: '2.45', 
    height: '2.7', 
    assignedDriverId: null, 
    externalOrderNumber: null
  }
];

interface Order {
  id: string;
  shipperName: string;
  managerName: string;
  origin: string;
  destination: string;
  originLatitude?: string;
  originLongitude?: string;
  destinationLatitude?: string;
  destinationLongitude?: string;
  trailerType: string;
  volume: string;
  weight: string;
  pickupDate: string;
  pickupTime?: string;
  deliveryDate: string;
  deliveryTime?: string;
  transportationCost: number;
  status: string;
  cargoType: string;
  specialRequirements: string;
  length: string;
  width: string;
  height: string;
  assignedDriverId: string | null;
  externalOrderNumber?: string;
}

interface Driver {
  id: string;
  name: string;
  phone: string;
  licenseNumber: string;
  availability: 'Доступен' | 'В рейсе' | 'На ТО' | 'Не работает';
  comment: string;
}

/**
 * Интерфейс тягача
 */
interface Truck {
  id: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  vinNumber: string;
  maintenanceStatus: 'Исправен' | 'Требует ТО' | 'На ТО';
  currentLocation: string;
  comment: string;
}

/**
 * Интерфейс прицепа
 */
interface Trailer {
  id: string;
  licensePlate: string;
  trailerType: string;
  length: string;
  width: string;
  height: string;
  volume: string;
  comment: string;
}

/**
 * Интерфейс назначения автопарка (связка водитель-тягач-прицеп)
 */
interface FleetAssignment {
  id: string;
  driverId: string;
  truckId: string;
  trailerId: string;
  assignedDate: string;
}

/**
 * Интерфейс комментариев для компаний, менеджеров и заказов
 */
interface Comments {
  companies: { [companyName: string]: string };
  managers: { [managerName: string]: string };
  orders: { [orderId: string]: string };
}

/**
 * Интерфейс контактной информации менеджера
 */
interface ManagerInfo {
  phone: string;
  email: string;
}

/**
 * Тестовые данные для водителей
 */
const initialDrivers: Driver[] = [
  {
    id: 'ВОД-001',
    name: 'Иван Петров',
    phone: '+7 (495) 123-45-67',
    licenseNumber: 'ВУ-77-123456',
    availability: 'Доступен',
    comment: ''
  },
  {
    id: 'ВОД-002',
    name: 'Алексей Сидоров',
    phone: '+7 (812) 987-65-43',
    licenseNumber: 'ВУ-78-789012',
    availability: 'В рейсе',
    comment: ''
  },
  {
    id: 'ВОД-003',
    name: 'Иван Иванов',
    phone: '+7 (900) 111-22-22',
    licenseNumber: "ВУ-79-123246",
    availability: "Доступен",
    comment: ''
  },
    {id: 'ВОД-004',
     name: 'Петр Петров',
     phone: '+7 (900) 333-44-44',
     licenseNumber: 'ВУ-80-643212',
     availability: 'Не работает',
     comment: ''
    },
    {id: 'ВОД-005',
     name: "Алексей Смирнов",
     phone: "+7 (900) 555-66-66",
     licenseNumber: "ВУ-81-958672",
     availability: "Доступен",
     comment: ''
    },
    {id:'ВОД-006',
     name: 'Сергей Кузнецов',
     phone: '+7 (900) 777-88-88',
     licenseNumber: "ВУ-82-954322",
     availability: "Не работает",
     comment: ''
    },
    {id: 'ВОД-007',
     name: 'Михаил Орлов',
     phone: '+7 (900) 999-00-00',
     licenseNumber: 'ВУ-83-713222',
     availability: 'Доступен',
     comment: ''
  }
];

const initialTrucks: Truck[] = [
  {
    id: 'АВТ-001',
    make: 'КАМАЗ',
    model: '5490',
    year: 2022,
    licensePlate: 'М123АВ77',
    vinNumber: 'XTC5490NEO123456',
    maintenanceStatus: 'Исправен',
    currentLocation: 'Москва, Россия',
    comment: ''
  },
  {
    id: 'АВТ-002',
    make: 'МАЗ',
    model: '6312',
    year: 2021,
    licensePlate: 'В456СД78',
    vinNumber: 'Y3MAZ6312CJ789012',
    maintenanceStatus: 'Исправен',
    currentLocation: 'Санкт-Петербург, Россия',
    comment: ''
  },
  {
    id: 'АВТ-003', 
    make: 'Volvo', 
    model: 'FH16', 
    year: 2020, 
    licensePlate: 'C123AB 74', 
    vinNumber: 'VIN00001', 
    maintenanceStatus: 'Исправен', 
    currentLocation: 'ул. Ленина, 10, Челябинск', 
    comment: ''
  }, 
  {
    id: 'АВТ-004', 
    make: 'Scania', 
    model: 'R580', 
    year: 2019, 
    licensePlate: 'C456CD 74', 
    vinNumber: 'VIN00002', 
    maintenanceStatus: 'Исправен', 
    currentLocation: 'ул. Кирова, 15, Челябинск', 
    comment: ''
  }, 
  {
    id: 'АВТ-005', 
    make: 'MAN', 
    model: 'TGX', 
    year: 2018, 
    licensePlate: 'C789EF 74', 
    vinNumber: 'VIN00003', 
    maintenanceStatus: 'Исправен', 
    currentLocation: 'просп. Ленина, 50, Челябинск', 
    comment: ''
  }, 
  {
    id: 'АВТ-006', 
    make: 'Mercedes', 
    model: 'Actros', 
    year: 2021, 
    licensePlate: 'C101GH 74', 
    vinNumber: 'VIN00004', 
    maintenanceStatus: 'Исправен', 
    currentLocation: 'ул. Труда, 5, Челябинск', 
    comment: ''
  }, 
  {
    id: 'АВТ-007', 
    make: 'DAF', 
    model: 'XF', 
    year: 2017, 
    licensePlate: 'C202IJ 74', 
    vinNumber: 'VIN00005', 
    maintenanceStatus: 'Исправен', 
    currentLocation: 'ул. Свободы, 20, Челябинск', 
    comment: ''
  }
];

const initialTrailers: Trailer[] = [
  {
    id: 'ПРЦ-001',
    licensePlate: 'АМ123477',
    trailerType: 'Бортовой',
    length: '13.6',
    width: '2.45',
    height: '2.9',
    volume: '96.7 м³',
    comment: ''
  },
  {
    id: 'ПРЦ-002',
    licensePlate: 'СК456778',
    trailerType: 'Контейнеровоз',
    length: '12.2',
    width: '2.45',
    height: '2.7',
    volume: '80.7 м³',
    comment: ''
  },
  {
    id: 'ПРЦ-003', 
    licensePlate: 'AB1111', 
    trailerType: 'Тент', 
    length: '13.6', 
    width: '2.45', 
    height: '2.7', 
    volume: '85 м³', 
    comment: ''
  }, 
  {
    id: 'ПРЦ-004', 
    licensePlate: 'ВС2222', 
    trailerType: 'Рефрижератор', 
    length: '13.6', 
    width: '2.45', 
    height: '2.7', 
    volume: '80 м³', 
    comment: ''
  }, 
  {
    id: 'ПРЦ-005', 
    licensePlate: 'СД3333', 
    trailerType: 'Тент', 
    length: '13.6', 
    width: '2.45', 
    height: '2.7', 
    volume: '85 м³', 
    comment: ''}, 

  {
    id: 'ПРЦ-006', 
    licensePlate: 'ДЕ4444', 
    trailerType: 'Платформа', 
    length: '13.6', 
    width: '2.45', 
    height: '2.7', 
    volume: '90 м³', 
    comment: ''
  }, 
  {
    id: 'ПРЦ-007', 
    licensePlate: 'ЕФ5555', 
    trailerType: 'Рефрижератор', 
    length: '13.6', 
    width: '2.45', 
    height: '2.7', 
    volume: '80 м³', 
    comment: ''}
];

const initialFleetAssignments: FleetAssignment[] = [
  {
    id: 'СВЗ-001',
    driverId: 'ВОД-001',
    truckId: 'АВТ-001',
    trailerId: 'ПРЦ-001',
    assignedDate: '2024-01-15'
  },
  {
    id: 'СВЗ-002',
    driverId: 'ВОД-002',
    truckId: 'АВТ-002',
    trailerId: 'ПРЦ-002',
    assignedDate: '2024-02-10'
  },
  {
    id: 'СВЗ-003', 
    driverId: 'ВОД-003', 
    truckId: 'АВТ-003', 
    trailerId: 'ПРЦ-003', 
    assignedDate: '2024-05-27'
  }, 
  {
    id: 'СВЗ-004', 
    driverId: 'ВОД-004', 
    truckId: 'АВТ-004', 
    trailerId: 'ПРЦ-004', 
    assignedDate: '2024-07-12'
  }, 
  {
    id: 'СВЗ-005', 
    driverId: 'ВОД-005', 
    truckId: 'АВТ-005', 
    trailerId: 'ПРЦ-005', 
    assignedDate: '2024-09-03'
  }, 
  {
    id: 'СВЗ-006', 
    driverId: 'ВОД-006', 
    truckId: 'АВТ-006', 
    trailerId: 'ПРЦ-006', 
    assignedDate: '2024-10-24'}, 
  {
    id: 'СВЗ-007', 
    driverId: 'ВОД-007', 
    truckId: 'АВТ-007', 
    trailerId: 'ПРЦ-007', 
    assignedDate: '2024-12-05'
  }
];

/**
 * Главный компонент приложения
 * Управляет состоянием всего приложения и маршрутизацией между интерфейсами
 */
export default function App() {
  // ========================================
  // СОСТОЯНИЕ ПРИЛОЖЕНИЯ
  // ========================================
  
  const [user, setUser] = useState<User | null>(null);  // Текущий авторизованный пользователь
  const [orders, setOrders] = useState<Order[]>(initialOrders);  // Все заказы в системе
  const [drivers, setDrivers] = useState<Driver[]>(initialDrivers);  // Все водители
  const [trucks, setTrucks] = useState<Truck[]>(initialTrucks);  // Все тягачи
  const [trailers, setTrailers] = useState<Trailer[]>(initialTrailers);  // Все прицепы
  const [fleetAssignments, setFleetAssignments] = useState<FleetAssignment[]>(initialFleetAssignments);  // Назначения автопарка
  
  // Комментарии к компаниям, менеджерам и заказам
  const [comments, setComments] = useState<Comments>({
    companies: {},
    managers: {},
    orders: {}
  });

  // Контактная информация менеджеров
  const [managersInfo, setManagersInfo] = useState<{ [managerName: string]: ManagerInfo }>({
    'Сергей Петров': { phone: '+7 (495) 123-45-67', email: 'sergey.petrov@metallstroy.ru' },
    'Анна Смирнова': { phone: '+7 (495) 987-65-43', email: 'anna.smirnova@produktysever.ru' },
    'Михаил Козлов': { phone: '+7 (495) 555-12-34', email: 'mikhail.kozlov@metallolom.ru' }
  });

  // ========================================
  // ОБРАБОТЧИКИ АУТЕНТИФИКАЦИИ
  // ========================================

  /**
   * Обработка входа пользователя в систему
   */
  const handleLogin = (userData: User) => {
    setUser(userData);
  };

  /**
   * Обработка выхода пользователя из системы
   */
  const handleLogout = () => {
    setUser(null);
  };

  // ========================================
  // УПРАВЛЕНИЕ ЗАКАЗАМИ
  // ========================================

  /**
   * Добавление нового заказа или нескольких заказов
   * Если vehicleCount > 1, создается соответствующее количество копий заказа
   * Каждый заказ получает уникальный числовой ID
   * ID генерируется на основе максимального существующего ID + 1
   */
  const addOrder = (newOrder: Omit<Order, 'id' | 'status' | 'assignedDriverId'> & { vehicleCount?: number }) => {
    const vehicleCount = newOrder.vehicleCount || 1;
    const newOrders: Order[] = [];
    
    // Находим максимальный ID среди существующих заказов
    const maxId = orders.reduce((max, order) => {
      const currentId = parseInt(order.id);
      return !isNaN(currentId) && currentId > max ? currentId : max;
    }, 0);
    
    // Создаем нужное количество заказов
    for (let i = 0; i < vehicleCount; i++) {
      const orderNumber = maxId + newOrders.length + 1;
      const order: Order = {
        shipperName: newOrder.shipperName,
        managerName: newOrder.managerName,
        origin: newOrder.origin,
        destination: newOrder.destination,
        originLatitude: newOrder.originLatitude,
        originLongitude: newOrder.originLongitude,
        destinationLatitude: newOrder.destinationLatitude,
        destinationLongitude: newOrder.destinationLongitude,
        trailerType: newOrder.trailerType,
        volume: newOrder.volume,
        weight: newOrder.weight,
        pickupDate: newOrder.pickupDate,
        pickupTime: newOrder.pickupTime,
        deliveryDate: newOrder.deliveryDate,
        deliveryTime: newOrder.deliveryTime,
        transportationCost: newOrder.transportationCost,
        cargoType: newOrder.cargoType,
        specialRequirements: newOrder.specialRequirements,
        length: newOrder.length,
        width: newOrder.width,
        height: newOrder.height,
        externalOrderNumber: newOrder.externalOrderNumber,
        id: String(orderNumber),
        status: 'Ожидает',
        assignedDriverId: null
      };
      newOrders.push(order);
    }
    
    setOrders([...orders, ...newOrders]);
  };

  /**
   * Удаление заказа из системы
   */
  const deleteOrder = (orderId: string) => {
    setOrders(orders.filter(order => order.id !== orderId));
  };

  /**
   * Обновление статуса заказа
   */
  const updateOrderStatus = (orderId: string, status: string) => {
    setOrders(orders.map(order => 
      order.id === orderId ? { ...order, status } : order
    ));
  };

  /**
   * Назначение или отмена назначения водителя на заказ
   */
  const assignDriverToOrder = (orderId: string, driverId: string | null) => {
    setOrders(orders.map(order => 
      order.id === orderId ? { ...order, assignedDriverId: driverId, status: driverId ? 'Назначен' : 'Ожидает' } : order
    ));
  };

  // ========================================
  // УПРАВЛЕНИЕ АВТОПАРКОМ
  // ========================================

  /**
   * Добавление нового водителя в систему
   */
  const addDriver = (newDriver: Omit<Driver, 'id'>) => {
    const driver: Driver = {
      ...newDriver,
      id: `ВОД-${String(drivers.length + 1).padStart(3, '0')}`
    };
    setDrivers([...drivers, driver]);
  };

  /**
   * Добавление нового транспортного средства (тягача)
   */
  const addTruck = (newTruck: Omit<Truck, 'id'>) => {
    const truck: Truck = {
      ...newTruck,
      id: `АВТ-${String(trucks.length + 1).padStart(3, '0')}`
    };
    setTrucks([...trucks, truck]);
  };

  /**
   * Добавление нового прицепа
   */
  const addTrailer = (newTrailer: Omit<Trailer, 'id'>) => {
    const trailer: Trailer = {
      ...newTrailer,
      id: `ПРЦ-${String(trailers.length + 1).padStart(3, '0')}`
    };
    setTrailers([...trailers, trailer]);
  };

  /**
   * Создание связи между водителем, транспортом и прицепом
   */
  const addFleetAssignment = (assignment: Omit<FleetAssignment, 'id'>) => {
    const newAssignment: FleetAssignment = {
      ...assignment,
      id: `СВЗ-${String(fleetAssignments.length + 1).padStart(3, '0')}`
    };
    setFleetAssignments([...fleetAssignments, newAssignment]);
  };

  /**
   * Удаление связи между элементами автопарка
   */
  const deleteFleetAssignment = (assignmentId: string) => {
    setFleetAssignments(fleetAssignments.filter(a => a.id !== assignmentId));
  };

  /**
   * Обновление данных водителя
   */
  const updateDriver = (driverId: string, updates: Partial<Driver>) => {
    setDrivers(drivers.map(driver => 
      driver.id === driverId ? { ...driver, ...updates } : driver
    ));
  };

  /**
   * Обновление данных транспортного средства
   */
  const updateTruck = (truckId: string, updates: Partial<Truck>) => {
    setTrucks(trucks.map(truck => 
      truck.id === truckId ? { ...truck, ...updates } : truck
    ));
  };

  /**
   * Обновление данных прицепа
   */
  const updateTrailer = (trailerId: string, updates: Partial<Trailer>) => {
    setTrailers(trailers.map(trailer => 
      trailer.id === trailerId ? { ...trailer, ...updates } : trailer
    ));
  };

  // ========================================
  // УПРАВЛЕНИЕ КОММЕНТАРИЯМИ И КОНТАКТАМИ
  // ========================================

  /**
   * Обновление комментария к компании
   */
  const updateCompanyComment = (companyName: string, comment: string) => {
    setComments(prev => ({
      ...prev,
      companies: { ...prev.companies, [companyName]: comment }
    }));
  };

  /**
   * Обновление комментария к менеджеру
   */
  const updateManagerComment = (managerName: string, comment: string) => {
    setComments(prev => ({
      ...prev,
      managers: { ...prev.managers, [managerName]: comment }
    }));
  };

  /**
   * Обновление комментария к заказу
   */
  const updateOrderComment = (orderId: string, comment: string) => {
    setComments(prev => ({
      ...prev,
      orders: { ...prev.orders, [orderId]: comment }
    }));
  };

  /**
   * Обновление контактной информации менеджера
   */
  const updateManagerInfo = (managerName: string, info: ManagerInfo) => {
    setManagersInfo(prev => ({
      ...prev,
      [managerName]: info
    }));
  };

  /**
   * Обновление адреса и координат заказа
   */
  const updateOrderAddress = (
    orderId: string, 
    field: 'origin' | 'destination', 
    address: string, 
    latitude?: string, 
    longitude?: string
  ) => {
    setOrders(orders.map(order => {
      if (order.id === orderId) {
        if (field === 'origin') {
          return {
            ...order,
            origin: address,
            originLatitude: latitude,
            originLongitude: longitude
          };
        } else {
          return {
            ...order,
            destination: address,
            destinationLatitude: latitude,
            destinationLongitude: longitude
          };
        }
      }
      return order;
    }));
  };

  /**
   * Обновление даты и времени заказа
   */
  const updateOrderDate = (
    orderId: string,
    field: 'pickup' | 'delivery',
    date: string,
    time?: string
  ) => {
    setOrders(orders.map(order => {
      if (order.id === orderId) {
        if (field === 'pickup') {
          return {
            ...order,
            pickupDate: date,
            pickupTime: time
          };
        } else {
          return {
            ...order,
            deliveryDate: date,
            deliveryTime: time
          };
        }
      }
      return order;
    }));
  };

  // ========================================
  // РЕНДЕРИНГ
  // ========================================

  // Если пользователь не авторизован, показываем форму входа
  if (!user) {
    return <AuthForm onLogin={handleLogin} />;
  }

  // Главный интерфейс приложения
  return (
    <div className="min-h-screen bg-background">
      {/* Компонент для отображения toast уведомлений */}
      <Toaster position="top-right" richColors />
      
      {/* Шапка приложения с информацией о пользователе */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Truck className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-semibold">Система управления логистикой</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4" />
                <span>{user.name}</span>
                <span className="text-muted-foreground">({user.company})</span>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Выйти
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {user.userType === 'shipper' ? (
          <ShipperDashboard 
            onAddOrder={addOrder} 
            currentUser={user}
            orders={orders.filter(order => order.shipperName === user.company)}
            onDeleteOrder={deleteOrder}
          />
        ) : (
          <LogisticianDashboard 
            orders={orders} 
            drivers={drivers}
            trucks={trucks}
            trailers={trailers}
            fleetAssignments={fleetAssignments}
            comments={comments}
            managersInfo={managersInfo}
            onUpdateOrderStatus={updateOrderStatus}
            onAssignDriverToOrder={assignDriverToOrder}
            onAddDriver={addDriver}
            onAddTruck={addTruck}
            onAddTrailer={addTrailer}
            onAddFleetAssignment={addFleetAssignment}
            onDeleteFleetAssignment={deleteFleetAssignment}
            onUpdateDriver={updateDriver}
            onUpdateTruck={updateTruck}
            onUpdateTrailer={updateTrailer}
            onAddOrder={addOrder}
            onDeleteOrder={deleteOrder}
            onUpdateCompanyComment={updateCompanyComment}
            onUpdateManagerComment={updateManagerComment}
            onUpdateOrderComment={updateOrderComment}
            onUpdateOrderAddress={updateOrderAddress}
            onUpdateOrderDate={updateOrderDate}
            onUpdateManagerInfo={updateManagerInfo}
          />
        )}
      </main>
    </div>
  );
}
