"use client";

import { motion, AnimatePresence } from "framer-motion";
import { RiCloseLine } from "react-icons/ri";

interface Filters {
  availability: string[];
  skillLevel: string;
  distance: number;
  rating: number;
  categories: string[];
  selectedCategories: string[];
}

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: Filters;
  setFilters: (filters: Filters) => void;
}

const availabilityOptions = [
  "Weekday Mornings",
  "Weekday Afternoons",
  "Weekday Evenings",
  "Weekends",
  "Flexible",
];

const skillLevelOptions = ["Beginner", "Intermediate", "Advanced", "Expert"];

export default function FilterDrawer({
  isOpen,
  onClose,
  filters,
  setFilters,
}: FilterDrawerProps) {
  const updateFilters = (key: keyof Filters, value: Filters[keyof Filters]) => {
    setFilters({ ...filters, [key]: value });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm z-50"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 20 }}
            className="fixed top-0 right-0 h-screen w-full max-w-md bg-white dark:bg-black border-l border-black/[.08] dark:border-white/[.08] z-50 overflow-y-auto"
          >
            <div className="sticky top-0 bg-white dark:bg-black border-b border-black/[.08] dark:border-white/[.08] p-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Filters</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-black/[.02] dark:hover:bg-white/[.02] text-black/60 dark:text-white/60"
              >
                <RiCloseLine className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-8">
              {/* Categories */}
              <div className="space-y-4">
                <h3 className="font-medium">Categories</h3>
                <div className="grid grid-cols-2 gap-2">
                  {filters.categories.map((category) => (
                    <button
                      key={category}
                      onClick={() =>
                        updateFilters(
                          "selectedCategories",
                          filters.selectedCategories?.includes(category)
                            ? filters.selectedCategories.filter(
                                (c: string) => c !== category
                              )
                            : [...(filters.selectedCategories || []), category]
                        )
                      }
                      className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                        filters.selectedCategories?.includes(category)
                          ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-500"
                          : "bg-black/[.02] dark:bg-white/[.02] text-black/60 dark:text-white/60 hover:bg-black/[.05] dark:hover:bg-white/[.05]"
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {/* Availability */}
              <div className="space-y-4">
                <h3 className="font-medium">Availability</h3>
                <div className="space-y-2">
                  {availabilityOptions.map((option) => (
                    <label
                      key={option}
                      className="flex items-center space-x-3 p-2 rounded-lg hover:bg-black/[.02] dark:hover:bg-white/[.02] cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={filters.availability.includes(option)}
                        onChange={(e) =>
                          updateFilters(
                            "availability",
                            e.target.checked
                              ? [...filters.availability, option]
                              : filters.availability.filter((a) => a !== option)
                          )
                        }
                        className="w-4 h-4 rounded border-black/[.08] dark:border-white/[.08] text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-sm">{option}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Skill Level */}
              <div className="space-y-4">
                <h3 className="font-medium">Skill Level</h3>
                <div className="grid grid-cols-2 gap-2">
                  {skillLevelOptions.map((level) => (
                    <button
                      key={level}
                      onClick={() => updateFilters("skillLevel", level)}
                      className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                        filters.skillLevel === level
                          ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-500"
                          : "bg-black/[.02] dark:bg-white/[.02] text-black/60 dark:text-white/60 hover:bg-black/[.05] dark:hover:bg-white/[.05]"
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              {/* Distance Range */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Maximum Distance</h3>
                  <span className="text-sm text-black/60 dark:text-white/60">
                    {filters.distance} miles
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={filters.distance}
                  onChange={(e) =>
                    updateFilters("distance", parseInt(e.target.value))
                  }
                  className="w-full h-2 rounded-lg appearance-none bg-black/[.02] dark:bg-white/[.02] accent-emerald-600"
                />
                <div className="flex justify-between text-xs text-black/40 dark:text-white/40">
                  <span>1 mile</span>
                  <span>50 miles</span>
                </div>
              </div>

              {/* Minimum Rating */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Minimum Rating</h3>
                  <span className="text-sm text-black/60 dark:text-white/60">
                    {filters.rating}+ stars
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="0.5"
                  value={filters.rating}
                  onChange={(e) =>
                    updateFilters("rating", parseFloat(e.target.value))
                  }
                  className="w-full h-2 rounded-lg appearance-none bg-black/[.02] dark:bg-white/[.02] accent-emerald-600"
                />
                <div className="flex justify-between text-xs text-black/40 dark:text-white/40">
                  <span>1★</span>
                  <span>5★</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="sticky bottom-0 bg-white dark:bg-black border-t border-black/[.08] dark:border-white/[.08] p-4 flex space-x-4">
              <button
                onClick={() =>
                  setFilters({
                    availability: [],
                    skillLevel: "",
                    distance: 10,
                    rating: 4,
                    categories: filters.categories,
                    selectedCategories: [],
                  })
                }
                className="flex-1 px-4 py-2 rounded-lg border border-black/[.08] dark:border-white/[.08] hover:bg-black/[.02] dark:hover:bg-white/[.02] text-black/60 dark:text-white/60 text-sm font-medium"
              >
                Reset Filters
              </button>
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
