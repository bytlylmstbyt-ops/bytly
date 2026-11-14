import fs from "node:fs";
import path from "node:path";

const dist = path.resolve("dist");
const sourcePath = path.join(dist, "index.html");
if (!fs.existsSync(sourcePath)) throw new Error("dist/index.html is missing; run vite build first.");

const routes = [
  { path: "/About", title: "من نحن | منصة بيتلي", description: "تعرّف على بيتلي، المنظومة الهندسية المتكاملة التي تربط أصحاب المشاريع بالمهندسين والاستشاريين ومقدمي الخدمات في السعودية.", heading: "من نحن", body: "بيتلي منصة هندسية لتنظيم العلاقة بين أصحاب المشاريع ومقدمي الخدمات، ومتابعة الطلبات والمشاريع ومراحل العمل في مكان واحد." },
  { path: "/ContactUs", title: "تواصل معنا | منصة بيتلي", description: "تواصل مع فريق بيتلي للاستفسارات والدعم حول الخدمات الهندسية وإدارة المشاريع في السعودية.", heading: "تواصل معنا", body: "يسعد فريق بيتلي استقبال استفساراتك وملاحظاتك المتعلقة بالمنصة والخدمات الهندسية." },
  { path: "/Terms", title: "الشروط والأحكام | منصة بيتلي", description: "اطلع على الشروط والأحكام المنظمة لاستخدام منصة بيتلي وخدماتها.", heading: "الشروط والأحكام", body: "توضح هذه الصفحة الأحكام العامة لاستخدام منصة بيتلي. يرجى مراجعة الشروط المنشورة داخل المنصة قبل استخدام خدماتها." },
  { path: "/Privacy", title: "سياسة الخصوصية | منصة بيتلي", description: "تعرف على سياسة الخصوصية وكيفية تعامل منصة بيتلي مع بيانات المستخدمين.", heading: "سياسة الخصوصية", body: "توضح سياسة الخصوصية مبادئ التعامل مع البيانات والمعلومات التي يقدمها المستخدم عند استخدام منصة بيتلي." },
  { path: "/Copyright", title: "حقوق الملكية | منصة بيتلي", description: "معلومات حقوق الملكية الفكرية والمحتوى المنشور على منصة بيتلي.", heading: "حقوق الملكية", body: "تحترم بيتلي حقوق الملكية الفكرية. لا يجوز إعادة استخدام المحتوى أو المواد المحمية دون إذن أصحاب الحقوق." },
  { path: "/Complaints", title: "الشكاوى | منصة بيتلي", description: "قنوات تقديم الشكاوى ومتابعتها لدى منصة بيتلي.", heading: "الشكاوى", body: "يمكن للمستخدمين تقديم الشكاوى المتعلقة باستخدام المنصة أو الخدمات، مع توضيح موضوع الشكوى وإرفاق المعلومات الداعمة." },
  { path: "/Support", title: "الدعم الفني | منصة بيتلي", description: "احصل على الدعم والمساعدة عند استخدام منصة بيتلي وخدماتها الهندسية.", heading: "الدعم الفني", body: "تعرّف على قنوات المساعدة المتاحة واطلب الدعم عند مواجهة مشكلة في استخدام منصة بيتلي." },
  { path: "/FAQ", title: "الأسئلة الشائعة | منصة بيتلي", description: "إجابات عن الأسئلة الشائعة حول منصة بيتلي والخدمات الهندسية وإدارة المشاريع وآلية استخدام المنصة.", heading: "الأسئلة الشائعة", body: "تجد هنا إجابات تساعدك على فهم خدمات بيتلي، وآلية التواصل بين أصحاب المشاريع ومقدمي الخدمات، ومتابعة الطلبات والمشاريع." },
  { path: "/Certificates", title: "الشهادات والاعتمادات | منصة بيتلي", description: "تعرف على صفحة الشهادات والاعتمادات في بيتلي، وحالة إتاحة هذه الخدمة ضمن الإطلاق التجريبي للمنصة.", heading: "الشهادات والاعتمادات", body: "هذه الخدمة ضمن مرحلة الإطلاق التجريبي. لا تعتبر الصفحة إثباتاً لإصدار شهادة أو اعتماد رسمي، ويُعلن عن الإتاحة عند اكتمال المتطلبات." },
  { path: "/CostEstimator", title: "حاسبة تكاليف البناء | منصة بيتلي", description: "احصل على تقدير أولي لتكلفة البناء وفق نوع المبنى والمساحة والتشطيب والمنطقة، ثم راجع التفاصيل قبل اتخاذ قرارك.", heading: "حاسبة تكاليف البناء", body: "تقدم الحاسبة تقديراً استرشادياً أولياً وليست عرض سعر أو مقايسة معتمدة. تختلف التكلفة الفعلية بحسب المخططات والمواصفات والأسعار السائدة وعروض المقاولين." },
  { path: "/audiences/engineering-firms", title: "لشركات ومكاتب الهندسة | منصة بيتلي", description: "منصة بيتلي تساعد المكاتب والشركات الهندسية على عرض خدماتها والتواصل مع أصحاب المشاريع في السعودية.", heading: "حلول لشركات ومكاتب الهندسة", body: "اعرض خدمات مكتبك، واستقبل طلبات أصحاب المشاريع، ونظّم التواصل ومتابعة مراحل العمل من خلال منصة بيتلي." },
  { path: "/audiences/contractors", title: "للمقاولين | منصة بيتلي", description: "اكتشف كيف تساعد بيتلي المقاولين على الوصول إلى فرص المشاريع والتواصل مع أصحاب المشاريع في السعودية.", heading: "حلول للمقاولين", body: "تساعد بيتلي المقاولين على التعرف على فرص العمل وتنظيم التواصل مع أصحاب المشاريع ومتابعة تفاصيل الطلبات." },
  { path: "/audiences/consulting-teams", title: "للاستشاريين الهندسيين | منصة بيتلي", description: "تعرّف على خدمات بيتلي للفرق والاستشاريين الهندسيين وإدارة فرص العمل والمشاريع في السعودية.", heading: "حلول للاستشاريين الهندسيين", body: "استخدم بيتلي لعرض الخدمات الاستشارية وتنظيم طلبات العملاء ومتابعة الأعمال والمشاريع." }
];

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[char]));

