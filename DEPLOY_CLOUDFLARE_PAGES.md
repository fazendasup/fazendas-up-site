# Deploy no Cloudflare Pages

Este projeto usa Vite + React e gera arquivos estaticos em `dist/public`.

## 1) Criar projeto no Cloudflare Pages

1. Entre em **Workers & Pages** > **Create** > **Pages**.
2. Conecte o repositorio Git.
3. Configure:
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
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
