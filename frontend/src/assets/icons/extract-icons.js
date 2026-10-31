const fs = require("fs");
const path = require("path");
const feather = require("feather-icons");

const SRC = "d:/Salmancz/figma-export-tool/nexus-figma.json";
const OUT = "d:/Salmancz/nexus-handoff-kit/kit/assets/icons";
const CAP = 120;

const data = JSON.parse(fs.readFileSync(SRC, "utf8"));

/* ---------- 1. walk, collect svg nodes + parent for nearby-text naming ---------- */
const svgOccurrences = [];
function walk(node, parent) {
  if (!node || typeof node !== "object") return;
  if (node.role === "svg" && typeof node.svg === "string") svgOccurrences.push({ node, parent });
  for (const k of Object.keys(node)) {
    const v = node[k];
    if (Array.isArray(v)) { for (const c of v) walk(c, node); }
    else if (v && typeof v === "object") walk(v, node);
  }
}
walk(data, null);

/* ---------- 2. normalization + signatures ---------- */
function splitSvg(raw) {
  const open = raw.match(/^<svg[^>]*>/);
  const inner = raw.replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
  const vbm = raw.match(/viewBox="([^"]+)"/);
  return { openTag: open ? open[0] : "", inner, viewBox: vbm ? vbm[1] : "0 0 24 24" };
}
// color/size/style-independent canonical inner markup (themeable, currentColor)
function normInner(inner) {
  return inner
    .replace(/fill="rgb\([^)]*\)"/g, 'fill="currentColor"')
    .replace(/\sstroke="rgb\([^)]*\)"/g, "")
    .replace(/\s(style|opacity|stroke-width|stroke-linecap|stroke-linejoin|class)="[^"]*"/g, "")
    .replace(/\saria-[a-z-]+="[^"]*"/g, "")
    .replace(/\s+/g, " ")
    .replace(/>\s+</g, "><")
    .trim();
}
// geometry-only signature (for feather match) - order + geometry attrs, ignores everything else
const GEO = ["d", "points", "x1", "y1", "x2", "y2", "cx", "cy", "r", "x", "y", "width", "height", "rx", "ry"];
function sig(inner) {
  const els = []; const re = /<(\w+)([^>]*?)\/?>/g; let m;
  while ((m = re.exec(inner))) {
    const tag = m[1]; if (tag === "svg") continue;
    const attrs = m[2]; const parts = [];
    for (const g of GEO) { const am = attrs.match(new RegExp(g + '="([^"]*)"')); if (am) parts.push(g + ":" + am[1].replace(/\s+/g, " ").trim()); }
    els.push(tag + "|" + parts.join(","));
  }
  return els.join(";;");
}
const featherSig = new Map();
for (const n of Object.keys(feather.icons)) featherSig.set(sig(feather.icons[n].contents), n);

// Lucide-only icons not in Feather: distinctive geometry substring -> canonical name
const LUCIDE = [
  ["M7 10l5-5 5 5", "chevrons-up-down"],
  ['points="8 10 12 6 16 10"', "chevrons-up-down-alt"],
  ["M19 6l-1 14a2 2 0 0 1-2 2H8", "trash-2"],
  ['d="M6 9l6 6 6-6"', "chevron-down"],
  ['cx="12" cy="5" r="1.5"', "more-vertical"],
  ["M12 2l1.5 4.5L18 8", "sparkles"],
  ['points="6 4 20 12 6 20 6 4"', "play"],
  ["M9 11l3 3L22 4", "check-square"],
  ["M10.29 3.86", "alert-triangle"],
  ["M9.09 9a3 3", "help-circle"],
  ["M12 2l3.09 6.26", "star"],
  ['d="m3 7 9 6 9-6"', "mail"],
  ["M15.477 12.89L17 22", "award"],
  ['x2="18" y2="18"', "align-left"],
  ["M3 12a9 9 0 0 1 9-9", "refresh-cw"],
  ["M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9", "bell"],
  ["M22 16.92v3a2 2", "phone"],
  ['rect x="5" y="2" width="14" height="20"', "smartphone"],
  ["M5 21V7l8-4v18", "building"],
  ['x="2" y="3" width="20" height="14"', "monitor"],
  ['x="3" y="3" width="18" height="14"', "monitor"],
  ["M12 8v4", "alert-circle"],
  ["M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2", "user"],
  ["M12 19V5M6 11l6-6 6 6", "arrow-up"],
  ["M11 5 6 9H2v6h4l5 4", "volume-2"],
  ["M8 3H5a2 2 0 0 0-2 2v3M16 3h3", "maximize"],
  ["M19.4 15a1.65", "settings"],
  ["M12 1.5c.6 4.2 2.3 5.9 6.5 6.5", "sparkle"],
  ["M12 2a10 10 0 0 0-8.6 15.05", "whatsapp"],
  ["M22 12a10 10 0 1 0-11.56 9.88", "facebook"],
  ['rect x="3" y="3" width="18" height="18" rx="5"', "instagram"],
  ["M18.9 2H22", "twitter-x"],
  ["M4.98 3.5a2.5 2.5 0 1 1 0 5", "linkedin"],
  ['rect x="2" y="4" width="20" height="16"', "mail"],
  ['rect x="3" y="11" width="18" height="11"', "lock"],
  ['rect x="3" y="4" width="18" height="16" rx="2"', "app-window"],
];
function lucideName(inner) {
  for (const [needle, name] of LUCIDE) if (inner.includes(needle)) return name;
  return null;
}

