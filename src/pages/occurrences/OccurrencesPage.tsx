import { useState, useEffect, useCallback } from 'react'
import { AlertTriangle, Search, CheckCircle2, Loader2 } from 'lucide-react'
import {
  Card, CardBody, Button, Input, Select, EmptyState,
  Table, TableHead, TableBody, Th, Td,
} from '../../components/ui'
import { occurrencesApi } from '../../lib/api'
import {
  OCCURRENCE_SEVERITY_LABELS, OCCURRENCE_SEVERITY_COLORS,
  OCCURRENCE_STATUS_LABELS, formatDateTime, cn,
} from '../../lib/utils'
import type { Occurrence, OccurrenceSeverity } from '../../types'

const SEVERITY_OPTIONS = [
  { value: '', label: 'Todas as gravidades' },
  { value: 'low', label: '🟢 Baixa' },
  { value: 'medium', label: '🟡 Média' },
  { value: 'high', label: '🔴 Alta' },
  { value: 'critical', label: '⚫ Crítica' },
]

const STATUS_OPTIONS = [
  { value: '', label: 'Todos os status' },
  { value: 'open', label: 'Aberta' },
  { value: 'in_progress', label: 'Em Análise' },
  { value: 'resolved', label: 'Resolvida' },
  { value: 'sent_to_maintenance', label: 'Manutenção' },
]

export function OccurrencesPage() {
  const [occurrencesList, setOccurrencesList] = useState<Occurrence[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [severityFilter, setSeverityFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const loadOccurrences = useCallback(async () => {
    setLoading(true)
    const data = await occurrencesApi.getAll()
    setOccurrencesList(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    void loadOccurrences()
  }, [loadOccurrences])

  const handleResolve = async (id: string) => {
    await occurrencesApi.update(id, { status: 'resolved', resolved_at: new Date().toISOString() })
    await loadOccurrences()
  }

  const occurrences = occurrencesList.filter((o) => {
    const q = search.toLowerCase()
    const matchesSearch =
      !q ||
      o.truck?.internal_code?.toLowerCase().includes(q) ||
      o.description?.toLowerCase().includes(q)
    const matchesSeverity = !severityFilter || o.severity === severityFilter
    const matchesStatus = !statusFilter || o.status === statusFilter
    return matchesSearch && matchesSeverity && matchesStatus
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Ocorrências</h2>
        <p className="text-sm text-slate-500">{occurrencesList.length} ocorrências registradas</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(['low', 'medium', 'high', 'critical'] as OccurrenceSeverity[]).map((sev) => {
          const count = occurrencesList.filter((o) => o.severity === sev).length
          const colors = OCCURRENCE_SEVERITY_COLORS[sev] || { badge: 'bg-slate-100 text-slate-700' }
          return (
            <div key={sev} className={cn('rounded-xl border px-4 py-3', colors.badge)}>
              <p className="text-2xl font-bold">{count}</p>
              <p className="text-xs font-medium">{OCCURRENCE_SEVERITY_LABELS[sev]}</p>
            </div>
          )
        })}
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
            <Select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)} options={SEVERITY_OPTIONS} containerClassName="sm:w-44" />
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} options={STATUS_OPTIONS} containerClassName="sm:w-44" />
          </div>
        </CardBody>
      </Card>

      <Card>
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-500">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Carregando ocorrências...</span>
          </div>
        ) : occurrences.length === 0 ? (
          <EmptyState
            icon={AlertTriangle}
            title="Nenhuma ocorrência registrada"
            description="As ocorrências são registradas automaticamente durante as verificações de checklist quando algum item estiver com avaria ou Não OK."
          />
        ) : (
          <Table>
            <TableHead>
              <tr>
                <Th>Caminhão</Th>
                <Th>Gravidade</Th>
                <Th>Descrição</Th>
                <Th>Status</Th>
                <Th>Data</Th>
                <Th className="text-right">Ações</Th>
              </tr>
            </TableHead>
            <TableBody>
              {occurrences.map((occ) => {
                const sev = occ.severity as OccurrenceSeverity
                const sevColors = OCCURRENCE_SEVERITY_COLORS[sev] || { badge: 'bg-slate-100 text-slate-700', dot: 'bg-slate-400' }
                return (
                  <tr key={occ.id} className="hover:bg-slate-50">
                    <Td>
                      <p className="font-semibold text-slate-800">{occ.truck?.internal_code || '—'}</p>
                      <p className="text-xs text-slate-500">{occ.truck?.plate}</p>
                    </Td>
                    <Td>
                      <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium', sevColors.badge)}>
                        <span className={cn('h-1.5 w-1.5 rounded-full', sevColors.dot)} />
                        {OCCURRENCE_SEVERITY_LABELS[sev]}
                      </span>
                    </Td>
                    <Td>
                      <p className="max-w-xs truncate text-sm text-slate-700">{occ.description}</p>
                    </Td>
                    <Td>
                      <span className="text-xs text-slate-600">
                        {OCCURRENCE_STATUS_LABELS[occ.status] || occ.status}
                      </span>
                    </Td>
                    <Td className="text-sm text-slate-500">{formatDateTime(occ.created_at)}</Td>
                    <Td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {occ.status === 'open' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            leftIcon={CheckCircle2}
                            onClick={() => handleResolve(occ.id)}
                          >
                            Resolver
                          </Button>
                        )}
                      </div>
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
