# Deploy no Cloudflare Pages

Este projeto usa Vite + React e gera arquivos estaticos em `dist/public`.

## Por que “nao faz deploy”?

1. **Nenhum pipeline ligado ao repo** — ate criar o projeto no Cloudflare *(ou outro host)* e conectar o Git, **push na branch nao publica site**. Este repo inclui **GitLab CI** (`.gitlab-ci.yml`) e **GitHub Actions** (`.github/workflows/ci.yml`) so para **compilar e guardar artefactos**; o upload ao Pages continua a ser na dashboard Cloudflare ou via Wrangler.
2. **Build a falhar no Cloudflare** — veja logs do ultimo deploy. Requisitos abaixo (Node 20, comando de install, pasta de saida).
3. **Branch errada** — o Pages por defeito faz deploy so da branch principal (`main` / `production`). Confira **Settings > Builds & deployments**.

## 1) Criar projeto no Cloudflare Pages

1. Entre em **Workers & Pages** > **Create** > **Pages**.
2. Conecte o repositorio Git.
3. Configure:
   - **Framework preset**: `Vite` (ou None)
   - **Environment variables** (Build): `NODE_VERSION` = `20`
   - **Build command**: `npm run build` *(se usar npm no Pages)*  
     OU, se preferir lockfile do pnpm:  
     **Install command**: `corepack enable && corepack prepare pnpm@10.4.1 --activate && pnpm install --frozen-lockfile`  
     **Build command**: `pnpm run build`
   - **Build output directory**: `dist/public`
   - **Root directory**: `/` (raiz do repo)

## 2) Variaveis de ambiente

No Cloudflare Pages, adicione em **Settings > Environment variables**:

- `VITE_API_URL=https://SEU-APP-NO-RAILWAY.up.railway.app`

Use o dominio publico real do Railway.

## 3) SPA fallback (rotas React)

Ja foi adicionado o arquivo `client/public/_redirects` com:

`/* /index.html 200`

Isso evita erro 404 ao abrir rotas internas diretamente.

## 4) CORS no Railway

No backend do Railway, libere o dominio do frontend:

- `https://SEU-DOMINIO.com`
- `https://SEU-PROJETO.pages.dev`

## 5) Dominio proprio

No Cloudflare Pages:

1. **Custom domains** > **Set up a custom domain**.
2. Aponte DNS no proprio Cloudflare.
3. SSL/TLS fica automatico.

## 6) Validacao final

- Acessar home e navegar por todas as secoes.
- Recarregar em uma rota interna (nao pode dar 404).
- Validar chamadas para API do Railway no browser devtools.
