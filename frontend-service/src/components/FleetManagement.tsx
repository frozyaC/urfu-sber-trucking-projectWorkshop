/**
 * Модуль управления автопарком
 * 
 * Предоставляет функционал для управления:
 * - Водителями (добавление, редактирование, комментарии)
 * - Транспортными средствами (тягачи)
 * - Прицепами
 * - Связками водитель-тягач-прицеп
 * 
 * Особенности:
 * - Табличное отображение всех сущностей
 * - Редактирование доступности водителей
 * - Редактирование статуса технического обслуживания
 * - Автоматический расчет объема прицепа по габаритам
 * - Комментарии к каждой сущности
 */

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { User, Truck as TruckIcon, Plus, Edit, X, Link as LinkIcon, Trash2, MessageSquare } from 'lucide-react';
import { ApiStatusIndicator } from './ApiStatusIndicator';

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
 * Интерфейс тягача (грузовика)
 */
interface Truck {
  id: string;                     // Уникальный идентификатор
  make: string;                   // Марка (КАМАЗ, МАЗ и т.д.)
  model: string;                  // Модель
  year: number;                   // Год выпуска
  licensePlate: string;           // Государственный номер
  vinNumber: string;              // VIN номер
  maintenanceStatus: 'Исправен' | 'Требует ТО' | 'На ТО'; // Статус ТО
  currentLocation: string;        // Текущее местоположение
  comment: string;                // Служебные комментарии
}

/**
 * Интерфейс прицепа
 */
interface Trailer {
  id: string;                     // Уникальный идентификатор
  licensePlate: string;           // Государственный номер
  trailerType: string;            // Тип прицепа (бортовой, рефрижератор и т.д.)
  length: string;                 // Длина в метрах
  width: string;                  // Ширина в метрах
  height: string;                 // Высота в метрах
  volume: string;                 // Объем в м³ (рассчитывается автоматически)
  comment: string;                // Служебные комментарии
}

/**
 * Интерфейс связки водитель-тягач-прицеп
 */
interface FleetAssignment {
  id: string;                     // Уникальный идентификатор связки
  driverId: string;               // ID водителя
  truckId: string;                // ID тягача
  trailerId: string;              // ID прицепа
  assignedDate: string;           // Дата создания связки
}

/**
 * Пропсы компонента управления автопарком
 */
interface FleetManagementProps {
  isOpen: boolean;                // Открыто ли модальное окно
  onClose: () => void;            // Callback для закрытия окна
  drivers: Driver[];              // Список водителей
  trucks: Truck[];                // Список тягачей
  trailers: Trailer[];            // Список прицепов
  fleetAssignments: FleetAssignment[]; // Список связок
  onAddDriver: (driver: Omit<Driver, 'id'>) => void;           // Добавление водителя
  onAddTruck: (truck: Omit<Truck, 'id'>) => void;              // Добавление тягача
  onAddTrailer: (trailer: Omit<Trailer, 'id'>) => void;        // Добавление прицепа
  onAddFleetAssignment: (assignment: Omit<FleetAssignment, 'id'>) => void; // Создание связки
  onDeleteFleetAssignment: (assignmentId: string) => void;     // Удаление связки
  onUpdateDriver: (driverId: string, updates: Partial<Driver>) => void;    // Обновление данных водителя
  onUpdateTruck: (truckId: string, updates: Partial<Truck>) => void;       // Обновление данных тягача
  onUpdateTrailer: (trailerId: string, updates: Partial<Trailer>) => void; // Обновление данных прицепа
  lastApiLoad?: { time: Date; added: number; duplicates: number }; // Информация о последней загрузке из API
}

/**
 * Основной компонент управления автопарком
 */
