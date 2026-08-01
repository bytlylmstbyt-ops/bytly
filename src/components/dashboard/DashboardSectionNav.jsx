import React, { useState, useEffect } from "react";

/**
 * DashboardSectionNav — sticky pill navigation with scroll-spy.
 * Lets admins jump to any dashboard section without scrolling the whole
 * page, and highlights the section currently in view. Reduces scroll
 * fatigue on long dashboards.
 */
export default function DashboardSectionNav({ sections }) {
  const [active, setActive] = useState(sections[0]?.id);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin: "-25% 0px -65% 0px", threshold: 0 }
    );
    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [sections]);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 150;
    window.scrollTo({ top, behavior: "smooth" });
  };

  return (
    <div className="sticky top-16 md:top-20 z-30">
      <div className="flex gap-1.5 overflow-x-auto py-1.5 px-1 bg-white/90 backdrop-blur rounded-xl border border-slate-200 shadow-sm">
        {sections.map((s) => (
          <button
            key={s.id}
            onClick={() => scrollTo(s.id)}
            className={`whitespace-nowrap text-xs font-medium px-3.5 py-1.5 rounded-lg transition-colors ${
              active === s.id
                ? "bg-[#C9A66B] text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}