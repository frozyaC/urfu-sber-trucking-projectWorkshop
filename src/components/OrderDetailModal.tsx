/**
 * Модальное окно с детальной информацией о заказе
 * 
 * Предоставляет функционал:
 * - Просмотр всех деталей заказа
 * - Интеллектуальный подбор транспорта с оценкой соответствия
 * - Назначение водителя на заказ
 * - Изменение статуса заказа
 * - Отмена назначения водителя
 * - Удаление заказа
 */

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Separator } from './ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { MapPin, Calendar, Package, Truck, User, Phone, Star, CheckCircle, Trash2, UserX } from 'lucide-react';

/**
 * Интерфейс заказа
 */
interface Order {
  id: string;                     // Уникальный номер заказа
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
 * Интерфейс рекомендации транспорта
 * Используется для отображения подходящих связок водитель-транспорт
 */
interface TransportSuggestion {
  id: string;                     // ID связки (FleetAssignment)
  driverId: string;               // ID водителя
  driverName: string;             // ФИО водителя
  driverRating: number;           // Рейтинг водителя (устаревшее, не используется)
  driverPhone: string;            // Телефон водителя
  truckModel: string;             // Марка/модель тягача
  truckYear: number;              // Год выпуска тягача
  trailerType: string;            // Тип прицепа
  capacity: string;               // Вместимость прицепа
  location: string;               // Текущее местоположение
  estimatedArrival: string;       // Оценка времен�� пр��бытия
  completedTrips: number;         // Количество завершенных поездок (не используется)
  matchScore: number;             // Оценка соответствия заказу (0-100)
  specialEquipment: string[];     // Специальное оборудование (не используется)
}

/**
 * Интерфейс водителя
 */
interface Driver {
  id: string;                     // Уникальный идентификатор
  name: string;                   // ФИО водителя
  phone: string;                  // Телефон для связи
  licenseNumber: string;          // Номер водительского удостоверения
  availability: 'Доступен' | 'В рейсе' | 'На ТО' | 'Не работает'; // Статус доступности
  comment: string;                // Служебные комментарии
}

/**
 * Интерфейс тягача
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

interface FleetAssignment {
  id: string;
  driverId: string;
  truckId: string;
  trailerId: string;
  assignedDate: string;
}

interface OrderDetailModalProps {
  order: Order | null;
  drivers: Driver[];
  trucks: Truck[];
  trailers: Trailer[];
  fleetAssignments: FleetAssignment[];
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (orderId: string, status: string) => void;
  onAssignDriverToOrder: (orderId: string, driverId: string | null) => void;
  onDeleteOrder: (orderId: string) => void;
}

/**
 * Генерация предложений по транспорту на основе реальных данных водителей и автопарка
 * Анализирует доступных водителей, их связи с транспортом и прицепами,
 * рассчитывает рейтинг соответствия требованиям заказа
 * 
 * @param order - Заказ для которого подбирается транспорт
 * @param drivers - Список всех водителей
 * @param fleetAssignments - Связи водитель-транспорт-прицеп
 * @param trucks - Список транспортных средств
 * @param trailers - Список прицепов
 * @returns Отсортированный по рейтингу список предложений
 */
const getTransportSuggestions = (
  order: Order | null,
  drivers: Driver[],
  fleetAssignments: FleetAssignment[],
  trucks: Truck[],
  trailers: Trailer[]
): TransportSuggestion[] => {
  if (!order) return [];
  
  const availableDrivers = drivers.filter(driver => driver.availability === 'Доступен');
  const matchingCombinations: TransportSuggestion[] = [];
  
  availableDrivers.forEach(driver => {
    const assignment = fleetAssignments.find(a => a.driverId === driver.id);
    if (!assignment) return;

    const truck = trucks.find(t => t.id === assignment.truckId);
    const trailer = trailers.find(t => t.id === assignment.trailerId);
    
    if (!truck || !trailer || truck.maintenanceStatus !== 'Исправен') return;

    const typeMatches = !order.trailerType || trailer.trailerType === order.trailerType;
    if (!typeMatches) return;

    // Расчет рейтинга соответствия (максимум 100)
    let matchScore = 70; // Базовый балл
    
    if (trailer.trailerType === order.trailerType) matchScore += 20;
    
    const isNearby = truck.currentLocation && order.origin && truck.currentLocation.includes(order.origin.split(',')[1]?.trim() || '');
    if (isNearby) matchScore += 10;
    
    matchScore = Math.min(100, matchScore);
    
    matchingCombinations.push({
      id: assignment.id || 'нет назначения',
      driverId: driver.id,
      driverName: driver.name,
      driverRating: 5.0,
      driverPhone: driver.phone,
      truckModel: truck ? `${truck.make} ${truck.model}` : 'Не назначен',
      truckYear: truck ? truck.year : 0,
      trailerType: trailer ? trailer.trailerType : 'Не назначен',
      capacity: trailer ? trailer.volume : '',
      location: truck ? truck.currentLocation : 'Не назначен',
      estimatedArrival: truck ? (isNearby ? '2-3 часа' : '4-6 часов') : 'Не определено',
      completedTrips: 0,
      matchScore: truck && trailer ? matchScore : 0,
      specialEquipment: []
});
  });
  
  return matchingCombinations.sort((a, b) => b.matchScore - a.matchScore);
};

/**
 * Модальное окно детальной информации о заказе
 * Показывает полную информацию о заказе и предложения по транспорту
 */
export function OrderDetailModal({ 
  order, 
  drivers, 
  trucks,
  trailers,
  fleetAssignments,
  isOpen, 
  onClose, 
  onUpdateStatus,
  onAssignDriverToOrder,
  onDeleteOrder
}: OrderDetailModalProps) {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [unassignConfirmOpen, setUnassignConfirmOpen] = useState(false);
  const [showTransportSuggestions, setShowTransportSuggestions] = useState(false);

  if (!order) return null;

  const transportSuggestions = getTransportSuggestions(order, drivers, fleetAssignments, trucks, trailers);
  const assignedDriver = order.assignedDriverId ? drivers.find(d => d.id === order.assignedDriverId) : null;
  
  // Получаем информацию о назначенном транспорте
  const assignedFleet = order.assignedDriverId 
    ? fleetAssignments.find(fa => fa.driverId === order.assignedDriverId) 
    : null;
  const assignedTruck = assignedFleet ? trucks.find(t => t.id === assignedFleet.truckId) : null;

  /**
   * Назначить водителя на заказ
   */
  const handleAssignTransport = (driverId: string) => {
    onAssignDriverToOrder(order.id, driverId);
    onClose();
  };

  /**
   * Отменить назначение водителя
   */
  const handleUnassignDriver = () => {
    onAssignDriverToOrder(order.id, null);
    setUnassignConfirmOpen(false);
  };

  /**
   * Удалить заказ
   */
  const handleDeleteOrder = () => {
    onDeleteOrder(order.id);
    setDeleteConfirmOpen(false);
    onClose();
  };

  /**
   * Определить цвет бейджа статуса
   */
  const getStatusColor = (status: string) => {
    const colors = {
      'Ожидает': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Назначен': 'bg-green-100 text-green-800 border-green-200',
      'В пути': 'bg-blue-100 text-blue-800 border-blue-200',
      'Доставлен': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  /**
   * Определить цвет рейтинга соответствия
   */
  const getMatchScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  /**
   * Форматировать дату и время для отображения
   */
  const formatDateTime = (date: string, time?: string) => {
    const formattedDate = new Date(date).toLocaleDateString('ru-RU');
    return time ? `${formattedDate} в ${time}` : formattedDate;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Детали заказа {order.id}
          </DialogTitle>
          <DialogDescription>
            Просмотрите информацию о заказе и подберите транспорт
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Информация о заказе */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Информация о заказе</span>
                  <Badge className={`border ${getStatusColor(order.status)}`}>
                    {order.status}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Грузоотправитель</div>
                    <div className="font-semibold">{order.shipperName}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Менеджер</div>
                    <div className="font-semibold">{order.managerName}</div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Тип груза</div>
                    <div className="font-semibold">{order.cargoType}</div>
                  </div>
                  {order.externalOrderNumber && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">ID заказа на др. площадке</div>
                      <div className="font-semibold">{order.externalOrderNumber}</div>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                    <div className="flex-1">
                      <div className="text-sm text-muted-foreground">Адрес отправителя</div>
                      <div className="font-medium">{order.origin}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                    <div className="flex-1">
                      <div className="text-sm text-muted-foreground">Адрес назначения</div>
                      <div className="font-medium">{order.destination}</div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground mt-1" />
                    <div className="flex-1">
                      <div className="text-sm text-muted-foreground">Дата погрузки</div>
                      <div className="font-medium">{formatDateTime(order.pickupDate, order.pickupTime)}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground mt-1" />
                    <div className="flex-1">
                      <div className="text-sm text-muted-foreground">Дата выгрузки</div>
                      <div className="font-medium">{formatDateTime(order.deliveryDate, order.deliveryTime)}</div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Тип прицепа</div>
                    <div className="font-semibold">{order.trailerType || 'Не указан'}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Объем</div>
                    <div className="font-semibold">{order.volume || 'Не указан'}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Вес</div>
                    <div className="font-semibold">{order.weight || 'Не указан'}</div>
                  </div>
                </div>

                {order.length && order.width && order.height && (
                  <>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">Длина</div>
                        <div className="font-semibold">{order.length} м</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">Ширина</div>
                        <div className="font-semibold">{order.width} м</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">Высота</div>
                        <div className="font-semibold">{order.height} м</div>
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-2">Особые требования</div>
                  <div className="text-sm">{order.specialRequirements || 'Нет особых требований'}</div>
                </div>

                <div className="pt-2">
                  <div className="text-lg font-bold text-primary">
                    Стоимость: {order.transportationCost.toLocaleString()} руб.
                  </div>
                </div>

                {/* Назначенный транспорт */}
                {assignedDriver && (
                  <>
                    <Separator />
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-2">Назначенный транспорт</div>
                      <Card className="border-primary/50">
                        <CardContent className="pt-4">
                          {assignedTruck ? (
                            <div className="flex items-center justify-between">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Truck className="h-4 w-4 text-primary" />
                                  <div>
                                    <div className="font-semibold">Гос. номер: {assignedTruck.licensePlate}</div>
                                    <div className="text-sm text-muted-foreground">
                                      {assignedTruck.make} {assignedTruck.model} ({assignedTruck.year})
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4 text-primary" />
                                  <div>
                                    <div className="font-semibold">Водитель: {assignedDriver.name}</div>
                                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                                      <Phone className="h-3 w-3" />
                                      {assignedDriver.phone}
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setUnassignConfirmOpen(true)}
                              >
                                <UserX className="h-4 w-4 mr-2" />
                                Отменить
                              </Button>
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground">
                              Водитель назначен, но транспорт не привязан. Обратитесь к администратору.
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </>
                )}

                {/* Кнопка удаления заказа */}
                <Separator />
                <div className="flex justify-end">
                  <Button
                    variant="destructive"
                    onClick={() => setDeleteConfirmOpen(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Удалить заказ
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Кнопка подбора водителя */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Подбор транспорта
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!showTransportSuggestions ? (
                  <div className="text-center py-8">
                    <Truck className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <Button 
                      onClick={() => setShowTransportSuggestions(true)}
                      className="flex items-center gap-2"
                      size="lg"
                    >
                      <User className="h-5 w-5" />
                      Подобрать водителя
                    </Button>
                    <p className="text-sm text-muted-foreground mt-4">
                      Нажмите, чтобы увидеть доступные варианты транспорта
                    </p>
                  </div>
                ) : (
                  <>
                    {order.assignedDriverId ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
                        <p className="font-semibold">Водитель уже назначен</p>
                        <p className="text-sm mb-4">Отмените назначение, чтобы выбрать другого водителя</p>
                        <Button 
                          variant="outline" 
                          onClick={() => setShowTransportSuggestions(false)}
                        >
                          Скрыть предложения
                        </Button>
                      </div>
                    ) : transportSuggestions.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Truck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="font-semibold">Нет доступных вариантов транспорта</p>
                        <p className="text-sm mb-4">Попробуйте изменить параметры заказа или добавить новые автомобили</p>
                        <Button 
                          variant="outline" 
                          onClick={() => setShowTransportSuggestions(false)}
                        >
                          Скрыть предложения
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold">Предложения по транспорту ({transportSuggestions.length})</h3>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setShowTransportSuggestions(false)}
                          >
                            Скрыть
                          </Button>
                        </div>
                        {transportSuggestions.map((suggestion) => (
                          <Card key={suggestion.id} className="border">
                            <CardContent className="pt-4">
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                  <div className="bg-primary/10 p-2 rounded-full">
                                    <User className="h-4 w-4 text-primary" />
                                  </div>
                                  <div>
                                    <div className="font-semibold">{suggestion.driverName}</div>
                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                      {suggestion.driverRating}/5.0 ({suggestion.completedTrips} поездок)
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className={`text-lg font-bold ${getMatchScoreColor(suggestion.matchScore)}`}>
                                    {suggestion.matchScore}%
                                  </div>
                                  <div className="text-xs text-muted-foreground">соответствие</div>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                                <div>
                                  <div className="text-muted-foreground">Автомобиль</div>
                                  <div className="font-medium">{suggestion.truckModel} ({suggestion.truckYear})</div>
                                </div>
                                <div>
                                  <div className="text-muted-foreground">Тип прицепа</div>
                                  <div className="font-medium">{suggestion.trailerType}</div>
                                </div>
                                <div>
                                  <div className="text-muted-foreground">Грузовместимость</div>
                                  <div className="font-medium">{suggestion.capacity}</div>
                                </div>
                                <div>
                                  <div className="text-muted-foreground">Время прибытия</div>
                                  <div className="font-medium">{suggestion.estimatedArrival}</div>
                                </div>
                              </div>

                              <div className="flex items-center justify-between pt-2">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <MapPin className="h-3 w-3" />
                                  {suggestion.location}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Phone className="h-3 w-3" />
                                  {suggestion.driverPhone}
                                </div>
                              </div>

                              <Button 
                                onClick={() => handleAssignTransport(suggestion.driverId)}
                                className="w-full mt-4 flex items-center gap-2"
                                variant={suggestion.matchScore >= 90 ? 'default' : 'outline'}
                              >
                                <CheckCircle className="h-4 w-4" />
                                Назначить транспорт
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Диалог подтверждения удаления заказа */}
        <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Подтвердите удаление заказа</AlertDialogTitle>
              <AlertDialogDescription>
                Вы уверены, что хотите удалить заказ {order.id}? Это действие нельзя отменить.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Отмена</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteOrder} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Удалить
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Диалог подтверждения отмены назначения водителя */}
        <AlertDialog open={unassignConfirmOpen} onOpenChange={setUnassignConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Подтвердите отмену назначения</AlertDialogTitle>
              <AlertDialogDescription>
                Вы уверены, что хотите отменить назначение водителя на этот заказ?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Отмена</AlertDialogCancel>
              <AlertDialogAction onClick={handleUnassignDriver}>
                Подтвердить
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}
