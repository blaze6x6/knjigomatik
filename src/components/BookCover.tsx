"use client";

import { useState } from "react";
import { SPINE_COLORS } from "@/lib/status";

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

interface Props {
  title: string;
  author?: string;
  thumbnail: string | null;
  color?: string;
  className?: string;
}

/** Naslovnica; če slike ni ali se ne naloži, narišemo lastno platnico. */
export default function BookCover({ title, author, thumbnail, color, className = "w-20 h-[116px]" }: Props) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showImg = thumbnail && failedSrc !== thumbnail;
  const real = color && color.toLowerCase() !== "#ffffff" ? color : null;
  const bg = real ?? SPINE_COLORS[1 + (hash(title) % (SPINE_COLORS.length - 1))];

  return (
    <div className={`cover shrink-0 ${className}`} style={{ background: bg }}>
      {showImg ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={thumbnail} alt={`Naslovnica: ${title}`} loading="lazy" referrerPolicy="no-referrer" onError={() => setFailedSrc(thumbnail)} />
      ) : (
        <div className="h-full w-full p-2 flex flex-col justify-between text-center" style={{ color: "#f7efe0" }}>
          <div className="border-t border-b py-1.5 mt-1" style={{ borderColor: "rgba(247,239,224,0.45)" }}>
            <div className="heading text-[11px] leading-tight font-semibold line-clamp-4 break-words">{title}</div>
          </div>
          {author && <div className="text-[9px] opacity-80 line-clamp-2 leading-tight">{author}</div>}
        </div>
      )}
    </div>
  );
}
