import { DefaultEventsMap, Server } from "socket.io";
import User from "../models/User"; 

interface DataInterface {
  chatId: string;
  userId?: string; 
}

interface StatusUpdateInterface {
  userId: string;
  isActive: boolean;
}
  
const activeUsers = new Map<string, string>();

async function notifyFriends(userId: string, isActive: boolean, io: Server) {
  try {
    const user = await User.findById(userId).populate("friends", "_id");
    
    if (!user) return;
    
    user.friends.forEach((friend: any) => {
      const friendId = friend._id.toString();
      
      const friendSocketId = activeUsers.get(friendId);
      
      if (friendSocketId) {
        io.of("/default").to(friendSocketId).emit("friend-status-update", {
          userId,
          isActive
        });
      }
    });
  } catch (error) {
    console.error("Error notifying friends:", error);
  }
}

async function updateUserActiveStatus(userId: string, isActive: boolean) {
  try {
    await User.findByIdAndUpdate(userId, {
      isActive,
      lastActive: isActive ? new Date() : new Date()
    });
  } catch (error) {
    console.error("Error updating user active status:", error);
  }
}

export const defaultNamespace = (
  io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>
) => {
  io.of("/default").on("connection", (socket) => {
    console.log("connected socket " + socket.id);
    let currentUserId: string | null = null;

    socket.on("user-connect", async (data: DataInterface) => {
      if (!data.userId) return;
      
      currentUserId = data.userId;
      
      activeUsers.set(data.userId, socket.id);
      
      await updateUserActiveStatus(data.userId, true);
      
      await notifyFriends(data.userId, true, io);
      
      try {
        const user = await User.findById(data.userId).populate("friends", "_id isActive lastActive");
        
        if (user) {
          const activeFriends = user.friends.map((friend: any) => ({
            userId: friend._id.toString(),
            isActive: friend.isActive,
            lastActive: friend.lastActive
          }));
          
          socket.emit("active-friends", activeFriends);
        }
      } catch (error) {
        console.error("Error fetching active friends:", error);
      }
    });

    socket.on("chat-join", (data: DataInterface) => {
      socket.join(data.chatId);
      socket.emit("chat-join", {
        message: "joined",
        chatId: data.chatId,
      });
      
      socket.on("message", (message) => {
        console.log(message);
        io.of("/default").to(data.chatId).emit("message", { message });
      });
    });

    socket.on("disconnect", async () => {
      console.log("disconnected socket " + socket.id);
      
      if (currentUserId) {
        activeUsers.delete(currentUserId);
        
        await updateUserActiveStatus(currentUserId, false);
        
        await notifyFriends(currentUserId, false, io);
      }
    });

    socket.on("update-status", async (data: StatusUpdateInterface) => {
      if (!data.userId) return;
      
      await updateUserActiveStatus(data.userId, data.isActive);
      await notifyFriends(data.userId, data.isActive, io);
    });
  });
};