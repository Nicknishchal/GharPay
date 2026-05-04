"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Zap } from "lucide-react";
import { cn } from "@/utils/cn";
import { Avatar } from "@/components/ui";

export default function Sidebar() {
  const pathname = usePathname();

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Leads", href: "/leads", icon: Users },
  ];

  return (
    <div className="flex h-full w-64 flex-col bg-[#0f1117] border-r border-white/[0.06]">
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center gap-2.5 px-6 border-b border-white/[0.06]">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 shadow-lg shadow-blue-500/25">
          <Zap className="h-4 w-4 text-white" />
        </div>
        <h1 className="text-[15px] font-bold text-white tracking-tight">
          <span className="text-blue-400">Ghar</span>pay
        </h1>
      </div>

      {/* Nav */}
      <div className="flex flex-1 flex-col overflow-y-auto py-4">
        <div className="px-3 mb-1">
          <p className="px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-2">
            Menu
          </p>
          <nav className="space-y-0.5">
            {navigation.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                    isActive
                      ? "bg-white/[0.08] text-white"
                      : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
                  )}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-r-full bg-blue-500" />
                  )}
                  <item.icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-colors",
                      isActive ? "text-blue-400" : "text-slate-500 group-hover:text-slate-300"
                    )}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* User profile */}
      <div className="shrink-0 border-t border-white/[0.06] px-4 py-4">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-white/[0.04] transition-colors cursor-pointer">
          <Avatar name="Admin User" size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-200">Admin User</p>
            <p className="truncate text-xs text-slate-500">admin@gharpay.in</p>
          </div>
        </div>
      </div>
    </div>
  );
}
