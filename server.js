import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = process.env.PORT || 3000;

// Create the Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  // Create the HTTP server
  const server = createServer(async (req, res) => {
    try {
      // Parse the URL
      const parsedUrl = parse(req.url, true);

      // Let Next.js handle the request
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("Internal Server Error");
    }
  });

  // Initialize Socket.IO server with proper configuration
  const io = new Server(server, {
    path: "/api/socket",
    addTrailingSlash: false,
    cors: {
      origin: "*",
      methods: ["GET", "POST", "OPTIONS"],
      credentials: true,
    },
    pingTimeout: 60000, // Increase timeout
    transports: ["websocket", "polling"], // Allow fallback to polling
  });

  // Socket.IO event handlers
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
      socket.to(data.chatId).emit(`new_message_${data.chatId}`, data.message);
    });

    // Handle disconnect
    socket.on("disconnect", (reason) => {
      console.log(`Client disconnected: ${socket.id}, reason: ${reason}`);
    });

    // Handle errors
    socket.on("error", (error) => {
      console.error(`Socket ${socket.id} error:`, error);
    });

    // Ping to keep connection alive
    socket.on("ping", () => {
      socket.emit("pong");
    });
  });

  // Start the server
  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> Socket.IO server running with path: /api/socket`);
  });
});
