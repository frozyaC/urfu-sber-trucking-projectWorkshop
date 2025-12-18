/**
 * API для загрузки всех данных системы из backend
 */

const DEFAULT_API_BASE = 'http://localhost:8080';
const VITE_ENV: any = (import.meta as any)?.env ?? {};
const API_BASE_URL = (VITE_ENV.VITE_API_BASE_URL || DEFAULT_API_BASE).replace(/\/$/, '');

async function fetchJSON<T>(endpoint: string): Promise<T | null> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`);
    if (!response.ok) {
      console.error(`Ошибка загрузки ${endpoint}:`, response.statusText);
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error(`Ошибка сети при загрузке ${endpoint}:`, error);
    return null;
  }
}

export async function fetchAllOrders() {
  const data = await fetchJSON<{ orders: any[] }>('/api/orders');
  return data?.orders || [];
}

export async function fetchAllDrivers() {
  const data = await fetchJSON<{ drivers: any[] }>('/api/drivers');
  return data?.drivers || [];
}

export async function fetchAllTrucks() {
  const data = await fetchJSON<{ trucks: any[] }>('/api/trucks');
  return data?.trucks || [];
}

export async function fetchAllTrailers() {
  const data = await fetchJSON<{ trailers: any[] }>('/api/trailers');
  return data?.trailers || [];
}

export async function fetchAllFleetAssignments() {
  const data = await fetchJSON<{ assignments: any[] }>('/api/fleet-assignments');
  return data?.assignments || [];
}
