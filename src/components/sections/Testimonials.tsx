"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Computer Science Student",
    quote:
      "I exchanged my programming skills for guitar lessons. BatterHub made it incredibly easy to find the perfect match and coordinate the exchange.",
    traded: "Programming Skills ↔ Guitar Lessons",
    image: "https://i.pravatar.cc/150?img=1",
  },
  {
    name: "Michael Rodriguez",
    role: "Business Major",
    quote:
      "As a business student, I traded my marketing expertise for math tutoring. The platform's trust system gave me confidence in the exchange.",
    traded: "Marketing Help ↔ Math Tutoring",
    image: "https://i.pravatar.cc/150?img=2",
  },
  {
    name: "Emma Thompson",
    role: "Art Student",
    quote:
      "I needed photography equipment for my project and exchanged my digital design skills. The community here is incredibly supportive and talented.",
    traded: "Digital Design ↔ Photography Equipment",
    image: "https://i.pravatar.cc/150?img=3",
  },
];

export function Testimonials() {
  return (
    <section className="py-20">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Student Success Stories
            </h2>
            <p className="text-black/60 dark:text-white/60">
              See how students are using BatterHub to exchange skills and
              resources, making their college experience better.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white dark:bg-black rounded-lg p-6 border border-black/[.08] dark:border-white/[.08] hover:border-emerald-200/20 dark:hover:border-emerald-700/20 transition-all duration-300"
              >
                <div className="flex items-center mb-6">
                  <Image
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="rounded-full"
                    width={48}
                    height={48}
                  />
                  <div className="ml-4">
                    <h3 className="font-semibold">{testimonial.name}</h3>
                    <p className="text-sm text-black/60 dark:text-white/60">
                      {testimonial.role}
                    </p>
                  </div>
                </div>
                <blockquote className="text-black/80 dark:text-white/80 mb-4">
                  &quot;{testimonial.quote}&quot;
                </blockquote>
                <div className="pt-4 border-t border-black/[.08] dark:border-white/[.08]">
                  <p className="text-sm text-emerald-600 dark:text-emerald-500 font-medium">
                    {testimonial.traded}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-center mt-16"
          >
            <Link
              href="/signup"
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors"
            >
              Join the Community
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
