"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Socket, io } from "socket.io-client";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  joinChat: (chatId: string) => void;
  leaveChat: (chatId: string) => void;
  joinForum: (goalId: string) => void;
  leaveForum: (goalId: string) => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  joinChat: () => {},
  leaveChat: () => {},
  joinForum: () => {},
  leaveForum: () => {},
});

export const useSocket = () => useContext(SocketContext);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const initSocket = async () => {
      try {
        // Create the socket connection with improved options
        const socketInstance = io({
          path: "/api/socket",
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          timeout: 20000,
          autoConnect: true,
          transports: ["websocket", "polling"],
        });

        socketInstance.on("connect", () => {
          console.log("Socket connected successfully:", socketInstance.id);
          setIsConnected(true);

          // Send ping every 30 seconds to keep connection alive
          const pingInterval = setInterval(() => {
            if (socketInstance.connected) {
              socketInstance.emit("ping");
            }
          }, 30000);

          // Clean up ping interval on disconnect
          socketInstance.on("disconnect", () => {
            clearInterval(pingInterval);
          });

          return () => {
            clearInterval(pingInterval);
          };
        });

        socketInstance.on("connect_error", (error) => {
          console.error("Socket connection error:", error);
          setIsConnected(false);
        });

        socketInstance.on("disconnect", (reason) => {
          console.log("Socket disconnected, reason:", reason);
          setIsConnected(false);

          // If the server initiated the disconnect, try to reconnect
          if (reason === "io server disconnect") {
            socketInstance.connect();
          }
        });

        socketInstance.on("reconnect", (attempt) => {
          console.log("Socket reconnected after", attempt, "attempts");
          setIsConnected(true);
        });

        socketInstance.on("reconnect_attempt", (attempt) => {
          console.log("Socket reconnection attempt:", attempt);
        });

        socketInstance.on("reconnect_error", (error) => {
          console.error("Socket reconnection error:", error);
        });

        socketInstance.on("reconnect_failed", () => {
          console.error("Socket reconnection failed");
        });

        socketInstance.on("pong", () => {
          console.debug("Pong received from server");
        });

        setSocket(socketInstance);

        return socketInstance;
      } catch (error) {
        console.error("Error initializing socket:", error);
        return null;
      }
    };

    const socketInstance = initSocket();

    // Cleanup function
    return () => {
      if (socketInstance) {
        // Use Promise.resolve to handle both Promise and non-Promise returns
        Promise.resolve(socketInstance).then((socket) => {
          if (socket) {
            socket.disconnect();
          }
        });
      }
    };
  }, []);

  const joinChat = (chatId: string) => {
    if (socket && isConnected) {
      console.log(`Joining chat: ${chatId}`);
      socket.emit("join_chat", chatId);
    } else {
      console.warn("Cannot join chat - socket not connected");
    }
  };

  const leaveChat = (chatId: string) => {
    if (socket && isConnected) {
      console.log(`Leaving chat: ${chatId}`);
      socket.emit("leave_chat", chatId);
    }
  };

  const joinForum = (goalId: string) => {
    if (socket && isConnected) {
      console.log(`Joining forum for goal: ${goalId}`);
      socket.emit("join_forum", goalId);
    } else {
      console.warn("Cannot join forum - socket not connected");
    }
  };

  const leaveForum = (goalId: string) => {
    if (socket && isConnected) {
      console.log(`Leaving forum for goal: ${goalId}`);
      socket.emit("leave_forum", goalId);
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        joinChat,
        leaveChat,
        joinForum,
        leaveForum,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}
