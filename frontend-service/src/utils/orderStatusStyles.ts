import type { CSSProperties } from 'react';

type OrderStatus = 'Создан' | 'На погрузке' | 'В пути' | 'На выгрузке' | 'Завершен' | 'Отменен';

type StatusStyle = CSSProperties;

const STATUS_STYLES: Record<OrderStatus, StatusStyle> = {
  'Создан': {
    backgroundColor: '#e5e7eb',
    color: '#111827',
    borderColor: '#d1d5db'
  },
  'На погрузке': {
    backgroundColor: '#ffedd5',
    color: '#c2410c',
    borderColor: '#fed7aa'
  },
  'В пути': {
    backgroundColor: '#dcfce7',
    color: '#15803d',
    borderColor: '#bbf7d0'
  },
  'На выгрузке': {
    backgroundColor: '#e0f2fe',
    color: '#075985',
    borderColor: '#bae6fd'
  },
  'Завершен': {
    backgroundColor: '#ede9fe',
    color: '#5b21b6',
    borderColor: '#ddd6fe'
  },
  'Отменен': {
    backgroundColor: '#1f2937',
    color: '#ffffff',
    borderColor: '#374151'
  }
};

const DEFAULT_STATUS_STYLE: StatusStyle = {
  backgroundColor: '#f3f4f6',
  color: '#111827',
  borderColor: '#e5e7eb'
};

export const SUPPORTED_ORDER_STATUSES = Object.keys(STATUS_STYLES) as OrderStatus[];

export function getOrderStatusStyle(status: string): StatusStyle {
  return STATUS_STYLES[status as OrderStatus] ?? DEFAULT_STATUS_STYLE;
}

