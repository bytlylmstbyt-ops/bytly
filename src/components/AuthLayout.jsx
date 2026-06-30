import React from "react";

export default function AuthLayout({ icon: Icon, title, subtitle, footer, children }) {
  return (
    <div
      className="flex items-center justify-center bg-background px-4 py-8"
      style={{ minHeight: "100dvh", paddingTop: "calc(env(safe-area-inset-top) + 2rem)", paddingBottom: "calc(env(safe-area-inset-bottom) + 2rem)" }}
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-6 md:mb-10">
          <div className="inline-flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-primary mb-3 md:mb-4">
            <Icon className="w-6 h-6 md:w-7 md:h-7 text-primary-foreground" aria-hidden="true" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">{title}</h1>
          {subtitle && <p className="text-muted-foreground mt-2 text-sm md:text-base">{subtitle}</p>}
        </div>
        <div className="bg-card rounded-2xl shadow-sm border border-border p-5 md:p-8">
          {children}
        </div>
        {footer && (
          <p className="text-center text-sm text-muted-foreground mt-6">{footer}</p>
        )}
      </div>
    </div>
  );
}