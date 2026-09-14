/**
 * Shared JSON-LD schema builders for SEO structured data.
 * Site: https://mybytly.com
 */
const SITE = "https://mybytly.com";

export const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Bytly | بيتلي",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web, iOS, Android",
  url: SITE,
  description:
    "منصة هندسية متكاملة لإدارة المشاريع الهندسية: التصميم، التنفيذ، المالية، الضمان، العقود، والمتابعة الذكية.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "SAR" },
};

export function webPageSchema({ name, description, path = "" }) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name,
    description,
    url: `${SITE}${path}`,
    isPartOf: { "@type": "WebSite", name: "بيتلي", url: SITE },
  };
}