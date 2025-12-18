const DEFAULT_API_BASE = 'http://localhost:8080';

// Access env safely to avoid TS typing issues when vite/client types aren't present
const VITE_ENV: any = (import.meta as any)?.env ?? {};
const API_BASE_URL = (VITE_ENV.VITE_API_BASE_URL || DEFAULT_API_BASE).replace(/\/$/, '');

type ApiResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

type EndpointConfig = {
  path: string;
  method?: string;
};

async function requestWithFallback<T>(
  endpoints: EndpointConfig[],
  body?: unknown
): Promise<ApiResult<T>> {
  let lastError = 'Не удалось связаться с сервером';

  for (const endpoint of endpoints) {
    try {
      // Normalize URL to avoid double "/api" (e.g., base ends with /api and path starts with /api)
      const base = API_BASE_URL.replace(/\/$/, '');
      const path =
        /\/api$/i.test(base) && endpoint.path.startsWith('/api/')
          ? endpoint.path.replace(/^\/api(\/|$)/, '/$1').replace(/^\/(?!$)/, '/')
          : endpoint.path;

      const url = `${base}${path}`;

      const response = await fetch(url, {
        method: endpoint.method ?? 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });

      let payload: any = null;
      const text = await response.text();
      if (text) {
        try {
          payload = JSON.parse(text);
        } catch {
          payload = text;
        }
      }

      if (response.status === 404) {
        lastError =
          (typeof payload === 'string' ? payload : payload?.message) ||
          `Endpoint ${path} not found`;
        continue;
      }

      if (!response.ok) {
        return {
          success: false,
          error:
            (typeof payload === 'string' ? payload : payload?.message) ||
            `Ошибка ${response.status}`,
        };
      }

      return { success: true, data: payload ?? undefined };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Ошибка сети',
      };
    }
  }

  return { success: false, error: lastError };
}

export async function createOrderRequest(order: unknown) {
  return requestWithFallback<{ order?: unknown; createdCount?: number }>(
    [
      { path: '/api/orders/create', method: 'POST' },
      { path: '/api/orders', method: 'POST' },
    ],
    order
  );
}

/**
 * Импорт заказа по внешнему номеру.
 * Ожидается, что бэкенд вернет данные заказа, которые можно использовать
 * для предварительного заполнения формы.
 */
export async function importOrderByExternalNumber(externalOrderNumber: string) {
  return requestWithFallback<any>(
    [
      // Основной предполагаемый endpoint
      { path: '/api/orders/import-external', method: 'POST' },
      // Запасной вариант на случай другой конфигурации
      { path: '/api/orders/import', method: 'POST' },
    ],
    { externalOrderNumber }
  );
}

// Cache which endpoint is supported to avoid double requests on every change
type StatusEndpointMode = 'unknown' | 'patch' | 'put';
let STATUS_ENDPOINT_MODE: StatusEndpointMode = 'unknown';

function normalizePath(base: string, path: string) {
  return /\/api$/i.test(base) && path.startsWith('/api/')
    ? path.replace(/^\/api(\/|$)/, '/$1').replace(/^\/(?!$)/, '/')
    : path;
}

async function httpJsonRequest<T>(path: string, method: string, body?: unknown): Promise<{ ok: boolean; status: number; payload: any; result: ApiResult<T> }>{
  const base = API_BASE_URL.replace(/\/$/, '');
  const normalized = normalizePath(base, path);
  const url = `${base}${normalized}`;

  try {
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    const text = await response.text();
    let payload: any = null;
    if (text) {
      try { payload = JSON.parse(text); } catch { payload = text; }
    }

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        payload,
        result: {
          success: false,
          error: (typeof payload === 'string' ? payload : payload?.message) || `Ошибка ${response.status}`,
        },
      };
    }

    return { ok: true, status: response.status, payload, result: { success: true, data: (payload ?? undefined) as T } };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      payload: null,
      result: { success: false, error: error instanceof Error ? error.message : 'Ошибка сети' },
    };
  }
}

export async function updateOrderStatusRequest(orderId: string, status: string) {
  const body = { status };

  if (STATUS_ENDPOINT_MODE === 'patch') {
    return (await httpJsonRequest<{ order?: unknown }>(`/api/orders/${orderId}/status`, 'PATCH', body)).result;
  }
  if (STATUS_ENDPOINT_MODE === 'put') {
    return (await httpJsonRequest<{ order?: unknown }>(`/api/orders/${orderId}`, 'PUT', body)).result;
  }

  // Discover once: try PATCH then fall back to PUT if 404
  const patchAttempt = await httpJsonRequest<{ order?: unknown }>(`/api/orders/${orderId}/status`, 'PATCH', body);
  if (patchAttempt.ok) {
    STATUS_ENDPOINT_MODE = 'patch';
    return patchAttempt.result;
  }
  if (patchAttempt.status === 404) {
    const putAttempt = await httpJsonRequest<{ order?: unknown }>(`/api/orders/${orderId}`, 'PUT', body);
    if (putAttempt.ok) {
      STATUS_ENDPOINT_MODE = 'put';
    }
    return putAttempt.result;
  }
  // Non-404 error from PATCH; return it without trying PUT
  return patchAttempt.result;
}

/**
 * Создание пропуска для заказа
 */
export async function createPassRequest(passData: unknown) {
  return requestWithFallback<{ pass?: unknown; message?: string }>(
    [
      { path: '/api/auth/pass', method: 'POST' },
      { path: '/api/pass', method: 'POST' },
      { path: '/api/passes/create', method: 'POST' },
      { path: '/api/passes', method: 'POST' },
      { path: '/api/orders/pass', method: 'POST' },
    ],
    passData
  );
}

