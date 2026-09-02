// ============================================================
// TIPOS CENTRAIS DO SISTEMA DE FROTA — Shopping das Academias
// ============================================================

// ---- USUÁRIOS / AUTH ----

export type UserRole = 'admin' | 'operator' | 'driver'

export type UserStatus = 'active' | 'inactive' | 'blocked'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  status: UserStatus
  avatar_url?: string
  created_at: string
  updated_at?: string
}

// ---- CAMINHÕES ----

export type TruckStatus = 'available' | 'in_route' | 'maintenance' | 'blocked' | 'inactive'

export interface Truck {
  id: string
  internal_code: string
  plate: string
  brand: string
  model: string
  year: number
  type: string
  capacity?: string
  mileage: number
  status: TruckStatus
  notes?: string
  photo_url?: string
  created_at: string
  updated_at?: string
}

export type TruckStatusLabel = {
  [K in TruckStatus]: string
}

// ---- MOTORISTAS ----

export type DriverStatus = 'active' | 'inactive' | 'blocked'

export type CNHCategory = 'A' | 'B' | 'C' | 'D' | 'E' | 'AB' | 'AC' | 'AD' | 'AE'

export interface Driver {
  id: string
  user_id?: string
  name: string
  cpf: string
  phone: string
  cnh: string
  cnh_category: CNHCategory
  cnh_expiration: string
  status: DriverStatus
  notes?: string
  photo_url?: string
  created_at: string
  updated_at?: string
  user?: User
}

// ---- VIAGENS ----

export type TripStatus = 'planned' | 'released' | 'in_route' | 'returned' | 'cancelled'

export interface Trip {
  id: string
  truck_id: string
  driver_id: string
  departure_checklist_id?: string
  return_checklist_id?: string
  origin: string
  destination: string
  departure_at?: string
  return_at?: string
  departure_mileage?: number
  return_mileage?: number
  estimated_return?: string
  deliveries_completed?: number
  deliveries_pending?: number
  pending_reason?: string
  status: TripStatus
  notes?: string
  created_by: string
  created_at: string
  updated_at?: string
  // Joined
  truck?: Truck
  driver?: Driver
}

// ---- CHECKLISTS ----

export type ChecklistType = 'departure' | 'return'

export type ChecklistStatus =
  | 'draft'
  | 'in_progress'
  | 'completed'
  | 'approved'
  | 'rejected'
  | 'released'

export interface Checklist {
  id: string
  trip_id?: string
  truck_id: string
  driver_id: string
  type: ChecklistType
  status: ChecklistStatus
  started_at: string
  completed_at?: string
  released_at?: string
  mileage: number
  destination?: string
  cargo_volumes?: number
  cargo_notes?: string
  notes?: string
  created_by?: string
  approved_by?: string
  released_by?: string
  release_justification?: string
  driver_signature?: string
  responsible_signature?: string
  responsible_name?: string
  items?: ChecklistItem[]
  occurrences?: Occurrence[]
  photos?: ChecklistPhoto[]
  signatures?: Signature[]
  truck?: Truck
  driver?: Driver
  created_at?: string
}

// ---- ITENS DO CHECKLIST ----

export type CheckItemStatus = 'ok' | 'not_ok' | 'na' | 'pending'

export type ChecklistCategory =
  | 'documentation'
  | 'exterior'
  | 'interior'
  | 'safety'
  | 'cargo'
  | 'return_vehicle'
  | 'return_interior'
  | 'return_cargo'
  | string

export interface ChecklistItem {
  id: string
  checklist_id: string
  category: ChecklistCategory
  item_key: string
  item_label: string
  status: CheckItemStatus
  observation?: string
  is_required: boolean
  created_at?: string
}

// ---- OCORRÊNCIAS ----

export type OccurrenceSeverity = 'low' | 'medium' | 'high' | 'critical'

export type OccurrenceStatus = 'open' | 'in_progress' | 'resolved' | 'sent_to_maintenance'

export interface Occurrence {
  id: string
  checklist_id?: string
  truck_id?: string
  trip_id?: string
  item_key?: string
  category?: string
  severity: OccurrenceSeverity
  description: string
  status: OccurrenceStatus
  resolution?: string
  is_new_at_return?: boolean
  created_at: string
  resolved_at?: string
  resolved_by?: string
  maintenance_id?: string
  photos?: ChecklistPhoto[]
  truck?: Truck
}

// ---- FOTOS ----