export function FleetManagement({ 
  isOpen, 
  onClose, 
  drivers, 
  trucks, 
  trailers,
  fleetAssignments,
  onAddDriver, 
  onAddTruck,
  onAddTrailer,
  onAddFleetAssignment,
  onDeleteFleetAssignment,
  onUpdateDriver, 
  onUpdateTruck,
  onUpdateTrailer,
  lastApiLoad
}: FleetManagementProps) {
  // Состояния видимости форм добавления
  const [showDriverForm, setShowDriverForm] = useState(false);
  const [showTruckForm, setShowTruckForm] = useState(false);
  const [showTrailerForm, setShowTrailerForm] = useState(false);
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  
  // ID редактируемых сущностей (для inline редактирования)
  const [editingDriver, setEditingDriver] = useState<string | null>(null);
  const [editingTruck, setEditingTruck] = useState<string | null>(null);
  const [editingTrailer, setEditingTrailer] = useState<string | null>(null);
  
  // Данные для редактирования комментария
  const [editingCommentFor, setEditingCommentFor] = useState<{ type: 'driver' | 'truck' | 'trailer', id: string } | null>(null);

  const [driverForm, setDriverForm] = useState({
    name: '',
    phone: '',
    licenseNumber: '',
    comment: ''
  });

  const [truckForm, setTruckForm] = useState({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    licensePlate: '',
    vinNumber: '',
    maintenanceStatus: 'Исправен' as const,
    currentLocation: '',
    comment: ''
  });

  const [trailerForm, setTrailerForm] = useState({
    licensePlate: '',
    trailerType: '',
    length: '',
    width: '',
    height: '',
    comment: ''
  });

  const [assignmentForm, setAssignmentForm] = useState({
    driverId: '',
    truckId: '',
    trailerId: '',
    assignedDate: new Date().toISOString().split('T')[0]
  });

  const [commentText, setCommentText] = useState('');

  const trailerTypes = ['Бортовой', 'Рефрижератор', 'Контейнеровоз', 'Низкорамный', 'Цистерна', 'Самосвал', 'Панфургон'];
  const availabilityOptions = ['Доступен', 'В рейсе', 'На ТО', 'Не работает'] as const;
  const maintenanceOptions = ['Исправен', 'Требует ТО', 'На ТО'] as const;

  // Автоматический расчет объема прицепа
  const [calculatedVolume, setCalculatedVolume] = useState('');

  useEffect(() => {
    if (trailerForm.length && trailerForm.width && trailerForm.height) {
      const length = parseFloat(trailerForm.length);
      const width = parseFloat(trailerForm.width);
      const height = parseFloat(trailerForm.height);
      
      if (!isNaN(length) && !isNaN(width) && !isNaN(height)) {
        const volume = (length * width * height).toFixed(1);
        setCalculatedVolume(`${volume} м³`);
      }
    } else {
      setCalculatedVolume('');
    }
  }, [trailerForm.length, trailerForm.width, trailerForm.height]);

  const handleDriverSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Валидация обязательных полей
    if (!driverForm.name || !driverForm.name.trim()) {
      alert('Пожалуйста, укажите ФИО водителя');
      return;
    }
    if (!driverForm.phone || !driverForm.phone.trim()) {
      alert('Пожалуйста, укажите телефон водителя');
      return;
    }
    if (!driverForm.licenseNumber || !driverForm.licenseNumber.trim()) {
      alert('Пожалуйста, укажите номер водительского удостоверения');
      return;
    }

    onAddDriver({
      name: driverForm.name.trim(),
      phone: driverForm.phone.trim(),
      licenseNumber: driverForm.licenseNumber.trim(),
      availability: 'Доступен', // Изменено с 'Не работает' на 'Доступен'
      comment: driverForm.comment?.trim() || ''
    });

    resetDriverForm();
    setShowDriverForm(false);
  };

  const handleTruckSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!truckForm.make || !truckForm.model || !truckForm.licensePlate) return;

    onAddTruck(truckForm);

    resetTruckForm();
    setShowTruckForm(false);
  };

  const handleTrailerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trailerForm.licensePlate || !trailerForm.trailerType) return;

    onAddTrailer({
      ...trailerForm,
      volume: calculatedVolume
    });

    resetTrailerForm();
    setShowTrailerForm(false);
  };

  const handleAssignmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignmentForm.driverId || !assignmentForm.truckId || !assignmentForm.trailerId) return;

    onAddFleetAssignment(assignmentForm);

    resetAssignmentForm();
    setShowAssignmentForm(false);
  };

  const resetDriverForm = () => {
    setDriverForm({
      name: '',
      phone: '',
      licenseNumber: '',
      comment: ''
    });
  };

  const resetTruckForm = () => {
    setTruckForm({
      make: '',
      model: '',
      year: new Date().getFullYear(),
      licensePlate: '',
      vinNumber: '',
      maintenanceStatus: 'Исправен',
      currentLocation: '',
      comment: ''
    });
  };

  const resetTrailerForm = () => {
    setTrailerForm({
      licensePlate: '',
      trailerType: '',
      length: '',
      width: '',
      height: '',
      comment: ''
    });
    setCalculatedVolume('');
  };

  const resetAssignmentForm = () => {
    setAssignmentForm({
      driverId: '',
      truckId: '',
      trailerId: '',
      assignedDate: new Date().toISOString().split('T')[0]
    });
  };



  const handleEditComment = (type: 'driver' | 'truck' | 'trailer', id: string, currentComment: string) => {
    setEditingCommentFor({ type, id });
    setCommentText(currentComment);
  };

  const handleSaveComment = () => {
    if (!editingCommentFor) return;

    const { type, id } = editingCommentFor;

    if (type === 'driver') {
      onUpdateDriver(id, { comment: commentText });
    } else if (type === 'truck') {
      onUpdateTruck(id, { comment: commentText });
    } else if (type === 'trailer') {
      onUpdateTrailer(id, { comment: commentText });
    }

    setEditingCommentFor(null);
    setCommentText('');
  };

  const getAvailabilityBadge = (availability: string) => {
    const colors = {
      'Доступен': 'bg-green-100 text-green-800',
      'В рейсе': 'bg-blue-100 text-blue-800',
      'На ТО': 'bg-orange-100 text-orange-800',
      'Не работает': 'bg-red-100 text-red-800'
    };
    return <Badge className={colors[availability as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>{availability}</Badge>;
  };

  const getMaintenanceBadge = (status: string) => {
    const colors = {
      'Исправен': 'bg-green-100 text-green-800',
      'Требует ТО': 'bg-orange-100 text-orange-800',
      'На ТО': 'bg-red-100 text-red-800'
    };
    return <Badge className={colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>{status}</Badge>;
  };

  const getDriverName = (driverId: string) => {
    return drivers.find(d => d.id === driverId)?.name || 'Не найден';
  };

  const getTruckInfo = (truckId: string) => {
    const truck = trucks.find(t => t.id === truckId);
    return truck ? `${truck.make} ${truck.model} (${truck.licensePlate})` : 'Не найден';
  };

  const getTrailerInfo = (trailerId: string) => {
    const trailer = trailers.find(t => t.id === trailerId);
    return trailer ? `${trailer.trailerType} (${trailer.licensePlate})` : 'Не найден';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] w-[95vw] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Управление автопарком</DialogTitle>
          <DialogDescription>
            Управляйте водителями, транспортом, прицепами и их связями
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="drivers" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="drivers" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Водители
            </TabsTrigger>
            <TabsTrigger value="trucks" className="flex items-center gap-2">
              <TruckIcon className="h-4 w-4" />
              Транспорт
            </TabsTrigger>
            <TabsTrigger value="trailers" className="flex items-center gap-2">
              <TruckIcon className="h-4 w-4" />
              Прицепы
            </TabsTrigger>
            <TabsTrigger value="assignments" className="flex items-center gap-2">
              <LinkIcon className="h-4 w-4" />
              Связи
            </TabsTrigger>
          </TabsList>

          <TabsContent value="drivers" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Список водителей ({drivers.length})</h3>
              <Button onClick={() => setShowDriverForm(true)} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Добавить водителя
              </Button>
            </div>

            {/* Индикатор последней загрузки из API */}
            {lastApiLoad && (
              <ApiStatusIndicator 
                lastLoadTime={lastApiLoad.time}
                loadedCount={lastApiLoad.added}
                duplicateCount={lastApiLoad.duplicates}
              />
            )}

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ФИО</TableHead>
                    <TableHead>Телефон</TableHead>
                    <TableHead>ВУ</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Комментарий</TableHead>
                    <TableHead>Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {drivers.map((driver) => (
                    <TableRow key={driver.id}>
                      <TableCell className="font-medium">{driver.name}</TableCell>
                      <TableCell>{driver.phone}</TableCell>
                      <TableCell>{driver.licenseNumber}</TableCell>
                      <TableCell>
                        {editingDriver === driver.id ? (
                          <Select 
                            value={driver.availability} 
                            onValueChange={(value: Driver['availability']) => {
                              onUpdateDriver(driver.id, { availability: value });
                              setEditingDriver(null);
                            }}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {availabilityOptions.map(option => (
                                <SelectItem key={option} value={option}>{option}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          getAvailabilityBadge(driver.availability)
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditComment('driver', driver.id, driver.comment)}
                        >
                          <MessageSquare className="h-4 w-4" />
                          {driver.comment && <span className="ml-1 text-xs">({driver.comment.substring(0, 10)}...)</span>}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingDriver(editingDriver === driver.id ? null : driver.id)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="trucks" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Список транспорта ({trucks.length})</h3>
              <Button onClick={() => setShowTruckForm(true)} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Добавить транспорт
              </Button>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Марка/Модель</TableHead>
                    <TableHead>Год</TableHead>
                    <TableHead>Гос. номер</TableHead>
                    <TableHead>Статус ТО</TableHead>
                    <TableHead>Комментарий</TableHead>
                    <TableHead>Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trucks.map((truck) => (
                    <TableRow key={truck.id}>
                      <TableCell className="font-medium">{truck.make} {truck.model}</TableCell>
                      <TableCell>{truck.year}</TableCell>
                      <TableCell>{truck.licensePlate}</TableCell>
                      <TableCell>
                        {editingTruck === truck.id ? (
                          <Select 
                            value={truck.maintenanceStatus} 
                            onValueChange={(value: Truck['maintenanceStatus']) => {
                              onUpdateTruck(truck.id, { maintenanceStatus: value });
                              setEditingTruck(null);
                            }}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {maintenanceOptions.map(option => (
                                <SelectItem key={option} value={option}>{option}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          getMaintenanceBadge(truck.maintenanceStatus)
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditComment('truck', truck.id, truck.comment)}
                        >
                          <MessageSquare className="h-4 w-4" />
                          {truck.comment && <span className="ml-1 text-xs">({truck.comment.substring(0, 10)}...)</span>}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingTruck(editingTruck === truck.id ? null : truck.id)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="trailers" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Список прицепов ({trailers.length})</h3>
              <Button onClick={() => setShowTrailerForm(true)} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Добавить прицеп
              </Button>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Гос. номер</TableHead>
                    <TableHead>Тип прицепа</TableHead>
                    <TableHead>Длина (м)</TableHead>
                    <TableHead>Ширина (м)</TableHead>
                    <TableHead>Высота (м)</TableHead>
                    <TableHead>Объем</TableHead>
                    <TableHead>Комментарий</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trailers.map((trailer) => (
                    <TableRow key={trailer.id}>
                      <TableCell className="font-medium">{trailer.licensePlate}</TableCell>
                      <TableCell>{trailer.trailerType}</TableCell>
                      <TableCell>{trailer.length}</TableCell>
                      <TableCell>{trailer.width}</TableCell>
                      <TableCell>{trailer.height}</TableCell>
                      <TableCell>{trailer.volume}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditComment('trailer', trailer.id, trailer.comment)}
                        >
                          <MessageSquare className="h-4 w-4" />
                          {trailer.comment && <span className="ml-1 text-xs">({trailer.comment.substring(0, 10)}...)</span>}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="assignments" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Связи водитель-транспорт-прицеп ({fleetAssignments.length})</h3>
              <Button onClick={() => setShowAssignmentForm(true)} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Создать связь
              </Button>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Водитель</TableHead>
                    <TableHead>Транспорт</TableHead>
                    <TableHead>Прицеп</TableHead>
                    <TableHead>Дата назначения</TableHead>
                    <TableHead>Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fleetAssignments.map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell>{getDriverName(assignment.driverId)}</TableCell>
                      <TableCell>{getTruckInfo(assignment.truckId)}</TableCell>
                      <TableCell>{getTrailerInfo(assignment.trailerId)}</TableCell>
                      <TableCell>{new Date(assignment.assignedDate).toLocaleDateString('ru-RU')}</TableCell>
                      <TableCell>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => onDeleteFleetAssignment(assignment.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>

        {/* Форма добавления водителя */}
        {showDriverForm && (
          <Dialog open={showDriverForm} onOpenChange={setShowDriverForm}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Добавить водителя</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleDriverSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>ФИО *</Label>
                    <Input
                      value={driverForm.name}
                      onChange={(e) => setDriverForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Введите полное имя"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Телефон *</Label>
                    <Input
                      value={driverForm.phone}
                      onChange={(e) => setDriverForm(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+7 (999) 123-45-67"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Водительское удостоверение *</Label>
                    <Input
                      value={driverForm.licenseNumber}
                      onChange={(e) => setDriverForm(prev => ({ ...prev, licenseNumber: e.target.value }))}
                      placeholder="ВУ-77-123456"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Комментарий</Label>
                  <Textarea
                    value={driverForm.comment}
                    onChange={(e) => setDriverForm(prev => ({ ...prev, comment: e.target.value }))}
                    placeholder="Дополнительная информация о водителе..."
                    rows={3}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setShowDriverForm(false)}>
                    Отмена
                  </Button>
                  <Button type="submit">Добавить водителя</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}

        {/* Форма добавления транспорта */}
        {showTruckForm && (
          <Dialog open={showTruckForm} onOpenChange={setShowTruckForm}>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Добавить транспорт</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleTruckSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Марка *</Label>
                    <Input
                      value={truckForm.make}
                      onChange={(e) => setTruckForm(prev => ({ ...prev, make: e.target.value }))}
                      placeholder="КАМАЗ, МАЗ"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Модель *</Label>
                    <Input
                      value={truckForm.model}
                      onChange={(e) => setTruckForm(prev => ({ ...prev, model: e.target.value }))}
                      placeholder="5490, 6312"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Год выпуска</Label>
                    <Input
                      type="number"
                      value={truckForm.year}
                      onChange={(e) => setTruckForm(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                      min="1990"
                      max={new Date().getFullYear() + 1}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Гос. номер *</Label>
                    <Input
                      value={truckForm.licensePlate}
                      onChange={(e) => setTruckForm(prev => ({ ...prev, licensePlate: e.target.value }))}
                      placeholder="М123АВ77"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>VIN номер</Label>
                    <Input
                      value={truckForm.vinNumber}
                      onChange={(e) => setTruckForm(prev => ({ ...prev, vinNumber: e.target.value }))}
                      placeholder="17-значный VIN"
                      maxLength={17}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Комментарий</Label>
                  <Textarea
                    value={truckForm.comment}
                    onChange={(e) => setTruckForm(prev => ({ ...prev, comment: e.target.value }))}
                    placeholder="Дополнительная информация о транспорте..."
                    rows={3}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setShowTruckForm(false)}>
                    Отмена
                  </Button>
                  <Button type="submit">Добавить транспорт</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}

        {/* Форма добавления прицепа */}
        {showTrailerForm && (
          <Dialog open={showTrailerForm} onOpenChange={setShowTrailerForm}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Добавить прицеп</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleTrailerSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Гос. номер *</Label>
                    <Input
                      value={trailerForm.licensePlate}
                      onChange={(e) => setTrailerForm(prev => ({ ...prev, licensePlate: e.target.value }))}
                      placeholder="АМ123477"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Тип прицепа *</Label>
                    <Select 
                      value={trailerForm.trailerType} 
                      onValueChange={(value) => setTrailerForm(prev => ({ ...prev, trailerType: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите тип" />
                      </SelectTrigger>
                      <SelectContent>
                        {trailerTypes.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-lg font-medium">Габариты прицепа</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>Длина (м)</Label>
                      <Input
                        value={trailerForm.length}
                        onChange={(e) => setTrailerForm(prev => ({ ...prev, length: e.target.value }))}
                        placeholder="13.6"
                        type="number"
                        step="0.1"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Ширина (м)</Label>
                      <Input
                        value={trailerForm.width}
                        onChange={(e) => setTrailerForm(prev => ({ ...prev, width: e.target.value }))}
                        placeholder="2.45"
                        type="number"
                        step="0.01"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Высота (м)</Label>
                      <Input
                        value={trailerForm.height}
                        onChange={(e) => setTrailerForm(prev => ({ ...prev, height: e.target.value }))}
                        placeholder="2.7"
                        type="number"
                        step="0.01"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Объем</Label>
                      <Input
                        value={calculatedVolume}
                        readOnly
                        placeholder="Авто-расчет"
                        className="bg-muted"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Комментарий</Label>
                  <Textarea
                    value={trailerForm.comment}
                    onChange={(e) => setTrailerForm(prev => ({ ...prev, comment: e.target.value }))}
                    placeholder="Дополнительная информация о прицепе..."
                    rows={3}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setShowTrailerForm(false)}>
                    Отмена
                  </Button>
                  <Button type="submit">Добавить прицеп</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}

        {/* Форма создания связи */}
        {showAssignmentForm && (
          <Dialog open={showAssignmentForm} onOpenChange={setShowAssignmentForm}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Создать связь водитель-транспорт-прицеп</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAssignmentSubmit} className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label>Водитель *</Label>
                    <Select 
                      value={assignmentForm.driverId} 
                      onValueChange={(value) => setAssignmentForm(prev => ({ ...prev, driverId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите водителя" />
                      </SelectTrigger>
                      <SelectContent>
                        {drivers.map(driver => (
                          <SelectItem key={driver.id} value={driver.id}>
                            {driver.name} - {driver.licenseNumber}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Транспорт *</Label>
                    <Select 
                      value={assignmentForm.truckId} 
                      onValueChange={(value) => setAssignmentForm(prev => ({ ...prev, truckId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите транспорт" />
                      </SelectTrigger>
                      <SelectContent>
                        {trucks.map(truck => (
                          <SelectItem key={truck.id} value={truck.id}>
                            {truck.make} {truck.model} ({truck.licensePlate})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Прицеп *</Label>
                    <Select 
                      value={assignmentForm.trailerId} 
                      onValueChange={(value) => setAssignmentForm(prev => ({ ...prev, trailerId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите прицеп" />
                      </SelectTrigger>
                      <SelectContent>
                        {trailers.map(trailer => (
                          <SelectItem key={trailer.id} value={trailer.id}>
                            {trailer.trailerType} ({trailer.licensePlate})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Дата назначения *</Label>
                    <Input
                      type="date"
                      value={assignmentForm.assignedDate}
                      onChange={(e) => setAssignmentForm(prev => ({ ...prev, assignedDate: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setShowAssignmentForm(false)}>
                    Отмена
                  </Button>
                  <Button type="submit">Создать связь</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}

        {/* Диалог редактирования комментария */}
        {editingCommentFor && (
          <Dialog open={!!editingCommentFor} onOpenChange={() => setEditingCommentFor(null)}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Редактировать комментарий</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Введите комментарий..."
                  rows={5}
                />
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setEditingCommentFor(null)}>
                    Отмена
                  </Button>
                  <Button onClick={handleSaveComment}>Сохранить</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
}
