"use client";
import { Navbar } from "@/components/Navbar";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { Stats } from "@/components/sections/Stats";
import { Testimonials } from "@/components/sections/Testimonials";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { Footer } from "@/components/Footer";

// Dynamically import Lottie component with SSR disabled
const LottieAnimation = dynamic(() => import("@/components/LottieAnimation"), {
  ssr: false,
});

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-20 overflow-hidden">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Text Content */}
            <motion.div
              initial="initial"
              animate="animate"
              variants={fadeInUp}
              className="text-center lg:text-left"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="inline-block mb-4 px-4 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200/20 dark:border-emerald-700/20"
              >
                <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                  🎓 For Students, By Students
                </span>
              </motion.div>
              <motion.h1
                variants={fadeInUp}
                className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight"
              >
                Exchange Skills & Resources in Your{" "}
                <span className="text-emerald-600 dark:text-emerald-500">
                  Student Community
                </span>
              </motion.h1>
              <motion.p
                variants={fadeInUp}
                className="text-sm sm:text-base text-black/60 dark:text-white/60 mb-8 max-w-lg mx-auto lg:mx-0"
              >
                Join BatterHub - where students help students through a unique
                barter system. Share your skills, trade resources, and build
                meaningful connections.
              </motion.p>
              <motion.div
                variants={stagger}
                className="flex gap-4 items-center justify-center lg:justify-start flex-col sm:flex-row"
              >
                <motion.a
                  variants={fadeInUp}
                  whileHover={{ scale: 1.05 }}
                  className="rounded-lg border border-solid border-transparent transition-colors flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white gap-2 text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-8 w-full sm:w-auto font-medium"
                  href="/signup"
                >
                  Get Started
                </motion.a>
                <motion.a
                  variants={fadeInUp}
                  whileHover={{ scale: 1.05 }}
                  className="rounded-lg border border-solid border-black/[.08] dark:border-white/[.08] transition-colors flex items-center justify-center hover:bg-black/[.02] dark:hover:bg-white/[.02] text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-8 w-full sm:w-auto font-medium"
                  href="/about"
                >
                  Learn More
                </motion.a>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="mt-8 flex items-center justify-center lg:justify-start gap-6 text-sm text-black/60 dark:text-white/60"
              >
                <div className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-emerald-600 dark:text-emerald-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>Free to join</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-emerald-600 dark:text-emerald-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>No fees</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-emerald-600 dark:text-emerald-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>Secure trades</span>
                </div>
              </motion.div>
            </motion.div>

            {/* Right Column - Animation */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="w-full max-w-lg mx-auto">
                <LottieAnimation />
              </div>
              {/* Background Gradient */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/5 to-transparent blur-3xl -z-10" />
            </motion.div>
          </div>
        </div>
      </section>
      <section className="py-20 bg-black/[.02] dark:bg-white/[.02]">
        <div className="px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.5, delay: index * 0.1 },
                  },
                }}
                whileHover={{ y: -5 }}
                className="rounded-lg border border-black/[.08] dark:border-white/[.08] bg-white dark:bg-black p-6 hover:border-emerald-200/20 dark:hover:border-emerald-700/20 transition-colors"
              >
                <motion.div
                  className="mb-4 text-emerald-600 dark:text-emerald-500"
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  {feature.icon}
                </motion.div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-black/60 dark:text-white/60">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
      <HowItWorks />
      <Testimonials />
      <Stats />
      <section className="bg-black/[.02] dark:bg-white/[.02] py-20">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center max-w-3xl mx-auto"
            >
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                Ready to Start Trading?
              </h2>
              <p className="text-black/60 dark:text-white/60 mb-8">
                Join BatterHub today and become part of a growing community of
                students helping students. Start exchanging skills and resources
                that matter to you.
              </p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex flex-col sm:flex-row gap-4 justify-center"
              >
                <motion.a
                  whileHover={{ scale: 1.05 }}
                  className="rounded-lg border border-solid border-transparent transition-colors flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 text-sm font-medium"
                  href="/signup"
                >
                  Create Your Account
                </motion.a>
                <motion.a
                  whileHover={{ scale: 1.05 }}
                  className="rounded-lg border border-solid border-black/[.08] dark:border-white/[.08] transition-colors flex items-center justify-center hover:bg-black/[.02] dark:hover:bg-white/[.02] px-8 py-3 text-sm font-medium"
                  href="/about"
                >
                  Learn More
                </motion.a>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}

const features = [
  {
    title: "Skill Catalog",
    description:
      "Browse and list skills or items for exchange. Find what you need or share what you can offer.",
    icon: (
      <svg
        className="w-8 h-8"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
        />
      </svg>
    ),
  },
  {
    title: "Easy Bartering",
    description:
      "Negotiate trades directly with other students through our intuitive chat system.",
    icon: (
      <svg
        className="w-8 h-8"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
        />
      </svg>
    ),
  },
  {
    title: "Trust System",
    description:
      "Build reputation through successful trades and reviews from fellow students.",
    icon: (
      <svg
        className="w-8 h-8"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
        />
      </svg>
    ),
  },
  {
    title: "Community Goals",
    description:
      "Participate in collective projects and contribute to shared community objectives.",
    icon: (
      <svg
        className="w-8 h-8"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
        />
      </svg>
    ),
  },
];
