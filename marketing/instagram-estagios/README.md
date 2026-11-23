# Carrosséis Instagram — Vagas de Estágio

Artes no formato **feed Instagram 4:5** (`1080 × 1350` px), JPEG alta qualidade.

As artes originais estavam em `1080 × 1920` (Stories / 9:16). No feed o Instagram corta para no máximo 4:5 — por isso saíam cortadas e com aparência de baixa qualidade.

## Como publicar

Poste cada vaga como **carrossel** (4 imagens, nesta ordem):

| Pasta | Vaga |
|-------|------|
| `admin/` | Estágio em Administração |
| `cultivo/` | Estágio em Cultivo e Hidroponia |
| `qualidade/` | Estágio em Processamento e Qualidade |

Ordem dos slides:

1. `01-capa.jpg` — foto + título  
2. `02-sobre-atividades.jpg` — sobre a vaga + atividades  
3. `03-requisitos-beneficios.jpg` — requisitos + benefícios  
4. `04-candidatura.jpg` — como se candidatar + contatos  

## Regenerar

```bash
node scripts/ig-feed/render-carousels.mjs
```

Requer Playwright + Chromium e as capas em `src/*-cover.jpg`.
