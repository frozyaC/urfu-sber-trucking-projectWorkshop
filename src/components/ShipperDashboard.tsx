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

/**
 * Интерфейс пользователя системы
 */
interface User {
  email: string;                  // Email пользователя (устаревшее, заменено на ИНН)
  name: string;                   // ФИО пользователя
  company: string;                // Название компании
  userType: 'shipper' | 'logistician'; // Тип пользователя
}

/**
 * Интерфейс данных заказа грузоотправителя
 */
interface Order {
  shipperName: string;            // Название компании грузоотправителя
  managerName: string;            // ФИО менеджера
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
}

interface OrderWithStatus extends Order {
  id: string;
  status: string;
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

  /**
   * Обработчик отправки формы заказа
   * Открывает модальное окно подтверждения
   */
  const handleOrderSubmit = (order: Order) => {
    setPendingOrder(order);
    setIsConfirmationOpen(true);
  };

  /**
   * Подтверждение создания заказа
   * Создает заказ(ы) и показывает уведомление об успехе
   */
  const handleConfirmOrder = () => {
    if (pendingOrder) {
      onAddOrder(pendingOrder);
      const vehicleCount = pendingOrder.vehicleCount || 1;
      // Формируем сообщение о созданных заказах
      const orderId = vehicleCount > 1 
        ? `${vehicleCount} заказов`
        : 'Заказ создан';
      setCreatedOrderId(orderId);
      setIsConfirmationOpen(false);
      setIsSuccessOpen(true);
      setPendingOrder(null);
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
          <OrderForm onSubmit={handleOrderSubmit} currentUser={currentUser} />
        </CardContent>
      </Card>

      <OrderConfirmationModal
        isOpen={isConfirmationOpen}
        onClose={() => setIsConfirmationOpen(false)}
        orderData={pendingOrder}
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