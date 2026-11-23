#!/usr/bin/env node
/**
 * Render Fazendas Up internship carousels for Instagram feed (4:5 / 1080×1350).
 */
import { chromium } from "playwright";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const OUT = path.join(ROOT, "marketing/instagram-estagios");
const SRC = path.join(OUT, "src");
const W = 1080;
const H = 1350;
const SCALE = 2; // render @2x then we keep 2160×2700 optional; screenshot at deviceScaleFactor

const FONT_DIR = "/usr/share/fonts/truetype/macos";

const JOBS = [
  {
    id: "admin",
    role: "ADMIN",
    title: "Estágio em Administração",
    subtitle:
      "Apoie a gestão da Fazendas Up em Manaus: pedidos e clientes, notas e documentos, financeiro operacional e melhoria de processos.",
    cover: "admin-cover.jpg",
    subject: "Estágio Administração — Seu Nome",
    sobre: [
      "Apoio às unidades operacional, comercial e administrativa",
      "Rotina B2B de agroindústria em Manaus",
      "Organização de documentos, notas e registros",
      "Jornada de até 6h/dia (30h/semana), compatível com a faculdade",
    ],
    atividades: [
      "Apoiar cadastro e acompanhamento de pedidos e clientes",
      "Organizar notas fiscais, contratos e documentos",
      "Auxiliar na conciliação financeira e registros",
      "Apoiar contas a pagar e a receber",
      "Mapear processos e sugerir melhorias",
      "Apoiar compras e rotinas administrativas",
    ],
    requisitos: [
      "Cursando Administração, Processos Gerenciais, Gestão ou correlatos",
      "Preferencialmente a partir do 4º período",
      "Disponibilidade presencial em Manaus",
      "Domínio de Excel e boa organização",
      "Interesse em operações, financeiro e processos",
    ],
    beneficios: ["Bolsa R$ 800", "VT", "Refeição", "Seguro", "Aprendizado prático"],
  },
  {
    id: "cultivo",
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
      "Monitorar solução nutritiva, EC, pH e fertirrigação",
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
    beneficios: [
      "Bolsa R$ 800",
      "VT",
      "Refeição",
      "Seguro de acidentes",
      "Aprendizado prático",
    ],
  },
  {
    id: "qualidade",
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
    beneficios: [
      "Bolsa R$ 800",
      "VT",
      "Refeição",
      "Seguro de acidentes",
      "Aprendizado prático",
    ],
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
  return items.map((t) => `<li><span class="dot"></span><span>${esc(t)}</span></li>`).join("");
}

function chips(items) {
  return items.map((t) => `<span class="chip">${esc(t)}</span>`).join("");
}

function baseCss() {
  return `
@font-face{font-family:'Inter';src:url('file://${FONT_DIR}/Inter-Regular.ttf') format('truetype');font-weight:400;font-style:normal}
@font-face{font-family:'Inter';src:url('file://${FONT_DIR}/Inter-Medium.ttf') format('truetype');font-weight:500;font-style:normal}
@font-face{font-family:'Inter';src:url('file://${FONT_DIR}/Inter-SemiBold.ttf') format('truetype');font-weight:600;font-style:normal}
@font-face{font-family:'Inter';src:url('file://${FONT_DIR}/Inter-Bold.ttf') format('truetype');font-weight:700;font-style:normal}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:${W}px;height:${H}px;overflow:hidden;background:#0b1f1a}
body{font-family:'Inter',system-ui,sans-serif;-webkit-font-smoothing:antialiased}
.slide{width:${W}px;height:${H}px;position:relative;overflow:hidden;background:#f6f4ef}
:root{
  --green:#1ab37f;
  --green-soft:#d8f5e9;
  --ink:#102018;
  --muted:#4d5c56;
  --footer:#0d241e;
  --cream:#f6f4ef;
}
.brand{font-weight:700;font-size:28px;letter-spacing:0.04em;color:#fff}
.brand span{font-weight:500;opacity:.9;color:#fff}
.badge{
  display:inline-flex;align-items:center;justify-content:center;
  background:var(--green);color:#062419;font-weight:700;font-size:22px;
  padding:12px 22px;border-radius:999px;letter-spacing:0.04em;
}
.role-pill{
  display:inline-flex;align-items:center;justify-content:center;
  background:var(--green);color:#062419;font-weight:800;font-size:20px;
  padding:12px 20px;border-radius:999px;letter-spacing:0.06em;
}
h1{font-size:64px;line-height:1.05;font-weight:800;color:var(--ink);letter-spacing:-0.02em}
h2{font-size:28px;font-weight:800;color:var(--green);letter-spacing:0.08em;text-transform:uppercase;margin-bottom:18px}
.lead{font-size:28px;line-height:1.35;color:var(--muted);font-weight:500}
ul{list-style:none;display:flex;flex-direction:column;gap:14px}
li{display:flex;gap:14px;align-items:flex-start;font-size:26px;line-height:1.35;color:var(--ink);font-weight:500}
.dot{width:12px;height:12px;border-radius:50%;background:var(--green);margin-top:10px;flex:0 0 auto}
.chips{display:flex;flex-wrap:wrap;gap:12px}
.chip{
  background:var(--green-soft);color:#0b5c42;font-weight:700;font-size:24px;
  padding:14px 20px;border-radius:999px;
}
.pad{padding:56px 56px 48px}
.footer{
  position:absolute;left:0;right:0;bottom:0;height:190px;
  background:var(--footer);color:#fff;display:flex;align-items:center;justify-content:space-between;
  padding:0 56px;
}
.footer .cta{font-size:42px;font-weight:800;line-height:1}
.footer .mail{color:var(--green);font-size:26px;font-weight:700;margin-top:8px}
.footer .meta{font-size:20px;opacity:.85;margin-top:10px;font-weight:500}
.hint{font-size:22px;font-weight:600;color:var(--muted)}
.kicker{font-size:22px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:var(--green)}
`;
}

function slideCover(job, coverDataUri) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>${baseCss()}
.hero{position:relative;height:700px;overflow:hidden;background:#12332a}
.hero img{width:100%;height:100%;object-fit:cover;object-position:center 42%;display:block}
.hero::after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(8,28,22,.55) 0%,rgba(8,28,22,.12) 38%,rgba(8,28,22,.68) 100%)}
.hero-top{position:absolute;left:56px;right:56px;top:48px;z-index:2;display:flex;justify-content:space-between;align-items:flex-start}
.hero-bottom{position:absolute;left:56px;bottom:40px;z-index:2}
.body{padding:40px 56px 28px}
.swipe{position:absolute;right:56px;bottom:40px;color:var(--muted);font-weight:700;font-size:22px}
</style></head><body><div class="slide">
  <div class="hero">
    <img src="${coverDataUri}" alt="" />
    <div class="hero-top">
      <div class="brand">FAZENDAS UP <span>· Manaus / AM</span></div>
    </div>
    <div class="hero-bottom"><div class="badge">VAGA DE ESTÁGIO</div></div>
  </div>
  <div class="body">
    <div class="kicker" style="margin-bottom:14px">Carrossel · 1/4</div>
    <h1 style="font-size:${job.title.length > 28 ? 52 : 58}px;margin-bottom:20px">${esc(job.title)}</h1>
    <p class="lead">${esc(job.subtitle)}</p>
  </div>
  <div class="swipe">Arraste →</div>
