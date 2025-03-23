"use client";

import React from "react";
import Link from "next/link";
import {
  RiExchangeLine,
  RiTwitterLine,
  RiInstagramLine,
  RiFacebookLine,
  RiLinkedinLine,
} from "react-icons/ri";

const Footer: React.FC = () => {
  return (
    <footer className="bg-white dark:bg-black border-t border-black/[.08] dark:border-white/[.08] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand/Logo */}
          <div className="col-span-1 md:col-span-1">
            <Link href="/" className="flex items-center">
              <RiExchangeLine className="w-8 h-8 text-emerald-600" />
              <span className="ml-2 text-xl font-bold">BatterHub</span>
            </Link>
            <p className="mt-4 text-sm text-black/60 dark:text-white/60">
              A platform for skill trading and peer-to-peer learning. Connect,
              share, and grow together.
            </p>
            <div className="mt-4 flex space-x-4">
              <a
                href="#"
                className="text-black/40 dark:text-white/40 hover:text-emerald-600 dark:hover:text-emerald-500"
                aria-label="Twitter"
              >
                <RiTwitterLine className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="text-black/40 dark:text-white/40 hover:text-emerald-600 dark:hover:text-emerald-500"
                aria-label="Instagram"
              >
                <RiInstagramLine className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="text-black/40 dark:text-white/40 hover:text-emerald-600 dark:hover:text-emerald-500"
                aria-label="Facebook"
              >
                <RiFacebookLine className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="text-black/40 dark:text-white/40 hover:text-emerald-600 dark:hover:text-emerald-500"
                aria-label="LinkedIn"
              >
                <RiLinkedinLine className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div className="col-span-1">
            <h3 className="text-sm font-semibold uppercase tracking-wider">
              Platform
            </h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link
                  href="/listings"
                  className="text-sm text-black/60 dark:text-white/60 hover:text-emerald-600 dark:hover:text-emerald-500"
                >
                  Browse Listings
                </Link>
              </li>
              <li>
                <Link
                  href="/features"
                  className="text-sm text-black/60 dark:text-white/60 hover:text-emerald-600 dark:hover:text-emerald-500"
                >
                  Features
                </Link>
              </li>
              <li>
                <Link
                  href="/pricing"
                  className="text-sm text-black/60 dark:text-white/60 hover:text-emerald-600 dark:hover:text-emerald-500"
                >
                  Pricing
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard"
                  className="text-sm text-black/60 dark:text-white/60 hover:text-emerald-600 dark:hover:text-emerald-500"
                >
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          <div className="col-span-1">
            <h3 className="text-sm font-semibold uppercase tracking-wider">
              Support
            </h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link
                  href="/help"
                  className="text-sm text-black/60 dark:text-white/60 hover:text-emerald-600 dark:hover:text-emerald-500"
                >
                  Help Center
                </Link>
              </li>
              <li>
                <Link
                  href="/faq"
                  className="text-sm text-black/60 dark:text-white/60 hover:text-emerald-600 dark:hover:text-emerald-500"
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-sm text-black/60 dark:text-white/60 hover:text-emerald-600 dark:hover:text-emerald-500"
                >
                  Contact Us
                </Link>
              </li>
              <li>
                <Link
                  href="/community"
                  className="text-sm text-black/60 dark:text-white/60 hover:text-emerald-600 dark:hover:text-emerald-500"
                >
                  Community
                </Link>
              </li>
            </ul>
          </div>

          <div className="col-span-1">
            <h3 className="text-sm font-semibold uppercase tracking-wider">
              Legal
            </h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link
                  href="/privacy"
                  className="text-sm text-black/60 dark:text-white/60 hover:text-emerald-600 dark:hover:text-emerald-500"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-sm text-black/60 dark:text-white/60 hover:text-emerald-600 dark:hover:text-emerald-500"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/cookies"
                  className="text-sm text-black/60 dark:text-white/60 hover:text-emerald-600 dark:hover:text-emerald-500"
                >
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/guidelines"
                  className="text-sm text-black/60 dark:text-white/60 hover:text-emerald-600 dark:hover:text-emerald-500"
                >
                  Community Guidelines
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-black/[.08] dark:border-white/[.08] text-center">
          <p className="text-sm text-black/40 dark:text-white/40">
            &copy; {new Date().getFullYear()} BatterHub. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
