/**
 * Модальное окно добавления заказа логистом
 * 
 * Позволяет логисту вручную создавать новые заказы через форму OrderForm
 */

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { OrderForm } from './OrderForm';
import { Alert, AlertDescription } from './ui/alert';

/**
 * Интерфейс заказа для создания логистом
 */
interface Order {
  shipperName: string;           // Название компании грузоотправителя
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
  pickupTime?: string;            // Время погрузки (опционально)
  deliveryDate: string;           // Дата доставки
  deliveryTime?: string;          // Время доставки (опционально)
  transportationCost: number;     // Стоимость перевозки
  cargoType: string;              // Тип груза
  specialRequirements: string;    // Особые требования
  length: string;                 // Длина груза в метрах
  width: string;                  // Ширина груза в метрах
  height: string;                 // Высота груза в метрах
  vehicleCount: number;           // Количество необходимого транспорта
}

/**
 * Пропсы компонента AddOrderModal
 */
interface AddOrderModalProps {
  isOpen: boolean;                // Открыто ли модальное окно
  onClose: () => void;            // Callback для закрытия окна
  onAddOrder: (order: Order) => void; // Callback для добавления заказа
}

/**
 * Модальное окно для добавления нового заказа логистом
 */
export function AddOrderModal({ isOpen, onClose, onAddOrder }: AddOrderModalProps) {
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Обработчик отправки формы заказа
   * Отправляет данные на бэкенд перед вызовом onAddOrder
   */
  const handleSubmit = async (order: Order) => {
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:3001/api/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(order)
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.message || 'Ошибка при создании заказа');
        setIsLoading(false);
        return;
      }

      // После успешного создания на бэкенде вызываем callback
      onAddOrder(order);
      onClose();
    } catch (err) {
      setError('Ошибка соединения с сервером');
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-[90vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Добавить новый заказ</DialogTitle>
          <DialogDescription>
            Заполните детали заказа на перевозку. Все поля, отмеченные звездочкой (*), обязательны для заполнения.
          </DialogDescription>
        </DialogHeader>
        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="mt-6">
          <OrderForm 
            onSubmit={handleSubmit}
            currentUser={{
              name: '',
              company: '',
              email: '',
              userType: 'logistician'
            }}
            isLogistician={true}
          />
        </div>
        {isLoading && (
          <div className="mt-4 text-center text-sm text-muted-foreground">
            Отправка данных на сервер...
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}