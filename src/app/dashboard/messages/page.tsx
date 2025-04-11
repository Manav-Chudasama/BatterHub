"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { motion } from "framer-motion";
import {
  RiSearchLine,
  RiChat3Line,
  RiMailCheckLine,
  RiArrowRightUpLine,
} from "react-icons/ri";
import Image from "next/image";

interface UserInfo {
  userId: string;
  name: string;
  profilePicture?: string;
}

interface MessageItem {
  sender: string;
  text: string;
  file?: string;
  read: boolean;
  createdAt: Date | string;
}

interface Chat {
  _id: string;
  participants: string[];
  lastMessage?: MessageItem;
  unreadCount: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  otherParticipant: UserInfo;
}

const MessagesPage = () => {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const startChatParam = searchParams.get("startChat");
  const participantId = searchParams.get("participantId");

  const [chats, setChats] = useState<Chat[]>([]);
  const [filteredChats, setFilteredChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [initiatingChat, setInitiatingChat] = useState(false);

  // Function to fetch chats
  const fetchChats = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/messages");
      if (!response.ok) {
        throw new Error("Failed to fetch chats");
      }

      const data = await response.json();
      console.log("data", data);
      setChats(data);
      setFilteredChats(data);
    } catch (error) {
      console.error("Error fetching chats:", error);
      setError("Failed to load chats. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  // Filter chats based on search query
  useEffect(() => {
    if (!chats.length) return;

    if (searchQuery.trim() === "") {
      setFilteredChats(chats);
      return;
    }

    const filtered = chats.filter((chat) =>
      chat.otherParticipant?.name
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase())
    );
    setFilteredChats(filtered);
  }, [searchQuery, chats]);

  // Fetch chats when component loads
  useEffect(() => {
    if (isLoaded && user) {
      fetchChats();
    }
  }, [isLoaded, user]);

  // Initiate chat if startChat parameter is present
  useEffect(() => {
    if (startChatParam === "true" && participantId && user && !initiatingChat) {
      initiateChat(participantId);
    }
  }, [startChatParam, participantId, user, initiatingChat]);
  console.log("filteredChats", filteredChats);

  // Function to initiate chat
  const initiateChat = async (participantId: string) => {
    if (!user) return;

    try {
      setInitiatingChat(true);

      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          participantId,
          text: "", // No initial message
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create chat");
      }

      const data = await response.json();
      router.push(`/dashboard/messages/${data.chatId}`);
    } catch (error) {
      console.error("Error creating chat:", error);
      setError("Failed to create chat. Please try again later.");
      setInitiatingChat(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: Date | string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffInDays === 0) {
      // Today, show time
      return date.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      });
    } else if (diffInDays === 1) {
      return "Yesterday";
    } else if (diffInDays < 7) {
      // This week, show day name
      return date.toLocaleDateString([], { weekday: "short" });
    } else {
      // Older, show date
      return date.toLocaleDateString([], {
        month: "short",
        day: "numeric",
      });
    }
  };

  if (!isLoaded || (isLoading && !chats.length)) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto space-y-8 animate-pulse">
          <div className="h-24 bg-black/[.02] dark:bg-white/[.02] rounded-lg" />
          <div className="h-[calc(70vh)] bg-black/[.02] dark:bg-white/[.02] rounded-lg" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto flex items-center justify-center p-10 text-red-600 dark:text-red-400">
          <p>{error}</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-black rounded-lg border border-black/[.08] dark:border-white/[.08] p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold">Messages</h1>

            <div className="flex items-center bg-black/[.02] dark:bg-white/[.02] rounded-lg px-3 py-2 w-64">
              <RiSearchLine className="text-black/40 dark:text-white/40 mr-2" />
              <input
                type="text"
                placeholder="Search conversations..."
                className="bg-transparent w-full focus:outline-none text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-4">
            <div className="bg-black/[.02] dark:bg-white/[.02] px-4 py-3 rounded-lg flex items-center">
              <RiChat3Line
                className="mr-2 text-emerald-600 dark:text-emerald-500"
                size={20}
              />
              <div>
                <p className="text-sm text-black/60 dark:text-white/60">
                  Total Chats
                </p>
                <p className="font-medium">{chats.length}</p>
              </div>
            </div>

            <div className="bg-black/[.02] dark:bg-white/[.02] px-4 py-3 rounded-lg flex items-center">
              <RiMailCheckLine
                className="mr-2 text-emerald-600 dark:text-emerald-500"
                size={20}
              />
              <div>
                <p className="text-sm text-black/60 dark:text-white/60">
                  Unread Messages
                </p>
                <p className="font-medium">
                  {chats.reduce(
                    (total, chat) => total + (chat.unreadCount || 0),
                    0
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Chat List */}
        <div className="bg-white dark:bg-black rounded-lg border border-black/[.08] dark:border-white/[.08] min-h-[400px]">
          {initiatingChat && (
            <div className="flex items-center justify-center h-16 border-b border-black/[.08] dark:border-white/[.08]">
              <div className="animate-spin h-5 w-5 border-2 border-emerald-600 dark:border-emerald-500 rounded-full border-t-transparent mr-2"></div>
              <p className="text-black/60 dark:text-white/60">
                Creating chat...
              </p>
            </div>
          )}

          {filteredChats.length === 0 && !initiatingChat && (
            <div className="flex flex-col items-center justify-center h-64">
              <RiChat3Line
                className="text-black/20 dark:text-white/20 mb-4"
                size={48}
              />
              <p className="text-black/60 dark:text-white/60 mb-2">
                No messages found
              </p>
              <p className="text-black/40 dark:text-white/40 text-sm text-center max-w-md">
                {searchQuery
                  ? "Try adjusting your search terms"
                  : "Your messages with other users will appear here"}
              </p>
            </div>
          )}

          {filteredChats.length > 0 && (
            <div className="divide-y divide-black/[.08] dark:divide-white/[.08]">
              {filteredChats.map((chat) => (
                <Link
                  href={`/dashboard/messages/${chat._id}`}
                  key={chat._id}
                  className="block hover:bg-black/[.02] dark:hover:bg-white/[.02] transition-colors"
                >
                  <motion.div
                    className="p-4 flex items-center"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="relative mr-3">
                      {chat.otherParticipant?.profilePicture ? (
                        <Image
                          src={chat.otherParticipant.profilePicture}
                          alt={chat.otherParticipant.name || "User"}
                          className="w-12 h-12 rounded-full object-cover"
                          width={48}
                          height={48}
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-black/[.02] dark:bg-white/[.02] flex items-center justify-center text-emerald-600 dark:text-emerald-500 font-semibold">
                          {chat.otherParticipant?.name?.[0] || "U"}
                        </div>
                      )}

                      {chat.unreadCount > 0 && (
                        <div className="absolute -top-1 -right-1 bg-emerald-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {chat.unreadCount > 9 ? "9+" : chat.unreadCount}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <h2 className="font-medium truncate">
                          {chat.otherParticipant?.name || "Unknown User"}
                        </h2>
                        <span className="text-xs text-black/40 dark:text-white/40 whitespace-nowrap ml-2">
                          {chat.lastMessage
                            ? formatDate(chat.lastMessage.createdAt)
                            : formatDate(chat.createdAt)}
                        </span>
                      </div>

                      <div className="flex items-center">
                        <p
                          className={`text-sm truncate ${
                            chat.unreadCount > 0
                              ? "font-medium text-black dark:text-white"
                              : "text-black/60 dark:text-white/60"
                          }`}
                        >
                          {chat.lastMessage?.text ||
                            (chat.lastMessage?.file
                              ? "Attachment"
                              : "No messages yet")}
                        </p>

                        {chat.unreadCount > 0 && (
                          <RiArrowRightUpLine
                            className="ml-1 text-emerald-600 dark:text-emerald-500"
                            size={16}
                          />
                        )}
                      </div>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MessagesPage;
