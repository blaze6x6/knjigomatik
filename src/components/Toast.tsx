"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { CircleAlert, CircleCheck } from "lucide-react";

type Kind = "ok" | "error";
const Ctx = createContext<(message: string, kind?: Kind) => void>(() => {});
export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ id: number; message: string; kind: Kind } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((message: string, kind: Kind = "ok") => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ id: Date.now(), message, kind });
    timer.current = setTimeout(() => setToast(null), 3500);
  }, []);

  return (
    <Ctx.Provider value={show}>
      {children}
      <div aria-live="polite" className="fixed left-0 right-0 bottom-20 md:bottom-6 z-[70] flex justify-center px-4 pointer-events-none">
        {toast && (
          <div key={toast.id} className="animate-fade-in card panel-shadow pointer-events-auto flex items-center gap-2 px-4 py-2.5 text-sm text-ink max-w-md">
            {toast.kind === "ok" ? <CircleCheck className="w-4 h-4 text-moss shrink-0" /> : <CircleAlert className="w-4 h-4 text-rust shrink-0" />}
            <span>{toast.message}</span>
          </div>
        )}
      </div>
    </Ctx.Provider>
  );
}
