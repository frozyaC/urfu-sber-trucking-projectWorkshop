/**
 * Универсальное модальное окно для редактирования комментариев
 * 
 * Используется для добавления и редактирования комментариев к:
 * - Компаниям
 * - Менеджерам
 * - Заказам
 */

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { MessageSquare } from 'lucide-react';

/**
 * Пропсы компонента CommentModal
 */
interface CommentModalProps {
  isOpen: boolean;                    // Открыто ли модальное окно
  onClose: () => void;                // Callback для закрытия окна
  title: string;                      // Заголовок модального окна
  description: string;                // Описание под заголовком
  currentComment: string;             // Текущий текст комментария
  onSaveComment: (comment: string) => void; // Callback для сохранения комментария
}

/**
 * Модальное окно для редактирования комментариев
 */
export function CommentModal({ 
  isOpen, 
  onClose, 
  title, 
  description, 
  currentComment, 
  onSaveComment 
}: CommentModalProps) {
  // Локальное состояние для редактирования комментария
  const [comment, setComment] = useState(currentComment);

  /**
   * Сохраняет комментарий и закрывает окно
   */
  const handleSave = () => {
    onSaveComment(comment);
    onClose();
  };

  /**
   * Отменяет изменения и закрывает окно
   * Возвращает текст к исходному значению
   */
  const handleClose = () => {
    setComment(currentComment);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl w-[90vw]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-6">
          <div className="space-y-2">
            <Label htmlFor="comment">Комментарий</Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Введите служебную информацию, заметки или комментарии..."
              className="min-h-[150px] resize-none"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose}>
              Отмена
            </Button>
            <Button onClick={handleSave}>
              Сохранить
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}