"use client";

import { useEffect, useState } from "react";

import { useLocale } from "@/components/locale-provider";
import { formatTemplate } from "@/lib/localization";

export function CopyNoradId({ noradId }: { noradId: number }) {
  const { ui } = useLocale();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) {
      return;
    }
    const timer = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const copy = async () => {
    const value = String(noradId);
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const field = document.createElement("textarea");
      field.value = value;
      field.setAttribute("readonly", "");
      field.style.position = "fixed";
      field.style.opacity = "0";
      document.body.append(field);
      field.select();
      const copiedWithFallback = document.execCommand("copy");
      field.remove();
      if (!copiedWithFallback) {
        return;
      }
    }
    setCopied(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          void copy();
        }}
        aria-label={formatTemplate(ui.copyNoradId, { noradId })}
        className={[
          "inline cursor-copy tabular-nums underline decoration-dotted underline-offset-[3px] transition-colors hover:text-foreground",
          copied ? "text-foreground decoration-solid" : "",
        ].join(" ")}
      >
        {formatTemplate(ui.noradId, { noradId })}
      </button>
      <span aria-live="polite" className="text-foreground">
        {copied ? ` ${ui.noradCopied}` : ""}
      </span>
    </>
  );
}
