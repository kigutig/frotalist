import { driversApi } from './api'
import type { Driver } from '../types'

const LOCAL_STORAGE_PREFIX = 'driver_pwd_hash_'

/**
 * Gera o hash criptográfico SHA-256 da senha em hexadecimal.
 */
export async function hashDriverPassword(password: string): Promise<string> {
  const cleanPassword = password.trim()
  if (!cleanPassword) return ''

  const encoder = new TextEncoder()
  const data = encoder.encode(cleanPassword)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Obtém o hash da senha do motorista (do registro do banco ou cache local).
 */
export function getDriverPasswordHash(driver: Driver | null | undefined): string | null {
  if (!driver) return null

  if (driver.password_hash && driver.password_hash.trim().length > 0) {
    return driver.password_hash.trim()
  }

  try {
    const localHash = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}${driver.id}`)
    if (localHash && localHash.trim().length > 0) {
      return localHash.trim()
    }
  } catch {
    // ignore localStorage unavailability
  }

  return null
}

/**
 * Verifica se o motorista possui uma senha configurada.
 */
export function hasDriverPassword(driver: Driver | null | undefined): boolean {
  return Boolean(getDriverPasswordHash(driver))
}

/**
 * Compara a senha digitada com a senha configurada para o motorista.
 */
export async function verifyDriverPassword(driver: Driver, inputPassword: string): Promise<boolean> {
  const currentHash = getDriverPasswordHash(driver)
  if (!currentHash) return false

  const inputHash = await hashDriverPassword(inputPassword)
  return inputHash === currentHash
}

/**
 * Salva a senha própria do motorista tanto no Supabase quanto no localStorage (resiliência offline).
 */
export async function saveDriverPassword(
  driverId: string,
  password: string
): Promise<{ success: boolean; hash: string; error?: string }> {
  try {
    const hash = await hashDriverPassword(password)
    if (!hash) {
      return { success: false, hash: '', error: 'Senha não pode ser vazia' }
    }

    // Salva no localStorage como fallback imediato
    try {
      localStorage.setItem(`${LOCAL_STORAGE_PREFIX}${driverId}`, hash)
    } catch {
      // ignore
    }

    // Atualiza no Supabase
    const { error } = await driversApi.update(driverId, { password_hash: hash })
    if (error) {
      console.warn('Aviso: Não foi possível salvar hash no Supabase (usando fallback local):', error)
    }

    return { success: true, hash }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Erro ao salvar senha'
    return { success: false, hash: '', error: errorMsg }
  }
}

/**
 * Remove a senha do motorista (útil para reset de senha por administrador).
 */
export async function clearDriverPassword(driverId: string): Promise<{ success: boolean }> {
  try {
    localStorage.removeItem(`${LOCAL_STORAGE_PREFIX}${driverId}`)
    await driversApi.update(driverId, { password_hash: undefined })
    return { success: true }
  } catch {
    return { success: false }
  }
}
