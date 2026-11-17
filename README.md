# 💰 GranaMax

> Aplicativo de controle financeiro pessoal com backend MySQL e API REST.

---

## 🛠️ Tecnologias

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 19 + TypeScript + Vite |
| Backend | Node.js + Express |
| Banco de dados | MySQL |
| Autenticação | JWT (JSON Web Token) |
| Gráficos | Recharts |
| Ícones | Lucide React |
| Estilos | CSS customizado |

---

## 🚀 Como Rodar

### Pré-requisitos
- Node.js instalado
- MySQL rodando localmente (porta 3306)

### 1. Instalar dependências do frontend

```bash
npm install
```

### 2. Instalar dependências do backend

```bash
cd backend
npm install
```

### 3. Configurar variáveis de ambiente

Edite o arquivo `backend/.env`:

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=seu_usuario
DB_PASSWORD=sua_senha
DB_NAME=granamax
JWT_SECRET=granamax_secret_key_2026
PORT=3001
```

### 4. Criar banco de dados e tabelas

```bash
cd backend
node setup.js
```

### 5. Rodar o backend

```bash
cd backend
node server.js
```

A API estará disponível em: `http://localhost:3001`

### 6. Rodar o frontend

Em outro terminal:

```bash
npm run dev
```

O app estará disponível em: `http://localhost:5173`

---

## 🗄️ Banco de Dados

### Tabela `users` — Usuários cadastrados

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `id` | VARCHAR(36) | ✅ | Identificador único do usuário, gerado automaticamente no formato UUID (ex: `550e8400-e29b-41d4-a716-446655440000`) |
| `email` | VARCHAR(255) | ✅ | Endereço de e-mail do usuário. Usado para login. Deve ser único no sistema |
| `password` | VARCHAR(255) | ✅ | Senha do usuário armazenada como hash bcrypt. Nunca é salva em texto puro — mesmo o administrador do banco não consegue ler a senha original |
| `is_pro` | BOOLEAN | ✅ | Indica se o usuário tem acesso à versão PRO. `false` = gratuito, `true` = PRO. Padrão: `false` |
| `birth_date` | DATE | ❌ | Data de nascimento do usuário no formato `YYYY-MM-DD` (ex: `1995-03-21`). Campo opcional — pode ser nulo |
| `created_at` | DATETIME | ✅ | Data e hora em que a conta foi criada. Preenchido automaticamente pelo banco |

**Exemplo de registro:**
```
id:         550e8400-e29b-41d4-a716-446655440000
email:      usuario@exemplo.com
password:   $2a$10$N9qo8uLOickgx2ZMRZoMye... (hash bcrypt)
is_pro:     false
birth_date: 1995-03-21
created_at: 2026-06-09 20:28:00
```

---

### Tabela `transactions` — Transações financeiras

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `id` | VARCHAR(36) | ✅ | Identificador único da transação, gerado automaticamente no formato UUID |
| `user_id` | VARCHAR(36) | ✅ | ID do usuário dono desta transação. Referência à tabela `users`. Garante que cada usuário veja apenas suas próprias transações |
| `description` | VARCHAR(255) | ✅ | Descrição da transação informada pelo usuário (ex: "Supermercado", "Salário", "Uber") |
| `amount` | DECIMAL(10,2) | ✅ | Valor da transação com até 2 casas decimais (ex: `150.90`). Sempre positivo — o tipo define se é entrada ou saída |
| `type` | ENUM | ✅ | Tipo da transação: `income` (receita/entrada) ou `expense` (despesa/saída) |
| `category` | VARCHAR(100) | ✅ | Categoria escolhida pelo usuário. Valores possíveis: `Alimentação`, `Transporte`, `Moradia`, `Saúde`, `Lazer`, `Educação`, `Outros` |
| `date` | DATETIME | ✅ | Data e hora em que a transação ocorreu. Definida automaticamente no momento do registro |
| `created_at` | DATETIME | ✅ | Data e hora em que o registro foi inserido no banco. Preenchido automaticamente |

**Exemplo de registro:**
```
id:          a1b2c3d4-e5f6-7890-abcd-ef1234567890
user_id:     550e8400-e29b-41d4-a716-446655440000
description: Supermercado
amount:      250.75
type:        expense
category:    Alimentação
date:        2026-06-09 19:00:00
created_at:  2026-06-09 19:00:05
```

---

## 🔗 API REST — Rotas disponíveis

### Autenticação

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/auth/signup` | Criar nova conta. Body: `{ email, password }` |
| POST | `/auth/signin` | Entrar com conta existente. Body: `{ email, password }` |
| GET | `/auth/me` | Retorna dados do usuário logado. Requer token |

### Transações

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/transactions` | Lista todas as transações do usuário logado |
| POST | `/transactions` | Cria nova transação. Body: `{ description, amount, type, category }` |
| DELETE | `/transactions/:id` | Remove uma transação pelo ID |

Todas as rotas de transações exigem o header:
```
Authorization: Bearer <token>
```

---

## 📁 Estrutura de Pastas

```
granamax/
├── backend/                  # API Node.js + Express
│   ├── routes/
│   │   ├── auth.js           # Rotas de autenticação
│   │   └── transactions.js   # Rotas de transações
│   ├── database.js           # Conexão com MySQL
│   ├── server.js             # Servidor Express
│   ├── setup.js              # Criação do banco e tabelas
│   └── .env                  # Variáveis de ambiente (não versionar)
│
└── src/                      # Frontend React
    ├── components/           # Componentes visuais
    │   ├── ui/               # Componentes base (Button, Card, Input)
    │   ├── Dashboard.tsx     # Tela principal com filtros
    │   ├── LandingPage.tsx   # Página inicial
    │   ├── AuthForms.tsx     # Login e cadastro
    │   ├── TransactionList.tsx
    │   ├── AddTransactionModal.tsx
    │   ├── ExpenseChart.tsx
    │   └── CategoryBreakdown.tsx
    ├── hooks/                # Lógica de negócio
    │   ├── useAuth.ts        # Login, cadastro, token JWT
    │   ├── useTransactions.ts # CRUD de transações
    │   └── useRetention.ts   # Alertas e insights
    ├── styles/               # CSS por módulo
    └── types/                # Tipos TypeScript
```

---

## ✨ Funcionalidades

### Versão Gratuita
- Cadastro e login com JWT
- Adicionar e excluir transações
- Filtros por mês, categoria e tipo
- Gráfico de gastos dos últimos 7 dias
- Breakdown por categoria
- Alertas inteligentes de gastos
- Sistema de conquistas
- Meta diária de gastos

### Versão PRO (em desenvolvimento)
- Módulo de investimentos
- Análises avançadas
- Previsão de gastos
- Relatórios detalhados

---

## 🔒 Segurança

- Senhas criptografadas com **bcrypt** (hash irreversível)
- Autenticação via **JWT** com expiração de 30 dias
- Cada usuário acessa apenas seus próprios dados
- Token armazenado no `localStorage` do navegador

---

## 🎨 Design

**Cores:**
- Principal: `#22C55E` (verde)
- Perigo: `#EF4444` (vermelho)
- Aviso: `#F59E0B` (amarelo)
- Fundo: `#F9FAFB` (cinza claro)

**Fontes:**
- Títulos: Poppins (600, 700, 800)
- Corpo: Inter (400, 500, 600)
