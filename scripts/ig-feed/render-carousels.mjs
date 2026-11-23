#!/usr/bin/env node
/**
 * Instagram feed 4:5 (1080×1350) — 1 página por vaga, 3 slides no mesmo carrossel.
 *
 * Tipografia pensada para o celular: no feed a arte é encolhida (~390px de largura),
 * então títulos ~56px e corpo ~38–40px para continuar legíveis na tela.
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

const JOBS = [
  {
    id: "admin",
    order: "01",
    role: "ADMIN",
    title: "Estágio em Administração",
    subtitle: "Pedidos, clientes, documentos e financeiro operacional em Manaus.",
    cover: "admin-cover.jpg",
    subject: "Estágio Administração — Seu Nome",
    pontos: [
      "Apoio operacional, comercial e administrativo (B2B)",
      "Pedidos, NF-e, contratos e conciliação financeira",
      "Cursando Admin / Processos / Gestão (pref. 4º+)",
      "Presencial em Manaus · até 6h/dia (30h/semana)",
    ],
    beneficios: ["Bolsa R$ 800", "VT", "Refeição", "Seguro", "Aprendizado prático"],
  },
  {
    id: "cultivo",
    order: "02",
    role: "CULTIVO",
    title: "Estágio em Cultivo e Hidroponia",
    subtitle: "Fazenda vertical: hortaliças, baby leaf e microverdes em Manaus.",
    cover: "cultivo-cover.jpg",
    subject: "Estágio Cultivo/Hidroponia — Seu Nome",
    pontos: [
      "Manejo hidropônico: torres, LED, clima e irrigação",
      "Monitorar EC, pH, fertirrigação e produtividade",
      "Cursando Agronomia / Eng. Agrícola / Biossistemas (pref. 4º+)",
      "Presencial em Manaus · até 6h/dia (30h/semana)",
    ],
    beneficios: ["Bolsa R$ 800", "VT", "Refeição", "Seguro", "Aprendizado prático"],
  },
  {
    id: "qualidade",
    order: "03",
    role: "QUALIDADE",
    title: "Estágio em Processamento e Qualidade",
    subtitle: "Pós-colheita, BPF e segurança alimentar na Fazendas Up.",
    cover: "qualidade-cover.jpg",
    subject: "Estágio Processamento/Qualidade — Seu Nome",
    pontos: [
      "Processamento de hortaliças, higiene e rastreabilidade",
      "BPF, POP, inspeção e indicadores de qualidade",
      "Cursando Eng. Alimentos / CTA / Nutrição (pref. 4º+)",
      "Presencial em Manaus · até 6h/dia (30h/semana)",
    ],
    beneficios: ["Bolsa R$ 800", "VT", "Refeição", "Seguro", "Aprendizado prático"],
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

function slidePage(job, coverDataUri, index, total) {
  const titleSize = job.title.length > 32 ? 52 : 58;
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
:root{--green:#1ab37f;--green-soft:#cff3e4;--ink:#0c1a14;--muted:#354840;--footer:#0d241e}
.hero{position:relative;flex:0 0 380px;overflow:hidden;background:#12332a}
.hero img{width:100%;height:100%;object-fit:cover;object-position:center 40%;display:block}
.hero::after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(6,24,18,.55) 0%,rgba(6,24,18,.08) 40%,rgba(6,24,18,.78) 100%)}
.hero-top,.hero-bottom{position:absolute;left:36px;right:36px;z-index:2}
.hero-top{top:28px;display:flex;justify-content:space-between;align-items:center}
.hero-bottom{bottom:24px;display:flex;gap:12px;align-items:center}
.brand{font-weight:800;font-size:26px;letter-spacing:.04em;color:#fff}
.brand span{font-weight:500;opacity:.92}
.badge,.role-pill{
  display:inline-flex;align-items:center;justify-content:center;
  background:var(--green);color:#062419;font-weight:800;
  padding:14px 22px;border-radius:999px;letter-spacing:.04em;font-size:22px;
}
.role-pill{letter-spacing:.06em}
.body{flex:1 1 auto;display:flex;flex-direction:column;padding:28px 36px 22px;gap:22px;min-height:0}
.kicker{font-size:20px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--green);margin-bottom:10px}
h1{font-size:${titleSize}px;line-height:1.02;font-weight:800;color:var(--ink);letter-spacing:-.03em;margin-bottom:12px}
.lead{font-size:34px;line-height:1.26;color:var(--muted);font-weight:500}
ul{list-style:none;display:flex;flex-direction:column;gap:18px;margin-top:8px}
li{display:flex;gap:16px;align-items:flex-start;font-size:36px;line-height:1.2;color:var(--ink);font-weight:600}
.dot{width:16px;height:16px;border-radius:50%;background:var(--green);margin-top:12px;flex:0 0 auto}
.section-label{font-size:22px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--green);margin-bottom:14px}
.chips{display:flex;flex-wrap:wrap;gap:12px}
.chip{background:var(--green-soft);color:#0a5a40;font-weight:800;font-size:28px;padding:16px 20px;border-radius:999px}
.apply{
  flex:1 1 auto;display:flex;flex-direction:column;justify-content:center;
  background:#e5f6ed;border-radius:20px;padding:26px 28px;min-height:130px;
  font-size:30px;line-height:1.3;color:var(--muted);font-weight:500;
}
.apply b{color:var(--ink);font-weight:800}
.apply .email{color:var(--green);font-weight:800}
.footer{
  flex:0 0 136px;background:var(--footer);color:#fff;
  display:flex;align-items:center;justify-content:space-between;padding:0 36px;
}
.footer .cta{font-size:32px;font-weight:800;line-height:1}
.footer .mail{color:var(--green);font-size:24px;font-weight:800;margin-top:8px}
.footer .meta{font-size:18px;opacity:.9;margin-top:8px;font-weight:500}
</style></head>
<body>
<div class="slide">
  <div class="hero">
    <img src="${coverDataUri}" alt="" />
    <div class="hero-top">
      <div class="brand">FAZENDAS UP <span>· Manaus / AM</span></div>
      <div class="brand" style="font-size:24px;opacity:.9">${index}/${total}</div>
    </div>
    <div class="hero-bottom">
      <div class="badge">VAGA DE ESTÁGIO</div>
      <div class="role-pill">${esc(job.role)}</div>
    </div>
  </div>

  <div class="body">
    <div>
      <div class="kicker">Carrossel · vaga ${index} de ${total}</div>
      <h1>${esc(job.title)}</h1>
      <p class="lead">${esc(job.subtitle)}</p>
    </div>

    <div>
      <div class="section-label">O que você vai fazer</div>
      <ul>${bullets(job.pontos)}</ul>
    </div>

    <div>
      <div class="section-label">O que oferecemos</div>
      <div class="chips">${chips(job.beneficios)}</div>
    </div>

    <div class="apply">
      <b>Candidate-se:</b> currículo + curso/período para
      <span class="email">comercial@visioneer.com.br</span><br/>
      Assunto: <b>${esc(job.subject)}</b>
    </div>
  </div>

  <div class="footer">
    <div>
      <div class="cta">Fazendas Up · Manaus</div>
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
  await page.waitForTimeout(120);
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

**Um único post** no feed, **3 slides** (uma página por vaga), **1080 × 1350**.

1. \`01-admin.jpg\`
2. \`02-cultivo.jpg\`
3. \`03-qualidade.jpg\`

Tipografia grande para leitura no celular. Detalhes extras podem ir na legenda do post.

Baixar: \`/instagram-estagios/\` no preview Pages.

\`\`\`bash
node scripts/ig-feed/render-carousels.mjs
\`\`\`
`,
    "utf8",
  );
  console.log("Done");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
