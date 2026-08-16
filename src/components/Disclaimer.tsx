import { Info } from "lucide-react";
import { DISCLAIMER } from "@/lib/kinlore";
import { cn } from "@/lib/utils";

export function Disclaimer({ className }: { className?: string }) {
  return (
    <p
      role="note"
      className={cn(
        "flex items-start gap-2 rounded-lg border border-border bg-secondary/60 px-3 py-2 text-sm text-muted-foreground",
        className,
      )}
    >
      <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <span>{DISCLAIMER}</span>
    </p>
  );
}
