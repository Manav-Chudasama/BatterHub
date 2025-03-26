"use client";

import { useState, useEffect, useRef, use } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  RiArrowLeftLine,
  RiAlertLine,
  RiSendPlaneFill,
  RiExchangeLine,
  RiAttachment2,
  RiImageLine,
} from "react-icons/ri";
import { useSocket } from "@/contexts/SocketContext";

interface UserInfo {
  _id: string;
  name: string;
  profilePicture?: string;
  location?: {
    city?: string;
    state?: string;
    country?: string;
  };
}

interface MessageItem {
  sender: string;
  text: string;
  file?: string;
  createdAt: string;
  isRead: boolean;
}

interface TradeInfo {
  _id: string;
  status: string;
  fromListing?: {
    _id: string;
    title: string;
    images: string[];
    [key: string]: unknown;
  };
  toListing?: {
    _id: string;
    title: string;
    images: string[];
    [key: string]: unknown;
  };
}

interface Chat {
  _id: string;
  participants: UserInfo[];
  offeredTrade: TradeInfo;
  requestedTrade: TradeInfo;
  messages: MessageItem[];
  createdAt: string;
  updatedAt: string;
}

export default function ChatPage({
  params,
}: {
  params: Promise<{ chatId: string }>;
}) {
  const { chatId } = use(params);
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const { socket, joinChat, leaveChat } = useSocket();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newMessage, setNewMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [chat, setChat] = useState<Chat | null>(null);
  const [otherUser, setOtherUser] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  // Fetch chat
  useEffect(() => {
    if (isLoaded && user) {
      fetchChat();
    }
  }, [isLoaded, user, chatId]);

  // Socket connection
  useEffect(() => {
    if (socket && chatId) {
      console.log("Setting up socket connection for chat:", chatId);

      // Join the chat room
      joinChat(chatId);

      // Listen for new messages
      const handleNewMessage = (message: MessageItem) => {
        console.log("Received new message:", message);
        setChat((currentChat) => {
          if (!currentChat) return null;

          // Ensure the message has createdAt property
          const messageWithTimestamp = {
            ...message,
            createdAt: message.createdAt || new Date().toISOString(),
          };

          return {
            ...currentChat,
            messages: [...currentChat.messages, messageWithTimestamp],
          };
        });
        markMessagesAsRead();
      };

      socket.on("new_message", handleNewMessage);

      // Handle socket errors
      const handleSocketError = (error: Error) => {
        console.error("Socket error in chat:", error);
        setError(
          "Connection error. Messages may not be delivered in real-time."
        );
      };

      socket.on("error", handleSocketError);

      // Clean up on unmount
      return () => {
        console.log("Cleaning up socket listeners");
        leaveChat(chatId);
        socket.off("new_message", handleNewMessage);
        socket.off("error", handleSocketError);
      };
    }
  }, [socket, chatId, joinChat, leaveChat]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [chat?.messages]);

  // Mark messages as read when component mounts and when new messages arrive
  useEffect(() => {
    if (chat && chat.messages.length > 0) {
      markMessagesAsRead();
    }
  }, [chat]);

  const fetchChat = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/messages?chatId=${chatId}`);

      if (!response.ok) {
        throw new Error("Failed to fetch chat");
      }

      const data = await response.json();

      if (!data.chats || data.chats.length === 0) {
        throw new Error("Chat not found");
      }

      const chatData = data.chats[0];
      setChat(chatData);

      // Determine other user
      const otherParticipant = chatData.participants.find(
        (participant: UserInfo) => participant._id !== user?.id
      );

      setOtherUser(otherParticipant || null);
    } catch (err) {
      console.error("Error fetching chat:", err);
      setError("Failed to load chat. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const markMessagesAsRead = async () => {
    try {
      await fetch(`/api/messages/${chatId}/read`, {
        method: "PUT",
      });
    } catch (err) {
      console.error("Error marking messages as read:", err);
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if ((!newMessage.trim() && !file) || isSending) return;

    setIsSending(true);

    try {
      // If file exists, upload it first
      let fileUrl = "";
      if (file) {
        // TODO: Implement file upload to your server or cloud storage service
        // For now, we'll just simulate it
        console.log("Would upload file:", file.name);
        fileUrl = "/placeholder-file.png"; // Placeholder
      }

      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chatId: chatId,
          text: newMessage,
          file: fileUrl,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send message");
      }

      const data = await response.json();
      console.log("nice",chat);
      // Update chat with new message
      if (chat) {
        setChat({
          ...chat,
          messages: [...chat.messages, data.chat.messages[data.chat.messages.length - 1]],
        });
      }

      // Clear the input and file
      setNewMessage("");
      setFile(null);

      // Emit socket event
      if (socket) {
        const connectedSocket = socket;
        if ("connected" in connectedSocket && connectedSocket.connected) {
          console.log("Emitting send_message event:", data.messageAdded);
          connectedSocket.emit("send_message", data.messageAdded);
        } else {
          console.warn(
            "Socket not connected, message won't be sent in real-time"
          );
        }
      } else {
        console.warn("No socket available, message won't be sent in real-time");
      }
    } catch (err) {
      console.error("Error sending message:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to send message. Please try again."
      );
    } finally {
      setIsSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Group messages by date
  console.log(chat?.messages);
  const groupedMessages =
    chat?.messages.reduce(
      (groups: { [key: string]: MessageItem[] }, message) => {
        console.log(message.text);
        const date = message.createdAt;
        if (!groups[date]) {
          groups[date] = [];
        }
        groups[date].push(message);
        return groups;
      },
      {}
    ) || {};

  // Determine if trade is active (can send messages)
  const isTradeActive =
    chat?.offeredTrade?.status === "accepted" ||
    chat?.requestedTrade?.status === "accepted" ||
    chat?.offeredTrade?.status === "countered" ||
    chat?.requestedTrade?.status === "countered";

  // Redirect if not authenticated
  if (isLoaded && !user) {
    router.push("/");
    return null;
  }

  // Show loading state
  if (!isLoaded || (isLoading && !chat)) {
    return (
      <div className="max-w-6xl mx-auto animate-pulse">
        <div className="h-16 bg-black/[.02] dark:bg-white/[.02] rounded-lg mb-4" />
        <div className="h-[calc(100vh-12rem)] bg-black/[.02] dark:bg-white/[.02] rounded-lg" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-black rounded-lg border border-black/[.08] dark:border-white/[.08] p-4 mb-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link
            href="/dashboard/messages"
            className="p-2 rounded-lg hover:bg-black/[.02] dark:hover:bg-white/[.02] text-black/60 dark:text-white/60"
          >
            <RiArrowLeftLine className="w-5 h-5" />
          </Link>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-black/[.02] dark:bg-white/[.02] overflow-hidden">
              <img
                src={otherUser?.profilePicture || "/placeholder-avatar.png"}
                alt={otherUser?.name || "User"}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h2 className="font-medium">{otherUser?.name || "User"}</h2>
              <div className="flex items-center text-xs text-black/60 dark:text-white/60">
                <span
                  className={`inline-block w-2 h-2 rounded-full mr-2 ${
                    chat?.offeredTrade?.status === "accepted" ||
                    chat?.requestedTrade?.status === "accepted"
                      ? "bg-emerald-500"
                      : chat?.offeredTrade?.status === "countered" ||
                        chat?.requestedTrade?.status === "countered"
                      ? "bg-purple-500"
                      : chat?.offeredTrade?.status === "completed" ||
                        chat?.requestedTrade?.status === "completed"
                      ? "bg-blue-500"
                      : "bg-yellow-500"
                  }`}
                ></span>
                <span>
                  {chat?.offeredTrade?.status === "accepted" ||
                  chat?.requestedTrade?.status === "accepted"
                    ? "Accepted"
                    : chat?.offeredTrade?.status === "countered" ||
                      chat?.requestedTrade?.status === "countered"
                    ? "Countered"
                    : chat?.offeredTrade?.status === "completed" ||
                      chat?.requestedTrade?.status === "completed"
                    ? "Completed"
                    : chat?.offeredTrade?.status === "rejected" ||
                      chat?.requestedTrade?.status === "rejected"
                    ? "Rejected"
                    : "Pending"}{" "}
                  Trade
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Link
            href={`/dashboard/trade-requests/${
              chat?.offeredTrade?._id || chat?.requestedTrade?._id
            }`}
            className="px-3 py-2 rounded-lg border border-black/[.08] dark:border-white/[.08] hover:bg-black/[.02] dark:hover:bg-white/[.02] text-black/60 dark:text-white/60 text-sm flex items-center"
          >
            <RiExchangeLine className="w-4 h-4 mr-2" />
            View Trade
          </Link>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 bg-white dark:bg-black rounded-lg border border-black/[.08] dark:border-white/[.08] overflow-hidden flex flex-col">
        {/* Error */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 flex items-center mx-4 my-2 rounded-lg">
            <RiAlertLine className="w-5 h-5 mr-2 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {Object.keys(groupedMessages).length === 0 && (
            <div className="text-center py-8">
              <p className="text-black/60 dark:text-white/60">
                No messages yet. Start the conversation!
              </p>
            </div>
          )}

          {Object.entries(groupedMessages).map(([date, dateMessages]) => (
            <div key={date} className="space-y-4">
              <div className="flex justify-center">
                <span className="text-xs bg-black/[.04] dark:bg-white/[.04] text-black/60 dark:text-white/60 px-3 py-1 rounded-full">
                  {date === new Date().toLocaleDateString() ? "Today" : date}
                </span>
              </div>

              {dateMessages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.sender === user?.id
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.sender === user?.id
                        ? "bg-emerald-500 text-white rounded-br-none"
                        : "bg-black/[.04] dark:bg-white/[.04] text-black dark:text-white rounded-bl-none"
                    }`}
                  >
                    {/* File attachment */}
                    {message.file && (
                      <div className="mb-2">
                        {message.file.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                          <img
                            src={message.file}
                            alt="Attached file"
                            className="max-h-40 rounded-md object-cover mb-2"
                          />
                        ) : (
                          <div className="flex items-center space-x-2 p-2 bg-black/10 dark:bg-white/10 rounded-md mb-2">
                            <RiAttachment2 className="w-5 h-5" />
                            <span className="text-sm truncate">Attachment</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Message text */}
                    <p className="break-words">{message.text}</p>

                    {/* Timestamp */}
                    <p
                      className={`text-xs mt-1 ${
                        message.sender === user?.id
                          ? "text-white/70"
                          : "text-black/60 dark:text-white/60"
                      }`}
                    >
                      {formatTime(message.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <form
          onSubmit={sendMessage}
          className="p-4 border-t border-black/[.08] dark:border-white/[.08]"
        >
          {file && (
            <div className="mb-2 p-2 bg-black/[.02] dark:bg-white/[.02] rounded-lg flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <RiImageLine className="w-5 h-5 text-black/60 dark:text-white/60" />
                <span className="text-sm truncate max-w-[200px]">
                  {file.name}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setFile(null)}
                className="text-red-500 hover:text-red-600"
              >
                ×
              </button>
            </div>
          )}

          <div className="flex space-x-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-4 py-3 rounded-lg border border-black/[.08] dark:border-white/[.08] bg-white dark:bg-black focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              disabled={!isTradeActive}
            />

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.txt"
            />

            <button
              type="button"
              onClick={handleFileSelect}
              className={`px-3 rounded-lg ${
                !isTradeActive
                  ? "bg-black/[.04] dark:bg-white/[.04] text-black/40 dark:text-white/40 cursor-not-allowed"
                  : "border border-black/[.08] dark:border-white/[.08] hover:bg-black/[.02] dark:hover:bg-white/[.02] text-black/60 dark:text-white/60"
              } flex items-center justify-center transition-colors`}
              disabled={!isTradeActive}
            >
              <RiAttachment2 className="w-5 h-5" />
            </button>

            <button
              type="submit"
              className={`px-4 rounded-lg ${
                (newMessage.trim() || file) && !isSending && isTradeActive
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "bg-black/[.04] dark:bg-white/[.04] text-black/40 dark:text-white/40 cursor-not-allowed"
              } flex items-center justify-center transition-colors`}
              disabled={
                (!newMessage.trim() && !file) || isSending || !isTradeActive
              }
            >
              <RiSendPlaneFill className="w-5 h-5" />
            </button>
          </div>

          {!isTradeActive && (
            <p className="text-xs text-black/60 dark:text-white/60 mt-2 text-center">
              {chat?.offeredTrade?.status === "rejected" ||
              chat?.requestedTrade?.status === "rejected"
                ? "This trade has been rejected. You cannot send new messages."
                : chat?.offeredTrade?.status === "completed" ||
                  chat?.requestedTrade?.status === "completed"
                ? "This trade has been completed. You cannot send new messages."
                : "This trade is inactive. Accept the trade request to start messaging."}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
