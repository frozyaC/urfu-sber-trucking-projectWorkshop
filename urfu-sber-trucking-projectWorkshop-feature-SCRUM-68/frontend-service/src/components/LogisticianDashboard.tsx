/**
 * Компонент панели управления для логистов (грузоперевозчиков)
 *
 * Основной интерфейс логиста включает:
 * - Таблицу всех заказов с возможностью управления
 * - Управление автопарком (водители, тягачи, прицепы)
 * - Статистику заказов
 * - Возможность создания новых заказов
 * - Просмотр информации о компаниях и менеджерах
 */

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { OrderTable } from './OrderTable';
import { OrderDetailModal } from './OrderDetailModal';
import { FleetManagement } from './FleetManagement';
import {Package, Clock, Plus, Truck, RefreshCw} from 'lucide-react';
import { AddOrderModal } from './AddOrderModal';
import { CompanyOrdersModal } from './CompanyOrdersModal';

/**
 * Интерфейс заказа в системе
 */
interface Order {
  id: string;                     // Уникальный номер заказа
  shipperName: string;            // Название компании грузоотправителя
  managerName?: string;           // ФИО менеджера (опционально)
  origin: string;                 // Адрес отправления
  destination: string;            // Адрес назначения
  originLatitude?: string;        // Широта точки отправления
  originLongitude?: string;       // Долгота точки отправления
  destinationLatitude?: string;   // Широта точки назначения
  destinationLongitude?: string;  // Долгота точки назначения
  trailerType: string;            // Тип прицепа
  volume: string;                 // Объем груза
  weight: string;                 // Вес груза
  pickupDate: string;             // Дата погрузки
  pickupTime?: string;            // Время погрузки
  deliveryDate: string;           // Дата доставки
  deliveryTime?: string;          // Время доставки
  transportationCost: number;     // Стоимость перевозки
  status: string;                 // Статус заказа
  cargoType: string;              // Тип груза
  specialRequirements: string;    // Особые требования
  length: string;                 // Длина груза
  width: string;                  // Ширина груза
  height: string;                 // Высота груза
  assignedDriverId: string | null; // ID назначенного водителя
}

/**
 * Структура комментариев к различным сущностям
 */
interface Comments {
  companies: { [companyName: string]: string }; // Комментарии к компаниям
  managers: { [managerName: string]: string };  // Комментарии к менеджерам
  orders: { [orderId: string]: string };        // Комментарии к заказам
}

/**
 * Контактная информация менеджера
 */