</div></body></html>`;
}

function slideSobre(job) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>${baseCss()}
.topbar{display:flex;justify-content:space-between;align-items:center;padding:48px 56px 0}
.section{padding:36px 56px 0}
.section + .section{padding-top:44px}
.brand-ink{font-weight:800;font-size:24px;color:var(--ink);letter-spacing:0.04em}
.brand-ink span{color:var(--green)}
.foot-hint{position:absolute;left:56px;right:56px;bottom:48px;display:flex;justify-content:space-between;color:var(--muted);font-weight:600;font-size:22px}
</style></head><body><div class="slide">
  <div class="topbar">
    <div class="brand-ink">FAZENDAS UP <span>· ${esc(job.role)}</span></div>
    <div class="hint">2/4</div>
  </div>
  <div class="section">
    <h2>Sobre a vaga</h2>
    <ul>${bullets(job.sobre)}</ul>
  </div>
  <div class="section">
    <h2>Atividades</h2>
    <ul>${bullets(job.atividades)}</ul>
  </div>
  <div class="foot-hint"><span>${esc(job.title)}</span><span>Arraste →</span></div>
</div></body></html>`;
}

function slideRequisitos(job) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>${baseCss()}
.topbar{display:flex;justify-content:space-between;align-items:center;padding:48px 56px 0}
.section{padding:48px 56px 0}
.section + .section{padding-top:56px}
.brand-ink{font-weight:800;font-size:24px;color:var(--ink);letter-spacing:0.04em}
.brand-ink span{color:var(--green)}
.foot-hint{position:absolute;left:56px;right:56px;bottom:48px;display:flex;justify-content:space-between;color:var(--muted);font-weight:600;font-size:22px}
ul{gap:18px}
li{font-size:28px}
</style></head><body><div class="slide">
  <div class="topbar">
    <div class="brand-ink">FAZENDAS UP <span>· ${esc(job.role)}</span></div>
    <div class="hint">3/4</div>
  </div>
  <div class="section">
    <h2>Requisitos</h2>
    <ul>${bullets(job.requisitos)}</ul>
  </div>
  <div class="section">
    <h2>O que oferecemos</h2>
    <div class="chips">${chips(job.beneficios)}</div>
  </div>
  <div class="foot-hint"><span>${esc(job.title)}</span><span>Arraste →</span></div>
