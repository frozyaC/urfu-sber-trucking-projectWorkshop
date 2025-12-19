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

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { ShipperDashboard } from './components/ShipperDashboard';
import { LogisticianDashboard } from './components/LogisticianDashboard';
import { AuthForm } from './components/AuthForm';
import { Button } from './components/ui/button';
import { Truck, Package, LogOut, User } from 'lucide-react';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner';
import { updateOrderStatusRequest } from './services/orderApi';
import { fetchAllOrders, fetchAllDrivers, fetchAllTrucks, fetchAllTrailers, fetchAllFleetAssignments } from './services/dataApi';
import {
  createDriver,
  updateDriver as updateDriverApi,
  deleteDriver as deleteDriverApi,
  createTruck,
  updateTruck as updateTruckApi,
  deleteTruck as deleteTruckApi,
  createTrailer,
  updateTrailer as updateTrailerApi,
  deleteTrailer as deleteTrailerApi,
  createFleetAssignment,
  updateFleetAssignment as updateFleetAssignmentApi,
  deleteFleetAssignment as deleteFleetAssignmentApi,
} from './services/fleetApi';

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
// ИНТЕРФЕЙСЫ
// ========================================

/**
 * Интерфейс заказа на перевозку
 */
interface Order {
  id: string;
  shipperName: string;
  managerName?: string;           // Опционально
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
  externalOrderNumber?: string | null;
}

/**
 * Интерфейс водителя
 */
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
 * Главный компонент приложения
 * Управляет состоянием всего приложения и маршрутизацией между интерфейсами
 */
