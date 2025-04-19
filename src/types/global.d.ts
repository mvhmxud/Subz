// global.d.ts
import { Server as SocketIOServer } from "socket.io";

declare global {
  namespace NodeJS {
    interface Global {
      io: SocketIOServer;
    }
  }

  var io: SocketIOServer; // Optional: For direct access without `global.`
}

export {};
