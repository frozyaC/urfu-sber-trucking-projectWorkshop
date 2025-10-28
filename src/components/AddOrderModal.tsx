/**
 * Модальное окно добавления заказа логистом
 * 
 * Позволяет логисту вручную создавать новые заказы через форму OrderForm
 */

import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { OrderForm } from './OrderForm';

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
  /**
   * Обработчик отправки формы заказа
   */
  const handleSubmit = (order: Order) => {
    onAddOrder(order);
    onClose();
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
      </DialogContent>
    </Dialog>
  );
}