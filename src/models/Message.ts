import mongoose, { Schema, Document } from "mongoose";

export interface IMessage extends Document {
  participants: string[];
  offeredTrade: mongoose.Types.ObjectId;
  requestedTrade: mongoose.Types.ObjectId;
  messages: {
    sender: string;
    text: string;
    file?: string;
    createdAt: Date;
    isRead: boolean;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema(
  {
    participants: [{ type: String, ref: "User" }],
    offeredTrade: { type: mongoose.Schema.Types.ObjectId, ref: "TradeRequest" },
    requestedTrade: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TradeRequest",
    },
    messages: [
      {
        sender: { type: String, ref: "User" },
        text: { type: String },
        file: { type: String }, // Optional: File URL (e.g., images, PDFs)
        createdAt: { type: Date, default: Date.now },
        isRead: { type: Boolean, default: false },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Create indexes for common queries
MessageSchema.index({ participants: 1 });
MessageSchema.index({ offeredTrade: 1 });
MessageSchema.index({ requestedTrade: 1 });
MessageSchema.index({ createdAt: -1 });

export default mongoose.models.Message ||
  mongoose.model<IMessage>("Message", MessageSchema);
