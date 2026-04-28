# Fazendas Up — Contexto para Cursor

## Resumo do Projeto

Site informativo inovador para a **Fazendas Up**, uma agroindústria sustentável de cultivo vertical em Manaus, Amazônia. O design é editorial, sofisticado e cinematográfico, com transições integradas entre seções durante o scroll.

## Design & Filosofia

**Estilo:** Editorial Sofisticado — Cinematic Scroll
- **Tipografia:** Inter Tight (sans-serif moderna) + Newsreader italic (destaques)
- **Paleta:** Off-white papel (#FDFBF7), Verde-floresta (#3F5D34), Clay (#A67C52), Ink preto (#1A1A1A)
- **Animações:** Parallax, sticky pins, fade-ups ao scroll, transições curvas entre seções
- **Fotos:** Reais da Amazônia e fazenda vertical (não geradas por IA)

## Estrutura de Seções

1. **Hero** — Foto aérea da Amazônia, parallax cinematográfico, transição suave para próxima seção
2. **Bridge** — Intermezzo tipográfico: palavras revelam-se ao scroll ("Uma fazenda vertical...")
3. **Tecnologia** — Rolagem horizontal pinada com 4 princípios (sementes, hidroponia, LED, ambiente)
4. **Impacto** — Título sticky + métricas em fade-up (−95% água, −80% carbono, etc.)
5. **Produtos** — Spreads editoriais alternados: Microverdes, Alfaces, Flores (imagem + texto)
6. **B2B (ForChefs)** — Seção de parcerias com benefícios em grid hairline
7. **Manifesto** — Fotografia em parallax sticky + conteúdo editorial em camadas
8. **Contato** — CTA com onda SVG conectando, footer institucional

## Componentes Principais

```
client/src/components/
├── Hero.tsx                 # Hero com pin/parallax
├── Bridge.tsx              # Intermezzo tipográfico
├── TechnologySection.tsx   # Horizontal scroll pin (4 passos)
├── ImpactSection.tsx       # Sticky title + fade-up cards
├── CultivosSection.tsx     # Spreads editoriais alternados
├── ForChefsSection.tsx     # B2B com parallax imagem
├── ManifestoSection.tsx    # Sticky foto + conteúdo em camadas
├── ContactFooter.tsx       # Contato + footer
├── SiteHeader.tsx          # Header transparente → fundo ao scroll
├── ScrollProgress.tsx      # Indicador vertical de capítulos
└── ui/                     # shadcn/ui components
```

## Hooks Customizados

- `useSectionProgress.ts` — Rastreia scroll dentro de uma seção (0 a 1)
- `useComposition.ts` — Utilitário para composição de classes
- `useMobile.tsx` — Detecta viewport mobile

## Design Tokens (index.css)

- **Cores:** `--primary`, `--secondary`, `--accent`, `--muted`, `--forest`, `--clay`, `--ink`, `--paper`
- **Tipografia:** `font-display` (Newsreader italic), `font-sans` (Inter Tight)
- **Spacing:** Tailwind padrão (4px base)
- **Animações:** Framer Motion (useScroll, useTransform, motion.*)

## Imagens (URLs webdev)

Todas as imagens foram feitas upload para o webdev storage:
- Hero Amazônia: `/manus-storage/amazon_hero_*.jpg`
- Tecnologia: `/manus-storage/vertical_farm_tech_*.jpg`
- Produtos: `/manus-storage/microgreens_real_*.jpg`, `lettuce_hydroponic_*.jpg`, `edible_flowers_*.jpg`
- Manifesto: `/manus-storage/amazon_about_*.jpg`

## Próximas Melhorias Sugeridas

1. **Vídeo institucional** — Adicionar player em loop na seção Manifesto
2. **Tela de intro** — Fade do logo + revelação do hero
3. **Página Clube de Assinatura** — Planos e formulário de captura
4. **Cursor customizado** — Muda em áreas interativas
5. **Formulário de contato funcional** — Requer upgrade web-db-user

## Comandos Úteis

```bash
# Dev
pnpm dev

# Build
pnpm build

# Check tipos
pnpm check

# Format
pnpm format
```

## Notas Importantes

- **Não editar** `server/` — projeto é static-only
- **Imagens locais** devem ser feitas upload via `manus-upload-file --webdev`
- **Não adicionar** imagens em `client/public/` (causa timeout no deploy)
- **Manter** design tokens em `index.css` — não hardcode cores
- **Usar** `motion.div` do framer-motion para animações scroll-driven
- **Testar** em mobile — design é responsive-first

## Checkpoint Atual

**Version:** `977560b0`
**Status:** Sofisticação editorial completa + correção do trecho preto vazio

Última mudança: Adicionado conteúdo editorial em camadas na seção Manifesto para preencher o espaço abaixo da fotografia pinada.

---

**Contato:** Para dúvidas sobre o design ou estrutura, consulte este documento ou a pasta `/home/ubuntu/fazendas_up/`.
