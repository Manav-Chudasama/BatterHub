"use client";

import { useState, useEffect, use } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import {
  RiArrowLeftLine,
  RiTeamLine,
  RiLoader4Line,
  RiErrorWarningLine,
  RiToolsFill,
  RiShoppingBag3Fill,
  RiTimeFill,
  RiSaveLine,
} from "react-icons/ri";
import { Task } from "@/types";
import Image from "next/image";

export default function EditCommunityGoalPage({
  params,
}: {
  params: Promise<{ goalId: string }>;
}) {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const { goalId } = use(params);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    goalType: "Skill", // Default to Skill
    targetAmount: 100, // Default to 100 hours/items
    category: "",
    imageUrl: "",
    location: {
      city: "",
      state: "",
      country: "",
    },
    status: "Active",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadingError, setLoadingError] = useState("");

  const [tasks, setTasks] = useState<Task[]>([]);
  // const [taskForm, setTaskForm] = useState({
  //   taskName: "",
  //   taskType: "Skill" as "Skill" | "Item" | "Time",
  //   description: "",
  //   quantityNeeded: 1,
  //   contributionPercentage: 10,
  // });
  // const [isAddingTask, setIsAddingTask] = useState(false);

  // Fetch goal data
  useEffect(() => {
    const fetchGoalData = async () => {
      if (!goalId) return;

      try {
        setIsLoading(true);
        const response = await fetch(`/api/community-goals/${goalId}`);

        if (!response.ok) {
          throw new Error("Failed to fetch goal data");
        }

        const { goal } = await response.json();

        // Set form data from goal
        setFormData({
          title: goal.title || "",
          description: goal.description || "",
          goalType: goal.goalType || "Skill",
          targetAmount: goal.targetAmount || 100,
          category: goal.category || "",
          imageUrl: goal.imageUrl || "",
          location: {
            city: goal.location?.city || "",
            state: goal.location?.state || "",
            country: goal.location?.country || "",
          },
          status: goal.status || "Active",
        });

        // Set tasks from goal
        if (goal.tasks && Array.isArray(goal.tasks)) {
          setTasks(goal.tasks);
        }
      } catch (error) {
        console.error("Error fetching goal:", error);
        setLoadingError(
          "Failed to load community goal data. Please try again later."
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchGoalData();
  }, [goalId]);

  // Handle form input changes
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    // Handle nested location fields
    if (name.startsWith("location.")) {
      const locationField = name.split(".")[1];
      setFormData({
        ...formData,
        location: {
          ...formData.location,
          [locationField]: value,
        },
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }

    // Clear any error for this field
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: "",
      });
    }
  };

  // Handle task form input changes
  // const handleTaskInputChange = (
  //   e: React.ChangeEvent<
  //     HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
  //   >
  // ) => {
  //   const { name, value } = e.target;
  //   setTaskForm({
  //     ...taskForm,
  //     [name]:
  //       name === "quantityNeeded" || name === "contributionPercentage"
  //         ? parseInt(value) || 0
  //         : value,
  //   });
  // };

  // Validate form data
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }

    if (!formData.goalType) {
      newErrors.goalType = "Goal type is required";
    }

    if (!formData.targetAmount || formData.targetAmount <= 0) {
      newErrors.targetAmount = "Target amount must be greater than 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Add a task to the list
  // const handleAddTask = () => {
  //   if (!taskForm.taskName) {
  //     alert("Task name is required");
  //     return;
  //   }

  //   // Create a temporary ID for UI purposes
  //   const newTask: Task = {
  //     _id: `temp-${Date.now()}`,
  //     ...taskForm,
  //     quantityFulfilled: 0,
  //   };

  //   setTasks([...tasks, newTask]);

  //   // Reset form
  //   setTaskForm({
  //     taskName: "",
  //     taskType: "Skill",
  //     description: "",
  //     quantityNeeded: 1,
  //     contributionPercentage: 10,
  //   });

  //   setIsAddingTask(false);
  // };

  // Remove a task from the list
  // const handleRemoveTask = (taskId: string) => {
  //   setTasks(tasks.filter((task) => task._id !== taskId));
  // };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmissionError("");

    try {
      const response = await fetch(`/api/community-goals/${goalId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          // Note: We don't update tasks here as it's not supported by the API
          // For full task updates, a separate endpoint would be needed
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update community goal");
      }

      // Navigate back to the goal details page
      router.push(`/dashboard/community-goals/${goalId}`);
    } catch (err) {
      console.error("Error updating community goal:", err);
      setSubmissionError(
        err instanceof Error ? err.message : "Failed to update community goal"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Redirect if not authenticated
  if (isLoaded && !user) {
    router.push("/");
    return null;
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6 p-4">
        {/* Back button */}
        <button
          onClick={() => router.push(`/dashboard/community-goals/${goalId}`)}
          className="flex items-center text-black/60 dark:text-white/60 hover:text-emerald-600 dark:hover:text-emerald-500 mb-2"
        >
          <RiArrowLeftLine className="w-5 h-5 mr-1" />
          Back to Goal Details
        </button>

        {/* Header */}
        <div className="flex items-center">
          <RiTeamLine className="w-7 h-7 text-emerald-600 mr-2" />
          <h1 className="text-2xl font-bold">Edit Community Goal</h1>
        </div>

        {/* Loading state */}
        {isLoading ? (
          <div className="flex justify-center items-center p-8">
            <RiLoader4Line className="w-8 h-8 text-emerald-500 animate-spin" />
          </div>
        ) : loadingError ? (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-4 rounded-lg flex items-start">
            <RiErrorWarningLine className="w-6 h-6 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Error</p>
              <p>{loadingError}</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Submission error */}
            {submissionError && (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-4 rounded-lg flex items-start">
                <RiErrorWarningLine className="w-6 h-6 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Error</p>
                  <p>{submissionError}</p>
                </div>
              </div>
            )}

            {/* Basic Info */}
            <div className="bg-white dark:bg-black rounded-lg border border-black/[.08] dark:border-white/[.08] p-6">
              <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
              <div className="space-y-4">
                {/* Title */}
                <div>
                  <label
                    htmlFor="title"
                    className="block text-sm font-medium mb-1"
                  >
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className={`w-full p-3 rounded-lg border ${
                      errors.title
                        ? "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20"
                        : "border-black/[.08] dark:border-white/[.08] bg-white dark:bg-black"
                    }`}
                    placeholder="Give your community goal a clear title"
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.title}
                    </p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium mb-1"
                  >
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={5}
                    className={`w-full p-3 rounded-lg border ${
                      errors.description
                        ? "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20"
                        : "border-black/[.08] dark:border-white/[.08] bg-white dark:bg-black"
                    }`}
                    placeholder="Explain the purpose of this goal and why it matters"
                  ></textarea>
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.description}
                    </p>
                  )}
                </div>

                {/* Category */}
                <div>
                  <label
                    htmlFor="category"
                    className="block text-sm font-medium mb-1"
                  >
                    Category
                  </label>
                  <input
                    type="text"
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full p-3 rounded-lg border border-black/[.08] dark:border-white/[.08] bg-white dark:bg-black"
                    placeholder="E.g., Environment, Education, Community Support"
                  />
                </div>

                {/* Status */}
                <div>
                  <label
                    htmlFor="status"
                    className="block text-sm font-medium mb-1"
                  >
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full p-3 rounded-lg border border-black/[.08] dark:border-white/[.08] bg-white dark:bg-black"
                  >
                    <option value="Active">Active</option>
                    <option value="Completed">Completed</option>
                    <option value="OnHold">On Hold</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Goal Type & Target */}
            <div className="bg-white dark:bg-black rounded-lg border border-black/[.08] dark:border-white/[.08] p-6">
              <h2 className="text-xl font-semibold mb-4">Goal Type & Target</h2>
              <div className="space-y-4">
                {/* Goal Type */}
                <div>
                  <label
                    htmlFor="goalType"
                    className="block text-sm font-medium mb-1"
                  >
                    Goal Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="goalType"
                    name="goalType"
                    value={formData.goalType}
                    onChange={handleChange}
                    className={`w-full p-3 rounded-lg border ${
                      errors.goalType
                        ? "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20"
                        : "border-black/[.08] dark:border-white/[.08] bg-white dark:bg-black"
                    }`}
                    disabled // Disable changing goal type on edit to prevent inconsistencies
                  >
                    <option value="Skill">Skill-based</option>
                    <option value="Item">Item-based</option>
                    <option value="Time">Time-based</option>
                  </select>
                  {errors.goalType && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.goalType}
                    </p>
                  )}
                  <p className="text-xs text-black/60 dark:text-white/60 mt-1">
                    Goal type cannot be changed after creation.
                  </p>
                </div>

                {/* Target Amount */}
                <div>
                  <label
                    htmlFor="targetAmount"
                    className="block text-sm font-medium mb-1"
                  >
                    Target Amount <span className="text-red-500">*</span>
                  </label>
                  <div className="flex">
                    <input
                      type="number"
                      id="targetAmount"
                      name="targetAmount"
                      value={formData.targetAmount}
                      onChange={handleChange}
                      min="1"
                      className={`w-full p-3 rounded-l-lg border ${
                        errors.targetAmount
                          ? "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20"
                          : "border-black/[.08] dark:border-white/[.08] bg-white dark:bg-black"
                      }`}
                    />
                    <span className="inline-flex items-center px-4 rounded-r-lg border border-l-0 border-black/[.08] dark:border-white/[.08] bg-black/[.03] dark:bg-white/[.03]">
                      {formData.goalType === "Time"
                        ? "hours"
                        : formData.goalType === "Item"
                        ? "items"
                        : "contributions"}
                    </span>
                  </div>
                  {errors.targetAmount && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.targetAmount}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="bg-white dark:bg-black rounded-lg border border-black/[.08] dark:border-white/[.08] p-6">
              <h2 className="text-xl font-semibold mb-4">Location</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label
                    htmlFor="location.city"
                    className="block text-sm font-medium mb-1"
                  >
                    City
                  </label>
                  <input
                    type="text"
                    id="location.city"
                    name="location.city"
                    value={formData.location.city}
                    onChange={handleChange}
                    className="w-full p-3 rounded-lg border border-black/[.08] dark:border-white/[.08] bg-white dark:bg-black"
                  />
                </div>
                <div>
                  <label
                    htmlFor="location.state"
                    className="block text-sm font-medium mb-1"
                  >
                    State/Province
                  </label>
                  <input
                    type="text"
                    id="location.state"
                    name="location.state"
                    value={formData.location.state}
                    onChange={handleChange}
                    className="w-full p-3 rounded-lg border border-black/[.08] dark:border-white/[.08] bg-white dark:bg-black"
                  />
                </div>
                <div>
                  <label
                    htmlFor="location.country"
                    className="block text-sm font-medium mb-1"
                  >
                    Country
                  </label>
                  <input
                    type="text"
                    id="location.country"
                    name="location.country"
                    value={formData.location.country}
                    onChange={handleChange}
                    className="w-full p-3 rounded-lg border border-black/[.08] dark:border-white/[.08] bg-white dark:bg-black"
                  />
                </div>
              </div>
            </div>

            {/* Image URL */}
            <div className="bg-white dark:bg-black rounded-lg border border-black/[.08] dark:border-white/[.08] p-6">
              <h2 className="text-xl font-semibold mb-4">Cover Image</h2>
              <div>
                <label
                  htmlFor="imageUrl"
                  className="block text-sm font-medium mb-1"
                >
                  Image URL
                </label>
                <div className="flex">
                  <input
                    type="text"
                    id="imageUrl"
                    name="imageUrl"
                    value={formData.imageUrl}
                    onChange={handleChange}
                    className="w-full p-3 rounded-l-lg border border-black/[.08] dark:border-white/[.08] bg-white dark:bg-black"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                {formData.imageUrl && (
                  <div className="mt-3">
                    <p className="text-sm font-medium mb-2">Image Preview:</p>
                    <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black/[.03] dark:bg-white/[.03]">
                      <Image
                        src={formData.imageUrl}
                        alt="Cover preview"
                        className="w-full h-full object-cover"
                        width={800}
                        height={400}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://via.placeholder.com/800x400?text=Invalid+Image+URL";
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Tasks */}
            <div className="bg-white dark:bg-black rounded-lg border border-black/[.08] dark:border-white/[.08] p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Tasks</h2>
                <p className="text-xs text-black/60 dark:text-white/60">
                  Note: Task edits are unavailable at this time
                </p>
              </div>

              {/* Task list (read-only in edit mode) */}
              {tasks.length === 0 ? (
                <div className="text-center py-8 text-black/60 dark:text-white/60">
                  <p>No tasks have been created yet.</p>
                </div>
              ) : (
                <div className="space-y-3 mb-4">
                  {tasks.map((task) => (
                    <div
                      key={task._id}
                      className="bg-black/[.03] dark:bg-white/[.03] p-4 rounded-lg flex justify-between items-start"
                    >
                      <div className="flex-1">
                        <div className="flex items-center">
                          {task.taskType === "Skill" && (
                            <RiToolsFill className="w-4 h-4 mr-2 text-blue-500" />
                          )}
                          {task.taskType === "Item" && (
                            <RiShoppingBag3Fill className="w-4 h-4 mr-2 text-amber-500" />
                          )}
                          {task.taskType === "Time" && (
                            <RiTimeFill className="w-4 h-4 mr-2 text-emerald-500" />
                          )}
                          <h3 className="font-medium">{task.taskName}</h3>
                        </div>
                        {task.description && (
                          <p className="text-sm text-black/60 dark:text-white/60 mt-1">
                            {task.description}
                          </p>
                        )}
                        <div className="mt-1 flex flex-wrap gap-2 text-xs">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full ${
                              task.taskType === "Skill"
                                ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                                : task.taskType === "Item"
                                ? "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400"
                                : "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"
                            }`}
                          >
                            {task.taskType}
                          </span>
                          <span className="inline-flex items-center px-2 py-1 rounded-full bg-black/[.06] dark:bg-white/[.06]">
                            {task.quantityNeeded}{" "}
                            {task.taskType === "Time"
                              ? "hours"
                              : task.taskType === "Item"
                              ? "items"
                              : "contributions"}
                          </span>
                          <span className="inline-flex items-center px-2 py-1 rounded-full bg-black/[.06] dark:bg-white/[.06]">
                            {task.contributionPercentage}% contribution
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <RiLoader4Line className="w-5 h-5 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <RiSaveLine className="w-5 h-5 mr-2" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
}
