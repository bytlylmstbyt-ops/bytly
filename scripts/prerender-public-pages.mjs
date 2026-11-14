import fs from "node:fs";
import path from "node:path";

const dist = path.resolve("dist");
const indexPath = path.join(dist, "index.html");
if (!fs.existsSync(indexPath)) throw new Error("dist/index.html is missing; run vite build first.");

const pages = [
  {
    route: "/ContactUs",
    title: "تواصل معنا | منصة بيتلي",
    description: "تواصل مع فريق بيتلي للاستفسارات حول المنصة والخدمات الهندسية وإدارة المشاريع في السعودية.",
    heading: "تواصل معنا",
    body: "يسعد فريق بيتلي استقبال استفساراتك حول المنصة والخدمات الهندسية. يمكنك التواصل عبر البريد الإلكتروني info@mybytly.com.",
    email: "info@mybytly.com"
  },
  {
    route: "/Terms",
    title: "الشروط والأحكام | منصة بيتلي",
    description: "اطلع على الشروط والأحكام المنظمة لاستخدام منصة بيتلي وخدماتها الهندسية.",
    heading: "الشروط والأحكام",
    body: "توضح هذه الصفحة الشروط والأحكام المنظمة لاستخدام منصة بيتلي والخدمات المتاحة من خلالها. يرجى مراجعة النص الكامل داخل الصفحة."
  },
  {
    route: "/Privacy",
    title: "سياسة الخصوصية | منصة بيتلي",
    description: "تعرف على سياسة الخصوصية وكيفية تعامل منصة بيتلي مع بيانات المستخدمين.",
    heading: "سياسة الخصوصية",
    body: "توضح هذه الصفحة سياسة بيتلي بشأن بيانات المستخدمين والخصوصية واستخدام المعلومات أثناء الاستفادة من المنصة."
  },
  {
    route: "/Copyright",
    title: "حقوق الملكية الفكرية | منصة بيتلي",
    description: "تعرف على سياسة حقوق الملكية الفكرية والمحتوى المنشور عبر منصة بيتلي.",
    heading: "حقوق الملكية الفكرية",
    body: "توضح هذه الصفحة حقوق الملكية الفكرية المتعلقة بالمحتوى والعلامات والمواد المنشورة عبر منصة بيتلي."
  },
  {
    route: "/audiences/contractors",
    title: "بيتلي للمقاولين | منصة بيتلي",
    description: "اكتشف كيف تساعد بيتلي المقاولين على الوصول إلى فرص المشاريع والتواصل مع أصحاب المشاريع في السعودية.",
    heading: "منصة بيتلي للمقاولين",
    body: "تعرّف على أدوات بيتلي للمقاولين، من عرض الخدمات والتواصل مع أصحاب المشاريع إلى متابعة الأعمال والمشاريع."
  },
  {
    route: "/audiences/engineering-firms",
    title: "بيتلي لشركات الهندسة | منصة بيتلي",
    description: "منصة بيتلي تساعد المكاتب والشركات الهندسية على عرض خدماتها والتواصل مع أصحاب المشاريع في السعودية.",
    heading: "منصة بيتلي لشركات الهندسة",
    body: "تعرّف على كيفية استخدام شركات ومكاتب الهندسة لبيتلي لعرض خدماتها وتنظيم التواصل ومتابعة المشاريع."
  },
  {
    route: "/audiences/consulting-teams",
    title: "بيتلي للاستشاريين | منصة بيتلي",
    description: "تعرّف على خدمات بيتلي للفرق والاستشاريين الهندسيين وإدارة فرص العمل والمشاريع في السعودية.",
    heading: "منصة بيتلي للاستشاريين",
    body: "تعرّف على خدمات بيتلي للفرق والاستشاريين الهندسيين وإدارة فرص العمل والتواصل ومتابعة المشاريع."
  }
];

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[char]));


  {
    route: "/Complaints",
    title: "الشكاوى | منصة بيتلي",
    description: "صفحة الشكاوى الخاصة بمستخدمي منصة بيتلي.",
    heading: "الشكاوى",
    body: "هذه الصفحة مخصصة لمستخدمي بيتلي المسجلين. سجّل الدخول للوصول إلى خدمات الشكاوى.",
    indexable: false
  },
  {
    route: "/Support",
    title: "الدعم الفني | منصة بيتلي",
    description: "صفحة الدعم الفني الخاصة بمستخدمي منصة بيتلي.",
    heading: "الدعم الفني",
    body: "هذه الصفحة مخصصة لمستخدمي بيتلي المسجلين. سجّل الدخول للوصول إلى خدمات الدعم الفني.",
    indexable: false
  },

