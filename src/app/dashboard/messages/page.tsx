"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { RiSearchLine, RiAlertLine } from "react-icons/ri";
import Image from "next/image";
interface UserInfo {
  _id: string;
  name: string;
  profilePicture: string;
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

interface Chat {
  _id: string;
  participants: UserInfo[];
  offeredTrade: string;
  requestedTrade: string;
  messages: MessageItem[];
  createdAt: string;
  updatedAt: string;
}

export default function MessagesPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [chats, setChats] = useState<Chat[]>([]);

  useEffect(() => {
    if (isLoaded && user) {
      fetchChats();
    }
  }, [isLoaded, user]);

  const fetchChats = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/messages");

      if (!response.ok) {
        throw new Error("Failed to fetch chats");
      }

      const data = await response.json();
      setChats(data.chats || []);
    } catch (err) {
      console.error("Error fetching chats:", err);
      setError("Failed to load chats. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  // Filter chats based on search query (search in participant names)
  const filteredChats = chats.filter((chat) => {
    // Find the other participant (not the current user)
    const otherParticipant = chat.participants.find(
      (participant: UserInfo) => participant._id !== user?.id
    );

    return otherParticipant?.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
  });

  // Sort chats by last message time (most recent first)
  filteredChats.sort((a, b) => {
    const aTime =
      a.messages.length > 0
        ? new Date(a.messages[a.messages.length - 1].createdAt).getTime()
        : new Date(a.updatedAt).getTime();

    const bTime =
      b.messages.length > 0
        ? new Date(b.messages[b.messages.length - 1].createdAt).getTime()
        : new Date(b.updatedAt).getTime();

    return bTime - aTime;
  });

  // Redirect if not authenticated
  if (isLoaded && !user) {
    router.push("/");
    return null;
  }

  // Show loading state
  if (!isLoaded || (isLoading && chats.length === 0)) {
    return (
      <div className="max-w-7xl mx-auto space-y-8 animate-pulse">
        <div className="h-24 bg-black/[.02] dark:bg-white/[.02] rounded-lg" />
        <div className="h-12 bg-black/[.02] dark:bg-white/[.02] rounded-lg" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 bg-black/[.02] dark:bg-white/[.02] rounded-lg"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-black rounded-lg border border-black/[.08] dark:border-white/[.08] p-6">
        <h1 className="text-2xl font-bold">Messages</h1>
        <p className="text-black/60 dark:text-white/60">
          Chat with users about your trades
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <RiSearchLine className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black/60 dark:text-white/60" />
        <input
          type="text"
          placeholder="Search chats..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 rounded-lg border border-black/[.08] dark:border-white/[.08] bg-white dark:bg-black focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        />
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg flex items-center">
          <RiAlertLine className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      {/* No chats */}
      {filteredChats.length === 0 && !isLoading && (
        <div className="bg-white dark:bg-black rounded-lg border border-black/[.08] dark:border-white/[.08] p-6 text-center">
          <p className="text-black/60 dark:text-white/60">
            {searchQuery
              ? "No chats found matching your search."
              : "You don't have any active chats yet."}
          </p>
          <p className="text-black/60 dark:text-white/60 mt-2">
            Accept trade requests to start chatting.
          </p>
        </div>
      )}

      {/* Chat List */}
      <div className="space-y-4">
        {filteredChats.map((chat) => {
          // Find the other participant (not the current user)
          const otherParticipant: UserInfo = chat.participants.find(
            (participant: UserInfo) => participant._id !== user?.id
          ) || { _id: "", name: "Unknown User", profilePicture: "" };

          // Get last message
          const lastMessage =
            chat.messages.length > 0
              ? chat.messages[chat.messages.length - 1]
              : null;

          // Count unread messages
          const unreadCount = chat.messages.filter(
            (msg) => !msg.isRead && msg.sender !== user?.id
          ).length;

          return (
            <motion.div
              key={chat._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-black rounded-lg border border-black/[.08] dark:border-white/[.08] overflow-hidden"
            >
              <Link href={`/dashboard/messages/${chat._id}`}>
                <div className="p-4 flex items-center space-x-4 hover:bg-black/[.02] dark:hover:bg-white/[.02]">
                  {/* User avatar */}
                  <div className="w-12 h-12 rounded-full bg-black/[.02] dark:bg-white/[.02] flex-shrink-0 overflow-hidden">
                    <Image
                      src={
                        otherParticipant.profilePicture ||
                        "/placeholder-avatar.png"
                      }
                      alt={otherParticipant.name}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium truncate">
                        {otherParticipant.name}
                      </h3>
                      <span className="text-xs text-black/60 dark:text-white/60 whitespace-nowrap">
                        {lastMessage
                          ? new Date(lastMessage.createdAt).toLocaleDateString()
                          : new Date(chat.updatedAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-1">
                      {/* Last message preview */}
                      <p className="text-sm text-black/60 dark:text-white/60 truncate max-w-[80%]">
                        {lastMessage ? lastMessage.text : "No messages yet"}
                      </p>

                      {/* Unread indicator */}
                      {unreadCount > 0 && (
                        <span className="bg-emerald-600 text-white text-xs font-medium w-5 h-5 rounded-full flex items-center justify-center">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
