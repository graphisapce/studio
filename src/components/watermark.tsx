import { cn } from "@/lib/utils";

export function Watermark({ className }: { className?: string }) {
  return (
    <div className={cn("absolute bottom-2 right-2 rounded-sm bg-black/50 px-2 py-1 text-xs font-semibold text-white/80 backdrop-blur-sm", className)}>
      Noor Creator
    </div>
  );
}
