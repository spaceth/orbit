"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function SpaceTHLogo() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const logoSrc = mounted && resolvedTheme === "dark" ? "/spaceth-dark.svg" : "/spaceth.svg";

  return (
    <div className="fixed top-0 left-1/2 z-30 flex h-14 w-40 -translate-x-1/2 items-start justify-center pt-5">
      <a
        href="https://spaceth.co"
        target="_blank"
        rel="noopener noreferrer"
        className="transition-opacity duration-300"
      >
        <img src={logoSrc} alt="SpaceTH" className="h-4 w-auto sm:h-[20px]" />
      </a>
    </div>
  );
}
