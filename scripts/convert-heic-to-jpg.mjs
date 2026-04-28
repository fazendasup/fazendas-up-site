/**
 * Converte .HEIC/.heic para JPEG em client/public/uploads (necessário para <img> no browser).
 * Uso:
 *   node scripts/convert-heic-to-jpg.mjs
 *   node scripts/convert-heic-to-jpg.mjs "client/public/uploads/IMG_0073.HEIC"
 *   node scripts/convert-heic-to-jpg.mjs --all
 */
import { readFileSync, readdirSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join, parse } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const uploadsDir = join(root, "client", "public", "uploads");

const arg0 = process.argv[2];
const isAll = arg0 === "--all" || arg0 === "-a";

const { default: convert } = await import("heic-convert");
const sharp = (await import("sharp")).default;

async function heicToJpg(inputPath) {
  const heic = readFileSync(inputPath);
  const jpegBuffer = await convert({
    buffer: heic,
    format: "JPEG",
    quality: 0.9,
  });

  const { dir, name } = parse(inputPath);
  const outName = name.replace(/\.(heic|HEIC)$/, "") + ".jpg";
  const outPath = join(dir, outName);

  const optimized = await sharp(Buffer.from(jpegBuffer))
    .jpeg({ quality: 88, mozjpeg: true })
    .toBuffer();

  writeFileSync(outPath, optimized);
  console.log("OK:", outPath);
}

if (isAll) {
  if (!existsSync(uploadsDir)) {
    console.error("Pasta uploads não encontrada:", uploadsDir);
    process.exit(1);
  }
  const heicNames = readdirSync(uploadsDir).filter(
    (f) => f.endsWith(".heic") || f.endsWith(".HEIC")
  );
  if (heicNames.length === 0) {
    console.log("Nenhum ficheiro .heic em", uploadsDir);
    process.exit(0);
  }
  for (const f of heicNames) {
    const inputPath = join(uploadsDir, f);
    const { name, dir } = parse(inputPath);
    const outName = name.replace(/\.(heic|HEIC)$/, "") + ".jpg";
    const outPath = join(dir, outName);
    if (existsSync(outPath)) {
      console.log("skip (já existe .jpg):", outName);
      continue;
    }
    await heicToJpg(inputPath);
  }
  process.exit(0);
}

const defaultHeic = join(uploadsDir, "IMG_0073.HEIC");
const inputArg = arg0;
const inputPath = inputArg
  ? join(root, inputArg.replace(/^\//, ""))
  : defaultHeic;

if (!existsSync(inputPath)) {
  console.error(`Ficheiro não encontrado: ${inputPath}`);
  console.error("Coloque o .HEIC em client/public/uploads/ ou passe o caminho como argumento, ou use --all.");
  process.exit(1);
}

await heicToJpg(inputPath);
