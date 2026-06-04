"use client";

import { useState } from "react";
import { AdminSidebar } from "./admin-sidebar";
import { sidebarConfig } from "./sidebar-config";
import { Menu } from "lucide-react";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <AdminSidebar
        config={sidebarConfig}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      <div className="flex flex-1 flex-col overflow-hidden w-full relative">
        <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 lg:hidden shrink-0">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="text-gray-500 hover:text-gray-900 focus:outline-none"
          >
            <Menu className="h-6 w-6" />
          </button>
          <span className="font-bold text-lg">Admin</span>
          <div className="w-6" /> {/* Spacer to center the title */}
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
