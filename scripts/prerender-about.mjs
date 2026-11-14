import fs from "node:fs";
import path from "node:path";

const dist = path.resolve("dist");
const indexPath = path.join(dist, "index.html");
if (!fs.existsSync(indexPath)) throw new Error("dist/index.html is missing; run vite build first.");

const title = "من نحن | منصة بيتلي";
const description = "تعرّف على بيتلي، المنظومة الهندسية المتكاملة التي تربط أصحاب المشاريع بالمهندسين والاستشاريين ومقدمي الخدمات في السعودية.";
const canonical = "https://www.mybytly.com/about";
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[char]));

const original = fs.readFileSync(indexPath, "utf8");
const appScript = original.match(/<script type="module"[^>]*src="[^"]+"[^>]*><\/script>/i)?.[0];
if (!appScript) throw new Error("Could not find the built application entry script.");

let html = original
  .replace(/<title>[\s\S]*?<\/title>/i, "<title>" + escapeHtml(title) + "</title>")
  .replace(/<meta name="description" content="[^"]*"\s*\/>/i, '<meta name="description" content="' + escapeHtml(description) + '" />')
  .replace(/<meta name="robots" content="[^"]*"\s*\/>/i, '<meta name="robots" content="index, follow, max-image-preview:large" />')
  .replace(/<link rel="canonical" href="[^"]*"\s*\/>/i, '<link rel="canonical" href="' + canonical + '" />')
  .replace(/<meta property="og:title" content="[^"]*"\s*\/>/i, '<meta property="og:title" content="' + escapeHtml(title) + '" />')
  .replace(/<meta property="og:description" content="[^"]*"\s*\/>/i, '<meta property="og:description" content="' + escapeHtml(description) + '" />')
  .replace(/<meta property="og:url" content="[^"]*"\s*\/>/i, '<meta property="og:url" content="' + canonical + '" />')
  .replace(/<meta name="twitter:title" content="[^"]*"\s*\/>/i, '<meta name="twitter:title" content="' + escapeHtml(title) + '" />')
  .replace(/<meta name="twitter:description" content="[^"]*"\s*\/>/i, '<meta name="twitter:description" content="' + escapeHtml(description) + '" />');

const fallback = '<main lang="ar" dir="rtl" style="min-height:100vh;padding:clamp(2rem,7vw,6rem) 1.5rem;background:#fdfbf7;color:#1a1a2e;font-family:system-ui,sans-serif">' +
  '<article style="max-width:960px;margin:0 auto"><p style="color:#9c8567;font-weight:700">BYTLY | بيتلي</p>' +
  '<h1 style="font-size:clamp(2rem,5vw,3.5rem);line-height:1.35;margin:1rem 0">من نحن</h1>' +
  '<p style="font-size:1.15rem;line-height:2;max-width:780px">' + escapeHtml(description) + '</p>' +
  '<nav aria-label="روابط بيتلي" style="display:flex;flex-wrap:wrap;gap:1rem;margin:2rem 0">' +
  '<a href="/">الرئيسية</a><a href="/about">من نحن</a><a href="/ContactUs">تواصل معنا</a></nav></article></main>';

const jsonLd = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "AboutPage",
  name: "من نحن",
  description,
  url: canonical,
  inLanguage: "ar-SA",
  isPartOf: { "@type": "WebSite", name: "Bytly | بيتلي", url: "https://www.mybytly.com/" }
}).replace(/</g, "\\u003c");

html = html.replace(/<body>[\s\S]*?<\/body>/i,
  '<body><div id="root">' + fallback + '</div><script type="application/ld+json">' +
  jsonLd + '</script>' + appScript + "</body>");

const output = path.join(dist, "about", "index.html");
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, html, "utf8");
console.log("Generated canonical /about HTML with page-specific metadata.");
