import React from "react";

export default function AuthLayout({ icon: Icon, title, subtitle, footer, children }) {
  return (
    <div
      className="flex items-center justify-center bg-background px-4"
      style={{ minHeight: "100dvh", paddingTop: "calc(env(safe-area-inset-top) + 1rem)", paddingBottom: "calc(env(safe-area-inset-bottom) + 1rem)" }}
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-4 md:mb-8">
          <div className="inline-flex items-center justify-center w-11 h-11 md:w-14 md:h-14 rounded-2xl bg-primary mb-2 md:mb-4">
            <Icon className="w-5 h-5 md:w-7 md:h-7 text-primary-foreground" aria-hidden="true" />
          </div>
          <h1 className="text-xl md:text-3xl font-bold tracking-tight text-foreground">{title}</h1>
          {subtitle && <p className="text-muted-foreground mt-1 text-sm md:text-base">{subtitle}</p>}
        </div>
        <div className="bg-card rounded-2xl shadow-sm border border-border p-4 md:p-8">
          {children}
        </div>
        {footer && (
          <p className="text-center text-sm text-muted-foreground mt-4">{footer}</p>
        )}
      </div>
    </div>
  );
}