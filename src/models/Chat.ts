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
      default: null,
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // when creating a group chat, Provide the creator id
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    messages: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message",
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: Date,
    isPrivate: {
      type: Boolean,
      default: false,
    },
    subChats: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Chat",
      },
    ],
    // Explicit field to determine if it's a direct chat or group chat
    chatType: {
      type: String,
      enum: ["direct", "group"],
      required: true,
    },
  },
  { timestamps: true }
);

ChatSchema.index({ chatType: 1 });
ChatSchema.index({ members: 1 });
ChatSchema.index({ creator: 1 });


export default mongoose.models.Chat || mongoose.model("Chat", ChatSchema);
