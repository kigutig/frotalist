import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Truck,
  Plus,
  Search,
  Edit2,
  Eye,
  ClipboardList,
  Loader2,
  Trash2,
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
} from '../../components/ui'
import { TruckFormModal } from './TruckFormModal'
import { trucksApi } from '../../lib/api'
import {
  TRUCK_STATUS_LABELS,
  TRUCK_STATUS_COLORS,
  formatMileage,
  cn,
} from '../../lib/utils'
import type { Truck as TruckType, TruckStatus } from '../../types'

const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'Todos os status' },
  { value: 'available', label: '🟢 Disponível' },
  { value: 'in_route', label: '🔵 Em Rota' },
  { value: 'maintenance', label: '🟡 Em Manutenção' },
  { value: 'blocked', label: '🔴 Bloqueado' },
  { value: 'inactive', label: '⚫ Inativo' },
]

export function TrucksPage() {
  const navigate = useNavigate()
  const [trucksList, setTrucksList] = useState<TruckType[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingTruck, setEditingTruck] = useState<TruckType | null>(null)

  const loadTrucks = useCallback(async () => {
    setLoading(true)
    const data = await trucksApi.getAll()
    setTrucksList(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    void loadTrucks()
  }, [loadTrucks])

  const handleSaveTruck = async (formData: Partial<TruckType>) => {
    if (editingTruck) {
      await trucksApi.update(editingTruck.id, formData)
    } else {
      await trucksApi.create(formData as Omit<TruckType, 'id' | 'created_at' | 'updated_at'>)
    }
    setShowForm(false)
    await loadTrucks()
  }

  const handleDeleteTruck = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (window.confirm('Tem certeza que deseja excluir este caminhão?')) {
      await trucksApi.delete(id)
      await loadTrucks()
    }
  }

  const trucks = trucksList.filter((t) => {
    const q = search.toLowerCase()
    const matchesSearch =
      !q ||
      t.internal_code.toLowerCase().includes(q) ||
      t.plate.toLowerCase().includes(q) ||
      t.brand.toLowerCase().includes(q) ||
      t.model.toLowerCase().includes(q)
    const matchesStatus = !statusFilter || t.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Summary counts
  const counts = {
    available: trucksList.filter((t) => t.status === 'available').length,
    in_route: trucksList.filter((t) => t.status === 'in_route').length,
    maintenance: trucksList.filter((t) => t.status === 'maintenance').length,
    blocked: trucksList.filter((t) => t.status === 'blocked').length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Caminhões</h2>
          <p className="text-sm text-slate-500">{trucksList.length} veículos cadastrados</p>
        </div>
        <Button variant="primary" leftIcon={Plus} onClick={() => { setEditingTruck(null); setShowForm(true) }}>
          Novo Caminhão
        </Button>
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(Object.entries(counts) as [TruckStatus, number][]).map(([status, count]) => {
          const colors = TRUCK_STATUS_COLORS[status] || { dot: 'bg-slate-400', badge: 'bg-slate-100' }
          return (
            <button
              key={status}
              onClick={() => setStatusFilter(statusFilter === status ? '' : status)}
              className={cn(
                'rounded-xl border p-4 text-left transition-all',
                statusFilter === status
                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              )}
            >
              <div className="flex items-center gap-2">
                <span className={cn('h-2.5 w-2.5 rounded-full', colors.dot)} />
                <span className="text-xs font-medium text-slate-600">{TRUCK_STATUS_LABELS[status]}</span>
              </div>
              <p className="mt-1 text-2xl font-bold text-slate-800">{count}</p>
            </button>
          )
        })}
      </div>

      {/* Filters */}
      <Card>
        <CardBody className="py-3">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              placeholder="Buscar por placa, código ou modelo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={Search}
              containerClassName="flex-1"
            />
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={STATUS_FILTER_OPTIONS}
              containerClassName="sm:w-52"
            />
          </div>
        </CardBody>
      </Card>

      {/* Table */}
      <Card>
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-500">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Carregando caminhões do banco...</span>
          </div>
        ) : trucks.length === 0 ? (
          <EmptyState
            icon={Truck}
            title="Nenhum caminhão cadastrado"
            description="Cadastre o primeiro caminhão da frota para iniciar os controles de checklist e viagens."
            action={
              <Button variant="primary" leftIcon={Plus} onClick={() => { setEditingTruck(null); setShowForm(true) }}>
                Cadastrar Caminhão
              </Button>
            }
          />
        ) : (
          <Table>
            <TableHead>
              <tr>
                <Th>Código / Placa</Th>
                <Th>Veículo</Th>
                <Th>Ano</Th>
                <Th>Quilometragem</Th>
                <Th>Status</Th>
                <Th className="text-right">Ações</Th>
              </tr>
            </TableHead>
            <TableBody>
              {trucks.map((truck) => {
                const status = truck.status as TruckStatus
                const colors = TRUCK_STATUS_COLORS[status] || { dot: 'bg-slate-400', badge: 'bg-slate-100 text-slate-700' }
                return (
                  <tr
                    key={truck.id}
                    className="cursor-pointer hover:bg-slate-50"
                    onClick={() => navigate(`/trucks/${truck.id}`)}
                  >
                    <Td>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                          <Truck className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{truck.internal_code}</p>
                          <p className="text-xs text-slate-500">{truck.plate}</p>
                        </div>
                      </div>
                    </Td>
                    <Td>
                      <p className="font-medium text-slate-700">{truck.brand} {truck.model}</p>
                      <p className="text-xs text-slate-500">{truck.type} · {truck.capacity}</p>
                    </Td>
                    <Td>{truck.year}</Td>
                    <Td>
                      <span className="font-mono text-sm">{formatMileage(truck.mileage)}</span>
                    </Td>
                    <Td>
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium',
                          colors.badge
                        )}
                      >
                        <span className={cn('h-1.5 w-1.5 rounded-full', colors.dot)} />
                        {TRUCK_STATUS_LABELS[status]}
                      </span>
                    </Td>
                    <Td className="text-right">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="sm"
                          leftIcon={ClipboardList}
                          onClick={() => navigate(`/checklists/new?truck=${truck.id}`)}
                        >
                          Checklist
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/trucks/${truck.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => { setEditingTruck(truck); setShowForm(true) }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => handleDeleteTruck(truck.id, e)}
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

      {/* Form Modal */}
      {showForm && (
        <TruckFormModal
          truck={editingTruck}
          onClose={() => setShowForm(false)}
          onSave={handleSaveTruck}
        />
      )}
    </div>
  )
}
