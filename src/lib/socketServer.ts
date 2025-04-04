import { Server as NetServer } from "http";
import { Socket as NetSocket } from "net";
import { NextApiRequest } from "next";
import { Server as SocketIOServer } from "socket.io";

// Message structure that matches our MongoDB schema
interface MessageItem {
  sender: string;
  text: string;
  file?: string;
  read: boolean;
  createdAt: Date | string;
}

// Forum message structure
interface ForumMessage {
  _id?: string;
  goalId: string;
  userId: string;
  user?: {
    _id: string;
    name?: string;
    profilePicture?: string;
  };
  message: string;
  createdAt: Date | string;
}

export interface ServerToClientEvents {
  new_message_response: (chatId: string, message: MessageItem) => void;
  new_forum_message: (goalId: string, message: ForumMessage) => void;
  error: (errorMessage: string) => void;
  pong: () => void;
}

export interface ClientToServerEvents {
  join_chat: (chatId: string) => void;
  leave_chat: (chatId: string) => void;
  new_message: (data: { chatId: string; message: MessageItem }) => void;
  join_forum: (goalId: string) => void;
  leave_forum: (goalId: string) => void;
  new_forum_message: (data: { goalId: string; message: ForumMessage }) => void;
  ping: () => void;
}

export type NextApiResponseWithSocket = {
  socket: NetSocket & {
    server: NetServer & {
      io?: SocketIOServer<ClientToServerEvents, ServerToClientEvents>;
    };
  };
};

export function getSocketIO(
  req: NextApiRequest,
  res: NextApiResponseWithSocket
) {
  if (!res.socket.server.io) {
    console.log("Initializing Socket.IO server...");

    // Create a new Socket.IO server
    const io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(
      res.socket.server,
      {
        cors: {
          origin: "*",
          methods: ["GET", "POST"],
        },
        pingTimeout: 60000, // 60 seconds timeout
        pingInterval: 25000, // 25 seconds ping interval
      }
    );

    // Define socket event handlers
    io.on("connection", (socket) => {
      console.log("New client connected:", socket.id);

      // Handle joining a chat room
      socket.on("join_chat", (chatId) => {
        console.log(`Socket ${socket.id} joining chat: ${chatId}`);
        socket.join(chatId);
      });

      // Handle leaving a chat room
      socket.on("leave_chat", (chatId) => {
        console.log(`Socket ${socket.id} leaving chat: ${chatId}`);
        socket.leave(chatId);
      });

      // Handle new messages
      socket.on("new_message", (data) => {
        console.log(
          `New message in chat ${data.chatId} from socket ${socket.id}`
        );
        // Broadcast the message to all clients in the chat room
        io.to(data.chatId).emit(
          "new_message_response",
          data.chatId,
          data.message
        );
      });

      // Handle joining a forum room
      socket.on("join_forum", (goalId) => {
        const roomName = `forum:${goalId}`;
        console.log(`Socket ${socket.id} joining forum room: ${roomName}`);
        socket.join(roomName);

        // Log active rooms for this socket
        const rooms = Array.from(socket.rooms.values()).filter(
          (r) => r !== socket.id
        );
        console.log(`Socket ${socket.id} is now in rooms:`, rooms);
      });

      // Handle leaving a forum room
      socket.on("leave_forum", (goalId) => {
        const roomName = `forum:${goalId}`;
        console.log(`Socket ${socket.id} leaving forum room: ${roomName}`);
        socket.leave(roomName);
      });

      // Handle new forum messages
      socket.on("new_forum_message", (data) => {
        if (!data || !data.goalId || !data.message) {
          console.error("Invalid forum message data:", data);
          socket.emit("error", "Invalid message data");
          return;
        }

        const roomName = `forum:${data.goalId}`;
        console.log(
          `New forum message in room ${roomName} from socket ${socket.id}`
        );
        console.log("Message content:", data.message);

        // Log all rooms
        const rooms = io.sockets.adapter.rooms;
        console.log("Active rooms:", Array.from(rooms.keys()));

        // Check if room exists and has members
        if (rooms.has(roomName)) {
          const roomSize = rooms.get(roomName)?.size || 0;
          console.log(`Room ${roomName} has ${roomSize} members`);
        } else {
          console.warn(`Room ${roomName} doesn't exist or has no members`);
        }

        // Send to sender immediately for instant feedback
        socket.emit("new_forum_message", data.goalId, data.message);

        // Broadcast to all other clients in the forum room
        socket
          .to(roomName)
          .emit("new_forum_message", data.goalId, data.message);

        console.log(`Message broadcasted to room ${roomName}`);
      });

      // Handle ping (keep-alive)
      socket.on("ping", () => {
        socket.emit("pong");
      });

      // Handle disconnect
      socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
      });
    });

    // Save the IO server instance
    res.socket.server.io = io;
  } else {
    console.log("Socket.IO server already running");
  }

  return res.socket.server.io;
}
