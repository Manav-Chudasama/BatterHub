"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import {
  RiArrowLeftLine,
  RiTeamLine,
  RiImageAddLine,
  RiRefreshLine,
  RiLoader4Line,
  RiErrorWarningLine,
  RiAddCircleLine,
  RiDeleteBinLine,
  RiToolsFill,
  RiShoppingBag3Fill,
  RiTimeFill,
} from "react-icons/ri";
import { Task } from "@/types";

export default function CreateCommunityGoalPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

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
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState("");

  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskForm, setTaskForm] = useState({
    taskName: "",
    taskType: "Skill" as "Skill" | "Item" | "Time",
    description: "",
    quantityNeeded: 1,
    contributionPercentage: 10,
  });
  const [isAddingTask, setIsAddingTask] = useState(false);

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
  const handleTaskInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setTaskForm({
      ...taskForm,
      [name]:
        name === "quantityNeeded" || name === "contributionPercentage"
          ? parseInt(value) || 0
          : value,
    });
  };

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
  const handleAddTask = () => {
    if (!taskForm.taskName) {
      alert("Task name is required");
      return;
    }

    // Create a temporary ID for UI purposes
    const newTask: Task = {
      _id: `temp-${Date.now()}`,
      ...taskForm,
      quantityFulfilled: 0,
    };

    setTasks([...tasks, newTask]);

    // Reset form
    setTaskForm({
      taskName: "",
      taskType: "Skill",
      description: "",
      quantityNeeded: 1,
      contributionPercentage: 10,
    });

    setIsAddingTask(false);
  };

  // Remove a task from the list
  const handleRemoveTask = (taskId: string) => {
    setTasks(tasks.filter((task) => task._id !== taskId));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmissionError("");

    try {
      const response = await fetch("/api/community-goals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          tasks: tasks.map(({ _id, quantityFulfilled, ...rest }) => rest), // Remove temporary _id and quantityFulfilled
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create community goal");
      }

      const data = await response.json();
      router.push(`/dashboard/community-goals/${data.goal._id}`);
    } catch (err) {
      console.error("Error creating community goal:", err);
      setSubmissionError(
        err instanceof Error ? err.message : "Failed to create community goal"
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
          onClick={() => router.push("/dashboard/community-goals")}
          className="flex items-center text-black/60 dark:text-white/60 hover:text-emerald-600 dark:hover:text-emerald-500 mb-2"
        >
          <RiArrowLeftLine className="w-5 h-5 mr-1" />
          Back to Community Goals
        </button>

        {/* Header */}
        <div className="flex items-center">
          <RiTeamLine className="w-7 h-7 text-emerald-600 mr-2" />
          <h1 className="text-2xl font-bold">Create Community Goal</h1>
        </div>

        {/* Form */}
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
                  placeholder="Enter goal title"
                  className={`w-full p-3 rounded-lg border ${
                    errors.title
                      ? "border-red-300 dark:border-red-500"
                      : "border-black/[.08] dark:border-white/[.08]"
                  } bg-white dark:bg-black focus:outline-none focus:ring-2 focus:ring-emerald-500/20`}
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
                  placeholder="Describe the community goal in detail"
                  rows={5}
                  className={`w-full p-3 rounded-lg border ${
                    errors.description
                      ? "border-red-300 dark:border-red-500"
                      : "border-black/[.08] dark:border-white/[.08]"
                  } bg-white dark:bg-black focus:outline-none focus:ring-2 focus:ring-emerald-500/20`}
                ></textarea>
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.description}
                  </p>
                )}
              </div>

              {/* Image URL */}
              <div>
                <label
                  htmlFor="imageUrl"
                  className="block text-sm font-medium mb-1"
                >
                  Image URL (Optional)
                </label>
                <div className="flex">
                  <input
                    type="text"
                    id="imageUrl"
                    name="imageUrl"
                    value={formData.imageUrl}
                    onChange={handleChange}
                    placeholder="Enter URL for an image that represents the goal"
                    className="flex-grow p-3 rounded-l-lg border border-r-0 border-black/[.08] dark:border-white/[.08] bg-white dark:bg-black focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <div className="p-3 rounded-r-lg border border-l-0 border-black/[.08] dark:border-white/[.08] bg-black/[.02] dark:bg-white/[.02] flex items-center justify-center">
                    <RiImageAddLine className="w-5 h-5 text-black/60 dark:text-white/60" />
                  </div>
                </div>
                <p className="mt-1 text-xs text-black/50 dark:text-white/50">
                  If no image is provided, a placeholder will be used.
                </p>
              </div>
            </div>
          </div>

          {/* Goal Details */}
          <div className="bg-white dark:bg-black rounded-lg border border-black/[.08] dark:border-white/[.08] p-6">
            <h2 className="text-xl font-semibold mb-4">Goal Details</h2>
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
                      ? "border-red-300 dark:border-red-500"
                      : "border-black/[.08] dark:border-white/[.08]"
                  } bg-white dark:bg-black focus:outline-none focus:ring-2 focus:ring-emerald-500/20`}
                >
                  <option value="Skill">Skill</option>
                  <option value="Item">Item</option>
                </select>
                {errors.goalType && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.goalType}
                  </p>
                )}
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
                    className={`flex-grow p-3 rounded-l-lg border border-r-0 ${
                      errors.targetAmount
                        ? "border-red-300 dark:border-red-500"
                        : "border-black/[.08] dark:border-white/[.08]"
                    } bg-white dark:bg-black focus:outline-none focus:ring-2 focus:ring-emerald-500/20`}
                  />
                  <div className="p-3 rounded-r-lg border border-l-0 border-black/[.08] dark:border-white/[.08] bg-black/[.02] dark:bg-white/[.02] flex items-center justify-center min-w-[80px]">
                    {formData.goalType === "Skill" ? "Hours" : "Items"}
                  </div>
                </div>
                {errors.targetAmount && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.targetAmount}
                  </p>
                )}
              </div>

              {/* Category */}
              <div>
                <label
                  htmlFor="category"
                  className="block text-sm font-medium mb-1"
                >
                  Category (Optional)
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full p-3 rounded-lg border border-black/[.08] dark:border-white/[.08] bg-white dark:bg-black focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="">Select a category</option>
                  <option value="Education">Education</option>
                  <option value="Environment">Environment</option>
                  <option value="Health">Health</option>
                  <option value="Technology">Technology</option>
                  <option value="Community">Community</option>
                  <option value="Arts">Arts</option>
                  <option value="Sports">Sports</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="bg-white dark:bg-black rounded-lg border border-black/[.08] dark:border-white/[.08] p-6">
            <h2 className="text-xl font-semibold mb-4">Location (Optional)</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="city"
                  className="block text-sm font-medium mb-1"
                >
                  City
                </label>
                <input
                  type="text"
                  id="city"
                  name="location.city"
                  value={formData.location.city}
                  onChange={handleChange}
                  placeholder="City"
                  className="w-full p-3 rounded-lg border border-black/[.08] dark:border-white/[.08] bg-white dark:bg-black focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <div>
                <label
                  htmlFor="state"
                  className="block text-sm font-medium mb-1"
                >
                  State/Province
                </label>
                <input
                  type="text"
                  id="state"
                  name="location.state"
                  value={formData.location.state}
                  onChange={handleChange}
                  placeholder="State/Province"
                  className="w-full p-3 rounded-lg border border-black/[.08] dark:border-white/[.08] bg-white dark:bg-black focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <div>
                <label
                  htmlFor="country"
                  className="block text-sm font-medium mb-1"
                >
                  Country
                </label>
                <input
                  type="text"
                  id="country"
                  name="location.country"
                  value={formData.location.country}
                  onChange={handleChange}
                  placeholder="Country"
                  className="w-full p-3 rounded-lg border border-black/[.08] dark:border-white/[.08] bg-white dark:bg-black focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>
            <p className="mt-2 text-xs text-black/50 dark:text-white/50">
              If no location is provided, your profile location will be used (if
              available).
            </p>
          </div>

          {/* Tasks Definition */}
          <div className="bg-white dark:bg-black rounded-lg border border-black/[.08] dark:border-white/[.08] p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Define Tasks</h2>
              <button
                type="button"
                onClick={() => setIsAddingTask(true)}
                className="flex items-center gap-1 px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors"
              >
                <RiAddCircleLine className="w-4 h-4" />
                <span>Add Task</span>
              </button>
            </div>

            <p className="text-sm text-black/60 dark:text-white/60 mb-4">
              Define specific tasks that contributors can choose from. This
              helps organize and track contributions more effectively.
            </p>

            {/* Task list */}
            {tasks.length === 0 ? (
              <div className="text-center py-8 text-black/50 dark:text-white/50 bg-black/[.02] dark:bg-white/[.02] rounded-lg">
                <p className="mb-2">No tasks defined yet</p>
                <p className="text-sm">
                  {isAddingTask
                    ? "Add details below"
                    : "Click 'Add Task' to define tasks for this goal"}
                </p>
              </div>
            ) : (
              <div className="space-y-3 mb-6">
                {tasks.map((task) => (
                  <div
                    key={task._id}
                    className="p-3 rounded-lg bg-black/[.02] dark:bg-white/[.02] border border-black/[.05] dark:border-white/[.05] flex justify-between items-start"
                  >
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
                      <div className="text-xs text-black/50 dark:text-white/50 mt-1">
                        <span>
                          Need: {task.quantityNeeded}{" "}
                          {task.taskType === "Time"
                            ? "hours"
                            : task.taskType === "Item"
                            ? "items"
                            : "contributions"}
                        </span>
                        <span className="mx-2">•</span>
                        <span>
                          Contributes {task.contributionPercentage}% to goal
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveTask(task._id)}
                      className="text-red-500 hover:text-red-700 p-1"
                      title="Remove task"
                    >
                      <RiDeleteBinLine className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add task form */}
            {isAddingTask && (
              <div className="p-4 border border-dashed border-black/[.08] dark:border-white/[.08] rounded-lg">
                <h3 className="font-medium mb-3">New Task</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Task Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="taskName"
                      value={taskForm.taskName}
                      onChange={handleTaskInputChange}
                      placeholder="E.g., Donate books, Help organize the event"
                      className="w-full p-2 rounded-lg border border-black/[.08] dark:border-white/[.08] bg-white dark:bg-black"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Task Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="taskType"
                        value={taskForm.taskType}
                        onChange={handleTaskInputChange}
                        className="w-full p-2 rounded-lg border border-black/[.08] dark:border-white/[.08] bg-white dark:bg-black"
                      >
                        <option value="Skill">Skill</option>
                        <option value="Item">Item</option>
                        <option value="Time">Time</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Quantity Needed
                      </label>
                      <input
                        type="number"
                        name="quantityNeeded"
                        min="1"
                        value={taskForm.quantityNeeded}
                        onChange={handleTaskInputChange}
                        className="w-full p-2 rounded-lg border border-black/[.08] dark:border-white/[.08] bg-white dark:bg-black"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Description (Optional)
                    </label>
                    <textarea
                      name="description"
                      value={taskForm.description}
                      onChange={handleTaskInputChange}
                      placeholder="Describe what needs to be done for this task"
                      rows={2}
                      className="w-full p-2 rounded-lg border border-black/[.08] dark:border-white/[.08] bg-white dark:bg-black"
                    ></textarea>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Contribution Percentage
                    </label>
                    <div className="flex">
                      <input
                        type="number"
                        name="contributionPercentage"
                        min="1"
                        max="100"
                        value={taskForm.contributionPercentage}
                        onChange={handleTaskInputChange}
                        className="flex-grow p-2 rounded-l-lg border border-r-0 border-black/[.08] dark:border-white/[.08] bg-white dark:bg-black"
                      />
                      <div className="p-2 rounded-r-lg border border-l-0 border-black/[.08] dark:border-white/[.08] bg-black/[.02] dark:bg-white/[.02] flex items-center justify-center min-w-[50px]">
                        %
                      </div>
                    </div>
                    <p className="text-xs text-black/50 dark:text-white/50 mt-1">
                      How much this task contributes to the overall goal
                      completion
                    </p>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingTask(false)}
                      className="px-4 py-2 rounded-lg bg-black/[.05] dark:bg-white/[.05] hover:bg-black/[.08] dark:hover:bg-white/[.08] text-black/80 dark:text-white/80 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleAddTask}
                      className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                    >
                      Add Task
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Submit buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
            <button
              type="button"
              onClick={() => router.push("/dashboard/community-goals")}
              className="px-6 py-3 rounded-lg bg-black/[.05] dark:bg-white/[.05] hover:bg-black/[.08] dark:hover:bg-white/[.08] text-black/80 dark:text-white/80 transition-colors"
            >
              Cancel
            </button>
            <button
              type="reset"
              onClick={() => {
                setFormData({
                  title: "",
                  description: "",
                  goalType: "Skill",
                  targetAmount: 100,
                  category: "",
                  imageUrl: "",
                  location: {
                    city: "",
                    state: "",
                    country: "",
                  },
                });
                setErrors({});
              }}
              className="px-6 py-3 rounded-lg flex items-center justify-center gap-2 bg-black/[.05] dark:bg-white/[.05] hover:bg-black/[.08] dark:hover:bg-white/[.08] text-black/80 dark:text-white/80 transition-colors"
            >
              <RiRefreshLine className="w-5 h-5" />
              Reset Form
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-600/50 text-white font-medium transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <RiLoader4Line className="w-5 h-5 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Goal"
              )}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
