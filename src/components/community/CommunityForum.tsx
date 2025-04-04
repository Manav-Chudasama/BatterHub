import { useState, useEffect, useRef, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useSocket } from "@/contexts/SocketContext";
import {
  RiSendPlaneLine,
  RiLoader4Line,
  RiUserLine,
  RiRefreshLine,
  RiWifiOffLine,
  RiWifiLine,
  RiMessage2Line,
  RiArrowDownSLine,
  RiEmotionHappyLine,
  RiChat3Line,
} from "react-icons/ri";

interface ForumMessage {
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

interface ForumProps {
  goalId: string;
}

export default function CommunityForum({ goalId }: ForumProps) {
  const { user } = useUser();
  const { socket, isConnected, joinForum, leaveForum } = useSocket();
  const [messages, setMessages] = useState<ForumMessage[]>([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const [lastActivity, setLastActivity] = useState<Date>(new Date());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketInitializedRef = useRef<boolean>(false);
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Fetch messages from the API
  const fetchMessages = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");

      console.log(`Fetching messages for goal: ${goalId}`);
      const response = await fetch(`/api/community-goals/${goalId}/forum`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Error response:", response.status, errorData);
        throw new Error(`Failed to fetch forum messages: ${response.status}`);
      }

      const data = await response.json();
      console.log(`Fetched ${data.messages?.length || 0} messages`);
      setMessages(data.messages || []);
      setLastActivity(new Date());
    } catch (err) {
      console.error("Error fetching forum messages:", err);
      setError("Failed to load discussion. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [goalId]);

  // Load initial messages
  useEffect(() => {
    if (goalId) {
      fetchMessages();
    }
  }, [goalId, fetchMessages]);

  // Handle incoming messages from socket
  const handleNewMessage = useCallback(
    (messageGoalId: string, newMessage: ForumMessage) => {
      console.log(
        "Received new message via socket:",
        messageGoalId,
        newMessage
      );

      if (messageGoalId === goalId) {
        // Add to messages if not already there
        setMessages((prevMessages) => {
          const exists = prevMessages.some((m) => m._id === newMessage._id);
          if (exists) return prevMessages;
          return [...prevMessages, newMessage];
        });

        // Update last activity time
        setLastActivity(new Date());

        // Force scroll to bottom
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    },
    [goalId]
  );

  // Socket connection for real-time updates
  useEffect(() => {
    // Clean up previous socket connections to avoid duplicates
    if (
      socket &&
      typeof socket.on === "function" &&
      typeof socket.off === "function"
    ) {
      socket.off("new_forum_message");

      // Join forum room
      joinForum(goalId);
      console.log(
        `Joined forum room for goal: ${goalId}, connection status: ${isConnected}`
      );

      // Set up listener for new messages
      socket.on("new_forum_message", handleNewMessage);
      socketInitializedRef.current = true;

      // Cleanup on unmount
      return () => {
        console.log("Cleaning up socket listeners");
        if (socket && typeof socket.off === "function") {
          socket.off("new_forum_message");
        }
        leaveForum(goalId);
      };
    }

    return () => {
      // Safety cleanup
      if (
        socketInitializedRef.current &&
        socket &&
        typeof socket.off === "function"
      ) {
        socket.off("new_forum_message");
        leaveForum(goalId);
        socketInitializedRef.current = false;
      }
    };
  }, [socket, goalId, joinForum, leaveForum, handleNewMessage, isConnected]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-refresh periodically if user is inactive
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      const now = new Date();
      const diffMinutes =
        (now.getTime() - lastActivity.getTime()) / (1000 * 60);

      // If it's been more than 2 minutes since last activity, refresh
      if (diffMinutes > 2) {
        console.log("Auto-refreshing messages due to inactivity");
        fetchMessages();
      }
    }, 60000); // Check every minute

    return () => clearInterval(refreshInterval);
  }, [lastActivity, fetchMessages]);

  // Show/hide scroll button based on scroll position
  useEffect(() => {
    const handleScroll = (e: Event) => {
      const container = e.target as HTMLDivElement;
      if (!container) return;

      // Show button if scrolled up more than 100px from bottom
      const isScrolledUp =
        container.scrollHeight - container.scrollTop - container.clientHeight >
        100;
      setShowScrollButton(isScrolledUp);
    };

    const messagesContainer = document.getElementById("messages-container");
    if (messagesContainer) {
      messagesContainer.addEventListener("scroll", handleScroll);
      return () =>
        messagesContainer.removeEventListener("scroll", handleScroll);
    }
  }, []);

  // Send message function
  const sendMessage = async () => {
    if (!message.trim() || !user || isSending) return;

    setIsSending(true);
    setError("");
    setLastActivity(new Date());

    try {
      console.log(`Sending message to goal ${goalId}: "${message}"`);

      const response = await fetch(`/api/community-goals/${goalId}/forum`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: message.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Error response:", response.status, errorData);
        throw new Error(`Failed to send message: ${response.status}`);
      }

      const data = await response.json();
      console.log("Message sent successfully:", data);

      // Add the message locally immediately for better user experience
      const newMessageData = data.forumMessage;
      if (
        newMessageData &&
        !messages.some((m) => m._id === newMessageData._id)
      ) {
        setMessages((prevMessages) => [...prevMessages, newMessageData]);
      }

      // Reset message input
      setMessage("");

      // Emit socket event for real-time updates
      if (socket && typeof socket.emit === "function" && data.forumMessage) {
        console.log("Emitting socket event:", data.forumMessage);
        socket.emit("new_forum_message", {
          goalId,
          message: data.forumMessage,
        });
      } else {
        console.warn(
          "Socket not available or message data missing, real-time updates disabled"
        );
      }

      // Force scroll to bottom
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (err: Error | unknown) {
      console.error("Error sending forum message:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      setError(`Failed to send message: ${errorMessage}`);
    } finally {
      setIsSending(false);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Format date function
  const formatMessageDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();

    // Same day format: "HH:MM AM/PM"
    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    // Different day format: "MM/DD/YYYY, HH:MM AM/PM"
    return date.toLocaleString([], {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setShowScrollButton(false);
  };

  // Group messages by date for better visual organization
  const groupMessagesByDate = () => {
    const groups: { date: string; messages: ForumMessage[] }[] = [];
    let currentDate = "";

    messages.forEach((msg) => {
      const messageDate = new Date(msg.createdAt).toLocaleDateString();

      if (messageDate !== currentDate) {
        currentDate = messageDate;
        groups.push({ date: messageDate, messages: [msg] });
      } else {
        groups[groups.length - 1].messages.push(msg);
      }
    });

    return groups;
  };

  const messageGroups = groupMessagesByDate();

  return (
    <div className="bg-white dark:bg-black rounded-lg shadow-lg p-4 mt-6 border border-gray-200 dark:border-gray-800 transition-all">
      <h2 className="text-xl font-semibold mb-4 flex items-center justify-between border-b pb-3 dark:border-gray-800">
        <div className="flex items-center">
          <RiChat3Line className="mr-2 text-green-600 dark:text-green-500" />
          <span className="text-black dark:text-white">Community Forum</span>
          {messages.length > 0 && (
            <span className="ml-2 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs font-medium px-2 py-0.5 rounded-full">
              {messages.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isConnected ? (
            <span
              className="flex items-center text-green-600 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-full text-xs"
              title="Real-time updates active"
            >
              <RiWifiLine className="mr-1" /> Live
            </span>
          ) : (
            <span
              className="flex items-center text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-full text-xs"
              title="No real-time updates"
            >
              <RiWifiOffLine className="mr-1" /> Offline
            </span>
          )}
          <button
            onClick={fetchMessages}
            className="p-1.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-500 hover:text-green-700 dark:hover:text-green-400 rounded-full transition-colors"
            title="Refresh messages"
          >
            <RiRefreshLine className="w-4 h-4" />
          </button>
        </div>
      </h2>

      {/* Messages container */}
      <div
        id="messages-container"
        className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-4 h-[450px] overflow-y-auto relative"
      >
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <RiLoader4Line className="animate-spin text-3xl text-green-600 dark:text-green-500 mb-2" />
            <span className="text-gray-600 dark:text-gray-400">
              Loading messages...
            </span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full text-red-500">
            <p className="mb-2">{error}</p>
            <button
              onClick={fetchMessages}
              className="flex items-center px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-500 rounded-full hover:bg-green-100 dark:hover:bg-green-800/30 transition-colors"
            >
              <RiRefreshLine className="mr-1" /> Retry
            </button>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <RiMessage2Line className="w-10 h-10 text-gray-300 dark:text-gray-700 mb-3" />
            <p>No messages yet. Be the first to start the discussion!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {messageGroups.map((group, groupIndex) => (
              <div key={groupIndex} className="message-group">
                {/* Date divider */}
                <div className="flex items-center justify-center mb-4">
                  <div className="h-px bg-gray-200 dark:bg-gray-800 flex-grow"></div>
                  <div className="px-3 py-1 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-full mx-2">
                    {new Date(group.date).toLocaleDateString(undefined, {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                  <div className="h-px bg-gray-200 dark:bg-gray-800 flex-grow"></div>
                </div>

                {/* Messages for this date */}
                <div className="space-y-3">
                  {group.messages.map((msg) => (
                    <div
                      key={msg._id}
                      className={`flex ${
                        msg.userId === user?.id
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] px-4 py-3 rounded-2xl shadow-sm ${
                          msg.userId === user?.id
                            ? "bg-green-600 text-white"
                            : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                        }`}
                      >
                        {/* Sender info */}
                        <div
                          className={`text-xs ${
                            msg.userId === user?.id
                              ? "text-green-100"
                              : "text-gray-600 dark:text-gray-400"
                          } mb-1 flex items-center ${
                            msg.userId === user?.id
                              ? "justify-end"
                              : "justify-start"
                          }`}
                        >
                          {msg.userId !== user?.id && (
                            <>
                              {msg.user?.profilePicture ? (
                                <img
                                  src={msg.user.profilePicture}
                                  alt={msg.user?.name || "User"}
                                  className="w-5 h-5 rounded-full mr-1.5 border border-gray-200 dark:border-gray-700"
                                />
                              ) : (
                                <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-1.5">
                                  <RiUserLine className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                                </div>
                              )}
                            </>
                          )}
                          <span className="font-medium">
                            {msg.userId === user?.id
                              ? "You"
                              : msg.user?.name || "Unknown User"}
                          </span>
                        </div>

                        {/* Message content */}
                        <p
                          className={`text-sm ${
                            msg.userId === user?.id
                              ? "text-white"
                              : "text-gray-800 dark:text-gray-200"
                          }`}
                        >
                          {msg.message}
                        </p>

                        {/* Timestamp */}
                        <div
                          className={`text-xs mt-1 flex justify-end ${
                            msg.userId === user?.id
                              ? "text-green-100"
                              : "text-gray-500 dark:text-gray-400"
                          }`}
                        >
                          {formatMessageDate(msg.createdAt)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Scroll to bottom button */}
        {showScrollButton && !isLoading && messages.length > 0 && (
          <button
            onClick={scrollToBottom}
            className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-green-600 text-white shadow-lg flex items-center justify-center animate-pulse hover:bg-green-700 transition-colors"
            title="Scroll to latest messages"
          >
            <RiArrowDownSLine className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Message input */}
      <div className="flex items-center mt-3 bg-gray-50 dark:bg-gray-900 rounded-lg p-2 border border-gray-200 dark:border-gray-800">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message..."
          className="flex-1 p-2.5 bg-transparent border-none focus:outline-none focus:ring-0 text-gray-700 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
          disabled={isLoading || isSending}
        />
        <button
          className="p-2 text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-500 transition-colors"
          title="Add emoji"
          type="button"
          onClick={() => {
            /* Emoji picker would go here */
          }}
        >
          <RiEmotionHappyLine className="w-5 h-5" />
        </button>
        <button
          onClick={sendMessage}
          disabled={!message.trim() || isLoading || isSending}
          className={`ml-1 p-2.5 rounded-lg flex items-center justify-center transition-all ${
            !message.trim() || isLoading || isSending
              ? "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
              : "bg-green-600 text-white hover:bg-green-700 hover:shadow-md"
          }`}
        >
          {isSending ? (
            <RiLoader4Line className="animate-spin w-5 h-5" />
          ) : (
            <RiSendPlaneLine className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  );
}
