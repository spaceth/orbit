"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function SpaceTHLogo() {
  const [hover, setHover] = useState(false);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const logoSrc = mounted && resolvedTheme === "dark" ? "/spaceth-dark.svg" : "/spaceth.svg";

  return (
    <div
      className="fixed top-0 left-1/2 z-30 flex h-14 w-40 -translate-x-1/2 items-start justify-center pt-5"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <a
        href="https://spaceth.co"
        target="_blank"
        rel="noopener noreferrer"
        className={`transition-opacity duration-300 ${
          hover ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <img src={logoSrc} alt="SpaceTH" className="h-[20px] w-auto" />
      </a>
    </div>
  );
}
