import React from "react";

/**
 * Bytly Brand Palette — minor + major colors defined as the single source of truth.
 * Tokens live in src/index.css (--bytly-*), mapped to Tailwind in tailwind.config.js (brand-*).
 * Use these hex values when raw colors are needed in inline styles or arbitrary values.
 *
 * Major (core brand):
 *   --bytly-primary:       #6B5D4F  → bg-brand-primary / text-brand-primary
 *   --bytly-primary-dark:  #4A3F35  → bg-brand-dark
 *   --bytly-accent:        #C9A66B  → bg-brand-accent / text-brand-accent
 *   --bytly-accent-light:  #E5D4B8  → bg-brand-accent-light
 *
 * Minor (supporting surfaces & inks):
 *   --bytly-ink:           #1A1A2E  → bg-brand-ink / text-brand-ink   (dark hero surfaces)
 *   --bytly-ink-soft:      #2D2D4E  → bg-brand-ink-soft               (mid dark gradients)
 *   --bytly-cream:         #F5F0E8  → bg-brand-cream                 (soft section bg)
 *
 * Standard gradient patterns (reuse, don't invent new gold shades):
 *   Primary→Accent:   from-brand-primary to-brand-accent        (main CTA buttons)
 *   Ink→Accent:        from-brand-ink to-brand-accent            (hero cards/headers)
 *   Accent→Light:     from-brand-accent to-brand-accent-light    (soft gold text)
 *   Dark→Primary:     from-brand-dark to-brand-primary            (dark CTA panels)
 */

export const BYTLY_PALETTE = {
  primary: "#6B5D4F",
  primaryDark: "#4A3F35",
  accent: "#C9A66B",
  accentLight: "#E5D4B8",
  ink: "#1A1A2E",
  inkSoft: "#2D2D4E",
  cream: "#F5F0E8",
};

// Visual reference (not rendered by default) — import where a palette swatch strip is needed.
export function PaletteReference() {
  const swatches = [
    { name: "primary", hex: BYTLY_PALETTE.primary, label: "أساسي" },
    { name: "primary-dark", hex: BYTLY_PALETTE.primaryDark, label: "أساسي غامق" },
    { name: "accent", hex: BYTLY_PALETTE.accent, label: "ذهبي" },
    { name: "accent-light", hex: BYTLY_PALETTE.accentLight, label: "ذهبي فاتح" },
    { name: "ink", hex: BYTLY_PALETTE.ink, label: "حبري" },
    { name: "ink-soft", hex: BYTLY_PALETTE.inkSoft, label: "حبري ناعم" },
    { name: "cream", hex: BYTLY_PALETTE.cream, label: "كريمي" },
  ];
  return (
    <div className="flex flex-wrap gap-3">
      {swatches.map((s) => (
        <div key={s.name} className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-lg border border-black/10" style={{ background: s.hex }} />
          <span className="text-[10px] text-slate-500 mt-1">{s.label}</span>
        </div>
      ))}
    </div>
  );
}

export default PaletteReference;