/**
 * Компонент таблицы заказов для логистов
 * 
 * Отображает все заказы в системе с возможностью:
 * - Просмотра деталей заказа
 * - Изменения статуса
 * - Добавления комментариев
 * - Редактирования адресов отправления и назначения
 * - Редактирования дат погрузки и выгрузки
 * - Формирования путевых листов
 * - Просмотра информации о компаниях и менеджерах
 */

import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Eye, FileText, MessageSquare, MapPin, Edit, Calendar as CalendarIcon } from 'lucide-react';
import { PassForm } from './PassForm';
import { CommentModal } from './CommentModal';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { getOrderStatusStyle } from '../utils/orderStatusStyles';

interface Order {
  id: string;
  shipperName: string;
  managerName?: string;
  origin: string;
  destination: string;
  originLatitude?: string;
  originLongitude?: string;
  destinationLatitude?: string;
  destinationLongitude?: string;
  trailerType: string;
  volume: string;
  weight: string;
  pickupDate: string;
  pickupTime?: string;
  deliveryDate: string;
  deliveryTime?: string;
  transportationCost: number;
  status: string;
  cargoType: string;
  specialRequirements: string;
  length: string;
  width: string;
  height: string;
  assignedDriverId: string | null;
  externalOrderNumber?: string;
}

interface Driver {
  id: string;
  name: string;
  phone: string;
  licenseNumber: string;
  availability: 'Доступен' | 'В рейсе' | 'На ТО' | 'Не работает';
  comment: string;
}

interface Truck {
  id: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  vinNumber: string;
  maintenanceStatus: 'Исправен' | 'Требует ТО' | 'На ТО';
  currentLocation: string;
  comment: string;
}

interface Comments {
  companies: { [companyName: string]: string };
  managers: { [managerName: string]: string };
  orders: { [orderId: string]: string };
}

interface OrderTableProps {
  orders: Order[];
  drivers: Driver[];
  trucks: Truck[];
  comments: Comments;
  onOrderClick: (order: Order) => void;
  onCompanyClick: (companyName: string) => void;
  onManagerClick: (managerName: string) => void;
  onUpdateOrderComment: (orderId: string, comment: string) => void;
  onUpdateOrderAddress: (orderId: string, field: 'origin' | 'destination', address: string, latitude?: string, longitude?: string) => void;
  onUpdateOrderDate: (orderId: string, field: 'pickup' | 'delivery', date: string, time?: string) => void;
}

