import { createServer, IncomingMessage, ServerResponse } from "http";
import { parse } from "url";
import next from "next";
import { Server as SocketIOServer, Socket } from "socket.io";

interface MessagePayload {
  tradeRequestId: string;
  sender: string;
  content: string;
  _id: string;
  createdAt: string;
  updatedAt: string;
  isRead: boolean;
}

const dev: boolean = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  try {
    const server = createServer((req: IncomingMessage, res: ServerResponse) => {
      try {
        const parsedUrl = parse(req.url || "", true);
        handle(req, res, parsedUrl);
      } catch (err) {
        console.error("Error handling request:", err);
        res.statusCode = 500;
        res.end("Internal Server Error");
      }
    });

    // Initialize Socket.IO with the server
    const io = new SocketIOServer(server, {
      path: "/api/socket",
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true,
      },
      transports: ["websocket", "polling"],
      allowEIO3: true, // compatibility with older clients
    });

    io.on("connection", (socket: Socket) => {
      console.log("New client connected", socket.id);

      // Handle joining a chat room (trade request)
      socket.on("join-chat", (tradeRequestId: string) => {
        socket.join(tradeRequestId);
        console.log(`User ${socket.id} joined chat ${tradeRequestId}`);
      });

      // Handle leaving a chat room
      socket.on("leave-chat", (tradeRequestId: string) => {
        socket.leave(tradeRequestId);
        console.log(`User ${socket.id} left chat ${tradeRequestId}`);
      });

      // Handle sending messages
      socket.on("send_message", (message: MessagePayload) => {
        console.log(`Message sent in room ${message.tradeRequestId}:`, message);
        // Broadcast to everyone in the room except the sender
        socket.to(message.tradeRequestId).emit("new_message", message);
      });

      // Log any errors from this socket
      socket.on("error", (error: Error) => {
        console.error("Socket error:", error);
      });

      // Handle disconnection
      socket.on("disconnect", (reason: string) => {
        console.log(`Client disconnected: ${socket.id}, reason: ${reason}`);
      });
    });

    // Log socket.io errors
    if (io.engine) {
      io.engine.on("connection_error", (err: Error | unknown) => {
        console.error("Connection error:", err);
      });
    }

    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
      console.log(`> Ready on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Error setting up server:", err);
    process.exit(1);
  }
});
