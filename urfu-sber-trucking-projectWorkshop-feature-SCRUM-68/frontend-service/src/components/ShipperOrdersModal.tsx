/**
 * Модальное окно со списком заказов грузоотправителя
 * 
 * Отображает все заказы текущего грузоотправителя с детальной информацией:
 * - Статус заказа
 * - Маршрут и временные рамки
 * - Информация о грузе
 * - Возможность удаления заказа
 */

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { Separator } from './ui/separator';
import { Button } from './ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Package, MapPin, Calendar, TruckIcon, Box, Trash2 } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { getOrderStatusStyle } from '../utils/orderStatusStyles';

/**
 * Интерфейс заказа грузоотправителя
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
  externalOrderNumber?: string;   // Номер заказа на внешней площадке
}

/**
 * Пропсы компонента ShipperOrdersModal
 */
interface ShipperOrdersModalProps {
  isOpen: boolean;                // Открыто ли модальное окно
  onClose: () => void;            // Callback для закрытия окна
  orders: Order[];                // Список заказов грузоотправителя
  onDeleteOrder: (orderId: string) => void; // Callback для удаления заказа
}

/**
 * Определяет цвет бейджа в зависимости от статуса заказа
 */
const getStatusStyle = (status: string) => getOrderStatusStyle(status);

const formatDateTime = (date: string, time?: string) => {
  const formattedDate = new Date(date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
  
  if (time) {
    return `${formattedDate} в ${time}`;
  }
  
  return formattedDate;
};

export function ShipperOrdersModal({ isOpen, onClose, orders, onDeleteOrder }: ShipperOrdersModalProps) {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);

  const handleDeleteClick = (orderId: string) => {
    setOrderToDelete(orderId);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (orderToDelete) {
      onDeleteOrder(orderToDelete);
      setOrderToDelete(null);
      setDeleteConfirmOpen(false);
    }
  };
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Мои заказы</DialogTitle>
          <DialogDescription>
            Просмотр всех созданных заказов и их текущих статусов
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-120px)] pr-4">
          {orders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>У вас пока нет созданных заказов</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <Card key={order.id} className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* Заголовок с номером заказа и статусом */}
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">{order.id}</h3>
                          {order.externalOrderNumber && (
                            <p className="text-xs text-muted-foreground">
                              ID на др. площ.: {order.externalOrderNumber}
                            </p>
                          )}
                          <p className="text-sm text-muted-foreground mt-1">
                            {order.cargoType}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className="border"
                          style={getStatusStyle(order.status)}
                        >
                          {order.status}
                        </Badge>
                      </div>

                      <Separator />

                      {/* Основная информация в две колонки */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Маршрут */}
                        <div className="space-y-3">
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 mt-1 text-green-600 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-sm text-muted-foreground">Откуда</p>
                              <p className="text-sm">{order.origin}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 mt-1 text-red-600 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-sm text-muted-foreground">Куда</p>
                              <p className="text-sm">{order.destination}</p>
                            </div>
                          </div>
                        </div>

                        {/* Даты */}
                        <div className="space-y-3">
                          <div className="flex items-start gap-2">
                            <Calendar className="h-4 w-4 mt-1 text-muted-foreground flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-sm text-muted-foreground">Погрузка</p>
                              <p className="text-sm">{formatDateTime(order.pickupDate, order.pickupTime)}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <Calendar className="h-4 w-4 mt-1 text-muted-foreground flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-sm text-muted-foreground">Доставка</p>
                              <p className="text-sm">{formatDateTime(order.deliveryDate, order.deliveryTime)}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Характеристики груза и транспорта */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                        <div className="flex items-center gap-2">
                          <TruckIcon className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Тип ТС</p>
                            <p className="text-sm">{order.trailerType}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Box className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Вес</p>
                            <p className="text-sm">{order.weight}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Объем</p>
                            <p className="text-sm">{order.volume}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Стоимость</p>
                          <p className="text-sm font-semibold">{order.transportationCost.toLocaleString('ru-RU')} ₽</p>
                        </div>
                      </div>

                      {/* Кнопка удаления */}
                      <Separator />
                      <div className="flex justify-end">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteClick(order.id)}
                          className="flex items-center gap-2"
                        >
                          <Trash2 className="h-4 w-4" />
                          Удалить заказ
                        </Button>
                      </div>

                      {/* Особые требования (если есть) */}
                      {order.specialRequirements && (
                        <>
                          <Separator />
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Особые требования</p>
                            <p className="text-sm">{order.specialRequirements}</p>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>

        <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Подтвердите удаление</AlertDialogTitle>
              <AlertDialogDescription>
                Вы уверены, что хотите удалить этот заказ? Это действие нельзя отменить.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Отмена</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Удалить
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}
