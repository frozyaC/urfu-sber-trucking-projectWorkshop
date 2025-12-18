/**
 * Клиент для вызова calculate API
 */

export interface CalculatedDriverItem {
  name: string; // Имя водителя
  originLatitude: string;
  originLongitude: string;
  deliveryDate: string; // ISO datetime (LocalDateTime из Java)
  origin?: string; // Адрес отправления
}

export interface CalculateResult {
  success: boolean;
  data: CalculatedDriverItem[];
  error?: string;
}

const BASE_URL = 'http://localhost:8081';

export async function fetchCalculatedDrivers(
  orderLatitude?: number,
  orderLongitude?: number,
  deliveryDateTime?: string
): Promise<CalculateResult> {
  try {
    // Формируем правильный формат ISO 8601 для LocalDateTime (без временной зоны и миллисекунд)
    const formatLocalDateTime = (dateTime?: string): string => {
      if (dateTime) {
        // Убираем временную зону и миллисекунды, если они есть
        return dateTime.replace(/\.\d{3}Z?$/, '').replace(/Z$/, '').replace(/[+-]\d{2}:\d{2}$/, '');
      }
      // Fallback: текущая дата и время в формате ISO без временной зоны
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    };

    // Используем данные из заказа, если они переданы
    // Проверяем, что координаты валидны (не null, не undefined, не NaN)
    const validLongitude = (orderLongitude != null && !isNaN(orderLongitude)) ? orderLongitude : 37.6173;
    const validLatitude = (orderLatitude != null && !isNaN(orderLatitude)) ? orderLatitude : 55.7558;
    
    // ВАЖНО: на бэкенде поле называется longitute (с опечаткой), а не longitude
    const requestBody = {
      localDateTime: formatLocalDateTime(deliveryDateTime),
      longitute: validLongitude, // Используем longitute для соответствия бэкенду
      latitude: validLatitude
    };
    
    console.log('Отправка запроса на подбор водителей:', requestBody);

    const response = await fetch(`${BASE_URL}/api/calculate`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const responseData = await response.json();
    
    // Проверяем, если ответ содержит сообщение об отсутствии водителей
    if (responseData && typeof responseData === 'object' && 'message' in responseData) {
      return {
        success: true,
        data: responseData.drivers || [],
        error: responseData.message
      };
    }
    
    // Если ответ - массив, возвращаем его
    if (Array.isArray(responseData)) {
      return {
        success: true,
        data: responseData
      };
    }
    
    if (!response.ok) {
      return {
        success: false,
        data: [],
        error: `HTTP ${response.status}: ${response.statusText}`
      };
    }

    return {
      success: true,
      data: []
    };
  } catch (error) {
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : 'Неизвестная ошибка'
    };
  }
}


