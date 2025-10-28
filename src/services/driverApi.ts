/**
 * Сервис для работы с API водителей
 * 
 * Предоставляет функции для загрузки водителей из внешнего MockAPI
 */

/**
 * Интерфейс водителя из API
 */
interface ApiDriverResponse {
  name: string;
  phone: string;
  licenseNumber: string;
  comment?: string;
  id?: string; // Игнорируется при импорте
  [key: string]: any; // Любые другие поля игнорируются
}

/**
 * Интерфейс водителя для системы
 */
export interface DriverData {
  name: string;
  phone: string;
  licenseNumber: string;
  comment: string;
  availability: 'Доступен' | 'В рейсе' | 'На ТО' | 'Не работает';
}

/**
 * Результат загрузки водителей
 */
export interface LoadDriversResult {
  success: boolean;
  drivers: DriverData[];
  error?: string;
}

/**
 * URL API для загрузки водителей
 */
const DRIVERS_API_URL = 'https://68fa3ce0ef8b2e621e7f53cf.mockapi.io/api/v1/drivers/name';

/**
 * Загрузка водителей из внешнего API
 * 
 * @returns Promise с результатом загрузки
 */
export async function loadDriversFromApi(): Promise<LoadDriversResult> {
  try {
    const response = await fetch(DRIVERS_API_URL);
    
    if (!response.ok) {
      return {
        success: false,
        drivers: [],
        error: `Ошибка HTTP: ${response.status}`
      };
    }
    
    const data: ApiDriverResponse[] = await response.json();
    
    // Фильтруем и преобразуем данные
    const drivers: DriverData[] = data
      .filter(apiDriver => 
        // Проверяем наличие обязательных полей
        apiDriver.name && 
        apiDriver.phone && 
        apiDriver.licenseNumber
      )
      .map(apiDriver => ({
        name: apiDriver.name,
        phone: apiDriver.phone,
        licenseNumber: apiDriver.licenseNumber,
        comment: apiDriver.comment || '',
        availability: 'Не работает' as const // Статус по умолчанию
      }));
    
    return {
      success: true,
      drivers
    };
  } catch (error) {
    console.error('Ошибка при загрузке водителей из API:', error);
    return {
      success: false,
      drivers: [],
      error: error instanceof Error ? error.message : 'Неизвестная ошибка'
    };
  }
}

/**
 * Проверка валидности данных водителя
 */
export function isValidDriver(driver: Partial<DriverData>): driver is DriverData {
  return Boolean(
    driver.name && 
    driver.phone && 
    driver.licenseNumber
  );
}
