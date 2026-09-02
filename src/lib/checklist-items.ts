// Checklist item definitions — all items for departure and return checklists

import type { ChecklistItemDefinition } from '../types'

export const DEPARTURE_CHECKLIST_ITEMS: ChecklistItemDefinition[] = [
  // DOCUMENTAÇÃO
  { key: 'doc_vehicle', label: 'Documento do veículo disponível', category: 'documentation', is_required: true, is_quick: true, blocks_release: true },
  { key: 'doc_cnh', label: 'CNH do motorista válida', category: 'documentation', is_required: true, is_quick: true, blocks_release: true },
  { key: 'doc_delivery', label: 'Documentação necessária para entrega', category: 'documentation', is_required: true, is_quick: true, blocks_release: true },
  { key: 'doc_cargo', label: 'Documentos da carga', category: 'documentation', is_required: true, is_quick: false, blocks_release: true },
  { key: 'doc_order', label: 'Ordem de entrega disponível', category: 'documentation', is_required: true, is_quick: true, blocks_release: true },

  // EXTERIOR
  { key: 'ext_tires', label: 'Pneus', category: 'exterior', is_required: true, is_quick: true, blocks_release: false },
  { key: 'ext_spare_tire', label: 'Estepe', category: 'exterior', is_required: true, is_quick: true, blocks_release: false },
  { key: 'ext_wheels', label: 'Rodas', category: 'exterior', is_required: true, is_quick: false, blocks_release: false },
  { key: 'ext_bolts', label: 'Parafusos das rodas', category: 'exterior', is_required: true, is_quick: false, blocks_release: false },
  { key: 'ext_headlights', label: 'Faróis', category: 'exterior', is_required: true, is_quick: true, blocks_release: false },
  { key: 'ext_taillights', label: 'Lanternas', category: 'exterior', is_required: true, is_quick: true, blocks_release: false },
  { key: 'ext_turn_signals', label: 'Setas/Piscas', category: 'exterior', is_required: true, is_quick: false, blocks_release: false },
  { key: 'ext_brake_light', label: 'Luz de freio', category: 'exterior', is_required: true, is_quick: true, blocks_release: false },
  { key: 'ext_reverse_light', label: 'Luz de ré', category: 'exterior', is_required: false, is_quick: false, blocks_release: false },
  { key: 'ext_mirrors', label: 'Retrovisores', category: 'exterior', is_required: true, is_quick: true, blocks_release: false },
  { key: 'ext_windshield', label: 'Para-brisa', category: 'exterior', is_required: true, is_quick: true, blocks_release: false },
  { key: 'ext_wipers', label: 'Limpadores de para-brisa', category: 'exterior', is_required: false, is_quick: false, blocks_release: false },
  { key: 'ext_bodywork', label: 'Lataria', category: 'exterior', is_required: false, is_quick: false, blocks_release: false },
  { key: 'ext_bumper', label: 'Para-choque', category: 'exterior', is_required: false, is_quick: false, blocks_release: false },
  { key: 'ext_doors', label: 'Portas', category: 'exterior', is_required: true, is_quick: false, blocks_release: false },
  { key: 'ext_cargo_body', label: 'Baú/Carroceria', category: 'exterior', is_required: true, is_quick: true, blocks_release: false },
  { key: 'ext_locks', label: 'Fechaduras e travas', category: 'exterior', is_required: true, is_quick: false, blocks_release: false },
  { key: 'ext_reflectors', label: 'Faixas refletivas', category: 'exterior', is_required: false, is_quick: false, blocks_release: false },
  { key: 'ext_leaks', label: 'Vazamentos aparentes', category: 'exterior', is_required: true, is_quick: true, blocks_release: true },

  // INTERIOR
  { key: 'int_seat', label: 'Banco do motorista', category: 'interior', is_required: false, is_quick: false, blocks_release: false },
  { key: 'int_seatbelt', label: 'Cinto de segurança', category: 'interior', is_required: true, is_quick: true, blocks_release: true },
  { key: 'int_dashboard', label: 'Painel de instrumentos', category: 'interior', is_required: true, is_quick: true, blocks_release: false },
  { key: 'int_horn', label: 'Buzina', category: 'interior', is_required: true, is_quick: false, blocks_release: false },
  { key: 'int_brake', label: 'Freio', category: 'interior', is_required: true, is_quick: true, blocks_release: true },
  { key: 'int_clutch', label: 'Embreagem', category: 'interior', is_required: false, is_quick: false, blocks_release: false },
  { key: 'int_gearbox', label: 'Câmbio', category: 'interior', is_required: false, is_quick: false, blocks_release: false },
  { key: 'int_ac', label: 'Ar-condicionado', category: 'interior', is_required: false, is_quick: false, blocks_release: false },
  { key: 'int_ventilation', label: 'Ventilação', category: 'interior', is_required: false, is_quick: false, blocks_release: false },
  { key: 'int_tachograph', label: 'Tacógrafo', category: 'interior', is_required: false, is_quick: false, blocks_release: false },
  { key: 'int_extinguisher', label: 'Extintor (cabine)', category: 'interior', is_required: true, is_quick: true, blocks_release: true },
  { key: 'int_cleanliness', label: 'Limpeza da cabine', category: 'interior', is_required: false, is_quick: false, blocks_release: false },

  // SEGURANÇA
  { key: 'safety_extinguisher', label: 'Extintor de incêndio', category: 'safety', is_required: true, is_quick: true, blocks_release: true },
  { key: 'safety_triangle', label: 'Triângulo de segurança', category: 'safety', is_required: true, is_quick: true, blocks_release: true },
  { key: 'safety_jack', label: 'Macaco hidráulico', category: 'safety', is_required: true, is_quick: true, blocks_release: false },
  { key: 'safety_wheel_wrench', label: 'Chave de roda', category: 'safety', is_required: true, is_quick: true, blocks_release: false },
  { key: 'safety_toolkit', label: 'Kit de ferramentas básico', category: 'safety', is_required: false, is_quick: false, blocks_release: false },
  { key: 'safety_vest', label: 'Colete refletivo', category: 'safety', is_required: true, is_quick: true, blocks_release: false },
  { key: 'safety_flashlight', label: 'Lanterna', category: 'safety', is_required: false, is_quick: false, blocks_release: false },
  { key: 'safety_first_aid', label: 'Kit de primeiros socorros', category: 'safety', is_required: false, is_quick: false, blocks_release: false },

  // CARGA
  { key: 'cargo_checked', label: 'Carga conferida', category: 'cargo', is_required: true, is_quick: true, blocks_release: true },
  { key: 'cargo_quantity', label: 'Quantidade de volumes correta', category: 'cargo', is_required: true, is_quick: true, blocks_release: true },
  { key: 'cargo_products_correct', label: 'Produtos corretos', category: 'cargo', is_required: true, is_quick: true, blocks_release: true },
  { key: 'cargo_no_damage', label: 'Produtos sem avarias', category: 'cargo', is_required: true, is_quick: true, blocks_release: false },
  { key: 'cargo_organized', label: 'Carga organizada', category: 'cargo', is_required: true, is_quick: false, blocks_release: false },
  { key: 'cargo_protected', label: 'Carga protegida', category: 'cargo', is_required: true, is_quick: false, blocks_release: false },
  { key: 'cargo_secured', label: 'Carga amarrada/fixada', category: 'cargo', is_required: true, is_quick: true, blocks_release: true },
  { key: 'cargo_weight_ok', label: 'Peso adequado/dentro do limite', category: 'cargo', is_required: true, is_quick: false, blocks_release: true },
  { key: 'cargo_addresses', label: 'Endereços de entrega conferidos', category: 'cargo', is_required: true, is_quick: true, blocks_release: true },
  { key: 'cargo_invoices', label: 'Notas fiscais/documentos conferidos', category: 'cargo', is_required: true, is_quick: true, blocks_release: true },
  { key: 'cargo_assembly_equip', label: 'Equipamentos para montagem carregados', category: 'cargo', is_required: false, is_quick: false, blocks_release: false },
  { key: 'cargo_tools', label: 'Ferramentas carregadas', category: 'cargo', is_required: false, is_quick: false, blocks_release: false },
  { key: 'cargo_accessories', label: 'Acessórios necessários carregados', category: 'cargo', is_required: false, is_quick: false, blocks_release: false },
]

