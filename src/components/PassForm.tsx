/**
 * Форма создания пропуска для грузового транспорта
 * 
 * Генерирует пропуск на основе данных заказа, водителя и транспортного средства.
 * Позволяет настроить параметры пропуска и сгенерировать документ для скачивания.
 */

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { FileText, Download } from 'lucide-react';

/**
 * Интерфейс заказа для пропуска
 */
interface Order {
  id: string;                     // Номер заказа
  shipperName: string;            // Название компании грузоотправителя
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
}

/**
 * Интерфейс водителя для пропуска
 */
interface Driver {
  id: string;                     // ID водителя
  name: string;                   // ФИО водителя
  phone: string;                  // Телефон водителя
  licenseNumber: string;          // Номер водительского удостоверения
  availability: 'Доступен' | 'В рейсе' | 'На ТО' | 'Не работает'; // Статус доступности
  comment: string;                // Комментарий о водителе
}

/**
 * Интерфейс транспортного средства для пропуска
 */
interface Truck {
  id: string;                     // ID транспортного средства
  make: string;                   // Марка
  model: string;                  // Модель
  year: number;                   // Год выпуска
  licensePlate: string;           // Государственный номер
  vinNumber: string;              // VIN номер
  maintenanceStatus: 'Исправен' | 'Требует ТО' | 'На ТО'; // Статус технического обслуживания
  currentLocation: string;        // Текущее местоположение
  comment: string;                // Комментарий о транспортном средстве
}

/**
 * Пропсы компонента PassForm
 */
interface PassFormProps {
  isOpen: boolean;                // Открыто ли модальное окно
  onClose: () => void;            // Callback для закрытия окна
  order: Order | null;            // Данные заказа
  driver: Driver | null;          // Данные водителя
  truck: Truck | null;            // Данные транспортного средства
}

/**
 * Компонент формы создания пропуска
 */
