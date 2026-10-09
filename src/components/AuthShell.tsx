import type { ReactNode } from "react";
import Logo from "./Logo";
import ThemePicker from "./ThemePicker";

export default function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle?: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10 relative">
      <div className="absolute top-3 right-3"><ThemePicker /></div>
      <div className="w-full max-w-md animate-fade-in">
        <div className="flex flex-col items-center text-center mb-7">
          <Logo size={56} />
          <h1 className="heading text-3xl font-semibold text-ink mt-4">Knjigomatik</h1>
          <div className="shelf-rule w-24 mt-3" />
        </div>
        <div className="card panel-shadow p-6 sm:p-7">
          <h2 className="heading text-xl font-semibold text-ink">{title}</h2>
          {subtitle && <p className="text-sm text-muted mt-1 mb-5 leading-relaxed">{subtitle}</p>}
          {!subtitle && <div className="mb-5" />}
          {children}
        </div>
        {footer && <div className="text-center text-sm text-muted mt-5 leading-relaxed">{footer}</div>}
      </div>
    </div>
  );
}
