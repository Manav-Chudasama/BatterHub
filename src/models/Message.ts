import mongoose, { Schema, Document } from "mongoose";

export interface IMessageContent {
  sender: string;
  text: string;
  file?: string;
  read: boolean;
  createdAt: Date;
}

export interface IChat extends Document {
  participants: string[];
  lastMessage?: IMessageContent;
  messages: IMessageContent[];
  tradeRequestId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MessageContentSchema = new Schema<IMessageContent>(
  {
    sender: { type: String, required: true },
    text: { type: String, required: true },
    file: { type: String, required: false },
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ChatSchema = new Schema<IChat>(
  {
    participants: {
      type: [String],
      required: true,
      validate: [
        (arr: string[]) => arr.length === 2,
        "Chat must have exactly 2 participants",
      ],
    },
    lastMessage: { type: MessageContentSchema, required: false },
    messages: [MessageContentSchema],
    tradeRequestId: { type: String, required: false },
  },
  { timestamps: true }
);

// Create indexes for efficient queries
ChatSchema.index({ participants: 1 });
ChatSchema.index({ tradeRequestId: 1 });

// Check if the model is already registered to avoid overwriting
export default mongoose.models.Chat ||
  mongoose.model<IChat>("Chat", ChatSchema);
