/**
 * Модальное окно успешного создания заказа
 * 
 * Отображается после успешного создания одного или нескольких заказов.
 * Показывает номер(а) созданного заказа и уведомляет о дальнейших действиях.
 */

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { CheckCircle } from "lucide-react";

/**
 * Пропсы компонента OrderSuccessModal
 */
interface OrderSuccessModalProps {
  isOpen: boolean;                // Открыто ли модальное окно
  onClose: () => void;            // Callback для закрытия окна
  orderId: string | null;         // Номер созданного заказа или сообщение о нескольких заказах
}

/**
 * Компонент модального окна успешного создания заказа
 */
export function OrderSuccessModal({
  isOpen,
  onClose,
  orderId,
}: OrderSuccessModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <CheckCircle className="h-12 w-12 text-green-500" />
          </div>
          <DialogTitle className="text-center">
            {orderId?.includes('заказов') ? 'Заказы успешно созданы!' : 'Заказ успешно создан!'}
          </DialogTitle>
          <DialogDescription className="text-center">
            {orderId && (
              <>
                {orderId}
                <br />
              </>
            )}
            Логисты получат уведомление о новом заказе и
            свяжутся с вами в ближайшее время.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button onClick={onClose} className="w-full">
            Закрыть
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}