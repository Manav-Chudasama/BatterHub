"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import {
  RiUser3Line,
  RiMailLine,
  RiMapPinLine,
  RiStarLine,
  RiEdit2Line,
  RiSaveLine,
  RiImageAddLine,
  RiLoader4Line,
  RiThumbUpLine,
  RiCalendarLine,
} from "react-icons/ri";
import Link from "next/link";

interface UserProfile {
  _id: string;
  userId: string;
  name: string;
  email: string;
  profilePicture?: string;
  bio?: string;
  location?: {
    city?: string;
    state?: string;
    country?: string;
  };
  reputationScore: number;
  skills: string[];
  interests: string[];
  accountStatus: string;
  createdAt: string;
  lastActive?: string;
  savedListings?: Array<{
    _id: string;
    title: string;
    images?: string[];
    category: string;
    createdAt: string;
  }>;
  tradeHistory?: Array<{
    _id: string;
    type: "sent" | "received";
    status: string;
    createdAt: string;
    fromListing?: {
      _id: string;
      title: string;
      images?: string[];
    };
    toListing: {
      _id: string;
      title: string;
      images?: string[];
    };
  }>;
}

interface Review {
  _id: string;
  tradeRequestId: string;
  reviewerId: string;
  reviewer: {
    _id: string;
    name: string;
    profilePicture?: string;
  };
  reviewedUserId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export default function ProfilePage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);
  const [activeTab, setActiveTab] = useState<"saved" | "trades" | "reviews">(
    "saved"
  );
  const [error, setError] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    city: "",
    state: "",
    country: "",
    skills: "",
    interests: "",
  });

  useEffect(() => {
    if (isLoaded && user) {
      fetchUserProfile();
      fetchUserReviews();
    } else if (isLoaded && !user) {
      router.push("/");
    }
  }, [isLoaded, user, router]);

  const fetchUserProfile = async () => {
    setIsLoading(true);
    setError("");
    try {
      // Fetch the user profile from your API
      const response = await fetch(`/api/users/${user?.id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch user profile");
      }
      const data = await response.json();
      setUserProfile(data);

      // Set initial form data
      setFormData({
        name: data.name || "",
        bio: data.bio || "",
        city: data.location?.city || "",
        state: data.location?.state || "",
        country: data.location?.country || "",
        skills: data.skills?.join(", ") || "",
        interests: data.interests?.join(", ") || "",
      });
    } catch (error) {
      console.error("Error fetching user profile:", error);
      setError("Failed to load user profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserReviews = async () => {
    if (!user?.id) return;
    setIsLoadingReviews(true);

    try {
      const response = await fetch(`/api/reviews?reviewedUserId=${user.id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch user reviews");
      }
      const data = await response.json();
      setReviews(data.reviews || []);
    } catch (error) {
      console.error("Error fetching user reviews:", error);
    } finally {
      setIsLoadingReviews(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);

    try {
      const updateData = {
        name: formData.name,
        bio: formData.bio,
        location: {
          city: formData.city,
          state: formData.state,
          country: formData.country,
        },
        skills: formData.skills
          .split(",")
          .map((skill) => skill.trim())
          .filter(Boolean),
        interests: formData.interests
          .split(",")
          .map((interest) => interest.trim())
          .filter(Boolean),
      };

      const response = await fetch(`/api/users/${user?.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      const data = await response.json();
      setUserProfile(data.user);
      setEditMode(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      setError("Failed to update profile. Please try again.");
    } finally {
      setSaveLoading(false);
    }
  };

  // Show loading state
  if (!isLoaded || (isLoading && !userProfile)) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto space-y-8 animate-pulse">
          <div className="h-32 bg-black/[.02] dark:bg-white/[.02] rounded-lg" />
          <div className="h-64 bg-black/[.02] dark:bg-white/[.02] rounded-lg" />
          <div className="h-48 bg-black/[.02] dark:bg-white/[.02] rounded-lg" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-4xl mx-auto mb-8"
      >
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Profile</h1>
          <p className="text-black/60 dark:text-white/60">
            Manage your personal information and preferences
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Profile Header */}
        <div className="bg-white dark:bg-black rounded-lg border border-black/[.08] dark:border-white/[.08] p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            <div className="relative">
              <div className="relative h-24 w-24 rounded-full overflow-hidden bg-emerald-100 dark:bg-emerald-900/20">
                {user?.imageUrl ? (
                  <Image
                    src={user.imageUrl}
                    alt={user.fullName || "Profile"}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-4xl font-medium">
                    {user?.fullName?.[0] || "U"}
                  </div>
                )}
              </div>
              <button
                onClick={() => user?.update && user.update({})}
                className="absolute bottom-0 right-0 bg-white dark:bg-black rounded-full p-1.5 shadow-md border border-black/[.08] dark:border-white/[.08] text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white"
              >
                <RiImageAddLine className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1">
              <h2 className="text-xl font-bold">{user?.fullName || "User"}</h2>
              <div className="flex items-center gap-1 text-black/60 dark:text-white/60 mt-1">
                <RiMailLine className="w-4 h-4" />
                <span>
                  {user?.primaryEmailAddress?.emailAddress ||
                    "Email not available"}
                </span>
              </div>

              {userProfile?.location &&
                (userProfile.location.city ||
                  userProfile.location.state ||
                  userProfile.location.country) && (
                  <div className="flex items-center gap-1 text-black/60 dark:text-white/60 mt-1">
                    <RiMapPinLine className="w-4 h-4" />
                    <span>
                      {[
                        userProfile.location.city,
                        userProfile.location.state,
                        userProfile.location.country,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                  </div>
                )}

              <div className="flex items-center gap-1 text-amber-500 mt-1">
                <RiStarLine className="w-4 h-4" />
                <span className="font-medium">
                  {userProfile?.reputationScore || 0}
                </span>
                <span className="text-black/60 dark:text-white/60 text-sm">
                  Reputation Score
                </span>
              </div>
            </div>

            <button
              onClick={() => setEditMode(!editMode)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm ${
                editMode
                  ? "bg-black/[.05] hover:bg-black/[.08] dark:bg-white/[.05] dark:hover:bg-white/[.08] text-black/70 dark:text-white/70"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white"
              }`}
            >
              {editMode ? (
                <>
                  <RiEdit2Line className="w-4 h-4" />
                  Cancel
                </>
              ) : (
                <>
                  <RiEdit2Line className="w-4 h-4" />
                  Edit Profile
                </>
              )}
            </button>
          </div>
        </div>

        {/* Profile Form/Content */}
        <div className="bg-white dark:bg-black rounded-lg border border-black/[.08] dark:border-white/[.08] p-6 mb-6">
          {editMode ? (
            // Edit Mode Form
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-black/70 dark:text-white/70 mb-1"
                  >
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-black/[.08] dark:border-white/[.08] rounded-lg bg-transparent focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="city"
                    className="block text-sm font-medium text-black/70 dark:text-white/70 mb-1"
                  >
                    City
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-black/[.08] dark:border-white/[.08] rounded-lg bg-transparent focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="state"
                    className="block text-sm font-medium text-black/70 dark:text-white/70 mb-1"
                  >
                    State/Province
                  </label>
                  <input
                    type="text"
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-black/[.08] dark:border-white/[.08] rounded-lg bg-transparent focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="country"
                    className="block text-sm font-medium text-black/70 dark:text-white/70 mb-1"
                  >
                    Country
                  </label>
                  <input
                    type="text"
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-black/[.08] dark:border-white/[.08] rounded-lg bg-transparent focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="mb-6">
                <label
                  htmlFor="bio"
                  className="block text-sm font-medium text-black/70 dark:text-white/70 mb-1"
                >
                  Bio
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full p-2 border border-black/[.08] dark:border-white/[.08] rounded-lg bg-transparent focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label
                    htmlFor="skills"
                    className="block text-sm font-medium text-black/70 dark:text-white/70 mb-1"
                  >
                    Skills (comma-separated)
                  </label>
                  <input
                    type="text"
                    id="skills"
                    name="skills"
                    value={formData.skills}
                    onChange={handleInputChange}
                    placeholder="photography, gardening, cooking"
                    className="w-full p-2 border border-black/[.08] dark:border-white/[.08] rounded-lg bg-transparent focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="interests"
                    className="block text-sm font-medium text-black/70 dark:text-white/70 mb-1"
                  >
                    Interests (comma-separated)
                  </label>
                  <input
                    type="text"
                    id="interests"
                    name="interests"
                    value={formData.interests}
                    onChange={handleInputChange}
                    placeholder="art, sports, technology"
                    className="w-full p-2 border border-black/[.08] dark:border-white/[.08] rounded-lg bg-transparent focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saveLoading}
                  className="flex items-center gap-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg disabled:opacity-70"
                >
                  {saveLoading ? (
                    <>
                      <RiLoader4Line className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <RiSaveLine className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            // View Mode Content
            <div>
              {userProfile?.bio ? (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">About Me</h3>
                  <p className="text-black/80 dark:text-white/80">
                    {userProfile.bio}
                  </p>
                </div>
              ) : (
                <div className="mb-6 p-4 bg-black/[.02] dark:bg-white/[.02] rounded-lg text-center">
                  <p className="text-black/60 dark:text-white/60">
                    No bio added yet. Click Edit Profile to add one.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Skills</h3>
                  {userProfile?.skills && userProfile.skills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {userProfile.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-full text-sm"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-black/60 dark:text-white/60">
                      No skills added yet
                    </p>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Interests</h3>
                  {userProfile?.interests &&
                  userProfile.interests.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {userProfile.interests.map((interest, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full text-sm"
                        >
                          {interest}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-black/60 dark:text-white/60">
                      No interests added yet
                    </p>
                  )}
                </div>
              </div>

              <div className="border-t border-black/[.08] dark:border-white/[.08] pt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <RiCalendarLine className="w-5 h-5 text-black/50 dark:text-white/50" />
                    <div>
                      <p className="text-sm text-black/60 dark:text-white/60">
                        Joined
                      </p>
                      <p className="font-medium">
                        {userProfile?.createdAt
                          ? new Date(userProfile.createdAt).toLocaleDateString(
                              undefined,
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              }
                            )
                          : "Unknown"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <RiThumbUpLine className="w-5 h-5 text-black/50 dark:text-white/50" />
                    <div>
                      <p className="text-sm text-black/60 dark:text-white/60">
                        Account Status
                      </p>
                      <p className="font-medium capitalize">
                        {userProfile?.accountStatus || "Active"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <RiUser3Line className="w-5 h-5 text-black/50 dark:text-white/50" />
                    <div>
                      <p className="text-sm text-black/60 dark:text-white/60">
                        Last Active
                      </p>
                      <p className="font-medium">
                        {userProfile?.lastActive
                          ? new Date(userProfile.lastActive).toLocaleDateString(
                              undefined,
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              }
                            )
                          : "Just Now"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Activity Stats */}
        <div className="bg-white dark:bg-black rounded-lg border border-black/[.08] dark:border-white/[.08] p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Activity Stats</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-black/[.02] dark:bg-white/[.02] p-4 rounded-lg">
              <div className="text-3xl font-semibold text-emerald-600 dark:text-emerald-500">
                {userProfile?.savedListings?.length || 0}
              </div>
              <div className="text-black/60 dark:text-white/60">
                Saved Listings
              </div>
            </div>

            <div className="bg-black/[.02] dark:bg-white/[.02] p-4 rounded-lg">
              <div className="text-3xl font-semibold text-blue-600 dark:text-blue-500">
                {userProfile?.tradeHistory?.filter(
                  (t) => t.status === "completed"
                )?.length || 0}
              </div>
              <div className="text-black/60 dark:text-white/60">
                Completed Trades
              </div>
            </div>

            <div className="bg-black/[.02] dark:bg-white/[.02] p-4 rounded-lg">
              <div className="text-3xl font-semibold text-purple-600 dark:text-purple-500">
                {userProfile?.tradeHistory?.length || 0}
              </div>
              <div className="text-black/60 dark:text-white/60">
                Trade Requests
              </div>
            </div>

            <div className="bg-black/[.02] dark:bg-white/[.02] p-4 rounded-lg">
              <div className="text-3xl font-semibold text-amber-600 dark:text-amber-500">
                {reviews.length}
              </div>
              <div className="text-black/60 dark:text-white/60">Reviews</div>
            </div>
          </div>
        </div>

        {/* User Activity (Tabs) */}
        <div className="bg-white dark:bg-black rounded-lg border border-black/[.08] dark:border-white/[.08] overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-black/[.08] dark:border-white/[.08]">
            <button
              className={`px-4 py-3 font-medium text-sm -mb-px ${
                activeTab === "saved"
                  ? "border-b-2 border-emerald-600 text-emerald-600 dark:text-emerald-500"
                  : "text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white"
              }`}
              onClick={() => setActiveTab("saved")}
            >
              Saved Listings
            </button>
            <button
              className={`px-4 py-3 font-medium text-sm -mb-px ${
                activeTab === "trades"
                  ? "border-b-2 border-emerald-600 text-emerald-600 dark:text-emerald-500"
                  : "text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white"
              }`}
              onClick={() => setActiveTab("trades")}
            >
              Trade History
            </button>
            <button
              className={`px-4 py-3 font-medium text-sm -mb-px ${
                activeTab === "reviews"
                  ? "border-b-2 border-emerald-600 text-emerald-600 dark:text-emerald-500"
                  : "text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white"
              }`}
              onClick={() => setActiveTab("reviews")}
            >
              Reviews
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Saved Listings Tab */}
            {activeTab === "saved" && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Saved Listings</h3>

                {!userProfile?.savedListings ||
                userProfile.savedListings.length === 0 ? (
                  <div className="text-center py-10 bg-black/[.02] dark:bg-white/[.02] rounded-lg">
                    <p className="text-black/60 dark:text-white/60">
                      No saved listings yet. Browse listings and save the ones
                      you like!
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {userProfile.savedListings.map((listing) => (
                      <Link
                        href={`/dashboard/listings/${listing._id}`}
                        key={listing._id}
                        className="bg-black/[.02] dark:bg-white/[.02] rounded-lg overflow-hidden hover:shadow-md transition-shadow group"
                      >
                        <div className="relative h-40 w-full bg-black/[.05] dark:bg-white/[.05]">
                          {listing.images && listing.images.length > 0 ? (
                            <Image
                              src={listing.images[0]}
                              alt={listing.title}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full w-full">
                              <RiImageAddLine className="w-8 h-8 text-black/20 dark:text-white/20" />
                            </div>
                          )}
                        </div>
                        <div className="p-3">
                          <h4 className="font-medium truncate">
                            {listing.title}
                          </h4>
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-xs text-black/50 dark:text-white/50 bg-black/[.03] dark:bg-white/[.03] px-2 py-0.5 rounded-full">
                              {listing.category}
                            </span>
                            <span className="text-xs text-black/50 dark:text-white/50">
                              {new Date(listing.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Trade History Tab */}
            {activeTab === "trades" && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Trade History</h3>

                {!userProfile?.tradeHistory ||
                userProfile.tradeHistory.length === 0 ? (
                  <div className="text-center py-10 bg-black/[.02] dark:bg-white/[.02] rounded-lg">
                    <p className="text-black/60 dark:text-white/60">
                      No trade history yet. Start trading to build your history!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userProfile.tradeHistory.map((trade) => (
                      <Link
                        href={`/dashboard/trade-requests?id=${trade._id}`}
                        key={trade._id}
                        className="flex flex-col sm:flex-row gap-4 p-4 bg-black/[.02] dark:bg-white/[.02] rounded-lg hover:bg-black/[.04] dark:hover:bg-white/[.04] transition-colors"
                      >
                        <div className="flex flex-1 gap-4">
                          {/* Trade direction indicator */}
                          <div className="flex items-center">
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                trade.type === "sent"
                                  ? "bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                                  : "bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400"
                              }`}
                            >
                              {trade.type === "sent" ? "Sent" : "Received"}
                            </span>
                          </div>

                          {/* Trade items */}
                          <div className="flex-1">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {/* From listing */}
                              <div className="flex gap-2">
                                <div className="relative h-12 w-12 flex-shrink-0 rounded bg-black/[.05] dark:bg-white/[.05] overflow-hidden">
                                  {trade.fromListing?.images &&
                                  trade.fromListing.images.length > 0 ? (
                                    <Image
                                      src={trade.fromListing.images[0]}
                                      alt={trade.fromListing.title}
                                      fill
                                      className="object-cover"
                                    />
                                  ) : (
                                    <div className="flex items-center justify-center h-full w-full">
                                      <RiImageAddLine className="w-5 h-5 text-black/20 dark:text-white/20" />
                                    </div>
                                  )}
                                </div>
                                <div className="overflow-hidden">
                                  <p className="text-sm font-medium truncate">
                                    {trade.fromListing?.title || "Cash Offer"}
                                  </p>
                                  <p className="text-xs text-black/50 dark:text-white/50">
                                    Offered
                                  </p>
                                </div>
                              </div>

                              {/* To listing */}
                              <div className="flex gap-2">
                                <div className="relative h-12 w-12 flex-shrink-0 rounded bg-black/[.05] dark:bg-white/[.05] overflow-hidden">
                                  {trade.toListing?.images &&
                                  trade.toListing.images.length > 0 ? (
                                    <Image
                                      src={trade.toListing.images[0]}
                                      alt={trade.toListing.title}
                                      fill
                                      className="object-cover"
                                    />
                                  ) : (
                                    <div className="flex items-center justify-center h-full w-full">
                                      <RiImageAddLine className="w-5 h-5 text-black/20 dark:text-white/20" />
                                    </div>
                                  )}
                                </div>
                                <div className="overflow-hidden">
                                  <p className="text-sm font-medium truncate">
                                    {trade.toListing?.title || "Cash Offer"}
                                  </p>
                                  <p className="text-xs text-black/50 dark:text-white/50">
                                    Requested
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Trade metadata */}
                        <div className="flex items-center gap-3 sm:flex-col sm:items-end sm:justify-center">
                          <span
                            className={`px-2 py-0.5 text-xs rounded ${
                              trade.status === "pending"
                                ? "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400"
                                : trade.status === "accepted"
                                ? "bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400"
                                : trade.status === "rejected"
                                ? "bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400"
                                : trade.status === "completed"
                                ? "bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"
                                : "bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400"
                            }`}
                          >
                            {trade.status.charAt(0).toUpperCase() +
                              trade.status.slice(1)}
                          </span>
                          <span className="text-xs text-black/50 dark:text-white/50">
                            {new Date(trade.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Reviews Tab */}
            {activeTab === "reviews" && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Reviews Received</h3>

                {isLoadingReviews ? (
                  <div className="flex justify-center py-10">
                    <div className="animate-spin h-8 w-8 text-emerald-600 dark:text-emerald-500">
                      <RiLoader4Line className="h-8 w-8" />
                    </div>
                  </div>
                ) : reviews.length === 0 ? (
                  <div className="text-center py-10 bg-black/[.02] dark:bg-white/[.02] rounded-lg">
                    <p className="text-black/60 dark:text-white/60">
                      No reviews received yet. Complete trades to get reviews
                      from other users!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div
                        key={review._id}
                        className="bg-black/[.02] dark:bg-white/[.02] rounded-lg p-4"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="relative h-10 w-10 rounded-full overflow-hidden bg-emerald-100 dark:bg-emerald-900/20">
                            {review.reviewer.profilePicture ? (
                              <Image
                                src={review.reviewer.profilePicture}
                                alt={review.reviewer.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-medium">
                                {review.reviewer.name.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div>
                            <h4 className="font-medium">
                              {review.reviewer.name}
                            </h4>
                            <div className="flex items-center gap-2">
                              <div className="flex">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <RiStarLine
                                    key={star}
                                    className={
                                      star <= review.rating
                                        ? "text-yellow-400 fill-current"
                                        : "text-gray-300 dark:text-gray-600"
                                    }
                                    size={14}
                                  />
                                ))}
                              </div>
                              <span className="text-xs text-black/60 dark:text-white/60">
                                {new Date(
                                  review.createdAt
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <p className="text-black/80 dark:text-white/80 text-sm">
                          {review.comment}
                        </p>
                        <div className="mt-2">
                          <Link
                            href={`/dashboard/trade-requests?id=${review.tradeRequestId}`}
                            className="text-xs text-emerald-600 dark:text-emerald-500 hover:underline"
                          >
                            View trade details
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
