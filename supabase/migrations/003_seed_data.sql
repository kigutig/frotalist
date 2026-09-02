-- ============================================================
-- Migration 003: Dados Iniciais (Seed)
-- ============================================================
-- Execute APÓS criar o primeiro usuário via Supabase Auth.
-- Substitua 'SEU_USER_ID_AQUI' pelo UUID do usuário criado.
-- ============================================================

-- Inserir perfil do administrador
-- (Substitua o UUID pelo ID real do usuário criado via Auth)
-- INSERT INTO users (id, name, email, role, status)
-- VALUES (
--   'SEU_USER_ID_AQUI',
--   'Administrador',
--   'admin@shoppingacademias.com.br',
--   'admin',
--   'active'
-- );

-- ============================================================
-- Caminhões iniciais de demonstração
-- ============================================================
INSERT INTO trucks (internal_code, plate, brand, model, year, type, capacity, mileage, status)
VALUES
  ('TRK-001', 'ABC-1234', 'Volkswagen', 'Delivery 11.180', 2022, 'Baú', '7 toneladas', 125430, 'available'),
  ('TRK-002', 'DEF-5678', 'Mercedes-Benz', 'Accelo 1016', 2021, 'Carroceria', '5 toneladas', 98200, 'available'),
  ('TRK-003', 'GHI-9012', 'Ford', 'Cargo 1119', 2020, 'Baú', '6 toneladas', 187650, 'maintenance'),
  ('TRK-004', 'JKL-3456', 'Iveco', 'Daily 70C17', 2023, 'Baú', '4 toneladas', 45300, 'available'),
  ('TRK-005', 'MNO-7890', 'Volkswagen', 'Constellation 17.280', 2019, 'Carroceria', '12 toneladas', 312800, 'blocked'),
  ('TRK-006', 'PQR-2345', 'Mercedes-Benz', 'Sprinter 415 CDI', 2023, 'Van', '1.5 tonelada', 28900, 'available')
ON CONFLICT (plate) DO NOTHING;

-- ============================================================
-- Motoristas iniciais de demonstração
-- ============================================================
INSERT INTO drivers (name, cpf, phone, cnh, cnh_category, cnh_expiration, status)
VALUES
  ('João Silva', '123.456.789-00', '(11) 99999-1111', '12345678901', 'D', '2026-03-15', 'active'),
  ('Pedro Santos', '234.567.890-11', '(11) 99999-2222', '23456789012', 'C', '2025-11-20', 'active'),
  ('Roberto Lima', '345.678.901-22', '(11) 99999-3333', '34567890123', 'D', '2027-06-30', 'active'),
  ('Fernando Costa', '456.789.012-33', '(11) 99999-4444', '45678901234', 'E', '2024-08-10', 'blocked'),
  ('Marcos Oliveira', '567.890.123-44', '(11) 99999-5555', '56789012345', 'C', '2025-10-05', 'active')
ON CONFLICT (cpf) DO NOTHING;