/* ---------- 3. nearby-text (heuristic, last-resort naming only) ---------- */
function collectText(node, depth, acc) {
  if (!node || typeof node !== "object" || depth < 0) return;
  if (node.role === "text" && typeof node.text === "string" && node.text.trim())
    acc.push({ text: node.text.trim(), x: node.x || 0, y: node.y || 0 });
  for (const k of Object.keys(node)) {
    const v = node[k];
    if (k === "lines") continue;
    if (Array.isArray(v)) { for (const c of v) collectText(c, depth - 1, acc); }
    else if (v && typeof v === "object") collectText(v, depth - 1, acc);
  }
}
function nearbyText(occ) {
  if (!occ.parent) return null;
  const acc = []; collectText(occ.parent, 2, acc);
  const ix = occ.node.x || 0, iy = occ.node.y || 0;
  let best = null;
  for (const t of acc) {
    if (t.text.length > 32 || /^[^a-zA-Z]+$/.test(t.text)) continue;
    const d = Math.hypot(t.x - ix, t.y - iy);
    if (!best || d < best.d) best = { text: t.text, d };
  }
  return best ? best.text : null;
}

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
    .split("-").slice(0, 5).join("-").slice(0, 48) || null;
}

/* ---------- 4. dedupe by normalized markup (collapses colour/size variants) ---------- */
const byShape = new Map();
let rawUnique = new Set();
let skippedNonIcon = 0;
for (const occ of svgOccurrences) {
  rawUnique.add(occ.node.svg);
  const { inner, viewBox } = splitSvg(occ.node.svg);
  // Icon set = the 24x24 line-icon system only. Everything else (viewBox
  // 640x180 sparklines, 150x150 gauges, donut/area charts, QR placeholders,
  // axis grids) is data-viz, not a reusable icon - exclude it.
  if (viewBox !== "0 0 24 24") { skippedNonIcon++; continue; }
  const ni = normInner(inner);
  const key = viewBox + "|" + ni;
  let e = byShape.get(key);
  if (!e) { e = { inner: ni, viewBox, usedCount: 0, texts: new Map() }; byShape.set(key, e); }
  e.usedCount++;
  const nt = nearbyText(occ);
  if (nt) e.texts.set(nt, (e.texts.get(nt) || 0) + 1);
}
const shapeUnique = byShape.size;

/* ---------- 5. name each shape ---------- */
function nameFor(e) {
  const fs_ = featherSig.get(sig(e.inner));
  if (fs_) return { name: fs_, src: "feather" };
  const lu = lucideName(e.inner);
  if (lu) return { name: lu, src: "lucide" };
  // heuristic nearby-text (most frequent)
  let best = null;
  for (const [t, c] of e.texts) if (!best || c > best.c) best = { t, c };
  if (best) { const s = slugify(best.t); if (s) return { name: s, src: "text" }; }
  return { name: null, src: "anon" };
}

/* ---------- 6. rank, cap, write ---------- */
const ranked = [...byShape.values()].sort((a, b) => b.usedCount - a.usedCount).slice(0, CAP);

// clean any prior output svgs
if (fs.existsSync(OUT)) for (const f of fs.readdirSync(OUT)) if (f.endsWith(".svg")) fs.unlinkSync(path.join(OUT, f));
fs.mkdirSync(OUT, { recursive: true });

function canonicalSvg(e) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${e.viewBox}" width="24" height="24" ` +
    `fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">` +
    e.inner + `</svg>\n`;
}

const used = new Set();
const manifest = [];
const bySrc = { feather: 0, lucide: 0, text: 0, anon: 0 };
let anon = 0;
for (const e of ranked) {
  const { name, src } = nameFor(e);
  bySrc[src]++;
  let slug = name || (`icon-${++anon}`);
  let file = slug, n = 2;
  while (used.has(file)) { file = `${slug}-${n}`; n++; }
  used.add(file);
  fs.writeFileSync(path.join(OUT, file + ".svg"), canonicalSvg(e), "utf8");
  manifest.push({ file: file + ".svg", viewBox: e.viewBox, usedCount: e.usedCount });
}
fs.writeFileSync(path.join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n", "utf8");

console.log("RAW_MARKUP_UNIQUE=" + rawUnique.size);
console.log("SKIPPED_NON_ICON_SVGS=" + skippedNonIcon);
console.log("ICON_SHAPE_UNIQUE=" + shapeUnique);
console.log("WRITTEN=" + manifest.length);
console.log("NAMED=" + JSON.stringify(bySrc));
console.log("TOP15=" + JSON.stringify(manifest.slice(0, 15).map(m => m.file + ":" + m.usedCount)));
