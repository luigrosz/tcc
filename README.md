# Form Maker

Aplicação fullstack composta por um backend (Bun + Express), frontend (React + Vite) e aplicativo mobile (Expo/React Native), com banco de dados PostgreSQL.

## Pré-requisitos

- [Docker](https://docs.docker.com/get-docker/) e Docker Compose
- [Bun](https://bun.sh/) (para rodar o backend localmente)
- [Node.js](https://nodejs.org/) + npm (para rodar o frontend localmente)
- [Expo CLI](https://docs.expo.dev/get-started/installation/) (para o mobile)

### Instalando o Bun

```bash
curl -fsSL https://bun.sh/install | bash
```

Após a instalação, reinicie o terminal e verifique:

```bash
bun --version
```

---

## Opção 1: Rodando com Docker (recomendado)

Essa opção sobe o banco de dados, backend e frontend automaticamente.

### 1. Configure o arquivo de ambiente do backend

```bash
cp backend/.env.example backend/.env
```

Edite `backend/.env` se necessário (por padrão já está configurado para funcionar com o Docker Compose).

### 2. Suba os serviços

```bash
docker compose up --build
```

Os serviços estarão disponíveis em:

| Serviço  | Endereço                  |
|----------|---------------------------|
| Backend  | http://localhost:3000     |
| Frontend | http://localhost:5173     |
| Banco    | localhost:5432            |

Para parar:

```bash
docker compose down
```

## Mobile (Expo)

### Pré-requisito: Expo CLI

```bash
npm install -g expo-cli
```

### Rodando o app

```bash
cd mobile
bun install
bun start
```
