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

export interface ServerToClientEvents {
  new_message_response: (chatId: string, message: MessageItem) => void;
  error: (errorMessage: string) => void;
}

export interface ClientToServerEvents {
  join_chat: (chatId: string) => void;
  leave_chat: (chatId: string) => void;
  new_message: (data: { chatId: string; message: MessageItem }) => void;
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
      res.socket.server
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
