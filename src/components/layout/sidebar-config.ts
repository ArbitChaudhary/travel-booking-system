import {
  LayoutDashboard,
  Hotel,
  Car,
  Users,
  Map,
  LucideIcon,
} from "lucide-react";

export interface ISidebar {
  label: string;
  href?: string;
  icon?: LucideIcon;
  type: "GROUP" | "COLLAPSE" | "ITEM";
  children?: ISidebar[];
}

export const sidebarConfig: ISidebar[] = [
  {
    label: "Main",
    type: "GROUP",
    children: [
      { label: "Dashboard", href: "/", icon: LayoutDashboard, type: "ITEM" },
    ],
  },
  {
    label: "Management",
    type: "GROUP",
    children: [
      { label: "Hotels", href: "/hotels", icon: Hotel, type: "ITEM" },
      { label: "Car Rental", href: "/cars", icon: Car, type: "ITEM" },
      { label: "Tours", href: "/tours", icon: Map, type: "ITEM" },
      { label: "Users", href: "/users", icon: Users, type: "ITEM" },
    ],
  },
];
