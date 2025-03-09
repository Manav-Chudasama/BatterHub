"use client";

import { useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import FilterDrawer from "@/components/dashboard/FilterDrawer";
import { motion } from "framer-motion";
import {
  RiSearchLine,
  RiFilter3Line,
  RiGridFill,
  RiListUnordered,
  RiMapPinLine,
  RiStarFill,
  RiTimeLine,
  RiArrowDownSLine,
  RiCloseLine,
  RiAddCircleLine,
} from "react-icons/ri";

interface Filters {
  availability: string[];
  skillLevel: string;
  distance: number;
  rating: number;
  categories: string[];
  selectedCategories: string[];
}

// interface Listing {
//   id: number;
//   title: string;
//   description: string;
//   category: string;
//   image: string;
//   user: {
//     name: string;
//     avatar: string;
//     rating: number;
//     reviews: number;
//   };
//   looking: string[];
//   location: string;
//   availability: string;
//   popularity: number;
// }

// Categories array
const categories = [
  "All Categories",
  "Academic Help",
  "Creative Skills",
  "Technology",
  "Language Learning",
  "Music & Arts",
  "Sports & Fitness",
  "Professional Skills",
];

// Mock data for listings (keep existing listings array)
const listings = [
  {
    id: 1,
    title: "Python Programming Tutoring",
    description:
      "Expert Python programming help for beginners to advanced learners. Can help with assignments, projects, and concept understanding.",
    category: "Technology",
    image:
      "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800&auto=format&fit=crop&q=60",
    user: {
      name: "Alex Chen",
      avatar: "https://i.pravatar.cc/150?img=11",
      rating: 4.8,
      reviews: 24,
    },
    looking: ["Guitar Lessons", "Spanish Language", "Graphic Design"],
    location: "Cambridge, MA",
    availability: "Weekends",
    popularity: 95,
  },
  {
    id: 2,
    title: "Guitar Lessons for Beginners",
    description:
      "Patient and experienced guitar teacher offering lessons for beginners. Classical and acoustic guitar styles covered.",
    category: "Music & Arts",
    image:
      "https://images.unsplash.com/photo-1525201548942-d8732f6617a0?w=800&auto=format&fit=crop&q=60",
    user: {
      name: "Maria Garcia",
      avatar: "https://i.pravatar.cc/150?img=12",
      rating: 4.9,
      reviews: 36,
    },
    looking: ["Math Tutoring", "Web Development", "Photography"],
    location: "Boston, MA",
    availability: "Weekday Evenings",
    popularity: 88,
  },
  {
    id: 3,
    title: "Digital Photography Basics",
    description:
      "Learn the fundamentals of digital photography. Covering composition, lighting, and basic editing techniques.",
    category: "Creative Skills",
    image:
      "https://images.unsplash.com/photo-1452780212940-6f5c0d14d848?w=800&auto=format&fit=crop&q=60",
    user: {
      name: "James Wilson",
      avatar: "https://i.pravatar.cc/150?img=13",
      rating: 4.7,
      reviews: 18,
    },
    looking: ["Language Exchange", "Cooking Lessons", "Fitness Training"],
    location: "Somerville, MA",
    availability: "Flexible",
    popularity: 92,
  },
  {
    id: 4,
    title: "Spanish Language Exchange",
    description:
      "Native Spanish speaker offering language exchange sessions. Perfect for intermediate learners looking to improve conversation skills.",
    category: "Language Learning",
    image:
      "https://images.unsplash.com/photo-1610484826967-09c5720778c7?w=800&auto=format&fit=crop&q=60",
    user: {
      name: "Sofia Rodriguez",
      avatar: "https://i.pravatar.cc/150?img=14",
      rating: 4.9,
      reviews: 42,
    },
    looking: ["English Practice", "Math Tutoring", "Music Theory"],
    location: "Cambridge, MA",
    availability: "Mornings",
    popularity: 94,
  },
  // Add more listings as needed
];

// Sorting options
const sortOptions = [
  { label: "Best Match", value: "match" },
  { label: "Newest First", value: "newest" },
  { label: "Highest Rated", value: "rating" },
  { label: "Closest", value: "distance" },
];

export default function ListingsPage() {
  const [isGridView, setIsGridView] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("match");
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    availability: [],
    skillLevel: "",
    distance: 10,
    rating: 4,
    categories: categories,
    selectedCategories: [],
  });

  // Active filter count
  const activeFilterCount =
    filters.availability.length +
    (filters.skillLevel ? 1 : 0) +
    (filters.selectedCategories.length > 0 ? 1 : 0) +
    (filters.rating > 1 ? 1 : 0) +
    (filters.distance !== 50 ? 1 : 0);

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header with improved layout */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-black rounded-lg border border-black/[.08] dark:border-white/[.08] p-6">
          <div>
            <h1 className="text-2xl font-bold">Your Listings</h1>
            <p className="text-black/60 dark:text-white/60">
              Manage and browse your active listings
            </p>
          </div>
          <div className="flex items-center space-x-4">
            {/* Sort Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className="px-4 py-2 rounded-lg border border-black/[.08] dark:border-white/[.08] hover:bg-black/[.02] dark:hover:bg-white/[.02] text-sm font-medium flex items-center space-x-2"
              >
                <span>
                  Sort by:{" "}
                  {sortOptions.find((opt) => opt.value === sortBy)?.label}
                </span>
                <RiArrowDownSLine className="w-4 h-4" />
              </button>
              {showSortDropdown && (
                <div className="absolute right-0 mt-2 w-48 rounded-lg border border-black/[.08] dark:border-white/[.08] bg-white dark:bg-black shadow-lg py-2 z-10">
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSortBy(option.value);
                        setShowSortDropdown(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-black/[.02] dark:hover:bg-white/[.02] ${
                        sortBy === option.value
                          ? "text-emerald-600 dark:text-emerald-500"
                          : "text-black/60 dark:text-white/60"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* View Toggle */}
            <div className="flex items-center space-x-2 border border-black/[.08] dark:border-white/[.08] rounded-lg p-1">
              <button
                onClick={() => setIsGridView(true)}
                className={`p-2 rounded-md transition-colors ${
                  isGridView
                    ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-500"
                    : "text-black/60 dark:text-white/60 hover:bg-black/[.02] dark:hover:bg-white/[.02]"
                }`}
              >
                <RiGridFill className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsGridView(false)}
                className={`p-2 rounded-md transition-colors ${
                  !isGridView
                    ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-500"
                    : "text-black/60 dark:text-white/60 hover:bg-black/[.02] dark:hover:bg-white/[.02]"
                }`}
              >
                <RiListUnordered className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Search and Filters with improved design */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr,auto] gap-4">
          <div className="relative">
            <RiSearchLine className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black/60 dark:text-white/60" />
            <input
              type="text"
              placeholder="Search your listings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-lg border border-black/[.08] dark:border-white/[.08] bg-white dark:bg-black focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
          <button
            onClick={() => setIsFilterOpen(true)}
            className="px-4 py-3 rounded-lg border border-black/[.08] dark:border-white/[.08] hover:bg-black/[.02] dark:hover:bg-white/[.02] text-black/60 dark:text-white/60 flex items-center space-x-2"
          >
            <RiFilter3Line className="w-5 h-5" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-500 text-xs font-medium">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Active Filters */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap gap-2">
            {filters.selectedCategories.map((category) => (
              <button
                key={category}
                onClick={() =>
                  setFilters({
                    ...filters,
                    selectedCategories: filters.selectedCategories.filter(
                      (c) => c !== category
                    ),
                  })
                }
                className="px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-500 text-sm font-medium flex items-center space-x-1"
              >
                <span>{category}</span>
                <RiCloseLine className="w-4 h-4" />
              </button>
            ))}
            {filters.skillLevel && (
              <button
                onClick={() => setFilters({ ...filters, skillLevel: "" })}
                className="px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-500 text-sm font-medium flex items-center space-x-1"
              >
                <span>{filters.skillLevel}</span>
                <RiCloseLine className="w-4 h-4" />
              </button>
            )}
            {filters.availability.length > 0 && (
              <button
                onClick={() => setFilters({ ...filters, availability: [] })}
                className="px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-500 text-sm font-medium flex items-center space-x-1"
              >
                <span>{filters.availability.length} Availabilities</span>
                <RiCloseLine className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() =>
                setFilters({
                  ...filters,
                  availability: [],
                  skillLevel: "",
                  distance: 50,
                  rating: 1,
                  selectedCategories: [],
                })
              }
              className="px-3 py-1.5 rounded-full border border-black/[.08] dark:border-white/[.08] text-black/60 dark:text-white/60 text-sm font-medium hover:bg-black/[.02] dark:hover:bg-white/[.02]"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Create Listing Button */}
        <div className="flex justify-end">
          <button className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors flex items-center space-x-2">
            <RiAddCircleLine className="w-5 h-5" />
            <span>Create New Listing</span>
          </button>
        </div>

        {/* Listings Grid/List */}
        <div
          className={`grid gap-6 ${
            isGridView
              ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
              : "grid-cols-1"
          }`}
        >
          {listings.map((listing) => (
            <motion.div
              key={listing.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-white dark:bg-black rounded-lg border border-black/[.08] dark:border-white/[.08] overflow-hidden ${
                isGridView ? "" : "flex"
              }`}
            >
              <div
                className={`relative ${
                  isGridView ? "aspect-[4/3]" : "w-72 flex-shrink-0"
                }`}
              >
                <img
                  src={listing.image}
                  alt={listing.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-black/60 text-white text-xs font-medium">
                  {listing.category}
                </div>
              </div>
              <div className="p-6 flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-1">
                      {listing.title}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-black/60 dark:text-white/60">
                      <div className="flex items-center">
                        <RiMapPinLine className="w-4 h-4 mr-1" />
                        {listing.location}
                      </div>
                      <div className="flex items-center">
                        <RiTimeLine className="w-4 h-4 mr-1" />
                        {listing.availability}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 text-yellow-400">
                    <RiStarFill className="w-4 h-4" />
                    <span className="font-medium">{listing.user.rating}</span>
                  </div>
                </div>
                <p className="text-sm text-black/60 dark:text-white/60 mb-4">
                  {listing.description}
                </p>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <img
                      src={listing.user.avatar}
                      alt={listing.user.name}
                      className="w-8 h-8 rounded-full"
                    />
                    <div>
                      <div className="text-sm font-medium">
                        {listing.user.name}
                      </div>
                      <div className="text-xs text-black/60 dark:text-white/60">
                        {listing.user.reviews} reviews
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-black/60 dark:text-white/60">
                    <span className="text-emerald-600 dark:text-emerald-500 font-medium">
                      {listing.popularity}% Match
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">Looking for:</div>
                  <div className="flex flex-wrap gap-2">
                    {listing.looking.map((item, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 rounded-lg bg-black/[.02] dark:bg-white/[.02] text-xs"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="mt-4 flex space-x-2">
                  <button className="flex-1 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors">
                    Propose Trade
                  </button>
                  <button className="px-4 py-2 rounded-lg border border-black/[.08] dark:border-white/[.08] hover:bg-black/[.02] dark:hover:bg-white/[.02] text-black/60 dark:text-white/60 text-sm font-medium">
                    Save
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex justify-center space-x-2">
          <button className="px-4 py-2 rounded-lg border border-black/[.08] dark:border-white/[.08] hover:bg-black/[.02] dark:hover:bg-white/[.02] text-black/60 dark:text-white/60 text-sm font-medium">
            Previous
          </button>
          <button className="px-4 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-500 text-sm font-medium">
            1
          </button>
          <button className="px-4 py-2 rounded-lg border border-black/[.08] dark:border-white/[.08] hover:bg-black/[.02] dark:hover:bg-white/[.02] text-black/60 dark:text-white/60 text-sm font-medium">
            2
          </button>
          <button className="px-4 py-2 rounded-lg border border-black/[.08] dark:border-white/[.08] hover:bg-black/[.02] dark:hover:bg-white/[.02] text-black/60 dark:text-white/60 text-sm font-medium">
            3
          </button>
          <button className="px-4 py-2 rounded-lg border border-black/[.08] dark:border-white/[.08] hover:bg-black/[.02] dark:hover:bg-white/[.02] text-black/60 dark:text-white/60 text-sm font-medium">
            Next
          </button>
        </div>

        {/* Filter Drawer */}
        <FilterDrawer
          isOpen={isFilterOpen}
          onClose={() => setIsFilterOpen(false)}
          filters={filters}
          setFilters={setFilters}
        />
      </div>
    </DashboardLayout>
  );
}
