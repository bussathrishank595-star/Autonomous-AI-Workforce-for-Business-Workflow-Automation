"use client";

import React from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Users, CheckSquare, UploadCloud, Settings, LogOut, Terminal } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-800 dark:border-neutral-700 dark:border-t-neutral-100" />
      </div>
    );
  }

  const menuItems = [
    { label: "Dashboard", href: "/", icon: LayoutDashboard },
    { label: "Candidates", href: "/candidates", icon: Users },
    { label: "Tasks", href: "/tasks", icon: CheckSquare },
    { label: "Uploads", href: "/uploads", icon: UploadCloud },
    { label: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-neutral-50 dark:bg-neutral-950">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex flex-col justify-between p-4">
        <div className="space-y-6">
          <div className="flex items-center gap-2.5 px-2.5 py-1">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-950 font-mono text-sm font-semibold">
              O
            </div>
            <div>
              <span className="font-semibold tracking-tight text-neutral-900 dark:text-neutral-100 text-sm">AgentOS HR</span>
              <span className="ml-1.5 inline-block text-[10px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-500 px-1.5 py-0.2 rounded">MVP</span>
            </div>
          </div>

          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition ${
                    isActive
                      ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white"
                      : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 hover:text-neutral-950 dark:hover:text-neutral-200"
                  }`}
                >
                  <Icon className="h-4.5 w-4.5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Session and Logout */}
        <div className="space-y-3.5 border-t border-neutral-150 dark:border-neutral-800 pt-4">
          <div className="flex items-center justify-between px-2.5">
            <div className="truncate pr-2">
              <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate">
                {session?.user?.name || "HR Recruiter"}
              </p>
              <p className="text-[10px] text-neutral-500 truncate">{session?.user?.email}</p>
            </div>
            <button
              onClick={() => signOut()}
              title="Logout"
              className="text-neutral-400 hover:text-neutral-950 dark:hover:text-white transition"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Workspace Frame */}
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  );
}
