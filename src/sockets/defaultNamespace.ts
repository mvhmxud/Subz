import { DefaultEventsMap, Server } from "socket.io";

interface DataInterface {
  chatId: string;
}

export const defaultNamespace = (
  io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>
) => {

  io.of("/default").on("connection", (socket) => {
    
    console.log("connected socket " + socket.id);
    socket.on("chat-join", (data: DataInterface) => {
      socket.join(data.chatId)
      socket.emit("chat-join", "joined");
      socket.on("message", (message : {mesasage : string} ) => {
        console.log(message)
        // database query to add message to the chat
       io.of('/default').to(data.chatId).emit("message", {message});
      });

      socket.on("disconnect", () => {
        console.log("disconnected socket " + socket.id);
        socket.leave(data.chatId);
      });
    });
  });
};