export interface ChecklistPhoto {
  id: string
  checklist_id: string
  occurrence_id?: string
  storage_path: string
  url?: string
  description?: string
  photo_type?:
    | 'front'
    | 'rear'
    | 'left'
    | 'right'
    | 'tires'
    | 'cargo'
    | 'panel'
    | 'issue'
    | 'other'
  created_at: string
}

// ---- ASSINATURAS ----

export type SignatureType = 'driver' | 'responsible' | 'manager'

export interface Signature {
  id: string
  checklist_id: string
  user_id?: string
  driver_id?: string
  type: SignatureType
  signer_name: string
  signature_data: string // base64 SVG/PNG
  created_at: string
}

// ---- MANUTENÇÃO ----

export type MaintenanceStatus = 'scheduled' | 'in_progress' | 'completed'

export type MaintenanceType =
  | 'preventive'
  | 'corrective'
  | 'emergency'
  | 'inspection'
  | 'tire'
  | 'electrical'
  | 'mechanical'
  | 'bodywork'
  | 'other'

export interface Maintenance {
  id: string
  truck_id: string
  occurrence_id?: string
  type: MaintenanceType
  description: string
  date: string
  mileage?: number
  cost?: number
  workshop?: string
  parts_used?: string
  status: MaintenanceStatus
  notes?: string
  created_by: string
  created_at: string
  updated_at?: string
  truck?: Truck
}

// ---- AUDITORIA ----

export interface AuditLog {
  id: string
  user_id: string
  user_name: string
  action: string
  resource_type: string
  resource_id: string
  previous_value?: Record<string, unknown>
  new_value?: Record<string, unknown>
  created_at: string
}

// ---- NOTIFICAÇÕES ----

export type NotificationType =
  | 'checklist_pending'
  | 'cnh_expiring'
  | 'critical_occurrence'
  | 'truck_blocked'
  | 'return_pending'
  | 'new_occurrence_at_return'

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  is_read: boolean
  resource_type?: string
  resource_id?: string
  created_at: string
}

// ---- DASHBOARD ----

export interface DashboardStats {
  trucks_available: number
  trucks_in_route: number
  trucks_maintenance: number
  trucks_blocked: number
  checklists_today_departure: number
  checklists_today_return: number
  open_occurrences: number
  critical_occurrences: number
  pending_checklists: number
  trips_active: number
}

export interface RecentActivity {
  id: string
  type:
    | 'checklist_departure'
    | 'checklist_return'
    | 'trip_released'
    | 'occurrence_created'
    | 'maintenance_scheduled'
    | 'truck_status_changed'
  description: string
  truck_plate?: string
  driver_name?: string
  user_name: string
  created_at: string
  status?: string
}

// ---- RELATÓRIOS ----

export interface ReportFilter {
  start_date?: string
  end_date?: string
  truck_id?: string
  driver_id?: string
  status?: string
  type?: string
  occurrence_severity?: OccurrenceSeverity
}

export interface OccurrencesByCategory {
  category: string
  count: number
  percentage: number
}

export interface ChecklistsByDay {
  date: string
  departure: number
  return: number
  total: number
}

// ---- FORM TYPES ----

export interface TruckFormData {
  internal_code: string
  plate: string
  brand: string
  model: string
  year: number
  type: string
  capacity?: string
  mileage: number
  status: TruckStatus
  notes?: string
}

export interface DriverFormData {
  name: string
  cpf: string
  phone: string
  cnh: string
  cnh_category: CNHCategory
  cnh_expiration: string
  status: DriverStatus
  notes?: string
}

export interface ChecklistFormState {
  // Step 1
  truck_id: string
  driver_id: string
  mileage: number
  destination: string
  notes: string
  // Items by category
  items: Record<string, CheckItemStatus>
  item_observations: Record<string, string>
  // Occurrences
  occurrences: Partial<Occurrence>[]
  // Photos
  photos: Partial<ChecklistPhoto>[]
  // Signatures
  driver_signature?: string
  responsible_signature?: string
  responsible_name?: string
  // Cargo specific
  cargo_volumes?: number
  cargo_notes?: string
}

// ---- CHECKLIST ITEM DEFINITIONS ----

export interface ChecklistItemDefinition {
  key: string
  label: string
  category: ChecklistCategory
  is_required: boolean
  is_quick: boolean // belongs to quick checklist
  blocks_release: boolean // if not_ok, blocks release
}

// ---- PAGINATION ----

export interface PaginationState {
  page: number
  per_page: number
  total: number
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: PaginationState
}

// ---- API RESPONSE ----

export interface ApiResponse<T> {
  data?: T
  error?: string
  success: boolean
}
