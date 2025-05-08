import express from "express";
import { errorHandler } from "./middlewares/error-handler";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/authRoutes";
import { AuthMiddleware } from "./middlewares/auth";
import cors from "cors";
import userRoutes from "./routes/userRoutes";
import chatRoutes from "./routes/chatRoutes";
import http from "http";
import { Server } from "socket.io";
import { defaultNamespace } from "./sockets/defaultNamespace";
const app = express();
export const server = http.createServer(app);

//socket-io server
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: "GET,POST,UPDATE,DELETE,OPTIONS,PATCH,PUT",
    preflightContinue: false,
  },
});

global.io = io;
defaultNamespace(io);
// Middleware to parse JSON request bodies
app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.use("/api/users", AuthMiddleware, userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/chats", AuthMiddleware, chatRoutes);
app.use(errorHandler);

export default app;
