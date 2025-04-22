import { server } from "./app";
import config from "./config/config";
import { db_connetion } from "./utils/db";

db_connetion(() => {
  server.listen(config.port, () => {
    console.log(`Server running on port ${config.port} 🚀`);
  });
});

