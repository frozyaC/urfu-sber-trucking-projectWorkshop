/**
 * Модальное окно добавления заказа логистом
 * 
 * Позволяет логисту вручную создавать новые заказы через форму OrderForm
 */

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { OrderForm, OrderData } from './OrderForm';
import { Alert, AlertDescription } from './ui/alert';
import { createOrderRequest, importOrderByExternalNumber } from '../services/orderApi';
import { Button } from './ui/button';
import { ChevronDown } from 'lucide-react';

/**
 * Интерфейс заказа для создания логистом
 */
interface Order {
  shipperName: string;
  managerName?: string;            // Опционально
  origin: string;
  destination: string;
  originLatitude?: string;
  originLongitude?: string;
  destinationLatitude?: string;
  destinationLongitude?: string;
  trailerType?: string;            // Опционально
  volume: string;
  weight: string;
  pickupDate: string;
  pickupTime?: string;
  deliveryDate: string;
  deliveryTime?: string;
  transportationCost?: number;     // Опционально
  cargoType?: string;              // Опционально
  specialRequirements: string;
  length: string;
  width: string;
  height: string;
  vehicleCount: number;
  externalOrderNumber?: string;
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
  const [isImporting, setIsImporting] = useState(false);
  const [importedData, setImportedData] = useState<Partial<OrderData> | null>(null);

  /**
   * Обработчик отправки формы заказа
   * Отправляет данные на бэкенд перед вызовом onAddOrder
   */
  const handleSubmit = async (order: Order) => {
    setError('');
    setIsLoading(true);

    try {
      const result = await createOrderRequest(order);

      if (!result.success) {
        setError(result.error || 'Ошибка при создании заказа');
        setIsLoading(false);
        return;
      }

      // После успешного создания на бэкенде вызываем callback
      onAddOrder(order);
      onClose();
      setIsLoading(false);
    } catch (err) {
      setError('Ошибка соединения с сервером');
      setIsLoading(false);
    }
  };

  /**
   * Обработчик импорта заказа по внешнему номеру
   */
  const handleImportClick = async () => {
    // Запрашиваем номер заказа у пользователя
    const externalNumber = window.prompt('Введите номер заказа на внешней площадке для импорта');
    if (!externalNumber) {
      return;
    }

    setError('');
    setIsImporting(true);

    const result = await importOrderByExternalNumber(externalNumber);

    if (!result.success || !result.data) {
      setError(result.error || 'Не удалось импортировать заказ');
      setIsImporting(false);
      return;
    }

    // Пытаемся аккуратно сопоставить поля ответа с полями формы
    const data: any = result.data.order ?? result.data;

    const mapped: Partial<OrderData> = {
      shipperName: data.shipperName ?? '',
      managerName: data.managerName ?? '',
      origin: data.origin ?? '',
      destination: data.destination ?? '',
      originLatitude: data.originLatitude ?? undefined,
      originLongitude: data.originLongitude ?? undefined,
      destinationLatitude: data.destinationLatitude ?? undefined,
      destinationLongitude: data.destinationLongitude ?? undefined,
      trailerType: data.trailerType ?? '',
      volume: data.volume ?? '',
      weight: data.weight ?? '',
      pickupDate: data.pickupDate ?? '',
      pickupTime: data.pickupTime ?? undefined,
      deliveryDate: data.deliveryDate ?? '',
      deliveryTime: data.deliveryTime ?? undefined,
      cargoType: data.cargoType ?? '',
      specialRequirements: data.specialRequirements ?? '',
      transportationCost: data.transportationCost ?? 0,
      length: data.length ?? '',
      width: data.width ?? '',
      height: data.height ?? '',
      vehicleCount: data.vehicleCount ?? 1,
      externalOrderNumber: data.externalOrderNumber ?? externalNumber,
    };

    setImportedData(mapped);
    setIsImporting(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-[90vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <DialogTitle>Добавить новый заказ</DialogTitle>
              <DialogDescription>
                Заполните детали заказа на перевозку. Все поля, отмеченные звездочкой (*), обязательны для заполнения.
              </DialogDescription>
            </div>
            <Button
              type="button"
              onClick={handleImportClick}
              className="bg-black text-white hover:bg-black/90 flex items-center gap-2"
              disabled={isImporting || isLoading}
            >
              <ChevronDown className="h-4 w-4" />
              Импорт заказа
            </Button>
          </div>
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
            initialData={importedData ?? undefined}
          />
        </div>
        {(isLoading || isImporting) && (
          <div className="mt-4 text-center text-sm text-muted-foreground">
            {isLoading ? 'Отправка данных на сервер...' : 'Импортируем данные заказа...'}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}