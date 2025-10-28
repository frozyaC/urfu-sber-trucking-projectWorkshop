/**
 * Компонент формы создания заказа
 * 
 * Позволяет создавать заказы на перевозку с полной информацией:
 * - Маршрут с координатами (через компонент AddressInput)
 * - Тип и характеристики груза
 * - Требования к транспорту
 * - Временные рамки погрузки и доставки
 * - Автоматический расчет стоимости и объема
 * 
 * Особенности:
 * - Поддержка создания нескольких идентичных заказов (количество транспорта)
 * - Опциональные поля времени и размеров груза
 * - Автоматический расчет объема по ДxШxВ
 * - Интеграция с внешними площадками (externalOrderNumber)
 */

import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Checkbox } from './ui/checkbox';
import { AddressInput } from './AddressInput';
import { Send } from 'lucide-react';

/**
 * Интерфейс пользователя системы
 */
interface User {
  email: string;
  name: string;
  company: string;
  userType: 'shipper' | 'logistician';
}

/**
 * Интерфейс данных заказа для отправки
 */
interface OrderData {
  shipperName: string;
  managerName: string;
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
  cargoType: string;
  specialRequirements: string;
  transportationCost: number;
  length: string;
  width: string;
  height: string;
  vehicleCount: number;
  externalOrderNumber?: string;
}

/**
 * Свойства компонента формы заказа
 */
interface OrderFormProps {
  onSubmit: (order: OrderData) => void;
  currentUser: User;
  isLogistician?: boolean;
}

