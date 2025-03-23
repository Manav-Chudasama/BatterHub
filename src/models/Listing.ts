import mongoose, { Document, Model, Schema } from "mongoose";
import { IUser } from "./User";

/**
 * Listing Model Schema
 * Represents a skill/service listing in the BatterHub platform
 */

// Define the categories available for listings
export const LISTING_CATEGORIES = [
  "Academic Help",
  "Creative Skills",
  "Technology",
  "Language Learning",
  "Music & Arts",
  "Sports & Fitness",
  "Professional Skills",
  "Other",
] as const;

// Define availability options
export const AVAILABILITY_OPTIONS = [
  "Weekday Mornings",
  "Weekday Afternoons",
  "Weekday Evenings",
  "Weekend Mornings",
  "Weekend Afternoons",
  "Weekend Evenings",
  "Flexible",
] as const;

export type ListingCategory = (typeof LISTING_CATEGORIES)[number];
export type AvailabilityOption = (typeof AVAILABILITY_OPTIONS)[number];

// Define interfaces for type safety
export interface IListing extends Document {
  userId: string; // Reference to Clerk user ID
  user: mongoose.Types.ObjectId | IUser; // Reference to our User model
  title: string;
  description: string;
  category: ListingCategory;
  tradePreferences: string; // What the user wants in return
  images: string[]; // Array of image URLs
  availability: AvailabilityOption[]; // When the user is available for the trade
  status: "active" | "inactive" | "traded" | "deleted";
  location: {
    type: string;
    coordinates: number[];
    city?: string;
    state?: string;
    country?: string;
  };
  views: number; // Track listing popularity
  savedBy: mongoose.Types.ObjectId[]; // Users who saved this listing
  tradeRequests: mongoose.Types.ObjectId[]; // Incoming trade requests
  createdAt: Date;
  updatedAt: Date;
}

// Define interface for Listing model with static methods
export interface IListingModel extends Model<IListing> {
  findByUserId(userId: string): Promise<IListing[]>;
  findActive(): Promise<IListing[]>;
}

// Define the schema
const ListingSchema = new Schema<IListing, IListingModel>(
  {
    userId: { type: String, required: true }, // Clerk user ID
    user: { type: Schema.Types.ObjectId, ref: "User", required: true }, // Reference to our User model
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: {
      type: String,
      required: true,
      enum: LISTING_CATEGORIES,
    },
    tradePreferences: { type: String, required: true },
    images: [{ type: String }], // Array of image URLs (stored in S3, Cloudinary, etc.)
    availability: [
      {
        type: String,
        enum: AVAILABILITY_OPTIONS,
      },
    ],
    status: {
      type: String,
      enum: ["active", "inactive", "traded", "deleted"],
      default: "active",
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
      },
      city: { type: String },
      state: { type: String },
      country: { type: String },
    },
    views: { type: Number, default: 0 },
    savedBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
    tradeRequests: [{ type: Schema.Types.ObjectId, ref: "TradeRequest" }],
  },
  { timestamps: true }
);

// Create indexes for better query performance
ListingSchema.index({ userId: 1 });
ListingSchema.index({ title: "text", description: "text" }); // Text search
ListingSchema.index({ category: 1 });
ListingSchema.index({ "location.coordinates": "2dsphere" }); // Geospatial index
ListingSchema.index({ status: 1 });
ListingSchema.index({ createdAt: -1 }); // For sorting by most recent

// Add static methods
ListingSchema.statics.findByUserId = function (
  userId: string
): Promise<IListing[]> {
  return this.find({ userId }).sort({ createdAt: -1 });
};

ListingSchema.statics.findActive = function (): Promise<IListing[]> {
  return this.find({ status: "active" }).sort({ createdAt: -1 });
};

// Create the model
let Listing: IListingModel;

// Check if the model already exists to prevent recompilation in development
if (mongoose.models && mongoose.models.Listing) {
  Listing = mongoose.models.Listing as IListingModel;
} else {
  Listing = mongoose.model<IListing, IListingModel>("Listing", ListingSchema);
}

export default Listing;
