import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClipboardList, Plus, Search, Filter, Eye, ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import {
  Card, CardBody, Button, Input, Select, EmptyState,
  Table, TableHead, TableBody, Th, Td,
} from '../../components/ui'
import { MOCK_TRUCKS, MOCK_DRIVERS, MOCK_TRIPS } from '../../lib/mock-data'
import { CHECKLIST_STATUS_LABELS, CHECKLIST_STATUS_COLORS, formatDateTime, cn } from '../../lib/utils'

// Mock checklists derived from trips
const MOCK_CHECKLISTS = [
  {
    id: 'ckl1', trip_id: 'trip1', truck_id: 'trk1', driver_id: 'drv1',
    type: 'departure', status: 'released', mileage: 125430,
    destination: 'Shopping das Academias Campinas',
    started_at: '2026-09-02T07:00:00Z', completed_at: '2026-09-02T07:28:00Z',
    created_by: 'u2',
  },
  {
    id: 'ckl2', trip_id: 'trip2', truck_id: 'trk2', driver_id: 'drv2',
    type: 'departure', status: 'released', mileage: 97800,
    destination: 'Filial Rio de Janeiro',
    started_at: '2026-09-01T05:30:00Z', completed_at: '2026-09-01T05:55:00Z',
    created_by: 'u2',
  },
  {
    id: 'ckl3', trip_id: 'trip2', truck_id: 'trk2', driver_id: 'drv2',
    type: 'return', status: 'completed', mileage: 98200,
    destination: 'Depósito Central',
    started_at: '2026-09-01T20:30:00Z', completed_at: '2026-09-01T20:50:00Z',
    created_by: 'u2',
  },
  {
    id: 'ckl4', trip_id: null, truck_id: 'trk5', driver_id: 'drv4',
    type: 'departure', status: 'rejected', mileage: 312800,
    destination: 'Filial Curitiba',
    started_at: '2026-08-30T08:00:00Z', completed_at: '2026-08-30T09:00:00Z',
    created_by: 'u2',
  },
]

const TYPE_OPTIONS = [
  { value: '', label: 'Todos os tipos' },
  { value: 'departure', label: '↑ Saída' },
  { value: 'return', label: '↓ Retorno' },
]

const STATUS_OPTIONS = [
  { value: '', label: 'Todos os status' },
  { value: 'draft', label: 'Rascunho' },
  { value: 'in_progress', label: 'Em Andamento' },
  { value: 'completed', label: 'Concluído' },
  { value: 'released', label: 'Liberado' },
  { value: 'rejected', label: 'Reprovado' },
]

export function ChecklistsPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const checklists = MOCK_CHECKLISTS.filter((c) => {
    const truck = MOCK_TRUCKS.find((t) => t.id === c.truck_id)
    const driver = MOCK_DRIVERS.find((d) => d.id === c.driver_id)
    const q = search.toLowerCase()
    const matchesSearch =
      !q ||
      truck?.internal_code.toLowerCase().includes(q) ||
      truck?.plate.toLowerCase().includes(q) ||
      driver?.name.toLowerCase().includes(q) ||
      c.destination.toLowerCase().includes(q)
    const matchesType = !typeFilter || c.type === typeFilter
    const matchesStatus = !statusFilter || c.status === statusFilter
    return matchesSearch && matchesType && matchesStatus
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Checklists</h2>
          <p className="text-sm text-slate-500">{MOCK_CHECKLISTS.length} checklists registrados</p>
        </div>
        <Button variant="primary" leftIcon={Plus} onClick={() => navigate('/checklists/new')}>
          Novo Checklist de Saída
        </Button>
      </div>

      <Card>
        <CardBody className="py-3">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              placeholder="Buscar por caminhão, motorista ou destino..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={Search}
              containerClassName="flex-1"
            />
            <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} options={TYPE_OPTIONS} containerClassName="sm:w-40" />
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} options={STATUS_OPTIONS} containerClassName="sm:w-40" />
          </div>
        </CardBody>
      </Card>

      <Card>
        {checklists.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="Nenhum checklist encontrado"
            action={<Button variant="primary" leftIcon={Plus} onClick={() => navigate('/checklists/new')}>Novo Checklist</Button>}
          />
        ) : (
          <Table>
            <TableHead>
              <tr>
                <Th>Tipo</Th>
                <Th>Caminhão</Th>
                <Th>Motorista</Th>
                <Th>Destino</Th>
                <Th>Data</Th>
                <Th>Status</Th>
                <Th className="text-right">Ações</Th>
              </tr>
            </TableHead>
            <TableBody>
              {checklists.map((c) => {
                const truck = MOCK_TRUCKS.find((t) => t.id === c.truck_id)
                const driver = MOCK_DRIVERS.find((d) => d.id === c.driver_id)
                const statusClass = CHECKLIST_STATUS_COLORS[c.status as keyof typeof CHECKLIST_STATUS_COLORS]

                return (
                  <tr key={c.id} className="cursor-pointer hover:bg-slate-50" onClick={() => navigate(`/checklists/${c.id}`)}>
                    <Td>
                      <div className={cn('flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium w-fit',
                        c.type === 'departure' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                      )}>
                        {c.type === 'departure' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownLeft className="h-3 w-3" />}
                        {c.type === 'departure' ? 'Saída' : 'Retorno'}
                      </div>
                    </Td>
                    <Td>
                      <p className="font-semibold text-slate-800">{truck?.internal_code}</p>
                      <p className="text-xs text-slate-500">{truck?.plate}</p>
                    </Td>
                    <Td>{driver?.name ?? '—'}</Td>
                    <Td className="max-w-[160px] truncate">{c.destination}</Td>
                    <Td className="text-sm">{formatDateTime(c.started_at)}</Td>
                    <Td>
                      <span className={cn('inline-flex rounded-full border px-2.5 py-1 text-xs font-medium', statusClass)}>
                        {CHECKLIST_STATUS_LABELS[c.status as keyof typeof CHECKLIST_STATUS_LABELS]}
                      </span>
                    </Td>
                    <Td className="text-right">
                      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); navigate(`/checklists/${c.id}`) }}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Td>
                  </tr>
                )
              })}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  )
}