export function OrderForm({ onSubmit, currentUser, isLogistician = false }: OrderFormProps) {
  // Состояние формы с начальными значениями
  // Для грузоотправителей автоматически заполняются компания и менеджер
  const [formData, setFormData] = useState({
    shipperName: isLogistician ? '' : currentUser.company,
    managerName: isLogistician ? '' : currentUser.name,
    origin: '',
    destination: '',
    originLatitude: '',
    originLongitude: '',
    destinationLatitude: '',
    destinationLongitude: '',
    trailerType: 'Самосвал', // Тип по умолчанию для металлопроката
    volume: '',
    weight: '',
    pickupDate: '',
    pickupTime: '',
    deliveryDate: '',
    deliveryTime: '',
    cargoType: '',
    specialRequirements: '',
    transportationCost: '',
    length: '',
    width: '',
    height: '',
    vehicleCount: '1',
    externalOrderNumber: ''
  });

  // Флаги для опциональных полей
  const [includeDimensions, setIncludeDimensions] = useState(false); // Показывать поля размеров груза
  const [includePickupTime, setIncludePickupTime] = useState(false); // Показывать время погрузки
  const [includeDeliveryTime, setIncludeDeliveryTime] = useState(false); // Показывать время доставки

  // Список доступных типов прицепов
  const trailerTypes = [
    'Бортовой',
    'Рефрижератор',
    'Контейнеровоз',
    'Низкорамный',
    'Цистерна',
    'Самосвал',
    'Панфургон'
  ];

  // Список типов грузов (с акцентом на металлопрокат и металлолом)
  const cargoTypes = [
    'Металлопрокат',
    'Металлолом',
    'Строительные материалы',
    'Продукты питания',
    'Химические грузы',
    'Автозапчасти',
    'Электроника',
    'Текстиль',
    'Оборудование',
    'Прочее'
  ];

  /**
   * Автоматический расчет объема при изменении размеров груза
   */
  useEffect(() => {
    if (includeDimensions && formData.length && formData.width && formData.height) {
      const length = parseFloat(formData.length);
      const width = parseFloat(formData.width);
      const height = parseFloat(formData.height);
      
      if (!isNaN(length) && !isNaN(width) && !isNaN(height)) {
        const volume = (length * width * height).toFixed(1);
        setFormData(prev => ({ ...prev, volume: `${volume} м³` }));
      }
    } else if (!includeDimensions) {
      setFormData(prev => ({ ...prev, volume: '' }));
    }
  }, [formData.length, formData.width, formData.height, includeDimensions]);

  /**
   * Вычисление стоимости за одну машину
   */
  const costPerVehicle = () => {
    const totalCost = parseFloat(formData.transportationCost) || 0;
    const vehicleCount = parseInt(formData.vehicleCount) || 1;
    if (totalCost > 0 && vehicleCount > 0) {
      return (totalCost / vehicleCount).toFixed(2);
    }
    return '0';
  };

  /**
   * Обработчик отправки формы
   * Валидирует обязательные поля и передает данные родительскому компоненту
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Проверка обязательных полей
    if (!formData.shipperName || !formData.managerName || !formData.origin || !formData.destination) {
      alert('Пожалуйста, заполните все обязательные поля');
      return;
    }
    
    // Проверка дат
    if (!formData.pickupDate || !formData.deliveryDate) {
      alert('Пожалуйста, укажите даты погрузки и выгрузки');
      return;
    }
    
    // Проверка стоимости
    const totalCost = parseFloat(formData.transportationCost) || 0;
    if (totalCost <= 0) {
      alert('Стоимость грузоперевозки должна быть положительным числом');
      return;
    }
    
    // Проверка количества транспорта
    const vehicleCount = parseInt(formData.vehicleCount) || 1;
    if (vehicleCount < 1 || vehicleCount > 5) {
      alert('Количество транспорта должно быть от 1 до 5');
      return;
    }
    
    // Расчет стоимости за одну машину
    const costPerUnit = parseFloat(costPerVehicle());
    
    onSubmit({
      ...formData,
      pickupTime: includePickupTime ? formData.pickupTime : undefined,
      deliveryTime: includeDeliveryTime ? formData.deliveryTime : undefined,
      originLatitude: formData.originLatitude || undefined,
      originLongitude: formData.originLongitude || undefined,
      destinationLatitude: formData.destinationLatitude || undefined,
      destinationLongitude: formData.destinationLongitude || undefined,
      transportationCost: costPerUnit,
      vehicleCount: parseInt(formData.vehicleCount) || 1,
      externalOrderNumber: formData.externalOrderNumber || undefined
    });

    // Сброс формы (оставляем данные компании и менеджера для грузоотправителей)
    setFormData({
      shipperName: isLogistician ? '' : currentUser.company,
      managerName: isLogistician ? '' : currentUser.name,
      origin: '',
      destination: '',
      originLatitude: '',
      originLongitude: '',
      destinationLatitude: '',
      destinationLongitude: '',
      trailerType: 'Самосвал',
      volume: '',
      weight: '',
      pickupDate: '',
      pickupTime: '',
      deliveryDate: '',
      deliveryTime: '',
      cargoType: '',
      specialRequirements: '',
      transportationCost: '',
      length: '',
      width: '',
      height: '',
      vehicleCount: '1',
      externalOrderNumber: ''
    });
    setIncludeDimensions(false);
    setIncludePickupTime(false);
    setIncludeDeliveryTime(false);
  };

  /**
   * Обновление значения поля формы
   */
  const updateFormData = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="shipperName">Название компании *</Label>
          <Input
            id="shipperName"
            value={formData.shipperName}
            onChange={(e) => updateFormData('shipperName', e.target.value)}
            placeholder="Введите название вашей компании"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="managerName">Имя менеджера *</Label>
          <Input
            id="managerName"
            value={formData.managerName}
            onChange={(e) => updateFormData('managerName', e.target.value)}
            placeholder="Введите имя менеджера"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cargoType">Тип груза *</Label>
          <Select value={formData.cargoType} onValueChange={(value) => updateFormData('cargoType', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Выберите тип груза" />
            </SelectTrigger>
            <SelectContent>
              {cargoTypes.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <AddressInput
          label="Адрес отправления"
          value={{
            address: formData.origin,
            latitude: formData.originLatitude,
            longitude: formData.originLongitude
          }}
          onChange={(data) => {
            setFormData(prev => ({
              ...prev,
              origin: data.address,
              originLatitude: data.latitude,
              originLongitude: data.longitude
            }));
          }}
          required
        />

        <AddressInput
          label="Адрес назначения"
          value={{
            address: formData.destination,
            latitude: formData.destinationLatitude,
            longitude: formData.destinationLongitude
          }}
          onChange={(data) => {
            setFormData(prev => ({
              ...prev,
              destination: data.address,
              destinationLatitude: data.latitude,
              destinationLongitude: data.longitude
            }));
          }}
          required
        />

        <div className="space-y-2">
          <Label htmlFor="trailerType">Тип прицепа</Label>
          <Select value={formData.trailerType} onValueChange={(value) => updateFormData('trailerType', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Выберите тип прицепа" />
            </SelectTrigger>
            <SelectContent>
              {trailerTypes.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="weight">Вес груза</Label>
          <Input
            id="weight"
            value={formData.weight}
            onChange={(e) => updateFormData('weight', e.target.value)}
            placeholder="например, 20,000 кг"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="externalOrderNumber">Номер заказа на внешней площадке</Label>
          <Input
            id="externalOrderNumber"
            value={formData.externalOrderNumber}
            onChange={(e) => updateFormData('externalOrderNumber', e.target.value)}
            placeholder="ATI-123456 или другой номер"
          />
          <p className="text-xs text-muted-foreground">
            Опциональное поле для связи с заказами на сторонних площадках
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="vehicleCount">Количество транспорта *</Label>
          <Select value={formData.vehicleCount} onValueChange={(value) => updateFormData('vehicleCount', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Выберите количество" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 машина</SelectItem>
              <SelectItem value="2">2 машины</SelectItem>
              <SelectItem value="3">3 машины</SelectItem>
              <SelectItem value="4">4 машины</SelectItem>
              <SelectItem value="5">5 машин</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Будет создано соответствующее число заказов
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="transportationCost">Стоимость грузоперевозки (руб.) *</Label>
          <Input
            id="transportationCost"
            value={formData.transportationCost}
            onChange={(e) => updateFormData('transportationCost', e.target.value)}
            placeholder="45000"
            type="number"
            min="1"
            step="0.01"
            required
          />
          <p className="text-xs text-muted-foreground">
            Общая стоимость за все {formData.vehicleCount} {parseInt(formData.vehicleCount) === 1 ? 'машину' : 'машины'}
          </p>
        </div>

        <div className="space-y-2">
          <Label>Стоимость за одну машину</Label>
          <Input
            value={`${costPerVehicle()} руб.`}
            readOnly
            className="bg-muted font-medium"
          />
          <p className="text-xs text-muted-foreground">
            Автоматический расчет: {formData.transportationCost || '0'} руб. ÷ {formData.vehicleCount} = {costPerVehicle()} руб.
          </p>
        </div>
      </div>

      {/* Размеры груза - опционально */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="includeDimensions" 
            checked={includeDimensions}
            onCheckedChange={(checked) => setIncludeDimensions(checked as boolean)}
          />
          <Label htmlFor="includeDimensions" className="cursor-pointer">
            Указать размеры груза
          </Label>
        </div>

        {includeDimensions && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="length">Длина (м)</Label>
              <Input
                id="length"
                value={formData.length}
                onChange={(e) => updateFormData('length', e.target.value)}
                placeholder="12.0"
                type="number"
                step="0.1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="width">Ширина (м)</Label>
              <Input
                id="width"
                value={formData.width}
                onChange={(e) => updateFormData('width', e.target.value)}
                placeholder="2.4"
                type="number"
                step="0.1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="height">Высота (м)</Label>
              <Input
                id="height"
                value={formData.height}
                onChange={(e) => updateFormData('height', e.target.value)}
                placeholder="2.7"
                type="number"
                step="0.1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="volume">Объем</Label>
              <Input
                id="volume"
                value={formData.volume}
                readOnly
                placeholder="Авто-расчет"
                className="bg-muted"
              />
            </div>
          </div>
        )}
      </div>

      {/* Временные рамки */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Временные рамки</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Дата погрузки */}
          <div className="space-y-4">
            <h4 className="font-medium text-muted-foreground">Погрузка</h4>
            <div className="space-y-2">
              <Label htmlFor="pickupDate">Дата погрузки *</Label>
              <Input
                id="pickupDate"
                type="date"
                value={formData.pickupDate}
                onChange={(e) => updateFormData('pickupDate', e.target.value)}
                required
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="includePickupTime" 
                checked={includePickupTime}
                onCheckedChange={(checked) => setIncludePickupTime(checked as boolean)}
              />
              <Label htmlFor="includePickupTime" className="cursor-pointer">
                Указать время
              </Label>
            </div>
            {includePickupTime && (
              <div className="space-y-2">
                <Label htmlFor="pickupTime">Время погрузки</Label>
                <Input
                  id="pickupTime"
                  type="time"
                  value={formData.pickupTime}
                  onChange={(e) => updateFormData('pickupTime', e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Дата доставки */}
          <div className="space-y-4">
            <h4 className="font-medium text-muted-foreground">Доставка</h4>
            <div className="space-y-2">
              <Label htmlFor="deliveryDate">Дата доставки *</Label>
              <Input
                id="deliveryDate"
                type="date"
                value={formData.deliveryDate}
                onChange={(e) => updateFormData('deliveryDate', e.target.value)}
                min={formData.pickupDate}
                required
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="includeDeliveryTime" 
                checked={includeDeliveryTime}
                onCheckedChange={(checked) => setIncludeDeliveryTime(checked as boolean)}
              />
              <Label htmlFor="includeDeliveryTime" className="cursor-pointer">
                Указать время
              </Label>
            </div>
            {includeDeliveryTime && (
              <div className="space-y-2">
                <Label htmlFor="deliveryTime">Время доставки</Label>
                <Input
                  id="deliveryTime"
                  type="time"
                  value={formData.deliveryTime}
                  onChange={(e) => updateFormData('deliveryTime', e.target.value)}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="specialRequirements">Особые требования</Label>
        <Textarea
          id="specialRequirements"
          value={formData.specialRequirements}
          onChange={(e) => updateFormData('specialRequirements', e.target.value)}
          placeholder="Любые особые требования к обработке, оборудованию или доставке..."
          rows={3}
        />
      </div>

      <Button type="submit" className="w-full flex items-center gap-2">
        <Send className="h-4 w-4" />
        Создать заказ
      </Button>
    </form>
  );
}
