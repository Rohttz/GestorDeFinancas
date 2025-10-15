/*
  # Finance Manager Database Schema

  ## Overview
  Creates complete database schema for a personal finance management application
  with tables for income tracking, expenses, categories, bank accounts, financial goals, and users.

  ## New Tables

  ### categorias
  - `id` (uuid, primary key) - Unique category identifier
  - `nome` (text) - Category name
  - `tipo` (text) - Type: 'Receita' or 'Despesa'
  - `cor` (text) - Color for UI display
  - `observacoes` (text) - Additional notes
  - `created_at` (timestamptz) - Creation timestamp

  ### contas
  - `id` (uuid, primary key) - Unique account identifier
  - `nome` (text) - Account name
  - `tipo` (text) - Account type (e.g., 'Corrente', 'Poupança')
  - `saldo` (numeric) - Current balance
  - `data_atualizacao` (timestamptz) - Last update timestamp
  - `observacoes` (text) - Additional notes
  - `created_at` (timestamptz) - Creation timestamp

  ### rendas
  - `id` (uuid, primary key) - Unique income identifier
  - `descricao` (text) - Income description
  - `valor` (numeric) - Income amount
  - `data_recebimento` (date) - Receipt date
  - `categoria_id` (uuid) - Foreign key to categorias
  - `conta_id` (uuid) - Foreign key to contas
  - `created_at` (timestamptz) - Creation timestamp

  ### despesas
  - `id` (uuid, primary key) - Unique expense identifier
  - `descricao` (text) - Expense description
  - `valor` (numeric) - Expense amount
  - `data_pagamento` (date) - Payment date
  - `categoria_id` (uuid) - Foreign key to categorias
  - `conta_id` (uuid) - Foreign key to contas
  - `pago` (boolean) - Payment status
  - `created_at` (timestamptz) - Creation timestamp

  ### metas
  - `id` (uuid, primary key) - Unique goal identifier
  - `nome` (text) - Goal name
  - `valor_alvo` (numeric) - Target amount
  - `valor_atual` (numeric) - Current amount saved
  - `prazo_final` (date) - Deadline
  - `status` (text) - Status: 'Em andamento', 'Concluída', or 'Atrasada'
  - `created_at` (timestamptz) - Creation timestamp

  ### usuarios
  - `id` (uuid, primary key) - Unique user identifier
  - `nome` (text) - User name
  - `email` (text, unique) - User email
  - `tipo_acesso` (text) - Access type: 'Administrador' or 'Colaborador'
  - `status` (text) - Status: 'Ativo' or 'Inativo'
  - `created_at` (timestamptz) - Creation timestamp

  ## Security
  - Enable Row Level Security (RLS) on all tables
  - Add policies for public access (for development/demo purposes)
  - In production, these should be restricted to authenticated users only

  ## Important Notes
  1. All monetary values use numeric type for precision
  2. Foreign key constraints ensure data integrity
  3. Default values provided for booleans and timestamps
  4. Indexes not included but should be added based on query patterns
*/

-- Create categorias table
CREATE TABLE IF NOT EXISTS categorias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('Receita', 'Despesa')),
  cor text DEFAULT '#6366f1',
  observacoes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to categorias"
  ON categorias FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert access to categorias"
  ON categorias FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update access to categorias"
  ON categorias FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete access to categorias"
  ON categorias FOR DELETE
  TO public
  USING (true);

-- Create contas table
CREATE TABLE IF NOT EXISTS contas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  tipo text NOT NULL,
  saldo numeric(15, 2) DEFAULT 0 NOT NULL,
  data_atualizacao timestamptz DEFAULT now(),
  observacoes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE contas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to contas"
  ON contas FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert access to contas"
  ON contas FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update access to contas"
  ON contas FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete access to contas"
  ON contas FOR DELETE
  TO public
  USING (true);

-- Create rendas table
CREATE TABLE IF NOT EXISTS rendas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  descricao text NOT NULL,
  valor numeric(15, 2) NOT NULL CHECK (valor > 0),
  data_recebimento date NOT NULL,
  categoria_id uuid REFERENCES categorias(id) ON DELETE SET NULL,
  conta_id uuid REFERENCES contas(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE rendas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to rendas"
  ON rendas FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert access to rendas"
  ON rendas FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update access to rendas"
  ON rendas FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete access to rendas"
  ON rendas FOR DELETE
  TO public
  USING (true);

-- Create despesas table
CREATE TABLE IF NOT EXISTS despesas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  descricao text NOT NULL,
  valor numeric(15, 2) NOT NULL CHECK (valor > 0),
  data_pagamento date NOT NULL,
  categoria_id uuid REFERENCES categorias(id) ON DELETE SET NULL,
  conta_id uuid REFERENCES contas(id) ON DELETE SET NULL,
  pago boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE despesas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to despesas"
  ON despesas FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert access to despesas"
  ON despesas FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update access to despesas"
  ON despesas FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete access to despesas"
  ON despesas FOR DELETE
  TO public
  USING (true);

-- Create metas table
CREATE TABLE IF NOT EXISTS metas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  valor_alvo numeric(15, 2) NOT NULL CHECK (valor_alvo > 0),
  valor_atual numeric(15, 2) DEFAULT 0 NOT NULL CHECK (valor_atual >= 0),
  prazo_final date NOT NULL,
  status text DEFAULT 'Em andamento' CHECK (status IN ('Em andamento', 'Concluída', 'Atrasada')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE metas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to metas"
  ON metas FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert access to metas"
  ON metas FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update access to metas"
  ON metas FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete access to metas"
  ON metas FOR DELETE
  TO public
  USING (true);

-- Create usuarios table
CREATE TABLE IF NOT EXISTS usuarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  email text UNIQUE NOT NULL,
  tipo_acesso text DEFAULT 'Colaborador' CHECK (tipo_acesso IN ('Administrador', 'Colaborador')),
  status text DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Inativo')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to usuarios"
  ON usuarios FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert access to usuarios"
  ON usuarios FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update access to usuarios"
  ON usuarios FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete access to usuarios"
  ON usuarios FOR DELETE
  TO public
  USING (true);