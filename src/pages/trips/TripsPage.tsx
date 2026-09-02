import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Route, Plus, Search, Eye, ArrowRight, MapPin, Clock } from 'lucide-react'
import {
  Card, CardBody, Button, Input, Select, EmptyState,
  Table, TableHead, TableBody, Th, Td,
} from '../../components/ui'
import { MOCK_TRIPS } from '../../lib/mock-data'
import { TRIP_STATUS_LABELS, TRIP_STATUS_COLORS, formatDateTime, formatMileage, cn } from '../../lib/utils'

const STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'planned', label: 'Planejada' },
  { value: 'released', label: 'Liberada' },
  { value: 'in_route', label: 'Em Rota' },
  { value: 'returned', label: 'Retornada' },
  { value: 'cancelled', label: 'Cancelada' },
]

export function TripsPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const trips = MOCK_TRIPS.filter((t) => {
    const q = search.toLowerCase()
    const matchesSearch =
      !q ||
      t.truck?.internal_code.toLowerCase().includes(q) ||
      t.driver?.name.toLowerCase().includes(q) ||
      t.destination.toLowerCase().includes(q)
    const matchesStatus = !statusFilter || t.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Viagens</h2>
          <p className="text-sm text-slate-500">{MOCK_TRIPS.length} viagens registradas</p>
        </div>
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
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} options={STATUS_OPTIONS} containerClassName="sm:w-44" />
          </div>
        </CardBody>
      </Card>

      <Card>
        {trips.length === 0 ? (
          <EmptyState icon={Route} title="Nenhuma viagem encontrada" description="As viagens são criadas automaticamente ao liberar um checklist de saída." />
        ) : (
          <Table>
            <TableHead>
              <tr>
                <Th>Caminhão / Motorista</Th>
                <Th>Rota</Th>
                <Th>Saída</Th>
                <Th>KM</Th>
                <Th>Status</Th>
                <Th className="text-right">Ações</Th>
              </tr>
            </TableHead>
            <TableBody>
              {trips.map((trip) => {
                const distance = trip.return_mileage && trip.departure_mileage
                  ? trip.return_mileage - trip.departure_mileage
                  : null
                return (
                  <tr key={trip.id} className="cursor-pointer hover:bg-slate-50" onClick={() => navigate(`/trips/${trip.id}`)}>
                    <Td>
                      <p className="font-semibold text-slate-800">{trip.truck?.internal_code}</p>
                      <p className="text-xs text-slate-500">{trip.driver?.name}</p>
                    </Td>
                    <Td>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-slate-500 truncate max-w-[100px]">{trip.origin.split(' — ')[0]}</span>
                        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                        <span className="font-medium text-slate-700 truncate max-w-[100px]">{trip.destination}</span>
                      </div>
                    </Td>
                    <Td className="text-sm">{formatDateTime(trip.departure_at)}</Td>
                    <Td>
                      <p className="font-mono text-sm">{formatMileage(trip.departure_mileage)}</p>
                      {distance !== null && (
                        <p className="text-xs text-slate-500">+{distance.toLocaleString('pt-BR')} km</p>
                      )}
                    </Td>
                    <Td>
                      <span className={cn('inline-flex rounded-full border px-2.5 py-1 text-xs font-medium', TRIP_STATUS_COLORS[trip.status])}>
                        {TRIP_STATUS_LABELS[trip.status]}
                      </span>
                    </Td>
                    <Td className="text-right">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        {trip.status === 'in_route' && (
                          <Button variant="primary" size="sm" onClick={() => navigate(`/trips/${trip.id}/return`)}>
                            Registrar Retorno
                          </Button>
                        )}
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
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
    </div>
  )
}
