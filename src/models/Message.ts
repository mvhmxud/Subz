import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
  },
  chat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Chat",
    required: true,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  readBy: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  attachments: [
    {
      type: {
        type: String,
        enum: ["image", "video"],
      },
      url: String,
    },
  ],
  isEdited: {
    type: Boolean,
    default: false,
  },
  // Optimized reactions structure
  reactions: [
    {
      emoji: String, // The emoji character or code
      users: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
    },
  ],
}, { timestamps: true });

MessageSchema.index({ chat: 1, createdAt: -1 });
MessageSchema.index({ sender: 1 });
MessageSchema.index({ "reactions.emoji": 1 }); 

export default mongoose.models.Message || mongoose.model("Message", MessageSchema);