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
import { FileText, Download, Loader2, AlertCircle } from 'lucide-react';
import { Checkbox } from './ui/checkbox';
import { createPassRequest } from '../services/orderApi';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

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
    additionalNotes: '',
    email: ''
  });

  // Паспортные данные водителя
  const [passportData, setPassportData] = useState({
    fullName: '',
    birthDate: '',
    series: '',
    number: '',
    issuedBy: '',
    divisionCode: ''
  });

  // Отображаемые поля паспорта (чекбоксы)
  const [passportVisible, setPassportVisible] = useState({
    fullName: true,
    birthDate: true,
    seriesNumber: true,
    issuedBy: true,
    divisionCode: true
  });

  // Флаг сгенерированного пропуска
  const [isGenerated, setIsGenerated] = useState(false);
  
  // Состояние загрузки и ошибок
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  /**
   * Генерация пропуска с автоматическим заполнением данных и отправкой на бэкенд
   */
  const generatePass = async () => {
    console.log('generatePass вызвана', { order, driver, truck, passData, passportData });
    
    if (!order) {
      setError('Необходимо указать заказ');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Автоматическое заполнение описания маршрута
      const routeDesc = `Маршрут: ${order.origin} → ${order.destination}. Груз: ${order.cargoType}. Вес: ${order.weight}. Объем: ${order.volume}.`;
      
      // Расчет срока действия (обычно +30 дней от даты выдачи)
      const issueDate = new Date(passData.issueDate);
      const validDate = new Date(issueDate);
      validDate.setDate(validDate.getDate() + 30);
      
      const updatedPassData = {
        ...passData,
        routeDescription: routeDesc,
        validUntil: validDate.toISOString().split('T')[0]
      };
      
      setPassData(updatedPassData);

      // Подготовка данных для отправки на бэкенд - включаем все поля формы
      const passPayload: any = {
        passNumber: updatedPassData.passNumber,
        orderId: order.id,
        issueDate: updatedPassData.issueDate,
        validUntil: updatedPassData.validUntil,
        purpose: updatedPassData.purpose,
        routeDescription: updatedPassData.routeDescription,
        additionalNotes: updatedPassData.additionalNotes || undefined,
        email: updatedPassData.email,
        // Данные заказа
        order: {
          id: order.id,
          shipperName: order.shipperName,
          origin: order.origin,
          destination: order.destination,
          originLatitude: order.originLatitude,
          originLongitude: order.originLongitude,
          destinationLatitude: order.destinationLatitude,
          destinationLongitude: order.destinationLongitude,
          trailerType: order.trailerType,
          volume: order.volume,
          weight: order.weight,
          pickupDate: order.pickupDate,
          pickupTime: order.pickupTime,
          deliveryDate: order.deliveryDate,
          deliveryTime: order.deliveryTime,
          transportationCost: order.transportationCost,
          status: order.status,
          cargoType: order.cargoType,
          specialRequirements: order.specialRequirements,
          length: order.length,
          width: order.width,
          height: order.height,
          assignedDriverId: order.assignedDriverId,
        },
        // Данные водителя (если указан)
        driver: driver ? {
          id: driver.id,
          name: driver.name,
          phone: driver.phone,
          licenseNumber: driver.licenseNumber,
          availability: driver.availability,
          comment: driver.comment,
        } : undefined,
        driverId: driver?.id || undefined,
        // Данные транспортного средства (если указано)
        truck: truck ? {
          id: truck.id,
          make: truck.make,
          model: truck.model,
          year: truck.year,
          licensePlate: truck.licensePlate,
          vinNumber: truck.vinNumber,
          maintenanceStatus: truck.maintenanceStatus,
          currentLocation: truck.currentLocation,
          comment: truck.comment,
        } : undefined,
        truckId: truck?.id || undefined,
        // Паспортные данные (только если есть хотя бы одно заполненное поле)
        passportData: (passportVisible.fullName && passportData.fullName) ||
                      (passportVisible.birthDate && passportData.birthDate) ||
                      (passportVisible.seriesNumber && (passportData.series || passportData.number)) ||
                      (passportVisible.issuedBy && passportData.issuedBy) ||
                      (passportVisible.divisionCode && passportData.divisionCode)
          ? {
              fullName: passportVisible.fullName ? passportData.fullName : undefined,
              birthDate: passportVisible.birthDate ? passportData.birthDate : undefined,
              series: passportVisible.seriesNumber ? passportData.series : undefined,
              number: passportVisible.seriesNumber ? passportData.number : undefined,
              issuedBy: passportVisible.issuedBy ? passportData.issuedBy : undefined,
              divisionCode: passportVisible.divisionCode ? passportData.divisionCode : undefined,
            }
          : undefined,
      };

      console.log('Отправка данных на бэкенд:', passPayload);

      // Отправка на бэкенд
      const result = await createPassRequest(passPayload);
      
      console.log('Результат запроса:', result);
      
      if (result.success) {
        setIsGenerated(true);
        setSuccess(true);
      } else {
        setError(result.error || 'Не удалось создать пропуск');
      }
    } catch (err) {
      console.error('Ошибка при создании пропуска:', err);
      setError(err instanceof Error ? err.message : 'Произошла ошибка при создании пропуска');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Скачивание пропуска в формате PDF
   * В реальном приложении генерирует PDF документ
   */
  const downloadPass = () => {
    alert('Функция скачивания PDF будет доступна в полной версии');
  };

  // Проверка наличия заказа - если нет заказа, форма не отображается
  if (!order) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[85vw] w-[85vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Создание пропуска для заказа {order?.id || 'N/A'}
          </DialogTitle>
          <DialogDescription>
            Генерация пропуска на основе данных заказа, водителя и транспортного средства
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Сообщения об ошибках и успехе */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Ошибка</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Успешно</AlertTitle>
              <AlertDescription>Пропуск успешно создан и отправлен на сервер</AlertDescription>
            </Alert>
          )}

          {!isGenerated ? (
            <>
              {/* Предупреждение, если нет водителя или грузовика */}
              {(!driver || !truck) && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Внимание</AlertTitle>
                  <AlertDescription>
                    {!driver && !truck 
                      ? 'Не указаны водитель и транспортное средство. Пропуск не может быть создан.'
                      : !driver 
                      ? 'Не указан водитель. Пропуск не может быть создан.'
                      : 'Не указано транспортное средство. Пропуск не может быть создан.'}
                  </AlertDescription>
                </Alert>
              )}

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
              {driver && (
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
              )}

              {/* Паспортные данные */}
              <Card>
                <CardHeader>
                  <CardTitle>Паспорт</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {/* ФИО */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="passport-fullName"
                          checked={passportVisible.fullName}
                          onCheckedChange={(checked) =>
                            setPassportVisible((prev) => ({
                              ...prev,
                              fullName: !!checked
                            }))
                          }
                        />
                        <Label htmlFor="passport-fullName" className="cursor-pointer">
                          ФИО
                        </Label>
                      </div>
                      <Input
                        value={passportData.fullName}
                        onChange={(e) =>
                          setPassportData((prev) => ({
                            ...prev,
                            fullName: e.target.value
                          }))
                        }
                        placeholder="Фамилия Имя Отчество"
                      />
                    </div>

                    {/* Дата рождения */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="passport-birthDate"
                          checked={passportVisible.birthDate}
                          onCheckedChange={(checked) =>
                            setPassportVisible((prev) => ({
                              ...prev,
                              birthDate: !!checked
                            }))
                          }
                        />
                        <Label htmlFor="passport-birthDate" className="cursor-pointer">
                          Дата рождения
                        </Label>
                      </div>
                      <Input
                        type="date"
                        value={passportData.birthDate}
                        onChange={(e) =>
                          setPassportData((prev) => ({
                            ...prev,
                            birthDate: e.target.value
                          }))
                        }
                      />
                    </div>

                    {/* Серия и номер в одной строке */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="passport-series-number"
                          checked={passportVisible.seriesNumber}
                          onCheckedChange={(checked) =>
                            setPassportVisible((prev) => ({
                              ...prev,
                              seriesNumber: !!checked
                            }))
                          }
                        />
                        <Label htmlFor="passport-series-number" className="cursor-pointer">
                          Серия и номер
                        </Label>
                      </div>
                      <div className="grid grid-cols-[1fr,1fr] gap-3">
                        <div className="space-y-1">
                          <Label htmlFor="passport-series" className="text-xs text-muted-foreground">
                            Серия
                          </Label>
                          <Input
                            id="passport-series"
                            value={passportData.series}
                            onChange={(e) =>
                              setPassportData((prev) => ({
                                ...prev,
                                series: e.target.value
                              }))
                            }
                            placeholder="0000"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="passport-number" className="text-xs text-muted-foreground">
                            Номер
                          </Label>
                          <Input
                            id="passport-number"
                            value={passportData.number}
                            onChange={(e) =>
                              setPassportData((prev) => ({
                                ...prev,
                                number: e.target.value
                              }))
                            }
                            placeholder="000000"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Кем выдан */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="passport-issuedBy"
                          checked={passportVisible.issuedBy}
                          onCheckedChange={(checked) =>
                            setPassportVisible((prev) => ({
                              ...prev,
                              issuedBy: !!checked
                            }))
                          }
                        />
                        <Label htmlFor="passport-issuedBy" className="cursor-pointer">
                          Кем выдан
                        </Label>
                      </div>
                      <Input
                        value={passportData.issuedBy}
                        onChange={(e) =>
                          setPassportData((prev) => ({
                            ...prev,
                            issuedBy: e.target.value
                          }))
                        }
                        placeholder="Название органа, выдавшего паспорт"
                      />
                    </div>

                    {/* Код подразделения */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="passport-divisionCode"
                          checked={passportVisible.divisionCode}
                          onCheckedChange={(checked) =>
                            setPassportVisible((prev) => ({
                              ...prev,
                              divisionCode: !!checked
                            }))
                          }
                        />
                        <Label htmlFor="passport-divisionCode" className="cursor-pointer">
                          Код подразделения
                        </Label>
                      </div>
                      <Input
                        value={passportData.divisionCode}
                        onChange={(e) =>
                          setPassportData((prev) => ({
                            ...prev,
                            divisionCode: e.target.value
                          }))
                        }
                        placeholder="000-000"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Информация о транспорте */}
              {truck && (
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
              )}

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
                    <div className="space-y-2">
                      <Label htmlFor="email">Email для отправки пропуска</Label>
                      <Input
                        id="email"
                        type="email"
                        value={passData.email}
                        onChange={(e) => setPassData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="example@mail.com"
                        required
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
                <Button variant="outline" onClick={onClose} disabled={isLoading}>
                  Отмена
                </Button>
                <Button 
                  onClick={generatePass} 
                  className="flex items-center gap-2"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Создание...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4" />
                      Создать пропуск
                    </>
                  )}
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
                      {driver && (
                        <div>
                          <Label className="text-sm font-semibold">ИНФОРМАЦИЯ О ВОДИТЕЛЕ:</Label>
                          <div className="mt-1 space-y-1">
                            <div>ФИО: {driver.name}</div>
                            <div>Водительское удостоверение: {driver.licenseNumber}</div>
                            <div>Телефон: {driver.phone}</div>
                          </div>
                        </div>
                      )}

                      {/* Паспортные данные (только активные чекбоксы) */}
                      {(passportVisible.fullName ||
                        passportVisible.birthDate ||
                        passportVisible.seriesNumber ||
                        passportVisible.issuedBy ||
                        passportVisible.divisionCode) && (
                        <div>
                          <Label className="text-sm font-semibold">ПАСПОРТНЫЕ ДАННЫЕ:</Label>
                          <div className="mt-1 space-y-1">
                            {passportVisible.fullName && passportData.fullName && (
                              <div>ФИО: {passportData.fullName}</div>
                            )}
                            {passportVisible.birthDate && passportData.birthDate && (
                              <div>
                                Дата рождения:{' '}
                                {new Date(passportData.birthDate).toLocaleDateString('ru-RU')}
                              </div>
                            )}
                            {passportVisible.seriesNumber &&
                              (passportData.series || passportData.number) && (
                                <div>
                                  Серия и номер: {passportData.series} {passportData.number}
                                </div>
                              )}
                            {passportVisible.issuedBy && passportData.issuedBy && (
                              <div>Кем выдан: {passportData.issuedBy}</div>
                            )}
                            {passportVisible.divisionCode && passportData.divisionCode && (
                              <div>Код подразделения: {passportData.divisionCode}</div>
                            )}
                          </div>
                        </div>
                      )}

                      {truck && (
                        <div>
                          <Label className="text-sm font-semibold">ТРАНСПОРТНОЕ СРЕДСТВО:</Label>
                          <div className="mt-1 space-y-1">
                            <div>Марка/модель: {truck.make} {truck.model}</div>
                            <div>Год выпуска: {truck.year}</div>
                            <div>Гос. номер: {truck.licensePlate}</div>
                            <div>VIN: {truck.vinNumber}</div>
                          </div>
                        </div>
                      )}
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