import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Truck,
  Plus,
  Search,
  Filter,
  Edit2,
  Eye,
  MoreVertical,
  ClipboardList,
  MapPin,
} from 'lucide-react'
import {
  Card,
  CardHeader,
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
  Badge,
  Modal,
} from '../../components/ui'
import { TruckFormModal } from './TruckFormModal'
import { MOCK_TRUCKS } from '../../lib/mock-data'
import {
  TRUCK_STATUS_LABELS,
  TRUCK_STATUS_COLORS,
  formatMileage,
  formatDate,
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
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingTruck, setEditingTruck] = useState<TruckType | null>(null)

  const trucks = MOCK_TRUCKS.filter((t) => {
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
    available: MOCK_TRUCKS.filter((t) => t.status === 'available').length,
    in_route: MOCK_TRUCKS.filter((t) => t.status === 'in_route').length,
    maintenance: MOCK_TRUCKS.filter((t) => t.status === 'maintenance').length,
    blocked: MOCK_TRUCKS.filter((t) => t.status === 'blocked').length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Caminhões</h2>
          <p className="text-sm text-slate-500">{MOCK_TRUCKS.length} veículos cadastrados</p>
        </div>
        <Button variant="primary" leftIcon={Plus} onClick={() => { setEditingTruck(null); setShowForm(true) }}>
          Novo Caminhão
        </Button>
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(Object.entries(counts) as [TruckStatus, number][]).map(([status, count]) => {
          const colors = TRUCK_STATUS_COLORS[status]
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
        {trucks.length === 0 ? (
          <EmptyState
            icon={Truck}
            title="Nenhum caminhão encontrado"
            description="Tente ajustar os filtros ou cadastre um novo caminhão."
            action={
              <Button variant="primary" leftIcon={Plus} onClick={() => setShowForm(true)}>
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
                const colors = TRUCK_STATUS_COLORS[status]
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
          onSave={() => setShowForm(false)}
        />
      )}
    </div>
  )
}