export function PassForm({ isOpen, onClose, order, driver, truck }: PassFormProps) {
  // Состояние данных пропуска
  const [passData, setPassData] = useState({
    passNumber: `ПР-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
    issueDate: new Date().toISOString().split('T')[0],
    validUntil: '',
    purpose: 'Коммерческая перевозка грузов',
    routeDescription: '',
    additionalNotes: ''
  });

  // Флаг сгенерированного пропуска
  const [isGenerated, setIsGenerated] = useState(false);

  // Проверка наличия всех необходимых данных
  if (!order || !driver || !truck) return null;

  /**
   * Генерация пропуска с автоматическим заполнением данных
   */
  const generatePass = () => {
    // Автоматическое заполнение описания маршрута
    const routeDesc = `Маршрут: ${order.origin} → ${order.destination}. Груз: ${order.cargoType}. Вес: ${order.weight}. Объем: ${order.volume}.`;
    
    // Расчет срока действия (обычно +30 дней от даты выдачи)
    const issueDate = new Date(passData.issueDate);
    const validDate = new Date(issueDate);
    validDate.setDate(validDate.getDate() + 30);
    
    setPassData(prev => ({
      ...prev,
      routeDescription: routeDesc,
      validUntil: validDate.toISOString().split('T')[0]
    }));
    
    setIsGenerated(true);
  };

  /**
   * Скачивание пропуска в формате PDF
   * В реальном приложении генерирует PDF документ
   */
  const downloadPass = () => {
    alert('Функция скачивания PDF будет доступна в полной версии');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[85vw] w-[85vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Создание пропуска для заказа {order.id}
          </DialogTitle>
          <DialogDescription>
            Генерация пропуска на основе данных заказа, водителя и транспортного средства
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {!isGenerated ? (
            <>
              {/* Информация о заказе */}
              <Card>
                <CardHeader>
                  <CardTitle>Информация о заказе</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Номер заказа</Label>
                      <div className="font-medium">{order.id}</div>
                    </div>
                    <div>
                      <Label>Грузоотправитель</Label>
                      <div className="font-medium">{order.shipperName}</div>
                    </div>
                    <div>
                      <Label>Маршрут</Label>
                      <div className="font-medium">{order.origin} → {order.destination}</div>
                    </div>
                    <div>
                      <Label>Тип груза</Label>
                      <Badge variant="secondary">{order.cargoType}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Информация о водителе */}
              <Card>
                <CardHeader>
                  <CardTitle>Информация о водителе</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>ФИО водителя</Label>
                      <div className="font-medium">{driver.name}</div>
                    </div>
                    <div>
                      <Label>Номер водительского удостоверения</Label>
                      <div className="font-medium">{driver.licenseNumber}</div>
                    </div>
                    <div>
                      <Label>Телефон</Label>
                      <div className="font-medium">{driver.phone}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Информация о транспорте */}
              <Card>
                <CardHeader>
                  <CardTitle>Информация о транспортном средстве</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Марка и модель</Label>
                      <div className="font-medium">{truck.make} {truck.model}</div>
                    </div>
                    <div>
                      <Label>Год выпуска</Label>
                      <div className="font-medium">{truck.year}</div>
                    </div>
                    <div>
                      <Label>Государственный номер</Label>
                      <div className="font-medium">{truck.licensePlate}</div>
                    </div>
                    <div>
                      <Label>VIN номер</Label>
                      <div className="font-medium">{truck.vinNumber}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Параметры пропуска */}
              <Card>
                <CardHeader>
                  <CardTitle>Параметры пропуска</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="passNumber">Номер пропуска</Label>
                      <Input
                        id="passNumber"
                        value={passData.passNumber}
                        onChange={(e) => setPassData(prev => ({ ...prev, passNumber: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="issueDate">Дата выдачи</Label>
                      <Input
                        id="issueDate"
                        type="date"
                        value={passData.issueDate}
                        onChange={(e) => setPassData(prev => ({ ...prev, issueDate: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="purpose">Цель поездки</Label>
                      <Input
                        id="purpose"
                        value={passData.purpose}
                        onChange={(e) => setPassData(prev => ({ ...prev, purpose: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="additionalNotes">Дополнительные примечания</Label>
                    <Textarea
                      id="additionalNotes"
                      value={passData.additionalNotes}
                      onChange={(e) => setPassData(prev => ({ ...prev, additionalNotes: e.target.value }))}
                      placeholder="Любые дополнительные примечания или требования..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end space-x-4">
                <Button variant="outline" onClick={onClose}>
                  Отмена
                </Button>
                <Button onClick={generatePass} className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Создать пропуск
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Сгенерированный пропуск */}
              <Card className="print:shadow-none print:border-2 print:border-black">
                <CardHeader className="text-center border-b">
                  <CardTitle className="text-xl">ПРОПУСК ДЛЯ ГРУЗОВОГО ТРАНСПОРТА</CardTitle>
                  <div className="text-sm text-muted-foreground">№ {passData.passNumber}</div>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-semibold">ИНФОРМАЦИЯ О ВОДИТЕЛЕ:</Label>
                        <div className="mt-1 space-y-1">
                          <div>ФИО: {driver.name}</div>
                          <div>Водительское удостоверение: {driver.licenseNumber}</div>
                          <div>Телефон: {driver.phone}</div>
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-semibold">ТРАНСПОРТНОЕ СРЕДСТВО:</Label>
                        <div className="mt-1 space-y-1">
                          <div>Марка/модель: {truck.make} {truck.model}</div>
                          <div>Год выпуска: {truck.year}</div>
                          <div>Гос. номер: {truck.licensePlate}</div>
                          <div>VIN: {truck.vinNumber}</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-semibold">МАРШРУТ И ГРУЗ:</Label>
                        <div className="mt-1 space-y-1">
                          <div>Откуда: {order.origin}</div>
                          <div>Куда: {order.destination}</div>
                          <div>Тип груза: {order.cargoType}</div>
                          <div>Вес: {order.weight}</div>
                          <div>Объем: {order.volume}</div>
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-semibold">СРОК ДЕЙСТВИЯ:</Label>
                        <div className="mt-1 space-y-1">
                          <div>Выдан: {new Date(passData.issueDate).toLocaleDateString('ru-RU')}</div>
                          <div>Действует до: {new Date(passData.validUntil).toLocaleDateString('ru-RU')}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-semibold">ЦЕЛЬ ПОЕЗДКИ:</Label>
                    <div className="mt-1">{passData.purpose}</div>
                  </div>
                  
                  {passData.routeDescription && (
                    <div>
                      <Label className="text-sm font-semibold">ОПИСАНИЕ МАРШРУТА:</Label>
                      <div className="mt-1">{passData.routeDescription}</div>
                    </div>
                  )}
                  
                  {passData.additionalNotes && (
                    <div>
                      <Label className="text-sm font-semibold">ДОПОЛНИТЕЛЬНЫЕ ПРИМЕЧАНИЯ:</Label>
                      <div className="mt-1">{passData.additionalNotes}</div>
                    </div>
                  )}
                  
                  <div className="border-t pt-4 flex justify-between text-sm">
                    <div>
                      <div>Выдан: {new Date().toLocaleDateString('ru-RU')}</div>
                      <div>Система управления логистикой</div>
                    </div>
                    <div className="text-right">
                      <div>Подпись: _________________</div>
                      <div className="mt-2">М.П.</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end space-x-4 print:hidden">
                <Button variant="outline" onClick={() => setIsGenerated(false)}>
                  Редактировать
                </Button>
                <Button onClick={downloadPass} className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Скачать PDF
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}