import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users,
  Plus,
  Search,
  Edit2,
  Eye,
  Trash2,
  Phone,
  FileText,
  Loader2,
} from 'lucide-react'
import {
  Card,
  CardBody,
  Button,
  Input,
  Select,
  EmptyState,
  Table,
  TableHead,
  TableBody,
  Th,
  Td,
  Alert,
} from '../../components/ui'
import { DriverFormModal } from './DriverFormModal'
import { driversApi } from '../../lib/api'
import {
  DRIVER_STATUS_LABELS,
  DRIVER_STATUS_COLORS,
  formatDate,
  daysUntil,
  isCNHExpiring,
  isCNHExpired,
  cn,
} from '../../lib/utils'
import type { Driver, DriverStatus } from '../../types'

const STATUS_OPTIONS = [
  { value: '', label: 'Todos os status' },
  { value: 'active', label: '🟢 Ativo' },
  { value: 'inactive', label: '⚫ Inativo' },
  { value: 'blocked', label: '🔴 Bloqueado' },
]

export function DriversPage() {
  const navigate = useNavigate()
  const [driversList, setDriversList] = useState<Driver[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null)

  const loadDrivers = useCallback(async () => {
    setLoading(true)
    const data = await driversApi.getAll()
    setDriversList(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    void loadDrivers()
  }, [loadDrivers])

  const handleSaveDriver = async (formData: Partial<Driver>) => {
    if (editingDriver) {
      await driversApi.update(editingDriver.id, formData)
    } else {
      await driversApi.create(formData as Omit<Driver, 'id' | 'created_at' | 'updated_at'>)
    }
    setShowForm(false)
    await loadDrivers()
  }

  const handleDeleteDriver = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (window.confirm('Tem certeza que deseja excluir este motorista?')) {
      await driversApi.delete(id)
      await loadDrivers()
    }
  }

  // Alerts for expiring CNH
  const expiringDrivers = driversList.filter(
    (d) => d.status === 'active' && isCNHExpiring(d.cnh_expiration, 60)
  )

  const drivers = driversList.filter((d) => {
    const q = search.toLowerCase()
    const matchesSearch =
      !q ||
      d.name.toLowerCase().includes(q) ||
      d.cpf.includes(q) ||
      d.cnh.includes(q) ||
      d.phone.includes(q)
    const matchesStatus = !statusFilter || d.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Motoristas</h2>
          <p className="text-sm text-slate-500">{driversList.length} motoristas cadastrados</p>
        </div>
        <Button variant="primary" leftIcon={Plus} onClick={() => { setEditingDriver(null); setShowForm(true) }}>
          Novo Motorista
        </Button>
      </div>

      {/* CNH expiring alert */}
      {expiringDrivers.length > 0 && (
        <Alert type="warning" title={`⚠️ ${expiringDrivers.length} CNH(s) próxima(s) do vencimento`}>
          <ul className="mt-1 space-y-0.5">
            {expiringDrivers.map((d) => {
              const days = daysUntil(d.cnh_expiration)
              const expired = isCNHExpired(d.cnh_expiration)
              return (
                <li key={d.id} className="text-xs">
                  <span className="font-medium">{d.name}</span>
                  {' — '}
                  {expired
                    ? '🔴 CNH VENCIDA'
                    : `vence em ${days} dia${days !== 1 ? 's' : ''} (${formatDate(d.cnh_expiration)})`}
                </li>
              )
            })}
          </ul>
        </Alert>
      )}

      {/* Filters */}
      <Card>
        <CardBody className="py-3">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              placeholder="Buscar por nome, CPF ou CNH..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={Search}
              containerClassName="flex-1"
            />
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={STATUS_OPTIONS}
              containerClassName="sm:w-48"
            />
          </div>
        </CardBody>
      </Card>

      {/* Table */}
      <Card>
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-500">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Carregando motoristas do banco...</span>
          </div>
        ) : drivers.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Nenhum motorista cadastrado"
            description="Cadastre os motoristas da equipe para vinculá-los às viagens e checklists."
            action={
              <Button variant="primary" leftIcon={Plus} onClick={() => { setEditingDriver(null); setShowForm(true) }}>
                Cadastrar Motorista
              </Button>
            }
          />
        ) : (
          <Table>
            <TableHead>
              <tr>
                <Th>Motorista</Th>
                <Th>CNH</Th>
                <Th>Categoria</Th>
                <Th>Validade CNH</Th>
                <Th>Status</Th>
                <Th className="text-right">Ações</Th>
              </tr>
            </TableHead>
            <TableBody>
              {drivers.map((driver) => {
                const status = driver.status as DriverStatus
                const colors = DRIVER_STATUS_COLORS[status] || { dot: 'bg-slate-400', badge: 'bg-slate-100 text-slate-700' }
                const expired = isCNHExpired(driver.cnh_expiration)
                const expiring = isCNHExpiring(driver.cnh_expiration, 60)
                const days = daysUntil(driver.cnh_expiration)

                return (
                  <tr
                    key={driver.id}
                    className="cursor-pointer hover:bg-slate-50"
                    onClick={() => navigate(`/drivers/${driver.id}`)}
                  >
                    <Td>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-600">
                          {driver.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{driver.name}</p>
                          <p className="flex items-center gap-1 text-xs text-slate-500">
                            <Phone className="h-3 w-3" />
                            {driver.phone}
                          </p>
                          {driver.user ? (
                            <span className="inline-flex items-center gap-1 mt-1 rounded bg-indigo-50 px-1.5 py-0.5 text-2xs font-medium text-indigo-700">
                              🔗 {driver.user.email}
                            </span>
                          ) : driver.user_id ? (
                            <span className="inline-flex items-center gap-1 mt-1 rounded bg-indigo-50 px-1.5 py-0.5 text-2xs font-medium text-indigo-700">
                              🔗 Conta vinculada
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </Td>
                    <Td>
                      <div className="flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5 text-slate-400" />
                        <span className="font-mono text-sm">{driver.cnh}</span>
                      </div>
                    </Td>
                    <Td>
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-sm font-bold text-slate-700">
                        {driver.cnh_category}
                      </span>
                    </Td>
                    <Td>
                      <div>
                        <p
                          className={cn(
                            'text-sm font-medium',
                            expired ? 'text-red-600' : expiring ? 'text-yellow-600' : 'text-slate-700'
                          )}
                        >
                          {formatDate(driver.cnh_expiration)}
                        </p>
                        {expired && (
                          <p className="text-xs text-red-500 font-medium">🔴 VENCIDA</p>
                        )}
                        {!expired && expiring && (
                          <p className="text-xs text-yellow-600">⚠️ Vence em {days} dias</p>
                        )}
                      </div>
                    </Td>
                    <Td>
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium',
                          colors.badge
                        )}
                      >
                        <span className={cn('h-1.5 w-1.5 rounded-full', colors.dot)} />
                        {DRIVER_STATUS_LABELS[status]}
                      </span>
                    </Td>
                    <Td className="text-right">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => { setEditingDriver(driver); setShowForm(true) }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => handleDeleteDriver(driver.id, e)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </Td>
                  </tr>
                )
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      {showForm && (
        <DriverFormModal
          driver={editingDriver}
          onClose={() => setShowForm(false)}
          onSave={handleSaveDriver}
        />
      )}
    </div>
  )
}
