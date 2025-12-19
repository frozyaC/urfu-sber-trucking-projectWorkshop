import type { CSSProperties } from 'react';

type OrderStatus = 'Ожидает' | 'Назначен' | 'В пути' | 'Доставлен' | 'Отменен';

type StatusStyle = CSSProperties;

const STATUS_STYLES: Record<OrderStatus, StatusStyle> = {
  'Ожидает': {
    backgroundColor: '#fee2e2',
    color: '#b91c1c',
    borderColor: '#fecaca'
  },
  'Назначен': {
    backgroundColor: '#ffedd5',
    color: '#c2410c',
    borderColor: '#fed7aa'
  },
  'В пути': {
    backgroundColor: '#dcfce7',
    color: '#15803d',
    borderColor: '#bbf7d0'
  },
  'Доставлен': {
    backgroundColor: '#cffafe',
    color: '#0f766e',
    borderColor: '#a5f3fc'
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

