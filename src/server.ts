import app from "./app";
import config from "./config/config";
import { db_connetion } from "./utils/db";


db_connetion(() => {
  app.listen(config.port, () => {
    console.log(`Server running on port ${config.port} 🚀`);
  });
});

