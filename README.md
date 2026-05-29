# BiblioTeca

Sistema web de gestão de biblioteca com autenticação de usuários e painel administrativo.

## Sobre o projeto

O **BiblioTeca** é uma plataforma web fullstack que permite o gerenciamento de usuários de uma biblioteca. Conta com fluxo completo de autenticação (registro e login com JWT), painel administrativo protegido e conformidade com a LGPD.

## Funcionalidades

- Cadastro de usuários com consentimento LGPD
- Login com autenticação via JWT
- Painel administrativo (CRUD completo de usuários)
- Proteção de rotas por middleware de autenticação
- Busca de usuários em tempo real
- Hash de senha com bcrypt
- Logout e gerenciamento de sessão via localStorage

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
│       │   └── userController.js
│       ├── middleware/
│       │   └── authMiddleware.js
│       ├── models/
│       │   └── User.js
│       └── routes/
│           ├── authRoutes.js
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

| Método | Rota | Descrição | Autenticação |
|--------|------|-----------|--------------|
| POST | `/api/auth/register` | Cadastro de usuário | Não |
| POST | `/api/auth/login` | Login | Não |
| GET | `/api/users` | Listar usuários | JWT |
| POST | `/api/users` | Criar usuário | JWT |
| PUT | `/api/users/:id` | Atualizar usuário | JWT |
| DELETE | `/api/users/:id` | Deletar usuário | JWT |

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