const original = fs.readFileSync(sourcePath, "utf8");
const appScript = original.match(/<script type="module"[^>]*src="[^"]+"[^>]*><\/script>/i)?.[0];
if (!appScript) throw new Error("Could not find the built application entry script.");

for (const route of routes) {
  const canonical = "https://www.mybytly.com" + route.path;
  const title = escapeHtml(route.title);
  const description = escapeHtml(route.description);
  let html = original
    .replace(/<title>[\s\S]*?<\/title>/i, "<title>" + title + "</title>")
    .replace(/<meta name="description" content="[^"]*"\s*\/>/i, '<meta name="description" content="' + description + '" />')
    .replace(/<meta name="robots" content="[^"]*"\s*\/>/i, '<meta name="robots" content="index, follow, max-image-preview:large" />')
    .replace(/<link rel="canonical" href="[^"]*"\s*\/>/i, '<link rel="canonical" href="' + canonical + '" />')
    .replace(/<meta property="og:title" content="[^"]*"\s*\/>/i, '<meta property="og:title" content="' + title + '" />')
    .replace(/<meta property="og:description" content="[^"]*"\s*\/>/i, '<meta property="og:description" content="' + description + '" />')
    .replace(/<meta property="og:url" content="[^"]*"\s*\/>/i, '<meta property="og:url" content="' + canonical + '" />')
    .replace(/<meta name="twitter:title" content="[^"]*"\s*\/>/i, '<meta name="twitter:title" content="' + title + '" />')
    .replace(/<meta name="twitter:description" content="[^"]*"\s*\/>/i, '<meta name="twitter:description" content="' + description + '" />');

  const heading = escapeHtml(route.heading);
  const body = escapeHtml(route.body);
  const fallback = `<main lang="ar" dir="rtl" class="bytly-static-fallback" style="min-height:100vh;padding:clamp(2rem,7vw,6rem) 1.5rem;background:#fdfbf7;color:#1a1a2e;font-family:system-ui,sans-serif">
    <article style="max-width:960px;margin:0 auto">
      <p style="color:#9c8567;font-weight:700;letter-spacing:.04em">BYTLY | بيتلي</p>
      <h1 style="font-size:clamp(2rem,5vw,3.5rem);line-height:1.35;margin:1rem 0">${heading}</h1>
      <p style="font-size:1.15rem;line-height:2;max-width:780px">${body}</p>
      <nav aria-label="روابط بيتلي" style="display:flex;flex-wrap:wrap;gap:1rem;margin:2rem 0">
        <a href="/" style="color:#6b5d4f">الرئيسية</a>
        <a href="/About" style="color:#6b5d4f">من نحن</a>
        <a href="/FAQ" style="color:#6b5d4f">الأسئلة الشائعة</a>
        <a href="/ContactUs" style="color:#6b5d4f">تواصل معنا</a>
      </nav>
    </article>
  </main>`;
  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: route.heading,
    description: route.description,
    url: canonical,
    inLanguage: "ar-SA",
    isPartOf: { "@type": "WebSite", name: "Bytly | بيتلي", url: "https://www.mybytly.com/" }
  }).replace(/</g, "\\u003c");

  html = html.replace(/<body>[\s\S]*?<\/body>/i,
    '<body><noscript><p>بيتلي — المنظومة الهندسية المتكاملة في المملكة العربية السعودية.</p></noscript><div id="root">' +
    fallback + '</div><script type="application/ld+json">' + jsonLd + '</script>' +
    appScript + "</body>");

  const output = path.join(dist, route.path.replace(/^\//, ""), "index.html");
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, html, "utf8");
}
console.log("Generated " + routes.length + " route-specific public HTML pages.");
