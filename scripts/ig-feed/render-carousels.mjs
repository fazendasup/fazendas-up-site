#!/usr/bin/env node
/**
 * Instagram feed 4:5 (1080×1350) — 1 página por vaga, 3 slides no mesmo carrossel.
 *
 * Estratégia: tipografia + gaps escalam automaticamente até preencher o canvas
 * (sem vão em branco e sem overflow/sobreposição), com texto completo.
 */
import { chromium } from "playwright";
import { mkdir, writeFile, readFile, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const OUT = path.join(ROOT, "marketing/instagram-estagios");
const PUBLIC = path.join(ROOT, "client/public/instagram-estagios");
const SRC = path.join(OUT, "src");
const W = 1080;
const H = 1350;
const SCALE = 3;
const FONT_DIR = "/usr/share/fonts/truetype/macos";
const CACHE_BUST = Date.now().toString(36);

const JOBS = [
  {
    id: "admin",
    order: "01",
    role: "ADMIN",
    title: "Estágio em Administração",
    subtitle:
      "Apoie a gestão da Fazendas Up em Manaus: pedidos e clientes, notas e documentos, financeiro operacional e melhoria de processos.",
    cover: "admin-cover.jpg",
    subject: "Estágio Administração — Seu Nome",
    sobre: [
      "Apoio à gestão operacional, comercial e administrativa da unidade",
      "Rotina real de agroindústria B2B: pedido, entrega e cobrança",
      "Organização de documentos, notas e indicadores do dia a dia",
      "Jornada de até 6h/dia (30h/semana), compatível com a faculdade",
    ],
    atividades: [
      "Apoiar registro de pedidos, agenda de entregas e carteira de clientes",
      "Organizar notas fiscais, comprovantes, contratos e arquivos digitais",
      "Auxiliar na conciliação financeira básica (pedido × entrega × pagamento)",
      "Apoiar contas a pagar/receber, fluxo de caixa semanal e indicadores",
      "Mapear e padronizar processos administrativos entre áreas",
      "Apoiar compras de insumos, cotações e controle de materiais",
    ],
    requisitos: [
      "Cursando Administração, Processos Gerenciais, Gestão Comercial/Financeira ou correlatos",
      "Preferencialmente a partir do 4º período",
      "Disponibilidade presencial em Manaus",
      "Boa organização, Excel/planilhas e atenção a detalhes",
      "Interesse em operações, financeiro e gestão de processos",
    ],
    beneficios: ["Bolsa R$ 800", "VT", "Refeição", "Seguro", "Aprendizado prático"],
  },
  {
    id: "cultivo",
    order: "02",
    role: "CULTIVO",
    title: "Estágio em Cultivo e Hidroponia",
    subtitle:
      "Atue na fazenda vertical da Fazendas Up, em Manaus: produção de hortaliças, baby leaf e microverdes em sistema hidropônico.",
    cover: "cultivo-cover.jpg",
    subject: "Estágio Cultivo/Hidroponia — Seu Nome",
    sobre: [
      "Setor de cultivo e estrutura hidropônica em Manaus/AM",
      "Operação B2B para restaurantes, mercados e food service",
      "Ambiente controlado: torres, LED, recirculação e clima",
      "Jornada de até 6h/dia (30h/semana), compatível com a faculdade",
    ],
    atividades: [
      "Apoiar manejo diário de alfaces, baby leaf, microverdes e ervas",
      "Monitorar solução nutritiva, EC, pH e rotinas de fertirrigação",
      "Acompanhar clima, irrigação, torres e desempenho produtivo",
      "Registrar produtividade, ciclos e ocorrências fitossanitárias",
      "Apoiar boas práticas agrícolas e padronização de POPs/FIT",
    ],
    requisitos: [
      "Cursando Agronomia, Eng. Agrícola, Biossistemas ou correlatos",
      "Preferencialmente a partir do 4º período",
      "Disponibilidade presencial em Manaus",
      "Interesse em hidroponia, cultivo protegido e hortaliças",
      "Organização, atenção a detalhes e perfil hands-on",
    ],
    beneficios: ["Bolsa R$ 800", "VT", "Refeição", "Seguro de acidentes", "Aprendizado prático"],
  },
  {
    id: "qualidade",
    order: "03",
    role: "QUALIDADE",
    title: "Estágio em Processamento e Qualidade",
    subtitle:
      "Atue no pós-colheita e na qualidade da Fazendas Up: processamento de hortaliças, BPF e segurança alimentar.",
    cover: "qualidade-cover.jpg",
    subject: "Estágio Processamento/Qualidade — Seu Nome",
    sobre: [
      "Setor de processamento, qualidade e segurança de alimentos",
      "Hortaliças e legumes da fazenda vertical, do cultivo ao produto entregue",
      "Foco em padrão visual, higiene, vida útil e rastreabilidade de lotes",
      "Jornada de até 6h/dia (30h/semana), compatível com a faculdade",
    ],
    atividades: [
      "Apoiar rotinas de pós-colheita e processamento de hortaliças/legumes",
      "Auxiliar na aplicação de BPF, POP e controles de higiene",
      "Acompanhar inspeção de qualidade de matéria-prima e produto acabado",
      "Apoiar registros, checklists, não conformidades e indicadores",
      "Contribuir com padronização de processos e segurança dos alimentos",
    ],
    requisitos: [
      "Cursando Eng. de Alimentos, CTA, Nutrição (qualidade) ou correlatos",
      "Preferencialmente a partir do 4º período",
      "Disponibilidade presencial em Manaus",
      "Interesse em BPF, qualidade e processamento de hortaliças",
      "Organização, disciplina e atenção a detalhes",
    ],
    beneficios: ["Bolsa R$ 800", "VT", "Refeição", "Seguro de acidentes", "Aprendizado prático"],
  },
];

function esc(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function bullets(items) {
  return items
    .map((t) => `<li><span class="dot" aria-hidden="true"></span><span>${esc(t)}</span></li>`)
    .join("");
}

function chips(items) {
  return items.map((t) => `<span class="chip">${esc(t)}</span>`).join("");
}

function slidePage(job, coverDataUri, index, total) {
  return `<!doctype html>
<html><head><meta charset="utf-8">
<style>
@font-face{font-family:'Inter';src:url('file://${FONT_DIR}/Inter-Regular.ttf') format('truetype');font-weight:400}
@font-face{font-family:'Inter';src:url('file://${FONT_DIR}/Inter-Medium.ttf') format('truetype');font-weight:500}
@font-face{font-family:'Inter';src:url('file://${FONT_DIR}/Inter-SemiBold.ttf') format('truetype');font-weight:600}
@font-face{font-family:'Inter';src:url('file://${FONT_DIR}/Inter-Bold.ttf') format('truetype');font-weight:700}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:${W}px;height:${H}px;overflow:hidden;background:#0d241e}
body{font-family:'Inter',system-ui,sans-serif;-webkit-font-smoothing:antialiased;text-rendering:geometricPrecision}
.slide{
  width:${W}px;height:${H}px;display:grid;
  grid-template-rows: 300px 1fr 118px;
  background:#f5f3ee;overflow:hidden;
}
:root{
  --green:#1ab37f;--green-soft:#d2f3e5;--ink:#0e1b15;--muted:#3d4f47;--footer:#0d241e;
  --s:1;
}
.hero{position:relative;overflow:hidden;background:#12332a}
.hero img{width:100%;height:100%;object-fit:cover;object-position:center 42%;display:block}
.hero::after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(6,24,18,.58) 0%,rgba(6,24,18,.1) 45%,rgba(6,24,18,.75) 100%)}
.hero-top,.hero-bottom{position:absolute;left:34px;right:34px;z-index:2}
.hero-top{top:26px;display:flex;justify-content:space-between;align-items:center}
.hero-bottom{bottom:22px;display:flex;gap:10px;align-items:center}
.brand{font-weight:800;font-size:22px;letter-spacing:.04em;color:#fff}
.brand span{font-weight:500;opacity:.92}
.badge,.role-pill{
  display:inline-flex;align-items:center;justify-content:center;
  background:var(--green);color:#062419;font-weight:800;
  padding:10px 16px;border-radius:999px;letter-spacing:.04em;font-size:16px;line-height:1;
}
.body{
  min-height:0;overflow:hidden;
  display:flex;flex-direction:column;justify-content:space-between;
  padding: calc(18px * var(--s)) calc(34px * var(--s)) calc(16px * var(--s));
  gap: calc(10px * var(--s));
}
.kicker{font-size:calc(14px * var(--s));font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--green);margin-bottom:calc(6px * var(--s))}
h1{font-size:calc(${job.title.length > 32 ? 34 : 40}px * var(--s));line-height:1.05;font-weight:800;color:var(--ink);letter-spacing:-.025em;margin-bottom:calc(8px * var(--s))}
.lead{font-size:calc(18px * var(--s));line-height:1.3;color:var(--muted);font-weight:500}
.cols{display:grid;grid-template-columns:1fr 1fr;gap:calc(18px * var(--s));align-items:start}
.section h2{
  font-size:calc(13px * var(--s));font-weight:800;color:var(--green);letter-spacing:.08em;
  text-transform:uppercase;margin-bottom:calc(7px * var(--s));
}
ul{list-style:none;display:flex;flex-direction:column;gap:calc(6px * var(--s))}
li{display:flex;gap:calc(9px * var(--s));align-items:flex-start;font-size:calc(16px * var(--s));line-height:1.28;color:var(--ink);font-weight:500}
.dot{width:calc(7px * var(--s));height:calc(7px * var(--s));border-radius:50%;background:var(--green);margin-top:calc(6px * var(--s));flex:0 0 auto}
.chips{display:flex;flex-wrap:wrap;gap:calc(8px * var(--s))}
.chip{background:var(--green-soft);color:#0a5a40;font-weight:800;font-size:calc(15px * var(--s));padding:calc(9px * var(--s)) calc(13px * var(--s));border-radius:999px}
.apply{
  background:#e6f6ed;border-radius:calc(14px * var(--s));padding:calc(12px * var(--s)) calc(14px * var(--s));
  font-size:calc(16px * var(--s));line-height:1.32;color:var(--muted);font-weight:500;
}
.apply b{color:var(--ink);font-weight:800}
.apply .email{color:var(--green);font-weight:800}
.footer{
  background:var(--footer);color:#fff;
  display:flex;align-items:center;justify-content:space-between;padding:0 34px;
}
.footer .cta{font-size:26px;font-weight:800;line-height:1}
.footer .mail{color:var(--green);font-size:17px;font-weight:800;margin-top:5px}
.footer .meta{font-size:13px;opacity:.9;margin-top:6px;font-weight:500}
</style></head>
<body>
<div class="slide">
  <div class="hero">
    <img src="${coverDataUri}" alt="" />
    <div class="hero-top">
      <div class="brand">FAZENDAS UP <span>· Manaus / AM</span></div>
      <div class="brand" style="font-size:18px;opacity:.9">${index}/${total}</div>
    </div>
    <div class="hero-bottom">
      <div class="badge">VAGA DE ESTÁGIO</div>
      <div class="role-pill">${esc(job.role)}</div>
    </div>
  </div>

  <div class="body">
    <header>
      <div class="kicker">Carrossel · vaga ${index} de ${total}</div>
      <h1>${esc(job.title)}</h1>
      <p class="lead">${esc(job.subtitle)}</p>
    </header>

    <div class="cols">
      <section class="section">
        <h2>Sobre a vaga</h2>
        <ul>${bullets(job.sobre)}</ul>
      </section>
      <section class="section">
        <h2>Atividades</h2>
        <ul>${bullets(job.atividades)}</ul>
      </section>
    </div>

    <section class="section">
      <h2>Requisitos</h2>
      <ul>${bullets(job.requisitos)}</ul>
    </section>

    <section class="section">
      <h2>O que oferecemos</h2>
      <div class="chips">${chips(job.beneficios)}</div>
    </section>

    <div class="apply">
      <b>Como se candidatar:</b> envie currículo + curso/período para
      <span class="email">comercial@visioneer.com.br</span>
      com o assunto: <b>${esc(job.subject)}</b>
    </div>
  </div>

  <div class="footer">
    <div>
      <div class="cta">Candidate-se</div>
      <div class="mail">comercial@visioneer.com.br</div>
      <div class="meta">www.fazendasup.com.br · WhatsApp (92) 98404-0397</div>
    </div>
    <div class="role-pill">${esc(job.role)}</div>
  </div>
</div>
</body></html>`;
}

function galleryHtml() {
  const cards = JOBS.map(
    (j) => `
    <a class="card" href="${j.order}-${j.id}.jpg?v=${CACHE_BUST}" download="${j.order}-${j.id}.jpg">
      <img src="${j.order}-${j.id}.jpg?v=${CACHE_BUST}" alt="${esc(j.title)}" loading="lazy" />
      <div class="meta">${j.order}/03 · ${esc(j.role)}<small>${esc(j.title)} — Salvar</small></div>
    </a>`,
  ).join("");

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
  <title>Fazendas Up — Carrossel Instagram Estágio</title>
  <style>
    :root { --green:#1ab37f; --ink:#102018; --bg:#f4f1ea; }
    *{box-sizing:border-box}
    body{margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:var(--bg);color:var(--ink);padding:20px 16px 48px;line-height:1.4}
    h1{font-size:1.35rem;margin:0 0 6px}
    .sub{color:#4d5c56;margin:0 0 16px;font-size:.95rem}
    .tip{background:#d8f5e9;color:#0b5c42;padding:12px 14px;border-radius:12px;font-size:.9rem;margin-bottom:22px}
    .grid{display:grid;grid-template-columns:1fr;gap:14px;max-width:420px}
    a.card{display:block;background:#fff;border-radius:14px;overflow:hidden;text-decoration:none;color:inherit;border:1px solid #e4ebe7}
    a.card img{width:100%;aspect-ratio:4/5;object-fit:cover;display:block;background:#ddd}
    a.card .meta{padding:12px;font-size:.9rem;font-weight:700}
    a.card .meta small{display:block;font-weight:500;color:#4d5c56;margin-top:3px}
  </style>
</head>
<body>
  <h1>Carrossel Instagram — 3 vagas</h1>
  <p class="sub">Feed 4:5 (1080×1350). Um post, 3 slides. Ordem: Admin → Cultivo → Qualidade.</p>
  <div class="tip">
    Versão nova (${CACHE_BUST}). Feche a aba antiga e abra este link de novo.<br/>
    Salve as 3 imagens e publique como <b>um carrossel</b> no feed.
  </div>
  <div class="grid">${cards}</div>
</body>
</html>`;
}

async function toDataUri(filePath) {
  const buf = await readFile(filePath);
  return `data:image/jpeg;base64,${buf.toString("base64")}`;
}

async function fitScale(page) {
  // Binary search --s so content fills body without overflowing
  let lo = 0.92;
  let hi = 1.55;
  let best = 1;
  for (let i = 0; i < 14; i++) {
    const mid = (lo + hi) / 2;
    await page.evaluate((s) => {
      document.documentElement.style.setProperty("--s", String(s));
    }, mid);
    await page.waitForTimeout(20);
    const m = await page.evaluate(() => {
      const body = document.querySelector(".body");
      const apply = document.querySelector(".apply");
      const footer = document.querySelector(".footer");
      const overflow = body.scrollHeight > body.clientHeight + 1;
      const leftover = body.clientHeight - body.scrollHeight;
      const clipped = apply.getBoundingClientRect().bottom > footer.getBoundingClientRect().top + 0.5;
      return { overflow: overflow || clipped, leftover, scroll: body.scrollHeight, client: body.clientHeight };
    });
    if (m.overflow) {
      hi = mid;
    } else {
      best = mid;
      // Prefer filling: if leftover still large, try larger scale
      if (m.leftover > 28) lo = mid;
      else break;
    }
  }
  await page.evaluate((s) => {
    document.documentElement.style.setProperty("--s", String(s));
  }, best);
  await page.waitForTimeout(30);
  const final = await page.evaluate(() => {
    const body = document.querySelector(".body");
    const apply = document.querySelector(".apply");
    const footer = document.querySelector(".footer");
    return {
      overflow: body.scrollHeight > body.clientHeight + 1,
      leftover: body.clientHeight - body.scrollHeight,
      clipped: apply.getBoundingClientRect().bottom > footer.getBoundingClientRect().top + 0.5,
      s: getComputedStyle(document.documentElement).getPropertyValue("--s").trim(),
    };
  });
  if (final.overflow || final.clipped) {
    throw new Error(`Fit failed: ${JSON.stringify(final)}`);
  }
  return final;
}

async function renderSlide(page, html, outPath) {
  await page.setContent(html, { waitUntil: "load" });
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(
      [...document.images].map((img) =>
        img.complete && img.naturalWidth > 0
          ? Promise.resolve()
          : new Promise((res, rej) => {
              img.onload = res;
              img.onerror = () => rej(new Error("img failed"));
            }),
      ),
    );
  });
  const fit = await fitScale(page);
  console.log("  fit", path.basename(outPath), fit);
  await page.screenshot({
    path: outPath,
    type: "jpeg",
    quality: 95,
    clip: { x: 0, y: 0, width: W, height: H },
  });
}

async function main() {
  for (const id of ["admin", "cultivo", "qualidade"]) {
    await rm(path.join(OUT, id), { recursive: true, force: true });
    await rm(path.join(PUBLIC, id), { recursive: true, force: true });
  }
  await mkdir(OUT, { recursive: true });
  await mkdir(PUBLIC, { recursive: true });

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--font-render-hinting=none"],
  });
  const page = await browser.newPage({
    viewport: { width: W, height: H },
    deviceScaleFactor: SCALE,
  });

  const total = JOBS.length;
  for (let i = 0; i < JOBS.length; i++) {
    const job = JOBS[i];
    const coverDataUri = await toDataUri(path.join(SRC, job.cover));
    const html = slidePage(job, coverDataUri, i + 1, total);
    const name = `${job.order}-${job.id}`;
    console.log("ok", name);
    await renderSlide(page, html, path.join(OUT, `${name}@2x.jpg`));
  }
  await browser.close();

  const py = `
from PIL import Image
from pathlib import Path
root = Path(${JSON.stringify(OUT)})
public = Path(${JSON.stringify(PUBLIC)})
public.mkdir(parents=True, exist_ok=True)
for p in sorted(root.glob('*@2x.jpg')):
    im = Image.open(p).convert('RGB')
    out = p.with_name(p.name.replace('@2x.jpg', '.jpg'))
    im.resize((1080, 1350), Image.Resampling.LANCZOS).save(out, quality=97, subsampling=0, optimize=True)
    Image.open(out).save(public / out.name, quality=97, subsampling=0, optimize=True)
    p.unlink()
    print('downscale', out.name, Image.open(out).size)
`;
  const r = spawnSync("python3", ["-c", py], { encoding: "utf8" });
  if (r.status !== 0) {
    console.error(r.stdout, r.stderr);
    process.exit(1);
  }
  console.log(r.stdout);

  await writeFile(path.join(PUBLIC, "index.html"), galleryHtml(), "utf8");
  await writeFile(
    path.join(OUT, "README.md"),
    `# Carrossel Instagram — Vagas de Estágio

Feed **4:5 (1080×1350)**. Um post, 3 slides, texto completo, tipografia auto-ajustada para preencher o quadro.

1. \`01-admin.jpg\`
2. \`02-cultivo.jpg\`
3. \`03-qualidade.jpg\`

\`\`\`bash
node scripts/ig-feed/render-carousels.mjs
\`\`\`
`,
    "utf8",
  );
  const caption = `🌱 FAZENDAS UP — Vagas de estágio em Manaus

Um carrossel, 3 vagas. Arraste →

1️⃣ Administração
2️⃣ Cultivo e Hidroponia
3️⃣ Processamento e Qualidade

Bolsa R$ 800 + VT + refeição + seguro
Jornada até 6h/dia (30h/semana) · Presencial em Manaus

Candidate-se: currículo + curso/período para comercial@visioneer.com.br
WhatsApp (92) 98404-0397 · www.fazendasup.com.br
`;
  await writeFile(path.join(OUT, "legenda-instagram.txt"), caption);
  await writeFile(path.join(PUBLIC, "legenda-instagram.txt"), caption);
  console.log("Done", CACHE_BUST);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
