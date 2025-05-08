import mongoose from "mongoose";
const ChatSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: false, // for group chats only we need to provide a name
    },
    parentChatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      default: null, // null for non parent
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // when creating a group chat, Provide the creator id
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // for now it will be only two users
      },
    ],
    messages: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message", //
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: Date,
    subChats: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Chat",
      },
    ],
    chatType: {
      type: String,
      enum: ["direct", "group"],
      required: true, // Explicit field to determine if it's a direct chat or group chat
    },
  },
  { timestamps: true }
);

ChatSchema.index({ chatType: 1 });
ChatSchema.index({ members: 1 });
ChatSchema.index({ creator: 1 });

export default mongoose.models.Chat || mongoose.model("Chat", ChatSchema);
