// Dashboard Stats
export interface DashboardStats {
  activeTradeRequests: number;
  completedTrades: number;
  reputationScore: number;
}

// Listing
export interface Listing {
  _id: string;
  title: string;
  description: string;
  category: string;
  images: string[];
  status: "active" | "inactive" | "traded" | "deleted";
  userId: string;
  user?: {
    name: string;
    profilePicture?: string;
    location?: {
      city?: string;
      state?: string;
      country?: string;
    };
  };
  createdAt: string;
  tradePreferences?: string;
  availability?: string[];
}

// Trade Request
export interface TradeRequest {
  _id: string;
  status: "pending" | "accepted" | "declined" | "completed";
  message: string;
  listing: string | Listing;
  createdAt: string;
  createdBy: string;
  createdByUser?: {
    name: string;
    profilePicture?: string;
  };
}

// Activity
export interface Activity {
  _id?: string;
  type: "trade_request" | "message" | "listing_view" | "trade" | "system";
  createdAt: string;
  message?: string; // For backward compatibility
  date?: string; // For backward compatibility
  user: {
    name: string;
    profilePicture?: string;
  };
  data: {
    message?: string;
    listingId?: string;
    listingTitle?: string;
    requestId?: string;
  };
  // Keeping these properties for backward compatibility
  action?: string;
  item?: string;
  itemId?: string;
  time?: string;
  status?: string;
}

// Proof of Contribution
export interface ProofOfContribution {
  fileType: "image" | "video" | "pdf";
  fileUrl: string;
  uploadedAt: string;
}

// Comment
export interface Comment {
  user: {
    _id: string;
    name: string;
    profilePicture?: string;
  };
  userId: string;
  comment: string;
  createdAt: string;
}

// Task
export interface Task {
  _id: string;
  taskName: string;
  taskType: "Skill" | "Item" | "Time";
  description?: string;
  quantityNeeded: number;
  quantityFulfilled: number;
  contributionPercentage: number;
  contributions?: string[]; // Array of contribution IDs associated with this task
}

// Contribution
export interface Contribution {
  user?: {
    _id: string;
    name: string;
    profilePicture?: string;
  };
  userId: string;
  contributionType: "Skill" | "Item" | "Time";
  taskId?: string;
  details: {
    // For skills
    skillType?: string;
    availability?: string;

    // For items
    itemName?: string;
    quantity?: number;
    itemDescription?: string;

    // For time
    hoursCommitted?: number;
    role?: string;
  };
  proofOfContribution?: ProofOfContribution[];
  verificationStatus: "Pending" | "Approved" | "Rejected";
  verifiedBy?: {
    _id: string;
    name: string;
  };
  verificationDate?: string;
  verificationNotes?: string;
  comments?: Comment[];
  percentage: number;
  createdAt: string;
}

// Community Goal
export interface CommunityGoal {
  _id: string;
  title: string;
  description: string;
  goalType: "Skill" | "Item";
  targetAmount: number;
  imageUrl?: string;
  category?: string;
  status: "Active" | "Completed" | "Cancelled";
  tasks?: Task[];
  contributions: Contribution[];
  totalProgress: number;
  location?: {
    city?: string;
    state?: string;
    country?: string;
  };
  createdBy?: {
    _id: string;
    name: string;
    profilePicture?: string;
  };
  createdAt: string;
  updatedAt?: string;
}

// Forum Message
export interface ForumMessage {
  _id: string;
  goalId: string;
  userId: string;
  user?: {
    _id: string;
    name?: string;
    profilePicture?: string;
  };
  message: string;
  createdAt: string;
}

// Socket Events
export interface ServerToClientEvents {
  noArg: () => void;
  basicEmit: (a: number, b: string, c: Buffer) => void;
  withAck: (d: string, callback: (e: number) => void) => void;
  new_message: (
    roomId: string,
    message: { text: string; sender: string; timestamp: string }
  ) => void;
  new_forum_message: (goalId: string, message: ForumMessage) => void;
}

export interface ClientToServerEvents {
  join_room: (roomId: string) => void;
  leave_room: (roomId: string) => void;
  send_message: (data: {
    roomId: string;
    message: { text: string; sender: string; timestamp: string };
  }) => void;
  join_forum: (goalId: string) => void;
  leave_forum: (goalId: string) => void;
  new_forum_message: (data: { goalId: string; message: ForumMessage }) => void;
}
