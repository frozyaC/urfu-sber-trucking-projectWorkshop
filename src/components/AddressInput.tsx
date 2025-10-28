/**
 * Компонент ввода адреса с координатами
 * 
 * Предоставляет интерфейс для указания полного адреса с географическими координатами.
 * Используется в форме заказа для точного указания точек погрузки и выгрузки.
 * 
 * Особенности:
 * - Модальное окно для редактирования адреса и координат
 * - Отображение текущих координат под полем
 * - Поддержка обязательных полей
 * - Временное хранение данных до сохранения
 */

import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { MapPin, Edit } from 'lucide-react';

/**
 * Интерфейс данных адреса
 */
interface AddressData {
  address: string;      // Текстовый адрес
  latitude: string;     // Географическая широта
  longitude: string;    // Географическая долгота
}

/**
 * Свойства компонента ввода адреса
 */
interface AddressInputProps {
  label: string;                           // Название поля
  value: AddressData;                      // Текущее значение
  onChange: (data: AddressData) => void;   // Обработчик изменений
  required?: boolean;                      // Обязательное ли поле
}

export function AddressInput({ label, value, onChange, required = false }: AddressInputProps) {
  const [isOpen, setIsOpen] = useState(false);                    // Состояние открытия модального окна
  const [tempData, setTempData] = useState<AddressData>(value);  // Временные данные до сохранения

  /**
   * Открытие модального окна и инициализация временных данных
   */
  const handleOpen = () => {
    setTempData(value);
    setIsOpen(true);
  };

  /**
   * Сохранение изменений и закрытие окна
   */
  const handleSave = () => {
    onChange(tempData);
    setIsOpen(false);
  };

  /**
   * Отмена изменений и закрытие окна
   */
  const handleCancel = () => {
    setTempData(value);
    setIsOpen(false);
  };

  return (
    <div className="space-y-2">
      <Label>{label} {required && '*'}</Label>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="w-full justify-start text-left font-normal"
            onClick={handleOpen}
          >
            <MapPin className="mr-2 h-4 w-4 flex-shrink-0" />
            <span className="flex-1 truncate">
              {value.address || 'Укажите адрес'}
            </span>
            <Edit className="ml-2 h-4 w-4 flex-shrink-0 text-muted-foreground" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{label}</DialogTitle>
            <DialogDescription>
              Укажите адрес и координаты местоположения
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="address">Адрес {required && '*'}</Label>
              <Input
                id="address"
                value={tempData.address}
                onChange={(e) => setTempData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Город, улица, дом"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitude">Широта</Label>
                <Input
                  id="latitude"
                  value={tempData.latitude}
                  onChange={(e) => setTempData(prev => ({ ...prev, latitude: e.target.value }))}
                  placeholder="55.7558"
                  type="number"
                  step="any"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude">Долгота</Label>
                <Input
                  id="longitude"
                  value={tempData.longitude}
                  onChange={(e) => setTempData(prev => ({ ...prev, longitude: e.target.value }))}
                  placeholder="37.6173"
                  type="number"
                  step="any"
                />
              </div>
            </div>
            {tempData.latitude && tempData.longitude && (
              <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                <p className="font-medium mb-1">Координаты:</p>
                <p>{tempData.latitude}, {tempData.longitude}</p>
              </div>
            )}
          </div>
          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Отмена
            </Button>
            <Button type="button" onClick={handleSave}>
              Сохранить
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {value.latitude && value.longitude && (
        <p className="text-xs text-muted-foreground">
          Координаты: {value.latitude}, {value.longitude}
        </p>
      )}
    </div>
  );
}
