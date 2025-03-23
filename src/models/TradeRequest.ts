import mongoose, { Schema, Document } from "mongoose";

// Define message interface for trade requests
interface Message {
  from: string; // userId of sender
  content: string;
  timestamp: Date;
}

// Define TradeRequest interface
export interface ITradeRequest extends Document {
  fromUserId: string;
  toUserId: string;
  fromListing: mongoose.Types.ObjectId | null; // Optional - if user selects one of their listings
  toListing: mongoose.Types.ObjectId; // Required - the listing they want to trade for
  status: "pending" | "accepted" | "rejected" | "completed" | "countered";
  createdAt: Date;
  updatedAt: Date;
  messages: Message[];
}

// Message schema
const MessageSchema = new Schema({
  from: { type: String, required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

// TradeRequest schema
const TradeRequestSchema = new Schema(
  {
    fromUserId: {
      type: String,
      required: true,
      index: true,
    },
    toUserId: {
      type: String,
      required: true,
      index: true,
    },
    fromListing: {
      type: Schema.Types.ObjectId,
      ref: "Listing",
      default: null,
    },
    toListing: {
      type: Schema.Types.ObjectId,
      ref: "Listing",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "completed", "countered"],
      default: "pending",
    },
    messages: [MessageSchema],
  },
  {
    timestamps: true,
  }
);

// Create indexes for common queries
TradeRequestSchema.index({ fromUserId: 1, status: 1 });
TradeRequestSchema.index({ toUserId: 1, status: 1 });
TradeRequestSchema.index({ fromListing: 1 });
TradeRequestSchema.index({ toListing: 1 });

// Check if model exists before creating
const TradeRequest =
  mongoose.models.TradeRequest ||
  mongoose.model<ITradeRequest>("TradeRequest", TradeRequestSchema);

export default TradeRequest;
