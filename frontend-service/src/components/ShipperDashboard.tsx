/**
 * Компонент панели управления для грузоотправителей
 * 
 * Основной интерфейс грузоотправителя включает:
 * - Форму создания нового заказа
 * - Список своих заказов
 * - Возможность просмотра деталей и удаления заказов
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { OrderForm } from './OrderForm';
import { OrderConfirmationModal } from './OrderConfirmationModal';
import { OrderSuccessModal } from './OrderSuccessModal';
import { ShipperOrdersModal } from './ShipperOrdersModal';
import { Button } from './ui/button';
import { ClipboardList } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import { createOrderRequest } from '../services/orderApi';

/**
 * Интерфейс пользователя системы
 */
interface User {
  email?: string;                 // Email пользователя (устаревшее, заменено на ИНН)
  name: string;                   // ФИО пользователя
  company: string;                // Название компании
  userType: 'shipper' | 'logistician'; // Тип пользователя
}

/**
 * Интерфейс данных заказа грузоотправителя
 */
interface Order {
  id: string;                     // Уникальный номер заказа (генерируется автоматически)
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
  cargoType: string;              // Тип груза
  specialRequirements: string;    // Особые требования
  length: string;                 // Длина груза
  width: string;                  // Ширина груза
  height: string;                 // Высота груза
  vehicleCount?: number;          // Количество необходимого транспорта
}

interface OrderWithStatus extends Order {
  id: string;
  status: string;
  assignedDriverId: string | null; // ID назначенного водителя
}

interface ShipperDashboardProps {
  onAddOrder: (order: Order) => void;
  currentUser: User;
  orders: OrderWithStatus[];
  onDeleteOrder: (orderId: string) => void;
}

export function ShipperDashboard({ onAddOrder, currentUser, orders, onDeleteOrder }: ShipperDashboardProps) {
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [isOrdersModalOpen, setIsOrdersModalOpen] = useState(false);
  const [pendingOrder, setPendingOrder] = useState<Order | null>(null);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Обработчик отправки формы заказа
   * Открывает модальное окно подтверждения
   */
  const handleOrderSubmit = (order: Order) => {
    setPendingOrder(order);
    setIsConfirmationOpen(true);
    setError(''); // Очищаем предыдущие ошибки
  };

  /**
   * Подтверждение создания заказа
   * Отправляет данные на бэкенд, затем создает заказ(ы) и показывает уведомление об успехе
   */
  const handleConfirmOrder = async () => {
    if (!pendingOrder) return;

    setError('');
    setIsLoading(true);

    try {
      const result = await createOrderRequest(pendingOrder);

      if (!result.success) {
        setError(result.error || 'Ошибка при создании заказа');
        setIsLoading(false);
        return;
      }

      // После успешного создания на бэкенде добавляем заказ в локальное состояние
      onAddOrder(pendingOrder);
      const vehicleCount = pendingOrder.vehicleCount || 1;
      const createdCount = result.data && typeof result.data === 'object' && 'createdCount' in result.data
        ? Number(result.data.createdCount) || vehicleCount
        : vehicleCount;
      // Формируем сообщение о созданных заказах
      const orderId = createdCount > 1 
        ? `${createdCount} заказов`
        : (result.data && typeof result.data === 'object' && 'order' in result.data && (result.data as any).order?.id)
          ? `Заказ № ${(result.data as any).order.id}`
          : 'Заказ создан';
      setCreatedOrderId(orderId);
      setIsConfirmationOpen(false);
      setIsSuccessOpen(true);
      setPendingOrder(null);
      setIsLoading(false);
    } catch (err) {
      setError('Ошибка соединения с сервером');
      setIsLoading(false);
    }
  };

  /**
   * Закрытие модального окна успешного создания
   */
  const handleCloseSuccess = () => {
    setIsSuccessOpen(false);
    setCreatedOrderId(null);
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-4">
          <h2 className="text-3xl font-semibold">Панель грузоотправителя</h2>
          <Button 
            variant="outline" 
            onClick={() => setIsOrdersModalOpen(true)}
            className="gap-2"
          >
            <ClipboardList className="h-4 w-4" />
            Мои заказы
            {orders.length > 0 && (
              <span className="ml-1 rounded-full bg-primary text-primary-foreground px-2 py-0.5 text-xs">
                {orders.length}
              </span>
            )}
          </Button>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Создавайте новые заказы на перевозку и отслеживайте ваши логистические потребности. Заполните форму ниже для запроса транспортных услуг.
        </p>
      </div>



      <Card>
        <CardHeader>
          <CardTitle>Создать новый заказ</CardTitle>
          <CardDescription>
            Заполните детали ваших требований к перевозке и получите мгновенную оценку стоимости.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <OrderForm onSubmit={handleOrderSubmit} currentUser={currentUser} />
          {isLoading && (
            <div className="mt-4 text-center text-sm text-muted-foreground">
              Отправка данных на сервер...
            </div>
          )}
        </CardContent>
      </Card>

      <OrderConfirmationModal
        isOpen={isConfirmationOpen}
        onClose={() => {
          setIsConfirmationOpen(false);
          setError('');
        }}
        orderData={pendingOrder ? {
          ...pendingOrder,
          vehicleCount: pendingOrder.vehicleCount ?? 1
        } : null}
        onConfirm={handleConfirmOrder}
      />

      <OrderSuccessModal
        isOpen={isSuccessOpen}
        onClose={handleCloseSuccess}
        orderId={createdOrderId}
      />

      <ShipperOrdersModal
        isOpen={isOrdersModalOpen}
        onClose={() => setIsOrdersModalOpen(false)}
        orders={orders}
        onDeleteOrder={onDeleteOrder}
      />
    </div>
  );
}