"use client";

import { useState, useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter, useParams } from "next/navigation";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import CommunityForum from "@/components/community/CommunityForum";
import {
  RiArrowLeftLine,
  RiTeamLine,
  RiTimeLine,
  RiMapPinLine,
  RiLoader4Line,
  RiErrorWarningLine,
  RiUserLine,
  RiShieldCheckLine,
  RiEdit2Line,
  RiDeleteBinLine,
  RiSendPlaneLine,
  RiFileUploadLine,
  RiVideoUploadLine,
  RiFileTextLine,
  RiTimeFill,
  RiToolsFill,
  RiShoppingBag3Fill,
  RiNotification3Line,
  RiAlarmLine,
  RiErrorWarningFill,
} from "react-icons/ri";
import { CommunityGoal, Contribution, ProofOfContribution } from "@/types";
import { uploadFile } from "@/lib/uploadUtils";

interface ExtendedContribution extends Contribution {
  _id: string;
}

// Add a type definition for contribution comments that won't conflict with DOM Comment
interface CommentData {
  user: {
    _id: string;
    name?: string;
    profilePicture?: string;
    userId?: string;
  };
  userId: string;
  comment: string;
  createdAt: string;
}

export default function CommunityGoalDetailPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const params = useParams();
  const goalId = params.goalId as string;

  const [goal, setGoal] = useState<CommunityGoal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // For contribution form
  const [contributionType, setContributionType] = useState<
    "Skill" | "Item" | "Time"
  >("Skill");
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [contributionDetails, setContributionDetails] = useState({
    // Skill details
    skillType: "",
    availability: "",

    // Item details
    itemName: "",
    quantity: 1,
    itemDescription: "",

    // Time details
    hoursCommitted: 1,
    role: "",
  });

  // For file uploads
  const [proofFiles, setProofFiles] = useState<ProofOfContribution[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Add this state variable for upload errors
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [isContributing, setIsContributing] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [hasContributed, setHasContributed] = useState(false);
  const [userContribution, setUserContribution] = useState<Contribution | null>(
    null
  );

  // Add this with the other useState declarations
  const [uploadProgress, setUploadProgress] = useState(0);

  // Add these functions to handle notifications
  const fetchNotifications = async () => {
    if (!user || !isOwner) return;

    try {
      const response = await fetch(
        `/api/community-goals/${goalId}/notifications`
      );
      if (response.ok) {
        const data = await response.json();
        setHasNewContributions(data.hasNewContributions);
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  // Add state for notifications
  const [hasNewContributions, setHasNewContributions] = useState(false);

  // Fetch notifications on load
  useEffect(() => {
    if (goal && user && isOwner) {
      fetchNotifications();

      // Set up polling for new contributions if user is the owner
      const interval = setInterval(fetchNotifications, 60000); // Check every minute
      return () => clearInterval(interval);
    }
  }, [goal, user, isOwner]);

  // Handle contribution verification (approve/reject)
  const handleVerifyContribution = async (
    contributionId: string,
    status: "Approved" | "Rejected",
    notes?: string
  ) => {
    if (!goal || !user) return;

    try {
      const response = await fetch(
        `/api/community-goals/${goalId}/contributions/${contributionId}/verify`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            verificationStatus: status,
            verificationNotes: notes || "",
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `Failed to ${status.toLowerCase()} contribution`
        );
      }

      const data = await response.json();
      setGoal(data.goal);

      // Show appropriate message based on status
      if (status === "Approved") {
        alert("Contribution approved successfully");
      } else {
        alert("Contribution rejected and removed from the goal");
      }
    } catch (err) {
      console.error(`Error ${status.toLowerCase()}ing contribution:`, err);
      alert(
        `Failed to ${status.toLowerCase()} contribution. Please try again.`
      );
    }
  };

  // Add comment to a contribution
  const [commentText, setCommentText] = useState("");
  const [commentingContributionId, setCommentingContributionId] = useState<
    string | null
  >(null);
  const [isAddingComment, setIsAddingComment] = useState(false);

  const handleAddComment = async (contributionId: string) => {
    if (!commentText.trim() || !goal || !user) return;

    setIsAddingComment(true);

    // Create the new comment object for optimistic UI update
    const newComment = {
      user: {
        _id: user.id,
        name: user.fullName || user.username || "You",
        profilePicture: user.imageUrl,
      },
      userId: user.id,
      comment: commentText.trim(),
      createdAt: new Date().toISOString(),
    };

    // Apply optimistic update
    const updatedGoal = { ...goal };
    const contributionIndex = updatedGoal.contributions.findIndex((c) => {
      return (c as ExtendedContribution)._id === contributionId;
    });

    if (contributionIndex >= 0) {
      // Initialize comments array if it doesn't exist
      if (!updatedGoal.contributions[contributionIndex].comments) {
        updatedGoal.contributions[contributionIndex].comments = [];
      }

      // Add new comment to the list
      updatedGoal.contributions[contributionIndex].comments = [
        ...(updatedGoal.contributions[contributionIndex].comments || []),
        newComment,
      ];

      // Update state immediately for optimistic UI
      setGoal(updatedGoal);
      setCommentText("");
      setCommentingContributionId(null);
    }

    try {
      const response = await fetch(
        `/api/community-goals/${goalId}/contributions/${contributionId}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            comment: commentText.trim(),
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add comment");
      }

      const data = await response.json();

      // Update goal with the actual comments from the server
      const finalGoal = { ...goal };
      const finalContributionIndex = finalGoal.contributions.findIndex((c) => {
        return (c as ExtendedContribution)._id === contributionId;
      });

      if (finalContributionIndex >= 0) {
        finalGoal.contributions[finalContributionIndex].comments =
          data.comments;
        setGoal(finalGoal);
      }
    } catch (err) {
      console.error("Error adding comment:", err);
      alert("Failed to add comment. Please try again.");

      // Revert optimistic update on error
      fetchGoalDetails();
    } finally {
      setIsAddingComment(false);
    }
  };

  // Fetch goal details
  useEffect(() => {
    if (isLoaded && user && goalId) {
      fetchGoalDetails();
    }
  }, [isLoaded, user, goalId]);

  // Check if user is owner or has contributed
  useEffect(() => {
    if (goal && user) {
      // Check if current user is the creator - debug the actual structure
      console.log("Goal creator data:", goal.createdBy);
      console.log("Current user ID:", user.id);

      // Check if user is the owner by comparing Clerk userId
      // 1. First check if the API returned the userId directly
      if (goal.createdBy && "userId" in goal.createdBy) {
        setIsOwner(goal.createdBy.userId === user.id);
        console.log(
          "Checking owner with userId field:",
          goal.createdBy.userId,
          user.id
        );
      }
      // 2. In case the userId wasn't populated, compare by MongoDB _id (less reliable)
      else if (goal.createdBy?._id) {
        const isCreatorById =
          goal.createdBy._id === user.id ||
          goal.createdBy._id.toString() === user.id;
        console.log(
          "Checking owner with _id field:",
          goal.createdBy._id,
          user.id
        );
        setIsOwner(isCreatorById);
      }

      // Check if user has already contributed (using Clerk userId)
      const userContrib = goal.contributions.find((c) => {
        return (c as ExtendedContribution).userId === user.id;
      });

      setHasContributed(!!userContrib);
      if (userContrib) {
        setUserContribution(userContrib);

        // Set form values based on existing contribution
        if (userContrib.contributionType) {
          setContributionType(userContrib.contributionType);
        }

        if (userContrib.taskId) {
          setSelectedTaskId(userContrib.taskId);
        }

        // Set contribution details if available
        if (userContrib.details) {
          setContributionDetails({
            ...contributionDetails,
            ...userContrib.details,
          });
        }

        // Set proof files if available
        if (
          userContrib.proofOfContribution &&
          userContrib.proofOfContribution.length > 0
        ) {
          setProofFiles(userContrib.proofOfContribution);
        }
      }
    }
  }, [goal, user]);

  const fetchGoalDetails = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/community-goals/${goalId}`);

      if (!response.ok) {
        throw new Error("Failed to fetch goal details");
      }

      const data = await response.json();
      console.log("Goal data received:", data);

      // Add debug logging to check comment user data
      if (data.goal && data.goal.contributions) {
        data.goal.contributions.forEach(
          (contribution: Contribution, i: number) => {
            if (contribution.comments && contribution.comments.length > 0) {
              console.log(
                `Contribution ${i} has ${contribution.comments.length} comments`
              );
              contribution.comments.forEach(
                (comment: CommentData, j: number) => {
                  console.log(`Comment ${j} user data:`, comment.user);
                }
              );
            }
          }
        );
      }

      setGoal(data.goal);
    } catch (err) {
      console.error("Error fetching goal details:", err);
      setError("Failed to load goal details. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    handleFileUpload(file);
  };

  // Upload file to Cloudinary
  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);

    try {
      // Determine file type based on MIME type
      let fileType: "image" | "video" | "pdf" = "image";
      if (file.type.startsWith("video/")) {
        fileType = "video";
        // Check if it's MP4 format
        if (!file.type.includes("mp4")) {
          console.warn(
            "Non-MP4 video detected. Upload may be slower or encounter issues."
          );
        }
      } else if (file.type === "application/pdf") {
        fileType = "pdf";
      }

      // Upload to Cloudinary
      const uploadResult = await uploadFile(file, (progress) => {
        setUploadProgress(progress);
        console.log(`Upload progress: ${progress}%`);
      });

      const newProofFile: ProofOfContribution = {
        fileType,
        fileUrl: uploadResult.url,
        uploadedAt: new Date().toISOString(),
      };

      setProofFiles([...proofFiles, newProofFile]);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err: Error | unknown) {
      console.error("Error uploading file:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to upload file. Please try again.";
      setUploadError(errorMessage);

      // Display specific message for video format issues
      if (
        file.type.startsWith("video/") &&
        (errorMessage.includes("format") || errorMessage.includes("video"))
      ) {
        setUploadError(
          "This video format may not be supported. For best results, please convert to MP4 format and try again."
        );
      }
    } finally {
      setIsUploading(false);
    }
  };

  // Remove a proof file
  const removeProofFile = (index: number) => {
    setProofFiles(proofFiles.filter((_, i) => i !== index));
  };

  // Handle form input changes
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setContributionDetails({
      ...contributionDetails,
      [name]: value,
    });
  };

  const handleContribute = async () => {
    // Validate based on contribution type
    if (contributionType === "Skill" && !contributionDetails.skillType) {
      alert("Please select a skill type");
      return;
    } else if (contributionType === "Item" && !contributionDetails.itemName) {
      alert("Please enter an item name");
      return;
    } else if (
      contributionType === "Time" &&
      contributionDetails.hoursCommitted < 1
    ) {
      alert("Please enter at least 1 hour");
      return;
    }

    setIsContributing(true);
    try {
      const response = await fetch(
        `/api/community-goals/${goalId}/contribute`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contributionType,
            taskId: selectedTaskId || undefined,
            details: contributionDetails,
            proofOfContribution: proofFiles,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit contribution");
      }

      const data = await response.json();
      setGoal(data.goal);
      setHasContributed(true);

      // Find user's contribution
      const userContrib = data.goal.contributions.find(
        (c: Contribution) => c.userId === user?.id
      );
      setUserContribution(userContrib || null);

      alert("Contribution submitted successfully!");
    } catch (err) {
      console.error("Error contributing:", err);
      alert("Failed to submit contribution. Please try again.");
    } finally {
      setIsContributing(false);
    }
  };

  const handleEdit = () => {
    router.push(`/dashboard/community-goals/${goalId}/edit`);
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this community goal? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/community-goals/${goalId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete goal");
      }

      alert("Community goal deleted successfully");
      router.push("/dashboard/community-goals");
    } catch (err) {
      console.error("Error deleting goal:", err);
      alert("Failed to delete goal. Please try again.");
    }
  };

  // Add this useEffect to check if comment user data is missing and reload if needed
  useEffect(() => {
    if (goal) {
      let needsRefresh = false;

      // Check if any contribution comment is missing user data
      goal.contributions.forEach((contribution) => {
        if (contribution.comments && contribution.comments.length > 0) {
          contribution.comments.forEach((comment) => {
            if (!comment.user || !comment.user.name) {
              console.log(
                "Found comment missing user data, will reload:",
                comment
              );
              needsRefresh = true;
            }
          });
        }
      });

      // Reload data if needed
      if (needsRefresh) {
        console.log("Missing comment user data detected, refreshing...");
        setTimeout(() => fetchGoalDetails(), 1000); // Refresh after 1 second
      }
    }
  }, [goal]);

  // Add expandedComments state
  const [expandedComments, setExpandedComments] = useState<
    Record<string, boolean>
  >({});

  // Redirect if not authenticated
  if (isLoaded && !user) {
    router.push("/");
    return null;
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6 p-4">
        {/* Back button */}
        <button
          onClick={() => router.push("/dashboard/community-goals")}
          className="flex items-center text-black/60 dark:text-white/60 hover:text-emerald-600 dark:hover:text-emerald-500 mb-2"
        >
          <RiArrowLeftLine className="w-5 h-5 mr-1" />
          Back to Community Goals
        </button>

        {/* Loading state */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <div className="flex flex-col items-center">
              <RiLoader4Line className="w-12 h-12 animate-spin text-emerald-600" />
              <p className="mt-4 text-black/60 dark:text-white/60">
                Loading goal details...
              </p>
            </div>
          </div>
        )}

        {/* Error state */}
        {!isLoading && error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-4 rounded-lg flex items-start">
            <RiErrorWarningLine className="w-6 h-6 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Error</p>
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Goal details */}
        {!isLoading && goal && (
          <div className="space-y-6">
            {/* Header with image */}
            <div className="relative aspect-[3/1] md:rounded-lg overflow-hidden">
              <img
                src={
                  goal.imageUrl ||
                  `https://placehold.co/1200x400/90EAC3/333333?text=${encodeURIComponent(
                    goal.title
                  )}`
                }
                alt={goal.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent">
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span
                      className={`px-3 py-1 rounded-lg text-sm font-medium
                      ${
                        goal.status === "Active"
                          ? "bg-emerald-500/30 text-emerald-200"
                          : goal.status === "Completed"
                          ? "bg-blue-500/30 text-blue-200"
                          : "bg-yellow-500/30 text-yellow-200"
                      }`}
                    >
                      {goal.status}
                    </span>
                    {goal.goalType && (
                      <span className="px-3 py-1 rounded-lg text-sm font-medium bg-white/20 text-white">
                        {goal.goalType}
                      </span>
                    )}
                    {goal.category && (
                      <span className="px-3 py-1 rounded-lg text-sm font-medium bg-white/10 text-white/90">
                        {goal.category}
                      </span>
                    )}
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                    {goal.title}
                  </h1>
                  <div className="flex flex-wrap items-center gap-4 text-white/80">
                    <div className="flex items-center">
                      <div className="w-6 h-6 rounded-full bg-gray-200 overflow-hidden mr-2">
                        {goal.createdBy?.profilePicture ? (
                          <img
                            src={goal.createdBy.profilePicture}
                            alt={goal.createdBy.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-emerald-100 text-emerald-600 font-semibold">
                            {goal.createdBy?.name
                              ? goal.createdBy.name.charAt(0)
                              : "?"}
                          </div>
                        )}
                      </div>
                      <span>
                        Created by {goal.createdBy?.name || "Unknown"}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <RiTimeLine className="w-5 h-5 mr-1" />
                      <span>
                        {new Date(goal.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {goal.location?.city && (
                      <div className="flex items-center">
                        <RiMapPinLine className="w-5 h-5 mr-1" />
                        <span>
                          {[
                            goal.location.city,
                            goal.location.state,
                            goal.location.country,
                          ]
                            .filter(Boolean)
                            .join(", ")}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="bg-white dark:bg-black rounded-lg border border-black/[.08] dark:border-white/[.08] p-6">
              <div className="mb-4">
                <div className="flex flex-col md:flex-row justify-between md:items-center mb-2">
                  <h3 className="text-lg font-semibold">Goal Progress</h3>
                  <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-500">
                    {goal.totalProgress}%
                  </span>
                </div>
                <div className="h-4 bg-black/[.04] dark:bg-white/[.04] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${goal.totalProgress}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-4">
                <div className="px-3 py-1 rounded-full text-sm bg-black/[.04] dark:bg-white/[.04] text-black/70 dark:text-white/70 flex items-center">
                  <RiTeamLine className="w-4 h-4 mr-1" />
                  {goal.contributions.length} contributor
                  {goal.contributions.length !== 1 && "s"}
                </div>
                {goal.status === "Completed" && (
                  <div className="px-3 py-1 rounded-full text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center">
                    <RiShieldCheckLine className="w-4 h-4 mr-1" />
                    Goal Completed
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Description and details */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white dark:bg-black rounded-lg border border-black/[.08] dark:border-white/[.08] p-6">
                  <h2 className="text-xl font-semibold mb-4">
                    About this Goal
                  </h2>
                  <p className="text-black/70 dark:text-white/70 whitespace-pre-line">
                    {goal.description}
                  </p>

                  {/* Admin controls */}
                  {isOwner && (
                    <div className="flex gap-2 mt-8 pt-6 border-t border-black/[.08] dark:border-white/[.08]">
                      <button
                        onClick={handleEdit}
                        className="flex items-center gap-1 px-4 py-2 bg-black/[.05] dark:bg-white/[.05] hover:bg-black/[.08] dark:hover:bg-white/[.08] rounded-lg transition-colors"
                      >
                        <RiEdit2Line />
                        <span>Edit Goal</span>
                      </button>
                      <button
                        onClick={handleDelete}
                        className="flex items-center gap-1 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                      >
                        <RiDeleteBinLine />
                        <span>Delete</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Goal tasks */}
                {goal.tasks && goal.tasks.length > 0 && (
                  <div className="bg-white dark:bg-black rounded-lg border border-black/[.08] dark:border-white/[.08] p-6 mt-6">
                    <h2 className="text-xl font-semibold mb-4">Tasks</h2>
                    <div className="space-y-4">
                      {goal.tasks.map((task) => (
                        <div
                          key={task._id}
                          className="p-4 rounded-lg bg-black/[.02] dark:bg-white/[.02] border border-black/[.05] dark:border-white/[.05]"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium flex items-center">
                                {task.taskType === "Skill" && (
                                  <RiToolsFill className="w-4 h-4 mr-2 text-blue-500" />
                                )}
                                {task.taskType === "Item" && (
                                  <RiShoppingBag3Fill className="w-4 h-4 mr-2 text-amber-500" />
                                )}
                                {task.taskType === "Time" && (
                                  <RiTimeFill className="w-4 h-4 mr-2 text-emerald-500" />
                                )}
                                {task.taskName}
                              </h3>
                              {task.description && (
                                <p className="text-sm text-black/60 dark:text-white/60 mt-1">
                                  {task.description}
                                </p>
                              )}
                            </div>
                            <div className="text-sm font-medium">
                              <span
                                className={`px-2 py-1 rounded-full ${
                                  task.taskType === "Skill"
                                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                                    : task.taskType === "Item"
                                    ? "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400"
                                    : "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"
                                }`}
                              >
                                {task.taskType}
                              </span>
                            </div>
                          </div>

                          <div className="mt-3">
                            <div className="flex justify-between text-sm mb-1">
                              <span>
                                Progress: {task.quantityFulfilled} /{" "}
                                {task.quantityNeeded}{" "}
                                {task.taskType === "Time"
                                  ? "hours"
                                  : task.taskType === "Item"
                                  ? "items"
                                  : "contributions"}
                              </span>
                              <span>
                                {Math.min(
                                  Math.round(
                                    (task.quantityFulfilled /
                                      task.quantityNeeded) *
                                      100
                                  ),
                                  100
                                )}
                                %
                              </span>
                            </div>
                            <div className="h-2 bg-black/[.04] dark:bg-white/[.04] rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  task.taskType === "Skill"
                                    ? "bg-blue-500"
                                    : task.taskType === "Item"
                                    ? "bg-amber-500"
                                    : "bg-emerald-500"
                                }`}
                                style={{
                                  width: `${Math.min(
                                    Math.round(
                                      (task.quantityFulfilled /
                                        task.quantityNeeded) *
                                        100
                                    ),
                                    100
                                  )}%`,
                                }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Contributions list */}
                <div className="bg-white dark:bg-black rounded-lg border border-black/[.08] dark:border-white/[.08] p-6 mt-6">
                  <h2 className="text-xl font-semibold mb-4">Contributions</h2>

                  {isOwner && hasNewContributions && (
                    <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg">
                      <div className="flex items-center text-blue-800 dark:text-blue-300">
                        <div className="mr-3 flex-shrink-0">
                          <RiNotification3Line className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium">New Contributions!</p>
                          <p className="text-sm">
                            You have new contributions that require your
                            verification.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {goal.contributions.length === 0 ? (
                    <div className="text-center py-8 text-black/60 dark:text-white/60">
                      <RiTeamLine className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p>No contributions yet. Be the first to contribute!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {goal.contributions.map((contribution, index) => {
                        // Cast to add userId and _id access
                        const extendedContribution =
                          contribution as ExtendedContribution;
                        const isPending =
                          contribution.verificationStatus === "Pending";

                        return (
                          <div
                            key={index}
                            className={`p-4 rounded-lg ${
                              isPending && isOwner
                                ? "bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20"
                                : extendedContribution.userId === user?.id
                                ? "bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20"
                                : "bg-black/[.02] dark:bg-white/[.02]"
                            }`}
                          >
                            {isPending && isOwner && (
                              <div className="mb-2 px-2 py-1 bg-blue-100 dark:bg-blue-800/30 text-blue-800 dark:text-blue-300 text-xs inline-flex items-center rounded">
                                <RiAlarmLine className="mr-1" />
                                Needs verification
                              </div>
                            )}
                            <div className="flex justify-between items-start">
                              <div className="flex items-center">
                                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden mr-3">
                                  {contribution.user?.profilePicture ? (
                                    <img
                                      src={contribution.user.profilePicture}
                                      alt={contribution.user.name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400 font-semibold">
                                      {contribution.user?.name
                                        ? contribution.user.name.charAt(0)
                                        : "?"}
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <h3 className="font-medium">
                                    {contribution.user?.name || "Unknown User"}
                                    {extendedContribution.userId === user?.id &&
                                      " (You)"}
                                  </h3>
                                  <div className="flex items-center text-xs text-black/50 dark:text-white/50">
                                    <span>
                                      {new Date(
                                        contribution.createdAt
                                      ).toLocaleDateString()}
                                    </span>
                                    <span className="mx-2">•</span>
                                    <span
                                      className={`${
                                        contribution.contributionType ===
                                        "Skill"
                                          ? "text-blue-500"
                                          : contribution.contributionType ===
                                            "Item"
                                          ? "text-amber-500"
                                          : "text-emerald-500"
                                      }`}
                                    >
                                      {contribution.contributionType}
                                    </span>
                                    <span className="mx-2">•</span>
                                    <span
                                      className={`${
                                        contribution.verificationStatus ===
                                        "Approved"
                                          ? "text-green-500"
                                          : contribution.verificationStatus ===
                                            "Rejected"
                                          ? "text-red-500"
                                          : "text-gray-500"
                                      }`}
                                    >
                                      {contribution.verificationStatus}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="px-2 py-1 rounded-lg text-sm font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                                {contribution.percentage}%
                              </div>
                            </div>

                            {/* Contribution details */}
                            <div className="mt-3 pl-13">
                              {contribution.contributionType === "Skill" &&
                                contribution.details?.skillType && (
                                  <p className="text-black/70 dark:text-white/70">
                                    <span className="font-medium">Skill:</span>{" "}
                                    {contribution.details.skillType}
                                    {contribution.details.availability && (
                                      <span>
                                        {" "}
                                        • Available:{" "}
                                        {new Date(
                                          contribution.details.availability
                                        ).toLocaleDateString()}
                                      </span>
                                    )}
                                  </p>
                                )}

                              {contribution.contributionType === "Item" &&
                                contribution.details?.itemName && (
                                  <p className="text-black/70 dark:text-white/70">
                                    <span className="font-medium">Item:</span>{" "}
                                    {contribution.details.itemName}
                                    {contribution.details.quantity && (
                                      <span>
                                        {" "}
                                        ({contribution.details.quantity}{" "}
                                        {contribution.details.quantity > 1
                                          ? "items"
                                          : "item"}
                                        )
                                      </span>
                                    )}
                                    {contribution.details.itemDescription && (
                                      <span className="text-sm text-black/60 dark:text-white/60 mt-1">
                                        {contribution.details.itemDescription}
                                      </span>
                                    )}
                                  </p>
                                )}

                              {contribution.contributionType === "Time" &&
                                contribution.details?.hoursCommitted && (
                                  <p className="text-black/70 dark:text-white/70">
                                    <span className="font-medium">Time:</span>{" "}
                                    {contribution.details.hoursCommitted} hours
                                    {contribution.details.role && (
                                      <span>
                                        {" "}
                                        as {contribution.details.role}
                                      </span>
                                    )}
                                  </p>
                                )}

                              {/* Verification notes (if any) */}
                              {contribution.verificationNotes && (
                                <div className="mt-3 p-2 bg-black/[.03] dark:bg-white/[.03] rounded border border-black/[.05] dark:border-white/[.05]">
                                  <p className="text-sm font-medium">
                                    Verification Notes:
                                  </p>
                                  <p className="text-sm text-black/70 dark:text-white/70">
                                    {contribution.verificationNotes}
                                  </p>
                                </div>
                              )}

                              {/* Enhanced proof of contribution preview */}
                              {contribution.proofOfContribution &&
                                contribution.proofOfContribution.length > 0 && (
                                  <div className="mt-3">
                                    <p className="text-sm font-medium mb-2">
                                      Proof of Contribution:
                                    </p>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                      {contribution.proofOfContribution.map(
                                        (proof, i) => (
                                          <a
                                            key={i}
                                            href={proof.fileUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="relative block rounded-md overflow-hidden border border-black/[.05] dark:border-white/[.05] hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors"
                                          >
                                            <div className="aspect-video w-full">
                                              {proof.fileType === "image" ? (
                                                <img
                                                  src={proof.fileUrl}
                                                  alt={`Proof ${i + 1}`}
                                                  className="w-full h-full object-cover"
                                                />
                                              ) : proof.fileType === "video" ? (
                                                <div className="relative w-full h-full bg-black">
                                                  <video
                                                    src={proof.fileUrl}
                                                    className="w-full h-full object-contain"
                                                    muted
                                                  />
                                                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                                    <div className="w-12 h-12 rounded-full bg-emerald-600/80 flex items-center justify-center text-white">
                                                      <RiVideoUploadLine className="w-6 h-6" />
                                                    </div>
                                                  </div>
                                                </div>
                                              ) : (
                                                <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800">
                                                  <RiFileTextLine className="w-8 h-8 text-gray-500 mb-1" />
                                                  <span className="text-xs text-gray-500">
                                                    PDF Document
                                                  </span>
                                                </div>
                                              )}
                                            </div>
                                            <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-2 py-1 text-xs text-white">
                                              {proof.fileType
                                                .charAt(0)
                                                .toUpperCase() +
                                                proof.fileType.slice(1)}{" "}
                                              {i + 1}
                                            </div>
                                          </a>
                                        )
                                      )}
                                    </div>
                                  </div>
                                )}

                              {/* Comment display with preview and "View more" button */}
                              {contribution.comments &&
                                contribution.comments.length > 0 && (
                                  <div className="mt-3">
                                    <div className="flex justify-between items-center mb-2">
                                      <p className="text-sm font-medium">
                                        Comments ({contribution.comments.length}
                                        )
                                      </p>
                                      {contribution.comments.length > 1 && (
                                        <button
                                          onClick={() => {
                                            // Toggle comment visibility for this contribution
                                            const visible =
                                              expandedComments[
                                                extendedContribution._id
                                              ];
                                            setExpandedComments({
                                              ...expandedComments,
                                              [extendedContribution._id]:
                                                !visible,
                                            });
                                          }}
                                          className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
                                        >
                                          {expandedComments[
                                            extendedContribution._id
                                          ]
                                            ? "Show less"
                                            : "View all"}
                                        </button>
                                      )}
                                    </div>
                                    <div className="space-y-2">
                                      {contribution.comments
                                        .slice(
                                          0,
                                          expandedComments[
                                            extendedContribution._id
                                          ]
                                            ? undefined
                                            : 1
                                        )
                                        .map((comment, i) => {
                                          // Store user data for clarity
                                          const commentUser = comment.user;
                                          const userName =
                                            commentUser?.name || "Unknown User";
                                          const userInitial = userName
                                            ? userName.charAt(0)
                                            : "?";

                                          return (
                                            <div
                                              key={i}
                                              className="p-2 bg-black/[.02] dark:bg-white/[.02] rounded-lg text-sm"
                                            >
                                              <div className="flex items-center text-xs text-black/50 dark:text-white/50 mb-1">
                                                {/* User avatar with better fallback */}
                                                {commentUser ? (
                                                  commentUser.profilePicture ? (
                                                    <img
                                                      src={
                                                        commentUser.profilePicture
                                                      }
                                                      alt={userName}
                                                      className="w-5 h-5 rounded-full mr-2"
                                                      onError={(e) => {
                                                        // If image fails to load, replace with initials
                                                        const target =
                                                          e.target as HTMLImageElement;
                                                        target.style.display =
                                                          "none";
                                                        target.parentElement?.classList.add(
                                                          "bg-gray-200",
                                                          "dark:bg-gray-700",
                                                          "flex",
                                                          "items-center",
                                                          "justify-center"
                                                        );
                                                        target.parentElement?.setAttribute(
                                                          "data-initial",
                                                          userInitial
                                                        );
                                                      }}
                                                    />
                                                  ) : (
                                                    <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[10px] font-semibold mr-2">
                                                      {userInitial}
                                                    </div>
                                                  )
                                                ) : (
                                                  <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse mr-2"></div>
                                                )}

                                                {/* Username display */}
                                                <strong title={userName}>
                                                  {userName}
                                                </strong>
                                                <span className="mx-1">•</span>
                                                <span>
                                                  {new Date(
                                                    comment.createdAt
                                                  ).toLocaleDateString()}
                                                </span>
                                              </div>
                                              <p>{comment.comment}</p>
                                            </div>
                                          );
                                        })}
                                    </div>
                                  </div>
                                )}

                              {/* Comment form */}
                              {commentingContributionId ===
                                extendedContribution._id && (
                                <div className="mt-3 pt-3 border-t border-black/[.08] dark:border-white/[.08]">
                                  <div className="flex gap-2">
                                    <textarea
                                      placeholder="Add a comment..."
                                      value={commentText}
                                      onChange={(e) =>
                                        setCommentText(e.target.value)
                                      }
                                      className="flex-grow p-2 rounded-lg border border-black/[.08] dark:border-white/[.08] bg-white dark:bg-black text-sm min-h-[60px]"
                                    ></textarea>
                                    <button
                                      onClick={() =>
                                        handleAddComment(
                                          extendedContribution._id
                                        )
                                      }
                                      disabled={
                                        isAddingComment || !commentText.trim()
                                      }
                                      className="px-3 py-2 h-fit self-end rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-emerald-600/50 text-sm"
                                    >
                                      {isAddingComment
                                        ? "Sending..."
                                        : "Comment"}
                                    </button>
                                  </div>
                                </div>
                              )}

                              {/* Actions */}
                              <div className="mt-3 pt-3 border-t border-black/[.08] dark:border-white/[.08] flex flex-wrap gap-2">
                                {/* Comment button */}
                                <button
                                  onClick={() => {
                                    if (
                                      commentingContributionId ===
                                      extendedContribution._id
                                    ) {
                                      setCommentingContributionId(null);
                                    } else {
                                      setCommentingContributionId(
                                        extendedContribution._id
                                      );
                                      setCommentText("");
                                    }
                                  }}
                                  className="px-3 py-1 text-sm bg-black/[.03] dark:bg-white/[.03] hover:bg-black/[.05] dark:hover:bg-white/[.05] rounded-lg"
                                >
                                  {commentingContributionId ===
                                  extendedContribution._id
                                    ? "Cancel"
                                    : "Add Comment"}
                                </button>

                                {/* Verification buttons (only for goal owner and pending contributions) */}
                                {isOwner &&
                                  contribution.verificationStatus ===
                                    "Pending" && (
                                    <>
                                      <button
                                        onClick={() =>
                                          handleVerifyContribution(
                                            extendedContribution._id,
                                            "Approved"
                                          )
                                        }
                                        className="px-3 py-1 text-sm bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg"
                                      >
                                        Approve
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleVerifyContribution(
                                            extendedContribution._id,
                                            "Rejected"
                                          )
                                        }
                                        className="px-3 py-1 text-sm bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg"
                                      >
                                        Reject
                                      </button>
                                    </>
                                  )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Contribution form and sidebar info */}
              <div className="space-y-6">
                {/* Contribute form */}
                {goal.status === "Active" && (
                  <div className="bg-white dark:bg-black rounded-lg border border-black/[.08] dark:border-white/[.08] p-6">
                    <h2 className="text-xl font-semibold mb-4">
                      {hasContributed
                        ? "Update Your Contribution"
                        : "Contribute to Goal"}
                    </h2>

                    {hasContributed && (
                      <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-900/10 rounded-lg border border-emerald-100 dark:border-emerald-900/20">
                        <p className="text-sm text-emerald-700 dark:text-emerald-400 flex items-center">
                          <RiShieldCheckLine className="w-5 h-5 mr-2" />
                          You&apos;ve already contributed{" "}
                          {userContribution?.percentage}% to this goal
                        </p>
                      </div>
                    )}

                    <div className="space-y-4">
                      {/* Contribution Type Selection */}
                      <div>
                        <label className="block mb-2 text-sm font-medium">
                          Contribution Type
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={() => setContributionType("Skill")}
                            className={`p-3 rounded-lg flex flex-col items-center justify-center ${
                              contributionType === "Skill"
                                ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800"
                                : "bg-black/[.03] dark:bg-white/[.03] border border-transparent hover:bg-black/[.05] dark:hover:bg-white/[.05]"
                            }`}
                          >
                            <RiToolsFill className="w-5 h-5 mb-1" />
                            <span className="text-sm font-medium">Skill</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setContributionType("Item")}
                            className={`p-3 rounded-lg flex flex-col items-center justify-center ${
                              contributionType === "Item"
                                ? "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
                                : "bg-black/[.03] dark:bg-white/[.03] border border-transparent hover:bg-black/[.05] dark:hover:bg-white/[.05]"
                            }`}
                          >
                            <RiShoppingBag3Fill className="w-5 h-5 mb-1" />
                            <span className="text-sm font-medium">Item</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setContributionType("Time")}
                            className={`p-3 rounded-lg flex flex-col items-center justify-center ${
                              contributionType === "Time"
                                ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                                : "bg-black/[.03] dark:bg-white/[.03] border border-transparent hover:bg-black/[.05] dark:hover:bg-white/[.05]"
                            }`}
                          >
                            <RiTimeFill className="w-5 h-5 mb-1" />
                            <span className="text-sm font-medium">Time</span>
                          </button>
                        </div>
                      </div>

                      {/* Task Selection (if tasks are available) */}
                      {goal.tasks && goal.tasks.length > 0 && (
                        <div>
                          <label className="block mb-2 text-sm font-medium">
                            Select Task (Optional)
                          </label>
                          <select
                            className="w-full p-3 rounded-lg border border-black/[.08] dark:border-white/[.08] bg-white dark:bg-black"
                            value={selectedTaskId}
                            onChange={(e) => setSelectedTaskId(e.target.value)}
                          >
                            <option value="">No specific task</option>
                            {goal.tasks
                              .filter(
                                (task) => task.taskType === contributionType
                              )
                              .map((task) => (
                                <option key={task._id} value={task._id}>
                                  {task.taskName} ({task.quantityFulfilled}/
                                  {task.quantityNeeded})
                                </option>
                              ))}
                          </select>
                        </div>
                      )}

                      {/* Dynamic form fields based on contribution type */}
                      {contributionType === "Skill" && (
                        <div className="space-y-4">
                          <div>
                            <label className="block mb-2 text-sm font-medium">
                              Skill Type
                            </label>
                            <input
                              type="text"
                              name="skillType"
                              placeholder="E.g., Teaching, Design, Organizing"
                              value={contributionDetails.skillType}
                              onChange={handleInputChange}
                              className="w-full p-3 rounded-lg border border-black/[.08] dark:border-white/[.08] bg-white dark:bg-black"
                            />
                          </div>
                          <div>
                            <label className="block mb-2 text-sm font-medium">
                              Availability (Optional)
                            </label>
                            <input
                              type="date"
                              name="availability"
                              value={contributionDetails.availability}
                              onChange={handleInputChange}
                              className="w-full p-3 rounded-lg border border-black/[.08] dark:border-white/[.08] bg-white dark:bg-black"
                            />
                          </div>
                        </div>
                      )}

                      {contributionType === "Item" && (
                        <div className="space-y-4">
                          <div>
                            <label className="block mb-2 text-sm font-medium">
                              Item Name
                            </label>
                            <input
                              type="text"
                              name="itemName"
                              placeholder="What are you donating?"
                              value={contributionDetails.itemName}
                              onChange={handleInputChange}
                              className="w-full p-3 rounded-lg border border-black/[.08] dark:border-white/[.08] bg-white dark:bg-black"
                            />
                          </div>
                          <div>
                            <label className="block mb-2 text-sm font-medium">
                              Quantity
                            </label>
                            <input
                              type="number"
                              name="quantity"
                              min="1"
                              value={contributionDetails.quantity}
                              onChange={handleInputChange}
                              className="w-full p-3 rounded-lg border border-black/[.08] dark:border-white/[.08] bg-white dark:bg-black"
                            />
                          </div>
                          <div>
                            <label className="block mb-2 text-sm font-medium">
                              Description (Optional)
                            </label>
                            <textarea
                              name="itemDescription"
                              placeholder="Additional details about the item(s)"
                              value={contributionDetails.itemDescription}
                              onChange={handleInputChange}
                              className="w-full p-3 min-h-[80px] rounded-lg border border-black/[.08] dark:border-white/[.08] bg-white dark:bg-black"
                            ></textarea>
                          </div>
                        </div>
                      )}

                      {contributionType === "Time" && (
                        <div className="space-y-4">
                          <div>
                            <label className="block mb-2 text-sm font-medium">
                              Hours Committed
                            </label>
                            <input
                              type="number"
                              name="hoursCommitted"
                              min="1"
                              value={contributionDetails.hoursCommitted}
                              onChange={handleInputChange}
                              className="w-full p-3 rounded-lg border border-black/[.08] dark:border-white/[.08] bg-white dark:bg-black"
                            />
                          </div>
                          <div>
                            <label className="block mb-2 text-sm font-medium">
                              Role (Optional)
                            </label>
                            <input
                              type="text"
                              name="role"
                              placeholder="E.g., Organizer, Helper, Mentor"
                              value={contributionDetails.role}
                              onChange={handleInputChange}
                              className="w-full p-3 rounded-lg border border-black/[.08] dark:border-white/[.08] bg-white dark:bg-black"
                            />
                          </div>
                        </div>
                      )}

                      {/* File upload and preview area */}
                      <div className="mt-6">
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="text-lg font-semibold">
                            Proof of Contribution
                          </h3>
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className="text-sm px-3 py-1 bg-emerald-100 dark:bg-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-md hover:bg-emerald-200 dark:hover:bg-emerald-700 flex items-center"
                          >
                            <RiFileUploadLine className="mr-1" />
                            Upload File
                          </button>
                        </div>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileSelect}
                          className="hidden"
                          accept="image/*,video/*,application/pdf"
                        />

                        {isUploading && (
                          <div className="p-4 mb-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
                            <div className="flex flex-col">
                              <div className="flex items-center mb-2">
                                <RiLoader4Line className="w-5 h-5 mr-3 animate-spin text-emerald-500" />
                                <span className="font-medium">
                                  Uploading file...
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                                <div
                                  className="bg-emerald-500 h-2.5 rounded-full transition-all duration-300"
                                  style={{ width: `${uploadProgress}%` }}
                                ></div>
                              </div>
                              {uploadError && (
                                <div className="p-3 mb-3 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-900/30">
                                  <div className="flex items-center">
                                    <RiErrorWarningFill className="w-5 h-5 mr-2 text-red-500" />
                                    <span className="text-sm text-red-700 dark:text-red-400">
                                      {uploadError}
                                    </span>
                                  </div>
                                </div>
                              )}
                              <p className="text-xs mt-1 text-right text-black/60 dark:text-white/60">
                                {uploadProgress}% -{" "}
                                {uploadProgress < 100
                                  ? "Please wait, videos may take a few minutes"
                                  : "Upload complete!"}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Preview of uploaded files */}
                        {proofFiles.length > 0 && (
                          <div className="mt-3">
                            <h4 className="text-sm font-medium mb-2">
                              Uploaded Files:
                            </h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                              {proofFiles.map((file, index) => (
                                <div
                                  key={index}
                                  className="relative p-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800"
                                >
                                  <div className="aspect-video w-full overflow-hidden rounded-md bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                    {file.fileType === "image" ? (
                                      <img
                                        src={file.fileUrl}
                                        alt={`Uploaded proof ${index + 1}`}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : file.fileType === "video" ? (
                                      <video
                                        src={file.fileUrl}
                                        controls
                                        className="w-full h-full object-contain"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex flex-col items-center justify-center">
                                        <RiFileTextLine className="w-10 h-10 text-gray-400" />
                                        <span className="text-xs mt-1">
                                          PDF Document
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="mt-2 flex justify-between items-center">
                                    <span className="text-xs capitalize">
                                      {file.fileType}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => removeProofFile(index)}
                                      className="text-red-500 hover:text-red-700"
                                      aria-label="Remove file"
                                    >
                                      <RiDeleteBinLine className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={handleContribute}
                        disabled={
                          isContributing ||
                          (contributionType === "Skill" &&
                            !contributionDetails.skillType) ||
                          (contributionType === "Item" &&
                            !contributionDetails.itemName) ||
                          (contributionType === "Time" &&
                            contributionDetails.hoursCommitted < 1)
                        }
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-600/50 text-white rounded-lg transition-colors"
                      >
                        {isContributing ? (
                          <>
                            <RiLoader4Line className="w-5 h-5 animate-spin" />
                            <span>Processing...</span>
                          </>
                        ) : (
                          <>
                            <RiSendPlaneLine className="w-5 h-5" />
                            <span>
                              {hasContributed
                                ? "Update Contribution"
                                : "Submit Contribution"}
                            </span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Info card */}
                <div className="bg-white dark:bg-black rounded-lg border border-black/[.08] dark:border-white/[.08] p-6">
                  <h2 className="text-lg font-semibold mb-4">
                    About Contributions
                  </h2>
                  <div className="space-y-3 text-sm">
                    <p className="text-black/70 dark:text-white/70">
                      <strong>Goal Type:</strong> {goal.goalType}
                    </p>
                    <p className="text-black/70 dark:text-white/70">
                      <strong>Target Amount:</strong> {goal.targetAmount}{" "}
                      {goal.goalType === "Skill" ? "hours" : "items"}
                    </p>
                    {goal.category && (
                      <p className="text-black/70 dark:text-white/70">
                        <strong>Category:</strong> {goal.category}
                      </p>
                    )}
                    <div className="pt-3 mt-3 border-t border-black/[.08] dark:border-white/[.08]">
                      <h3 className="font-medium mb-2">How it works:</h3>
                      <ul className="space-y-2 text-black/70 dark:text-white/70">
                        <li className="flex items-start">
                          <RiTeamLine className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                          <span>
                            Each contribution moves the goal closer to
                            completion
                          </span>
                        </li>
                        <li className="flex items-start">
                          <RiShieldCheckLine className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                          <span>
                            Once the goal reaches 100%, it will be marked as
                            completed
                          </span>
                        </li>
                        <li className="flex items-start">
                          <RiUserLine className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                          <span>
                            Your contribution helps build community reputation
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Add the Community Forum component below the contributions section */}
            {goal && <CommunityForum goalId={goalId} />}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
