import { Server as NetServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { NextApiRequest } from "next";

export type NextApiResponseServerIO = NextApiResponse & {
  socket: Socket & {
    server: NetServer & {
      io: SocketIOServer;
    };
  };
};

import { NextApiResponse } from "next";
import { Socket } from "net";

// Socket.io server instance
let io: SocketIOServer;

export const initSocket = (server: any) => {
  if (!io) {
    console.log("Initializing Socket.IO server...");
    io = new SocketIOServer(server, {
      path: "/api/socket",
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });

    io.on("connection", (socket) => {
      console.log("Client connected:", socket.id);

      socket.on("join_chat", (chatId: string) => {
        console.log(`Client ${socket.id} joining chat:`, chatId);
        socket.join(chatId);
      });

      socket.on("leave_chat", (chatId: string) => {
        console.log(`Client ${socket.id} leaving chat:`, chatId);
        socket.leave(chatId);
      });

      socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
      });
    });
  }
  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io has not been initialized");
  }
  return io;
};
