"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface Props {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: "current-password" | "new-password";
  hint?: string;
  required?: boolean;
}

export default function PasswordField({ id, label, value, onChange, autoComplete, hint, required = true }: Props) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      <div className="relative">
        <input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          required={required}
          className="input pr-11"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="btn btn-icon absolute right-1 top-1/2 -translate-y-1/2"
          aria-label={show ? "Skrij geslo" : "Pokaži geslo"}
          tabIndex={-1}
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {hint && <p className="text-xs text-faint mt-1">{hint}</p>}
    </div>
  );
}
