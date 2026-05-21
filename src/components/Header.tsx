"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useApp } from "@/lib/providers";

export default function Header() {
  const pathname = usePathname();
  const { settings } = useApp();

  const navItems = [
    { href: "/", label: "Home", icon: "🏠" },
    { href: "/settings", label: "Settings", icon: "⚙️" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/30 transition-shadow">
            VG
          </div>
          <div>
            <span className="font-semibold text-lg bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              VideoGPT
            </span>
            <span className="text-[10px] text-gray-500 block leading-none -mt-0.5">
              Intelligence Platform
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "px-4 py-2 rounded-lg text-sm transition-all duration-200 flex items-center gap-2",
                pathname === item.href
                  ? "bg-white/10 text-white font-medium"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              )}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          ))}
          {settings && (
            <div className="ml-2 flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-400 font-medium truncate max-w-[100px]">
                {settings.provider}
              </span>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
