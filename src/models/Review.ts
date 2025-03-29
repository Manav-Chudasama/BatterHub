import mongoose, { Document, Model, Schema } from "mongoose";

/**
 * Review Model Schema
 * Represents a review/feedback given by a user after a trade is completed
 */

// Define interfaces for type safety
export interface IReview extends Document {
  tradeRequestId: mongoose.Types.ObjectId; // Reference to the completed trade
  reviewerId: string; // Clerk user ID of reviewer
  reviewer: mongoose.Types.ObjectId; // Reference to our User model
  reviewedUserId: string; // Clerk user ID of user being reviewed
  reviewedUser: mongoose.Types.ObjectId; // Reference to our User model
  rating: number; // Rating from 1-5
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}

// Define interface for Review model with static methods
export interface IReviewModel extends Model<IReview> {
  findByTradeRequestId(tradeRequestId: string): Promise<IReview[]>;
  findByReviewerId(reviewerId: string): Promise<IReview[]>;
  findByReviewedUserId(reviewedUserId: string): Promise<IReview[]>;
}

// Define the schema
const ReviewSchema = new Schema<IReview, IReviewModel>(
  {
    tradeRequestId: {
      type: Schema.Types.ObjectId,
      ref: "TradeRequest",
      required: true,
    },
    reviewerId: {
      type: String,
      required: true,
    },
    reviewer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reviewedUserId: {
      type: String,
      required: true,
    },
    reviewedUser: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

// Create indexes for better query performance
ReviewSchema.index({ tradeRequestId: 1 });
ReviewSchema.index({ reviewerId: 1 });
ReviewSchema.index({ reviewedUserId: 1 });
ReviewSchema.index({ rating: 1 });
ReviewSchema.index({ createdAt: -1 });

// Add static methods
ReviewSchema.statics.findByTradeRequestId = function (
  tradeRequestId: string
): Promise<IReview[]> {
  return this.find({ tradeRequestId }).sort({ createdAt: -1 });
};

ReviewSchema.statics.findByReviewerId = function (
  reviewerId: string
): Promise<IReview[]> {
  return this.find({ reviewerId }).sort({ createdAt: -1 });
};

ReviewSchema.statics.findByReviewedUserId = function (
  reviewedUserId: string
): Promise<IReview[]> {
  return this.find({ reviewedUserId })
    .populate("reviewer", "name profilePicture")
    .sort({ createdAt: -1 });
};

// Create the model
let Review: IReviewModel;

// Check if mongoose.models.Review exists to prevent model compilation errors
if (mongoose.models && mongoose.models.Review) {
  Review = mongoose.models.Review as IReviewModel;
} else {
  Review = mongoose.model<IReview, IReviewModel>("Review", ReviewSchema);
}

export default Review;
