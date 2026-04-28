# Como trocar fotos do site

## HEIC (iPhone / fotos Apple)

Os navegadores **não mostram** ficheiros `.heic` em `<img src="...">`. O site espera **JPEG ou WebP** (por exemplo `IMG_0073.jpg`).

1. Copie o `.HEIC` para `client/public/uploads/` (ex.: `IMG_0073.HEIC`).
2. Na raiz do projeto: `npm run img:heic` (por defeito converte `uploads/IMG_0073.HEIC` → `IMG_0073.jpg`).
3. **Todos** os `.heic` em `uploads/` que ainda não tiverem `.jpg` homónimo: `npm run img:heic:all`.
4. Outro ficheiro: `node scripts/convert-heic-to-jpg.mjs "client/public/uploads/Outro.HEIC"`

### Ficheiros usados em `siteImages` (pasta `client/public/uploads/`)

| Chave / uso | Ficheiro referenciado | Nota |
|-------------|------------------------|------|
| Hero | `amazon-river-4k-jungle-wild-nature-bends-of-river.jpg` | |
| Tecnologia 01–04 | `DSC_0229.jpg`, `IMG_0073.jpg`, `IMG_6915.jpg`, `DSC_9912.jpg` | Se só existir `.HEIC`, correr `img:heic:all` ou converter esse ficheiro. |
| Cultivos 01–03 | `DSC_7134.jpg`, `IMG_7964.jpg`, `IMG_3041.PNG` | `IMG_7964` existia só em HEIC: gera `IMG_7964.jpg` com o script. `IMG_3041` está em **PNG** (não `.jpg`). |

---

1. Adicione suas imagens em `client/public/uploads/`.
   - A capa padrão é `amazon-river-4k-jungle-wild-nature-bends-of-river.jpg` em `uploads/` (ou use `VITE_IMG_HERO` no `.env`).
2. Copie `.env.example` para `.env`.
3. Preencha apenas as variaveis que deseja trocar, por exemplo:

VITE_IMG_HERO=/uploads/hero.jpg
VITE_IMG_TECH_STEP1=/uploads/DSC_0229.jpg
VITE_IMG_TECH_STEP2=/uploads/IMG_0073.jpg
VITE_IMG_TECH_STEP3=/uploads/IMG_6915.jpg
VITE_IMG_TECH_STEP4=/uploads/DSC_9912.jpg
# Opcional: VITE_IMG_TECH_PRIMARY e VITE_IMG_TECH_SECONDARY ainda preenchem STEP1 e STEP2 se os STEP* estiverem vazios.

4. Rode `npm run dev` novamente.

Se alguma variavel nao for preenchida, o site usa a imagem padrao automaticamente.
