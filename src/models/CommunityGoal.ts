import mongoose from "mongoose";

// Create a separate schema for forum messages
const MessageSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
  userId: { type: String, required: true }, // Clerk user ID
  username: { type: String }, // Username of the message sender
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const CommunityGoalSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  goalType: { type: String, enum: ["Skill", "Item"], required: true },
  targetAmount: { type: Number, default: 100 }, // Target amount for the goal
  imageUrl: { type: String }, // Optional image for the goal
  category: { type: String }, // Category of the goal (e.g., Education, Environment)
  status: {
    type: String,
    enum: ["Active", "Completed", "Cancelled"],
    default: "Active",
  },
  // Define available tasks for this goal
  tasks: [
    {
      taskName: { type: String, required: true },
      taskType: {
        type: String,
        enum: ["Skill", "Item", "Time"],
        required: true,
      },
      description: { type: String },
      quantityNeeded: { type: Number, default: 1 },
      quantityFulfilled: { type: Number, default: 0 },
      contributionPercentage: { type: Number, default: 5 }, // How much this task contributes to overall goal
      contributions: [{ type: String }], // Array of contribution IDs associated with this task
    },
  ],
  // Forum messages stored directly in the community goal
  messages: [MessageSchema],
  contributions: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      userId: { type: String }, // Clerk user ID
      contributionType: {
        type: String,
        enum: ["Skill", "Item", "Time"],
        required: true,
      },
      taskId: { type: String }, // Reference to the task being contributed to
      details: {
        // For skills
        skillType: { type: String },
        availability: { type: Date },

        // For items
        itemName: { type: String },
        quantity: { type: Number },
        itemDescription: { type: String },

        // For time
        hoursCommitted: { type: Number },
        role: { type: String },
      },
      proofOfContribution: [
        {
          fileType: { type: String, enum: ["image", "video", "pdf"] },
          fileUrl: { type: String },
          uploadedAt: { type: Date, default: Date.now },
        },
      ],
      verificationStatus: {
        type: String,
        enum: ["Pending", "Approved", "Rejected"],
        default: "Pending",
      },
      verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      verificationDate: { type: Date },
      verificationNotes: { type: String },
      comments: [
        {
          user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
          userId: { type: String },
          comment: { type: String },
          createdAt: { type: Date, default: Date.now },
        },
      ],
      percentage: { type: Number, default: 0 }, // % of total contribution
      createdAt: { type: Date, default: Date.now },
    },
  ],
  totalProgress: { type: Number, default: 0 }, // Tracks goal completion percentage
  discussionForum: { type: mongoose.Schema.Types.ObjectId, ref: "Chat" },
  location: {
    city: { type: String },
    state: { type: String },
    country: { type: String },
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Add index for better performance when searching
CommunityGoalSchema.index({ title: "text", description: "text" });
CommunityGoalSchema.index({ status: 1 });
CommunityGoalSchema.index({ createdAt: -1 });
CommunityGoalSchema.index({ goalType: 1 });
CommunityGoalSchema.index({ "location.city": 1 });
CommunityGoalSchema.index({ "tasks.taskType": 1 });
CommunityGoalSchema.index({ "contributions.contributionType": 1 });
CommunityGoalSchema.index({ "contributions.verificationStatus": 1 });
CommunityGoalSchema.index({ "messages.createdAt": 1 }); // Add index for message sorting

// Create model from schema
const CommunityGoal =
  mongoose.models.CommunityGoal ||
  mongoose.model("CommunityGoal", CommunityGoalSchema);

export default CommunityGoal;
