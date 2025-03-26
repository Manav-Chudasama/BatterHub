"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Socket, io } from "socket.io-client";

interface SocketContextType {
  socket: Socket | null;
  joinChat: (chatId: string) => void;
  leaveChat: (chatId: string) => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  joinChat: () => {},
  leaveChat: () => {},
});

export const useSocket = () => useContext(SocketContext);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    // Initialize socket connection
    const initSocket = async () => {
      try {
        // First, fetch the socket endpoint to initialize the server
        await fetch("/api/socket");

        // Then create the socket connection
        const newSocket = io({
          path: "/api/socket",
          transports: ["websocket"],
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
        });

        newSocket.on("connect", () => {
          console.log("Socket connected successfully");
          setSocket(newSocket);
        });

        newSocket.on("connect_error", (error) => {
          console.error("Socket connection error:", error);
        });

        newSocket.on("disconnect", () => {
          console.log("Socket disconnected");
        });

        return newSocket;
      } catch (error) {
        console.error("Error initializing socket:", error);
        return null;
      }
    };

    const socketInstance = initSocket();

    return () => {
      if (socketInstance) {
        socketInstance.then((socket) => {
          if (socket) {
            socket.close();
          }
        });
      }
    };
  }, []);

  const joinChat = (chatId: string) => {
    if (socket) {
      socket.emit("join_chat", chatId);
    }
  };

  const leaveChat = (chatId: string) => {
    if (socket) {
      socket.emit("leave_chat", chatId);
    }
  };

  return (
    <SocketContext.Provider value={{ socket, joinChat, leaveChat }}>
      {children}
    </SocketContext.Provider>
  );
}
