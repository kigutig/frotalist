import { supabase } from './supabase'
import type {
  Truck,
  Driver,
  Trip,
  Checklist,
  ChecklistItem,
  Occurrence,
  Maintenance,
  User,
  UserRole,
} from '../types'

// ============================================================
// USERS API (Supabase Real)
// ============================================================
export const usersApi = {
  async getAll(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      console.error('Erro ao buscar usuários:', error)
      return []
    }
    return (data as User[]) || []
  },

  async updateRole(userId: string, role: UserRole): Promise<{ error?: string }> {
    const { error } = await supabase
      .from('users')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', userId)

    if (error) return { error: error.message }
    return {}
  },

  async updateStatus(userId: string, status: 'active' | 'inactive' | 'blocked'): Promise<{ error?: string }> {
    const { error } = await supabase
      .from('users')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', userId)

    if (error) return { error: error.message }
    return {}
  },
}

// ============================================================
// TRUCKS API (Supabase Real)
// ============================================================
export const trucksApi = {
  async getAll(): Promise<Truck[]> {
    const { data, error } = await supabase
      .from('trucks')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar caminhões:', error)
      return []
    }
    return (data as Truck[]) || []
  },

  async getById(id: string): Promise<Truck | null> {
    const { data, error } = await supabase
      .from('trucks')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) return null
    return data as Truck
  },

  async create(truck: Omit<Truck, 'id' | 'created_at' | 'updated_at'>): Promise<{ data?: Truck; error?: string }> {
    const { data, error } = await supabase
      .from('trucks')
      .insert([truck])
      .select()
      .single()

    if (error) return { error: error.message }
    return { data: data as Truck }
  },

  async update(id: string, truck: Partial<Truck>): Promise<{ data?: Truck; error?: string }> {
    const { data, error } = await supabase
      .from('trucks')
      .update(truck)
      .eq('id', id)
      .select()
      .single()

    if (error) return { error: error.message }
    return { data: data as Truck }
  },

  async delete(id: string): Promise<{ error?: string }> {
    const { error } = await supabase
      .from('trucks')
      .delete()
      .eq('id', id)

    if (error) return { error: error.message }
    return {}
  },
}

// ============================================================
// DRIVERS API (Supabase Real)
// ============================================================
export const driversApi = {
  async getAll(): Promise<Driver[]> {
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      console.error('Erro ao buscar motoristas:', error)
      return []
    }
    return (data as Driver[]) || []
  },

  async getById(id: string): Promise<Driver | null> {
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) return null
    return data as Driver
  },

  async create(driver: Omit<Driver, 'id' | 'created_at' | 'updated_at'>): Promise<{ data?: Driver; error?: string }> {
    const { data, error } = await supabase
      .from('drivers')
      .insert([driver])
      .select()
      .single()

    if (error) return { error: error.message }
    return { data: data as Driver }
  },

  async update(id: string, driver: Partial<Driver>): Promise<{ data?: Driver; error?: string }> {
    const { data, error } = await supabase
      .from('drivers')
      .update(driver)
      .eq('id', id)
      .select()
      .single()

    if (error) return { error: error.message }
    return { data: data as Driver }
  },

  async delete(id: string): Promise<{ error?: string }> {
    const { error } = await supabase
      .from('drivers')
      .delete()
      .eq('id', id)

    if (error) return { error: error.message }
    return {}
  },
}

// ============================================================
// CHECKLISTS API (Supabase Real)
// ============================================================
export const checklistsApi = {
  async getAll(): Promise<Checklist[]> {
    const { data, error } = await supabase
      .from('checklists')
      .select(`
        *,
        truck:trucks(*),
        driver:drivers(*)
      `)
      .order('started_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar checklists:', error)
      return []
    }
    return (data as Checklist[]) || []
  },

  async getById(id: string): Promise<Checklist | null> {
    const { data, error } = await supabase
      .from('checklists')
      .select(`
        *,
        truck:trucks(*),
        driver:drivers(*),
        items:checklist_items(*),
        occurrences:occurrences(*),
        photos:checklist_photos(*)
      `)
      .eq('id', id)
      .single()

    if (error || !data) return null
    return data as Checklist
  },

  async create(checklist: Partial<Checklist>): Promise<{ data?: Checklist; error?: string }> {
    const { data, error } = await supabase
      .from('checklists')
      .insert([checklist])
      .select()
      .single()

    if (error) return { error: error.message }
    return { data: data as Checklist }
  },

  async saveItems(items: Omit<ChecklistItem, 'id' | 'created_at'>[]): Promise<{ error?: string }> {
    const { error } = await supabase
      .from('checklist_items')
      .insert(items)

    if (error) return { error: error.message }
    return {}
  },
}

// ============================================================
// TRIPS API (Supabase Real)
// ============================================================
export const tripsApi = {
  async getAll(): Promise<Trip[]> {
    const { data, error } = await supabase
      .from('trips')
      .select(`
        *,
        truck:trucks(*),
        driver:drivers(*)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar viagens:', error)
      return []
    }
    return (data as Trip[]) || []
  },

  async create(trip: Partial<Trip>): Promise<{ data?: Trip; error?: string }> {
    const { data, error } = await supabase
      .from('trips')
      .insert([trip])
      .select()
      .single()

    if (error) return { error: error.message }
    return { data: data as Trip }
  },

  async update(id: string, trip: Partial<Trip>): Promise<{ data?: Trip; error?: string }> {
    const { data, error } = await supabase
      .from('trips')
      .update(trip)
      .eq('id', id)
      .select()
      .single()

    if (error) return { error: error.message }
    return { data: data as Trip }
  },
}

// ============================================================
// OCCURRENCES API (Supabase Real)
// ============================================================
export const occurrencesApi = {
  async getAll(): Promise<Occurrence[]> {
    const { data, error } = await supabase
      .from('occurrences')
      .select(`
        *,
        truck:trucks(*)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar ocorrências:', error)
      return []
    }
    return (data as Occurrence[]) || []
  },

  async create(occurrence: Partial<Occurrence>): Promise<{ data?: Occurrence; error?: string }> {
    const { data, error } = await supabase
      .from('occurrences')
      .insert([occurrence])
      .select()
      .single()

    if (error) return { error: error.message }
    return { data: data as Occurrence }
  },

  async update(id: string, occurrence: Partial<Occurrence>): Promise<{ data?: Occurrence; error?: string }> {
    const { data, error } = await supabase
      .from('occurrences')
      .update(occurrence)
      .eq('id', id)
      .select()
      .single()

    if (error) return { error: error.message }
    return { data: data as Occurrence }
  },
}

// ============================================================
// MAINTENANCE API (Supabase Real)
// ============================================================
export const maintenanceApi = {
  async getAll(): Promise<Maintenance[]> {
    const { data, error } = await supabase
      .from('maintenance')
      .select(`
        *,
        truck:trucks(*)
      `)
      .order('date', { ascending: false })

    if (error) {
      console.error('Erro ao buscar manutenções:', error)
      return []
    }
    return (data as Maintenance[]) || []
  },

  async create(maintenance: Partial<Maintenance>): Promise<{ data?: Maintenance; error?: string }> {
    const { data, error } = await supabase
      .from('maintenance')
      .insert([maintenance])
      .select()
      .single()

    if (error) return { error: error.message }
    return { data: data as Maintenance }
  },
}
