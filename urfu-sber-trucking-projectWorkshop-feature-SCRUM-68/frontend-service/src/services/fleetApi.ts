/**
 * API для работы с водителями, транспортными средствами, прицепами и связками
 */

const DEFAULT_API_BASE = 'http://localhost:8080';
const VITE_ENV: any = (import.meta as any)?.env ?? {};
const API_BASE_URL = (VITE_ENV.VITE_API_BASE_URL || DEFAULT_API_BASE).replace(/\/$/, '');

async function fetchJSON<T>(endpoint: string, options?: RequestInit): Promise<T | null> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      console.error(`Ошибка ${endpoint}:`, error);
      throw new Error(error.message || `HTTP ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Ошибка сети при запросе ${endpoint}:`, error);
    throw error;
  }
}

// ==================== DRIVERS API ====================

export interface Driver {
  id: string;
  name: string;
  phone: string;
  licenseNumber: string;
  availability: 'Доступен' | 'В рейсе' | 'На ТО' | 'Не работает';
  comment?: string;
}

export async function fetchAllDrivers(): Promise<Driver[]> {
  try {
    const data = await fetchJSON<{ drivers: Driver[] }>('/api/drivers');
    return data?.drivers || [];
  } catch (error) {
    console.error('Ошибка при загрузке водителей:', error);
    return [];
  }
}

export async function fetchDriverById(id: string): Promise<Driver | null> {
  try {
    return await fetchJSON<Driver>(`/api/drivers/${id}`);
  } catch {
    return null;
  }
}

export async function createDriver(driver: Omit<Driver, 'id'> & { id: string }): Promise<Driver> {
  console.log('Отправка данных водителя на сервер:', driver);
  
  // Валидация данных перед отправкой
  if (!driver.id || !driver.name || !driver.phone || !driver.licenseNumber) {
    throw new Error('Все обязательные поля должны быть заполнены');
  }
  
  let response: Response;
  let responseText: string;
  
  try {
    response = await fetch(`${API_BASE_URL}/api/drivers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: driver.id.trim(),
        name: driver.name.trim(),
        phone: driver.phone.trim(),
        licenseNumber: driver.licenseNumber.trim(),
        availability: driver.availability || 'Доступен',
        comment: driver.comment || ''
      }),
    });
    
    responseText = await response.text();
    console.log('Ответ сервера:', response.status, responseText);
  } catch (networkError: any) {
    console.error('Ошибка сети при создании водителя:', networkError);
    throw new Error(`Ошибка сети: ${networkError.message || 'Не удалось подключиться к серверу'}`);
  }
  
  if (!response.ok) {
    let errorMessage = 'Не удалось создать водителя';
    try {
      if (responseText) {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.message || errorMessage;
      } else {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
    } catch (parseError) {
      // Если не JSON, попробуем извлечь сообщение из текста
      if (responseText && responseText.includes('message')) {
        const match = responseText.match(/"message"\s*:\s*"([^"]+)"/);
        if (match) {
          errorMessage = match[1];
        } else {
          errorMessage = responseText || `HTTP ${response.status}`;
        }
      } else {
        errorMessage = responseText || `HTTP ${response.status}: ${response.statusText}`;
      }
    }
    throw new Error(errorMessage);
  }
  
  // Парсинг успешного ответа
  try {
    if (!responseText || responseText.trim() === '') {
      throw new Error('Пустой ответ от сервера');
    }
    const data = JSON.parse(responseText);
    return data;
  } catch (parseError: any) {
    console.error('Ошибка парсинга ответа:', parseError, 'Response text:', responseText);
    throw new Error(`Ошибка обработки ответа сервера: ${parseError.message}`);
  }
}

export async function updateDriver(id: string, driver: Partial<Driver>): Promise<Driver> {
  try {
    const data = await fetchJSON<Driver>(`/api/drivers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(driver),
    });
    if (!data) throw new Error('Не удалось обновить водителя');
    return data;
  } catch (error: any) {
    throw new Error(error.message || 'Не удалось обновить водителя');
  }
}

export async function deleteDriver(id: string): Promise<void> {
  try {
    await fetchJSON(`/api/drivers/${id}`, {
      method: 'DELETE',
    });
  } catch (error: any) {
    throw new Error(error.message || 'Не удалось удалить водителя');
  }
}

// ==================== TRUCKS API ====================

export interface Truck {
  id: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  vinNumber: string;
  maintenanceStatus: 'Исправен' | 'Требует ТО' | 'На ТО';
  currentLocation: string;
  comment?: string;
}

export async function fetchAllTrucks(): Promise<Truck[]> {
  try {
    const data = await fetchJSON<{ trucks: Truck[] }>('/api/trucks');
    return data?.trucks || [];
  } catch (error) {
    console.error('Ошибка при загрузке транспортных средств:', error);
    return [];
  }
}

export async function fetchTruckById(id: string): Promise<Truck | null> {
  try {
    return await fetchJSON<Truck>(`/api/trucks/${id}`);
  } catch {
    return null;
  }
}

