import { Request, Response } from "express";
import Chat from "../models/Chat";
import { HydratedDocument, Types } from "mongoose";
import User, { IUser } from "../models/User";
import Message from "../models/Message";

export const getDirectChatsOfAUser = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const user = req.user;
  const userDoc: HydratedDocument<IUser> | null = await User.findById(user._id);

  if (!userDoc) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const directChats = await Chat.find({
      chatType: "direct",
      members: userDoc._id,
    })
      .populate("members", "username name image isActive")
      .sort({ updatedAt: -1 });

    const formattedChats = await Promise.all(
      directChats.map(async (chat) => {
        const lastMessage = await Message.findOne({ chat: chat._id })
          .sort({ createdAt: -1 })
          .select("content sender createdAt")
          .populate("sender", "username name image");

        const otherMember = chat.members.find(
          (m: any) => m._id.toString() !== userDoc._id.toString()
        );

        return {
          _id: chat._id,
          chatType: chat.chatType,
          member: otherMember,
          lastMessage: lastMessage || null,
          updatedAt: chat.updatedAt,
          createdAt: chat.createdAt,
        };
      })
    );

    return res.status(200).json({ formattedChats });
  } catch (error) {
    console.error("Error getting direct chats:", error);
    return res.status(500).json({ message: "Failed to fetch direct chats" });
  }
};

export const getMessagesOfChat = async (req: Request, res: Response) => {
  const { chatId } = req.params;
  console.log("here");

  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const userDoc: HydratedDocument<IUser> | null = await User.findById(
    req.user._id
  );

  if (!Types.ObjectId.isValid(chatId)) {
    return res.status(400).json({ message: "Invalid chat ID" });
  }

  try {
    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    const isMember = chat.members.some(
      (memberId) => memberId.toString() === userDoc?._id.toString()
    );

    if (!isMember) {
      return res
        .status(403)
        .json({ message: "You are not a member of this chat" });
    }

    const messages = await Message.find({ chat: chatId })
      .populate("sender", "username name image isActive")
      .populate("reactions.users", "username")
      .sort({ createdAt: -1 })
      .limit(15);
    messages.reverse();

    let otherUserId = null;
    if (chat.chatType === "direct") {
      otherUserId = chat.members.find(
        (memberId) => memberId.toString() !== userDoc?._id.toString()
      );
    }

    let otherUser = null;
    if (otherUserId) {
      otherUser = await User.findById(
        otherUserId,
        "username name image isActive _id"
      );
    }

    // Format the response with chat info and messages
    return res.status(200).json({
      chatInfo: {
        _id: chat._id,
        user: otherUser,
      },
      messages,
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return res.status(500).json({ message: "Failed to fetch messages" });
  }
};

export const sendMessage = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const userDoc: HydratedDocument<IUser> | null = await User.findById(
    req.user._id
  );
  const { chatId, content } = req.body;

  if (!Types.ObjectId.isValid(chatId)) {
    return res.status(400).json({ message: "Invalid chat ID" });
  }

  try {
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    const isMember = chat.members.some(
      (memberId) => memberId.toString() === userDoc?._id.toString()
    );
    if (!isMember) {
      return res
        .status(403)
        .json({ message: "You are not a member of this chat" });
    }

    let attachments: { url: string; type: "image" | "video" }[] = [];

    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      attachments = (req.files as Express.Multer.File[]).map((file) => ({
        url: (file as any).path,
        type: file.mimetype.startsWith("video/") ? "video" : "image",
      }));

      const hasImage = attachments.some((a) => a.type === "image");
      const hasVideo = attachments.some((a) => a.type === "video");

      if (hasImage && hasVideo) {
        return res.status(400).json({
          message: "Cannot send both images and videos in the same message.",
        });
      }

      const videoCount = attachments.filter((a) => a.type === "video").length;
      if (videoCount > 1) {
        return res
          .status(400)
          .json({ message: "Cannot send more than one video at a time." });
      }
    }
    console.log("attachments is hereeeeeeeee =>", attachments);

    const newMessage = await Message.create({
      chat: chat._id,
      sender: req.user._id,
      content: content || "",
      attachments,
    });

    chat.messages.push(newMessage._id);
    chat.updatedAt = new Date();
    await chat.save();

    const populatedMessage = await newMessage.populate(
      "sender",
      "username name image"
    );

    return res
      .status(201)
      .json({ message: "Message sent", messageData: populatedMessage });
  } catch (error) {
    console.error("❌ Error sending message:", error);
    return res.status(500).json({ message: "Failed to send message" });
  }
};
export const reactToMessage = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { messageId, emoji } = req.body;

  if (!Types.ObjectId.isValid(messageId)) {
    return res.status(400).json({ message: "Invalid message ID" });
  }
  const userDoc: HydratedDocument<IUser> | null = await User.findById(
    req.user._id
  );
  try {
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    const userId = userDoc?._id.toString();
    const reactions = message.reactions;

    let alreadyReactedWithSameEmoji = false;

    message.reactions = reactions.reduce((acc, r) => {
      const filteredUsers = r.users.filter((u) => u._id.toString() !== userId);

      if (
        r.emoji === emoji &&
        r.users.some((u) => u._id.toString() === userId)
      ) {
        alreadyReactedWithSameEmoji = true;
      }

      if (filteredUsers.length > 0) {
        acc.push({
          emoji: r.emoji,
          users: filteredUsers,
        });
      }

      return acc;
    }, []);

    if (!alreadyReactedWithSameEmoji) {
      const existing = message.reactions.find((r) => r.emoji === emoji);
      if (existing) {
        existing.users.push(req.user._id);
      } else {
        message.reactions.push({
          emoji,
          users: [req.user._id],
        });
      }
    }

    await message.save();

    const populated = await Message.populate(message, [
      {
        path: "reactions.users",
        select: "username image name _id",
      },
      {
        path: "sender",
        select: "username image name _id isActive",
      },
    ]);

    return res
      .status(200)
      .json({ message: "Reaction updated", data: populated });
  } catch (error) {
    console.error("❌ Error reacting to message:", error);
    return res.status(500).json({ message: "Failed to react to message" });
  }
};
