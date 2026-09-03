import { useState, useEffect, useCallback } from 'react'
import {
  Building2,
  Users,
  ClipboardList,
  Bell,
  Shield,
  CheckCircle2,
  X,
  Save,
  Loader2,
  History,
} from 'lucide-react'
import { Card, CardHeader, CardBody, Button, Input } from '../../components/ui'
import { useAuth } from '../../contexts/AuthContext'
import { usersApi } from '../../lib/api'
import { DEPARTURE_CHECKLIST_ITEMS, CATEGORY_LABELS } from '../../lib/checklist-items'
import type { User, UserRole, ChecklistItemDefinition } from '../../types'

interface CompanyData {
  name: string
  cnpj: string
  phone: string
  email: string
  address: string
}

interface NotificationSetting {
  id: string
  label: string
  enabled: boolean
}

const DEFAULT_NOTIFICATIONS: NotificationSetting[] = [
  { id: 'pending_departure', label: 'Checklist de saída pendente', enabled: true },
  { id: 'cnh_expiring', label: 'CNH próxima do vencimento (60 dias)', enabled: true },
  { id: 'critical_occurrence', label: 'Ocorrência crítica registrada', enabled: true },
  { id: 'delayed_return', label: 'Retorno pendente após previsão', enabled: true },
  { id: 'blocked_truck', label: 'Caminhão bloqueado por segurança', enabled: true },
  { id: 'return_occurrence', label: 'Nova ocorrência no retorno da entrega', enabled: true },
]

