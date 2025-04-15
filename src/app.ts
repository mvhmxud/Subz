import express from "express";
import { errorHandler } from "./middlewares/error-handler";
import cookieParser from 'cookie-parser';
import authRoutes from './routes/authRoutes';
import { AuthMiddleware } from './middlewares/auth';
import cors from 'cors';

const app = express();

// Middleware to parse JSON request bodies
app.use(express.json());
app.use(cookieParser());
// all origins are allowed 
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));

app.use('/api/auth', authRoutes);

app.use(errorHandler);

app.get("/testAuth", AuthMiddleware, (req, res) => {
  res.json({ message: "Hello World 🙋‍♂️" });
});

export default app;
