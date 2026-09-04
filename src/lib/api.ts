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

  async delete(id: string, cascade = false): Promise<{ error?: string; conflict?: boolean }> {
    if (cascade) {
      try {
        // Desvincular referências cruzadas entre viagens e checklists
        await supabase
          .from('trips')
          .update({ departure_checklist_id: null, return_checklist_id: null })
          .eq('truck_id', id)

        await supabase
          .from('checklists')
          .update({ trip_id: null })
          .eq('truck_id', id)

        // Remover registros dependentes
        await supabase.from('maintenance').delete().eq('truck_id', id)
        await supabase.from('occurrences').delete().eq('truck_id', id)
        await supabase.from('checklists').delete().eq('truck_id', id)
        await supabase.from('trips').delete().eq('truck_id', id)
      } catch (e) {
        console.error('Erro ao limpar dependências do caminhão:', e)
      }
    }

    const { error } = await supabase
      .from('trucks')
      .delete()
      .eq('id', id)

    if (error) {
      const isConflict =
        error.code === '23503' ||
        error.message?.toLowerCase().includes('foreign key') ||
        error.message?.toLowerCase().includes('violates') ||
        error.message?.toLowerCase().includes('referenced')
      return { error: error.message, conflict: isConflict }
    }
    return {}
  },
}

// ============================================================
// DRIVERS API (Supabase Real)
// ============================================================
export const driversApi = {
  async getAll(): Promise<Driver[]> {
    try {
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .order('name', { ascending: true })

      if (error) {
        console.error('Erro ao buscar motoristas:', error.message)
        return []
      }
      return (data as Driver[]) || []
    } catch (err) {
      console.error('Erro inesperado em driversApi.getAll:', err)
      return []
    }
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

  async delete(id: string, cascade = false): Promise<{ error?: string; conflict?: boolean }> {
    if (cascade) {
      try {
        await supabase
          .from('trips')
          .update({ departure_checklist_id: null, return_checklist_id: null })
          .eq('driver_id', id)

        await supabase
          .from('checklists')
          .update({ trip_id: null })
          .eq('driver_id', id)

        await supabase.from('checklists').delete().eq('driver_id', id)
        await supabase.from('trips').delete().eq('driver_id', id)
      } catch (e) {
        console.error('Erro ao limpar dependências do motorista:', e)
      }
    }

    const { error } = await supabase
      .from('drivers')
      .delete()
      .eq('id', id)

    if (error) {
      const isConflict =
        error.code === '23503' ||
        error.message?.toLowerCase().includes('foreign key') ||
        error.message?.toLowerCase().includes('violates') ||
        error.message?.toLowerCase().includes('referenced')
      return { error: error.message, conflict: isConflict }
    }
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
    try {
      // 1. Busca os dados do checklist
      let checklistData: any = null
      const { data: ckl, error: cklError } = await supabase
        .from('checklists')
        .select(`
          *,
          truck:trucks(*),
          driver:drivers(*)
        `)
        .eq('id', id)
        .maybeSingle()

      checklistData = ckl

      if (cklError || !checklistData) {
        // Fallback simples
        const { data: simpleChecklist } = await supabase
          .from('checklists')
          .select('*')
          .eq('id', id)
          .maybeSingle()
        if (!simpleChecklist) return null

        // Carrega caminhão e motorista avulsos
        const [{ data: trk }, { data: drv }] = await Promise.all([
          supabase.from('trucks').select('*').eq('id', simpleChecklist.truck_id).maybeSingle(),
          supabase.from('drivers').select('*').eq('id', simpleChecklist.driver_id).maybeSingle(),
        ])
        checklistData = { ...simpleChecklist, truck: trk, driver: drv }
      }

      // 2. Busca os itens do checklist
      const { data: itemsData } = await supabase
        .from('checklist_items')
        .select('*')
        .eq('checklist_id', id)

      // 3. Busca ocorrências se houver
      const { data: occurrencesData } = await supabase
        .from('occurrences')
        .select('*')
        .eq('checklist_id', id)

      // 4. Busca fotos se houver
      const { data: photosData } = await supabase
        .from('checklist_photos')
        .select('*')
        .eq('checklist_id', id)

      return {
        ...checklistData,
        items: itemsData || [],
        occurrences: occurrencesData || [],
        photos: photosData || [],
      } as Checklist
    } catch (err) {
      console.error('Erro ao buscar checklist por ID:', err)
      return null
    }
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

  async savePhotos(photos: Array<{ checklist_id: string; storage_path?: string; url?: string; description?: string; photo_type?: string }>): Promise<{ error?: string }> {
    if (!photos || photos.length === 0) return {}
    const items = photos.map((p) => ({
      checklist_id: p.checklist_id,
      storage_path: p.storage_path || p.url || '',
      description: p.description || '',
      photo_type: p.photo_type || 'other',
    }))
    const { error } = await supabase
      .from('checklist_photos')
      .insert(items)

    if (error) {
      console.error('Erro ao salvar fotos:', error)
      return { error: error.message }
    }
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
