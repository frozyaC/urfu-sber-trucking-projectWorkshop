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
import { MapPin, Calendar, Package, Truck, User, Phone, Star, CheckCircle, Trash2, UserX, CheckCircle2 } from 'lucide-react';
import { fetchCalculatedDrivers, type CalculatedDriverItem } from '../services/calculateApi';
import { assignCalculatedDriver } from '../services/assignmentApi';
import { getOrderStatusStyle } from '../utils/orderStatusStyles';

/**
 * Интерфейс заказа
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
  externalOrderNumber?: string | null;   // Номер заказа на внешней площадке
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
  const [calcLoading, setCalcLoading] = useState(false);
  const [calcError, setCalcError] = useState<string | null>(null);
  const [calcData, setCalcData] = useState<CalculatedDriverItem[] | null>(null);
  const [assignLoadingId, setAssignLoadingId] = useState<number | null>(null);
  const [assignSuccessId, setAssignSuccessId] = useState<number | null>(null);
  const [assignError, setAssignError] = useState<string | null>(null);

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
  const handleUnassignDriver = async () => {
    // Единственный запрос: меняем статус на "Ожидает" на основном бэкенде
    await onUpdateStatus(order.id, 'Ожидает');
    // Локально снимаем назначение
    onAssignDriverToOrder(order.id, null);
    // Сброс локальных флагов
    setAssignSuccessId(null);
    setAssignLoadingId(null);
    setAssignError(null);
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
   * Отметить заказ как доставленный
   */
  const handleCompleteOrder = () => {
    onUpdateStatus(order.id, 'Доставлен');
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

  const formatIsoDateTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString('ru-RU');
    } catch {
      return iso;
    }
  };

  const handleCalculate = async () => {
    setShowTransportSuggestions(true);
    setCalcLoading(true);
    setCalcError(null);
    setCalcData(null);
    
    // Получаем координаты и дату из заказа
    const orderLatitude = order.destinationLatitude ? parseFloat(order.destinationLatitude.toString()) : undefined;
    const orderLongitude = order.destinationLongitude ? parseFloat(order.destinationLongitude.toString()) : undefined;
    
    // Формируем правильный формат ISO 8601 для LocalDateTime (без временной зоны)
    let deliveryDateTime: string | undefined;
    if (order.deliveryDate) {
      if (order.deliveryTime) {
        // Если время уже в формате HH:mm:ss, используем как есть
        // Если в формате HH:mm, добавляем секунды
        const timePart = order.deliveryTime.includes(':') 
          ? (order.deliveryTime.split(':').length === 2 
              ? `${order.deliveryTime}:00` 
              : order.deliveryTime)
          : `${order.deliveryTime}:00:00`;
        deliveryDateTime = `${order.deliveryDate}T${timePart}`;
      } else {
        deliveryDateTime = `${order.deliveryDate}T12:00:00`;
      }
    }
    
    const result = await fetchCalculatedDrivers(orderLatitude, orderLongitude, deliveryDateTime);
    if (result.success) {
      setCalcData(result.data);
      // Если есть сообщение об отсутствии водителей, показываем его как информационное сообщение
      if (result.error && result.data.length === 0) {
        setCalcError(null); // Не показываем как ошибку, а как информационное сообщение
      }
    } else {
      setCalcError(result.error || 'Ошибка запроса');
    }
    setCalcLoading(false);
  };

  const handleAssignCalculated = async (candidateIndex: number) => {
    if (!order || !calcData) return;
    const candidate = calcData[candidateIndex];
    if (!candidate) return;
    
    setAssignLoadingId(candidateIndex);
    setAssignError(null);
    setAssignSuccessId(null);
    
    // Находим водителя по имени для назначения
    const driver = drivers.find(d => d.name === candidate.name);
    if (driver) {
      onAssignDriverToOrder(order.id, driver.id);
      setAssignSuccessId(candidateIndex);
    } else {
      setAssignError('Водитель не найден в системе');
    }
    
    // Также отправляем запрос на бэкенд, если нужно
    const res = await assignCalculatedDriver({ orderId: order.id, candidateId: candidateIndex });
    if (!res.success && !driver) {
      setAssignError(res.error || 'Ошибка назначения');
    }
    setAssignLoadingId(null);
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
                  <Badge
                    className="border"
                    variant="outline"
                    style={getOrderStatusStyle(order.status)}
                  >
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
                {order.assignedDriverId && (
                  <>
                    <Separator />
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-2">Назначенный транспорт</div>
                      <Card className="border-primary/50">
                        <CardContent className="pt-4">
                          {assignedTruck && assignedDriver ? (
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
                            <div className="flex items-center justify-between">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4 text-primary" />
                                  <div>
                                    <div className="font-semibold">Водитель ID: {order.assignedDriverId}</div>
                                    {!assignedDriver && (
                                      <div className="text-sm text-muted-foreground">Детали водителя недоступны в списке</div>
                                    )}
                                  </div>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  Транспорт не найден для этого водителя. Возможно, связка не задана.
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
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </>
                )}

                {/* Кнопки завершения и удаления заказа */}
                <Separator />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="default"
                    onClick={handleCompleteOrder}
                    disabled={order.status === 'Доставлен'}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Заказ доставлен
                  </Button>
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
                  Подбор водителя
                </CardTitle>
              </CardHeader>
              <CardContent>
                {order.assignedDriverId ? (
                  <div className="text-center py-10">
                    <div className="flex items-center justify-center mb-4">
                      <CheckCircle className="h-50 w-50 text-green-600" />
                    </div>
                    <div className="text-lg font-semibold">Водитель уже назначен</div>
                    <div className="text-sm text-muted-foreground mt-2">
                      Отмените назначение, чтобы выбрать другого водителя
                    </div>
                  </div>
                ) : !showTransportSuggestions ? (
                  <div className="text-center py-8">
                    <Truck className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <Button
                      onClick={handleCalculate}
                      className="flex items-center gap-2"
                      size="lg"
                    >
                      <User className="h-5 w-5" />
                      Подобрать водителя
                    </Button>
                    <p className="text-sm text-muted-foreground mt-4">
                      Запросит варианты с бэкенда и отобразит список
                    </p>
                  </div>
                ) : (
                  <>
                    {calcLoading && (
                      <div className="text-center py-8 text-muted-foreground">
                        Загрузка...
                      </div>
                    )}
                    {!calcLoading && calcError && (
                      <div className="text-center py-8 text-red-600">
                        Ошибка: {calcError}
                        <div className="mt-4">
                          <Button variant="outline" onClick={() => setShowTransportSuggestions(false)}>Скрыть</Button>
                        </div>
                      </div>
                    )}
                    {!calcLoading && !calcError && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold">Результаты подбора ({calcData?.length ?? 0})</h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowTransportSuggestions(false)}
                          >
                            Скрыть
                          </Button>
                        </div>
                        {calcData && calcData.length === 0 && (
                          <div className="text-center py-8 text-muted-foreground">
                            Нет доступных водителей на данный момент
                          </div>
                        )}
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left p-3 font-semibold">Имя водителя</th>
                                <th className="text-left p-3 font-semibold">Координаты</th>
                                <th className="text-left p-3 font-semibold">Дата доставки</th>
                                <th className="text-left p-3 font-semibold">Адрес отправления</th>
                                <th className="text-left p-3 font-semibold">Действие</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(calcData ?? []).map((item, index) => (
                                <tr key={item.name ? `calc-${item.name}-${index}` : `calc-item-${index}`} className="border-b hover:bg-muted/50">
                                  <td className="p-3">
                                    <div className="font-semibold">{item.name || 'Не указано'}</div>
                                  </td>
                                  <td className="p-3">
                                    <div className="text-sm">
                                      <div>Широта: {item.originLatitude}</div>
                                      <div>Долгота: {item.originLongitude}</div>
                                    </div>
                                  </td>
                                  <td className="p-3">
                                    <div className="font-medium">{formatIsoDateTime(item.deliveryDate)}</div>
                                  </td>
                                  <td className="p-3">
                                    <div className="text-sm text-muted-foreground">{item.origin || 'Не указано'}</div>
                                  </td>
                                  <td className="p-3">
                                    <div className="flex items-center gap-2">
                                      <Button
                                        size="sm"
                                        onClick={() => handleAssignCalculated(index)}
                                        disabled={assignLoadingId === index}
                                      >
                                        {assignLoadingId === index ? 'Назначение...' : 'Назначить'}
                                      </Button>
                                      {assignSuccessId === index && (
                                        <span className="text-green-600 text-sm">✓</span>
                                      )}
                                    </div>
                                    {assignError && assignLoadingId === index && (
                                      <div className="text-red-600 text-xs mt-1">{assignError}</div>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {(calcData?.length ?? 0) === 0 && (
                          <div className="text-center py-8 text-muted-foreground">
                            Данные не найдены
                          </div>
                        )}
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
