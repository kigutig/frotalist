# 🚛 Sistema de Controle de Frota — Shopping das Academias

Sistema web moderno e completo para controle de frotas e checklist operacional de caminhões antes da saída para entregas e no retorno à empresa.

---

## 🚀 Tecnologias

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS
- **Ícones & UI:** Lucide React, Radix UI primitives
- **Gráficos:** Recharts
- **Backend & Auth:** Supabase (PostgreSQL, Row Level Security, Storage Buckets)
- **Assinatura Digital:** Canvas HTML5 touch/mouse

---

## 📦 Funcionalidades Principais

- **Dashboard:** Visão geral da frota em tempo real, status dos veículos, viagens ativas e alertas.
- **Módulo de Caminhões:** Cadastro, listagem com filtros rápidos, odômetro, capacidade e histórico individual.
- **Módulo de Motoristas:** Cadastro, controle de vencimento de CNH com alertas automáticos (60 dias).
- **Checklist de Saída (Wizard de 11 Etapas):**
  1. Identificação (Caminhão, Motorista, Destino, KM inicial)
  2. Documentação (CRLV, CNH, Seguro, Tacógrafo, ANTT)
  3. Inspeção Exterior (Pneus, lanternas, lataria, estepe, retrovisores)
  4. Inspeção Interior (Painel, cintos, extintor, freios, ar)
  5. Equipamentos de Segurança (EPI, macaco, triângulo, colete)
  6. Carga (Volumes, lacres, amarração)
  7. Ocorrências (Detecção automática de não-conformidades com níveis de severidade)
  8. Fotos (Captura direta pela câmera ou upload da galeria)
  9. Revisão geral e validação de bloqueio
  10. Assinatura Digital do motorista e do operador
  11. Liberação do veículo (com opção de liberação excepcional auditada para administradores)
- **Histórico & Viagens:** Rastreabilidade de saídas e retornos com conferência de KM rodado.
- **Manutenção & Ocorrências:** Registro de serviços mecânicos, oficinas e custos.
- **Relatórios:** Exportações e gráficos de conformidade e volume de viagens.

---

## 🛠️ Instalação e Execução Local

### 1. Clonar o repositório
```bash
git clone git@github.com:kigutig/frotalist.git
cd frotalist
```

### 2. Instalar dependências
```bash
npm install
```

### 3. Configurar variáveis de ambiente
Copie o arquivo `.env.example` para `.env` e preencha as credenciais do Supabase:
```bash
cp .env.example .env
```

```env
VITE_SUPABASE_URL=https://sua-url.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key
```

> **Nota:** Caso não configure as chaves do Supabase, o sistema roda automaticamente em **Modo Demonstração** com dados locais de simulação.

### 4. Iniciar o servidor de desenvolvimento
```bash
npm run dev
```
Acesse no navegador: `http://localhost:5173`

---

## 🗄️ Estrutura do Banco de Dados (Supabase)

Os scripts de criação de tabelas, RLS e dados iniciais estão localizados na pasta `supabase/migrations/`:
1. `001_initial_schema.sql` — Tabelas (`trucks`, `drivers`, `trips`, `checklists`, `occurrences`, etc.)
2. `002_rls_policies.sql` — Políticas de segurança Row Level Security
3. `003_seed_data.sql` — Dados iniciais para testes
4. `004_storage_buckets.sql` — Buckets para armazenamento de fotos

---

## 📄 Licença
Propriedade privada — Shopping das Academias. Todos os direitos reservados.
