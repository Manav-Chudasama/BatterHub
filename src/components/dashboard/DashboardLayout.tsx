"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  RiDashboardLine,
  RiListUnordered,
  RiMessage2Line,
  RiTeamLine,
  RiUser3Line,
  RiSettings4Line,
  RiNotification3Line,
  RiMenuFoldLine,
  RiMenuUnfoldLine,
  RiAddCircleLine,
  RiFileListLine,
  RiExchangeLine,
  RiBookmarkLine,
} from "react-icons/ri";
import { useState } from "react";
import { UserButton } from "@clerk/nextjs";

const sidebarLinks = [
  {
    icon: RiDashboardLine,
    label: "Dashboard",
    href: "/dashboard",
  },
  {
    icon: RiListUnordered,
    label: "Browse Listings",
    href: "/dashboard/listings",
  },
  {
    icon: RiAddCircleLine,
    label: "Create Listing",
    href: "/dashboard/listings/new",
  },
  {
    icon: RiFileListLine,
    label: "My Listings",
    href: "/dashboard/listings/my",
  },
  {
    icon: RiExchangeLine,
    label: "Trade Requests",
    href: "/dashboard/trade-requests",
    badge: 2,
  },
  {
    icon: RiBookmarkLine,
    label: "Saved Listings",
    href: "/dashboard/listings/saved",
  },
  {
    icon: RiMessage2Line,
    label: "Messages",
    href: "/dashboard/messages",
    badge: 3,
  },
  {
    icon: RiTeamLine,
    label: "Community Goals",
    href: "/dashboard/community-goals",
  },
  {
    icon: RiUser3Line,
    label: "Profile",
    href: "/dashboard/profile",
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white dark:bg-black border border-black/[.08] dark:border-white/[.08] text-black/60 dark:text-white/60"
      >
        <RiMenuUnfoldLine className="w-5 h-5" />
      </button>

      {/* Mobile Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          x: isMobileMenuOpen ? 0 : "-100%",
        }}
        transition={{
          x: { duration: 0.3 },
        }}
        className="fixed top-0 left-0 h-screen w-64 border-r border-black/[.08] dark:border-white/[.08] bg-white dark:bg-black z-40 lg:hidden"
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-black/[.08] dark:border-white/[.08]">
          <Link href="/dashboard" className="flex items-center">
            <span className="text-xl font-bold">
              Batter<span className="text-emerald-600">Hub</span>
            </span>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="p-4 space-y-2">
          {sidebarLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  isActive
                    ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-500"
                    : "text-black/60 dark:text-white/60 hover:bg-black/[.02] dark:hover:bg-white/[.02]"
                }`}
              >
                <link.icon className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium">{link.label}</span>
                {link.badge && (
                  <span className="ml-auto bg-emerald-600 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-black/[.08] dark:border-white/[.08]">
          <div className="flex items-center space-x-4">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-10 h-10",
                },
              }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">Your Profile</p>
              <p className="text-xs text-black/60 dark:text-white/60 truncate">
                Manage your account
              </p>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: isSidebarCollapsed ? "5rem" : "16rem",
        }}
        transition={{
          width: { duration: 0.3 },
        }}
        className="fixed top-0 left-0 h-screen border-r border-black/[.08] dark:border-white/[.08] bg-white dark:bg-black z-40 hidden lg:block"
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-black/[.08] dark:border-white/[.08]">
          <Link href="/dashboard" className="flex items-center">
            {!isSidebarCollapsed && (
              <span className="text-xl font-bold">
                Batter<span className="text-emerald-600">Hub</span>
              </span>
            )}
            {isSidebarCollapsed && (
              <span className="text-xl font-bold text-emerald-600">B</span>
            )}
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="p-4 space-y-2">
          {sidebarLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  isActive
                    ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-500"
                    : "text-black/60 dark:text-white/60 hover:bg-black/[.02] dark:hover:bg-white/[.02]"
                }`}
              >
                <link.icon className="w-5 h-5 flex-shrink-0" />
                {!isSidebarCollapsed && (
                  <span className="text-sm font-medium">{link.label}</span>
                )}
                {!isSidebarCollapsed && link.badge && (
                  <span className="ml-auto bg-emerald-600 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-black/[.08] dark:border-white/[.08]">
          <div className="flex items-center space-x-4">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-10 h-10",
                },
              }}
            />
            {!isSidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">Your Profile</p>
                <p className="text-xs text-black/60 dark:text-white/60 truncate">
                  Manage your account
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Collapse Button */}
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="absolute top-4 -right-4 p-1.5 rounded-full bg-white dark:bg-black border border-black/[.08] dark:border-white/[.08] text-black/60 dark:text-white/60 hover:text-emerald-600 dark:hover:text-emerald-500"
        >
          {isSidebarCollapsed ? (
            <RiMenuUnfoldLine className="w-4 h-4" />
          ) : (
            <RiMenuFoldLine className="w-4 h-4" />
          )}
        </button>
      </motion.aside>

      {/* Main Content */}
      <main
        className={`min-h-screen transition-all duration-300 ${
          isSidebarCollapsed ? "lg:ml-20" : "lg:ml-64"
        }`}
      >
        {/* Top Bar */}
        <div className="sticky top-0 z-30 h-16 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-black/[.08] dark:border-white/[.08]">
          <div className="h-full px-4 flex items-center justify-between">
            <h1 className="text-xl font-semibold">Dashboard</h1>
            <div className="flex items-center space-x-4">
              <button className="p-2 rounded-lg text-black/60 dark:text-white/60 hover:text-emerald-600 dark:hover:text-emerald-500 hover:bg-black/[.02] dark:hover:bg-white/[.02]">
                <RiNotification3Line className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="p-4 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
