# BiblioTeca

Sistema web de gestão de biblioteca com autenticação por perfil, painel administrativo, área do leitor e conformidade com a LGPD.

## Sobre o projeto

O **BiblioTeca** é uma plataforma web fullstack para gerenciamento de biblioteca. Conta com fluxo completo de autenticação (registro e login com JWT via httpOnly cookie), dois perfis de acesso (admin e leitor), painel administrativo protegido, CRUD de usuários e acervo de livros com busca, filtros por gênero, visualização em grid/lista e paginação.

## Funcionalidades

### Autenticação e Sessão
- Cadastro com consentimento LGPD obrigatório (Art. 8 da Lei 13.709/2018)
- Login com autenticação via JWT armazenado em cookie `httpOnly`
- Rate limiting nas rotas de autenticação (10 req / 15 min)
- Redirecionamento por perfil após login (`admin` → `/admin`, `leitor` → `/leitor`)
- Logout com limpeza de cookie

### Direitos do Titular (LGPD)
- Aceite de consentimento no primeiro login (Art. 8)
- Atualização de dados pelo próprio titular (Art. 18, III)
- Exclusão da conta pelo próprio titular — direito ao esquecimento (Art. 18, VI)
- Revogação de consentimento com prazo de remoção de dados (Art. 8, §5º)
- Histórico completo de consentimentos por versão

### Auditoria
- Log persistente de todas as ações sensíveis (login, falha de login, alteração e exclusão de dados)
- Retenção automática limitada a 90 dias (Art. 15 da LGPD via TTL index no MongoDB)

### Painel do Leitor (`/leitor`)
- Acervo público de livros com busca, filtros por gênero e paginação
- Visualização em grid ou lista
- Detalhe do livro com capa, sinopse e metadados

### Painel Administrativo (`/admin`)
- CRUD completo de usuários
- CRUD completo do acervo de livros
- Busca de usuários em tempo real
- Filtros por gênero e disponibilidade
- Proteção de rotas por middleware JWT + perfil `admin`

## Tecnologias

### Frontend
- HTML5, CSS3, Bootstrap 5
- Bootstrap Icons
- JavaScript vanilla (Axios para requisições HTTP)
- Deploy: Vercel (com `vercel.json` para reescrita de rotas)

### Backend
- Node.js + Express 5
- MongoDB + Mongoose 9
- JWT (`jsonwebtoken`) via cookie `httpOnly`
- `bcryptjs` para hash de senhas (salt 10)
- `helmet` para headers de segurança
- `express-rate-limit` para proteção contra brute-force
- `cookie-parser`, `cors`, `dotenv`
- Dev: `nodemon`

## Estrutura do projeto

```
biblioteca/
├── backend/
│   ├── server.js
│   └── src/
│       ├── config/
│       │   └── db.js
│       ├── controllers/
│       │   ├── authController.js
│       │   ├── bookController.js
│       │   └── userController.js
│       ├── middleware/
│       │   └── authMiddleware.js
│       ├── models/
│       │   ├── AuditLog.js
│       │   ├── Book.js
│       │   └── User.js
│       ├── routes/
│       │   ├── authRoutes.js
│       │   ├── bookRoutes.js
│       │   └── userRoutes.js
│       └── utils/
│           └── audit.js
└── frontend/
    ├── css/
    │   ├── books.css
    │   └── styles.css
    ├── js/
    │   ├── acervo.js
    │   ├── admin.js
    │   ├── auth.js
    │   ├── leitor.js
    │   └── livro-detalhe.js
    ├── pages/
    │   ├── index.html
    │   ├── login.html
    │   ├── cadastro.html
    │   ├── sucesso.html
    │   ├── admin.html
    │   ├── acervo.html
    │   ├── leitor.html
    │   ├── livro-detalhe.html
    │   └── politica-privacidade.html
    └── vercel.json
```

## Endpoints da API

### Autenticação

| Método | Rota | Descrição | Autenticação |
|--------|------|-----------|--------------|
| POST | `/api/auth/register` | Cadastro de usuário | Não |
| POST | `/api/auth/login` | Login | Não |
| POST | `/api/auth/logout` | Logout (limpa cookie) | Não |
| GET | `/api/auth/me` | Dados do usuário autenticado | JWT |
| PUT | `/api/auth/me` | Atualizar dados do titular | JWT |
| DELETE | `/api/auth/me` | Excluir própria conta | JWT |
| PATCH | `/api/auth/me/accept-consent` | Aceitar consentimento LGPD | JWT |
| PATCH | `/api/auth/me/revoke-consent` | Revogar consentimento LGPD | JWT |

### Usuários (somente admin)

| Método | Rota | Descrição | Autenticação |
|--------|------|-----------|--------------|
| GET | `/api/users` | Listar usuários | JWT + admin |
| POST | `/api/users` | Criar usuário | JWT + admin |
| PUT | `/api/users/:id` | Atualizar usuário | JWT + admin |
| DELETE | `/api/users/:id` | Deletar usuário | JWT + admin |

### Acervo

| Método | Rota | Descrição | Autenticação |
|--------|------|-----------|--------------|
| GET | `/api/books` | Listar livros | Não |
| GET | `/api/books/:id` | Buscar livro por ID | Não |
| POST | `/api/books` | Cadastrar livro | JWT + admin |
| PUT | `/api/books/:id` | Atualizar livro | JWT + admin |
| DELETE | `/api/books/:id` | Excluir livro | JWT + admin |

## Como executar

### Pré-requisitos
- Node.js 18+
- MongoDB (local ou Atlas)

### Backend

```bash
cd backend
npm install
```

Crie um arquivo `.env` na pasta `backend/` com base no `.env.example`:

```env
PORT=3000
MONGODB_URI=mongodb+srv://<usuario>:<senha>@<cluster>.mongodb.net/<banco>?appName=<app>
JWT_SECRET=<string-aleatoria-minimo-32-caracteres>
ALLOWED_ORIGINS=http://localhost:5500,http://127.0.0.1:5500
NODE_ENV=development
```

```bash
npx nodemon server.js   # desenvolvimento (hot-reload)
# ou
node server.js
```

### Frontend

Abra os arquivos da pasta `frontend/pages/` com qualquer servidor estático (ex: Live Server no VSCode) ou faça deploy na Vercel — o `vercel.json` já configura o roteamento das páginas.

### Deploy (Vercel + Render / Railway)

1. **Frontend** — conecte o repositório na Vercel apontando a pasta `frontend/` como root.
2. **Backend** — faça deploy em qualquer plataforma Node.js (Render, Railway, etc.) e configure as variáveis de ambiente acima.
3. Atualize `ALLOWED_ORIGINS` no backend com a URL gerada pelo deploy do frontend.

---

Desenvolvido como projeto da disciplina **Desenvolvimento de Plataforma Web — N695**.
