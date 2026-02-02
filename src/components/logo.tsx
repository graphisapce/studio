import Link from "next/link";
import { Store } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2 text-lg font-bold text-navy dark:text-primary-foreground", className)}>
      <Store className="h-6 w-6 text-primary" />
      <span className="font-headline">LocalVyapar</span>
    </Link>
  );
}
