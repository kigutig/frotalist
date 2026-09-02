import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO, differenceInDays, isValid } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type {
  TruckStatus,
  DriverStatus,
  TripStatus,
  ChecklistStatus,
  OccurrenceSeverity,
  OccurrenceStatus,
  MaintenanceStatus,
  CheckItemStatus,
} from '../types'

// ---- CLASSNAME MERGE ----

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ---- DATE FORMATTING ----

export function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '—'
  try {
    const d = parseISO(dateStr)
    if (!isValid(d)) return '—'
    return format(d, 'dd/MM/yyyy', { locale: ptBR })
  } catch {
    return '—'
  }
}

export function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return '—'
  try {
    const d = parseISO(dateStr)
    if (!isValid(d)) return '—'
    return format(d, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
  } catch {
    return '—'
  }
}

export function formatTime(dateStr?: string | null): string {
  if (!dateStr) return '—'
  try {
    const d = parseISO(dateStr)
    if (!isValid(d)) return '—'
    return format(d, 'HH:mm', { locale: ptBR })
  } catch {
    return '—'
  }
}

export function daysUntil(dateStr?: string | null): number | null {
  if (!dateStr) return null
  try {
    const d = parseISO(dateStr)
    if (!isValid(d)) return null
    return differenceInDays(d, new Date())
  } catch {
    return null
  }
}

export function formatRelative(dateStr?: string | null): string {
  if (!dateStr) return '—'
  try {
    const d = parseISO(dateStr)
    if (!isValid(d)) return '—'
    const days = differenceInDays(new Date(), d)
    if (days === 0) return 'Hoje'
    if (days === 1) return 'Ontem'
    if (days < 7) return `${days} dias atrás`
    return format(d, 'dd/MM/yyyy', { locale: ptBR })
  } catch {
    return '—'
  }
}

export function formatMileage(km?: number | null): string {
  if (km == null) return '—'
  return `${km.toLocaleString('pt-BR')} km`
}

export function formatCurrency(value?: number | null): string {
  if (value == null) return '—'
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// ---- STATUS LABELS ----

export const TRUCK_STATUS_LABELS: Record<TruckStatus, string> = {
  available: 'Disponível',
  in_route: 'Em Rota',
  maintenance: 'Em Manutenção',
  blocked: 'Bloqueado',
  inactive: 'Inativo',
}

export const TRUCK_STATUS_COLORS: Record<TruckStatus, { dot: string; badge: string }> = {
  available: { dot: 'bg-green-500', badge: 'bg-green-100 text-green-800 border-green-200' },
  in_route: { dot: 'bg-blue-500', badge: 'bg-blue-100 text-blue-800 border-blue-200' },
  maintenance: { dot: 'bg-yellow-500', badge: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  blocked: { dot: 'bg-red-500', badge: 'bg-red-100 text-red-800 border-red-200' },
  inactive: { dot: 'bg-gray-400', badge: 'bg-gray-100 text-gray-600 border-gray-200' },
}

export const DRIVER_STATUS_LABELS: Record<DriverStatus, string> = {
  active: 'Ativo',
  inactive: 'Inativo',
  blocked: 'Bloqueado',
}

export const DRIVER_STATUS_COLORS: Record<DriverStatus, { dot: string; badge: string }> = {
  active: { dot: 'bg-green-500', badge: 'bg-green-100 text-green-800 border-green-200' },
  inactive: { dot: 'bg-gray-400', badge: 'bg-gray-100 text-gray-600 border-gray-200' },
  blocked: { dot: 'bg-red-500', badge: 'bg-red-100 text-red-800 border-red-200' },
}

export const TRIP_STATUS_LABELS: Record<TripStatus, string> = {
  planned: 'Planejada',
  released: 'Liberada',
  in_route: 'Em Rota',
  returned: 'Retornada',
  cancelled: 'Cancelada',
}

export const TRIP_STATUS_COLORS: Record<TripStatus, string> = {
  planned: 'bg-gray-100 text-gray-700 border-gray-200',
  released: 'bg-blue-100 text-blue-800 border-blue-200',
  in_route: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  returned: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
}

export const CHECKLIST_STATUS_LABELS: Record<ChecklistStatus, string> = {
  draft: 'Rascunho',
  in_progress: 'Em Andamento',
  completed: 'Concluído',
  approved: 'Aprovado',
  rejected: 'Reprovado',
  released: 'Liberado',
}

export const CHECKLIST_STATUS_COLORS: Record<ChecklistStatus, string> = {
  draft: 'bg-gray-100 text-gray-600 border-gray-200',
  in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
  completed: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  approved: 'bg-green-100 text-green-800 border-green-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
  released: 'bg-emerald-100 text-emerald-800 border-emerald-200',
}

export const OCCURRENCE_SEVERITY_LABELS: Record<OccurrenceSeverity, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  critical: 'Crítica',
}

export const OCCURRENCE_SEVERITY_COLORS: Record<OccurrenceSeverity, { badge: string; dot: string }> = {
  low: { badge: 'bg-green-100 text-green-800 border-green-200', dot: 'bg-green-500' },
  medium: { badge: 'bg-yellow-100 text-yellow-800 border-yellow-200', dot: 'bg-yellow-500' },
  high: { badge: 'bg-orange-100 text-orange-800 border-orange-200', dot: 'bg-orange-500' },
  critical: { badge: 'bg-gray-900 text-white border-gray-900', dot: 'bg-gray-900' },
}

export const OCCURRENCE_STATUS_LABELS: Record<OccurrenceStatus, string> = {
  open: 'Aberta',
  in_progress: 'Em Análise',
  resolved: 'Resolvida',
  sent_to_maintenance: 'Enviada p/ Manutenção',
}

export const MAINTENANCE_STATUS_LABELS: Record<MaintenanceStatus, string> = {
  scheduled: 'Agendada',
  in_progress: 'Em Andamento',
  completed: 'Concluída',
}

export const MAINTENANCE_STATUS_COLORS: Record<MaintenanceStatus, string> = {
  scheduled: 'bg-blue-100 text-blue-800 border-blue-200',
  in_progress: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
}

export const CHECK_ITEM_LABELS: Record<CheckItemStatus, string> = {
  ok: 'OK',
  not_ok: 'Não OK',
  na: 'N/A',
  pending: 'Pendente',
}

// ---- MISC ----

export function formatCPF(cpf: string): string {
  return cpf
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

export function formatPhone(phone: string): string {
  return phone
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
}

export function formatPlate(plate: string): string {
  return plate.toUpperCase().trim()
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

export function isCNHExpiring(expirationDate: string, daysThreshold = 30): boolean {
  const days = daysUntil(expirationDate)
  if (days === null) return false
  return days >= 0 && days <= daysThreshold
}

export function isCNHExpired(expirationDate: string): boolean {
  const days = daysUntil(expirationDate)
  if (days === null) return false
  return days < 0
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36)
}

export function truncate(str: string, maxLength = 50): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength) + '...'
}
