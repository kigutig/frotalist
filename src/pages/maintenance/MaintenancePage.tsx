import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Wrench, Plus, Search } from 'lucide-react'
import {
  Card, CardBody, Button, Input, Select, EmptyState,
  Table, TableHead, TableBody, Th, Td,
} from '../../components/ui'
import { MaintenanceFormModal } from './MaintenanceFormModal'
import { MOCK_MAINTENANCE } from '../../lib/mock-data'
import {
  MAINTENANCE_STATUS_LABELS, MAINTENANCE_STATUS_COLORS,
  formatDate, formatCurrency, cn,
} from '../../lib/utils'

const STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'scheduled', label: 'Agendada' },
  { value: 'in_progress', label: 'Em Andamento' },
  { value: 'completed', label: 'Concluída' },
]

const TYPE_LABELS: Record<string, string> = {
  preventive: 'Preventiva',
  corrective: 'Corretiva',
  emergency: 'Emergência',
  inspection: 'Inspeção',
  tire: 'Pneus',
  electrical: 'Elétrica',
  mechanical: 'Mecânica',
  bodywork: 'Lataria',
  other: 'Outra',
}

export function MaintenancePage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showForm, setShowForm] = useState(false)

  const items = MOCK_MAINTENANCE.filter((m) => {
    const q = search.toLowerCase()
    const matchesSearch =
      !q ||
      m.truck?.internal_code.toLowerCase().includes(q) ||
      m.description.toLowerCase().includes(q)
    const matchesStatus = !statusFilter || m.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Manutenção</h2>
          <p className="text-sm text-slate-500">{MOCK_MAINTENANCE.length} registros</p>
        </div>
        <Button variant="primary" leftIcon={Plus} onClick={() => setShowForm(true)}>
          Nova Manutenção
        </Button>
      </div>

      <Card>
        <CardBody className="py-3">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              placeholder="Buscar por caminhão ou descrição..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={Search}
              containerClassName="flex-1"
            />
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} options={STATUS_OPTIONS} containerClassName="sm:w-44" />
          </div>
        </CardBody>
      </Card>

      <Card>
        {items.length === 0 ? (
          <EmptyState
            icon={Wrench}
            title="Nenhuma manutenção encontrada"
            action={<Button variant="primary" leftIcon={Plus} onClick={() => setShowForm(true)}>Nova Manutenção</Button>}
          />
        ) : (
          <Table>
            <TableHead>
              <tr>
                <Th>Caminhão</Th>
                <Th>Tipo</Th>
                <Th>Descrição</Th>
                <Th>Data</Th>
                <Th>Custo</Th>
                <Th>Status</Th>
              </tr>
            </TableHead>
            <TableBody>
              {items.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <Td>
                    <p className="font-semibold text-slate-800">{m.truck?.internal_code}</p>
                    <p className="text-xs text-slate-500">{m.truck?.plate}</p>
                  </Td>
                  <Td>
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                      {TYPE_LABELS[m.type] ?? m.type}
                    </span>
                  </Td>
                  <Td>
                    <p className="max-w-xs truncate text-sm text-slate-700">{m.description}</p>
                    {m.workshop && <p className="text-xs text-slate-500">{m.workshop}</p>}
                  </Td>
                  <Td className="text-sm">{formatDate(m.date)}</Td>
                  <Td className="font-mono text-sm">{formatCurrency(m.cost)}</Td>
                  <Td>
                    <span className={cn('inline-flex rounded-full border px-2.5 py-1 text-xs font-medium', MAINTENANCE_STATUS_COLORS[m.status])}>
                      {MAINTENANCE_STATUS_LABELS[m.status]}
                    </span>
                  </Td>
                </tr>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {showForm && (
        <MaintenanceFormModal onClose={() => setShowForm(false)} onSave={() => setShowForm(false)} />
      )}
    </div>
  )
}
