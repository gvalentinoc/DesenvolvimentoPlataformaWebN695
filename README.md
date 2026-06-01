# BiblioTeca

Sistema web de gestão de biblioteca com autenticação de usuários, painel administrativo e gerenciamento de acervo.

## Sobre o projeto

O **BiblioTeca** é uma plataforma web fullstack para gerenciamento de biblioteca. Conta com fluxo completo de autenticação (registro e login com JWT), painel administrativo protegido, CRUD de usuários e acervo de livros com busca, filtros por gênero, visualização em grid/lista e paginação.

## Funcionalidades

### Usuários
- Cadastro com consentimento LGPD
- Login com autenticação via JWT
- Hash de senha com bcrypt
- Logout e gerenciamento de sessão via localStorage

### Painel administrativo
- CRUD completo de usuários
- Busca de usuários em tempo real
- CRUD completo do acervo de livros
- Visualização em grid ou lista
- Filtros por gênero e disponibilidade
- Paginação client-side (12 livros por página)
- Modal de detalhe do livro com capa, sinopse e ações rápidas
- Proteção de rotas por middleware JWT

## Tecnologias

### Frontend
- HTML5, CSS3, Bootstrap 5
- Bootstrap Icons
- JavaScript (Axios para requisições HTTP)

### Backend
- Node.js + Express 5
- MongoDB + Mongoose
- JWT (jsonwebtoken)
- bcryptjs
- dotenv, cors, nodemon

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
│       │   ├── Book.js
│       │   └── User.js
│       └── routes/
│           ├── authRoutes.js
│           ├── bookRoutes.js
│           └── userRoutes.js
└── frontend/
    ├── css/
    │   └── styles.css
    ├── js/
    │   ├── auth.js
    │   └── admin.js
    └── pages/
        ├── index.html
        ├── login.html
        ├── cadastro.html
        ├── admin.html
        └── sucesso.html
```

## Endpoints da API

### Autenticação

| Método | Rota | Descrição | Autenticação |
|--------|------|-----------|--------------|
| POST | `/api/auth/register` | Cadastro de usuário | Não |
| POST | `/api/auth/login` | Login | Não |

### Usuários

| Método | Rota | Descrição | Autenticação |
|--------|------|-----------|--------------|
| GET | `/api/users` | Listar usuários | JWT |
| POST | `/api/users` | Criar usuário | JWT |
| PUT | `/api/users/:id` | Atualizar usuário | JWT |
| DELETE | `/api/users/:id` | Deletar usuário | JWT |

### Acervo

| Método | Rota | Descrição | Autenticação |
|--------|------|-----------|--------------|
| GET | `/api/books` | Listar livros | Não |
| GET | `/api/books/:id` | Buscar livro por ID | Não |
| POST | `/api/books` | Cadastrar livro | JWT |
| PUT | `/api/books/:id` | Atualizar livro | JWT |
| DELETE | `/api/books/:id` | Excluir livro | JWT |

## Como executar

### Pré-requisitos
- Node.js 18+
- MongoDB (local ou Atlas)

### Backend

```bash
cd backend
npm install
```

Crie um arquivo `.env` na pasta `backend/`:

```env
PORT=3000
MONGO_URI=sua_string_de_conexao_mongodb
JWT_SECRET=seu_segredo_jwt
```

```bash
npm run dev   # com nodemon (desenvolvimento)
# ou
node server.js
```

### Frontend

Abra os arquivos da pasta `frontend/pages/` diretamente no navegador ou sirva com qualquer servidor estático.

---

Desenvolvido como projeto da disciplina **Desenvolvimento de Plataforma Web — N695**.
