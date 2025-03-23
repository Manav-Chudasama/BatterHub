import mongoose, { Document, Model, Schema } from "mongoose";

/**
 * User Model Schema
 * Represents a user in the BatterHub platform
 */

// Define interfaces for type safety
export interface INotification {
  _id: mongoose.Types.ObjectId;
  message: string;
  type: string;
  read: boolean;
  createdAt: Date;
  linkUrl?: string | null;
  itemId?: string | null;
}

export interface ILocation {
  type: string;
  coordinates: number[];
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

export interface IPreferences {
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  theme?: "light" | "dark" | "system";
  [key: string]: boolean | string | number | object | undefined;
}

export interface IUser extends Document {
  userId: string;
  name: string;
  email: string;
  password?: string;
  profilePicture?: string;
  bio?: string;
  location?: ILocation;
  reputationScore: number;
  tradeHistory: mongoose.Types.ObjectId[];
  savedListings: mongoose.Types.ObjectId[];
  notifications: INotification[];
  skills: string[];
  interests: string[];
  preferences: IPreferences;
  accountStatus: "active" | "suspended" | "inactive";
  lastActive?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Method declarations
  updateLastActive(): Promise<IUser>;
}

// Define interface for User model with static methods
export interface IUserModel extends Model<IUser> {
  findByUserId(userId: string): Promise<IUser | null>;
}

// Define the schema
const UserSchema = new Schema<IUser, IUserModel>(
  {
    userId: { type: String, required: true }, // Clerk user ID
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String }, // Optional since Clerk handles auth
    profilePicture: { type: String }, // URL from Clerk or Cloudinary
    bio: { type: String },
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
      postalCode: { type: String },
    }, // GeoJSON for location data
    reputationScore: { type: Number, default: 0 }, // Based on trade ratings
    tradeHistory: [{ type: Schema.Types.ObjectId, ref: "Trade" }], // Past trades
    savedListings: [{ type: Schema.Types.ObjectId, ref: "Listing" }], // Bookmarked items
    notifications: [
      {
        _id: {
          type: Schema.Types.ObjectId,
          default: () => new mongoose.Types.ObjectId(),
        },
        message: { type: String, required: true },
        type: { type: String, required: true },
        read: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now },
        linkUrl: { type: String, default: null },
        itemId: { type: String, default: null },
      },
    ],
    skills: [String], // Array of skills the user has
    interests: [String], // Array of skills/services the user is interested in
    preferences: {
      emailNotifications: { type: Boolean, default: true },
      pushNotifications: { type: Boolean, default: true },
      theme: {
        type: String,
        enum: ["light", "dark", "system"],
        default: "system",
      },
      // Additional preferences can be added dynamically
      type: Map,
      of: Schema.Types.Mixed,
    },
    accountStatus: {
      type: String,
      enum: ["active", "suspended", "inactive"],
      default: "active",
    },
    lastActive: { type: Date },
  },
  { timestamps: true }
);

// Create indexes for better query performance
UserSchema.index({ email: 1 });
UserSchema.index({ userId: 1 });
UserSchema.index({ "location.coordinates": "2dsphere" }); // Geospatial index for location-based queries
UserSchema.index({ skills: 1 });
UserSchema.index({ interests: 1 });
UserSchema.index({ accountStatus: 1 });

// Pre-save hook for any pre-save operations
UserSchema.pre("save", function (next) {
  this.lastActive = new Date();
  next();
});

// Add instance methods
UserSchema.methods.updateLastActive = function (this: IUser): Promise<IUser> {
  this.lastActive = new Date();
  return this.save();
};

// Add static methods
UserSchema.statics.findByUserId = function (
  userId: string
): Promise<IUser | null> {
  return this.findOne({ userId });
};

// Create the model
let User: IUserModel;

// Check if mongoose.models.User exists to prevent model compilation errors
if (mongoose.models && mongoose.models.User) {
  User = mongoose.models.User as IUserModel;
} else {
  User = mongoose.model<IUser, IUserModel>("User", UserSchema);
}

export default User;
