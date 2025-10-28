/**
 * Компонент предпросмотра данных из API
 * 
 * Показывает пример структуры данных, получаемых из MockAPI
 * Полезен для отладки и документации
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Code, RefreshCw } from 'lucide-react';
import { loadDriversFromApi } from '../services/driverApi';

/**
 * Компонент для предпросмотра и тестирования API
 */
export function ApiDataPreview() {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleLoadPreview = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await loadDriversFromApi();
      
      if (result.success) {
        setData(result.drivers);
      } else {
        setError(result.error || 'Неизвестная ошибка');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              Предпросмотр данных API
            </CardTitle>
            <CardDescription>
              Тестирование загрузки водителей из MockAPI
            </CardDescription>
          </div>
          <Button 
            onClick={handleLoadPreview} 
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Загрузка...' : 'Загрузить'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="p-4 mb-4 text-sm text-red-800 bg-red-50 rounded-lg">
            <strong>Ошибка:</strong> {error}
          </div>
        )}
        
        {data && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Получено записей:</span>
              <span className="font-semibold">{data.length}</span>
            </div>
            <div className="bg-slate-950 text-slate-50 p-4 rounded-lg overflow-auto max-h-96">
              <pre className="text-xs">
                {JSON.stringify(data, null, 2)}
              </pre>
            </div>
          </div>
        )}
        
        {!data && !error && (
          <div className="text-center text-muted-foreground py-8">
            Нажмите "Загрузить" для просмотра данных из API
          </div>
        )}
      </CardContent>
    </Card>
  );
}