interface ManagerInfo {
  phone: string;                  // Телефон менеджера
  email: string;                  // Email менеджера
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
 * Интерфейс тягача (грузовика)
 */
interface Truck {
  id: string;                     // Уникальный идентификатор
  make: string;                   // Марка
  model: string;                  // Модель
  year: number;                   // Год выпуска
  licensePlate: string;           // Государственный номер
  vinNumber: string;              // VIN номер
  maintenanceStatus: 'Исправен' | 'Требует ТО' | 'На ТО'; // Статус ТО
  currentLocation: string;        // Текущее местоположение
  comment: string;                // Служебные комментарии
}

/**
 * Интерфейс прицепа
 */
interface Trailer {
  id: string;                     // Уникальный идентификатор
  licensePlate: string;           // Государственный номер
  trailerType: string;            // Тип прицепа
  length: string;                 // Длина в метрах
  width: string;                  // Ширина в метрах
  height: string;                 // Высота в метрах
  volume: string;                 // Объем в м³
  comment: string;                // Служебные комментарии
}

/**
 * Интерфейс связки водитель-тягач-прицеп
 */
interface FleetAssignment {
  id: string;                     // Уникальный идентификатор связки
  driverId: string;               // ID водителя
  truckId: string;                // ID тягача
  trailerId: string;              // ID прицепа
  assignedDate: string;           // Дата создания связки
}

interface LogisticianDashboardProps {
  orders: Order[];
  drivers: Driver[];
  trucks: Truck[];
  trailers: Trailer[];
  fleetAssignments: FleetAssignment[];
  comments: Comments;
  onUpdateOrderStatus: (orderId: string, status: string) => void;
  onAssignDriverToOrder: (orderId: string, driverId: string | null) => void;
  onAddDriver: (driver: Omit<Driver, 'id'>) => void;
  onAddTruck: (truck: Omit<Truck, 'id'>) => void;
  onAddTrailer: (trailer: Omit<Trailer, 'id'>) => void;
  onAddFleetAssignment: (assignment: Omit<FleetAssignment, 'id'>) => void;
  onDeleteFleetAssignment: (assignmentId: string) => void;
  onUpdateDriver: (driverId: string, updates: Partial<Driver>) => void;
  onUpdateTruck: (truckId: string, updates: Partial<Truck>) => void;
  onUpdateTrailer: (trailerId: string, updates: Partial<Trailer>) => void;
  onAddOrder: (order: Omit<Order, 'id' | 'status' | 'assignedDriverId'>) => void;
  onDeleteOrder: (orderId: string) => void;
  onUpdateCompanyComment: (companyName: string, comment: string) => void;
  onUpdateManagerComment: (managerName: string, comment: string) => void;
  onUpdateOrderComment: (orderId: string, comment: string) => void;
  onUpdateOrderAddress: (orderId: string, field: 'origin' | 'destination', address: string, latitude?: string, longitude?: string) => void;
  onUpdateOrderDate: (orderId: string, field: 'pickup' | 'delivery', date: string, time?: string) => void;
  managersInfo: { [managerName: string]: ManagerInfo };
  onUpdateManagerInfo: (managerName: string, info: ManagerInfo) => void;
}

/**
 * Панель управления для логиста
 * Показывает статистику, таблицу заказов и управление автопарком
 */
export function LogisticianDashboard({
  orders,
  drivers,
  trucks,
  trailers,
  fleetAssignments,
  comments,
  onUpdateOrderStatus,
  onAssignDriverToOrder,
  onAddDriver,
  onAddTruck,
  onAddTrailer,
  onAddFleetAssignment,
  onDeleteFleetAssignment,
  onUpdateDriver,
  onUpdateTruck,
  onUpdateTrailer,
  onAddOrder,
  onDeleteOrder,
  onUpdateCompanyComment,
  onUpdateManagerComment,
  onUpdateOrderComment,
  onUpdateOrderAddress,
  onUpdateOrderDate,
  managersInfo,
  onUpdateManagerInfo
}: LogisticianDashboardProps) {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFleetManagementOpen, setIsFleetManagementOpen] = useState(false);
  const [isAddOrderModalOpen, setIsAddOrderModalOpen] = useState(false);
  const [isCompanyOrdersOpen, setIsCompanyOrdersOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [selectedManager, setSelectedManager] = useState<string>('');
  const [companyOrdersType, setCompanyOrdersType] = useState<'company' | 'manager'>('company');
  // Убрана предзагрузка водителей при создании заказа

  // Автообновление данных в открытом модальном окне деталей заказа
  useEffect(() => {
    if (!isModalOpen || !selectedOrder) return;
    const fresh = orders.find(o => o.id === selectedOrder.id);
    if (fresh && fresh !== selectedOrder) {
      setSelectedOrder(fresh);
    }
  }, [orders, isModalOpen, selectedOrder]);

  /**
   * Открыть детали заказа
   */
  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  /**
   * Показать все заказы компании
   */
  const handleCompanyClick = (companyName: string) => {
    setSelectedCompany(companyName);
    setCompanyOrdersType('company');
    setIsCompanyOrdersOpen(true);
  };
  const [isRefreshing, setIsRefreshing] = useState(false);

  /**
   * Обновление статусов заказов через API
   */
  const handleRefreshStatuses = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch('http://localhost:8084/api/status', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Ошибка при обновлении статусов');
      }

      // Можно добавить обработку ответа, если API возвращает данные
      const data = await response.json();
      console.log('Статусы обновлены:', data);
    } catch (error) {
      console.error('Ошибка при обновлении статусов:', error);
      alert('Не удалось обновить статусы. Проверьте подключение к серверу.');
    } finally {
      setIsRefreshing(false);
    }
  };
  /**
   * Показать все заказы менеджера
   */
  const handleManagerClick = (managerName: string) => {
    setSelectedManager(managerName);
    setCompanyOrdersType('manager');
    setIsCompanyOrdersOpen(true);
  };

  // Создание заказа больше не пытается подгружать водителей
  const handleAddOrderClick = () => {
    setIsAddOrderModalOpen(true);
  };

  const pendingOrders = orders.filter(order => order.status === 'Ожидает').length;

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-semibold">Панель логиста</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Управляйте заказами на перевозку и назначайте подходящий транспорт. Нажмите на любой заказ для просмотра деталей и предложений по транспорту.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего заказов</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.length}</div>
            <p className="text-xs text-muted-foreground">Активных перевозок</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ожидает</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingOrders}</div>
            <p className="text-xs text-muted-foreground">Ожидают назначения</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Управление заказами</CardTitle>
              <CardDescription>
                Просматривайте и назначайте транспорт для заказов на перевозку. Нажмите на заказ для просмотра предложений по транспорту.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                  onClick={handleRefreshStatuses}
                  className="flex items-center gap-2"
                  variant="outline"
                  disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Обновить статусы
              </Button>
              <Button
                onClick={handleAddOrderClick}
                className="flex items-center gap-2"
                variant="outline"
              >
                <Plus className="h-4 w-4" />
                Добавить заказ
              </Button>
              <Button
                onClick={() => setIsFleetManagementOpen(true)}
                className="flex items-center gap-2"
              >
                <Truck className="h-4 w-4" />
                Управление автопарком
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <OrderTable
            orders={orders}
            drivers={drivers}
            trucks={trucks}
            comments={comments}
            onOrderClick={handleOrderClick}
            onCompanyClick={handleCompanyClick}
            onManagerClick={handleManagerClick}
            onUpdateOrderComment={onUpdateOrderComment}
            onUpdateOrderAddress={onUpdateOrderAddress}
            onUpdateOrderDate={onUpdateOrderDate}
          />
        </CardContent>
      </Card>

      <OrderDetailModal
        order={selectedOrder}
        drivers={drivers}
        trucks={trucks}
        trailers={trailers}
        fleetAssignments={fleetAssignments}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUpdateStatus={onUpdateOrderStatus}
        onAssignDriverToOrder={onAssignDriverToOrder}
        onDeleteOrder={onDeleteOrder}
      />

      <FleetManagement
        isOpen={isFleetManagementOpen}
        onClose={() => setIsFleetManagementOpen(false)}
        drivers={drivers}
        trucks={trucks}
        trailers={trailers}
        fleetAssignments={fleetAssignments}
        onAddDriver={onAddDriver}
        onAddTruck={onAddTruck}
        onAddTrailer={onAddTrailer}
        onAddFleetAssignment={onAddFleetAssignment}
        onDeleteFleetAssignment={onDeleteFleetAssignment}
        onUpdateDriver={onUpdateDriver}
        onUpdateTruck={onUpdateTruck}
        onUpdateTrailer={onUpdateTrailer}
      />

      <AddOrderModal
        isOpen={isAddOrderModalOpen}
        onClose={() => setIsAddOrderModalOpen(false)}
        onAddOrder={onAddOrder}
      />

      <CompanyOrdersModal
        isOpen={isCompanyOrdersOpen}
        onClose={() => setIsCompanyOrdersOpen(false)}
        orders={orders}
        companyName={selectedCompany}
        managerName={selectedManager}
        type={companyOrdersType}
        comments={comments}
        managersInfo={managersInfo}
        onUpdateCompanyComment={onUpdateCompanyComment}
        onUpdateManagerComment={onUpdateManagerComment}
        onUpdateManagerInfo={onUpdateManagerInfo}
      />
    </div>
  );
}