export function OrderTable({ 
  orders, 
  drivers, 
  trucks, 
  comments, 
  onOrderClick, 
  onCompanyClick, 
  onManagerClick, 
  onUpdateOrderComment,
  onUpdateOrderAddress,
  onUpdateOrderDate
}: OrderTableProps) {
  const [isPassFormOpen, setIsPassFormOpen] = useState(false);
  const [selectedOrderForPass, setSelectedOrderForPass] = useState<Order | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  
  // Состояние для редактирования адреса
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<{
    orderId: string;
    field: 'origin' | 'destination';
    address: string;
    latitude: string;
    longitude: string;
  } | null>(null);

  // Состояние для редактирования даты
  const [isDateDialogOpen, setIsDateDialogOpen] = useState(false);
  const [editingDate, setEditingDate] = useState<{
    orderId: string;
    field: 'pickup' | 'delivery';
    date: string;
    time: string;
  } | null>(null);
  const [selectedTruck, setSelectedTruck] = useState<Truck | null>(null);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [selectedOrderForComment, setSelectedOrderForComment] = useState<Order | null>(null);

  /**
   * Открытие диалога редактирования адреса
   */
  const handleOpenAddressDialog = (order: Order, field: 'origin' | 'destination', e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingAddress({
      orderId: order.id,
      field,
      address: field === 'origin' ? order.origin : order.destination,
      latitude: field === 'origin' ? (order.originLatitude || '') : (order.destinationLatitude || ''),
      longitude: field === 'origin' ? (order.originLongitude || '') : (order.destinationLongitude || '')
    });
    setIsAddressDialogOpen(true);
  };

  /**
   * Сохранение изменений адреса
   */
  const handleSaveAddress = () => {
    if (editingAddress) {
      onUpdateOrderAddress(
        editingAddress.orderId,
        editingAddress.field,
        editingAddress.address,
        editingAddress.latitude,
        editingAddress.longitude
      );
      setIsAddressDialogOpen(false);
      setEditingAddress(null);
    }
  };

  /**
   * Отмена редактирования адреса
   */
  const handleCancelAddressEdit = () => {
    setIsAddressDialogOpen(false);
    setEditingAddress(null);
  };

  /**
   * Открытие диалога редактирования даты
   */
  const handleOpenDateDialog = (order: Order, field: 'pickup' | 'delivery', e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingDate({
      orderId: order.id,
      field,
      date: field === 'pickup' ? order.pickupDate : order.deliveryDate,
      time: field === 'pickup' ? (order.pickupTime || '') : (order.deliveryTime || '')
    });
    setIsDateDialogOpen(true);
  };

  /**
   * Сохранение изменений даты
   */
  const handleSaveDate = () => {
    if (editingDate) {
      onUpdateOrderDate(
        editingDate.orderId,
        editingDate.field,
        editingDate.date,
        editingDate.time
      );
      setIsDateDialogOpen(false);
      setEditingDate(null);
    }
  };

  /**
   * Отмена редактирования даты
   */
  const handleCancelDateEdit = () => {
    setIsDateDialogOpen(false);
    setEditingDate(null);
  };

  const getStatusBadge = (status: string) => (
    <Badge
      variant="outline"
      className="border"
      style={getOrderStatusStyle(status)}
    >
      {status}
    </Badge>
  );

  const handleCreatePass = (order: Order, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    console.log('handleCreatePass вызвана', { order, drivers, trucks });
    
    // Использовать назначенного водителя из заказа, если он есть
    let driverToUse: Driver | null = null;
    if (order.assignedDriverId) {
      driverToUse = drivers.find(driver => driver.id === order.assignedDriverId) || null;
    }
    
    // Если водитель не назначен, найти доступного
    if (!driverToUse) {
      driverToUse = drivers.find(driver => driver.availability === 'Доступен') || null;
    }
    
    // Найти первый доступный грузовик
    const availableTruck = trucks.find(truck => truck.maintenanceStatus === 'Исправен') || null;
    
    console.log('Открытие формы пропуска', { order, driverToUse, availableTruck });
    
    setSelectedOrderForPass(order);
    setSelectedDriver(driverToUse);
    setSelectedTruck(availableTruck);
    setIsPassFormOpen(true);
  };

  const handleCommentClick = (order: Order, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedOrderForComment(order);
    setIsCommentModalOpen(true);
  };

  const handleSaveOrderComment = (comment: string) => {
    if (selectedOrderForComment) {
      onUpdateOrderComment(selectedOrderForComment.id, comment);
    }
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID заказа</TableHead>
              <TableHead>ID зак. на др. площ.</TableHead>
              <TableHead>Компания</TableHead>
              <TableHead>Маршрут</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Стоимость</TableHead>
              <TableHead>Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...orders].sort((a, b) => {
              const idA = parseInt(a.id);
              const idB = parseInt(b.id);
              return idB - idA; // Сортировка от большего к меньшему (новые заказы вверху)
            }).map((order) => (
              <TableRow key={order.id} className="cursor-pointer hover:bg-muted/50">
                <TableCell className="font-medium">{order.id}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {order.externalOrderNumber || '—'}
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onCompanyClick(order.shipperName);
                      }}
                      className="text-blue-600 hover:text-blue-800 hover:underline text-left block"
                    >
                      {order.shipperName}
                    </button>
                    {order.managerName && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onManagerClick(order.managerName!);
                        }}
                        className="text-sm text-muted-foreground hover:text-blue-600 hover:underline text-left block"
                      >
                        {order.managerName}
                      </button>
                    )}
                    {!order.managerName && (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-2">
                    {/* Отправление - Погрузка */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={(e) => handleOpenAddressDialog(order, 'origin', e)}
                        className="text-left hover:bg-muted/50 p-2 rounded-md transition-colors group"
                      >
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs text-muted-foreground">Отправление</div>
                            <div className="text-sm truncate">{order.origin}</div>
                            {order.originLatitude && order.originLongitude && (
                              <div className="text-xs text-muted-foreground">
                                {order.originLatitude}, {order.originLongitude}
                              </div>
                            )}
                          </div>
                          <Edit className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                        </div>
                      </button>
                      <button
                        onClick={(e) => handleOpenDateDialog(order, 'pickup', e)}
                        className="text-left hover:bg-muted/50 p-2 rounded-md transition-colors group"
                      >
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1">
                            <div className="text-xs text-muted-foreground">Погрузка</div>
                            <div className="text-sm">
                              {new Date(order.pickupDate).toLocaleDateString('ru-RU')}
                              {order.pickupTime && ` в ${order.pickupTime}`}
                            </div>
                          </div>
                          <Edit className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                        </div>
                      </button>
                    </div>
                    {/* Назначение - Выгрузка */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={(e) => handleOpenAddressDialog(order, 'destination', e)}
                        className="text-left hover:bg-muted/50 p-2 rounded-md transition-colors group"
                      >
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs text-muted-foreground">Назначение</div>
                            <div className="text-sm truncate">{order.destination}</div>
                            {order.destinationLatitude && order.destinationLongitude && (
                              <div className="text-xs text-muted-foreground">
                                {order.destinationLatitude}, {order.destinationLongitude}
                              </div>
                            )}
                          </div>
                          <Edit className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                        </div>
                      </button>
                      <button
                        onClick={(e) => handleOpenDateDialog(order, 'delivery', e)}
                        className="text-left hover:bg-muted/50 p-2 rounded-md transition-colors group"
                      >
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1">
                            <div className="text-xs text-muted-foreground">Выгрузка</div>
                            <div className="text-sm">
                              {new Date(order.deliveryDate).toLocaleDateString('ru-RU')}
                              {order.deliveryTime && ` в ${order.deliveryTime}`}
                            </div>
                          </div>
                          <Edit className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                        </div>
                      </button>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{getStatusBadge(order.status)}</TableCell>
                <TableCell>{order.transportationCost.toLocaleString()} руб.</TableCell>
                <TableCell>
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onOrderClick(order)}
                      className="flex items-center gap-2 w-full justify-start"
                    >
                      <Eye className="h-4 w-4" />
                      Просмотр
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => handleCreatePass(order, e)}
                      className="flex items-center gap-2 w-full justify-start"
                    >
                      <FileText className="h-4 w-4" />
                      Пропуск
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => handleCommentClick(order, e)}
                      className="flex items-center gap-2 w-full justify-start"
                    >
                      <MessageSquare className="h-4 w-4" />
                      Комментарий
                      {comments.orders[order.id] && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      )}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <PassForm
        isOpen={isPassFormOpen}
        onClose={() => setIsPassFormOpen(false)}
        order={selectedOrderForPass}
        driver={selectedDriver}
        truck={selectedTruck}
      />

      <CommentModal
        isOpen={isCommentModalOpen}
        onClose={() => setIsCommentModalOpen(false)}
        title={`Комментарий к заказу ${selectedOrderForComment?.id}`}
        description="Добавьте служебную информацию или заметки по данному заказу"
        currentComment={selectedOrderForComment ? (comments.orders[selectedOrderForComment.id] || '') : ''}
        onSaveComment={handleSaveOrderComment}
      />

      {/* Модальное окно редактирования адреса */}
      <Dialog open={isAddressDialogOpen} onOpenChange={setIsAddressDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingAddress?.field === 'origin' ? 'Адрес отправления' : 'Адрес назначения'}
            </DialogTitle>
            <DialogDescription>
              Укажите адрес и координаты местоположения
            </DialogDescription>
          </DialogHeader>
          {editingAddress && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-address">Адрес</Label>
                <Input
                  id="edit-address"
                  value={editingAddress.address}
                  onChange={(e) => setEditingAddress(prev => prev ? { ...prev, address: e.target.value } : null)}
                  placeholder="Город, улица, дом"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-latitude">Широта</Label>
                  <Input
                    id="edit-latitude"
                    value={editingAddress.latitude}
                    onChange={(e) => setEditingAddress(prev => prev ? { ...prev, latitude: e.target.value } : null)}
                    placeholder="55.7558"
                    type="number"
                    step="any"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-longitude">Долгота</Label>
                  <Input
                    id="edit-longitude"
                    value={editingAddress.longitude}
                    onChange={(e) => setEditingAddress(prev => prev ? { ...prev, longitude: e.target.value } : null)}
                    placeholder="37.6173"
                    type="number"
                    step="any"
                  />
                </div>
              </div>
              {editingAddress.latitude && editingAddress.longitude && (
                <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                  <p className="font-medium mb-1">Координаты:</p>
                  <p>{editingAddress.latitude}, {editingAddress.longitude}</p>
                </div>
              )}
            </div>
          )}
          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={handleCancelAddressEdit}>
              Отмена
            </Button>
            <Button type="button" onClick={handleSaveAddress}>
              Сохранить
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Модальное окно редактирования даты */}
      <Dialog open={isDateDialogOpen} onOpenChange={setIsDateDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>
              {editingDate?.field === 'pickup' ? 'Дата погрузки' : 'Дата выгрузки'}
            </DialogTitle>
            <DialogDescription>
              Укажите дату и время
            </DialogDescription>
          </DialogHeader>
          {editingDate && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-date">Дата</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={editingDate.date}
                  onChange={(e) => setEditingDate(prev => prev ? { ...prev, date: e.target.value } : null)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-time">Время (необязательно)</Label>
                <Input
                  id="edit-time"
                  type="time"
                  value={editingDate.time}
                  onChange={(e) => setEditingDate(prev => prev ? { ...prev, time: e.target.value } : null)}
                  placeholder="12:00"
                />
              </div>
              {editingDate.date && (
                <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                  <p className="font-medium mb-1">Выбрано:</p>
                  <p>
                    {new Date(editingDate.date).toLocaleDateString('ru-RU')}
                    {editingDate.time && ` в ${editingDate.time}`}
                  </p>
                </div>
              )}
            </div>
          )}
          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={handleCancelDateEdit}>
              Отмена
            </Button>
            <Button type="button" onClick={handleSaveDate}>
              Сохранить
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