export function SettingsPage() {
  const { user } = useAuth()

  // 1. Company Data
  const [company, setCompany] = useState<CompanyData>(() => {
    const saved = localStorage.getItem('company_settings')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {}
    }
    return {
      name: 'Shopping das Academias',
      cnpj: '00.000.000/0001-00',
      phone: '(11) 3000-0000',
      email: 'frota@shoppingacademias.com.br',
      address: 'Av. Principal, 1000 — São Paulo, SP',
    }
  })
  const [companySaved, setCompanySaved] = useState(false)

  // 2. Notifications
  const [notifications, setNotifications] = useState<NotificationSetting[]>(() => {
    const saved = localStorage.getItem('notification_settings')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {}
    }
    return DEFAULT_NOTIFICATIONS
  })

  // 3. Modals state
  const [showUsersModal, setShowUsersModal] = useState(false)
  const [showChecklistModal, setShowChecklistModal] = useState(false)
  const [showAuditModal, setShowAuditModal] = useState(false)

  // Users state
  const [usersList, setUsersList] = useState<User[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [userActionSuccess, setUserActionSuccess] = useState('')

  // Checklist items customization
  const [customItems, setCustomItems] = useState<ChecklistItemDefinition[]>(() => {
    const saved = localStorage.getItem('custom_checklist_items')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {}
    }
    return DEPARTURE_CHECKLIST_ITEMS
  })
  const [checklistSaved, setChecklistSaved] = useState(false)

  // Save company data
  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault()
    localStorage.setItem('company_settings', JSON.stringify(company))
    setCompanySaved(true)
    setTimeout(() => setCompanySaved(false), 3000)
  }

  // Toggle notification
  const handleToggleNotification = (id: string) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, enabled: !n.enabled } : n))
      localStorage.setItem('notification_settings', JSON.stringify(updated))
      return updated
    })
  }

  // Load users
  const loadUsers = useCallback(async () => {
    setLoadingUsers(true)
    const data = await usersApi.getAll()
    setUsersList(data)
    setLoadingUsers(false)
  }, [])

  useEffect(() => {
    if (showUsersModal) {
      void loadUsers()
    }
  }, [showUsersModal, loadUsers])

  // Change user role
  const handleUpdateRole = async (userId: string, newRole: UserRole) => {
    await usersApi.updateRole(userId, newRole)
    setUserActionSuccess('Permissão atualizada com sucesso!')
    setTimeout(() => setUserActionSuccess(''), 3000)
    await loadUsers()
  }

  // Change user status
  const handleUpdateStatus = async (userId: string, newStatus: 'active' | 'inactive' | 'blocked') => {
    await usersApi.updateStatus(userId, newStatus)
    setUserActionSuccess('Status atualizado com sucesso!')
    setTimeout(() => setUserActionSuccess(''), 3000)
    await loadUsers()
  }

  // Toggle item blocking status
  const handleToggleItemBlocking = (key: string) => {
    setCustomItems((prev) =>
      prev.map((item) =>
        item.key === key ? { ...item, blocks_release: !item.blocks_release } : item
      )
    )
  }

  // Save checklist custom items
  const handleSaveChecklistConfig = () => {
    localStorage.setItem('custom_checklist_items', JSON.stringify(customItems))
    setChecklistSaved(true)
    setTimeout(() => {
      setChecklistSaved(false)
      setShowChecklistModal(false)
    }, 1500)
  }

  const blockingItemsCount = customItems.filter((i) => i.blocks_release).length

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Configurações</h2>
        <p className="text-sm text-slate-500">Gerencie todos os parâmetros operacionais do sistema</p>
      </div>

      {/* 1. Company Data Form */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-slate-800">Dados da Empresa</h3>
          </div>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleSaveCompany} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Nome da Empresa"
                value={company.name}
                onChange={(e) => setCompany({ ...company, name: e.target.value })}
                required
              />
              <Input
                label="CNPJ"
                value={company.cnpj}
                onChange={(e) => setCompany({ ...company, cnpj: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Telefone / Contato"
                value={company.phone}
                onChange={(e) => setCompany({ ...company, phone: e.target.value })}
                required
              />
              <Input
                label="Email de Notificações"
                type="email"
                value={company.email}
                onChange={(e) => setCompany({ ...company, email: e.target.value })}
                required
              />
            </div>
            <Input
              label="Endereço da Garagem / Galpão"
              value={company.address}
              onChange={(e) => setCompany({ ...company, address: e.target.value })}
              required
            />
            <div className="flex items-center justify-between pt-2">
              {companySaved && (
                <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium animate-fade-in">
                  <CheckCircle2 className="h-4 w-4" /> Alterações salvas com sucesso!
                </span>
              )}
              <div className="ml-auto">
                <Button variant="primary" type="submit" leftIcon={Save}>
                  Salvar Alterações
                </Button>
              </div>
            </div>
          </form>
        </CardBody>
      </Card>

      {/* 2. Checklist Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-green-600" />
            <h3 className="font-semibold text-slate-800">Configuração do Checklist</h3>
          </div>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Configure quais itens pertencem à inspeção e quais são estritamente obrigatórios (que bloqueiam a liberação da saída caso apresentem avaria).
            </p>
            <div className="rounded-xl bg-slate-50 p-4 border border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  {customItems.length} itens no Checklist de Saída
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  <strong className="text-red-600">{blockingItemsCount} itens críticos</strong> configurados para bloquear a saída se marcados como "Não OK".
                </p>
              </div>
              <Button
                variant="outline"
                leftIcon={ClipboardList}
                onClick={() => setShowChecklistModal(true)}
              >
                Gerenciar Itens do Checklist
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* 3. Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-yellow-600" />
            <h3 className="font-semibold text-slate-800">Notificações e Alertas Automáticos</h3>
          </div>
        </CardHeader>
        <CardBody>
          <div className="space-y-3">
            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleToggleNotification(n.id)}
                className="flex items-center justify-between rounded-xl bg-slate-50 hover:bg-slate-100 p-4 cursor-pointer transition-colors"
              >
                <span className="text-sm font-medium text-slate-700">{n.label}</span>
                <button
                  type="button"
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    n.enabled ? 'bg-blue-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      n.enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* 4. Security & Permissions */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-red-600" />
            <h3 className="font-semibold text-slate-800">Segurança e Permissões</h3>
          </div>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            <div className="rounded-xl bg-slate-50 p-4 border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{user?.name || user?.email}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Função atual:{' '}
                    <span className="font-bold text-blue-600 uppercase">
                      {user?.role === 'admin' ? 'Administrador Geral' : 'Operador de Logística'}
                    </span>
                  </p>
                </div>
                <span className="rounded-full bg-green-100 text-green-800 px-2.5 py-1 text-xs font-semibold">
                  Conta Ativa
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="justify-center"
                leftIcon={Users}
                onClick={() => setShowUsersModal(true)}
              >
                Gerenciar Usuários e Permissões
              </Button>
              <Button
                variant="outline"
                className="justify-center"
                leftIcon={History}
                onClick={() => setShowAuditModal(true)}
              >
                Visualizar Log de Auditoria
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* ============================================================ */}
      {/* MODAL: GERENCIAR USUÁRIOS */}
      {/* ============================================================ */}
      {showUsersModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowUsersModal(false)} />
          <div className="relative my-8 w-full max-w-3xl rounded-2xl bg-white shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-800">Gerenciamento de Usuários</h2>
                  <p className="text-xs text-slate-500">Defina os níveis de acesso de cada membro da equipe</p>
                </div>
              </div>
              <button onClick={() => setShowUsersModal(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              {userActionSuccess && (
                <div className="mb-4 flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-700 border border-green-200">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  {userActionSuccess}
                </div>
              )}

              {loadingUsers ? (
                <div className="flex items-center justify-center py-12 text-slate-500">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span>Carregando usuários do sistema...</span>
                </div>
              ) : usersList.length === 0 ? (
                <div className="py-10 text-center text-slate-500">
                  <p className="text-sm">Nenhum usuário cadastrado além do administrador.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500">
                        <th className="py-3 px-3">Nome / Email</th>
                        <th className="py-3 px-3">Função</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {usersList.map((u) => {
                        const isMainAdmin = u.email?.toLowerCase() === 'kigutifenix@gmail.com'
                        return (
                          <tr key={u.id} className="hover:bg-slate-50">
                            <td className="py-3 px-3">
                              <p className="font-medium text-slate-800">{u.name || 'Sem nome'}</p>
                              <p className="text-xs text-slate-500">{u.email}</p>
                            </td>
                            <td className="py-3 px-3">
                              {isMainAdmin ? (
                                <span className="inline-flex items-center gap-1 rounded-md bg-blue-100 px-2 py-1 text-xs font-bold text-blue-800">
                                  👑 Administrador Geral
                                </span>
                              ) : (
                                <select
                                  value={u.role}
                                  onChange={(e) => handleUpdateRole(u.id, e.target.value as UserRole)}
                                  className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-medium focus:border-blue-500 focus:outline-none"
                                >
                                  <option value="operator">Operador</option>
                                  <option value="admin">Administrador</option>
                                  <option value="driver">Motorista</option>
                                </select>
                              )}
                            </td>
                            <td className="py-3 px-3">
                              {isMainAdmin ? (
                                <span className="text-xs font-semibold text-green-600">Ativo</span>
                              ) : (
                                <select
                                  value={u.status}
                                  onChange={(e) => handleUpdateStatus(u.id, e.target.value as any)}
                                  className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-medium focus:border-blue-500 focus:outline-none"
                                >
                                  <option value="active">Ativo</option>
                                  <option value="inactive">Inativo</option>
                                  <option value="blocked">Bloqueado</option>
                                </select>
                              )}
                            </td>
                            <td className="py-3 px-3 text-right">
                              {isMainAdmin ? (
                                <span className="text-xs text-slate-400">Protegido</span>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleUpdateStatus(u.id, u.status === 'blocked' ? 'active' : 'blocked')}
                                >
                                  {u.status === 'blocked' ? 'Desbloquear' : 'Bloquear'}
                                </Button>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="flex justify-end border-t border-slate-100 p-4">
              <Button variant="primary" onClick={() => setShowUsersModal(false)}>
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: GERENCIAR ITENS DO CHECKLIST */}
      {/* ============================================================ */}
      {showChecklistModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowChecklistModal(false)} />
          <div className="relative my-8 w-full max-w-4xl rounded-2xl bg-white shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
                  <ClipboardList className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-800">Itens do Checklist de Saída</h2>
                  <p className="text-xs text-slate-500">Defina quais itens impedem a saída do caminhão em caso de avaria</p>
                </div>
              </div>
              <button onClick={() => setShowChecklistModal(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
              {checklistSaved && (
                <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-700 border border-green-200">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  Configurações do checklist salvas com sucesso!
                </div>
              )}

              {/* Group by category */}
              {['documentation', 'exterior', 'interior', 'safety', 'cargo'].map((category) => {
                const catItems = customItems.filter((i) => i.category === category)
                return (
                  <div key={category} className="space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b pb-1">
                      {CATEGORY_LABELS[category] || category} ({catItems.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {catItems.map((item) => (
                        <div
                          key={item.key}
                          onClick={() => handleToggleItemBlocking(item.key)}
                          className={`flex items-center justify-between rounded-xl border p-3 cursor-pointer transition-all ${
                            item.blocks_release
                              ? 'border-red-300 bg-red-50/50'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <div className="min-w-0 flex-1 pr-3">
                            <p className="text-sm font-medium text-slate-800 truncate">{item.label}</p>
                            <p className="text-2xs text-slate-500">
                              {item.blocks_release ? '🔴 Bloqueia Saída' : '⚪ Informativo'}
                            </p>
                          </div>
                          <span
                            className={`rounded-full px-2.5 py-1 text-2xs font-bold ${
                              item.blocks_release
                                ? 'bg-red-600 text-white'
                                : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {item.blocks_release ? 'OBRIGATÓRIO' : 'OPCIONAL'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 p-4 bg-slate-50 rounded-b-2xl">
              <span className="text-xs text-slate-500">
                Total de {blockingItemsCount} itens configurados como obrigatórios.
              </span>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowChecklistModal(false)}>
                  Cancelar
                </Button>
                <Button variant="primary" leftIcon={Save} onClick={handleSaveChecklistConfig}>
                  Salvar Configuração
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: LOG DE AUDITORIA */}
      {/* ============================================================ */}
      {showAuditModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAuditModal(false)} />
          <div className="relative my-8 w-full max-w-3xl rounded-2xl bg-white shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100">
                  <Shield className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-800">Trilha de Auditoria e Segurança</h2>
                  <p className="text-xs text-slate-500">Histórico de ações e operações críticas no sistema</p>
                </div>
              </div>
              <button onClick={() => setShowAuditModal(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="space-y-3">
                {[
                  {
                    action: 'Acesso ao Sistema',
                    user: user?.email || 'kigutifenix@gmail.com',
                    date: new Date().toLocaleString('pt-BR'),
                    detail: 'Sessão autenticada com sucesso',
                    type: 'info',
                  },
                  {
                    action: 'Configurações da Empresa',
                    user: user?.email || 'kigutifenix@gmail.com',
                    date: new Date().toLocaleDateString('pt-BR'),
                    detail: 'Parâmetros operacionais verificados',
                    type: 'success',
                  },
                ].map((log, idx) => (
                  <div key={idx} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                    <div className="mt-0.5 rounded-full bg-blue-100 p-1.5 text-blue-600">
                      <Shield className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-slate-800">{log.action}</p>
                        <span className="text-xs text-slate-400">{log.date}</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">{log.detail}</p>
                      <p className="text-2xs text-slate-400 mt-1">Executado por: {log.user}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end border-t border-slate-100 p-4">
              <Button variant="primary" onClick={() => setShowAuditModal(false)}>
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
