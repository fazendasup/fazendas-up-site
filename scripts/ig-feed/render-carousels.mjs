#!/usr/bin/env node
/**
 * Instagram feed 4:5 (1080×1350) — 1 página por vaga, 3 slides no mesmo carrossel.
 * Layout em coluna única (como a arte original), texto completo, sem corte.
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
  const titleSize = job.title.length > 32 ? 32 : 36;
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
.slide{width:${W}px;height:${H}px;display:flex;flex-direction:column;background:#f7f5f0;overflow:hidden}
:root{--green:#1ab37f;--green-soft:#d4f4e7;--ink:#101f18;--muted:#44554d;--footer:#0d241e}
.hero{position:relative;flex:0 0 210px;overflow:hidden;background:#12332a}
.hero img{width:100%;height:100%;object-fit:cover;object-position:center 40%;display:block}
.hero::after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(6,24,18,.55) 0%,rgba(6,24,18,.12) 48%,rgba(6,24,18,.7) 100%)}
.hero-top,.hero-bottom{position:absolute;left:28px;right:28px;z-index:2}
.hero-top{top:18px;display:flex;justify-content:space-between;align-items:center}
.hero-bottom{bottom:14px;display:flex;gap:8px;align-items:center}
.brand{font-weight:800;font-size:18px;letter-spacing:.04em;color:#fff}
.brand span{font-weight:500;opacity:.92}
.badge,.role-pill{
  display:inline-flex;align-items:center;justify-content:center;
  background:var(--green);color:#062419;font-weight:800;
  padding:8px 12px;border-radius:999px;letter-spacing:.04em;font-size:13px;line-height:1;
}
.body{
  flex:1 1 auto;min-height:0;overflow:hidden;
  display:flex;flex-direction:column;gap:10px;
  padding:14px 28px 12px;
}
.kicker{font-size:12px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--green);margin-bottom:4px}
h1{font-size:${titleSize}px;line-height:1.05;font-weight:800;color:var(--ink);letter-spacing:-.02em;margin-bottom:4px}
.lead{font-size:15px;line-height:1.28;color:var(--muted);font-weight:500}
.section{flex:0 0 auto}
.section h2{
  font-size:12px;font-weight:800;color:var(--green);letter-spacing:.08em;
  text-transform:uppercase;margin-bottom:5px;
}
ul{list-style:none;display:flex;flex-direction:column;gap:3px}
li{display:flex;gap:8px;align-items:flex-start;font-size:14px;line-height:1.25;color:var(--ink);font-weight:500}
.dot{width:6px;height:6px;border-radius:50%;background:var(--green);margin-top:5px;flex:0 0 auto}
.chips{display:flex;flex-wrap:wrap;gap:6px}
.chip{background:var(--green-soft);color:#0a5a40;font-weight:800;font-size:13px;padding:7px 11px;border-radius:999px}
.apply{
  flex:0 0 auto;margin-top:auto;background:#e8f7ef;border-radius:12px;padding:10px 12px;
  font-size:14px;line-height:1.3;color:var(--muted);font-weight:500;
}
.apply b{color:var(--ink);font-weight:800}
.apply .email{color:var(--green);font-weight:800}
.footer{
  flex:0 0 96px;background:var(--footer);color:#fff;
  display:flex;align-items:center;justify-content:space-between;padding:0 28px;
}
.footer .cta{font-size:22px;font-weight:800;line-height:1}
.footer .mail{color:var(--green);font-size:15px;font-weight:800;margin-top:3px}
.footer .meta{font-size:12px;opacity:.9;margin-top:4px;font-weight:500}
</style></head>
<body>
<div class="slide">
  <div class="hero">
    <img src="${coverDataUri}" alt="" />
    <div class="hero-top">
      <div class="brand">FAZENDAS UP <span>· Manaus / AM</span></div>
      <div class="brand" style="font-size:16px;opacity:.9">${index}/${total}</div>
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

    <section class="section">
      <h2>Sobre a vaga</h2>
      <ul>${bullets(job.sobre)}</ul>
    </section>

    <section class="section">
      <h2>Atividades</h2>
      <ul>${bullets(job.atividades)}</ul>
    </section>

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
  <p class="sub">Um único post com 3 slides (1080×1350). Ordem: Admin → Cultivo → Qualidade.</p>
  <div class="tip">
    Atualizado agora. Se ainda ver a versão antiga, feche a aba e abra este link de novo.<br/>
    Salve as 3 imagens nesta ordem e publique como <b>um carrossel</b> no feed.
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

  const overflow = await page.evaluate(() => {
    const body = document.querySelector(".body");
    const apply = document.querySelector(".apply");
    const footer = document.querySelector(".footer");
    const sections = [...document.querySelectorAll(".section, header, .apply")];
    if (!body || !apply || !footer) return { ok: false, reason: "missing nodes" };
    const bodyOverflow = body.scrollHeight > body.clientHeight + 1;
    const applyRect = apply.getBoundingClientRect();
    const footerRect = footer.getBoundingClientRect();
    const clippedByFooter = applyRect.bottom > footerRect.top + 0.5;
    // Check section overlaps
    const boxes = sections.map((el) => {
      const r = el.getBoundingClientRect();
      return { top: r.top, bottom: r.bottom, text: (el.innerText || "").slice(0, 24) };
    });
    let overlap = null;
    for (let i = 1; i < boxes.length; i++) {
      if (boxes[i].top < boxes[i - 1].bottom - 1) {
        overlap = { a: boxes[i - 1].text, b: boxes[i].text };
        break;
      }
    }
    return {
      ok: !bodyOverflow && !clippedByFooter && !overlap,
      bodyOverflow,
      clippedByFooter,
      overlap,
      scrollHeight: body.scrollHeight,
      clientHeight: body.clientHeight,
    };
  });
  if (!overflow.ok) {
    throw new Error(`Layout problem on ${path.basename(outPath)}: ${JSON.stringify(overflow)}`);
  }

  await page.waitForTimeout(60);
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
    await renderSlide(page, html, path.join(OUT, `${name}@2x.jpg`));
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
    out = p.with_name(p.name.replace('@2x.jpg', '.jpg'))
    im.resize((1080, 1350), Image.Resampling.LANCZOS).save(
        out, quality=97, subsampling=0, optimize=True
    )
    Image.open(out).save(public / out.name, quality=97, subsampling=0, optimize=True)
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

Um post, 3 slides (1080×1350), texto completo das artes originais.

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
Jornada até 6h/dia (30h/semana)
Presencial em Manaus

Candidate-se: currículo + curso/período para comercial@visioneer.com.br
WhatsApp (92) 98404-0397 · www.fazendasup.com.br
`;
  await writeFile(path.join(OUT, "legenda-instagram.txt"), caption);
  await writeFile(path.join(PUBLIC, "legenda-instagram.txt"), caption);
  console.log("Done cache=", CACHE_BUST);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
