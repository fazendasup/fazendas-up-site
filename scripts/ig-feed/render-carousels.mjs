#!/usr/bin/env node
/**
 * Render Fazendas Up internship posts for Instagram feed (4:5 / 1080×1350).
 * One slide per vacancy — all three go in the same carousel post.
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
const SCALE = 2;
const FONT_DIR = "/usr/share/fonts/truetype/macos";

const JOBS = [
  {
    id: "admin",
    order: "01",
    role: "ADMIN",
    title: "Estágio em Administração",
    subtitle:
      "Apoie a gestão em Manaus: pedidos e clientes, notas e documentos, financeiro operacional e melhoria de processos.",
    cover: "admin-cover.jpg",
    subject: "Estágio Administração — Seu Nome",
    sobre: [
      "Apoio às unidades operacional, comercial e administrativa",
      "Rotina B2B de agroindústria em Manaus",
      "Organização de documentos, notas e registros",
      "Até 6h/dia (30h/semana), compatível com a faculdade",
    ],
    atividades: [
      "Cadastro e acompanhamento de pedidos e clientes",
      "Organizar NF-e, contratos e documentos",
      "Conciliação financeira e contas a pagar/receber",
      "Mapear processos e apoiar compras",
    ],
    requisitos: [
      "Cursando Administração, Processos Gerenciais, Gestão ou correlatos",
      "Preferencialmente a partir do 4º período · presencial em Manaus",
      "Excel, organização e interesse em operações/financeiro",
    ],
    beneficios: ["Bolsa R$ 800", "VT", "Refeição", "Seguro", "Aprendizado prático"],
  },
  {
    id: "cultivo",
    order: "02",
    role: "CULTIVO",
    title: "Estágio em Cultivo e Hidroponia",
    subtitle:
      "Atue na fazenda vertical em Manaus: hortaliças, baby leaf e microverdes em sistema hidropônico.",
    cover: "cultivo-cover.jpg",
    subject: "Estágio Cultivo/Hidroponia — Seu Nome",
    sobre: [
      "Cultivo e estrutura hidropônica em Manaus/AM",
      "Operação B2B: restaurantes, mercados e food service",
      "Ambiente controlado: torres, LED, recirculação e clima",
      "Até 6h/dia (30h/semana), compatível com a faculdade",
    ],
    atividades: [
      "Manejo de alfaces, baby leaf, microverdes e ervas",
      "Monitorar solução nutritiva, EC, pH e fertirrigação",
      "Acompanhar clima, irrigação e desempenho produtivo",
      "Registros de ciclo e apoio a POPs/FIT",
    ],
    requisitos: [
      "Cursando Agronomia, Eng. Agrícola, Biossistemas ou correlatos",
      "Preferencialmente a partir do 4º período · presencial em Manaus",
      "Interesse em hidroponia e perfil hands-on",
    ],
    beneficios: ["Bolsa R$ 800", "VT", "Refeição", "Seguro de acidentes", "Aprendizado prático"],
  },
  {
    id: "qualidade",
    order: "03",
    role: "QUALIDADE",
    title: "Estágio em Processamento e Qualidade",
    subtitle:
      "Pós-colheita e qualidade: processamento de hortaliças, BPF e segurança alimentar.",
    cover: "qualidade-cover.jpg",
    subject: "Estágio Processamento/Qualidade — Seu Nome",
    sobre: [
      "Processamento, qualidade e segurança de alimentos",
      "Da fazenda vertical ao produto entregue",
      "Padrão visual, higiene, vida útil e rastreabilidade",
      "Até 6h/dia (30h/semana), compatível com a faculdade",
    ],
    atividades: [
      "Rotinas de pós-colheita e processamento",
      "Aplicação de BPF, POP e controles de higiene",
      "Inspeção de matéria-prima e produto acabado",
      "Checklists, não conformidades e indicadores",
    ],
    requisitos: [
      "Cursando Eng. de Alimentos, CTA, Nutrição (qualidade) ou correlatos",
      "Preferencialmente a partir do 4º período · presencial em Manaus",
      "Interesse em BPF, qualidade e atenção a detalhes",
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
    .map((t) => `<li><span class="dot"></span><span>${esc(t)}</span></li>`)
    .join("");
}

function chips(items) {
  return items.map((t) => `<span class="chip">${esc(t)}</span>`).join("");
}

function baseCss() {
  return `
@font-face{font-family:'Inter';src:url('file://${FONT_DIR}/Inter-Regular.ttf') format('truetype');font-weight:400}
@font-face{font-family:'Inter';src:url('file://${FONT_DIR}/Inter-Medium.ttf') format('truetype');font-weight:500}
@font-face{font-family:'Inter';src:url('file://${FONT_DIR}/Inter-SemiBold.ttf') format('truetype');font-weight:600}
@font-face{font-family:'Inter';src:url('file://${FONT_DIR}/Inter-Bold.ttf') format('truetype');font-weight:700}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:${W}px;height:${H}px;overflow:hidden;background:#0d241e}
body{font-family:'Inter',system-ui,sans-serif;-webkit-font-smoothing:antialiased}
.slide{width:${W}px;height:${H}px;position:relative;overflow:hidden;background:#f6f4ef}
:root{
  --green:#1ab37f;
  --green-soft:#d8f5e9;
  --ink:#102018;
  --muted:#4d5c56;
  --footer:#0d241e;
}
.brand{font-weight:700;font-size:22px;letter-spacing:0.04em;color:#fff}
.brand span{font-weight:500;opacity:.9}
.badge{
  display:inline-flex;align-items:center;justify-content:center;
  background:var(--green);color:#062419;font-weight:700;font-size:16px;
  padding:8px 16px;border-radius:999px;letter-spacing:0.04em;
}
.role-pill{
  display:inline-flex;align-items:center;justify-content:center;
  background:var(--green);color:#062419;font-weight:800;font-size:16px;
  padding:10px 16px;border-radius:999px;letter-spacing:0.06em;
}
h1{font-size:34px;line-height:1.08;font-weight:800;color:var(--ink);letter-spacing:-0.02em}
h2{font-size:15px;font-weight:800;color:var(--green);letter-spacing:0.08em;text-transform:uppercase;margin-bottom:8px}
.lead{font-size:17px;line-height:1.3;color:var(--muted);font-weight:500}
ul{list-style:none;display:flex;flex-direction:column;gap:5px}
li{display:flex;gap:9px;align-items:flex-start;font-size:15.5px;line-height:1.28;color:var(--ink);font-weight:500}
.dot{width:7px;height:7px;border-radius:50%;background:var(--green);margin-top:6px;flex:0 0 auto}
.chips{display:flex;flex-wrap:wrap;gap:7px}
.chip{
  background:var(--green-soft);color:#0b5c42;font-weight:700;font-size:14px;
  padding:7px 12px;border-radius:999px;
}
.cols{display:grid;grid-template-columns:1fr 1fr;gap:18px}
.footer{
  position:absolute;left:0;right:0;bottom:0;height:118px;
  background:var(--footer);color:#fff;display:flex;align-items:center;justify-content:space-between;
  padding:0 36px;
}
.footer .cta{font-size:26px;font-weight:800;line-height:1}
.footer .mail{color:var(--green);font-size:16px;font-weight:700;margin-top:4px}
.footer .meta{font-size:13px;opacity:.85;margin-top:6px;font-weight:500}
`;
}

function slidePage(job, coverDataUri, index, total) {
  const titleSize = job.title.length > 30 ? 30 : 34;
  return `<!doctype html><html><head><meta charset="utf-8"><style>${baseCss()}
.hero{position:relative;height:310px;overflow:hidden;background:#12332a}
.hero img{width:100%;height:100%;object-fit:cover;object-position:center 42%;display:block}
.hero::after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(8,28,22,.55) 0%,rgba(8,28,22,.12) 45%,rgba(8,28,22,.7) 100%)}
.hero-top{position:absolute;left:36px;right:36px;top:28px;z-index:2;display:flex;justify-content:space-between;align-items:flex-start}
.hero-bottom{position:absolute;left:36px;bottom:22px;z-index:2;display:flex;gap:10px;align-items:center}
.body{padding:20px 36px 126px}
.head{margin-bottom:12px}
.slide-n{font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:var(--green);margin-bottom:6px}
.block{margin-top:11px}
.apply{margin-top:11px;font-size:14.5px;line-height:1.35;color:var(--muted);font-weight:500}
.apply b{color:var(--ink);font-weight:700}
.apply .email{color:var(--green);font-weight:800}
</style></head><body><div class="slide">
  <div class="hero">
    <img src="${coverDataUri}" alt="" />
    <div class="hero-top">
      <div class="brand">FAZENDAS UP <span>· Manaus / AM</span></div>
      <div class="brand" style="font-size:18px;opacity:.85">${index}/${total}</div>
    </div>
    <div class="hero-bottom">
      <div class="badge">VAGA DE ESTÁGIO</div>
      <div class="role-pill">${esc(job.role)}</div>
    </div>
  </div>
  <div class="body">
    <div class="head">
      <div class="slide-n">Carrossel · vaga ${index} de ${total}</div>
      <h1 style="font-size:${titleSize}px;margin-bottom:8px">${esc(job.title)}</h1>
      <p class="lead">${esc(job.subtitle)}</p>
    </div>
    <div class="cols">
      <div class="block">
        <h2>Sobre a vaga</h2>
        <ul>${bullets(job.sobre)}</ul>
      </div>
      <div class="block">
        <h2>Atividades</h2>
        <ul>${bullets(job.atividades)}</ul>
      </div>
    </div>
    <div class="block">
      <h2>Requisitos</h2>
      <ul>${bullets(job.requisitos)}</ul>
    </div>
    <div class="block">
      <h2>O que oferecemos</h2>
      <div class="chips">${chips(job.beneficios)}</div>
    </div>
    <div class="apply">
      <b>Como se candidatar:</b> currículo + curso/período para
      <span class="email">comercial@visioneer.com.br</span>
      · assunto: ${esc(job.subject)}
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
</div></body></html>`;
}

function galleryHtml() {
  const cards = JOBS.map(
    (j) => `
    <a class="card" href="${j.order}-${j.id}.jpg" download>
      <img src="${j.order}-${j.id}.jpg" alt="${esc(j.title)}" loading="lazy" />
      <div class="meta">${j.order}/03 · ${esc(j.role)}<small>${esc(j.title)} — Salvar</small></div>
    </a>`,
  ).join("");

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <title>Fazendas Up — Carrossel Instagram Estágio</title>
  <style>
    :root { --green:#1ab37f; --ink:#102018; --bg:#f6f4ef; }
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
  <p class="sub">Um único post com 3 slides (1080×1350). Ordem: Admin → Cultivo → Qualidade.</p>
  <div class="tip">
    Salve as 3 imagens nesta ordem e publique como <b>um carrossel</b> no feed.<br/>
    iPhone: toque → compartilhar → Salvar imagem. Android: toque e segure → Baixar.
  </div>
  <div class="grid">${cards}</div>
</body>
</html>`;
}

async function toDataUri(filePath) {
  const buf = await readFile(filePath);
  return `data:image/jpeg;base64,${buf.toString("base64")}`;
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
  await page.waitForTimeout(100);
  await page.screenshot({
    path: outPath,
    type: "jpeg",
    quality: 92,
    clip: { x: 0, y: 0, width: W, height: H },
  });
}

async function main() {
  // Clean old multi-slide folders
  for (const id of ["admin", "cultivo", "qualidade"]) {
    await rm(path.join(OUT, id), { recursive: true, force: true });
    await rm(path.join(PUBLIC, id), { recursive: true, force: true });
  }
  await mkdir(OUT, { recursive: true });
  await mkdir(PUBLIC, { recursive: true });

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
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
    const jpg2x = path.join(OUT, `${name}@2x.jpg`);
    await renderSlide(page, html, jpg2x);
    console.log("ok", name);
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
    assert im.size == (2160, 2700), (p, im.size)
    out = p.with_name(p.name.replace('@2x.jpg', '.jpg'))
    im.resize((1080, 1350), Image.Resampling.LANCZOS).save(out, quality=95, subsampling=0, optimize=True)
    # also copy to public
    dest = public / out.name
    Image.open(out).save(dest, quality=95, subsampling=0, optimize=True)
    p.unlink()
    print('downscale', out.name)
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

**Um único post** no feed, com **3 slides** (uma página por vaga), em **1080 × 1350** (4:5).

## Ordem do carrossel

1. \`01-admin.jpg\` — Estágio em Administração  
2. \`02-cultivo.jpg\` — Estágio em Cultivo e Hidroponia  
3. \`03-qualidade.jpg\` — Estágio em Processamento e Qualidade  

## Baixar pelo celular

Após o deploy do preview: \`/instagram-estagios/\` no site Pages.

## Regenerar

\`\`\`bash
node scripts/ig-feed/render-carousels.mjs
\`\`\`
`,
    "utf8",
  );

  console.log("Done — 3 slides for one carousel post");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