export async function createTruck(truck: Omit<Truck, 'id'> & { id: string }): Promise<Truck> {
  try {
    const data = await fetchJSON<Truck>('/api/trucks', {
      method: 'POST',
      body: JSON.stringify(truck),
    });
    if (!data) throw new Error('Не удалось создать транспортное средство');
    return data;
  } catch (error: any) {
    throw new Error(error.message || 'Не удалось создать транспортное средство');
  }
}

export async function updateTruck(id: string, truck: Partial<Truck>): Promise<Truck> {
  try {
    const data = await fetchJSON<Truck>(`/api/trucks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(truck),
    });
    if (!data) throw new Error('Не удалось обновить транспортное средство');
    return data;
  } catch (error: any) {
    throw new Error(error.message || 'Не удалось обновить транспортное средство');
  }
}

export async function deleteTruck(id: string): Promise<void> {
  try {
    await fetchJSON(`/api/trucks/${id}`, {
      method: 'DELETE',
    });
  } catch (error: any) {
    throw new Error(error.message || 'Не удалось удалить транспортное средство');
  }
}

// ==================== TRAILERS API ====================

export interface Trailer {
  id: string;
  licensePlate: string;
  trailerType: string;
  length: string;
  width: string;
  height: string;
  volume: string;
  comment?: string;
}

export async function fetchAllTrailers(): Promise<Trailer[]> {
  try {
    const data = await fetchJSON<{ trailers: Trailer[] }>('/api/trailers');
    return data?.trailers || [];
  } catch (error) {
    console.error('Ошибка при загрузке прицепов:', error);
    return [];
  }
}

export async function fetchTrailerById(id: string): Promise<Trailer | null> {
  try {
    return await fetchJSON<Trailer>(`/api/trailers/${id}`);
  } catch {
    return null;
  }
}

export async function createTrailer(trailer: Omit<Trailer, 'id'> & { id: string }): Promise<Trailer> {
  try {
    const data = await fetchJSON<Trailer>('/api/trailers', {
      method: 'POST',
      body: JSON.stringify(trailer),
    });
    if (!data) throw new Error('Не удалось создать прицеп');
    return data;
  } catch (error: any) {
    throw new Error(error.message || 'Не удалось создать прицеп');
  }
}

export async function updateTrailer(id: string, trailer: Partial<Trailer>): Promise<Trailer> {
  try {
    const data = await fetchJSON<Trailer>(`/api/trailers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(trailer),
    });
    if (!data) throw new Error('Не удалось обновить прицеп');
    return data;
  } catch (error: any) {
    throw new Error(error.message || 'Не удалось обновить прицеп');
  }
}

export async function deleteTrailer(id: string): Promise<void> {
  try {
    await fetchJSON(`/api/trailers/${id}`, {
      method: 'DELETE',
    });
  } catch (error: any) {
    throw new Error(error.message || 'Не удалось удалить прицеп');
  }
}

// ==================== FLEET ASSIGNMENTS API ====================

export interface FleetAssignment {
  id: string;
  driverId: string;
  truckId: string;
  trailerId: string;
  assignedDate: string;
  driver?: Driver;
  truck?: Truck;
  trailer?: Trailer;
}

export async function fetchAllFleetAssignments(): Promise<FleetAssignment[]> {
  try {
    const data = await fetchJSON<{ assignments: FleetAssignment[] }>('/api/fleet-assignments');
    return data?.assignments || [];
  } catch (error) {
    console.error('Ошибка при загрузке связок:', error);
    return [];
  }
}

export async function fetchFleetAssignmentById(id: string): Promise<FleetAssignment | null> {
  try {
    return await fetchJSON<FleetAssignment>(`/api/fleet-assignments/${id}`);
  } catch {
    return null;
  }
}

export async function createFleetAssignment(
  assignment: Omit<FleetAssignment, 'id'> & { id: string }
): Promise<FleetAssignment> {
  try {
    const data = await fetchJSON<FleetAssignment>('/api/fleet-assignments', {
      method: 'POST',
      body: JSON.stringify(assignment),
    });
    if (!data) throw new Error('Не удалось создать связку');
    return data;
  } catch (error: any) {
    throw new Error(error.message || 'Не удалось создать связку');
  }
}

export async function updateFleetAssignment(
  id: string,
  assignment: Partial<FleetAssignment>
): Promise<FleetAssignment> {
  try {
    const data = await fetchJSON<FleetAssignment>(`/api/fleet-assignments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(assignment),
    });
    if (!data) throw new Error('Не удалось обновить связку');
    return data;
  } catch (error: any) {
    throw new Error(error.message || 'Не удалось обновить связку');
  }
}

export async function deleteFleetAssignment(id: string): Promise<void> {
  try {
    await fetchJSON(`/api/fleet-assignments/${id}`, {
      method: 'DELETE',
    });
  } catch (error: any) {
    throw new Error(error.message || 'Не удалось удалить связку');
  }
}


