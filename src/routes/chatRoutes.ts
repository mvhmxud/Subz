import express from "express";
const router = express.Router();
import {
  getDirectChatsOfAUser,
  getMessagesOfChat,
  sendMessage,
  reactToMessage,
} from "../controllers/chatController";
import { uploadMiddleware } from "../config/cloudinary";

router.get("/direct-chats", getDirectChatsOfAUser);
router.get("/:chatId/messages", getMessagesOfChat);
router.post(
  "/messages/send",
  uploadMiddleware.array("attachments", 4),
  sendMessage
);
router.put("/messages/react", reactToMessage);

export default router;
