"use client";

import React, { useState, useEffect, useRef, use } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { useSocket } from "@/contexts/SocketContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { uploadFile } from "@/lib/uploadUtils";
import {
  RiArrowLeftLine,
  RiSendPlaneFill,
  RiAttachment2,
  RiFile3Line,
  RiCloseLine,
  RiCheckDoubleLine,
  RiCheckLine,
  RiExternalLinkLine,
  RiErrorWarningLine,
} from "react-icons/ri";
import Image from "next/image";

// Define interfaces for the chat data
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
  messages: MessageItem[];
  tradeRequestId?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  otherParticipant: UserInfo;
}

const ChatPage = ({ params }: { params: Promise<{ chatId: string }> }) => {
  const { user, isLoaded } = useUser();
  const { socket, isConnected, joinChat, leaveChat } = useSocket();
  const router = useRouter();
  const { chatId } = use(params);

  const [chat, setChat] = useState<Chat | null>(null);
  const [messageText, setMessageText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState("");
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Add socket connection status display
  const [socketStatus, setSocketStatus] = useState<
    "connected" | "disconnected" | "connecting"
  >("connecting");

  // Update socket connection status when isConnected changes
  useEffect(() => {
    if (isConnected) {
      setSocketStatus("connected");
    } else if (socket) {
      setSocketStatus("connecting");
    } else {
      setSocketStatus("disconnected");
    }
  }, [isConnected, socket]);

  // Fetch chat data
  const fetchChat = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/messages?chatId=${chatId}`);

      if (!response.ok) {
        if (response.status === 404) {
          router.push("/dashboard/messages");
          return;
        }
        throw new Error("Failed to fetch chat");
      }

      const data = await response.json();
      setChat(data);
    } catch (error) {
      console.error("Error fetching chat:", error);
      setError("Failed to load chat. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  // Mark messages as read
  const markMessagesAsRead = async () => {
    if (!chat || !user) return;

    // Only mark messages as read if they're not from the current user
    const unreadMessages = chat.messages.filter(
      (msg) => !msg.read && msg.sender !== user.id
    );

    if (unreadMessages.length === 0) return;

    try {
      await fetch(`/api/messages/read/${chatId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  // Update handleSendMessage to handle socket connection state
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if ((!messageText.trim() && !file) || !user) return;

    try {
      let fileUrl = "";
      setUploadError(""); // Reset any previous upload errors

      // Handle file upload if there's a file
      if (file) {
        setIsUploading(true);
        setUploadProgress(0);

        let progressInterval: NodeJS.Timeout | null = null;

        try {
          // Use the uploadFile utility to upload to Cloudinary
          progressInterval = setInterval(() => {
            setUploadProgress((prev) => {
              const next = prev + Math.random() * 15;
              return next > 90 ? 90 : next;
            });
          }, 500);

          const { url } = await uploadFile(file);
          fileUrl = url;

          if (progressInterval) clearInterval(progressInterval);
          setUploadProgress(100);
        } catch (error) {
          if (progressInterval) clearInterval(progressInterval);
          const uploadError = error as Error;
          setUploadError(uploadError.message || "Failed to upload file");
          setIsUploading(false);
          return; // Stop the message sending process
        }

        setIsUploading(false);
      }

      const newMessage = {
        chatId,
        text: messageText.trim(),
        file: fileUrl,
      };

      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newMessage),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      // Emit socket event to notify the other user if socket is connected
      if (socket && isConnected) {
        const messageData = {
          chatId,
          message: {
            sender: user.id,
            text: messageText.trim(),
            file: fileUrl,
            read: false,
            createdAt: new Date().toISOString(),
          },
        };

        console.log("Emitting new_message event:", messageData);
        socket.emit("new_message", messageData);
      } else {
        console.warn("Socket not connected, message sent via API only");
      }

      // Reset form
      setMessageText("");
      setFile(null);
      setUploadProgress(0);

      // Refetch chat to see the new message
      fetchChat();
    } catch (error) {
      console.error("Error sending message:", error);
      setError("Failed to send message. Please try again.");
    }
  };

  // Handle file selection with validation
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(""); // Reset any previous errors

    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];

      // Validate file size (25MB max)
      const maxSize = 25 * 1024 * 1024; // 25MB
      if (selectedFile.size > maxSize) {
        setUploadError("File size exceeds 25MB limit");
        return;
      }

      // Validate file type
      const validTypes = [
        // Images
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "image/svg+xml",

        // Documents
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
        "application/msword", // .doc
        "text/plain",

        // Videos
        "video/mp4",
        "video/quicktime",
        "video/x-msvideo",
        "video/webm",
      ];

      if (!validTypes.includes(selectedFile.type)) {
        setUploadError(
          `File type ${selectedFile.type} is not supported. Supported formats include images, PDFs, Word documents, and videos.`
        );
        return;
      }

      // For videos, show a warning about upload time
      if (
        selectedFile.size > 5 * 1024 * 1024 &&
        selectedFile.type.startsWith("video/")
      ) {
        console.warn("Large video file selected. Upload may take some time.");
      }

      setFile(selectedFile);
    }
  };

  // Format the date to a readable format
  const formatDate = (dateString: Date | string) => {
    const date = new Date(dateString);
    return format(date, "h:mm a");
  };

  // Group messages by date
  const groupMessagesByDate = (messages: MessageItem[]) => {
    const groups: { [key: string]: MessageItem[] } = {};

    messages.forEach((message) => {
      const date = new Date(message.createdAt).toLocaleDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });

    return groups;
  };

  // Return the file type icon based on file extension
  const getFileIcon = (url: string) => {
    if (!url) return <RiFile3Line />;

    const extension = url.split(".").pop()?.toLowerCase();

    // Image files
    if (
      ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(extension || "")
    ) {
      return <RiFile3Line className="text-blue-500" />; // Use a specific icon for images
    }
    // PDF files
    else if (extension === "pdf") {
      return <RiFile3Line className="text-red-500" />; // Use a specific icon for PDFs
    }
    // Document files
    else if (["doc", "docx"].includes(extension || "")) {
      return <RiFile3Line className="text-indigo-500" />; // Use a specific icon for Word docs
    }
    // Video files
    else if (["mp4", "mov", "avi", "webm"].includes(extension || "")) {
      return <RiFile3Line className="text-green-500" />; // Use a specific icon for videos
    }
    // Default
    else {
      return <RiFile3Line className="text-gray-500" />; // Default file icon
    }
  };

  // Get file name from URL
  const getFileName = (url: string) => {
    if (!url) return "Attachment";

    // Extract file name from URL
    const parts = url.split("/");
    let fileName = parts[parts.length - 1];

    // Remove any query parameters
    fileName = fileName.split("?")[0];

    // Decode URI components
    try {
      fileName = decodeURIComponent(fileName);
    } catch {
      // If decoding fails, use the original
    }

    return fileName.length > 20 ? fileName.substring(0, 17) + "..." : fileName;
  };

  // Scroll to bottom of messages when new messages are added
  useEffect(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop =
        messageContainerRef.current.scrollHeight;
    }
  }, [chat?.messages]);

  // Update the join chat room effect to handle socket connection state
  useEffect(() => {
    if (chatId && socket && isConnected) {
      console.log(`Joining chat room: ${chatId}`);
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

      socket.on(`new_message_${chatId}`, handleNewMessage);

      return () => {
        console.log(`Leaving chat room: ${chatId}`);
        leaveChat(chatId);
        socket.off(`new_message_${chatId}`, handleNewMessage);
      };
    }
  }, [chatId, socket, isConnected, joinChat, leaveChat]);

  // Fetch chat data when component loads
  useEffect(() => {
    if (isLoaded && user) {
      fetchChat();
    }
  }, [isLoaded, user, chatId]);

  // Mark messages as read when the chat is viewed
  useEffect(() => {
    if (chat && user) {
      markMessagesAsRead();
    }
  }, [chat?.messages.length, user]);

  if (!isLoaded || (isLoading && !chat)) {
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

  if (!chat) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto flex flex-col items-center justify-center p-10">
          <p className="text-black/60 dark:text-white/60 mb-4">
            Chat not found
          </p>
          <Link
            href="/dashboard/messages"
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors flex items-center"
          >
            <RiArrowLeftLine className="mr-2" />
            Return to Messages
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const messageGroups = groupMessagesByDate(chat.messages);

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Chat Header */}
        <div className="bg-white dark:bg-black rounded-lg border border-black/[.08] dark:border-white/[.08] p-4 flex items-center justify-between">
          <div className="flex items-center">
            <Link
              href="/dashboard/messages"
              className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-black/[.02] dark:hover:bg-white/[.02] text-black/60 dark:text-white/60 mr-3"
            >
              <RiArrowLeftLine size={20} />
            </Link>

            <div className="flex items-center">
              {chat.otherParticipant?.profilePicture ? (
                <Image
                  src={chat.otherParticipant.profilePicture}
                  alt={chat.otherParticipant.name || "User"}
                  className="w-10 h-10 rounded-full object-cover"
                  width={40}
                  height={40}
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-black/[.02] dark:bg-white/[.02] flex items-center justify-center text-emerald-600 dark:text-emerald-500 font-semibold">
                  {chat.otherParticipant?.name?.[0] || "U"}
                </div>
              )}

              <div className="ml-3">
                <h2 className="font-medium">
                  {chat.otherParticipant?.name || "Unknown User"}
                </h2>
                <p className="text-xs text-black/60 dark:text-white/60">
                  Active now
                </p>
              </div>
            </div>
          </div>

          {chat.tradeRequestId && (
            <Link
              href={`/dashboard/trade-requests/${chat.tradeRequestId}`}
              className="px-3 py-1 rounded-lg border border-black/[.08] dark:border-white/[.08] hover:bg-black/[.02] dark:hover:bg-white/[.02] text-emerald-600 dark:text-emerald-500 text-sm flex items-center"
            >
              View Trade <RiExternalLinkLine className="ml-1" size={14} />
            </Link>
          )}

          <div className="ml-auto mr-3 flex items-center">
            <span
              className={`w-2 h-2 rounded-full mr-1 ${
                socketStatus === "connected"
                  ? "bg-emerald-500"
                  : socketStatus === "connecting"
                  ? "bg-yellow-500"
                  : "bg-red-500"
              }`}
            ></span>
            <span className="text-xs text-black/40 dark:text-white/40">
              {socketStatus === "connected"
                ? "Connected"
                : socketStatus === "connecting"
                ? "Connecting..."
                : "Disconnected"}
            </span>
          </div>
        </div>

        {/* Chat Messages */}
        <div
          ref={messageContainerRef}
          className="bg-white dark:bg-black rounded-lg border border-black/[.08] dark:border-white/[.08] overflow-y-auto p-4 space-y-6 h-[calc(70vh-180px)]"
        >
          {Object.entries(messageGroups).map(([date, messages]) => (
            <div key={date} className="space-y-4">
              <div className="text-center">
                <span className="inline-block px-3 py-1 bg-black/[.02] dark:bg-white/[.02] rounded-full text-xs text-black/60 dark:text-white/60">
                  {new Date(date).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                    year:
                      new Date(date).getFullYear() !== new Date().getFullYear()
                        ? "numeric"
                        : undefined,
                  })}
                </span>
              </div>

              {messages.map((message, index) => {
                const isCurrentUser = message.sender === user?.id;

                return (
                  <div
                    key={index}
                    className={`flex ${
                      isCurrentUser ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[75%] ${
                        isCurrentUser
                          ? "bg-emerald-600 text-white"
                          : "bg-black/[.02] dark:bg-white/[.02] text-black dark:text-white"
                      } rounded-lg p-3`}
                    >
                      {message.text}

                      {message.file && (
                        <div className="mt-2">
                          {/* Show video player for video files */}
                          {message.file.match(
                            /\.(mp4|webm|mov|avi)(\?.*)?$/i
                          ) ? (
                            <div className="relative">
                              <video
                                controls
                                className="w-full max-h-60 rounded-md object-contain bg-black/80"
                                poster={message.file.replace(
                                  /\.[^/.]+$/,
                                  ".jpg"
                                )}
                              >
                                <source src={message.file} />
                                Your browser does not support the video tag.
                              </video>
                              <a
                                href={message.file}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 text-xs flex items-center"
                                title="Open in new tab"
                              >
                                <RiExternalLinkLine size={14} />
                              </a>
                            </div>
                          ) : /* Show image preview for image files */
                          message.file.match(
                              /\.(jpe?g|png|gif|webp|svg)(\?.*)?$/i
                            ) ? (
                            <div className="relative">
                              <Image
                                src={message.file}
                                alt="Image attachment"
                                className="max-w-full max-h-80 rounded-md object-contain"
                                width={160}
                                height={160}
                              />
                              <a
                                href={message.file}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 text-xs flex items-center"
                                title="Open in new tab"
                              >
                                <RiExternalLinkLine size={14} />
                              </a>
                            </div>
                          ) : /* Show PDF viewer for PDF files */
                          message.file.match(/\.(pdf)(\?.*)?$/i) ? (
                            <div className="relative">
                              <div className="w-full h-60 bg-gray-100 dark:bg-gray-800 rounded-md overflow-hidden">
                                <iframe
                                  src={`https://docs.google.com/viewer?url=${encodeURIComponent(
                                    message.file
                                  )}&embedded=true`}
                                  className="w-full h-full border-0"
                                  title="PDF document"
                                ></iframe>
                              </div>
                              <a
                                href={message.file}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 text-xs flex items-center"
                                title="Download PDF"
                              >
                                <RiExternalLinkLine size={14} />
                              </a>
                            </div>
                          ) : (
                            /* For other file types, just show a link */
                            <a
                              href={message.file}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center text-sm underline"
                            >
                              {getFileIcon(message.file)}
                              <span className="ml-1">
                                {getFileName(message.file)}
                              </span>
                            </a>
                          )}
                        </div>
                      )}

                      <div className="text-xs mt-1 flex justify-end items-center space-x-1">
                        <span
                          className={
                            isCurrentUser
                              ? "text-white/70"
                              : "text-black/40 dark:text-white/40"
                          }
                        >
                          {formatDate(message.createdAt)}
                        </span>

                        {isCurrentUser &&
                          (message.read ? (
                            <RiCheckDoubleLine className="text-white/70" />
                          ) : (
                            <RiCheckLine className="text-white/70" />
                          ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          {chat.messages.length === 0 && (
            <div className="h-full flex items-center justify-center">
              <p className="text-black/40 dark:text-white/40 text-center">
                No messages yet. Send a message to start the conversation!
              </p>
            </div>
          )}
        </div>

        {/* Message Input */}
        <div className="bg-white dark:bg-black rounded-lg border border-black/[.08] dark:border-white/[.08] p-4">
          {uploadError && (
            <div className="mb-2 p-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg flex items-center">
              <RiErrorWarningLine className="mr-2 flex-shrink-0" />
              <span className="text-sm">{uploadError}</span>
            </div>
          )}

          {file && (
            <div className="mb-2 p-2 bg-black/[.02] dark:bg-white/[.02] rounded-lg flex justify-between items-center">
              <div className="flex items-center flex-1 max-w-full overflow-hidden">
                <RiFile3Line className="text-black/60 dark:text-white/60 mr-2 flex-shrink-0" />
                <span className="text-sm truncate">{file.name}</span>
              </div>
              <button
                onClick={() => setFile(null)}
                className="text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white ml-2 flex-shrink-0"
              >
                <RiCloseLine />
              </button>
            </div>
          )}

          {isUploading && (
            <div className="mb-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-black/60 dark:text-white/60">
                  Uploading file...
                </span>
                <span className="text-xs text-black/60 dark:text-white/60">
                  {Math.round(uploadProgress)}%
                </span>
              </div>
              <div className="w-full bg-black/[.02] dark:bg-white/[.02] rounded-full h-1.5">
                <div
                  className="bg-emerald-600 h-1.5 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          <form onSubmit={handleSendMessage} className="flex items-center">
            <div className="relative group">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  isUploading
                    ? "text-black/20 dark:text-white/20 cursor-not-allowed"
                    : "hover:bg-black/[.02] dark:hover:bg-white/[.02] text-black/60 dark:text-white/60"
                }`}
                title="Attach file"
              >
                <RiAttachment2 />
              </button>

              {/* Tooltip with supported file types */}
              <div className="absolute bottom-full left-0 mb-2 w-64 p-2 bg-white dark:bg-black rounded-lg shadow-lg border border-black/10 dark:border-white/10 text-xs opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity duration-200 z-10">
                <p className="font-medium mb-1">Supported file types:</p>
                <ul className="list-disc pl-4 space-y-1 text-black/70 dark:text-white/70">
                  <li>Images: JPG, PNG, GIF, WebP, SVG</li>
                  <li>Documents: PDF, DOC, DOCX, TXT</li>
                  <li>Videos: MP4, MOV, AVI, WebM</li>
                </ul>
                <p className="mt-1 text-black/50 dark:text-white/50">
                  Max size: 25MB
                </p>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              className="hidden"
              accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword,text/plain,video/mp4,video/quicktime,video/x-msvideo,video/webm"
              disabled={isUploading}
            />

            <input
              type="text"
              placeholder="Type a message..."
              className="flex-1 mx-2 px-4 py-3 rounded-lg border border-black/[.08] dark:border-white/[.08] bg-white dark:bg-black focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              disabled={isUploading}
            />

            <button
              type="submit"
              disabled={isUploading || (!messageText.trim() && !file)}
              className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                isUploading || (!messageText.trim() && !file)
                  ? "bg-emerald-500/50 cursor-not-allowed"
                  : "bg-emerald-600 hover:bg-emerald-700"
              } text-white`}
            >
              {isUploading ? (
                <div className="animate-spin h-5 w-5 border-2 border-white rounded-full border-t-transparent"></div>
              ) : (
                <RiSendPlaneFill />
              )}
            </button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ChatPage;