const original = fs.readFileSync(indexPath, "utf8");
const appScript = original.match(/<script type="module"[^>]*src="[^"]+"[^>]*><\/script>/i)?.[0];
if (!appScript) throw new Error("Could not find the built application entry script.");

for (const page of pages) {
  const canonical = "https://www.mybytly.com" + page.route;
  let html = original
    .replace(/<title>[\s\S]*?<\/title>/i, "<title>" + escapeHtml(page.title) + "</title>")
    .replace(/<meta name="description" content="[^"]*"\s*\/>/i, '<meta name="description" content="' + escapeHtml(page.description) + '" />')
    .replace(/<meta name="robots" content="[^"]*"\s*\/>/i, '<meta name="robots" content="' + (page.indexable === false ? "noindex, nofollow" : "index, follow, max-image-preview:large") + '" />')
    .replace(/<link rel="canonical" href="[^"]*"\s*\/>/i, '<link rel="canonical" href="' + canonical + '" />')
    .replace(/<meta property="og:title" content="[^"]*"\s*\/>/i, '<meta property="og:title" content="' + escapeHtml(page.title) + '" />')
    .replace(/<meta property="og:description" content="[^"]*"\s*\/>/i, '<meta property="og:description" content="' + escapeHtml(page.description) + '" />')
    .replace(/<meta property="og:url" content="[^"]*"\s*\/>/i, '<meta property="og:url" content="' + canonical + '" />')
    .replace(/<meta name="twitter:title" content="[^"]*"\s*\/>/i, '<meta name="twitter:title" content="' + escapeHtml(page.title) + '" />')
    .replace(/<meta name="twitter:description" content="[^"]*"\s*\/>/i, '<meta name="twitter:description" content="' + escapeHtml(page.description) + '" />');

  const emailLink = page.email
    ? '<p><a href="mailto:' + page.email + '">' + page.email + '</a></p>'
    : "";
  const fallback = '<main lang="ar" dir="rtl" style="min-height:100vh;padding:clamp(2rem,7vw,6rem) 1.5rem;background:#fdfbf7;color:#1a1a2e;font-family:system-ui,sans-serif">' +
    '<article style="max-width:960px;margin:0 auto"><p style="color:#9c8567;font-weight:700">BYTLY | بيتلي</p>' +
    '<h1 style="font-size:clamp(2rem,5vw,3.5rem);line-height:1.35;margin:1rem 0">' + escapeHtml(page.heading) + '</h1>' +
    '<p style="font-size:1.15rem;line-height:2;max-width:780px">' + escapeHtml(page.body) + '</p>' +
    emailLink + '<nav aria-label="روابط بيتلي" style="display:flex;flex-wrap:wrap;gap:1rem;margin:2rem 0">' +
    '<a href="/">الرئيسية</a><a href="/about">من نحن</a><a href="/ContactUs">تواصل معنا</a></nav></article></main>';

  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: page.heading,
    description: page.description,
    url: canonical,
    inLanguage: "ar-SA",
    isPartOf: { "@type": "WebSite", name: "Bytly | بيتلي", url: "https://www.mybytly.com/" }
  }).replace(/</g, "\\u003c");

  html = html.replace(/<body>[\s\S]*?<\/body>/i,
    '<body><div id="root">' + fallback + '</div><script type="application/ld+json">' +
    jsonLd + '</script>' + appScript + "</body>");

  const output = path.join(dist, page.route.replace(/^\//, ""), "index.html");
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, html, "utf8");
  console.log("Generated SEO HTML for " + page.route);
}
