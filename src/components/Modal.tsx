"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface Props {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  /** Zapri z Esc / klikom na ozadje (privzeto da) */
  dismissable?: boolean;
}

const WIDTH = { sm: "max-w-md", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" };

export default function Modal({ title, subtitle, onClose, children, size = "md", dismissable = true }: Props) {
  const [mounted, setMounted] = useState(false);
  const titleId = useId();
  const box = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; });

  useEffect(() => {
    setMounted(true);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const opener = document.activeElement as HTMLElement | null;
    return () => {
      document.body.style.overflow = prevOverflow;
      opener?.focus?.();
    };
  }, []);

  useEffect(() => {
    if (!mounted) return;
    // fokus na prvo vnosno polje (ali na okno)
    const first = box.current?.querySelector<HTMLElement>("input:not([type=hidden]), textarea, select");
    (first ?? box.current)?.focus();
  }, [mounted]);

  useEffect(() => {
    if (!dismissable) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeRef.current(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dismissable]);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto" role="presentation">
      <div className="fixed inset-0 bg-backdrop backdrop-blur-[2px]" onClick={dismissable ? onClose : undefined} />
      <div className="relative min-h-full flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-none">
        <div
          ref={box}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          tabIndex={-1}
          className={`pointer-events-auto card panel-shadow animate-slide-up w-full ${WIDTH[size]} sm:my-8 rounded-b-none sm:rounded-b-[14px] max-h-[100dvh] sm:max-h-none flex flex-col outline-none`}
        >
          <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-3">
            <div className="min-w-0">
              <h2 id={titleId} className="heading text-xl font-semibold text-ink leading-tight">{title}</h2>
              {subtitle && <p className="text-sm text-muted mt-0.5 truncate">{subtitle}</p>}
            </div>
            <button onClick={onClose} className="btn btn-icon -mr-2 -mt-1" aria-label="Zapri">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="px-5 pb-5 overflow-y-auto">{children}</div>
        </div>
      </div>
    </div>,
    document.body
  );
}
