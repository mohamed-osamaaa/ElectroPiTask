"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();

  const links = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  ];

  const content = (
    <div className="flex h-full max-h-screen flex-col gap-2">
      <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6 justify-between">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold" onClick={onMobileClose}>
          <span className="text-primary font-bold">ElectroPi</span>
          <span className="text-muted-foreground text-sm">Kanban</span>
        </Link>
        {/* Mobile close button */}
        {onMobileClose && (
          <Button variant="ghost" size="icon" className="md:hidden h-7 w-7" onClick={onMobileClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="flex-1">
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4 mt-4">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.name}
                href={link.href}
                onClick={onMobileClose}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                  pathname === link.href ? "bg-muted text-primary" : ""
                )}
              >
                <Icon className="h-4 w-4" />
                {link.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="border-r bg-muted/40 hidden md:block">
        {content}
      </aside>

      {/* Mobile sidebar drawer */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-[280px] border-r bg-background transition-transform duration-300 ease-in-out md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {content}
      </aside>
    </>
  );
}
