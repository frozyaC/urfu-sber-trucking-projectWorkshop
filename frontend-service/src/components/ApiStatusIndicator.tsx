/**
 * Компонент индикатора статуса API загрузки
 * 
 * Отображает визуальную информацию о последней загрузке водителей
 */

import React from 'react';
import { Badge } from './ui/badge';
import { CheckCircle, AlertCircle, Info } from 'lucide-react';

interface ApiStatusIndicatorProps {
  lastLoadTime?: Date;
  loadedCount?: number;
  duplicateCount?: number;
}

/**
 * Индикатор статуса последней загрузки из API
 */
export function ApiStatusIndicator({ lastLoadTime, loadedCount, duplicateCount }: ApiStatusIndicatorProps) {
  if (!lastLoadTime) {
    return null;
  }

  const timeSinceLoad = Date.now() - lastLoadTime.getTime();
  const minutesAgo = Math.floor(timeSinceLoad / 60000);
  
  let timeText = '';
  if (minutesAgo < 1) {
    timeText = 'только что';
  } else if (minutesAgo === 1) {
    timeText = '1 минуту назад';
  } else if (minutesAgo < 5) {
    timeText = `${minutesAgo} минуты назад`;
  } else {
    timeText = `${minutesAgo} минут назад`;
  }

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
      <CheckCircle className="h-4 w-4 text-green-600" />
      <span>Последняя загрузка из API: {timeText}</span>
      {loadedCount !== undefined && loadedCount > 0 && (
        <Badge variant="secondary" className="ml-2">
          +{loadedCount} новых
        </Badge>
      )}
      {duplicateCount !== undefined && duplicateCount > 0 && (
        <Badge variant="outline" className="ml-1">
          {duplicateCount} дубликатов
        </Badge>
      )}
    </div>
  );
}
