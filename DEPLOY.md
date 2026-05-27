# Deploy — ConectAguia

## Arquitetura de produção

```
GitHub Pages  ←  Frontend (Vite build estático)
Railway       ←  Backend (Docker) + PostgreSQL gerenciado
GHCR          ←  Registro da imagem Docker do backend
```

---

## 1. Preparar repositório GitHub

```bash
git init
git add .
git commit -m "feat: initial commit"
git remote add origin https://github.com/SEU_USUARIO/ConectAguia.git
git push -u origin main
```

---

## 2. Ativar GitHub Pages

1. Repositório → **Settings → Pages**
2. Source: **GitHub Actions**
3. Salvar

---

## 3. Criar projeto no Railway

1. Acesse [railway.app](https://railway.app) → **New Project**
2. **Provision PostgreSQL** → anote a `DATABASE_URL` gerada
3. **New Service → Empty Service** → nome: `backend`
4. Em **Settings → Source** do serviço backend: conectar ao repositório GitHub
5. Ou use o deploy via GitHub Actions (veja passo 5)

**Obter Railway Token:**
Railway → Account Settings → Tokens → **New Token**

---

## 4. Configurar Secrets no GitHub

Repositório → **Settings → Secrets and variables → Actions → New repository secret**

| Secret | Valor |
|--------|-------|
| `VITE_API_URL` | URL do backend Railway, ex: `https://backend-xxx.railway.app` |
| `VITE_BASE_PATH` | `/` (domínio próprio) ou `/ConectAguia/` (GitHub Pages padrão) |
| `RAILWAY_TOKEN` | Token gerado no Railway |

---

## 5. Configurar variáveis de ambiente no Railway

No serviço backend do Railway → **Variables**:

| Variável | Valor |
|----------|-------|
| `DATABASE_URL` | URL do PostgreSQL Railway (gerada automaticamente se usar Railway DB) |
| `JWT_SECRET` | string aleatória forte (min. 32 chars) |
| `JWT_EXPIRES_IN` | `8h` |
| `NODE_ENV` | `production` |
| `TERMS_VERSION` | `v1.0-teste` |
| `PORT` | `3001` |

---

## 6. Primeiro deploy manual (seed do gestor)

Após o backend estar rodando no Railway, execute o seed via Railway CLI:

```bash
npm install -g @railway/cli
railway login
railway run --service backend npx ts-node prisma/seed.ts
```

Isso cria o gestor inicial:
- **Email:** gestor@conectaguia.com.br
- **Senha:** admin123 ← **mude após o primeiro login**

---

## 7. Workflows automáticos

| Workflow | Trigger | O que faz |
|----------|---------|-----------|
| `ci.yml` | PR ou push em main | Type-check frontend + backend |
| `deploy-frontend.yml` | Push em main (frontend/) | Build Vite → GitHub Pages |
| `deploy-backend.yml` | Push em main (backend/) | Docker build → GHCR → Railway |

---

## 8. Desenvolvimento local

```bash
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3001
- DB: localhost:5432

---

## LGPD — Atualizar termos

1. Edite `frontend/src/pages/TermosPage.tsx` com o documento jurídico definitivo
2. Atualize `TERMS_VERSION` no Railway Variables (ex: `v1.0`)
3. Push → deploy automático
