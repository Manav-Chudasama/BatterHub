"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { SignInButton, SignUpButton, useUser } from "@clerk/nextjs";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isLoaded } = useUser();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-black/[.08] dark:border-white/[.08]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-xl font-bold">
                Batter<span className="text-emerald-600">Hub</span>
              </span>
            </Link>
          </motion.div>

          {/* Desktop Navigation */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="hidden md:flex items-center space-x-8"
          >
            <Link
              href="/features"
              className="text-sm text-black/60 dark:text-white/60 hover:text-emerald-600 dark:hover:text-emerald-500 transition-colors"
            >
              Features
            </Link>
            <Link
              href="/how-it-works"
              className="text-sm text-black/60 dark:text-white/60 hover:text-emerald-600 dark:hover:text-emerald-500 transition-colors"
            >
              How It Works
            </Link>
            <Link
              href="/pricing"
              className="text-sm text-black/60 dark:text-white/60 hover:text-emerald-600 dark:hover:text-emerald-500 transition-colors"
            >
              Pricing
            </Link>
            <div className="flex items-center space-x-4">
              {!isLoaded ? (
                // Loading state
                <div className="h-9 w-16 bg-black/[.02] dark:bg-white/[.02] rounded-lg animate-pulse" />
              ) : user ? (
                // User profile or dashboard link when logged in
                <Link
                  href="/dashboard"
                  className="text-sm text-black/80 dark:text-white/80 hover:text-emerald-600 dark:hover:text-emerald-500 transition-colors"
                >
                  Dashboard
                </Link>
              ) : (
                // Sign in and sign up buttons when logged out
                <>
                  <SignInButton mode="modal">
                    <button className="text-sm text-black/80 dark:text-white/80 hover:text-emerald-600 dark:hover:text-emerald-500 transition-colors">
                      Log in
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors">
                      Sign up
                    </button>
                  </SignUpButton>
                </>
              )}
            </div>
          </motion.div>

          {/* Mobile Menu Button */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="md:hidden p-2 rounded-lg hover:bg-black/[.04] dark:hover:bg-white/[.04] transition-colors"
            onClick={() => setIsOpen(!isOpen)}
          >
            <span className="sr-only">Open menu</span>
            <svg
              className="w-6 h-6 text-black/80 dark:text-white/80"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </motion.button>
        </div>

        {/* Mobile Menu */}
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{
            height: isOpen ? "auto" : 0,
            opacity: isOpen ? 1 : 0,
          }}
          transition={{ duration: 0.3 }}
          className="md:hidden overflow-hidden"
        >
          <div className="py-4 space-y-4">
            <Link
              href="/features"
              className="block text-sm text-black/60 dark:text-white/60 hover:text-emerald-600 dark:hover:text-emerald-500 transition-colors"
            >
              Features
            </Link>
            <Link
              href="/how-it-works"
              className="block text-sm text-black/60 dark:text-white/60 hover:text-emerald-600 dark:hover:text-emerald-500 transition-colors"
            >
              How It Works
            </Link>
            <Link
              href="/pricing"
              className="block text-sm text-black/60 dark:text-white/60 hover:text-emerald-600 dark:hover:text-emerald-500 transition-colors"
            >
              Pricing
            </Link>
            <div className="pt-4 space-y-4">
              {!isLoaded ? (
                // Loading state
                <div className="h-9 w-full bg-black/[.02] dark:bg-white/[.02] rounded-lg animate-pulse" />
              ) : user ? (
                // User profile or dashboard link when logged in
                <Link
                  href="/dashboard"
                  className="block text-sm text-black/80 dark:text-white/80 hover:text-emerald-600 dark:hover:text-emerald-500 transition-colors"
                >
                  Dashboard
                </Link>
              ) : (
                // Sign in and sign up buttons when logged out
                <>
                  <SignInButton mode="modal">
                    <button className="block w-full text-sm text-black/80 dark:text-white/80 hover:text-emerald-600 dark:hover:text-emerald-500 transition-colors">
                      Log in
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button className="block w-full px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors">
                      Sign up
                    </button>
                  </SignUpButton>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </nav>
  );
}
