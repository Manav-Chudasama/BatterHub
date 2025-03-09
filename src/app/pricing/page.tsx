"use client";

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";

const plans = [
  {
    name: "Basic",
    price: "Free",
    description: "Perfect for getting started with skill exchanges",
    features: [
      "Up to 5 active listings",
      "Basic matching algorithm",
      "Community chat access",
      "Student verification",
      "Basic profile customization",
    ],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Pro",
    price: "$5",
    period: "per month",
    description: "Enhanced features for active traders",
    features: [
      "Unlimited active listings",
      "Advanced matching algorithm",
      "Priority chat support",
      "Verified Pro badge",
      "Advanced analytics",
      "Custom categories",
      "Featured listings",
    ],
    cta: "Go Pro",
    popular: true,
  },
  {
    name: "Community",
    price: "Custom",
    description: "For university clubs and organizations",
    features: [
      "All Pro features",
      "Community dashboard",
      "Event organization tools",
      "Bulk student verification",
      "Custom branding",
      "API access",
      "Dedicated support",
    ],
    cta: "Contact Us",
    popular: false,
  },
];

export default function Pricing() {
  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-20">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center max-w-3xl mx-auto"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="inline-block mb-4 px-4 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200/20 dark:border-emerald-700/20"
              >
                <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                  Simple Pricing
                </span>
              </motion.div>
              <h1 className="text-4xl sm:text-5xl font-bold mb-6">
                Choose the Perfect{" "}
                <span className="text-emerald-600 dark:text-emerald-500">
                  Plan
                </span>
              </h1>
              <p className="text-black/60 dark:text-white/60 text-lg mb-8">
                Start with our free plan and upgrade as your exchange network
                grows. No hidden fees, cancel anytime.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pricing Grid */}
      <section className="py-20 bg-black/[.02] dark:bg-white/[.02]">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {plans.map((plan, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className={`relative bg-white dark:bg-black rounded-lg p-8 border ${
                    plan.popular
                      ? "border-emerald-500/50 dark:border-emerald-500/50"
                      : "border-black/[.08] dark:border-white/[.08]"
                  } hover:border-emerald-200/20 dark:hover:border-emerald-700/20 transition-all duration-300`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <span className="bg-emerald-600 text-white text-xs font-medium px-3 py-1 rounded-full">
                        Most Popular
                      </span>
                    </div>
                  )}
                  <div className="text-center mb-8">
                    <h3 className="text-lg font-semibold mb-2">{plan.name}</h3>
                    <div className="mb-4">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      {plan.period && (
                        <span className="text-black/60 dark:text-white/60 text-sm">
                          {" "}
                          {plan.period}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-black/60 dark:text-white/60">
                      {plan.description}
                    </p>
                  </div>
                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li
                        key={featureIndex}
                        className="flex items-center text-sm text-black/80 dark:text-white/80"
                      >
                        <svg
                          className="w-5 h-5 mr-3 text-emerald-600 dark:text-emerald-500 flex-shrink-0"
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
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <motion.a
                    whileHover={{ scale: 1.02 }}
                    className={`w-full flex items-center justify-center px-6 py-3 rounded-lg transition-colors text-sm font-medium ${
                      plan.popular
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                        : "border border-black/[.08] dark:border-white/[.08] hover:bg-black/[.02] dark:hover:bg-white/[.02]"
                    }`}
                    href={
                      plan.popular
                        ? "/signup"
                        : plan.name === "Community"
                        ? "/contact"
                        : "/signup"
                    }
                  >
                    {plan.cta}
                  </motion.a>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-black/60 dark:text-white/60">
                Got questions? We&apos;ve got answers.
              </p>
            </motion.div>
            <div className="space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="bg-white dark:bg-black rounded-lg p-6 border border-black/[.08] dark:border-white/[.08]"
              >
                <h3 className="font-semibold mb-2">Can I cancel anytime?</h3>
                <p className="text-sm text-black/60 dark:text-white/60">
                  Yes, you can cancel your subscription at any time. You&apos;ll
                  continue to have access to Pro features until the end of your
                  billing period.
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="bg-white dark:bg-black rounded-lg p-6 border border-black/[.08] dark:border-white/[.08]"
              >
                <h3 className="font-semibold mb-2">
                  What payment methods do you accept?
                </h3>
                <p className="text-sm text-black/60 dark:text-white/60">
                  We accept all major credit cards, debit cards, and PayPal. All
                  payments are processed securely through Stripe.
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-white dark:bg-black rounded-lg p-6 border border-black/[.08] dark:border-white/[.08]"
              >
                <h3 className="font-semibold mb-2">
                  Do you offer student discounts?
                </h3>
                <p className="text-sm text-black/60 dark:text-white/60">
                  Yes! Students with a valid .edu email address get 20% off the
                  Pro plan. The discount is automatically applied when you sign
                  up with your student email.
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
