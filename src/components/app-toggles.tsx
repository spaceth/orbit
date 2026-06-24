import { LocaleToggle } from "@/components/locale-toggle";
import { ThemeToggle } from "@/components/theme-toggle";

export function AppToggles() {
  return (
    <div className="fixed top-0 right-5 z-30 flex items-start gap-3 pt-5 text-foreground">
      <LocaleToggle />
      <ThemeToggle />
    </div>
  );
}