</div></body></html>`;
}

function slideCta(job) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>${baseCss()}
.wrap{padding:56px 56px 0;height:calc(100% - 210px);display:flex;flex-direction:column}
.panel{margin-top:40px;padding-top:8px}
.panel h3{font-size:40px;font-weight:800;color:var(--ink);margin-bottom:20px}
.panel p{font-size:30px;line-height:1.4;color:var(--muted);font-weight:500}
.panel .email{color:var(--green);font-weight:800}
.panel .assunto{margin-top:28px;padding:22px 24px;background:var(--green-soft);border-radius:18px;color:#0b5c42;font-size:26px;font-weight:700;line-height:1.35}
.brand-ink{font-weight:800;font-size:24px;color:var(--ink);letter-spacing:0.04em}
.brand-ink span{color:var(--green)}
.top{display:flex;justify-content:space-between;align-items:center}
.steps{margin-top:48px;display:flex;flex-direction:column;gap:18px}
.step{display:flex;gap:16px;align-items:flex-start;font-size:26px;line-height:1.35;color:var(--ink);font-weight:500}
.num{width:36px;height:36px;border-radius:50%;background:var(--green);color:#062419;font-weight:800;font-size:18px;display:flex;align-items:center;justify-content:center;flex:0 0 auto;margin-top:2px}
</style></head><body><div class="slide">
  <div class="wrap">
    <div class="top">
      <div class="brand-ink">FAZENDAS UP <span>· ${esc(job.role)}</span></div>
      <div class="hint">4/4</div>
    </div>
    <div class="kicker" style="margin-top:48px">Pronto para aplicar</div>
    <h1 style="font-size:56px;margin-top:14px">Como se candidatar</h1>
    <div class="panel">
      <h3>Envie seu currículo</h3>
      <p>Currículo + curso/período para<br><span class="email">comercial@visioneer.com.br</span></p>
      <div class="assunto">Assunto: ${esc(job.subject)}</div>
    </div>
    <div class="steps">
      <div class="step"><div class="num">1</div><div>Monte o e-mail com currículo e curso/período</div></div>
      <div class="step"><div class="num">2</div><div>Use o assunto indicado acima</div></div>
      <div class="step"><div class="num">3</div><div>Envie para comercial@visioneer.com.br</div></div>
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

async function toDataUri(filePath) {
  const buf = await readFile(filePath);
  const ext = path.extname(filePath).toLowerCase().replace(".", "") || "jpg";
  const mime = ext === "png" ? "image/png" : "image/jpeg";
  return `data:${mime};base64,${buf.toString("base64")}`;
}

async function renderSlide(page, html, outPath) {
  await page.setContent(html, { waitUntil: "load" });
  await page.evaluate(async () => {
    await document.fonts.ready;
    const imgs = [...document.images];
    await Promise.all(
      imgs.map((img) =>
        img.complete && img.naturalWidth > 0
          ? Promise.resolve()
          : new Promise((res, rej) => {
              img.onload = res;
              img.onerror = () => rej(new Error("img failed: " + img.src.slice(0, 64)));
            }),
      ),
    );
  });
  await page.waitForTimeout(100);
  // Screenshot at deviceScaleFactor (2) → 2160×2700, then we also write 1080×1350 via clip at CSS px
  // Playwright screenshot with deviceScaleFactor multiplies pixels; clip is in CSS pixels.
  await page.screenshot({
    path: outPath,
    type: "jpeg",
    quality: 92,
    clip: { x: 0, y: 0, width: W, height: H },
  });
}

async function main() {
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  const page = await browser.newPage({
    viewport: { width: W, height: H },
    deviceScaleFactor: SCALE,
  });

  for (const job of JOBS) {
    const dir = path.join(OUT, job.id);
    await mkdir(dir, { recursive: true });
    const coverDataUri = await toDataUri(path.join(SRC, job.cover));
    const slides = [
      ["01-capa", slideCover(job, coverDataUri)],
      ["02-sobre-atividades", slideSobre(job)],
      ["03-requisitos-beneficios", slideRequisitos(job)],
      ["04-candidatura", slideCta(job)],
    ];
    for (const [name, html] of slides) {
      const htmlPath = path.join(dir, `${name}.html`);
      // Keep HTML without huge base64 for repo; only embed at screenshot time
      if (name !== "01-capa") await writeFile(htmlPath, html, "utf8");
      const jpgPath = path.join(dir, `${name}.jpg`);
      const jpg2xPath = path.join(dir, `${name}@2x.jpg`);
      await renderSlide(page, html, jpg2xPath);
      // Downscale 2x → Instagram feed size with high-quality resampling via sharp-less Pillow later;
      // for now also save CSS-size by re-screenshot at scale 1 for exact 1080×1350.
      console.log("ok", path.relative(ROOT, jpg2xPath));
    }
  }

  await browser.close();

  // Convert @2x (2160×2700) → 1080×1350 with LANCZOS via python
  const { spawnSync } = await import("node:child_process");
  const py = `
from PIL import Image
from pathlib import Path
root = Path(${JSON.stringify(OUT)})
for p in root.glob('*/*@2x.jpg'):
    im = Image.open(p).convert('RGB')
    assert im.size == (2160, 2700), (p, im.size)
    out = p.with_name(p.name.replace('@2x.jpg', '.jpg'))
    im.resize((1080, 1350), Image.Resampling.LANCZOS).save(out, quality=95, subsampling=0, optimize=True)
    print('downscale', out)
`;
  const r = spawnSync("python3", ["-c", py], { encoding: "utf8" });
  if (r.status !== 0) {
    console.error(r.stdout, r.stderr);
    process.exit(1);
  }
  console.log(r.stdout);
  console.log("All carousels rendered at", OUT);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