export const RETURN_CHECKLIST_ITEMS: ChecklistItemDefinition[] = [
  // VEÍCULO RETORNO
  { key: 'ret_tires', label: 'Pneus', category: 'return_vehicle', is_required: true, is_quick: true, blocks_release: false },
  { key: 'ret_wheels', label: 'Rodas', category: 'return_vehicle', is_required: false, is_quick: false, blocks_release: false },
  { key: 'ret_headlights', label: 'Faróis', category: 'return_vehicle', is_required: true, is_quick: true, blocks_release: false },
  { key: 'ret_taillights', label: 'Lanternas', category: 'return_vehicle', is_required: true, is_quick: false, blocks_release: false },
  { key: 'ret_windshield', label: 'Para-brisa', category: 'return_vehicle', is_required: true, is_quick: true, blocks_release: false },
  { key: 'ret_mirrors', label: 'Retrovisores', category: 'return_vehicle', is_required: true, is_quick: false, blocks_release: false },
  { key: 'ret_bodywork', label: 'Lataria', category: 'return_vehicle', is_required: true, is_quick: true, blocks_release: false },
  { key: 'ret_bumper', label: 'Para-choque', category: 'return_vehicle', is_required: false, is_quick: false, blocks_release: false },
  { key: 'ret_doors', label: 'Portas', category: 'return_vehicle', is_required: true, is_quick: false, blocks_release: false },
  { key: 'ret_cargo_body', label: 'Baú/Carroceria', category: 'return_vehicle', is_required: true, is_quick: true, blocks_release: false },
  { key: 'ret_leaks', label: 'Vazamentos', category: 'return_vehicle', is_required: true, is_quick: true, blocks_release: false },

  // INTERIOR RETORNO
  { key: 'ret_int_cabin', label: 'Cabine limpa', category: 'return_interior', is_required: false, is_quick: false, blocks_release: false },
  { key: 'ret_int_seat', label: 'Banco', category: 'return_interior', is_required: false, is_quick: false, blocks_release: false },
  { key: 'ret_int_seatbelt', label: 'Cinto de segurança', category: 'return_interior', is_required: false, is_quick: false, blocks_release: false },
  { key: 'ret_int_dashboard', label: 'Painel de instrumentos', category: 'return_interior', is_required: true, is_quick: true, blocks_release: false },
  { key: 'ret_int_equipment', label: 'Equipamentos de segurança', category: 'return_interior', is_required: true, is_quick: true, blocks_release: false },

  // CARGA RETORNO
  { key: 'ret_cargo_remaining', label: 'Carga restante conferida', category: 'return_cargo', is_required: false, is_quick: false, blocks_release: false },
  { key: 'ret_cargo_returned', label: 'Produtos devolvidos registrados', category: 'return_cargo', is_required: false, is_quick: false, blocks_release: false },
  { key: 'ret_cargo_damaged', label: 'Produtos danificados identificados', category: 'return_cargo', is_required: false, is_quick: false, blocks_release: false },
  { key: 'ret_equip_returned', label: 'Equipamentos retornados', category: 'return_cargo', is_required: false, is_quick: false, blocks_release: false },
  { key: 'ret_tools_returned', label: 'Ferramentas retornadas', category: 'return_cargo', is_required: false, is_quick: false, blocks_release: false },
  { key: 'ret_materials_used', label: 'Materiais utilizados registrados', category: 'return_cargo', is_required: false, is_quick: false, blocks_release: false },
  { key: 'ret_materials_missing', label: 'Materiais faltantes identificados', category: 'return_cargo', is_required: false, is_quick: false, blocks_release: false },
]

export const CATEGORY_LABELS: Record<string, string> = {
  documentation: 'Documentação',
  exterior: 'Inspeção Exterior',
  interior: 'Inspeção Interior',
  safety: 'Equipamentos de Segurança',
  cargo: 'Carga',
  return_vehicle: 'Veículo (Retorno)',
  return_interior: 'Interior (Retorno)',
  return_cargo: 'Carga (Retorno)',
}

export const CATEGORY_ICONS: Record<string, string> = {
  documentation: 'FileText',
  exterior: 'Truck',
  interior: 'Settings',
  safety: 'Shield',
  cargo: 'Package',
  return_vehicle: 'Truck',
  return_interior: 'Settings',
  return_cargo: 'Package',
}
