"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronDown, ChevronRight, X } from "lucide-react";
import { ISidebar } from "./sidebar-config";
import { cn } from "@/lib/utils";

interface AdminSidebarProps {
  config: ISidebar[];
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
}

function SidebarItem({ item, pathname }: { item: ISidebar; pathname: string }) {
  const [isOpen, setIsOpen] = useState(false);

  if (item.type === "GROUP") {
    return (
      <div className="mb-4">
        <h4 className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
          {item.label}
        </h4>
        <div className="space-y-1">
          {item.children?.map((child, index) => (
            <SidebarItem key={index} item={child} pathname={pathname} />
          ))}
        </div>
      </div>
    );
  }

  if (item.type === "COLLAPSE") {
    const Icon = item.icon;
    const isActive = item.children?.some(
      (c) => c.href && pathname.startsWith(c.href),
    );

    return (
      <div className="space-y-1">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "flex w-full items-center justify-between rounded-lg px-4 py-2 text-sm font-medium transition-colors",
            isActive
              ? "bg-gray-100 text-gray-900"
              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
          )}
        >
          <div className="flex items-center gap-3">
            {Icon && <Icon className="h-5 w-5" />}
            <span>{item.label}</span>
          </div>
          {isOpen ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
        {isOpen && (
          <div className="ml-4 space-y-1 border-l border-gray-200 pl-4 mt-1">
            {item.children?.map((child, index) => (
              <SidebarItem key={index} item={child} pathname={pathname} />
            ))}
          </div>
        )}
      </div>
    );
  }

  // ITEM
  const Icon = item.icon;
  const isActive = item.href ? pathname === item.href : false;

  return (
    <Link
      href={item.href || "#"}
      className={cn(
        "flex items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
        isActive
          ? "bg-gray-100 text-gray-900"
          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
      )}
    >
      {Icon && <Icon className="h-5 w-5" />}
      <span>{item.label}</span>
    </Link>
  );
}

export function AdminSidebar({ config, isOpen, setIsOpen }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform bg-white border-r border-gray-200 transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between px-6 border-b border-gray-200 bg-white">
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-xl text-gray-900 tracking-tight"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
                <line x1="4" x2="4" y1="22" y2="15"></line>
              </svg>
            </span>
            <span>Admin</span>
          </Link>
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden text-gray-500 hover:text-gray-900"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <nav className="h-[calc(100vh-4rem)] overflow-y-auto p-4 flex flex-col gap-1">
          {config.map((item, index) => (
            <SidebarItem key={index} item={item} pathname={pathname || ""} />
          ))}
        </nav>
      </aside>
    </>
  );
}
