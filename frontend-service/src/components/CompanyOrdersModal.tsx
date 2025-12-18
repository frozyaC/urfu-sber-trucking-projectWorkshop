/**
 * Компонент модального окна с информацией о компании или менеджере
 * 
 * Для компаний отображает:
 * - Комментарий к компании
 * 
 * Для менеджеров отображает:
 * - Информацию о менеджере (телефон, email) с возможностью редактирования
 * - Комментарий к менеджеру
 */

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Package, MapPin, Calendar, Weight, MessageSquare, Phone, Mail } from 'lucide-react';
import { CommentModal } from './CommentModal';

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
}

interface Comments {
  companies: { [companyName: string]: string };
  managers: { [managerName: string]: string };
  orders: { [orderId: string]: string };
}

interface ManagerInfo {
  phone: string;
  email: string;
}

interface CompanyOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  companyName?: string;
  managerName?: string;
  type: 'company' | 'manager';
  comments: Comments;
  managersInfo: { [managerName: string]: ManagerInfo };
  onUpdateCompanyComment: (companyName: string, comment: string) => void;
  onUpdateManagerComment: (managerName: string, comment: string) => void;
  onUpdateManagerInfo: (managerName: string, info: ManagerInfo) => void;
}

/**
 * Компонент для отображения информации о компании или менеджере
 */
export function CompanyOrdersModal({ 
  isOpen, 
  onClose, 
  orders, 
  companyName, 
  managerName, 
  type,
  comments,
  managersInfo,
  onUpdateCompanyComment,
  onUpdateManagerComment,
  onUpdateManagerInfo
}: CompanyOrdersModalProps) {
  // Состояние для модального окна комментария
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  
  // Состояние для режима редактирования информации о менеджере
  const [isEditingManager, setIsEditingManager] = useState(false);
  const [editedManagerInfo, setEditedManagerInfo] = useState<ManagerInfo>({ phone: '', email: '' });
  
  // Фильтрация заказов по компании или менеджеру (используется только для компаний)
  const filteredOrders = orders.filter(order => {
    if (type === 'company') {
      return order.shipperName === companyName;
    } else {
      return order.managerName === managerName;
    }
  });

  /**
   * Открытие модального окна для добавления/редактирования комментария
   */
  const handleCommentClick = () => {
    setIsCommentModalOpen(true);
  };

  /**
   * Сохранение комментария к компании или менеджеру
   */
  const handleSaveComment = (comment: string) => {
    if (type === 'company' && companyName) {
      onUpdateCompanyComment(companyName, comment);
    } else if (type === 'manager' && managerName) {
      onUpdateManagerComment(managerName, comment);
    }
  };

  /**
   * Включение режима редактирования информации о менеджере
   */
  const handleEditManagerClick = () => {
    if (managerName && managersInfo[managerName]) {
      setEditedManagerInfo(managersInfo[managerName]);
    } else {
      setEditedManagerInfo({ phone: '', email: '' });
    }
    setIsEditingManager(true);
  };

  /**
   * Сохранение обновленной информации о менеджере
   */
  const handleSaveManagerInfo = () => {
    if (managerName) {
      onUpdateManagerInfo(managerName, editedManagerInfo);
      setIsEditingManager(false);
    }
  };

  /**
   * Отмена редактирования информации о менеджере
   */
  const handleCancelEditManager = () => {
    setIsEditingManager(false);
    setEditedManagerInfo({ phone: '', email: '' });
  };

  /**
   * Получение текущего комментария для компании или менеджера
   */
  const getCurrentComment = () => {
    if (type === 'company' && companyName) {
      return comments.companies[companyName] || '';
    } else if (type === 'manager' && managerName) {
      return comments.managers[managerName] || '';
    }
    return '';
  };

  /**
   * Определение цвета бейджа статуса заказа
   */
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Ожидает':
        return 'border bg-red-100 text-red-800 border-red-200';
      case 'Назначен':
        return 'border bg-orange-100 text-orange-800 border-orange-200';
      case 'В пути':
        return 'border bg-green-100 text-green-800 border-green-200';
      case 'Доставлен':
        return 'border bg-cyan-100 text-cyan-800 border-cyan-200';
      default:
        return 'border bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  /**
   * Форматирование даты и времени для отображения
   */
  const formatDateTime = (date: string, time?: string) => {
    const formattedDate = new Date(date).toLocaleDateString('ru-RU');
    return time ? `${formattedDate} в ${time}` : formattedDate;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-[90vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {type === 'company' ? `Компания: ${companyName}` : `Менеджер: ${managerName}`}
          </DialogTitle>
          <DialogDescription>
            {type === 'company' ? 'Информация и комментарий к компании' : 'Информация и комментарий к менеджеру'}
          </DialogDescription>
        </DialogHeader>

        {/* Информация о компании/менеджере */}
        <div className="border-b pb-4 space-y-4">
          {type === 'manager' && managerName && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Информация о менеджере</span>
                  {!isEditingManager && (
                    <Button variant="outline" size="sm" onClick={handleEditManagerClick}>
                      Редактировать
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isEditingManager ? (
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="phone">Телефон</Label>
                      <Input
                        id="phone"
                        value={editedManagerInfo.phone}
                        onChange={(e) => setEditedManagerInfo(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="+7 (XXX) XXX-XX-XX"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={editedManagerInfo.email}
                        onChange={(e) => setEditedManagerInfo(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="manager@company.ru"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSaveManagerInfo}>
                        Сохранить
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleCancelEditManager}>
                        Отмена
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {managersInfo[managerName] && (
                      <>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{managersInfo[managerName].phone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span>{managersInfo[managerName].email}</span>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Комментарий */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between p-[0px] m-[0px]">
                <span>Комментарий {type === 'company' ? 'к компании' : 'к менеджеру'}</span>
                <Button variant="outline" size="sm" onClick={handleCommentClick}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  {getCurrentComment() ? 'Изменить комментарий' : 'Добавить комментарий'}
                </Button>
              </CardTitle>
            </CardHeader>
            {getCurrentComment() && (
              <CardContent>
                <p className="text-sm text-muted-foreground">{getCurrentComment()}</p>
              </CardContent>
            )}
          </Card>
        </div>


      </DialogContent>

      <CommentModal
        isOpen={isCommentModalOpen}
        onClose={() => setIsCommentModalOpen(false)}
        title={`Комментарий ${type === 'company' ? 'к компании' : 'к менеджеру'}`}
        description={`Добавьте служебную информацию или заметки ${type === 'company' ? `о компании ${companyName}` : `о менеджере ${managerName}`}`}
        currentComment={getCurrentComment()}
        onSaveComment={handleSaveComment}
      />
    </Dialog>
  );
}