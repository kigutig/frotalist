import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClipboardList, Plus, Search, Eye, ArrowUpRight, ArrowDownLeft, Loader2, Truck, User } from 'lucide-react'
import {
  Card, CardBody, Button, Input, Select, EmptyState,
  Table, TableHead, TableBody, Th, Td, ActionMenu,
} from '../../components/ui'
import { checklistsApi } from '../../lib/api'
import { CHECKLIST_STATUS_LABELS, CHECKLIST_STATUS_COLORS, formatDateTime, cn } from '../../lib/utils'
import type { Checklist } from '../../types'

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
  const [checklistsList, setChecklistsList] = useState<Checklist[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const loadChecklists = useCallback(async () => {
    setLoading(true)
    const data = await checklistsApi.getAll()
    setChecklistsList(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    void loadChecklists()
  }, [loadChecklists])

  const checklists = checklistsList.filter((c) => {
    const q = search.toLowerCase()
    const matchesSearch =
      !q ||
      c.truck?.internal_code.toLowerCase().includes(q) ||
      c.truck?.plate.toLowerCase().includes(q) ||
      c.driver?.name.toLowerCase().includes(q) ||
      (c.destination && c.destination.toLowerCase().includes(q))
    const matchesType = !typeFilter || c.type === typeFilter
    const matchesStatus = !statusFilter || c.status === statusFilter
    return matchesSearch && matchesType && matchesStatus
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Checklists</h2>
          <p className="text-sm text-slate-500">{checklistsList.length} checklists registrados</p>
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
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-500">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Carregando checklists...</span>
          </div>
        ) : checklists.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="Nenhum checklist registrado"
            description="Todos os checklists de saída e retorno realizados aparecerão aqui."
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
                const statusClass = CHECKLIST_STATUS_COLORS[c.status] || 'bg-slate-100 text-slate-700'

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
                      <p className="font-semibold text-slate-800">{c.truck?.internal_code || '—'}</p>
                      <p className="text-xs text-slate-500">{c.truck?.plate}</p>
                    </Td>
                    <Td>{c.driver?.name ?? '—'}</Td>
                    <Td className="max-w-[160px] truncate">{c.destination || '—'}</Td>
                    <Td className="text-sm">{formatDateTime(c.started_at)}</Td>
                    <Td>
                      <span className={cn('inline-flex rounded-full border px-2.5 py-1 text-xs font-medium', statusClass)}>
                        {CHECKLIST_STATUS_LABELS[c.status] || c.status}
                      </span>
                    </Td>
                    <Td className="text-right">
                      <ActionMenu
                        items={[
                          {
                            label: 'Ver detalhes',
                            icon: Eye,
                            onClick: () => navigate(`/checklists/${c.id}`),
                          },
                          {
                            label: 'Ver Caminhão',
                            icon: Truck,
                            hidden: !c.truck_id,
                            onClick: () => navigate(`/trucks/${c.truck_id}`),
                          },
                          {
                            label: 'Ver Motorista',
                            icon: User,
                            hidden: !c.driver_id,
                            onClick: () => navigate(`/drivers/${c.driver_id}`),
                          },
                          {
                            label: 'Novo Checklist',
                            icon: Plus,
                            onClick: () => navigate(c.truck_id ? `/checklists/new?truck=${c.truck_id}` : '/checklists/new'),
                          },
                        ]}
                      />
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
