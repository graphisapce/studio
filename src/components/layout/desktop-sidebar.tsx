import Link from "next/link";
import { Home, LayoutDashboard, LogIn } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/dashboard", icon: LayoutDashboard, label: "My Dashboard" },
  { href: "/login", icon: LogIn, label: "Login / Sign Up" },
];

export function DesktopSidebar() {
  return (
    <aside className="w-64 flex-col border-r bg-background p-4 hidden md:flex">
      <div className="p-4">
        <Logo />
      </div>
      <nav className="flex flex-col gap-2 mt-8">
        {navItems.map((item) => (
          <Button key={item.label} variant="ghost" className="justify-start gap-3 px-4 py-2 text-left" asChild>
            <Link href={item.href}>
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          </Button>
        ))}
      </nav>
      <div className="mt-auto p-4 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} LocalVyapar</p>
      </div>
    </aside>
  );
}
