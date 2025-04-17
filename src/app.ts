import express from "express";
import { errorHandler } from "./middlewares/error-handler";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/authRoutes";
import { AuthMiddleware } from "./middlewares/auth";
import cors from "cors";
import userRoutes from "./routes/userRoutes";
const app = express();

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
app.use(errorHandler);


export default app;
