/**
 * Модальное окно подтверждения создания заказа
 * 
 * Отображает все введенные данные для проверки перед финальным созданием заказа.
 * Позволяет пользователю убедиться в правильности всех деталей.
 */

import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Package, MapPin, Calendar, Weight, Ruler, DollarSign } from 'lucide-react';

/**
 * Интерфейс данных заказа для подтверждения
 */
interface OrderData {
  id: string;                     // Уникальный номер заказа
  shipperName: string;            // Название компании грузоотправителя
  managerName?: string;           // ФИО менеджера (опционально)
  origin: string;                 // Адрес отправления
  destination: string;            // Адрес назначения
  originLatitude?: string;        // Широта точки отправления
  originLongitude?: string;       // Долгота точки отправления
  destinationLatitude?: string;   // Широта точки назначения
  destinationLongitude?: string;  // Долгота точки назначения
  trailerType?: string;            // Тип прицепа (опционально)
  volume: string;                 // Объем груза
  weight: string;                 // Вес груза
  pickupDate: string;             // Дата погрузки
  pickupTime?: string;            // Время погрузки
  deliveryDate: string;           // Дата доставки
  deliveryTime?: string;          // Время доставки
  transportationCost?: number;     // Стоимость перевозки (опционально)
  cargoType?: string;              // Тип груза (опционально)
  specialRequirements: string;    // Особые требования
  length: string;                 // Длина груза
  width: string;                  // Ширина груза
  height: string;                 // Высота груза
  vehicleCount: number;           // Количество необходимого транспорта
}

/**
 * Пропсы компонента OrderConfirmationModal
 */
interface OrderConfirmationModalProps {
  isOpen: boolean;                // Открыто ли модальное окно
  onClose: () => void;            // Callback для закрытия окна
  orderData: OrderData | null;    // Данные заказа для отображения
  onConfirm: () => void;          // Callback для подтверждения создания
}

/**
 * Компонент модального окна подтверждения заказа
 */
export function OrderConfirmationModal({ 
  isOpen, 
  onClose, 
  orderData,
  onConfirm 
}: OrderConfirmationModalProps) {
  if (!orderData) return null;

  /**
   * Форматирование даты и времени для отображения
   */
  const formatDateTime = (date: string, time?: string) => {
    const formattedDate = new Date(date).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    return time ? `${formattedDate} в ${time}` : formattedDate;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Подтверждение создания заказа</DialogTitle>
          <DialogDescription>
            Пожалуйста, проверьте правильность введенных данных перед созданием заказа
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Основная информация */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Основная информация
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="text-sm text-muted-foreground">Компания:</span>
                <p className="font-medium">{orderData.shipperName}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Менеджер:</span>
                <p className="font-medium">{orderData.managerName}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Тип груза:</span>
                <p className="font-medium">{orderData.cargoType || '—'}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Тип прицепа:</span>
                <Badge variant="secondary">{orderData.trailerType || '—'}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Маршрут */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Маршрут
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="text-sm text-muted-foreground">Откуда:</span>
                <p className="font-medium">{orderData.origin}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Куда:</span>
                <p className="font-medium">{orderData.destination}</p>
              </div>
            </CardContent>
          </Card>

          {/* Характеристики груза */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Weight className="h-5 w-5" />
                Характеристики груза
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="text-sm text-muted-foreground">Объем:</span>
                <p className="font-medium">{orderData.volume}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Вес:</span>
                <p className="font-medium">{orderData.weight}</p>
              </div>
            </CardContent>
          </Card>

          {/* Габариты - если указаны */}
          {orderData.length && orderData.width && orderData.height && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ruler className="h-5 w-5" />
                  Габариты
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="text-sm text-muted-foreground">Длина:</span>
                  <p className="font-medium">{orderData.length} м</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Ширина:</span>
                  <p className="font-medium">{orderData.width} м</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Высота:</span>
                  <p className="font-medium">{orderData.height} м</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Даты */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Даты
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="text-sm text-muted-foreground">Погрузка:</span>
                <p className="font-medium">
                  {formatDateTime(orderData.pickupDate, orderData.pickupTime)}
                </p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Доставка:</span>
                <p className="font-medium">
                  {formatDateTime(orderData.deliveryDate, orderData.deliveryTime)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Стоимость и количество */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Стоимость и количество
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="text-sm text-muted-foreground">Стоимость грузоперевозки:</span>
                <p className="font-medium">{orderData.transportationCost && orderData.transportationCost > 0 ? orderData.transportationCost.toLocaleString('ru-RU') + ' ₽' : '—'}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Количество транспорта:</span>
                <p className="font-medium">{orderData.vehicleCount} ед.</p>
                {orderData.vehicleCount > 1 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Будет создано {orderData.vehicleCount} заказов
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Особые требования */}
        {orderData.specialRequirements && (
          <Card>
            <CardHeader>
              <CardTitle>Особые требования</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{orderData.specialRequirements}</p>
            </CardContent>
          </Card>
        )}

        <DialogFooter className="gap-3">
          <Button variant="outline" onClick={onClose}>
            Изменить данные
          </Button>
          <Button onClick={onConfirm}>
            Подтвердить создание заказа
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}