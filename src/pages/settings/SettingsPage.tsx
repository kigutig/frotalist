import { Settings, Building2, Users, ClipboardList, Bell, Shield } from 'lucide-react'
import { Card, CardHeader, CardBody, Button, Input } from '../../components/ui'
import { useAuth } from '../../contexts/AuthContext'

export function SettingsPage() {
  const { user } = useAuth()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Configurações</h2>
        <p className="text-sm text-slate-500">Gerencie as configurações do sistema</p>
      </div>

      {/* Company */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-slate-800">Dados da Empresa</h3>
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Nome da Empresa" defaultValue="Shopping das Academias" />
            <Input label="CNPJ" defaultValue="00.000.000/0001-00" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Telefone" defaultValue="(11) 3000-0000" />
            <Input label="Email" defaultValue="frota@shoppingacademias.com.br" />
          </div>
          <Input label="Endereço" defaultValue="Av. Principal, 1000 — São Paulo, SP" />
          <div className="flex justify-end">
            <Button variant="primary">Salvar Alterações</Button>
          </div>
        </CardBody>
      </Card>

      {/* Checklist config */}
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
              Configure quais itens pertencem ao checklist completo e quais ao checklist rápido.
              Os itens obrigatórios são aqueles que bloqueiam a liberação do caminhão quando marcados como "Não OK".
            </p>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-700">
                53 itens configurados — Checklist Completo
              </p>
              <p className="text-xs text-slate-500 mt-1">
                23 itens no Checklist Rápido · 18 itens obrigatórios (bloqueiam saída)
              </p>
            </div>
            <Button variant="outline">Gerenciar Itens do Checklist</Button>
          </div>
        </CardBody>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-yellow-600" />
            <h3 className="font-semibold text-slate-800">Notificações</h3>
          </div>
        </CardHeader>
        <CardBody>
          <div className="space-y-3">
            {[
              { label: 'Checklist de saída pendente', enabled: true },
              { label: 'CNH próxima do vencimento (30 dias)', enabled: true },
              { label: 'Ocorrência crítica registrada', enabled: true },
              { label: 'Retorno pendente após previsão', enabled: true },
              { label: 'Caminhão bloqueado', enabled: true },
              { label: 'Nova ocorrência no retorno', enabled: false },
            ].map((n) => (
              <div key={n.label} className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
                <span className="text-sm text-slate-700">{n.label}</span>
                <div className={`h-5 w-9 rounded-full transition-colors ${n.enabled ? 'bg-blue-600' : 'bg-slate-300'}`}>
                  <div className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${n.enabled ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-red-600" />
            <h3 className="font-semibold text-slate-800">Segurança e Permissões</h3>
          </div>
        </CardHeader>
        <CardBody>
          <div className="space-y-3">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-800">Usuário atual: {user?.name}</p>
              <p className="text-xs text-slate-500 capitalize">Função: {user?.role === 'admin' ? 'Administrador' : user?.role === 'operator' ? 'Operador' : 'Motorista'}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" leftIcon={Users}>Gerenciar Usuários</Button>
              <Button variant="outline" leftIcon={Shield}>Log de Auditoria</Button>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
