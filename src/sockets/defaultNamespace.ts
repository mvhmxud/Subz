import { DefaultEventsMap, Server } from "socket.io";

export const defaultNamespace = (
  io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>
) => {
  io.of("/default").on("connection", (socket) => {
    console.log("connected socket " + socket.id);
    socket.on("event", (data) => {
      console.log(data);
      socket.emit("event received", "event was recieved from backend");
    });
  });
};
