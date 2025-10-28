/**
 * Компонент с инструкциями по использованию API загрузки водителей
 * 
 * Отображает пошаговое руководство и примеры использования
 */

import React from 'react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Badge } from './ui/badge';
import { Info, CheckCircle, AlertCircle } from 'lucide-react';

export function ApiInstructions() {
  return (
    <div className="space-y-4">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Автоматическая загрузка водителей</AlertTitle>
        <AlertDescription>
          При нажатии кнопки "Добавить заказ" система автоматически загружает водителей из внешнего MockAPI
        </AlertDescription>
      </Alert>

      <div className="bg-card rounded-lg border p-4 space-y-3">
        <h4 className="font-semibold flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-600" />
          Процесс загрузки
        </h4>
        <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground ml-2">
          <li>Выполняется GET-запрос к API</li>
          <li>Парсятся поля: <code className="text-xs bg-slate-100 px-1 rounded">name</code>, <code className="text-xs bg-slate-100 px-1 rounded">phone</code>, <code className="text-xs bg-slate-100 px-1 rounded">licenseNumber</code>, <code className="text-xs bg-slate-100 px-1 rounded">comment</code></li>
          <li>Проверка на дубликаты по номеру ВУ</li>
          <li>Добавление новых водителей в систему</li>
          <li>Отображение результата с уведомлением</li>
        </ol>
      </div>

      <div className="bg-card rounded-lg border p-4 space-y-3">
        <h4 className="font-semibold flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          Возможные результаты
        </h4>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge className="bg-green-100 text-green-800">Успех</Badge>
            <span className="text-sm">Загружено водителей: N</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-yellow-100 text-yellow-800">Частично</Badge>
            <span className="text-sm">Загружено: N (пропущено дубликатов: M)</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-orange-100 text-orange-800">Дубликаты</Badge>
            <span className="text-sm">Все водители уже существуют</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-red-100 text-red-800">Ошибка</Badge>
            <span className="text-sm">Не удалось загрузить данные</span>
          </div>
        </div>
      </div>

      <div className="bg-slate-950 text-slate-50 rounded-lg p-4">
        <div className="text-xs font-mono space-y-1">
          <div className="text-slate-400">// Endpoint API</div>
          <div className="text-green-400">GET https://68fa3ce0ef8b2e621e7f53cf.mockapi.io/api/v1/drivers/name</div>
          <div className="text-slate-400 mt-3">// Пример ответа</div>
          <pre className="text-xs mt-2">
{`[
  {
    "name": "Иван Петров",
    "phone": "+7-495-123-45-67",
    "licenseNumber": "987654321",
    "comment": "Опытный водитель",
    "id": "1"  // игнорируется
  }
]`}
          </pre>
        </div>
      </div>
    </div>
  );
}