export default function App() {
  // ========================================
  // СОСТОЯНИЕ ПРИЛОЖЕНИЯ
  // ========================================
  
  const [user, setUser] = useState<User | null>(null);  // Текущий авторизованный пользователь
  const [orders, setOrders] = useState<Order[]>([]);  // Все заказы в системе
  const [drivers, setDrivers] = useState<Driver[]>([]);  // Все водители
  const [trucks, setTrucks] = useState<Truck[]>([]);  // Все тягачи
  const [trailers, setTrailers] = useState<Trailer[]>([]);  // Все прицепы
  const [fleetAssignments, setFleetAssignments] = useState<FleetAssignment[]>([]);  // Назначения автопарка
  const [isLoadingData, setIsLoadingData] = useState(true);  // Индикатор загрузки данных
  
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
  // ЗАГРУЗКА ДАННЫХ ИЗ БД
  // ========================================

  /**
   * Загрузка всех данных из базы данных при монтировании компонента
   */
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoadingData(true);
        
        // Параллельная загрузка всех данных
        const [
          ordersData,
          driversData,
          trucksData,
          trailersData,
          fleetAssignmentsData
        ] = await Promise.all([
          fetchAllOrders(),
          fetchAllDrivers(),
          fetchAllTrucks(),
          fetchAllTrailers(),
          fetchAllFleetAssignments()
        ]);

        // Обновление состояния
        setOrders(ordersData);
        setDrivers(driversData);
        setTrucks(trucksData);
        setTrailers(trailersData);
        setFleetAssignments(fleetAssignmentsData);

        console.log('✓ Данные загружены из БД:', {
          заказов: ordersData.length,
          водителей: driversData.length,
          тягачей: trucksData.length,
          прицепов: trailersData.length,
          связей: fleetAssignmentsData.length
        });

      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        toast.error('Не удалось загрузить данные из базы данных');
      } finally {
        setIsLoadingData(false);
      }
    };

    loadData();
  }, []);

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
   * Отмена заказа (изменение статуса на "Отменен")
   */
  const deleteOrder = async (orderId: string) => {
    try {
      // Отправляем запрос на бэкенд для обновления статуса
      const result = await updateOrderStatusRequest(orderId, 'Отменен');
      
      if (!result.success) {
        const msg = (result.error || '').toString().toLowerCase();
        // Если сервер не знает о заказе, обновляем локально
        if (msg.includes('не найден') || msg.includes('not found')) {
          setOrders(orders.map(order => 
            order.id === orderId ? { ...order, status: 'Отменен' } : order
          ));
          toast.info('Заказ отменён локально (на сервере заказ не найден)');
          return;
        }
        toast.error(result.error || 'Не удалось отменить заказ');
        return;
      }
      
      // Обновляем локальное состояние после успешного обновления на сервере
      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status: 'Отменен' } : order
      ));
      toast.success('Заказ отменён');
    } catch (error) {
      console.error('Ошибка при отмене заказа:', error);
      toast.error('Ошибка соединения с сервером');
    }
  };

  /**
   * Обновление статуса заказа
   */
  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const result = await updateOrderStatusRequest(orderId, status);
      if (!result.success) {
        const msg = (result.error || '').toString().toLowerCase();
        // Мягкий оффлайн-режим: если сервер не знает о заказе, обновляем локально
        if (msg.includes('не найден') || msg.includes('not found')) {
          setOrders(prevOrders =>
            prevOrders.map(order =>
              order.id === orderId ? { ...order, status } : order
            )
          );
          toast.info('Статус обновлён локально (на сервере заказ не найден)');
          return;
        }
        toast.error(result.error || 'Не удалось обновить статус заказа');
        return;
      }

      const updatedOrder = (result.data as { order?: Order } | undefined)?.order;
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId
            ? { ...order, ...(updatedOrder ?? { status }) }
            : order
        )
      );
    } catch (error) {
      console.error('Ошибка обновления статуса заказа:', error);
      toast.error('Не удалось связаться с сервером для обновления статуса');
    }
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
  const addDriver = async (newDriver: Omit<Driver, 'id'>) => {
    try {
      // Валидация обязательных полей
      if (!newDriver.name || !newDriver.phone || !newDriver.licenseNumber) {
        toast.error('Заполните все обязательные поля: ФИО, Телефон, Водительское удостоверение');
        return;
      }

      // Генерация уникального ID
      const existingIds = new Set(drivers.map(d => d.id));
      let driverId = `ВОД-${String(drivers.length + 1).padStart(3, '0')}`;
      let counter = 1;
      while (existingIds.has(driverId)) {
        driverId = `ВОД-${String(drivers.length + 1 + counter).padStart(3, '0')}`;
        counter++;
      }

      // Подготовка данных для отправки
      const driverData = {
        id: driverId,
        name: newDriver.name.trim(),
        phone: newDriver.phone.trim(),
        licenseNumber: newDriver.licenseNumber.trim(),
        availability: newDriver.availability || 'Доступен',
        comment: newDriver.comment || ''
      };

      console.log('Отправка данных водителя:', driverData);
      const driver = await createDriver(driverData);
      setDrivers([...drivers, driver]);
      toast.success('Водитель успешно добавлен');
    } catch (error: any) {
      console.error('Ошибка при добавлении водителя:', error);
      const errorMessage = error.message || 'Не удалось добавить водителя';
      toast.error(errorMessage);
    }
  };

  /**
   * Добавление нового транспортного средства (тягача)
   */
  const addTruck = async (newTruck: Omit<Truck, 'id'>) => {
    try {
      const truckId = `АВТ-${String(trucks.length + 1).padStart(3, '0')}`;
      const truck = await createTruck({ ...newTruck, id: truckId });
      setTrucks([...trucks, truck]);
      toast.success('Транспортное средство успешно добавлено');
    } catch (error: any) {
      console.error('Ошибка при добавлении транспортного средства:', error);
      toast.error(error.message || 'Не удалось добавить транспортное средство');
    }
  };

  /**
   * Добавление нового прицепа
   */
  const addTrailer = async (newTrailer: Omit<Trailer, 'id'>) => {
    try {
      const trailerId = `ПРЦ-${String(trailers.length + 1).padStart(3, '0')}`;
      const trailer = await createTrailer({ ...newTrailer, id: trailerId });
      setTrailers([...trailers, trailer]);
      toast.success('Прицеп успешно добавлен');
    } catch (error: any) {
      console.error('Ошибка при добавлении прицепа:', error);
      toast.error(error.message || 'Не удалось добавить прицеп');
    }
  };

  /**
   * Создание связи между водителем, транспортом и прицепом
   */
  const addFleetAssignment = async (assignment: Omit<FleetAssignment, 'id'>) => {
    try {
      const assignmentId = `СВЗ-${String(fleetAssignments.length + 1).padStart(3, '0')}`;
      const newAssignment = await createFleetAssignment({ ...assignment, id: assignmentId });
      setFleetAssignments([...fleetAssignments, newAssignment]);
      toast.success('Связка успешно создана');
    } catch (error: any) {
      console.error('Ошибка при создании связки:', error);
      toast.error(error.message || 'Не удалось создать связку');
    }
  };

  /**
   * Удаление связи между элементами автопарка
   */
  const deleteFleetAssignment = async (assignmentId: string) => {
    try {
      await deleteFleetAssignmentApi(assignmentId);
      setFleetAssignments(fleetAssignments.filter(a => a.id !== assignmentId));
      toast.success('Связка успешно удалена');
    } catch (error: any) {
      console.error('Ошибка при удалении связки:', error);
      toast.error(error.message || 'Не удалось удалить связку');
    }
  };

  /**
   * Обновление данных водителя
   */
  const updateDriver = async (driverId: string, updates: Partial<Driver>) => {
    try {
      const updated = await updateDriverApi(driverId, updates);
      setDrivers(drivers.map(driver => 
        driver.id === driverId ? updated : driver
      ));
      toast.success('Данные водителя обновлены');
    } catch (error: any) {
      console.error('Ошибка при обновлении водителя:', error);
      toast.error(error.message || 'Не удалось обновить данные водителя');
    }
  };

  /**
   * Обновление данных транспортного средства
   */
  const updateTruck = async (truckId: string, updates: Partial<Truck>) => {
    try {
      const updated = await updateTruckApi(truckId, updates);
      setTrucks(trucks.map(truck => 
        truck.id === truckId ? updated : truck
      ));
      toast.success('Данные транспортного средства обновлены');
    } catch (error: any) {
      console.error('Ошибка при обновлении транспортного средства:', error);
      toast.error(error.message || 'Не удалось обновить данные транспортного средства');
    }
  };

  /**
   * Обновление данных прицепа
   */
  const updateTrailer = async (trailerId: string, updates: Partial<Trailer>) => {
    try {
      const updated = await updateTrailerApi(trailerId, updates);
      setTrailers(trailers.map(trailer => 
        trailer.id === trailerId ? updated : trailer
      ));
      toast.success('Данные прицепа обновлены');
    } catch (error: any) {
      console.error('Ошибка при обновлении прицепа:', error);
      toast.error(error.message || 'Не удалось обновить данные прицепа');
    }
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
    return <AuthForm onLogin={(user: User) => handleLogin(user)} />;
  }

  // Показываем индикатор загрузки, пока данные загружаются из БД
  if (isLoadingData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">Загрузка данных из базы данных...</p>
        </div>
      </div>
    );
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
