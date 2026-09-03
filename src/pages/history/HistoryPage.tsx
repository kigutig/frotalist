import { ChecklistsPage } from '../checklists/ChecklistsPage'

// History page reuses the checklists page with full history view
export function HistoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Histórico de Checklists</h2>
        <p className="text-sm text-slate-500">Registro completo de todos os checklists realizados</p>
      </div>
      <ChecklistsPage />
    </div>
  )
}
